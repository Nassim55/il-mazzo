const { boot, ok, done } = require('./harness');
const { d, ev, warns, errors } = boot();
ok(warns.length === 0 && errors.length === 0, 'loads with no validator warnings or errors');
ev("applySubject('verbs')");
ok(ev('verbData.every(v => VERB_NOTES[v.it])') && ev('Object.keys(VERB_NOTES).length') === ev('verbData.length'), `all ${ev('verbData.length')} verbs have a note`);
// Play every verb once (infinitive mode) and confirm its note renders after a correct AND a wrong answer
ev("verbMode = 'infinitives'; selectedNouns = new Set(verbData.map(v => v.it)); sessionMaxDeck = null; sessionPool = null; container.dataset.view = 'setup'; startGame();");
let shownRight = 0, shownWrong = 0, broken = [];
const n = ev('deck.length');
for (let i = 0; i < n; i++) {
  ev(`index = ${i}; render();`);
  const card = ev(`deck[${i}]`);
  d.getElementById('answer').value = i % 2 ? card.italian : 'sbagliato';
  d.getElementById('submit').click();
  const note = d.querySelector('.feedback-note');
  const expected = ev(`VERB_NOTES[deck[${i}].noun]`).replace(/<[^>]+>/g, ''); if (note && note.textContent === expected) (i % 2 ? shownRight++ : shownWrong++); else broken.push(card.noun);
}
ok(broken.length === 0 && shownRight + shownWrong === n, `every note renders cleanly (${shownRight} after right answers, ${shownWrong} after wrong ones${broken.length ? '; broken: ' + broken.join(', ') : ''})`);
// Stress tips quoted for infinitives must match the game's own pronunciation
const pron = it => ev(`cardsForItem(VERB_ITEMS.find(x => x.noun === '${it}'))[0].pron`);
ok(pron('temere') === 'te·mè·re' && pron('godere') === 'go·dè·re', `stress tips match: temere ${pron('temere')}, godere ${pron('godere')}`);
ok(errors.length === 0, 'no runtime errors');
done();
