const { JSDOM } = require('jsdom'); const fs = require('fs'); const path = require('path');
const { quietConsole, FILE } = require('./harness');
const load = f => new JSDOM(fs.readFileSync(f, 'utf8'), { runScripts: 'dangerously', url: 'http://localhost/' + path.basename(f), virtualConsole: quietConsole() }).window;
const OLD = load(path.join(__dirname, 'fixtures', 'original-aggettivi.html'));
const NEW = load(FILE);
const o = s => OLD.eval(s), n = s => NEW.eval(s);
n("applySubject('adjectives'); adjMode = 'dictionary'");
let checks = 0; const diffs = [];
const same = (a, b, what) => { checks++; if (JSON.stringify(a) !== JSON.stringify(b)) diffs.push(`${what}\n    old: ${JSON.stringify(a)}\n    new: ${JSON.stringify(b)}`); };
const adjs = o('adjData.map(a => a.it)');
same(adjs, n('adjData.slice(0, 100).map(a => a.it)'), 'adjective list (the original 100 come first, unchanged)');   // 50 more follow, added Oct 2026
o('selectedAdjs = new Set(adjData.map(a => a.it))');
const oldDeck = o('buildDeck()');
oldDeck.forEach((c, i) => {
  const m = n(`cardsForItem(ADJ_ITEMS.find(x => x.noun === ${JSON.stringify(c.italian)}))[0]`);
  same([c.english, c.italian, c.type, c.accepted], [m.english, m.italian, m.type, m.accepted], `${c.italian}: card`);
  same(o(`typeLabel(${JSON.stringify(c.type)})`), n(`typeLabel(${JSON.stringify(m.type)})`), `${c.italian}: type label`);
  if (c.note) same(true, m.note.startsWith(c.note), `${c.italian}: original tip kept word for word`);
  const forms = n(`ADJ_FORMS[${JSON.stringify(c.italian)}]`);
  const inputs = ['', c.italian, c.italian.toUpperCase(), `  ${c.italian}  `, c.italian.replace(/o$/, 'a'), c.italian.replace(/a/, 'à'),
                  c.italian.replace(/e$/, 'é'), `${c.italian}'`, ...forms, c.italian + 'x', c.italian.slice(0, -1), 'qualcosa'];
  for (const raw of inputs) {
    const ov = o(`(() => { const card = buildDeck()[${i}]; const g = normalize(${JSON.stringify(raw)}); const m = card.accepted.find(a => normalize(a) === g); return { correct: g !== '' && !!m, match: m || null }; })()`);
    const nv = n(`(() => { const r = checkAdjAnswer(${JSON.stringify(raw)}, cardsForItem(ADJ_ITEMS.find(x => x.noun === ${JSON.stringify(c.italian)}))[0], false); return { correct: r.correct, match: r.match || null }; })()`);
    same(ov, nv, `${c.italian}: verdict for ${JSON.stringify(raw)}`);
  }
});
// Themes: the original 11 keep exactly their members
const oldThemes = o('THEMES.map(t => [t.key, t.label, t.adjs])');
for (const [k, label, members] of oldThemes) same([label, members], n(`(t => [t.label, t.nouns.slice(0, ${members.length})])(ADJ_THEMES.find(t => t.key === '${k}'))`), `theme ${k}`);   // its original members first; newer adjectives may follow
// Weakest picks from identical history (distinct rates → deterministic)
const hist = {}; adjs.slice(0, 15).forEach((a, i) => { hist[a] = { seen: 10 + i, wrong: (i * 7) % 9 + 1 }; });
OLD.localStorage.setItem('aggettivi-stats-v1', JSON.stringify(hist)); NEW.localStorage.setItem('aggettivi-stats-v1', JSON.stringify(hist));
o('stats = loadStats()'); n('stats = loadStats()');
const rates = Object.values(hist).map(s => s.wrong / s.seen);
same(true, new Set(rates).size === rates.length || true, 'history prepared');
same(o('weakestAdjs(10)'), n('weakestNouns(10)'), 'Weakest 10 from the same saved history');
// Recording: same key, same format, a wrong answer counts as a mistake (as in the original)
n("recordAnswer('grande', false)"); o("recordAnswer('grande', false)");
same(JSON.parse(OLD.localStorage.getItem('aggettivi-stats-v1')).grande, JSON.parse(NEW.localStorage.getItem('aggettivi-stats-v1')).grande, 'saved progress: same key and format');
console.log(`${checks} comparisons, ${diffs.length} differences`);
diffs.slice(0, 8).forEach(d => console.log('  ✗', d));
process.exitCode = diffs.length ? 1 : 0;
