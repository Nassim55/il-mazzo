// Sync, part 3: automatic recording to the server. Devices talk to the real Worker
// (and real SQLite) through a network that can be cut, raced or interrupted; there is
// nothing to set up — every device uses the built-in key.
const { boot, ok, done } = require('./harness');
const path = require('path');
const { makeD1 } = require('./d1-fixture');

(async () => {
  const worker = (await import(path.join(__dirname, '..', 'worker', 'src', 'index.js'))).default;
  const env = { DB: makeD1() };
  const net = { online: true, calls: 0, statuses: [], beforePut: null, keys: new Set() };
  const call = (method, p, key) => worker.fetch(new Request(`https://il-mazzo-sync.il-mazzo.workers.dev${p}`, { method, headers: { Authorization: `Bearer ${key}` } }), env);
  const device = storage => boot(storage, w => {
    w.confirm = () => true; w.alert = () => {};
    w.fetch = async (url, opts = {}) => {
      net.calls++;
      if (!net.online) throw new TypeError('Failed to fetch');
      if (opts.method === 'PUT' && net.beforePut) { const f = net.beforePut; net.beforePut = null; await f(); }
      net.keys.add(((opts.headers || {}).Authorization || '').replace('Bearer ', ''));
      const res = await worker.fetch(new Request(url, { method: opts.method || 'GET', headers: { ...(opts.headers || {}), Origin: 'https://nassim55.github.io' }, body: opts.body }), env);
      net.statuses.push(res.status);
      return res;
    };
  });
  const settle = async dev => {
    for (let i = 0; i < 5; i++) await new Promise(r => setTimeout(r, 2));
    for (let i = 0; i < 300 && dev.ev('syncState.busy'); i++) await new Promise(r => setTimeout(r, 5));
    dev.ev('clearTimeout(syncState.timer)');
  };
  const practise = (dev, word, seen, wrong = 0) => dev.ev(`(() => { const o = readStats('nouns', 'en-it'); const s = o[${JSON.stringify(word)}] || { seen: 0, wrong: 0 };
    localStorage.setItem('sostantivi-stats-v1', JSON.stringify({ ...o, [${JSON.stringify(word)}]: { seen: s.seen + ${seen}, wrong: s.wrong + ${wrong} } })); syncDirty = true; })()`);
  const seen = (dev, word) => (dev.ev("readStats('nouns', 'en-it')")[word] || {}).seen || 0;
  const serverSeen = word => { const r = env.DB.raw.prepare("SELECT value FROM items WHERE key = 'sostantivi-stats-v1'").get(); return r ? (JSON.parse(r.value)[word] || {}).seen || 0 : 0; };
  const spaces = () => env.DB.raw.prepare('SELECT COUNT(*) AS n FROM spaces').get().n;
  // Sync is invisible: no element, class or wording about it anywhere on the page
  // (the page's visible text only — not the app's own script, whose comments mention it)
  const visibleText = dev => { const c = dev.d.body.cloneNode(true); c.querySelectorAll('script, style').forEach(e => e.remove()); return c.textContent; };
  const invisible = dev => !dev.d.querySelector('[id*="sync"], [class*="sync"]') && !/\b(sync|synced|syncing|offline)\b/i.test(visibleText(dev));

  // ---- The first device to open creates the server copy and records to it ----
  const A = device({ 'sostantivi-stats-v1': JSON.stringify({ casa: { seen: 4, wrong: 1 } }), 'flipcards-subject': 'nouns' });
  await settle(A);
  ok(A.errors.length === 0 && A.warns.length === 0, 'loads cleanly');
  ok(spaces() === 1 && serverSeen('casa') === 4 && A.ev('syncState.status') === 'ok',
     'on opening, with nothing set up, it creates the server copy and records this device\'s progress');
  ok(net.keys.size === 1 && net.keys.has(A.ev('SYNC_SHARED_KEY')) && /^[A-Za-z0-9_-]{32}$/.test(A.ev('SYNC_SHARED_KEY')), 'every request uses the one built-in key');
  ok(invisible(A), 'nothing about syncing appears anywhere on the page — no status, no settings');
  ok(!/mazzo-sync-/.test(JSON.stringify(A.ev('buildBackup()'))), 'backups leave the sync bookkeeping out');

  // ---- A second device: the same old backup, its own practice, and an old reset ----
  const B = device({ 'sostantivi-stats-v1': JSON.stringify({ casa: { seen: 4, wrong: 1 }, gatto: { seen: 2, wrong: 0 } }), 'mazzo-sync-meta-v1': JSON.stringify({ epochs: { 'sostantivi-stats-v1': 3 } }), 'flipcards-subject': 'nouns' });
  await settle(B);
  ok(seen(B, 'casa') === 4 && seen(B, 'gatto') === 2 && serverSeen('gatto') === 2 && serverSeen('casa') === 4 && spaces() === 1,
     "another device joins on opening: a shared backup isn't counted twice, its own practice is kept, and an old reset doesn't wipe anything");
  await A.ev('syncNow()');
  ok(seen(A, 'gatto') === 2, 'the first device picks that up at its next sync');

  // ---- Both practise, then sync at the same instant ----
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
  ok(await A.ev('syncNow()') === 'offline' && invisible(A) && seen(A, 'casa') === 12, 'offline: nothing is shown, and nothing here is lost');
  net.online = true;
  ok(await A.ev('syncNow()') === 'ok' && serverSeen('casa') === 12, 'back online, it catches up');

  // ---- A device that used the old per-device key moves over ----
  const OLD = 'old-Device-key_0123456789abcdefWXYZ';
  await call('POST', '/v1/space', OLD);
  ok(spaces() === 2, '(an old per-device key with its own server copy)');
  const D = device({ 'sostantivi-stats-v1': JSON.stringify({ sole: { seen: 3, wrong: 0 } }), 'mazzo-sync-meta-v1': JSON.stringify({ key: OLD, joined: true, epochs: { 'sostantivi-stats-v1': 2 }, lastSync: 1 }), 'flipcards-subject': 'nouns' });
  await settle(D);
  for (let i = 0; i < 10; i++) await new Promise(r => setTimeout(r, 5));
  ok(serverSeen('sole') === 3 && seen(D, 'casa') === 12 && !D.ev('syncMeta().key') && spaces() === 1,
     "it joins the built-in key with its progress merged in, and the old key's server copy is deleted");
  done();
})().catch(e => { console.error(e); process.exit(1); });
