// Knowing a word (Nov 2026) — known when: right 5 times or more, and on 8 of your last 10 answers; no two
// mistakes in a row (3 right in a row win it back); wrong no more than 1 time in 4 over the last 20 answers;
// and right on 3 different days. Mistakes older than the last 20 answers are forgotten. Old history counts.
const { boot, ok, done } = require('./harness');

let B = boot({ 'flipcards-subject': 'nouns' });
const T0 = B.ev('today()');
const onDay = d => B.ev(`today = () => ${T0} + ${d}`);   // move the clock on, to answer on another day
const answer = (key, ...results) => results.forEach(r => B.ev(`srsAnswer('nouns', 'en-it', ${JSON.stringify(key)}, ${r})`));
const known = (key, s = null) => B.ev(`knowState(loadSrs('nouns', 'en-it')[${JSON.stringify(key)}], ${JSON.stringify(s)}).known`);
const why = key => B.ev(`knowState(loadSrs('nouns', 'en-it')[${JSON.stringify(key)}], null).why`);
const days = key => B.ev(`loadSrs('nouns', 'en-it')[${JSON.stringify(key)}].rd`);
const threeDays = key => B.ev(`(() => { const s = loadSrs('nouns', 'en-it'); s[${JSON.stringify(key)}].rd = 3; saveSrs('nouns', 'en-it', s); })()`);   // as if right on 3 days, to look at the other rules

// ---- Three different days: one long sitting doesn't make a word known ----
answer('pane', true, true, true, true);
ok(!known('pane'), 'a new noun, right 4 times: not yet');
answer('pane', true);
ok(!known('pane') && why('pane') === 'right on 1 day — needs 3 different days' && days('pane') === 1, 'right 5 times, all in one sitting: not yet — right on 1 day, it needs 3');
onDay(1); answer('pane', true);
ok(!known('pane') && days('pane') === 2, 'right again the next day: 2 days, not yet');
answer('pane', true);
ok(days('pane') === 2, 'right twice more that day: still 2 days — a day counts once');
onDay(2); answer('pane', true);
ok(known('pane') && why('pane') === '', 'and right on a third day: known');
onDay(3); answer('pane', false);
ok(days('pane') === 3, 'a mistake never takes days away');
B.ev("srsAnswer('nouns', 'en-it', 'pane', true, false)");
ok(days('pane') === 3, "Gira's own judgement doesn't count a day");

// ---- The last answers ----
answer('sole', ...Array(20).fill(true), false); threeDays('sole');
ok(known('sole'), 'a strong record and one slip: still known');
answer('mare', ...'1111111111110111101'.split('').map(x => x === '1')); threeDays('mare');
ok(known('mare'), 'two slips scattered through the last 10 (8 of 10 right): still known');
answer('vino', ...'1111111111011011011'.split('').map(x => x === '1')); threeDays('vino');
ok(!known('vino'), 'three (7 of 10): not known');
answer('riso', false, true, false, false, true, ...Array(10).fill(true)); threeDays('riso');
ok(known('riso'), 'mistakes made while learning it: 3 wrong in its last 15 is within 1 in 4 — known');
answer('luna', ...Array(18).fill(true), false, false); threeDays('luna');
ok(!known('luna'), 'two mistakes in a row: not known, however good the record');
answer('luna', true, true);
ok(!known('luna'), 'right twice since: not yet');
answer('luna', true);
ok(known('luna'), 'right three times in a row: known again');
ok(B.ev("loadSrs('nouns', 'en-it').sole.h.length") === 20, 'the last 20 answers are kept');
ok(B.ev("knowState({ h: '1111' }, null).why") === '1 more right answer to count'
   && B.ev("knowState({ h: '1111100' }, null).why") === 'two mistakes in a row — 3 right in a row win it back' && B.ev("knowState({ h: '1101101101' }, null).why") === 'right 7 of your last 10 — needs 8',
   'and why a noun isn\'t known yet: one more right · two mistakes in a row · right 7 of 10, needs 8');

// ---- Wrong often — in the last 20 answers only; older mistakes are forgotten ----
const ks = (h, seen, wrong, rd = 3) => B.ev(`knowState({ h: ${JSON.stringify(h)}, rd: ${rd} }, { seen: ${seen}, wrong: ${wrong} })`);
ok(ks('1111111111', 35, 13).known, "wrong 13 of 35 times overall, but 10 right lately, on 3 days: known — early mistakes don't hold it back");
ok(ks('00000111111111111111', 40, 9).known, '5 wrong in the last 20 (1 in 4): known — the limit');
const six = ks('00000011111111111111', 40, 10);
ok(!six.known && six.why === 'wrong 6 of your last 20 — 1 more right answer brings it to 1 in 4', '6 wrong in the last 20: not yet — 1 more right pushes the oldest mistake out');
ok(ks('11111111111111111111', 80, 40).known, 'mistakes older than the last 20 answers are forgotten, however many');

