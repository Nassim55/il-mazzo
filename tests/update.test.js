// A newer version (Nov 2026): the page's BUILD against version.json — when the published one differs,
// a banner offers to reload, so a tab or home-screen app left open doesn't keep running an old version.
const fs = require('fs'), path = require('path');
const { boot, ok, done } = require('./harness');
const root = path.join(__dirname, '..');
const build = (fs.readFileSync(path.join(root, 'index.html'), 'utf8').match(/const BUILD = '([^']+)';/) || [])[1];
const ver = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));
ok(build && build !== 'unstamped' && ver.build === build, `version.json and the page carry the same build stamp (${build})`);
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
ok(/endsWith\('\/version\.json'\)\) return/.test(sw) && /'il-mazzo-v2'/.test(sw), 'the service worker leaves version.json to the network, and its cache is renewed (v2)');
const server = published => w => {
  w.__asked = [];
  w.fetch = async (url, opts) => { w.__asked.push([String(url), opts && opts.cache]); return { ok: true, json: async () => ({ build: published }) }; };
  Object.defineProperty(w.document, 'visibilityState', { configurable: true, get: () => 'visible' });
};
(async () => {
  let B = boot({ 'flipcards-subject': 'nouns' }, server(build));
  await B.ev('checkForUpdate()');
  const asks = B.w.__asked.filter(([u]) => /\/version\.json$/.test(u));   // the app may ask other things of the network as it starts
ok(B.d.getElementById('update-banner').hidden && asks.length === 1 && asks[0][1] === 'no-store',
     'the same build published: no banner (version.json asked for, never from a cache)');
  B = boot({ 'flipcards-subject': 'nouns' }, server('2099-01-01T00:00Z'));
  await B.ev('checkForUpdate()');
  ok(!B.d.getElementById('update-banner').hidden && /newer Il Mazzo/.test(B.d.getElementById('update-banner').textContent), 'a newer build published: the banner offers to reload');
  B.d.getElementById('update-close').click();
  await B.ev('checkForUpdate()');
  ok(B.d.getElementById('update-banner').hidden, 'Not now: it stays away for the rest of the visit');
  ok(B.errors.length === 0, 'no errors');
  done();
})();
