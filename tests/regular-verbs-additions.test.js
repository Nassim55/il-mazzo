const { boot, ok, done } = require('./harness');
const NEW = require('./fixtures/added-regular-verbs.json');
const { d, ev, errors, warns } = boot();
ok(warns.length === 0 && errors.length === 0, 'loads with no validator warnings or errors');
d.querySelector('#subject-toggle [data-subject="verbs"]').click();
ok(d.querySelectorAll('.verb-chip').length === 150 && NEW.every(v => d.querySelector(`.verb-chip[data-noun="${v}"]`)), '150 verb chips, all 50 new ones present');
ok(ev('VERB_FREQUENCY_ORDER.length') === 150 && new Set(ev('VERB_FREQUENCY_ORDER')).size === 150 && ev('VERB_FREQUENCY_ORDER[0]') === 'vedere', 'ranking: 150 distinct verbs, vedere first');
const topics = ['comunicare', 'movimento', 'quotidiano', 'mente', 'inizio', 'persone'];
const untopiced = NEW.filter(v => !ev(`VERB_THEMES.filter(t => ${JSON.stringify(topics)}.includes(t.key)).some(t => t.nouns.includes('${v}'))`));
ok(untopiced.length === 0, `every new verb is in a topic theme${untopiced.length ? ' — missing: ' + untopiced : ''}`);
ok(ev("VERB_THEMES.find(t => t.key === 'cgare').nouns").includes('pregare') && ev("VERB_THEMES.find(t => t.key === 'cgare').nouns").includes('significare') && ev("VERB_THEMES.find(t => t.key === 'iare').nouns").includes('ringraziare'), 'pattern themes pick up the new verbs (pregare, significare → -care/-gare; ringraziare → -iare)');
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
// chiedere vs domandare are told apart
d.querySelector('.direction-toggle [data-dir="en-it"]').click();
const p = (v, person) => ev(`cardsForItem(VERB_ITEMS.find(x => x.noun === '${v}')).find(c => c.person === '${person}').english`);
ok(p('chiedere', 'io') === 'I ask for / request' && p('domandare', 'io') === 'I ask (a question)', `told apart: chiedo = "${p('chiedere', 'io')}", domando = "${p('domandare', 'io')}"`);
// Pronunciation overrides for early stress
const pr = (v, person) => ev(`cardsForItem(VERB_ITEMS.find(x => x.noun === '${v}')).find(c => c.person === '${person}').pron`);
ok(pr('significare', 'io') === 'si·gnì·fi·co' && pr('evitare', 'loro') === 'è·vi·ta·no' && pr('occupare', 'tu') === 'òc·cu·pi' && pr('meritare', 'lui') === 'mè·ri·ta' && pr('creare', 'io') === 'crè·o', 'early-stress pronunciations: si·gnì·fi·co, è·vi·ta·no, òc·cu·pi, mè·ri·ta, crè·o');
ok(errors.length === 0, 'no runtime errors');
done();
