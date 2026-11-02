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
ok(tabs[3] === 'Verbi al contrario' && tabs[2] === 'Verbi irregolari' && tabs[4] === 'Aggettivi' && B.ev('SUBJECTS.mipiace.subtitle') === 'Il Mazzo · Verbs that work backwards',
   'renamed Verbi al contrario — the verbs that work backwards — next to the other verb sections');
ok(B.ev('MIPIACE_ITEMS.length') === 133 && B.ev('MP_BACKWARDS.length') === 20 && B.ev("MP_BACKWARDS.every(r => MIPIACE_ITEMS.some(n => n.it === r[3]) && MIPIACE_ITEMS.some(n => n.lemma === r[0]))"),
   '133 sentences across 20 backwards verbs — every verb has some, and its example is one of them');
ok(B.ev("MIPIACE_LEVELS.length") === 14 && B.ev("[...document.querySelectorAll('#verb-grid [data-noun]')].map(e => e.dataset.noun).join('|')") === B.ev("MIPIACE_ORDER.join('|')"),
   'the tiles keep the levels\' order, easiest first: piace or piacciono … fixed expressions, then the newer verbs');
const T = it => B.ev(`(() => { const n = MIPIACE_ITEMS.find(n => n.it === ${JSON.stringify(it)}); return [n.chi.join('+'), n.cosa.join('+'), n.lemma, n.frase.join('+')].join(' / '); })()`);
ok(T('Gli piacciono gli animali.') === 'lui / piu / piacere / affermative' && T('Mi fanno male gli occhi.') === 'mi / piu / fare male / affermative'
   && T('Lei ti piace.') === 'ti / persona / piacere / affermative' && T('Ci piace andare al lago.') === 'ci / fare / piacere / affermative'
   && T('Gli piace viaggiare.') === 'loro / fare / piacere / affermative' && T('Le dispiace aspettare?') === 'Lei / fare / dispiacere / domande',
   'each sentence sorted by who and what: gli occhi is an article, Lei ti piace is a person, al lago is a place, Gli piace viaggiare is "they"');
ok(T('Il gelato piace a tutti.') === 'nome / una / piacere / affermative' && T('Manco ai miei genitori.') === 'nome / persona / mancare / affermative'
   && T('Anche a me.') === 'mi / una / piacere / a-me' && T('Basta così.') === 'nessuno / una / bastare / affermative'
   && T('A lui piacciono le montagne, a lei piace il mare.') === 'lui+lei / piu+una / piacere / a-me'
   && T('Ti conviene partire domani.') === 'ti / fare / convenire / affermative' && T('Le conviene prendere il treno.') === 'Lei / fare / convenire / affermative',
   '…and a + someone, a reply with no verb, nobody at all, two people in one sentence, conviene');
ok(T('Cosa ti succede?') === 'ti / una / succedere / domande' && T('Capita a tutti.') === 'nome / una / capitare / affermative' && T('Mi rimangono due giorni.') === 'mi / piu / rimanere / affermative'
   && T('Cosa Le occorre?') === 'Lei / una / occorrere / domande' && T('Mi pare di sì.') === 'mi / una / parere / affermative' && T('Spetta a te decidere.') === 'ti / fare / spettare / a-me'
   && T('Le scarpe ti stanno bene.') === 'ti / piu / stare bene / affermative',
   'the newer verbs too: succede, capita, rimangono, occorre, pare, spetta, stanno bene (le scarpe is an article again)');

// ---- The backwards verbs, listed: on the setup, in a round, on every card ----
const cards = [...B.d.querySelectorAll('#mp-choose .mp-verb')];
const firstCard = cards[0].textContent.replace(/\s+/g, ' ').trim();
ok(cards.length === 20 && cards.slice(0, 5).map(c => c.querySelector('.mpv-it').textContent).join() === 'piacere,dispiacere,mancare,sembrare,servire'
   && cards.some(c => c.querySelector('.mpv-it').textContent === 'stare bene') && /roughly the most common first/.test(B.d.getElementById('mp-choose').textContent)
   && /^piacere 55 to like literally, to be pleasing to Mi piace la spiaggia\.$/.test(firstCard),
   `the setup lists the twenty backwards verbs you\'ll meet most — what each means, what it literally says, a sentence (${firstCard})`);
