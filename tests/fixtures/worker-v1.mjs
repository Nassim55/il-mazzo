// Il Mazzo sync API — a Cloudflare Worker with a D1 database.
//
// The app does all the merging (see "Sync, part 1" in index.html); this server keeps
// the latest agreed copy of each progress store and a version number for the whole
// set. A save names the version it was based on, and is refused (409) if another
// device saved in between — that device then fetches, merges again and retries, so
// two devices saving at once can never overwrite each other's practice.
//
// Auth: a long random sync key made by the app, sent as "Authorization: Bearer <key>".
// Only its SHA-256 hash is stored; the key itself never is.
//
//   GET    /v1/progress   → { version, items: { key: { v, e } } }   (404 if no space)
//   POST   /v1/space      → create the space for this key            (409 if it exists)
//   PUT    /v1/progress   ← { baseVersion, items: { key: { v, e } } } → { version }
//   DELETE /v1/space      → delete everything stored for this key

const ALLOWED_ORIGINS = ['https://nassim55.github.io'];
const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const KEY_RE = /^[A-Za-z0-9_-]{24,128}$/;
const STORE_RE = /^[a-z0-9:_-]{1,80}$/;
const MAX_BODY = 1_500_000;   // bytes; all of a heavy user's progress is far smaller
const MAX_STORES = 200;

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  if (!ALLOWED_ORIGINS.includes(origin) && !LOCAL_ORIGIN.test(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
}
const json = (request, status, body) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders(request) }
});

async function spaceId(request) {
  const m = /^Bearer (.+)$/.exec(request.headers.get('Authorization') || '');
  if (!m || !KEY_RE.test(m[1])) return null;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(m[1]));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// A save's items: known-shaped keys, JSON values (or null), whole-number epochs
function validItems(items) {
  if (!items || typeof items !== 'object' || Array.isArray(items)) return null;
  const entries = Object.entries(items);
  if (entries.length > MAX_STORES) return null;
  const out = [];
  for (const [key, item] of entries) {
    if (!STORE_RE.test(key) || !item || typeof item !== 'object') return null;
    const e = item.e === undefined ? 0 : item.e;
    if (!Number.isInteger(e) || e < 0) return null;
    if (item.v !== null && (typeof item.v !== 'object' || Array.isArray(item.v))) return null;
    out.push([key, item.v === null ? null : JSON.stringify(item.v), e]);
  }
  return out;
}

async function handle(request, env) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
  const route = `${request.method} ${url.pathname}`;
  if (!['GET /v1/progress', 'POST /v1/space', 'PUT /v1/progress', 'DELETE /v1/space'].includes(route)) {
    return json(request, 404, { error: 'not-found' });
  }
  const id = await spaceId(request);
  if (!id) return json(request, 401, { error: 'bad-key' });
  const db = env.DB, now = Date.now();
  const space = await db.prepare('SELECT version FROM spaces WHERE id = ?').bind(id).first();

  if (route === 'POST /v1/space') {
    if (space) return json(request, 409, { error: 'exists', version: space.version });
    await db.prepare('INSERT INTO spaces (id, version, created_at, updated_at) VALUES (?, 0, ?, ?)').bind(id, now, now).run();
    return json(request, 201, { version: 0 });
  }
  if (!space) return json(request, 404, { error: 'no-space' });

  if (route === 'GET /v1/progress') {
    const { results } = await db.prepare('SELECT key, value, epoch FROM items WHERE space_id = ?').bind(id).all();
    const items = {};
    for (const r of results) items[r.key] = { v: r.value === null ? null : JSON.parse(r.value), e: r.epoch };
    return json(request, 200, { version: space.version, items });
  }

  if (route === 'DELETE /v1/space') {
    await db.batch([
      db.prepare('DELETE FROM items WHERE space_id = ?').bind(id),
      db.prepare('DELETE FROM spaces WHERE id = ?').bind(id)
    ]);
    return json(request, 200, { deleted: true });
  }

  // PUT /v1/progress
  const length = +(request.headers.get('Content-Length') || 0);
  if (length > MAX_BODY) return json(request, 413, { error: 'too-large' });
  const text = await request.text();
  if (text.length > MAX_BODY) return json(request, 413, { error: 'too-large' });
  let body = null;
  try { body = JSON.parse(text); } catch (e) { /* not JSON */ }
  const base = body && body.baseVersion;
  const items = body && validItems(body.items);
  if (!Number.isInteger(base) || base < 0 || !items) return json(request, 400, { error: 'bad-request' });
  if (base !== space.version) return json(request, 409, { error: 'conflict', version: space.version });
  // Every write is conditional on the version still being `base`, and the version bump
  // comes last: if another save got in first, none of this batch changes anything
  const guard = 'EXISTS (SELECT 1 FROM spaces WHERE id = ? AND version = ?)';
  const statements = items.map(([key, value, epoch]) => db.prepare(
    `INSERT INTO items (space_id, key, value, epoch, updated_at) SELECT ?, ?, ?, ?, ? WHERE ${guard}
     ON CONFLICT (space_id, key) DO UPDATE SET value = excluded.value, epoch = excluded.epoch, updated_at = excluded.updated_at`
  ).bind(id, key, value, epoch, now, id, base));
  statements.push(db.prepare('UPDATE spaces SET version = version + 1, updated_at = ? WHERE id = ? AND version = ?').bind(now, id, base));
  const results = await db.batch(statements);
  const bumped = results[results.length - 1].meta.changes === 1;
  if (!bumped) {
    const current = await db.prepare('SELECT version FROM spaces WHERE id = ?').bind(id).first();
    return json(request, 409, { error: 'conflict', version: current ? current.version : null });
  }
  return json(request, 200, { version: base + 1 });
}

export default {
  async fetch(request, env) {
    try { return await handle(request, env); }
    catch (e) { return json(request, 500, { error: 'server-error' }); }
  }
};
