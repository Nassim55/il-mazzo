// Sync, part 2: the Worker (worker/src/index.js) against real SQLite — D1 is SQLite —
// through a small adapter with D1's interface. Covers browser access, keys and hashing,
// the version check (including two saves at the same instant), validation, deleting,
// and two app instances syncing through it end to end.
const { boot, ok, done } = require('./harness');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

function makeD1() {
  const db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(path.join(__dirname, '..', 'worker', 'migrations', '0001_init.sql'), 'utf8'));
  const hooks = { beforeBatch: null };
  const stmt = (sql, params = []) => ({
    bind: (...p) => stmt(sql, p),
    first: async () => db.prepare(sql).get(...params) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...params) }),
    run: async () => ({ meta: { changes: Number(db.prepare(sql).run(...params).changes) } }),
    exec: () => ({ meta: { changes: Number(db.prepare(sql).run(...params).changes) } })
  });
  return {
    raw: db, hooks,
    prepare: sql => stmt(sql),
    batch: async list => {
      if (hooks.beforeBatch) { const f = hooks.beforeBatch; hooks.beforeBatch = null; f(db); }
      db.exec('BEGIN');
      try { const out = list.map(s => s.exec()); db.exec('COMMIT'); return out; }
      catch (e) { db.exec('ROLLBACK'); throw e; }
    }
  };
}

