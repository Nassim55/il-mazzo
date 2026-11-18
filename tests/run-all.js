#!/usr/bin/env node
// Runs every tests/*.test.js in its own Node process, several at once (one per CPU core: 4 on
// GitHub's runner), the slowest first, and prints one line per suite as it finishes.
// Exits non-zero if any suite fails, so it works locally and in CI.
//   npm test                 — all suites
//   npm test -- audio nouns  — only suites whose file name contains "audio" or "nouns"
//   TEST_JOBS=1 npm test     — one suite at a time
//   node tests/audio.test.js — one suite, with every check listed
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// The slowest suites, started first so that none is left running on its own at the end
// (seconds on one core, Nov 2026: topics 34, sync-client 20, mipiace 16, parla 14, noun-map 13…)
const SLOW_FIRST = ['topics', 'sync-client', 'mipiace', 'parla', 'noun-map', 'hand', 'table', 'retype', 'verb-order', 'progress', 'sync-merge', 'passive'];
const rank = f => { const i = SLOW_FIRST.indexOf(f.replace('.test.js', '')); return i < 0 ? SLOW_FIRST.length : i; };

const filters = process.argv.slice(2);
const files = fs.readdirSync(__dirname)
  .filter(f => f.endsWith('.test.js'))
  .filter(f => !filters.length || filters.some(x => f.includes(x)))
  .sort((a, b) => (rank(a) - rank(b)) || a.localeCompare(b));
const cores = typeof os.availableParallelism === 'function' ? os.availableParallelism() : os.cpus().length;
const jobs = Math.max(1, Math.min(Number(process.env.TEST_JOBS) || cores, files.length || 1));

const failed = [];
const started = Date.now();
let next = 0, running = 0;
console.log(`${files.length} suites, ${jobs} at a time\n`);

function runOne(f) {
  const t0 = Date.now();
  let out = '';
  const child = spawn(process.execPath, ['--max-old-space-size=4096', path.join(__dirname, f)]);   // room for suites that boot the app many times
  child.stdout.on('data', d => { out += d; });
  child.stderr.on('data', d => { out += d; });
  child.on('close', code => {
    const lines = out.trim().split('\n');
    const summary = lines.filter(l => /\d+ passed, \d+ failed|\d+ comparisons, \d+ differences/.test(l)).pop() || '(no summary — see below)';
    const passed = code === 0;
    console.log(`${passed ? '✓' : '✗'} ${f.replace('.test.js', '').padEnd(28)} ${summary.padEnd(36)} ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    if (!passed) {
      failed.push(f);
      lines.filter(l => /FAIL|✗|Error|error/.test(l)).slice(0, 20).forEach(l => console.log(`      ${l}`));
    }
    running--;
    launch();
  });
}
function launch() {
  while (running < jobs && next < files.length) { running++; runOne(files[next++]); }
  if (running === 0 && next >= files.length) {
    console.log(`\n${files.length - failed.length}/${files.length} suites passed in ${((Date.now() - started) / 1000).toFixed(1)}s${failed.length ? ` — failed: ${failed.map(f => f.replace('.test.js', '')).join(', ')}` : ''}`);
    process.exit(failed.length ? 1 : 0);
  }
}
launch();
