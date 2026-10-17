// A stand-in for Cloudflare D1 (which is SQLite): Node's built-in SQLite behind D1's
// interface, with the real migrations applied. hooks.beforeBatch runs once just before
// the next batch, to simulate another device saving at that instant.
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

function makeD1() {
  const db = new DatabaseSync(':memory:');
  const dir = path.join(__dirname, '..', 'worker', 'migrations');
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort()) db.exec(fs.readFileSync(path.join(dir, f), 'utf8'));
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
module.exports = { makeD1 };