const panel = B.d.querySelector('.phrases-panel[aria-label="Verbs like piacere"]');
ok(panel && panel.querySelectorAll('.mpv-row').length === 0 && panel.querySelectorAll('.eg-cell').length === 16 && /The thing is the subject/.test(panel.textContent),
   'the chart beside them keeps the pronouns and the rules, without listing the verbs twice');
ok(B.d.querySelectorAll('#theme-chips .theme-chip').length === 0 && !B.d.querySelector('.mp-toggle'), 'no second set of chips, no filter rows: one way to choose');
const noteOf = it => B.ev(`MIPIACE_ITEMS.find(n => n.it === ${JSON.stringify(it)}).note`).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
ok(/^The backwards verb mancare , to miss — literally, to be missing to Word for word To me lacks the Italy\.$/.test(noteOf("Mi manca l'Italia."))
   && /backwards verb fare male , to hurt/.test(noteOf('Mi fa male la schiena.')) && /backwards verb stare bene , to suit/.test(noteOf('Ti sta bene il rosso.')) && /backwards verb piacere /.test(noteOf('Anche a me.')),
   'after answering, each card names its backwards verb before the word for word');
ok(B.ev("MIPIACE_ITEMS.every(n => !SENTENCE_ITEMS.some(s => s.it === n.it))") && B.ev("syncedKeys().get('mipiace-stats-v1')") === 'counters', 'none of Scrittura\'s sentences; its progress syncs like any section\'s (the stores keep their names, so nothing is lost)');

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
ok(['succede', 'capita', 'occorre', 'spetta'].every(w => B.ev(`sentenceSegments('Mi ${w}').find(s => s.text === '${w}').ref`) === 'extra:' + { succede: 'succedere', capita: 'capitare', occorre: 'occorrere', spetta: 'spettare' }[w]),
   'succedere, capitare, occorrere and spettare are known to the sentences without cards of their own, like bastare and importare');
ok(['tutti', 'neanche', 'così', 'suoi'].every(w => B.ev(`!!sentenceSegments(${JSON.stringify(w)})[0].ref`)), 'tutti, neanche, così, suoi: small words the deck now knows');

// ---- Other directions, the chart in a round ----
B = deal([key(B, 'Mi manca l\'Italia.')], 'it-en');
ok(answer(B, 'I miss Italy').classList.contains('correct'), 'Italian → English: the natural English is the answer');
B = one('Gli piacciono i film vecchi.');
B.d.getElementById('chart-btn').click();
ok(!B.d.getElementById('chart-overlay').hidden && /Come piacere/.test(B.d.getElementById('chart-overlay').textContent), 'in a round, ▦ opens the chart');
ok(B.errors.length === 0, 'no errors along the way');
// ---- One way to choose: every tap chooses sentences ----
B = boot({ 'flipcards-subject': 'mipiace' });
const press = (g, k) => B.d.querySelector(`#mp-choose [data-mpg="${g}"][data-mpk="${k}"]`).click();
const chosen = () => B.ev('[...selectedNouns].sort().join("|")');
const expect = f => B.ev(`MIPIACE_ITEMS.filter(n => ${f}).map(n => n.noun).sort().join("|")`);
const lit = () => [...B.d.querySelectorAll('#verb-grid .verb-chip:not(.unselected)')].length;
const readout = () => B.d.querySelector('.deck-readout').textContent.replace(/\s+/g, ' ').trim();
ok(B.ev('selectedNouns.size') === 0 && B.d.querySelectorAll('#mp-choose .on').length === 0 && !B.d.getElementById('mp-clear'), 'nothing chosen to start with');
press('chi', 'mi');
const nMi = B.ev("MIPIACE_ITEMS.filter(n => n.chi.includes('mi')).length");
ok(chosen() === expect("n.chi.includes('mi')") && nMi > 30 && lit() === nMi && readout().startsWith(`${nMi} sentences`) && B.d.querySelector('[data-mpk="mi"]').classList.contains('on'),
   `tap mi: its ${nMi} sentences are chosen — lit in the grid, and counted`);
