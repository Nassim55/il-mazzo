// I progressi — analytics in the map's panel, in place of I temi: known, learning and gained;
// words over time (practised and known); getting it right, week by week; how well, today; and
// what's coming up in Ripasso. A day-by-day history behind it, written on every answer and synced.
const { boot, ok, done } = require('./harness');

let B = boot({ 'flipcards-subject': 'nouns' });
const panel = () => B.d.getElementById('map-panel');
const hist = (s = 'nouns', d = 'en-it') => B.ev(`loadHist('${s}', '${d}')`);
const t = B.ev('today()');
ok(panel().querySelector('.endings-title').textContent === 'I progressi' && [...panel().querySelectorAll('.prog-what')].map(x => x.textContent).join() === 'known,learning,gained',
   'the panel: I progressi — known, learning, gained');
ok(['Nouns over time', 'Getting it right', 'How well, today', 'Coming up in Ripasso'].every(h => [...panel().querySelectorAll('.prog-head .en-label')].some(x => x.textContent === h)) && !/streak|in a row/i.test(panel().textContent),
   'four views: words over time, getting it right, how well today, coming up in Ripasso — and no streak');
ok(Object.keys(hist()).length === 1 && hist()[t].k === 0 && /Your daily history starts/.test(panel().textContent), 'a first visit starts the history, today');

// ---- Every answer goes into the day ----
B.ev("selectedNouns = new Set(['pane', 'vino']); updateReadout();");
B.d.getElementById('start-btn').click();
B.d.getElementById('answer').value = B.ev('deck[index].italian'); B.d.getElementById('submit').click(); B.d.getElementById('submit').click();
B.d.getElementById('answer').value = 'boh'; B.d.getElementById('submit').click();
ok(hist()[t].n === 2 && hist()[t].r === 1 && hist()[t].p === 2, `today: 2 answers, 1 right, 2 practised (${JSON.stringify(hist()[t])})`);
B = boot({ 'flipcards-subject': 'nouns' });
B.ev("direction = 'it-en'; stats = loadStats(); selectedNouns = new Set(['casa']); updateReadout();");
B.d.getElementById('start-btn').click();
B.d.getElementById('answer').value = 'the hut'; B.d.getElementById('submit').click();
B.d.querySelector('.override-btn').click();
ok(hist('nouns', 'it-en')[t].n === 1 && hist('nouns', 'it-en')[t].r === 1, '"I was right": the day\'s wrong answer becomes a right one');
B = boot({ 'flipcards-subject': 'nouns', 'aggettivi-stats-v1': JSON.stringify({ piccolo: { seen: 4, wrong: 2 } }) });
B.ev('startRipasso()');
B.d.getElementById('answer').value = B.ev('deck[index].italian'); B.d.getElementById('submit').click();
ok(hist('adjectives')[t] && hist('adjectives')[t].n === 1, 'a Ripasso answer counts in its own section\'s history');

