// The page's security policy (Nov 2026): only this page's own script runs (by its hash), plus Google's
// sign-in; data goes only to this site, the sync API and Google's sign-in. A stale hash would stop the app
// running at all, so this checks the hash matches the script as it is — tools/stamp.sh keeps it so.
const { ok, done } = require('./harness');
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const meta = /<meta http-equiv="Content-Security-Policy" content="([^"]+)">/.exec(html);
ok(!!meta, 'the page carries a Content-Security-Policy');
const policy = Object.fromEntries((meta ? meta[1] : '').split(';').map(d => d.trim().split(/\s+/)).filter(d => d[0]).map(([k, ...v]) => [k, v]));
const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
ok(scripts.length === 1 && !scripts[0][1].trim(), 'one script, written into the page — none loaded from elsewhere');
const hash = `'sha256-${crypto.createHash('sha256').update(scripts[0][2], 'utf8').digest('base64')}'`;
ok((policy['script-src'] || []).includes(hash), `the policy carries the script's hash as it is now (${hash.slice(0, 20)}…) — run tools/stamp.sh after any change`);
ok((policy['script-src'] || []).join(' ') === `'self' ${hash} https://accounts.google.com/gsi/client` && !(policy['script-src'] || []).includes("'unsafe-inline'"),
   "scripts: this site, this page's script and Google's sign-in — nothing inline beyond the one hashed");
ok((policy['connect-src'] || []).join(' ') === "'self' https://il-mazzo-sync.il-mazzo.workers.dev https://accounts.google.com/gsi/", 'data goes only to this site, the sync API and Google\'s sign-in');
ok(policy['object-src'] && policy['object-src'][0] === "'none'" && policy['base-uri'][0] === "'self'" && (policy['frame-src'] || []).join() === 'https://accounts.google.com/gsi/',
   'no plug-ins, no rebasing links, frames only for Google\'s sign-in');
ok(!/\son[a-z]+="/.test(html.replace(/<script>[\s\S]*?<\/script>/, '')), 'no onclick-style attributes in the markup (the policy would block them)');
done();
