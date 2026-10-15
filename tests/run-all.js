#!/usr/bin/env node
// Runs every tests/*.test.js in its own Node process and prints one line per suite.
// Exits non-zero if any suite fails, so it works locally and in CI.
//   npm test                 — all suites
//   npm test -- audio nouns  — only suites whose file name contains "audio" or "nouns"
//   node tests/audio.test.js — one suite, with every check listed
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const filters = process.argv.slice(2);
const files = fs.readdirSync(__dirname)
  .filter(f => f.endsWith('.test.js'))
  .filter(f => !filters.length || filters.some(x => f.includes(x)))
  .sort();

const failed = [];
const started = Date.now();
for (const f of files) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [path.join(__dirname, f)], { encoding: 'utf8' });
  const lines = `${r.stdout || ''}${r.stderr || ''}`.trim().split('\n');
  const summary = lines.filter(l => /\d+ passed, \d+ failed|\d+ comparisons, \d+ differences/.test(l)).pop() || '(no summary — see below)';
  const passed = r.status === 0;
  console.log(`${passed ? '✓' : '✗'} ${f.replace('.test.js', '').padEnd(28)} ${summary.padEnd(36)} ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  if (!passed) {
    failed.push(f);
    lines.filter(l => /FAIL|✗|Error|error/.test(l)).slice(0, 20).forEach(l => console.log(`      ${l}`));
  }
}
console.log(`\n${files.length - failed.length}/${files.length} suites passed in ${((Date.now() - started) / 1000).toFixed(1)}s`);
process.exit(failed.length ? 1 : 0);
