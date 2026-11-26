// Regular verbs 151–200 (Nov 2026): the next 50 present-regular verbs by frequency, ranked
// by the same blend as 101–150, each placed among the 200 where it earns its rank
const { boot, ok, done } = require('./harness');
const NEW = ['preoccupare', 'crescere', 'risolvere', 'riconoscere', 'aggiungere', 'gestire', 'proteggere', 'nascondere', 'muovere', 'ritornare',
  'dipendere', 'riportare', 'indossare', 'partecipare', 'condividere', 'tagliare', 'ammettere', 'alzare', 'rubare', 'superare',
  'richiedere', 'insegnare', 'discutere', 'organizzare', 'buttare', 'scherzare', 'comprendere', 'promettere', 'colpire', 'aumentare',
  'confermare', 'apprezzare', 'assicurare', 'rompere', 'attaccare', 'votare', 'respirare', 'nascere', 'distruggere', 'notare',
  'rischiare', 'guadagnare', 'volare', 'migliorare', 'assumere', 'rispettare', 'riferire', 'scommettere', 'agire', 'procedere'];
const OCT = require('./fixtures/added-regular-verbs.json');
const { d, ev, errors, warns } = boot();
ok(warns.length === 0 && errors.length === 0, 'loads with no validator warnings or errors');
d.querySelector('#subject-toggle [data-subject="verbs"]').click();
ok(d.querySelectorAll('.verb-chip').length === 200 && NEW.every(v => d.querySelector(`.verb-chip[data-noun="${v}"]`)), '200 verb chips, all 50 new ones present');
ok(ev(`[...new Set(verbData.map(v => v.it))].length`) === 200 && !NEW.some(v => ev(`irregularVerbData.some(x => x.it === '${v}') || SENT_EXTRA_VERBS.some(x => x.it === '${v}')`)), 'no verb twice, none of them irregular or a sentence-only verb');
// The ranking: the first 150 keep their order; the new ones take the places they earn
const order = ev('VERB_FREQUENCY_ORDER');
const old = order.filter(v => !NEW.includes(v));
ok(order.length === 200 && new Set(order).size === 200 && NEW.every(v => order.includes(v)), 'ranking: 200 distinct verbs');
ok(old.length === 150 && old[0] === 'vedere' && old[149] === 'domandare' && old.indexOf('pensare') === 1 && old.indexOf('piangere') < old.indexOf('guidare'), 'the first 150 keep their order (vedere first, domandare last)');
ok(order.indexOf('preoccupare') === 106 && order.indexOf('procedere') === 180 && order.indexOf('crescere') < order.indexOf('scommettere') && order.slice(-5).every(v => !NEW.includes(v)),
   `the new ones sit among the others by frequency (preoccupare ${order.indexOf('preoccupare') + 1}, procedere ${order.indexOf('procedere') + 1}; the rarest old ones still last)`);
ok(ev("VERB_BANDS.map(b => b.label).join()") === '1–50,51–100,101–150,151–200', 'four bands of 50');
// Topics and patterns
const topics = ['comunicare', 'movimento', 'quotidiano', 'mente', 'inizio', 'persone'];
const untopiced = NEW.filter(v => !ev(`VERB_THEMES.filter(t => ${JSON.stringify(topics)}.includes(t.key)).some(t => t.nouns.includes('${v}'))`));
ok(untopiced.length === 0, `every new verb is in a topic theme${untopiced.length ? ' — missing: ' + untopiced : ''}`);
const th = k => ev(`VERB_THEMES.find(t => t.key === '${k}').nouns`);
ok(['gestire', 'colpire', 'riferire', 'agire'].every(v => th('isc').includes(v)) && ['tagliare', 'rischiare'].every(v => th('iare').includes(v)) && th('cgare').includes('attaccare') && th('ere').includes('nascere'),
   'pattern themes pick them up (gestire, colpire, riferire, agire → -isc-; tagliare, rischiare → -iare; attaccare → -care)');
