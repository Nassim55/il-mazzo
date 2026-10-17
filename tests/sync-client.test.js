// Sync, part 3: the app's sync step and Sync panel, with devices talking to the real
// Worker (and real SQLite) through a network that can be cut, raced or interrupted.
const { boot, ok, done } = require('./harness');
const path = require('path');
const { makeD1 } = require('./d1-fixture');

(async () => {
  const worker = (await import(path.join(__dirname, '..', 'worker', 'src', 'index.js'))).default;
  const env = { DB: makeD1() };
  const net = { online: true, calls: 0, statuses: [], beforePut: null };
  const device = storage => boot(storage, w => {
    w.confirm = () => true; w.alert = () => {};
    if (!w.crypto || !w.crypto.getRandomValues) Object.defineProperty(w, 'crypto', { value: require('crypto').webcrypto, configurable: true });
    w.fetch = async (url, opts = {}) => {
      net.calls++;
      if (!net.online) throw new TypeError('Failed to fetch');
      if (opts.method === 'PUT' && net.beforePut) { const f = net.beforePut; net.beforePut = null; await f(); }
      const res = await worker.fetch(new Request(url, { method: opts.method || 'GET', headers: { ...(opts.headers || {}), Origin: 'https://nassim55.github.io' }, body: opts.body }), env);
      net.statuses.push(res.status);
      return res;
    };
  });
  const settle = async dev => {
    for (let i = 0; i < 200 && dev.ev('syncState.busy'); i++) await new Promise(r => setTimeout(r, 5));
    dev.ev('clearTimeout(syncState.timer)');
  };
  const practise = (dev, word, seen, wrong = 0) => dev.ev(`(() => { const o = readStats('nouns', 'en-it'); const s = o[${JSON.stringify(word)}] || { seen: 0, wrong: 0 };
    localStorage.setItem('sostantivi-stats-v1', JSON.stringify({ ...o, [${JSON.stringify(word)}]: { seen: s.seen + ${seen}, wrong: s.wrong + ${wrong} } })); syncDirty = true; })()`);
  const seen = (dev, word) => (dev.ev("readStats('nouns', 'en-it')")[word] || {}).seen || 0;
  const serverSeen = word => { const r = env.DB.raw.prepare("SELECT value FROM items WHERE key = 'sostantivi-stats-v1'").get(); return r ? (JSON.parse(r.value)[word] || {}).seen || 0 : 0; };
  const line = dev => dev.d.getElementById('sync-line').textContent.replace(/\s+/g, ' ').trim();

  // ---- Off, then on ----
  const A = device({ 'sostantivi-stats-v1': JSON.stringify({ casa: { seen: 4, wrong: 1 } }), 'flipcards-subject': 'nouns' });
  ok(A.errors.length === 0 && A.warns.length === 0, 'loads cleanly');
  ok(/Sync is off/.test(line(A)) && net.calls === 0, 'the setup screen shows "Sync is off", and nothing is sent anywhere');
  A.d.getElementById('sync-open').click();
  ok(A.d.getElementById('sync-turn-on') && A.d.getElementById('sync-link'), 'the Sync panel offers Turn on sync and Link this device');
  ok(await A.ev('syncTurnOn()') === true, 'Turn on sync: done');
  const keyA = A.ev('syncKey()');
  ok(/^[A-Za-z0-9_-]{32}$/.test(keyA) && A.ev("syncState.status") === 'ok' && /Synced just now/.test(line(A)), 'a 32-character private key is made, and the status line says "Synced just now"');
  ok(serverSeen('casa') === 4, "this device's progress is on the server");
  ok(!JSON.stringify(A.ev('buildBackup()')).includes(keyA), 'the key never goes into backups');
  ok(A.d.getElementById('sync-key-text').textContent.startsWith('•') && (A.d.getElementById('sync-show-key').click(), A.d.getElementById('sync-key-text').textContent === keyA), 'the panel hides the key until you choose Show');

  // ---- Linking a second device (same backup, plus its own practice, plus an old reset) ----
  const B = device({ 'sostantivi-stats-v1': JSON.stringify({ casa: { seen: 4, wrong: 1 }, gatto: { seen: 2, wrong: 0 } }), 'mazzo-sync-meta-v1': JSON.stringify({ epochs: { 'sostantivi-stats-v1': 3 } }), 'flipcards-subject': 'nouns' });
  B.d.getElementById('sync-open').click();
  ok(await B.ev("syncLink('not a key')") === false && /doesn't look like a sync key/.test(B.d.getElementById('sync-msg').textContent), 'a mistyped key is caught before anything is sent');
  ok(await B.ev(`syncLink(${JSON.stringify('x'.repeat(32))})`) === false && /No synced progress found/.test(B.d.getElementById('sync-msg').textContent) && !B.ev('syncKey()'), 'a key with nothing behind it is refused, and not saved');
  ok(await B.ev(`syncLink(${JSON.stringify(keyA)})`) === true, 'linking with the real key works');
  ok(seen(B, 'casa') === 4 && seen(B, 'gatto') === 2 && serverSeen('gatto') === 2 && serverSeen('casa') === 4,
     "the shared backup isn't counted twice, the new device's own practice is kept, and an old reset made before linking doesn't wipe the other device's history");
  await A.ev('syncNow()');
  ok(seen(A, 'gatto') === 2, 'the first device picks it up at its next sync');

  // ---- Both devices practise, then sync at the same moment ----
  practise(A, 'casa', 3); practise(B, 'casa', 2); practise(B, 'cane', 1, 1);
  net.statuses = [];
  const both = await Promise.all([A.ev('syncNow()'), B.ev('syncNow()')]);
  await A.ev('syncNow()');
  ok(both.every(r => r === 'ok') && net.statuses.includes(409), 'syncing at the same instant: one device is told to merge again, and both succeed');
  ok(seen(A, 'casa') === 9 && seen(B, 'casa') === 9 && seen(A, 'cane') === 1 && serverSeen('casa') === 9, 'every answer from both devices is kept (casa 4 + 3 + 2 = 9)');

  // ---- Never mid-round ----
  const before = net.calls;
  A.d.getElementById('container').dataset.view = 'game';
  ok(await A.ev('syncNow()') === 'later' && net.calls === before, 'in the middle of a round, nothing syncs');
  A.d.getElementById('container').dataset.view = 'setup';
  A.ev('showSetup()');
  ok(A.ev('syncState.timer') !== null, 'back on the setup screen, a sync is on its way');
  await settle(A);

  // ---- An answer saved while a sync is in flight ----
  practise(A, 'casa', 1);
  net.beforePut = async () => practise(A, 'casa', 1);
  ok(await A.ev('syncNow()') === 'ok' && seen(A, 'casa') === 11 && serverSeen('casa') === 10 && A.ev('syncDirty') === true,
     'progress saved during a sync is kept here and flagged to send');
  await A.ev('syncNow()'); await B.ev('syncNow()');
  ok(serverSeen('casa') === 11 && seen(B, 'casa') === 11, '…and arrives at the next sync, counted once');

  // ---- Offline ----
  practise(A, 'casa', 1);
  net.online = false;
  ok(await A.ev('syncNow()') === 'offline' && /Offline/.test(line(A)) && seen(A, 'casa') === 12, "offline: the status line says so, and nothing here is lost");
  net.online = true;
  ok(await A.ev('syncNow()') === 'ok' && serverSeen('casa') === 12, 'back online, it catches up');

  // ---- Deleting, turning off, and syncing on open ----
  ok(await A.ev('syncDeleteData()') === true && !A.ev('syncKey()') && /Sync is off/.test(line(A)) && seen(A, 'casa') === 12 && env.DB.raw.prepare('SELECT COUNT(*) AS n FROM spaces').get().n === 0,
     'Delete synced data clears the server, turns sync off here, and keeps this device\'s progress');
  ok(await B.ev('syncNow()') === 'missing' && /not found/.test(line(B)), 'another device then explains that its synced progress is gone');
  B.ev('syncTurnOff()');
  ok(!B.ev('syncKey()') && seen(B, 'casa') === 11, 'turning sync off on a device keeps its progress');
  await A.ev('syncTurnOn()');
  const C = device({ 'mazzo-sync-meta-v1': JSON.stringify({ key: A.ev('syncKey()'), epochs: {} }), 'flipcards-subject': 'nouns' });
  await settle(C);
  ok(seen(C, 'casa') === 12 && /Synced/.test(line(C)), 'a linked device syncs as soon as it opens');
  done();
})().catch(e => { console.error(e); process.exit(1); });
