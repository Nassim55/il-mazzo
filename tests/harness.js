// Test harness: loads the app (index.html) in jsdom and offers small helpers.
// Run one suite with `node tests/<name>.test.js`, or all of them with `npm test`.
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const path = require('path');
const FILE = process.env.FILE || path.join(__dirname, '..', 'index.html');

// jsdom reports browser features it doesn't implement (scrolling etc.) as errors;
// they're harmless here, so keep the output to what matters
function quietConsole() {
  const vc = new VirtualConsole();
  vc.sendTo(console, { omitJSDOMErrors: true });
  vc.on('jsdomError', e => { if (!/Not implemented/.test(e.message)) console.error(e.message); });
  return vc;
}
function boot(storage = {}, setup = null) {
  const warns = [], errors = [];
  const dom = new JSDOM(fs.readFileSync(FILE, 'utf8'), { runScripts: 'dangerously', url: 'http://localhost/index.html', pretendToBeVisual: true, virtualConsole: quietConsole(),
    beforeParse(w) { for (const [k, v] of Object.entries(storage)) w.localStorage.setItem(k, v);
                     w.MAZZO_INFINITIVE_FIRST = false;   // conjugation rounds without the infinitive card, unless a test's setup turns it on
                     w.console.warn = (...a) => warns.push(a.join(' ')); w.addEventListener('error', e => errors.push(e.message)); if (setup) setup(w); } });
  const w = dom.window, d = w.document;
  return { w, d, warns, errors, ev: s => w.eval(s),
    key: (el, k) => el.dispatchEvent(new w.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })),
    fire: (el, type) => el.dispatchEvent(new w.MouseEvent(type, { bubbles: true, cancelable: true, button: 0 })),
    setVal: (id, v, evt = 'input') => { const el = d.getElementById(id); el.value = v; el.dispatchEvent(new w.Event(evt)); } };
}
let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log(`${c ? '✓' : '✗ FAIL'}  ${m}`); };
// done(): print the summary, then end the process once its output is written. A simulated page can
// leave timers pending (a watchdog set far off, a check every few minutes), and Node would otherwise
// wait for each one to fire: the passive suite sat idle for 96 s after its last check.
const done = () => {
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exitCode = fail ? 1 : 0;
  process.stdout.write('', () => process.exit(process.exitCode));
};
module.exports = { boot, ok, done, quietConsole, FILE };
