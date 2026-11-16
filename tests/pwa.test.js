// The installable app (Nov 2026): a manifest, home-screen icons, and a service worker that keeps
// Il Mazzo working offline — never caching the sync server or Google sign-in.
const fs = require('fs'), path = require('path'), vm = require('vm');
const { boot, ok, done } = require('./harness');
const root = path.join(__dirname, '..');
const man = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
ok(man.name === 'Il Mazzo' && man.display === 'standalone' && man.start_url === './' && man.scope === './' && man.background_color === '#f3ead8', 'the manifest: Il Mazzo, full-screen, at its own address, in its cream');
const png = f => { const b = fs.readFileSync(path.join(root, f)); return b.slice(1, 4).toString() === 'PNG' ? `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}` : null; };
ok(man.icons.every(i => png(i.src) === i.sizes) && man.icons.some(i => i.purpose === 'maskable'), `its icons are there, the sizes it says (${man.icons.map(i => i.sizes).join(', ')}), one maskable for Android`);
ok(png('icons/apple-touch-icon.png') === '180x180', 'and the iPhone’s home-screen icon');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
new vm.Script(sw);   // throws on a syntax error
const shell = JSON.parse(sw.match(/const SHELL = (\[[^\]]*\])/)[1].replace(/'/g, '"'));
ok(shell.every(f => f === './' || fs.existsSync(path.join(root, f))) && /workers\.dev/.test(sw) && /accounts\.google\.com/.test(sw),
   'the service worker parses; everything it caches exists; syncing and sign-in always go to the network');
const B = boot({ 'flipcards-subject': 'nouns' });
ok(B.d.querySelector('link[rel="manifest"]').getAttribute('href') === 'manifest.webmanifest' && B.d.querySelector('meta[name="theme-color"]').content === '#f3ead8'
   && B.d.querySelector('link[rel="apple-touch-icon"]').getAttribute('href') === 'icons/apple-touch-icon.png', 'the page links its manifest, colour and icon');
ok(B.errors.length === 0, 'opened from a file: no service worker, and no errors');
done();
