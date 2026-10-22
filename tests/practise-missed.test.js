const { boot, ok, done } = require('./harness');
const { w, d, ev, key, errors, warns } = boot();
const answer = (sel, raw) => { ev(`index = deck.findIndex(${sel}); render();`); d.getElementById('answer').value = raw; d.getElementById('submit').click(); };
const finish = () => ev('index = deck.length; render();');
const missedShown = () => [...d.querySelectorAll('.missed-item')].map(e => e.textContent);
const btn = () => d.getElementById('practise-missed');
const slider = id => { const el = d.getElementById(id); return el && { value: +el.value, min: +el.min, max: +el.max, name: el.closest('.trim-slider').querySelector('.trim-name').textContent }; };
const setSlider = (id, v) => { const el = d.getElementById(id); el.value = String(v); el.dispatchEvent(new w.Event('change')); };
ok(warns.length === 0 && errors.length === 0, 'loads cleanly');
// ---- Nouns: 2 wrong (one typed, one skipped), 2 right ----
ev("selectedNouns = new Set(['pane', 'casa', 'libro', 'acqua']); updateReadout();");
d.getElementById('start-btn').click();
answer("c => c.noun === 'pane'", 'la pane');
answer("c => c.noun === 'casa'", '');
answer("c => c.noun === 'libro'", 'il libro');
answer("c => c.noun === 'acqua'", "l'acqua");
finish();
ok(btn() && btn().textContent === '↻ Practise the 2 I missed', `button: "${btn() && btn().textContent}"`);
ok(JSON.stringify(missedShown().sort()) === JSON.stringify(['il pane', 'la casa']), `missed list: ${missedShown().join(', ')} (a skip counts)`);
const actions = [...d.querySelectorAll('.complete-actions button')].map(b => `${b.id}:${b.className}`);
ok(d.getElementById('play-again').textContent === '↻ Play all 4 again' && actions[0] === 'play-again:submit' && actions[1] === 'practise-missed:submit secondary',
   'Play all 4 again is the main button, first; Practise the ones I missed sits beside it, outlined');
btn().click();
ok(ev('container.dataset.view') === 'game' && JSON.stringify(ev('deck.map(c => c.noun).sort()')) === JSON.stringify(['casa', 'pane']) && d.getElementById('total').textContent === '2', 'review round: the 2 missed cards in play');
ok(ev('sessionPool.length') === 4, 'the pool is still the full original set of 4 (a filter, not a new deck)');
ok(!d.getElementById('game-trim-input') && slider('game-trim-focus').name === 'Missed' && slider('game-trim-focus').value === 2 && slider('game-trim-focus').max === 2
   && slider('game-trim-rest').name === 'The rest' && slider('game-trim-rest').value === 0 && slider('game-trim-rest').max === 2, 'Deck size becomes two sliders: Missed 2 of 2, and The rest 0 of 2');
