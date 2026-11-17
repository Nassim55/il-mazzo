#!/bin/sh
# Stamp a release: the same build mark in index.html (const BUILD) and version.json. The app compares
# the two and offers to reload when the published version.json is newer than the page it's running.
cd "$(dirname "$0")/.." || exit 1
stamp=$(date -u +%Y-%m-%dT%H:%MZ)
sed -i.bak "s/const BUILD = '[^']*';/const BUILD = '$stamp';/" index.html && rm -f index.html.bak
printf '{ "build": "%s" }\n' "$stamp" > version.json
echo "stamped $stamp"
