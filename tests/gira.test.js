// Gira (Nov 2026): practise without typing — turn the card, then Knew it / Not yet. It counts in
// the round and moves the card along Ripasso, but only typed answers count towards knowing a word.
const { boot, ok, done } = require('./harness');

let B = boot({ 'flipcards-subject': 'nouns' });
let d = B.d, ev = B.ev, c = d.getElementById('container');
ev("clearHand(); topicsIn(['tempo']); updateReadout();");
d.getElementById('start-btn').click();
ok(c.dataset.answerMode === 'type' && d.querySelector('[data-answer-mode-btn="type"]').classList.contains('active'), 'a round starts in Scrivi: type the answer, as before');
d.querySelector('[data-answer-mode-btn="turn"]').click();
ok(c.dataset.answerMode === 'turn' && B.w.localStorage.getItem('mazzo-answer-mode') === 'turn' && !d.getElementById('gira-turn').hidden && d.getElementById('gira-yes').hidden,
   'Gira: Gira la carta instead of the answer box — and this device remembers the choice');
const card0 = ev('deck[0]'), k0 = JSON.stringify(card0.noun);
const statsBefore = JSON.stringify(ev(`stats[${k0}] || null`)), hBefore = ev(`(loadSrs(subject, direction)[${k0}] || {}).h || ''`);
d.getElementById('gira-turn').click();
ok(d.querySelector('.gira-answer').textContent === card0.italian && !d.getElementById('gira-yes').hidden && !d.getElementById('gira-no').hidden,
   `turned: the answer on the card (${card0.italian}), then Knew it / Not yet`);
d.getElementById('gira-yes').click();
const r0 = ev(`loadSrs(subject, direction)[${k0}]`);
ok(d.getElementById('score').textContent === '1' && ev('index') === 1 && r0 && r0.d > ev('today()') && (r0.h || '') === hBefore && JSON.stringify(ev(`stats[${k0}] || null`)) === statsBefore,
   'Knew it: it counts in the round and moves along Ripasso — not towards knowing the word (its record, the map and I progressi are untouched)');
d.getElementById('gira-turn').click();
const card1 = ev('deck[1]');
d.getElementById('gira-no').click();
ok(ev(`roundMissed.has(${JSON.stringify(card1.key)})`) && ev(`loadSrs(subject, direction)[${JSON.stringify(card1.noun)}].d`) === ev('today()') + 1, 'Not yet: one to practise again, and back tomorrow in Ripasso');
d.dispatchEvent(new B.w.KeyboardEvent('keydown', { key: ' ', bubbles: true }));
ok(!d.getElementById('gira-yes').hidden, 'Space turns the card');
d.dispatchEvent(new B.w.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
ok(ev('index') === 3 && d.getElementById('score').textContent === '1', '← not yet');
d.dispatchEvent(new B.w.KeyboardEvent('keydown', { key: ' ', bubbles: true }));
d.dispatchEvent(new B.w.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
ok(ev('index') === 4 && d.getElementById('score').textContent === '2', '→ knew it');
ev('index = deck.length - 1; render();');
d.getElementById('gira-turn').click();
d.getElementById('gira-no').click();
ok(d.getElementById('practise-missed'), 'at the end: Practise the ones I missed, as after typing');
ok(B.errors.length === 0, 'no errors in a Gira round');

// ---- Verbs: no infinitive-first step in Gira ----
B = boot({ 'flipcards-subject': 'verbs', 'mazzo-answer-mode': 'turn' });
d = B.d; ev = B.ev;
ev("wantsInfinitive = () => true; clearHand(); topicsIn(['freq1']); updateReadout();");
d.getElementById('start-btn').click();
ok(d.getElementById('container').dataset.answerMode === 'turn' && !ev('verbGate'), 'verbs in Gira: straight to the form — no infinitive to type first');
d.getElementById('gira-turn').click();
ok(d.querySelector('.gira-answer').textContent === ev('deck[0].italian') && B.errors.length === 0, 'turned: the form itself');
done();
