// What the live site is made of (Nov 2026): the deploy publishes exactly the files in site-files.txt.
// Until Nov 20 it published index.html alone, so the offline copy, the update check and the icons never
// went live. This fails if the page, its service worker or its manifest asks for a file the list leaves
// out, if a listed file is missing, or if the deploy stops using the list.
const { ok, done } = require('./harness');
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const list = read('site-files.txt').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
ok(list.length > 0 && list.every(f => fs.existsSync(path.join(root, f))), `every listed file exists: ${list.join(', ')}`);
const clean = p => p.replace(/^\.\//, '').split(/[?#]/)[0];
const covered = p => { const c = clean(p); return c === '' || list.some(f => c === f || c.startsWith(`${f.replace(/\/$/, '')}/`)); };
const isLocal = s => !!s && !/^(https?:|data:|blob:|mailto:|tel:|javascript:|#|\/\/)/.test(s) && !s.includes('${');
const html = read('index.html');
const markup = html.replace(/<script>[\s\S]*?<\/script>/, '');
const script = (/<script>([\s\S]*?)<\/script>/.exec(html) || [])[1] || '';
const asked = {
  'the page': [...markup.matchAll(/\s(?:href|src)="([^"]+)"/g)].map(m => m[1]).filter(isLocal)
    .concat([...script.matchAll(/serviceWorker\.register\('([^']+)'/g)].map(m => m[1]))
    .concat(/fetch\([^)]*version\.json/.test(script) ? ['version.json'] : []),
  'the service worker': JSON.parse(((/const SHELL = (\[[^\]]*\])/.exec(read('sw.js')) || [])[1] || '[]').replace(/'/g, '"')),
  'the manifest': (() => { const m = JSON.parse(read('manifest.webmanifest')); return [m.start_url, ...(m.icons || []).map(i => i.src)].filter(isLocal); })()
};
ok(asked['the page'].some(p => /sw\.js$/.test(p)) && asked['the page'].includes('version.json') && asked['the page'].includes('manifest.webmanifest'),
   'found what the page asks for: its service worker, version.json, the manifest and the icons');
for (const [who, paths] of Object.entries(asked)) {
  const missing = paths.filter(p => !covered(p));
  ok(paths.length > 0 && missing.length === 0, `everything ${who} asks for goes live${missing.length ? ` — missing: ${missing.join(', ')}` : ` (${paths.length} files)`}`);
}
const wf = read('.github/workflows/tests.yml');
ok(/grep -vE '\^\[\[:space:\]\]\*\(#\|\$\)' site-files\.txt/.test(wf) && /cp -R "\$\{files\[@\]\}" _site\//.test(wf) && !/cp index\.html _site\//.test(wf),
   'the deploy publishes exactly site-files.txt');
done();
