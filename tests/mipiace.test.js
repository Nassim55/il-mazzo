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
const groups = [...B.d.querySelectorAll('#theme-chips .theme-group')].map(g => g.querySelector('.theme-group-btn').textContent + ': ' + g.querySelectorAll('.theme-chip').length);
ok(B.ev('MIPIACE_ITEMS.length') === 116 && groups.join(' · ') === 'Il verbo: 7 · La frase: 4'
   && B.ev("MIPIACE_ITEMS.every(n => MIPIACE_THEMES.filter(t => t.group === 'verbo' && t.nouns.includes(n.noun)).length === 1 && MIPIACE_THEMES.some(t => t.group === 'frase' && t.nouns.includes(n.noun)))"),
   `116 sentences; the chips in two groups — the verb (each sentence under one) and the kind of sentence (${groups.join(' · ')})`);
ok(B.ev("MIPIACE_LEVELS.length") === 13 && B.ev("[...document.querySelectorAll('#verb-grid [data-noun]')].map(e => e.dataset.noun).join('|')") === B.ev("MIPIACE_ORDER.join('|')"),
   'the tiles keep the levels\' order, easiest first: piace or piacciono … fixed expressions');
const T = it => B.ev(`(() => { const n = MIPIACE_ITEMS.find(n => n.it === ${JSON.stringify(it)}); return [n.chi.join('+'), n.cosa.join('+'), n.verbo, n.frase.join('+')].join(' / '); })()`);
ok(T('Gli piacciono gli animali.') === 'lui / piu / piacere / affermative' && T('Mi fanno male gli occhi.') === 'mi / piu / fare-male / affermative'
   && T('Lei ti piace.') === 'ti / persona / piacere / affermative' && T('Ci piace andare al lago.') === 'ci / fare / piacere / affermative'
   && T('Gli piace viaggiare.') === 'loro / fare / piacere / affermative' && T('Le dispiace aspettare?') === 'Lei / fare / espressioni / domande',
   'each sentence sorted by who and what: gli occhi is an article, Lei ti piace is a person, al lago is a place, Gli piace viaggiare is "they"');
ok(T('Il gelato piace a tutti.') === 'nome / una / piacere / affermative' && T('Manco ai miei genitori.') === 'nome / persona / mancare / affermative'
   && T('Anche a me.') === 'mi / una / piacere / a-me' && T('Basta così.') === 'nessuno / una / servire-bastare / affermative'
   && T('A lui piacciono le montagne, a lei piace il mare.') === 'lui+lei / piu+una / piacere / a-me',
   '…and a + someone, a reply with no verb, nobody at all, two people in one sentence');
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
// ---- Chi and Che cosa: two rows that narrow the section ----
B = boot({ 'flipcards-subject': 'mipiace' });
const rowText = dim => [...B.d.querySelectorAll(`#mp-${dim} .mode-option`)].map(b => b.dataset.mpkey + ':' + b.querySelector('.type-count').textContent).join(' ');
ok(rowText('chi') === 'mi:31 ti:21 lui:12 lei:10 Lei:10 ci:10 vi:3 loro:5 nome:13 nessuno:6' && rowText('cosa') === 'una:72 piu:22 fare:13 persona:10'
   && B.d.querySelectorAll('.mp-toggle .mode-option.active').length === 14, 'Chi (mi, ti, gli, le, Le, ci, vi, gli for them, a Marco, nobody) and Che cosa (one thing, more, doing, a person) — all on, with counts');
const press = (dim, k) => B.d.querySelector(`#mp-${dim} [data-mpkey="${k}"]`).click();
const only = (dim, k) => { B.d.querySelector(`[data-mpall="${dim}"]`).click(); [...B.d.querySelectorAll(`#mp-${dim} .mode-option`)].map(b => b.dataset.mpkey).filter(x => x !== k).forEach(x => press(dim, x)); };
const tiles = () => [...B.d.querySelectorAll('#verb-grid [data-noun]')].map(e => B.ev(`MIPIACE_ITEMS.find(n => n.noun === ${JSON.stringify(e.dataset.noun)}).it`));
B.d.getElementById('select-all').click();
ok(B.ev('selectedNouns.size') === 116, '(all 116 picked to start with)');
only('chi', 'mi'); only('cosa', 'piu');
const miPiu = B.ev("MIPIACE_ITEMS.filter(n => n.chi.includes('mi') && n.cosa.includes('piu')).map(n => n.it)");
ok(miPiu.length >= 5 && tiles().join('|') === miPiu.join('|') && tiles().every(it => /\b(piacciono|mancano|servono|bastano|interessano|fanno|sembrano|restano)\b/.test(it))
   && rowText('cosa').startsWith('una:') && !rowText('cosa').startsWith('una:72'),
   `mi and più cose: just those (${tiles().join(' · ')}) — and the other row's counts follow`);
ok(B.ev("THEMES.every(t => t.nouns.every(k => nounData.some(n => n.noun === k)))") && B.d.querySelectorAll('#theme-chips .theme-chip').length < 11, 'the chips show only what\'s left');
B.d.getElementById('start-btn').click();
const miPiuKeys = B.ev("MIPIACE_ITEMS.filter(n => n.chi.includes('mi') && n.cosa.includes('piu')).map(n => n.noun)");
ok(B.ev("deck.length") === miPiu.length && B.ev("deck.every(c => " + JSON.stringify(miPiuKeys) + ".includes(c.noun))"), 'a round deals only those');
ok(JSON.stringify(JSON.parse(B.w.localStorage.getItem('mazzo-verb-persons-v1')).mipiace) === '{"chi":["mi"],"cosa":["piu"]}', 'kept with the persons (and synced)');
B.ev('showSetup()');
B.d.querySelector('[data-mpall="chi"]').click(); B.d.querySelector('[data-mpall="cosa"]').click();
ok(B.d.querySelectorAll('.mp-toggle .mode-option.active').length === 14 && tiles().length === 116 && B.ev('selectedNouns.size') === 116,
   'tutti: everything back — and the sentences picked before are picked again');
B = boot({ 'flipcards-subject': 'mipiace', 'mazzo-verb-persons-v1': JSON.stringify({ mipiace: { chi: ['mi'], cosa: ['piu'] } }) });
ok(B.d.querySelectorAll('#mp-chi .mode-option.active').length === 1 && tiles().length === miPiu.length, 'still there next time');
press('chi', 'mi');
ok(/Keep at least one in each row/.test(B.d.getElementById('mp-hint').textContent) && B.d.querySelectorAll('#mp-chi .mode-option.active').length === 1, 'a row can\'t be emptied');
B = boot({ 'flipcards-subject': 'mipiace', 'mazzo-verb-persons-v1': JSON.stringify({ mipiace: { chi: ['nessuno'], cosa: ['piu'] } }) });
const before = tiles().join('|');
press('cosa', 'persona'); press('cosa', 'piu');
ok(/No sentence has both/.test(B.d.getElementById('mp-hint').textContent) && tiles().join('|') === before && before === 'Mancano due persone.',
   'a mix with nothing in it (nobody, as a person) says so, and leaves the grid as it was');
ok(B.errors.length === 0, 'no errors along the way');
done();