press('cosa', 'piu');
ok(chosen() === expect("n.chi.includes('mi') && n.cosa.includes('piu')") && B.ev('[...selectedNouns].every(k => /\\b(piacciono|mancano|fanno|sembrano|restano|rimangono)\\b/.test(MIPIACE_ITEMS.find(n => n.noun === k).it))'),
   'then più cose: another row narrows it — just Mi piacciono…, Mi mancano…, Mi fanno male…');
press('chi', 'ti');
ok(chosen() === expect("(n.chi.includes('mi') || n.chi.includes('ti')) && n.cosa.includes('piu')"), 'ti as well: the same row widens it — mi or ti, still più cose');
const nMancare = B.ev("MIPIACE_ITEMS.filter(n => n.lemma === 'mancare' && (n.chi.includes('mi') || n.chi.includes('ti')) && n.cosa.includes('piu')).length");
ok(B.d.querySelector('[data-mpg="lemma"][data-mpk="mancare"] .mp-count').textContent === String(nMancare) && B.d.querySelector('[data-mpg="lemma"][data-mpk="spettare"]').classList.contains('none'),
   'each verb shows how many it would bring, given the rest — and the ones with none fade');
press('lemma', 'piacere');
ok(chosen() === expect("n.lemma === 'piacere' && (n.chi.includes('mi') || n.chi.includes('ti')) && n.cosa.includes('piu')") && B.ev('selectedNouns.size') === 2, 'and a verb narrows it again (Mi piacciono le fragole, Ti piacciono le canzoni italiane)');
B.d.getElementById('start-btn').click();
ok(B.ev('deck.length') === 2 && B.ev(`deck.every(c => ${JSON.stringify(chosen().split('|'))}.includes(c.noun))`), 'a round deals just those');
B.ev('showSetup()');
ok(B.d.querySelectorAll('#mp-choose .on').length === 4 && B.ev('selectedNouns.size') === 2, 'back at the setup, the taps and the choice are as they were');
B.d.getElementById('mp-clear').click();
ok(B.ev('selectedNouns.size') === 0 && B.d.querySelectorAll('#mp-choose .on').length === 0, 'clear: nothing chosen again');
press('lemma', 'succedere'); press('lemma', 'capitare');
ok(chosen() === expect("['succedere', 'capitare'].includes(n.lemma)") && B.ev('selectedNouns.size') === 4, 'two verbs: both verbs\' sentences');
const tile = B.d.querySelector('#verb-grid .verb-chip:not(.unselected)');
tile.dispatchEvent(new B.w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
ok(B.ev('selectedNouns.size') === 3 && B.d.querySelectorAll('#mp-choose .on').length === 2, 'a tile can still be dropped by hand — the taps stay');
B.d.getElementById('select-all').click();
ok(B.ev('selectedNouns.size') === 133 && B.d.querySelectorAll('#mp-choose .on').length === 0, 'Select all takes the lot, and the taps start again');
press('frase', 'domande');
ok(chosen() === expect("n.frase.includes('domande')"), '…and the next tap chooses afresh (just the questions)');
B.d.getElementById('random-20').click();
ok(B.ev('selectedNouns.size') === 20 && B.d.querySelectorAll('#mp-choose .on').length === 0, 'Random 20 too');
ok(B.errors.length === 0, 'no errors along the way');
done();
