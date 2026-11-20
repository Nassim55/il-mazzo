#!/bin/sh
# Stamp a release: the same build mark in index.html (const BUILD) and version.json. The app compares
# the two and offers to reload when the published version.json is newer than the page it's running.
# Then the page's security policy gets the hash of its script, which the stamp has just changed (Nov 2026):
# with a stale hash the browser would refuse to run the app. tests/csp.test.js checks it.
cd "$(dirname "$0")/.." || exit 1
stamp=$(date -u +%Y-%m-%dT%H:%MZ)
sed -i.bak "s/const BUILD = '[^']*';/const BUILD = '$stamp';/" index.html && rm -f index.html.bak
printf '{ "build": "%s" }\n' "$stamp" > version.json
node -e '
const fs = require("fs"), crypto = require("crypto");
let html = fs.readFileSync("index.html", "utf8");
const script = /<script>([\s\S]*?)<\/script>/.exec(html)[1];
const hash = crypto.createHash("sha256").update(script, "utf8").digest("base64");
const next = html.replace(/(script-src [^;"]*?)'"'"'sha256-[A-Za-z0-9+\/=]+'"'"'/, (m, pre) => `${pre}'"'"'sha256-${hash}'"'"'`);
if (next === html && !html.includes(`sha256-${hash}`)) { console.error("stamp: no script hash in the security policy"); process.exit(1); }
fs.writeFileSync("index.html", next);
'
echo "stamped $stamp"
