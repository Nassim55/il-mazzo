// The map fades with time (Nov 25): a known word's square stays fresh for a week after you last get it right, then
// fades — washed into the paper, its dot in the square's own colour — and is faint (never gone) by three weeks.
// Learning words don't fade. A row says how many are fading; when a quarter of a topic's known words (at least 5)
// are, ↻ Ripassa takes the row's button: a round of just those, your deck kept as it was.
const { boot, ok, done } = require('./harness');
const T = boot({}).ev('today()');
const tempo = boot({}).ev("NOUN_THEMES.find(t => t.key === 'tempo').nouns");
const persone = boot({}).ev("NOUN_THEMES.find(t => t.key === 'persone').nouns.filter(k => !NOUN_THEMES.find(t => t.key === 'tempo').nouns.includes(k))");
const st = {}, srs = {};
const known = (k, age) => { st[k] = { seen: 10, wrong: 0 }; srs[k] = { b: 5, d: T + 9, l: T - age, rl: T - age, rd: 4, h: '1111111111' }; };
tempo.forEach((k, i) => known(k, i < 20 ? 30 : i < 30 ? 14 : 2));          // 20 faint, 10 half-way, the rest fresh
persone.slice(0, 4).forEach(k => known(k, 30));                             // only 4 fading: under Ripassa's 5
const learning = persone[6];
st[learning] = { seen: 4, wrong: 2 }; srs[learning] = { b: 1, d: T + 1, l: T - 30, rl: T - 30, rd: 1, h: '1010' };   // old, but not known: no fade
const B = boot({ 'flipcards-subject': 'nouns', 'sostantivi-stats-v1': JSON.stringify(st), 'sostantivi-stats-v1:srs': JSON.stringify(srs) });
const { d, ev } = B;
const row = k => d.querySelector(`.map-row[data-topic="${k}"]`);
const cell = (r, i) => row(r).querySelectorAll('.map-cell')[i];
const sqOf = k => [...row('tempo').querySelectorAll('.map-cell')].find(c => c.title.startsWith(ev(`SUBJECTS.nouns.items.find(n => n.noun === ${JSON.stringify(k)}).it`) + ' —'));
const cssVar = (el, v) => (el.getAttribute('style').match(new RegExp(v + ':\\s*([^;]+)')) || [])[1];

ok(B.errors.length === 0, 'loads with no errors');
const fresh = sqOf(tempo[40]), half = sqOf(tempo[25]), faint = sqOf(tempo[5]);
ok(!fresh.classList.contains('fading') && cssVar(fresh, '--c') === ev('mapColor(0, 10)') && !cssVar(fresh, '--dot'), 'right 2 days ago: fresh — its colour as always');
ok(half.classList.contains('fading') && cssVar(half, '--c') === ev('mapFadeColors(0, 10, 0.5).c') && cssVar(half, '--dot') === ev('mapFadeColors(0, 10, 0.5).dot'),
   `14 days: half-way — washed towards the paper (${cssVar(half, '--c')}), its dot taking the colour`);
ok(faint.classList.contains('fading') && cssVar(faint, '--c') === ev('mapFadeColors(0, 10, 1).c') && ev("mapFade(21)") === 1 && ev('mapFade(7)') === 0 && ev('mapFade(30)') === 1,
   `30 days: faint (${cssVar(faint, '--c')}) — the fade starts after a week and is complete by three`);
ok(!row('persone').querySelector(`.map-cell.fading[title^="${ev(`SUBJECTS.nouns.items.find(n => n.noun === ${JSON.stringify(learning)}).it`)} —"]`),
   'a word still being learnt never fades, however long ago it was practised');
ok(/known — fading: last right 30 days ago/.test(faint.title), `its title says why: “${faint.title}”`);

// ---- the row ----
ok(row('tempo').querySelector('.map-fading').textContent === '30 fading' && !!row('tempo').querySelector('[data-map-ripassa="tempo"]') && !row('tempo').querySelector('[data-map-toggle]')
   && /Ripassa · 30/.test(row('tempo').querySelector('[data-map-ripassa]').textContent), 'Tempo: “30 fading”, and ↻ Ripassa · 30 in place of ＋ Add');
ok(row('persone').querySelector('.map-fading').textContent === '4 fading' && !row('persone').querySelector('[data-map-ripassa]') && !!row('persone').querySelector('[data-map-toggle]'),
   'Persone: 4 fading — under five, so its ＋ Add stays');
ok(cssVar(row('tempo').querySelector('.map-score'), '--c') !== ev(`mapPctColor({ pct: 100 })`), 'the 100% underline fades with them');
ok(/fresh → 3 weeks unpractised/.test(d.querySelector('.map-key').textContent) && d.querySelectorAll('.map-key .mk-fade .mk-cell').length === 3 && /fades once you haven't got it right for a week/.test(d.querySelector('.map-how').textContent),
   'the key shows the fade, and How it\'s scored explains it');

// ---- Ripassa ----
const fadingKeys = tempo.slice(0, 30).sort().join();
d.querySelector('[data-map-ripassa="tempo"]').click();
ok(d.querySelector('.container').dataset.view === 'game' && ev('deck.map(c => c.noun).sort().join()') === fadingKeys, 'Ripassa: a round of exactly the 30 fading words');
ok(ev('selectedNouns.size') === 0, 'and your deck stays as it was (empty here)');
ev(`srsAnswer('nouns', 'en-it', ${JSON.stringify(tempo[5])}, true)`);
ev('showSetup()');
ok(!sqOf(tempo[5]).classList.contains('fading') && row('tempo').querySelector('.map-fading').textContent === '29 fading', 'answered right: its square is fresh again — 29 fading');

// ---- per direction, as knowing is; older records ----
ev("direction = 'it-en'; showSetup();");
ok(!row('tempo').querySelector('.map-cell.fading') && !row('tempo').querySelector('.map-fading'), 'Italian → English has its own record: nothing known there, nothing fading');
ok(ev(`mapLastRight({ l: ${T - 9} })`) === T - 9 && ev(`mapLastRight({ b: 3, d: ${T + 1} })`) === T - 3 && ev('mapLastRight(null)') === null,
   'older records without the day: the last answer, else the day the review was set from (due day less its gap)');
ok(B.errors.length === 0, 'no errors');
done();