(async () => {
  const worker = (await import(path.join(__dirname, '..', 'worker', 'src', 'index.js'))).default;
  const env = { DB: makeD1() };
  const KEY = 'k3y-For-Testing_0123456789abcdefXYZ', OTHER = 'another-Key_9876543210fedcbaQWERTY';
  const ORIGIN = 'https://nassim55.github.io';
  const call = async (method, p, { key = KEY, body, origin = ORIGIN, headers = {} } = {}) => {
    const h = { Origin: origin, ...headers };
    if (key) h.Authorization = `Bearer ${key}`;
    if (body !== undefined) h['Content-Type'] = 'application/json';
    const res = await worker.fetch(new Request(`https://il-mazzo-sync.example.workers.dev${p}`, { method, headers: h, body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)) }), env);
    let data = null;
    try { data = await res.json(); } catch (e) { /* empty */ }
    return { status: res.status, data, headers: res.headers };
  };

  // ---- Browser access ----
  let r = await call('OPTIONS', '/v1/progress', { key: null });
  ok(r.status === 204 && r.headers.get('Access-Control-Allow-Origin') === ORIGIN && /Authorization/.test(r.headers.get('Access-Control-Allow-Headers')) && /PUT/.test(r.headers.get('Access-Control-Allow-Methods')),
     'the GitHub Pages site may call the API (preflight answered)');
  r = await call('OPTIONS', '/v1/progress', { key: null, origin: 'http://localhost:8080' });
  ok(r.headers.get('Access-Control-Allow-Origin') === 'http://localhost:8080', 'so may a local copy, for development');
  r = await call('OPTIONS', '/v1/progress', { key: null, origin: 'https://evil.example' });
  ok(!r.headers.get('Access-Control-Allow-Origin'), 'other websites may not');

  // ---- Keys ----
  ok((await call('GET', '/v1/progress', { key: null })).status === 401 && (await call('GET', '/v1/progress', { key: 'short' })).status === 401, 'no key, or a too-short one: refused');
  ok((await call('GET', '/v1/nothing')).status === 404, 'unknown paths: not found');
  r = await call('GET', '/v1/progress');
  ok(r.status === 404 && r.data.error === 'no-space', 'a key with nothing saved yet: "no-space", so linking a device with a mistyped key can be caught');
  r = await call('POST', '/v1/space');
  ok(r.status === 201 && r.data.version === 0, 'turning sync on creates the space');
  ok((await call('POST', '/v1/space')).status === 409, 'creating it twice is refused');
  const ids = env.DB.raw.prepare('SELECT id FROM spaces').all().map(x => x.id);
  ok(ids.length === 1 && /^[0-9a-f]{64}$/.test(ids[0]) && !JSON.stringify(env.DB.raw.prepare('SELECT * FROM spaces').all()).includes(KEY), 'only the key\'s SHA-256 hash is stored, never the key');

  // ---- Saving and fetching ----
  const items = { 'sostantivi-stats-v1': { v: { casa: { seen: 4, wrong: 1 } }, e: 0 }, 'frasi-stats-v1': { v: null, e: 1 } };
  r = await call('PUT', '/v1/progress', { body: { baseVersion: 0, items } });
  ok(r.status === 200 && r.data.version === 1, 'a save based on the current version is accepted, and the version goes up');
  r = await call('GET', '/v1/progress');
  ok(r.status === 200 && r.data.version === 1 && r.data.items['sostantivi-stats-v1'].v.casa.seen === 4 && r.data.items['frasi-stats-v1'].v === null && r.data.items['frasi-stats-v1'].e === 1,
     'fetching returns every store as saved: values, an emptied (reset) store, epochs');
  r = await call('PUT', '/v1/progress', { body: { baseVersion: 0, items: { 'sostantivi-stats-v1': { v: { casa: { seen: 99, wrong: 0 } }, e: 0 } } } });
  ok(r.status === 409 && r.data.version === 1 && (await call('GET', '/v1/progress')).data.items['sostantivi-stats-v1'].v.casa.seen === 4,
     'a save based on an out-of-date version is refused (409, with the current version) and changes nothing');
  env.DB.hooks.beforeBatch = db => db.prepare('UPDATE spaces SET version = version + 1').run();   // another device saves in between
  r = await call('PUT', '/v1/progress', { body: { baseVersion: 1, items: { 'sostantivi-stats-v1': { v: { casa: { seen: 77, wrong: 0 } }, e: 0 } } } });
  ok(r.status === 409 && r.data.version === 2 && (await call('GET', '/v1/progress')).data.items['sostantivi-stats-v1'].v.casa.seen === 4,
     'two saves at the same instant: the second one writes nothing and is told to merge again');
  r = await call('PUT', '/v1/progress', { body: { baseVersion: 2, items: { 'sostantivi-stats-v1': { v: { casa: { seen: 6, wrong: 1 } }, e: 0 } } } });
  ok(r.status === 200 && (await call('GET', '/v1/progress')).data.items['sostantivi-stats-v1'].v.casa.seen === 6 && (await call('GET', '/v1/progress')).data.items['frasi-stats-v1'].e === 1,
     'a save replaces only the stores it sends');

  // ---- Validation ----
  const bad = [{ baseVersion: 3, items: { 'Bad Key!': { v: {}, e: 0 } } }, { baseVersion: 3, items: { 'sostantivi-stats-v1': { v: [1, 2], e: 0 } } },
               { baseVersion: 3, items: { 'sostantivi-stats-v1': { v: {}, e: -1 } } }, { items: {} }, 'not json'];
  const statuses = [];
  for (const b of bad) statuses.push((await call('PUT', '/v1/progress', { body: b })).status);
  ok(statuses.every(s => s === 400), `malformed saves are refused (${statuses.join(', ')})`);
  ok((await call('PUT', '/v1/progress', { body: { baseVersion: 3, items: { x: { v: { s: 'a'.repeat(1_600_000) }, e: 0 } } } })).status === 413, 'oversized saves are refused');

  // ---- Separate keys, and deleting ----
  ok((await call('GET', '/v1/progress', { key: OTHER })).status === 404, "another key can't see this key's progress");
  r = await call('DELETE', '/v1/space');
  ok(r.status === 200 && (await call('GET', '/v1/progress')).status === 404 && env.DB.raw.prepare('SELECT COUNT(*) AS n FROM items').get().n === 0, 'deleting removes everything stored for the key');

  // ---- End to end: two app instances syncing through the Worker ----
  const quiet = w => { w.confirm = () => true; };
  const start = { 'sostantivi-stats-v1': JSON.stringify({ casa: { seen: 4, wrong: 1 } }), 'flipcards-subject': 'nouns' };
  const A = boot(start, quiet), B = boot(start, quiet);
  ok((await call('POST', '/v1/space')).status === 201, 'end to end: a fresh space');
  // What the app's sync step will do: fetch, merge, save based on the fetched version, retry on 409
  async function sync(dev) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const got = await call('GET', '/v1/progress');
      const merged = dev.ev(`syncMergeAll(syncReadJSON(SYNC_BASE_KEY, {}), syncLocalSnapshot(), ${JSON.stringify(got.data.items)})`);
      const changed = dev.ev(`syncChanges(${JSON.stringify(merged)}, ${JSON.stringify(got.data.items)})`);
      if (process.env.SYNC_DEBUG && Object.keys(changed).length) console.log('   sends:', Object.keys(changed).join(', '));
      const put = Object.keys(changed).length ? await call('PUT', '/v1/progress', { body: { baseVersion: got.data.version, items: changed } }) : { status: 200 };
      if (put.status === 409) continue;
      dev.ev(`syncApply(${JSON.stringify(merged)}); localStorage.setItem(SYNC_BASE_KEY, ${JSON.stringify(JSON.stringify(merged))})`);
      return put.status;
    }
    return 409;
  }
  const practise = (dev, word, n) => dev.ev(`(() => { const o = readStats('nouns', 'en-it'); const s = o[${JSON.stringify(word)}] || { seen: 0, wrong: 0 };
    localStorage.setItem('sostantivi-stats-v1', JSON.stringify({ ...o, [${JSON.stringify(word)}]: { seen: s.seen + ${n}, wrong: s.wrong } })); })()`);
  await sync(A); await sync(B);
  practise(A, 'casa', 3); practise(B, 'casa', 2); practise(B, 'gatto', 1);
  await sync(A); await sync(B); await sync(A);
  const sa = A.ev("readStats('nouns', 'en-it')"), sb = B.ev("readStats('nouns', 'en-it')");
  ok(sa.casa.seen === 9 && sb.casa.seen === 9 && sa.gatto.seen === 1 && sb.gatto.seen === 1, 'both devices end with every answer from both (casa 4 + 3 + 2 = 9)');
  // The redrawn setup screen gives newly arrived words their first review dates — real
  // new data, saved once; after that, syncing with nothing new must save nothing
  await sync(A); await sync(B);
  const v = (await call('GET', '/v1/progress')).data.version;
  await sync(A); await sync(B); await sync(A);
  ok((await call('GET', '/v1/progress')).data.version === v, 'once settled, syncing with nothing new saves nothing (no wasted writes)');
  ok(JSON.stringify(A.ev("loadSrs('nouns', 'en-it')")) !== '{}' && A.ev(`syncSame(loadSrs('nouns', 'en-it'), ${JSON.stringify(B.ev("loadSrs('nouns', 'en-it')"))})`), 'and both devices hold the same review schedule');
  done();
})().catch(e => { console.error(e); process.exit(1); });
