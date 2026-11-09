// Knowing a word — the map's measure: right 5 times or more, and on 8 of your last 10
// answers; every answer counts, any day; a slip or two, scattered, doesn't undo it, two
// mistakes in a row do, until 3 right in a row. Old history counts, from the totals.
const { boot, ok, done } = require('./harness');

let B = boot({ 'flipcards-subject': 'nouns' });
const answer = (key, ...results) => results.forEach(r => B.ev(`srsAnswer('nouns', 'en-it', ${JSON.stringify(key)}, ${r})`));
const known = (key, s = null) => B.ev(`knowState(loadSrs('nouns', 'en-it')[${JSON.stringify(key)}], ${JSON.stringify(s)}).known`);

answer('pane', true, true, true, true);
ok(!known('pane'), 'a new noun, right 4 times: not yet');
answer('pane', true);
ok(known('pane'), 'right 5 times — all today, in one go — known: every answer counts, any day');
answer('sole', ...Array(20).fill(true), false);
ok(known('sole'), 'a strong record and one slip: still known');
answer('mare', ...'1111111111110111101'.split('').map(x => x === '1'));
ok(known('mare'), 'two slips scattered through the last 10 (8 of 10 right): still known');
answer('vino', ...'1111111111011011011'.split('').map(x => x === '1'));
ok(!known('vino'), 'three (7 of 10): not known');
answer('riso', false, true, false, false, true, ...Array(10).fill(true));
ok(known('riso'), 'mistakes made while learning it drop out once 10 newer answers push them out');
answer('luna', ...Array(18).fill(true), false, false);
ok(!known('luna'), 'two mistakes in a row: not known, however good the record');
answer('luna', true, true);
ok(!known('luna'), 'right twice since: not yet');
answer('luna', true);
ok(known('luna'), 'right three times in a row: known again');
ok(B.ev("loadSrs('nouns', 'en-it').sole.h.length") === 10, 'only the last 10 answers are kept');
ok(B.ev("knowState(loadSrs('nouns', 'en-it').pane, null).why") === '' && B.ev("knowState({ h: '1111' }, null).why") === '1 more right answer to count'
   && B.ev("knowState({ h: '1111100' }, null).why") === 'two mistakes in a row — 3 right in a row win it back' && B.ev("knowState({ h: '1101101101' }, null).why") === 'right 7 of your last 10 — needs 8',
   'and why a noun isn\'t known yet: one more right · two mistakes in a row · right 7 of 10, needs 8');

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
B.ev("for (let i = 0; i < 5; i++) srsAnswer('nouns', 'en-it', 'pane', true); document.getElementById('noun-map').innerHTML = nounMapInner();");
const topic = B.ev("NOUN_THEMES.find(t => t.nouns.includes('pane')).key");
ok(B.d.querySelector(`.map-row[data-topic="${topic}"] .map-cell.known`) && B.d.querySelector(`.map-row[data-topic="${topic}"] .map-cell.known`).title.includes(B.ev("NOUN_ITEMS.find(n => n.noun === 'pane').it")),
   'on the map: il pane, right 5 times today, is dotted and counts');
ok(B.ev("loadSrs('nouns', 'en-it').pane.b") === 1, '— while Ripasso still spaces it out: one box a day, as before');
ok(B.errors.length === 0, 'no errors along the way');
done();
