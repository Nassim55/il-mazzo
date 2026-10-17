// Sync, part 3: the app signed in with Google, recording automatically. Devices talk
// to the real Worker (and real SQLite) through a network that can be cut, raced or
// interrupted; a stand-in Google signs the ID tokens the Worker checks.
const { boot, ok, done } = require('./harness');
const path = require('path');
const crypto = require('crypto');
const { makeD1 } = require('./d1-fixture');
const { makeGoogle, CLIENT_ID, ME } = require('./google-fixture');

(async () => {
  const google = await makeGoogle();
  google.install();
  const worker = (await import(path.join(__dirname, '..', 'worker', 'src', 'index.js'))).default;
  const env = { DB: makeD1(), GOOGLE_CLIENT_ID: CLIENT_ID, ALLOWED_EMAILS: ME };
  const raw = env.DB.raw;
  const net = { online: true, paths: [], statuses: [], beforePut: null };
  const device = storage => boot(storage, w => {
    w.confirm = () => true; w.alert = () => {};
    w.google = { accounts: { id: {   // stands in for Google's sign-in button
      initialize(cfg) { w.__gis = cfg; },
      renderButton(el) { el.innerHTML = '<button type="button" id="gis-button">Sign in with Google</button>'; },
      prompt() {}
    } } };
    w.fetch = async (url, opts = {}) => {
      if (!net.online) throw new TypeError('Failed to fetch');
      if (opts.method === 'PUT' && net.beforePut) { const f = net.beforePut; net.beforePut = null; await f(); }
      net.paths.push(`${opts.method || 'GET'} ${new URL(url).pathname}`);
      const target = net.target || { worker, env };
      const res = await target.worker.fetch(new Request(url, { method: opts.method || 'GET', headers: { ...(opts.headers || {}), Origin: 'https://nassim55.github.io' }, body: opts.body }), target.env);
      net.statuses.push(res.status);
      return res;
    };
  });
  const settle = async dev => {
    for (let i = 0; i < 8; i++) await new Promise(r => setTimeout(r, 2));
    for (let i = 0; i < 300 && dev.ev('syncState.busy'); i++) await new Promise(r => setTimeout(r, 5));
    dev.ev('clearTimeout(syncState.timer)');
  };
  const signIn = async (dev, claims = {}, opts = {}) => { const r = await dev.ev(`__gis.callback({ credential: ${JSON.stringify(await google.token(claims, opts))} })`); await settle(dev); return r; };
  const practise = (dev, word, seen, wrong = 0) => dev.ev(`(() => { const o = readStats('nouns', 'en-it'); const s = o[${JSON.stringify(word)}] || { seen: 0, wrong: 0 };
    localStorage.setItem('sostantivi-stats-v1', JSON.stringify({ ...o, [${JSON.stringify(word)}]: { seen: s.seen + ${seen}, wrong: s.wrong + ${wrong} } })); syncDirty = true; })()`);
  const seen = (dev, word) => (dev.ev("readStats('nouns', 'en-it')")[word] || {}).seen || 0;
  const serverSeen = word => { const r = raw.prepare("SELECT value FROM items WHERE key = 'sostantivi-stats-v1'").get(); return r ? (JSON.parse(r.value)[word] || {}).seen || 0 : 0; };
  const gate = dev => dev.d.getElementById('signin-gate');
  const gateMsg = dev => (dev.d.getElementById('signin-msg') || {}).textContent || '';
  const visibleText = dev => { const c = dev.d.body.cloneNode(true); c.querySelectorAll('script, style').forEach(e => e.remove()); return c.textContent; };
  const invisible = dev => !dev.d.querySelector('[id*="sync"], [class*="sync"]') && !/\b(sync|synced|syncing|offline)\b/i.test(visibleText(dev));

  // The old built-in key's copy on the server, from before sign-in existed
  const LEGACY = 'lRdadfl9fkeJDf3Jz5LUlmAhwmSFphz6';
  const legacyId = crypto.createHash('sha256').update(LEGACY).digest('hex');
  raw.prepare('INSERT INTO spaces (id, version, created_at, updated_at) VALUES (?, 7, 1, 1)').run(legacyId);
  raw.prepare('INSERT INTO items (space_id, key, value, epoch, updated_at) VALUES (?, ?, ?, 0, 1)').run(legacyId, 'sostantivi-stats-v1', JSON.stringify({ sole: { seen: 5, wrong: 0 } }));

  // ---- First visit on a device: the sign-in screen ----
  const A = device({ 'sostantivi-stats-v1': JSON.stringify({ casa: { seen: 4, wrong: 1 } }), 'flipcards-subject': 'nouns' });
  await settle(A);
  ok(A.errors.length === 0 && A.warns.length === 0, 'loads cleanly');
  ok(gate(A) && A.d.getElementById('gis-button') && A.ev('__gis.client_id') === CLIENT_ID, 'a device that has never signed in shows the sign-in screen, with Google\'s button for this app');
  ok(net.paths.length === 1 && net.paths[0] === 'GET /v1/config' && invisible(A), 'until then, no progress is sent anywhere, and nothing mentions syncing');

  // ---- Who gets in ----
  const S = device({ 'flipcards-subject': 'nouns' });
  await settle(S);
  ok(await signIn(S, { email: 'stranger@example.com', sub: '900000000000000000009' }) === false && gate(S) && /private/.test(gateMsg(S)) && !S.ev('syncKey()'), "someone else's Google account is turned away: \"This Il Mazzo is private\"");
  ok(await signIn(S, {}, { impostor: true }) === false && gate(S) && !S.ev('syncKey()'), 'a forged token is turned away too');
  ok(await signIn(A) === true && !gate(A) && /^[A-Za-z0-9_-]{43}$/.test(A.ev('syncKey()')), 'your Google account gets in, and the screen goes');
  ok(serverSeen('casa') === 4 && serverSeen('sole') === 5 && seen(A, 'sole') === 5 && !raw.prepare('SELECT 1 FROM spaces WHERE id = ?').get(legacyId),
     "the old built-in key's progress moves to your account, this device's progress merges in, and the old copy is deleted");
  ok(invisible(A) && A.ev('syncState.status') === 'ok', 'once signed in, recording is automatic and nothing about it is shown');
  ok(!JSON.stringify(A.ev('buildBackup()')).includes(A.ev('syncKey()')), 'the sign-in never goes into backups');

  // ---- A second device ----
  const B = device({ 'sostantivi-stats-v1': JSON.stringify({ casa: { seen: 4, wrong: 1 }, gatto: { seen: 2, wrong: 0 } }), 'mazzo-sync-meta-v1': JSON.stringify({ epochs: { 'sostantivi-stats-v1': 3 } }), 'flipcards-subject': 'nouns' });
  await settle(B);
  await signIn(B);
  ok(seen(B, 'casa') === 4 && seen(B, 'gatto') === 2 && seen(B, 'sole') === 5 && serverSeen('gatto') === 2 && serverSeen('casa') === 4,
     "signing in on another device merges it in: a shared backup isn't counted twice, and an old reset doesn't wipe anything");
  await A.ev('syncNow()');
  ok(seen(A, 'gatto') === 2, 'the first device picks that up at its next sync');

  // ---- Both practise, then sync at the same instant ----
  practise(A, 'casa', 3); practise(B, 'casa', 2); practise(B, 'cane', 1, 1);
  net.statuses = [];
  const both = await Promise.all([A.ev('syncNow()'), B.ev('syncNow()')]);
  await A.ev('syncNow()');
  ok(both.every(r => r === 'ok') && net.statuses.includes(409), 'syncing at the same instant: one device is told to merge again, and both succeed');
  ok(seen(A, 'casa') === 9 && seen(B, 'casa') === 9 && seen(A, 'cane') === 1 && serverSeen('casa') === 9, 'every answer from both devices is kept (casa 4 + 3 + 2 = 9)');

  // ---- Never mid-round; an answer saved mid-sync; offline ----
  const before = net.paths.length;
  A.d.getElementById('container').dataset.view = 'game';
  ok(await A.ev('syncNow()') === 'later' && net.paths.length === before, 'in the middle of a round, nothing syncs');
  A.d.getElementById('container').dataset.view = 'setup';
  A.ev('showSetup()');
  ok(A.ev('syncState.timer') !== null, 'back on the setup screen, a sync is on its way');
  await settle(A);
  practise(A, 'casa', 1);
  net.beforePut = async () => practise(A, 'casa', 1);
  ok(await A.ev('syncNow()') === 'ok' && seen(A, 'casa') === 11 && serverSeen('casa') === 10 && A.ev('syncDirty') === true, 'progress saved during a sync is kept here and flagged to send');
  await A.ev('syncNow()'); await B.ev('syncNow()');
  ok(serverSeen('casa') === 11 && seen(B, 'casa') === 11, '…and arrives at the next sync, counted once');
  practise(A, 'casa', 1);
  net.online = false;
  ok(await A.ev('syncNow()') === 'offline' && invisible(A) && seen(A, 'casa') === 12, 'offline: nothing is shown, and nothing here is lost');
  net.online = true;
  ok(await A.ev('syncNow()') === 'ok' && serverSeen('casa') === 12, 'back online, it catches up');

  // ---- Staying signed in, and being asked again ----
  const C = device({ 'mazzo-sync-meta-v1': JSON.stringify({ session: A.ev('syncKey()'), epochs: {} }), 'flipcards-subject': 'nouns' });
  await settle(C);
  ok(!gate(C) && seen(C, 'casa') === 12, 'a signed-in device stays signed in: no screen on opening, and its progress arrives');
  raw.prepare('DELETE FROM sessions WHERE token_hash = ?').run(crypto.createHash('sha256').update(B.ev('syncKey()')).digest('hex'));
  ok(await B.ev('syncNow()') === 'signed-out', '(a revoked session)');
  await settle(B);
  ok(gate(B) && /sign in again/.test(gateMsg(B)) && !B.ev('syncKey()') && seen(B, 'casa') === 11, 'if a session ends, the sign-in screen comes back, and nothing on the device is lost');
  net.online = false;
  const D = device({ 'flipcards-subject': 'nouns' });
  await settle(D);
  ok(!gate(D), 'opened offline without having signed in, the app just works');
  net.online = true;
  D.w.dispatchEvent(new D.w.Event('online'));
  await settle(D);
  ok(gate(D), '…and offers sign-in once it can reach the server');

  // ---- The changeover: while the live server predates sign-in, the old key keeps working ----
  const oldWorker = (await import(path.join(__dirname, 'fixtures', 'worker-v1.mjs'))).default;
  const envOld = { DB: makeD1() };
  const seenIn = (db, word) => { const r = db.raw.prepare("SELECT value FROM items WHERE key = 'sostantivi-stats-v1'").get(); return r ? (JSON.parse(r.value)[word] || {}).seen || 0 : 0; };
  net.target = { worker: oldWorker, env: envOld };
  const L = device({ 'sostantivi-stats-v1': JSON.stringify({ luna: { seen: 2, wrong: 0 } }), 'flipcards-subject': 'nouns' });
  await settle(L);
  ok(!gate(L) && L.ev('syncState.legacy') === true && seenIn(envOld.DB, 'luna') === 2 && invisible(L),
     'while the old server (before sign-in) is still live, the app keeps syncing as before, with no sign-in screen');
  practise(L, 'luna', 1);
  ok(await L.ev('syncNow()') === 'ok' && seenIn(envOld.DB, 'luna') === 3, '…and keeps recording');
  net.target = { worker, env: { DB: envOld.DB, GOOGLE_CLIENT_ID: CLIENT_ID, ALLOWED_EMAILS: ME } };   // the new server goes live
  ok(await L.ev('syncNow()') === 'signed-out', '(the server upgrades, on the same database)');
  await settle(L);
  ok(gate(L) && !L.ev('syncState.legacy'), 'once the new server is live, the old key stops working and the sign-in screen appears');
  await signIn(L);
  ok(!gate(L) && seenIn(envOld.DB, 'luna') === 3 && seen(L, 'luna') === 3 && envOld.DB.raw.prepare('SELECT COUNT(*) AS n FROM spaces').get().n === 1,
     'signing in brings that progress across to your account, and the old copy is gone');
  done();
})().catch(e => { console.error(e); process.exit(1); });
