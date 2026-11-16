// On a phone (Nov 2026): the round's controls behind ⋯ (a drawer; a sheet on a phone); accent keys
// that type at the caret and keep the keyboard up; the card that turns over to show its feedback;
// the answer box's keyboard hints (Go; Italian or English); a buzz on a wrong answer; and the setup's
// hand bar, with Start, once the table has scrolled away.
const { boot, ok, done } = require('./harness');

const B = boot({ 'flipcards-subject': 'nouns' });
const d = B.d, ev = B.ev, c = d.getElementById('container');
let buzz = 0;
B.w.navigator.vibrate = () => { buzz++; return true; };
ev("clearHand(); topicsIn(['tempo']); updateReadout();");

// ---- The hand bar, on the setup page ----
const bar = d.getElementById('hand-bar');
ok(bar.innerHTML && /La tua mano · Tempo/.test(bar.textContent) && /54 nouns · 54 cards/.test(bar.textContent) && bar.querySelector('[data-bar="start"]') && bar.querySelector('[data-bar="passive"]'),
   'the hand bar: La tua mano · Tempo, 54 nouns · 54 cards, Start and A spasso');
ok(bar.hidden, '…waiting out of sight until the table scrolls away');

// ---- The round: ⋯ and its controls ----
bar.querySelector('[data-bar="start"]').click();
ok(c.dataset.view === 'game' && c.dataset.round === '1', 'the bar\'s Start starts the round');
const menuBtn = d.getElementById('round-menu-btn'), controls = d.getElementById('controls');
ok(menuBtn && ['change-btn', 'reshuffle-btn', 'save-deck-btn', 'game-focus-btn'].every(id => controls.contains(d.getElementById(id))) && controls.querySelector('.direction-toggle') && controls.querySelector('.round-menu-head'),
   'the round\'s controls — change, reshuffle, save, focus, direction, deck size — are in the ⋯ panel');
menuBtn.click();
ok(c.classList.contains('menu-open') && !d.getElementById('round-menu-backdrop').hidden && menuBtn.getAttribute('aria-expanded') === 'true', '⋯ opens it');
d.dispatchEvent(new B.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
ok(!c.classList.contains('menu-open') && d.getElementById('round-menu-backdrop').hidden, 'Esc closes it');
menuBtn.click();
d.getElementById('round-menu-backdrop').click();
ok(!c.classList.contains('menu-open'), 'so does a tap outside');
menuBtn.click();
d.getElementById('round-menu-close').click();
ok(!c.classList.contains('menu-open'), '…and its ✕');

// ---- Typing: the answer box, accent keys ----
const a = d.getElementById('answer');
ok(a.getAttribute('enterkeyhint') === 'go' && a.lang === 'it' && c.dataset.answerLang === 'it', 'the answer box: the keyboard\'s Enter says Go, and the answer is Italian');
a.focus(); a.value = 'la citt'; a.setSelectionRange(7, 7);
const keyA = d.querySelector('.accent-key[data-ch="à"]');
const down = new B.w.Event('pointerdown', { bubbles: true, cancelable: true });
keyA.dispatchEvent(down);
keyA.click();
ok(a.value === 'la città' && down.defaultPrevented, 'an accent key types at the caret — la città — and keeps the keyboard up');
a.value = 'lacitt'; a.setSelectionRange(2, 2);
d.querySelector('.accent-key[data-ch="\'"]').click();
ok(a.value === "la'citt", 'the apostrophe key types a plain apostrophe, where the caret is');
ev("setDirection('it-en')");
ok(d.getElementById('answer').lang === 'en' && c.dataset.answerLang === 'en', 'IT → EN: the answer is English (and the accent keys step aside)');
ev("setDirection('en-it')");

// ---- A wrong answer: the card turns over; a buzz ----
d.getElementById('answer').value = 'il qualcosa';
d.getElementById('submit').click();
const fb = d.getElementById('feedback');
ok(d.querySelector('.card').contains(fb) && !fb.classList.contains('hidden') && /Not quite/.test(fb.textContent) && /Type it below to go on/.test(fb.textContent), 'a wrong answer: the card holds the correction — type it below to go on');
ok(buzz === 1, 'and the phone buzzes once');

// ---- After the round ----
d.getElementById('change-btn').click();
ok(c.dataset.view === 'setup' && c.dataset.round === undefined && !c.classList.contains('menu-open'), 'back at the setup: no ⋯, no open panel');
ok(B.errors.length === 0, 'no errors along the way');
// ---- The card's back: what you wrote; the right answer's dash set apart; a skip ----
const B2 = boot({ 'flipcards-subject': 'nouns', 'mazzo-answer-mode': 'type' });
const d2 = B2.d, ev2 = B2.ev;
ev2("clearHand(); topicsIn(['tempo']); updateReadout();");
d2.getElementById('start-btn').click();
d2.getElementById('answer').value = 'il qualcosa';
d2.getElementById('submit').click();
ok(d2.querySelector('#feedback .fb-wrote') && /you wrote il qualcosa/.test(d2.querySelector('#feedback .fb-wrote').textContent) && d2.querySelector('#feedback .fb-wrote s'), 'the card’s back: what you wrote, crossed out');
ev2('index = 1; render();');
d2.getElementById('answer').value = ev2('deck[1].italian');
d2.getElementById('submit').click();
ok(d2.querySelector('#feedback.correct .fb-dash') && /✓ (Corretto|Bravo) — /.test(d2.getElementById('feedback').textContent) && !d2.querySelector('#feedback .fb-wrote'),
   'a right answer: ✓ Corretto — its dash kept in the words, set apart for the card’s back; nothing crossed out');
d2.getElementById('submit').click();
d2.getElementById('skip-btn').click();
ok(d2.querySelector('#feedback.incorrect') && !d2.querySelector('#feedback .fb-wrote') && B2.errors.length === 0, 'a skip: no “you wrote”');
done();