// ---- From before days were counted: an estimate, from Ripasso's box ----
ok(B.ev("knowState({ h: '1111111111', b: 4 }, { seen: 12, wrong: 0 }).known"), 'a word known by the old rule stays known');
const est = B.ev("knowState({ h: '1111111111', b: 2 }, { seen: 20, wrong: 8 })");
ok(!est.known && est.days === 1 && est.why === 'right on 1 day — needs 3 different days', 'one held back by the old rule: its box, less one for its mistakes — 1 day so far');
B.ev(`(() => { localStorage.setItem(statsKey(), JSON.stringify({ casa: { seen: 20, wrong: 8 } })); stats = loadStats();
  const s = loadSrs('nouns', 'en-it'); s.casa = { b: 2, d: today(), l: today() - 1, h: '1111111111' }; saveSrs('nouns', 'en-it', s); })()`);
answer('casa', false);
ok(days('casa') === 1, '…and the estimate is kept from its next answer on, even a wrong one');

// ---- Old history, from the totals ----
const hist = (seen, wrong) => B.ev(`knowState(null, { seen: ${seen}, wrong: ${wrong} }).known`);
ok(hist(5, 0) && hist(8, 1) && hist(20, 2) && hist(7, 1) && hist(10, 2), 'from before the log: 5 of 5, 7 of 8, 18 of 20, 6 of 7 and 8 of 10 right count as known');
ok(!hist(4, 0) && !hist(10, 3) && !hist(6, 3), '4 of 4, 7 of 10 and 3 of 6 don\'t');
B = boot({ 'flipcards-subject': 'nouns', 'sostantivi-stats-v1': JSON.stringify({ casa: { seen: 6, wrong: 0 } }) });
B.ev("selectedNouns = new Set(['casa']); updateReadout();"); B.d.getElementById('start-btn').click();
B.d.getElementById('answer').value = 'la cosa'; B.d.getElementById('submit').click();
const st = B.ev("({ ...knowState(loadSrs('nouns', 'en-it').casa, stats.casa) })");
ok(st.known && st.n === 7 && Math.round(st.right) === 6, `a slip after 6 of 6 from before: the 6 old answers and the new one — 6 of 7 right, still known`);

// ---- "I was right" takes the mistake back out of the log ----
B = boot({ 'flipcards-subject': 'nouns' });
B.ev("direction = 'it-en'; stats = loadStats(); selectedNouns = new Set(['casa']); updateReadout();");
B.d.getElementById('start-btn').click();
B.d.getElementById('answer').value = 'the hut'; B.d.getElementById('submit').click();
ok(B.ev("loadSrs('nouns', 'it-en').casa.h") === '0', '(a wrong Italian → English answer, logged)');
B.d.querySelector('.override-btn').click();
ok(B.ev("loadSrs('nouns', 'it-en').casa.h") === '1', '"I was right": logged as right instead');

// ---- The map uses it; Ripasso's schedule is its own ----
B = boot({ 'flipcards-subject': 'nouns' });
B.ev(`(() => { const t0 = today(); for (let i = 0; i < 5; i++) srsAnswer('nouns', 'en-it', 'pane', true); today = () => t0 + 1; srsAnswer('nouns', 'en-it', 'pane', true); today = () => t0 + 2; srsAnswer('nouns', 'en-it', 'pane', true); today = () => t0; document.getElementById('noun-map').innerHTML = nounMapInner(); })()`);
const topic = B.ev("NOUN_THEMES.find(t => t.nouns.includes('pane')).key");
ok(B.d.querySelector(`.map-row[data-topic="${topic}"] .map-cell.known`) && B.d.querySelector(`.map-row[data-topic="${topic}"] .map-cell.known`).title.includes(B.ev("NOUN_ITEMS.find(n => n.noun === 'pane').it")),
   'on the map: il pane, right 5 times one day and once on each of the next two, is dotted and counts');
ok(B.ev("loadSrs('nouns', 'en-it').pane.b") === 4, '— while Ripasso spaced it out, a box a day — and once known, 8 days away');
ok(B.errors.length === 0, 'no errors along the way');
done();
