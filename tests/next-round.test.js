// The end of a round (Nov 2026): the next round's size, beside Play again — the result stays as it was.
const { boot, ok, done } = require('./harness');
const B = boot({ 'flipcards-subject': 'nouns', 'mazzo-answer-mode': 'type' });
const d = B.d, ev = B.ev;
const slide = (id, v) => { const el = d.getElementById(id); el.value = String(v); el.dispatchEvent(new B.w.Event('input', { bubbles: true })); el.dispatchEvent(new B.w.Event('change', { bubbles: true })); };
ev("clearHand(); topicsIn(['tempo']); updateReadout();");
d.getElementById('start-btn').click();
slide('game-trim-input', 10);
ok(ev('deck.length') === 10, 'a round trimmed to 10');
ev('score = 7; index = deck.length; render();');   // to the end of the round
const P = ev('sessionPool.length');
const trim = d.querySelector('.card.complete #game-trim-input');
ok(ev('container.dataset.view') === 'complete' && trim && trim.value === '10' && trim.max === String(P), `the end of the round shows the deck size: 10 of ${P}`);
const result = d.querySelector('.card.complete h2').textContent;
slide('game-trim-input', 15);
ok(d.querySelector('.card.complete h2').textContent === result && ev('container.dataset.view') === 'complete'
   && /15 cards/.test(d.getElementById('play-again').textContent) && d.getElementById('game-trim-input-value').textContent === `15 / ${P}`,
   'moving it to 15: the result stays as it was (7/10); Play again says 15 cards');
d.getElementById('play-again').click();
ok(ev('container.dataset.view') === 'game' && ev('deck.length') === 15 && ev('index') === 0 && ev('score') === 0, 'Play again: a round of 15');
ev('index = deck.length; render();');
slide('game-trim-input', 5);
d.getElementById('play-again').click();
ok(ev('deck.length') === 5 && ev('index') === 0, 'and smaller: a round of 5');
// after a round of the missed: Missed and The rest, both on the end card
ev('practiseMissed(sessionPool.slice(0, 8))');
ev('index = deck.length; render();');
ok(d.querySelector('.card.complete #game-trim-focus') && d.querySelector('.card.complete #game-trim-rest'), 'after a round of the missed: Missed and The rest, on the end card');
ok(d.getElementById('game-trim-focus').min === '0', 'none of the next round counts as played: the sliders go down as well as up');
slide('game-trim-focus', 3);
slide('game-trim-rest', 0);
d.getElementById('play-again').click();
ok(ev('deck.length') === 3, 'Missed 3, The rest 0: Play again deals 3');
ok(B.errors.length === 0, 'no errors');
done();