d.getElementById('game-focus-btn').click();
ok(d.getElementById('focus-total').textContent === '4' && JSON.stringify(ev('[...focusChecked].sort()')) === JSON.stringify(['casa', 'pane']), 'Focus lists all 4, with only the missed 2 ticked');
d.getElementById('focus-cancel') ? d.getElementById('focus-cancel').click() : ev('closeFocusModal()');
answer("c => c.noun === 'pane'", 'il pane');
answer("c => c.noun === 'casa'", 'la caza');
finish();
ok(btn() && btn().textContent === '↻ Practise the one I missed' && missedShown().join() === 'la casa' && /FINE DEL RIPASSO/.test(d.querySelector('.badge').textContent), 'still missed one → "Practise the one I missed" (la casa)');
btn().click();
ok(ev('sessionPool.length') === 4 && ev('deck.length') === 1, 'a review of a review still filters the original 4');
answer("c => c.noun === 'casa'", 'la casa');
finish();
ok(!btn() && /Tutto giusto/.test(d.querySelector('.msg').textContent) && d.getElementById('play-again').className === 'submit', 'all fixed → "Tutto giusto!", no practise button');
d.getElementById('play-again').click();
ok(JSON.stringify(ev('deck.map(c => c.noun)')) === JSON.stringify(['casa']), 'Play again inside a review replays just the review cards');
d.getElementById('change-btn').click();
d.getElementById('start-btn').click();
ok(ev('deck.length') === 4 && !ev('sessionIsReview'), 'back to setup → a fresh round of all 4, not a review');
// ---- "I was right" takes a card out ----
d.querySelector('.direction-toggle [data-dir="it-en"]').click();
answer("c => c.noun === 'pane'", 'loaf');
d.getElementById('override-btn').click();
answer("c => c.noun === 'casa'", 'car');
finish();
ok(missedShown().join() === 'la casa', `an "I was right" override is not counted as missed (${missedShown().join(', ')})`);
d.querySelector('.direction-toggle') ; d.getElementById('back-to-setup').click();
// ---- Verbs: individual forms; a skip is neutral for history but still missed ----
d.querySelector('#subject-toggle [data-subject="verbs"]').click();
ev("selectedNouns = new Set(['capire']); updateReadout(); verbMode = 'conjugations';");
d.getElementById('start-btn').click();
if (ev('direction') !== 'en-it') d.querySelector('.direction-toggle [data-dir="en-it"]').click();
const before = JSON.stringify(JSON.parse(w.localStorage.getItem('verbi-regolari-stats') || '{}').capire || null);
answer("c => c.person === 'io'", 'io capiscio');
answer("c => c.person === 'noi'", '');
for (const p of ['tu', 'lui', 'voi', 'loro']) answer(`c => c.person === '${p}'`, ev(`deck.find(c => c.person === '${p}').italian`));
finish();
ok(JSON.stringify(missedShown().sort()) === JSON.stringify(['io capisco', 'noi capiamo']), `verbs: just the missed forms, with their pronoun (${missedShown().join(', ')})`);
btn().click();
ok(JSON.stringify(ev('deck.map(c => c.key).sort()')) === JSON.stringify(['capire|io', 'capire|noi']), 'verb review round: capire|io and capire|noi only');
ok(slider('game-trim-focus').value === 2 && slider('game-trim-focus').max === 2 && slider('game-trim-rest').max === 4, 'verbs: Missed 2 of 2, with the other 4 forms of capire as The rest');
setSlider('game-trim-rest', 4);
ok(ev('deck.length') === 6 && new Set(ev('deck.map(c => c.key)')).size === 6 && ev("deck.slice(0, 2).every(c => ['capire|io', 'capire|noi'].includes(c.key))"), 'growing to all brings back the other 4 forms (after the missed 2)');
d.getElementById('game-focus-btn').click();
ev("focusChecked = new Set(['capire']); applyFocus();");
ok(!ev('sessionIsReview') && slider('game-trim-focus').name === 'Focus' && !d.getElementById('game-trim-rest'), 'applying your own Focus pick ends the review (the slider says Focus; nothing is left over)');
d.getElementById('change-btn').click();
// ---- Adjectives (All forms) and phrases ----
d.querySelector('#subject-toggle [data-subject="adjectives"]').click();
d.querySelector('#mode-toggle [data-mode="forms"]').click();
ev("selectedNouns = new Set(['piccolo']); updateReadout();");
d.getElementById('start-btn').click();
answer("c => c.key === 'piccolo|fpl'", 'piccoli');
finish();
ok(missedShown().join() === 'piccole', 'adjectives: the missed form (piccole)');
btn().click();
ok(JSON.stringify(ev('deck.map(c => c.key)')) === JSON.stringify(['piccolo|fpl']), 'adjective review round: piccolo|fpl');
d.getElementById('change-btn').click();
d.querySelector('#subject-toggle [data-subject="phrases"]').click();
ev("selectedNouns = new Set(['grazie', 'in-bocca-al-lupo']); updateReadout();");
d.getElementById('start-btn').click();
answer("c => c.noun === 'in-bocca-al-lupo'", 'buona fortuna');
answer("c => c.noun === 'grazie'", 'grazie');
finish();
ok(missedShown().join() === 'In bocca al lupo!' && btn().textContent === '↻ Practise the one I missed', 'phrases: "In bocca al lupo!" → Practise the one I missed');
// ---- No misses: no button ----
btn().click(); answer("c => c.noun === 'in-bocca-al-lupo'", 'in bocca al lupo'); finish();
ok(!btn() && !d.querySelector('.missed'), 'nothing missed → no list and no button');
ok(errors.length === 0, `no runtime errors ${errors.join('; ')}`);
// ---- Enter on the summary plays the round again, like its main button ----
{
  const E = boot({ 'flipcards-subject': 'phrases' });
  E.ev("selectedNouns = new Set(PHRASE_ITEMS.slice(0, 2).map(n => n.noun)); updateReadout();");
  E.d.getElementById('start-btn').click();
  for (let k = 0, n = E.ev('deck.length'); k < n; k++) {
    E.d.getElementById('answer').value = k === 0 ? 'sbagliato' : E.ev('deck[index].italian'); E.d.getElementById('submit').click();
    if (k === 0) E.d.getElementById('answer').value = E.ev('deck[index].italian');
    E.d.getElementById('submit').click();
  }
  const onSummary = !!E.d.querySelector('.complete') && !!E.d.getElementById('practise-missed');
  E.d.dispatchEvent(new E.d.defaultView.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  ok(onSummary && !E.d.querySelector('.complete') && E.ev('index') === 0 && E.ev('deck.length') === 2, 'Enter on the summary plays all of the round again, like its main button');
}
done();
