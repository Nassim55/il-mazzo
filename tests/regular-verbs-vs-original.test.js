const { JSDOM } = require('jsdom'); const fs = require('fs'); const path = require('path');
const { quietConsole, FILE } = require('./harness');
const load = (file) => new JSDOM(fs.readFileSync(file, 'utf8'), { runScripts: 'dangerously', url: 'http://localhost/' + path.basename(file), virtualConsole: quietConsole() }).window;
const OLD = load(path.join(__dirname, 'fixtures', 'original-verbi-regolari.html'));
const NEW = load(FILE);
const o = s => OLD.eval(s), n = s => NEW.eval(s);
n("applySubject('verbs')");
// Intended change: domandare is told apart from the new chiedere. Apply it to the original so nothing ELSE may differ.
o("(v => { v.en = 'to ask (a question)'; for (const p in v.prompts) v.prompts[p] = v.prompts[p] + ' (a question)'; })(verbData.find(v => v.it === 'domandare'));");
// Intended change: cognate hints on iniziare/cominciare. Apply the same labels to the
// original so the comparison checks that nothing ELSE changed.
o("verbData.find(v => v.it === 'iniziare').en = 'to start (initiate)'; verbData.find(v => v.it === 'cominciare').en = 'to begin (commence)';");
let checks = 0, diffs = [];
const same = (a, b, what) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) diffs.push(`${what}\n    old: ${JSON.stringify(a)}\n    new: ${JSON.stringify(b)}`); };
const verbs = o('verbData.map(v => v.it)');
same(verbs, n('verbData.map(v => v.it)').slice(0, 100), 'original 100 verbs, in order (the 50 additions come after)');

for (const mode of ['conjugations', 'infinitives']) {
  for (const it of verbs) {
    o(`selectedVerbs = new Set(['${it}']); mode = '${mode}'; direction = 'en-to-it'`);
    n(`verbMode = '${mode}'`);
    const oc = o('buildDeck()');
    const nc = n(`cardsForItem(VERB_ITEMS.find(x => x.noun === '${it}'))`);
    same(oc.length, nc.length, `${it} ${mode}: card count`);
    oc.forEach((c, i) => {
      const m = nc[i];
      same([c.prompt, c.answer, c.person, c.pronounLabel, c.pron, c.english],
           [m.english, m.italian, m.person, m.pronounLabel, m.pron, m.verbMeaning], `${it} ${mode} card ${i}: prompt/answer/person/label/pron/meaning`);
      // EN → IT verdicts
      const ans = c.answer;
      const accented = ans.replace(/a/, 'à').replace(/o$/, 'ò');
      const inputs = ['', ans, ans.toUpperCase(), ` ${ans}  `, ans + '.', ans + '!', accented, ans + 'x', ans.slice(0, -1),
                      ...['io','tu','lui','lei','egli','ella','noi','voi','loro','essi','esse'].map(p => `${p} ${ans}`), `Io ${ans}`, `lui ${ans}x`];
      for (const raw of inputs) {
        same(o(`checkAnswer(${JSON.stringify(raw)}, deck_tmp = buildDeck()[${i}])`), n(`checkVerbAnswer(${JSON.stringify(raw)}, cardsForItem(VERB_ITEMS.find(x => x.noun === '${it}'))[${i}], false)`),
             `${it} ${mode} card ${i} EN→IT verdict for ${JSON.stringify(raw)}`);
      }
    });
    // IT → EN: accepted English sets and verdicts
    o(`direction = 'it-to-en'`);
    const ocr = o('buildDeck()');
    ocr.forEach((c, i) => {
      const oldSet = o(`[...acceptableEnglishAnswers(${JSON.stringify(c.answer)})].sort()`);
      const newSet = n(`[...acceptableEnglishAnswers(cardsForItem(VERB_ITEMS.find(x => x.noun === '${it}'))[${i}].english)].sort()`);
      same(oldSet, newSet, `${it} ${mode} card ${i}: accepted English answers`);
      for (const raw of [...oldSet.slice(0, 12), c.answer.toUpperCase(), 'nonsense', '', c.answer + 's']) {
        same(o(`checkAnswer(${JSON.stringify(raw)}, buildDeck()[${i}])`).correct,
             n(`checkVerbAnswer(${JSON.stringify(raw)}, cardsForItem(VERB_ITEMS.find(x => x.noun === '${it}'))[${i}], true)`).correct,
             `${it} ${mode} card ${i} IT→EN verdict for ${JSON.stringify(raw)}`);
      }
    });
  }
}
// Weakest 10 from identical saved history (distinct scores so the order is deterministic)
const hist = {}; verbs.slice(0, 14).forEach((v, i) => { hist[v] = { attempts: 10 + i * 3, wrongs: 1 + (i * 7) % 11 }; });
OLD.localStorage.setItem('verbi-regolari-stats', JSON.stringify(hist));
NEW.localStorage.setItem('verbi-regolari-stats', JSON.stringify(hist));
n("stats = loadStats()");
same(o('[...pickWeakest(10)]'), n('weakestNouns(10)'), 'Weakest 10 from the same saved history');
console.log(`${checks} comparisons, ${diffs.length} differences`);
diffs.slice(0, 8).forEach(d => console.log('  ✗', d));
process.exitCode = diffs.length ? 1 : 0;
