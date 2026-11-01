// Mi piace: verbs like piacere, drilled — natural English in, the Italian turned round out.
// The thing liked is the subject; the person goes in the pronoun. Word for word after you
// answer; Why explains a slip.
const { boot, ok, done } = require('./harness');

const deal = (keys, dir = 'en-it') => {
  const B = boot({ 'flipcards-subject': 'mipiace' });
  B.ev(`direction = ${JSON.stringify(dir)}; selectedNouns = new Set(${JSON.stringify(keys)}); updateReadout();`);
  B.d.getElementById('start-btn').click();
  return B;
};
const key = (B, it) => B.ev(`sentenceKey(${JSON.stringify(it)})`);
const answer = (B, text) => { B.d.getElementById('answer').value = text; B.d.getElementById('submit').click(); return B.d.getElementById('feedback'); };
const why = fb => { const w = fb.querySelector('[class*=why]'); return w ? w.textContent.replace(/\s+/g, ' ').trim() : ''; };
const one = it => { const B0 = boot({ 'flipcards-subject': 'mipiace' }); const k = key(B0, it); return deal([k]); };

// ---- The section ----
let B = boot({ 'flipcards-subject': 'mipiace' });
ok(B.warns.length === 0 && B.errors.length === 0, 'loads cleanly — every word of every accepted answer in the deck, nothing twice, none of Scrittura\'s sentences again');
const tabs = [...B.d.querySelectorAll('#subject-toggle .mode-option')].map(b => b.textContent.trim());
ok(tabs[3] === 'Mi piace' && tabs[2] === 'Verbi irregolari' && tabs[4] === 'Aggettivi', 'Mi piace is a section of its own, after Verbi irregolari');
const levels = B.ev('MIPIACE_THEMES.map(t => t.label + ":" + t.nouns.length)');
ok(levels.length === 13 && B.ev('MIPIACE_ITEMS.length') === 116 && B.ev('MIPIACE_THEMES.every(t => t.nouns.length >= 6)'),
   `13 levels, 116 sentences (${levels.slice(0, 3).join(', ')}…)`);
ok(B.ev("MIPIACE_THEMES.map(t => t.key).join()") === 'piace-piacciono,lei-formale,piace-fare,a-marco,non-domande,a-me-si,mancare,servire-bastare,interessare,fare-male,sembrare,mi-piaci,modi-di-dire',
   'from piace or piacciono, through formal Le, activities, people by name, negatives and questions, a me / a te, to the other verbs, people as the subject and fixed expressions');
ok(B.ev("MIPIACE_ITEMS.every(n => !SENTENCE_ITEMS.some(s => s.it === n.it))") && B.ev("syncedKeys().get('mipiace-stats-v1')") === 'counters', 'none of Scrittura\'s sentences; its progress syncs like any section\'s');
const chart = B.d.querySelector('.phrases-panel[aria-label="Verbs like piacere"]');
ok(chart && /Come piacere/.test(chart.textContent) && chart.querySelectorAll('.eg-cell').length === 16 && /a Lei/.test(chart.textContent) && /The thing is the subject/.test(chart.textContent)
   && /bastare to be enough/.test(chart.textContent.replace(/\s+/g, ' ')), 'the setup shows the chart: a me → mi … a loro → gli (formal Le too), the agreement rule, the verbs');

// ---- Natural English in, the word for word after ----
B = one('Mi piace la spiaggia.');
ok(B.d.getElementById('prompt').textContent.trim() === 'I like the beach.' && B.d.getElementById('natural-en').hidden, 'the prompt is the natural English — the flip is yours to do');
let fb = answer(B, 'mi piace la spiaggia');
ok(fb.classList.contains('correct') && /Word for word/.test(fb.textContent) && /To me pleases the beach\./.test(fb.textContent), 'right (capitals and full stop optional), and the word for word shows the structure');
for (const alt of ['A me piace la spiaggia.', 'La spiaggia mi piace.']) {
  const X = one('Mi piace la spiaggia.');
  ok(answer(X, alt).classList.contains('correct'), `also right: ${alt}`);
}
B = one('Le piace la camera?');
ok(B.d.getElementById('prompt').textContent.trim() === 'Do you like the room? (formal)', 'formal you is marked, so there\'s one right answer (Le)');

// ---- Why ----
const cases = [
  ['Mi piacciono le fragole.', 'Mi piace le fragole.', /piacciono, not piace: le fragole are doing the pleasing — they are the subject, so the verb is plural/],
  ['Ti piace guidare?', 'Ti piacciono guidare?', /an activity — is doing the pleasing, and an activity counts as singular/],
  ['Le piace il cioccolato.', 'Gli piace il cioccolato.', /le, not gli: le is to her/],
  ['Ci piaci.', 'Ci piace.', /the subject is tu — you are doing the pleasing — so the verb takes the tu form/],
  ['Mi basta un caffè.', 'Mi bastano un caffè.', /basta, not bastano: un caffè is doing the being enough/],
  ['Le piace la camera?', 'Ti piace la camera?', /le, not ti: le is to you \(formal\)/],
  ['Non mi importa il prezzo.', 'Non mi importano il prezzo.', /importa, not importano: il prezzo is doing the mattering/],
  ['Mi fanno male gli occhi.', 'Mi fa male gli occhi.', /fanno, not fa: gli occhi are doing the hurting/],
];
for (const [right, wrong, re] of cases) {
  const X = one(right);
  const f = answer(X, wrong);
  ok(f.classList.contains('incorrect') && re.test(why(f)), `Why: ${wrong} → ${right}`);
}

// ---- The extra verbs, and the small words ----
B = boot({ 'flipcards-subject': 'mipiace' });
ok(B.ev("sentenceSegments('Mi basta').find(s => s.text === 'basta').ref") === 'extra:bastare' && B.ev("sentenceSegments('Non mi importa').find(s => s.text === 'importa').ref") === 'extra:importare'
   && !B.ev("verbData.some(v => v.it === 'bastare' || v.it === 'importare')"), 'bastare and importare are known to the sentences, without becoming conjugation cards ("I am enough", "I import")');
ok(['tutti', 'neanche', 'così', 'suoi'].every(w => B.ev(`!!sentenceSegments(${JSON.stringify(w)})[0].ref`)), 'tutti, neanche, così, suoi: small words the deck now knows');

// ---- Other directions, the chart in a round ----
B = deal([key(B, 'Mi manca l\'Italia.')], 'it-en');
ok(answer(B, 'I miss Italy').classList.contains('correct'), 'Italian → English: the natural English is the answer');
B = one('Gli piacciono i film vecchi.');
B.d.getElementById('chart-btn').click();
ok(!B.d.getElementById('chart-overlay').hidden && /Come piacere/.test(B.d.getElementById('chart-overlay').textContent), 'in a round, ▦ opens the chart');
ok(B.errors.length === 0, 'no errors along the way');
done();
