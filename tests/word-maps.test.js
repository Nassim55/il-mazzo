// La mappa in the other word sections — regular verbs, irregular verbs, adjectives — as in
// Sostantivi: a line per topic, the known first and dotted, the % of the topic you know,
// topics ranked by it, a panel beside with the topic's items and actions, and the section's
// own chart under I progressi. The page's top: the intro and its controls left, Start right.
const { boot, ok, done } = require('./harness');

for (const [subj, chart, word] of [['verbs', 'Le desinenze', 'verb'], ['irregular', 'Gli irregolari', 'verb'], ['adjectives', 'Le concordanze', 'adjective']]) {
  const B = boot({ 'flipcards-subject': subj });
  const map = B.d.getElementById('noun-map');
  ok(map && map.querySelectorAll('.map-row').length === B.ev(`SUBJECTS.${subj}.themes.length`) && B.ev(`SUBJECTS.${subj}.themes`).every(t => map.querySelector(`.map-row[data-topic="${t.key}"]`).querySelectorAll('.map-cell').length === t.nouns.length),
     `${subj}: La mappa — a line per topic, a square per ${word}`);
  ok(B.d.getElementById('theme-row').hidden && !B.d.querySelector('.setup-side') && B.d.querySelector('details.grid-fold summary').textContent.startsWith(`Every ${word}, one by one`), `${subj}: the theme chips and side column give way to it; the ${word}s fold away underneath`);
  ok(B.d.querySelector('#map-panel .endings-title').textContent === 'I progressi' && B.d.querySelector('#map-panel .map-chart .endings-title').textContent === chart, `${subj}: the panel — I progressi, and ${chart} under it`);
  ok(B.d.querySelector('.bench-intro #mode-toggle') && B.d.querySelector('.bench-intro #direction-toggle') && (subj === 'adjectives' || B.d.querySelector('.bench-intro #person-picker')) && B.d.querySelector('.bench-actions #start-btn'),
     `${subj}: the intro and its controls on the left — practice mode${subj === 'adjectives' ? '' : ', persons'}, direction — Start on the right`);
  ok(new RegExp(`every topic, every ${word}`).test(map.textContent) && B.errors.length === 0, `${subj}: in its own words, without errors`);
}

// ---- Verb history in the verbs' own format counts; conjugating a verb right through makes it known ----
let B = boot({ 'flipcards-subject': 'verbs', 'verbi-regolari-stats': JSON.stringify({ parlare: { attempts: 6, wrongs: 0 }, cantare: { attempts: 6, wrongs: 5 } }) });
const topicOf = k => B.ev(`SUBJECTS.verbs.themes.find(t => t.nouns.includes(${JSON.stringify(k)})).key`);
const cell = k => [...B.d.querySelectorAll(`.map-row[data-topic="${topicOf(k)}"] .map-cell`)].find(c => c.title.startsWith(B.ev(`VERB_ITEMS.find(n => n.noun === ${JSON.stringify(k)}).it || ${JSON.stringify(k)}`)));
ok(cell('parlare') && cell('parlare').classList.contains('known') && /right 6 of 6 · known/.test(cell('parlare').title) && !cell('cantare').classList.contains('known'),
   'parlare, right 6 of 6 in the verbs\' own history: known; cantare, 1 of 6: not');
B.ev("verbMode = 'conjugations'; showSetup(); selectedNouns = new Set(['ballare']); updateReadout();");
B.d.getElementById('start-btn').click();
let guard = 0;
while (B.d.querySelector('.container').dataset.view === 'game' && B.ev('index < deck.length') && guard++ < 20) {
  B.d.getElementById('answer').value = B.ev('(currentCard ? currentCard() : deck[index]).italian'); B.d.getElementById('submit').click(); B.d.getElementById('submit').click();
}
B.ev('showSetup()');
ok(B.ev("knowState(loadSrs('verbs', 'en-it').ballare, readStats('verbs', 'en-it').ballare).known") && cell('ballare').classList.contains('known'), 'ballare, conjugated right through (six persons): known — every answer counts');
const scores = [...B.d.querySelectorAll('#noun-map .map-row')].map(r => parseInt(r.querySelector('.map-score').textContent, 10));
ok(scores.every((x, i) => i === 0 || scores[i - 1] >= x), 'topics ranked by how much of them you know');

// ---- A topic opens in the panel; its actions work on verbs ----
B.d.querySelector(`.map-row[data-topic="${topicOf('cantare')}"] .map-head`).click();
const panel = B.d.getElementById('map-panel');
ok(new RegExp(`\\d+ verbs · EN → IT`).test(panel.querySelector('.endings-sub').textContent) && /Or tap verbs one by one/.test(panel.textContent) && /To work on/.test(panel.textContent), 'the topic opens beside the map, in verbs');
panel.querySelector('[data-map-pick="weak"]').click();
ok(B.d.querySelector('.container').dataset.view === 'game' && B.ev('deck.every(c => c.noun === "cantare")'), 'Practise the weakest: a round of exactly those — cantare, conjugated');
B.ev('showSetup()');
B.d.querySelector('#subject-toggle [data-subject="adjectives"]').click();
ok(!B.d.querySelector('#noun-map .map-row.open') && B.d.querySelector('#map-panel .endings-title').textContent === 'I progressi', 'another section: no topic left open');
ok(B.errors.length === 0, 'no errors along the way');
done();