// ---- With a history: the numbers, the charts, the tooltips, the ranges ----
const H = {};
for (let i = 40; i >= 1; i--) if (i % 3) H[t - i] = { n: 20, r: 10 + Math.floor((40 - i) / 4), k: 40 - i, p: 60 - i };
const stats = {}; const keys = B.ev('NOUN_FREQUENCY_ORDER.slice(0, 60)');
keys.forEach((k, i) => { stats[k] = { seen: 6, wrong: i < 45 ? 0 : 4 }; });
B = boot({ 'flipcards-subject': 'nouns', 'sostantivi-stats-v1': JSON.stringify(stats), 'sostantivi-stats-v1:hist': JSON.stringify(H) });
const known = B.ev("knowCounts('nouns', 'en-it').k");
ok(panel().querySelectorAll('.prog-big')[0].textContent === String(known) && panel().querySelectorAll('.prog-big')[1].textContent === String(60 - known), `known ${known}, learning ${60 - known} — from the track record`);
const firstK = B.ev(`(() => { const h = loadHist('nouns', 'en-it'); const ds = Object.keys(h).map(Number).filter(d => d >= ${t} - 89).sort((a, b) => a - b); return h[ds[0]].k; })()`);
ok(panel().querySelectorAll('.prog-big')[2].textContent === `+${known - firstK}` && /in three months/.test(panel().querySelector('.prog-tiles').textContent), `gained: +${known - firstK} in three months (the default range)`);
const charts = () => panel().querySelectorAll('.prog-chart');
ok(charts()[0].querySelectorAll('.prog-hit').length === 90 && charts()[0].querySelector('.prog-line') && charts()[0].querySelector('.prog-line2') && charts()[0].querySelector('.prog-area'), 'words over time: 90 days, known (with its area) and practised');
ok(charts()[1].querySelectorAll('.prog-hit').length === 13 && charts()[1].querySelectorAll('.prog-vol').length > 0, 'getting it right: by week over three months, the answers as faint bars');
const hit = charts()[0].querySelectorAll('.prog-hit')[89 - 2];   // two days ago (every third day has no practice)
hit.dispatchEvent(new B.w.Event('pointerover', { bubbles: true }));
const tip = charts()[0].querySelector('.prog-tip');
ok(!tip.hidden && new RegExp(`${H[t - 2].k} known · ${H[t - 2].p} practised`).test(tip.textContent) && charts()[0].querySelector('.prog-cross').getAttribute('visibility') === 'visible',
   `hover a day: its numbers (${tip.textContent})`);
const out = new B.w.Event('pointerout', { bubbles: true }); Object.defineProperty(out, 'relatedTarget', { value: B.d.body });
hit.dispatchEvent(out);
ok(tip.hidden, '…and gone when you move away');
panel().querySelector('[data-prog-range="14"]').click();
ok(charts()[0].querySelectorAll('.prog-hit').length === 14 && charts()[1].querySelectorAll('.prog-hit').length === 14 && /by day/.test(panel().textContent) && B.ev('mapPrefs().progRange') === '14',
   'two weeks: day by day — and remembered');
panel().querySelector('[data-prog-range="all"]').click();
ok(charts()[0].querySelectorAll('.prog-hit').length === 41, 'all: from the first day of the history');
const wk = B.ev(`(() => { const h = loadHist('nouns', 'en-it'); let n = 0, r = 0; for (let d = ${t} - 6; d <= ${t}; d++) if (h[d]) { n += h[d].n; r += h[d].r; } return Math.round(r / n * 100); })()`);
panel().querySelector('[data-prog-range="90"]').click();
ok(new RegExp(`${wk}% right in your latest week`).test(panel().textContent), `getting it right: ${wk}% in the latest week`);
const due = B.ev(`(() => { const s = loadSrs('nouns', 'en-it'); return Object.values(s).filter(r => r.d - ${t} <= 0).length; })()`);
ok(new RegExp(`^${due} due today`).test([...panel().querySelectorAll('.prog-cap')].pop().textContent), `coming up in Ripasso: ${due} due today`);

// ---- Sync, reset, the other sections ----
const m = B.ev(`syncMergeHistory({ 5: { n: 10, r: 8, k: 3, p: 5 } }, { 5: { n: 14, r: 11, k: 4, p: 6 } }, { 5: { n: 13, r: 9, k: 5, p: 5 } })`);
ok(m[5].n === 17 && m[5].r === 12 && m[5].k === 5 && m[5].p === 6, 'synced from two devices: answers add up; known and practised take the larger');
B.w.confirm = () => true;
B.d.getElementById('reset-stats').click();
ok(!B.w.localStorage.getItem('sostantivi-stats-v1:hist'), 'reset progress clears its history too');
for (const s of ['verbs', 'irregular', 'adjectives', 'avverbi']) {
  const V = boot({ 'flipcards-subject': s });
  ok(V.d.getElementById('map-panel').querySelector('.endings-title').textContent === 'I progressi' && V.ev(`syncedKeys().get(SUBJECTS.${s}.statsKeys['en-it'] + ':hist')`) === 'history' && V.errors.length === 0, `${s}: I progressi too, its history synced`);
}
ok(B.errors.length === 0, 'no errors along the way');
done();