// Play every new conjugation, both directions
ev(`verbMode = 'conjugations'; selectedNouns = new Set(${JSON.stringify(NEW)}); sessionMaxDeck = null; sessionPool = null; startGame();`);
ok(ev('deck.length') === 300, '50 new verbs → 300 cards');
let right = 0, wrongs = [];
for (let i = 0; i < 300; i++) {
  ev(`index = ${i}; render();`);
  const c = ev(`deck[${i}]`);
  d.getElementById('answer').value = `${c.pronounLabel.split(' / ')[0]} ${c.italian}`; d.getElementById('submit').click();
  if (d.getElementById('feedback').className.includes(' correct')) right++; else wrongs.push(`${c.pronounLabel} ${c.italian}`);
}
ok(right === 300, `EN→IT: all 300 accepted with their pronoun (${right})${wrongs.length ? ' — ' + wrongs.slice(0, 4) : ''}`);
d.querySelector('.direction-toggle [data-dir="it-en"]').click();
right = 0; wrongs = [];
for (let i = 0; i < ev('deck.length'); i++) {
  ev(`index = ${i}; render();`);
  const c = ev(`deck[${i}]`);
  d.getElementById('answer').value = c.english.split(' / ')[0]; d.getElementById('submit').click();
  if (d.getElementById('feedback').className.includes(' correct')) right++; else wrongs.push(`${c.italian} → ${c.english}`);
}
ok(right === 300, `IT→EN: all 300 accepted with their first meaning (${right})${wrongs.length ? ' — ' + wrongs.slice(0, 4) : ''}`);
// English spelled either way: organise = organize, recognise = recognize (and still nothing else)
const card = (v, p) => `cardsForItem(VERB_ITEMS.find(x => x.noun === '${v}')).find(c => c.person === '${p}')`;
const en = (v, p, guess) => ev(`checkVerbAnswer(${JSON.stringify(guess)}, ${card(v, p)}, true).correct`);
ok(en('organizzare', 'io', 'I organise') && en('organizzare', 'io', 'I organize') && en('riconoscere', 'lui', 'he recognizes') && en('riconoscere', 'lui', 'she recognises') && !en('organizzare', 'io', 'I organ'),
   'IT→EN takes -ise or -ize: I organise / organize, he recognizes');
// Told apart from the verbs they sit beside
const prompt = (v, p) => ev(`${card(v, p)}.english`);
ok(prompt('ritornare', 'io') !== prompt('tornare', 'io') && prompt('richiedere', 'io') !== prompt('chiedere', 'io') && prompt('indossare', 'io') !== prompt('portare', 'io') && prompt('nascere', 'noi') === 'we are born',
   `told apart: ritorno = "${prompt('ritornare', 'io')}", richiedo = "${prompt('richiedere', 'io')}", indosso = "${prompt('indossare', 'io')}"`);
// Pronunciations: early stress, the e-o of preoccupare, and sch starting a syllable (ri·schio)
const pr = (v, p) => ev(`${card(v, p)}.pron`);
ok(pr('partecipare', 'io') === 'par·tè·ci·po' && pr('superare', 'loro') === 'sù·pe·ra·no' && pr('preoccupare', 'noi') === 'pre·oc·cu·pià·mo' && pr('rischiare', 'io') === 'rì·schio' && pr('rischiare', 'noi') === 'ri·schià·mo',
   `pronunciations: ${pr('partecipare', 'io')}, ${pr('superare', 'loro')}, ${pr('preoccupare', 'noi')}, ${pr('rischiare', 'io')}`);
ok(OCT.every(v => order.includes(v)), 'the October 50 are all still there');
// Il mio italiano: each counts, and a form shared with a noun is split between them
ok(NEW.every(v => ev(`IT_WEIGHTS['${v}'] > 0`)) && ev("IT_WEIGHTS.voto") === 57.5 && ev("IT_WEIGHTS.rispetto") === 165.5,
   'each weighs in for everyday Italian; voto and rispetto now share their weight with votare and rispettare');
ok(errors.length === 0, 'no runtime errors');
done();
