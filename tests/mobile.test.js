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
ok(bar.innerHTML && /La tua mano · Tempo/.test(bar.textContent) && new RegExp(`${B.ev("NOUN_THEMES.find(t => t.key === 'tempo').nouns.length")} nouns · ${B.ev("NOUN_THEMES.find(t => t.key === 'tempo').nouns.length")} cards`).test(bar.textContent) && bar.querySelector('[data-bar="start"]') && !bar.querySelector('[data-bar="passive"]'),
   'the hand bar: La tua mano · Tempo, all its nouns as cards, one button — Start, or A spasso when chosen');
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
// ---- Moving on: the answered card is swept off the table (a copy, over the real card) ----
const B3 = boot({ 'flipcards-subject': 'nouns', 'mazzo-answer-mode': 'type' });
const d3 = B3.d, ev3 = B3.ev;
B3.w.Element.prototype.animate = () => ({ finished: new Promise(() => {}) });   // a stand-in that never ends, so the copy stays to be seen
ev3("clearHand(); topicsIn(['tempo']); updateReadout();");
d3.getElementById('start-btn').click();
d3.getElementById('answer').value = ev3('deck[0].italian');
d3.getElementById('submit').click();
ok(!d3.querySelector('.card-ghost'), 'an answered card stays put while you read it');
d3.getElementById('submit').click();
const ghost = d3.querySelector('.card-ghost');
ok(ghost && ghost.getAttribute('aria-hidden') === 'true' && !ghost.querySelector('[id]') && d3.querySelectorAll('#feedback').length === 1 && d3.getElementById('prompt').textContent === ev3('deck[1].english'),
   'the next card: a copy of the answered one is swept off (hidden from screen readers, no doubled ids) over the real card, which already shows the next');
ev3("setDirection('it-en')");
ok(!d3.querySelector('.card-ghost'), 'the same card drawn again (a new direction): nothing swept');
const B4 = boot({ 'flipcards-subject': 'nouns', 'mazzo-answer-mode': 'turn' });
B4.w.Element.prototype.animate = () => ({ finished: new Promise(() => {}) });
B4.w.matchMedia = q => ({ matches: /reduce/.test(q), addEventListener() {}, removeEventListener() {} });
B4.ev("clearHand(); topicsIn(['tempo']); updateReadout();");
B4.d.getElementById('start-btn').click();
B4.d.getElementById('gira-turn').click();
B4.d.getElementById('gira-yes').click();
ok(!B4.d.querySelector('.card-ghost') && B4.ev('index') === 1, 'with “reduce motion” on, nothing sweeps — the next card is simply there');
B4.w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
B4.d.getElementById('gira-turn').click();
B4.d.getElementById('gira-yes').click();
ok(B4.d.querySelector('.card-ghost') && B3.errors.length === 0 && B4.errors.length === 0, 'Gira’s Knew it sweeps the card off too');
// ---- The keyboard stays up: the answer box keeps its focus through the round ----
const B5 = boot({ 'flipcards-subject': 'nouns', 'mazzo-answer-mode': 'type' });
const d5 = B5.d, ev5 = B5.ev, box = () => d5.getElementById('answer'), enter = () => d5.dispatchEvent(new B5.w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
ev5("clearHand(); topicsIn(['tempo']); updateReadout();");
d5.getElementById('start-btn').click();
ok(d5.activeElement === box(), 'the first card: the answer box is focused');
box().value = ev5('deck[0].italian');
enter();
const typed = new B5.w.Event('beforeinput', { bubbles: true, cancelable: true });
box().dispatchEvent(typed);
ok(box().dataset.locked === '1' && !box().disabled && d5.activeElement === box() && typed.defaultPrevented, 'answered: the box is locked, not disabled — it keeps the focus (a phone its keyboard) and refuses typing');
const tap = new B5.w.Event('pointerdown', { bubbles: true, cancelable: true });
d5.querySelector('#game-area > .card').dispatchEvent(tap);
ok(tap.defaultPrevented, 'a tap on the card leaves the focus in the answer box');
enter();
ok(ev5('index') === 1 && !box().dataset.locked && d5.activeElement === box(), 'Enter: the next card, the box open and still focused');
box().value = 'il qualcosa';
enter();
ev5('syncCardFoot()');   // the footer follows the hint a moment later (an observer); bring it up to date here
ok(!box().dataset.locked && d5.activeElement === box() && /Type it below to go on/.test(d5.querySelector('#game-area > .card > .card-foot').textContent)
   && d5.querySelector('#game-area > .card > .card-stamp'), 'wrong: open for retyping, focused; the card’s footer and stamp are the card’s own, outside its scrolling note');
d5.getElementById('round-menu-btn').click();
d5.getElementById('round-menu-close').click();
ok(d5.activeElement === box() && B5.errors.length === 0, 'closing ⋯: straight back to typing');
// ---- The round menu: A spasso instead of Listen ----
const B6 = boot({ 'flipcards-subject': 'nouns', 'mazzo-answer-mode': 'type' });
B6.ev("clearHand(); topicsIn(['tempo']); updateReadout();");
B6.d.getElementById('start-btn').click();
B6.d.getElementById('round-menu-btn').click();
const sheet = B6.d.getElementById('controls');
ok(!sheet.querySelector('[data-dir="listen"]') && sheet.querySelectorAll('.direction-toggle [data-dir]').length === 2 && B6.d.getElementById('game-spasso-btn'),
   'the round menu: EN → IT and IT → EN, no Listen — and A spasso');
// your case: a saved deck, resumed with an empty hand — A spasso plays the saved deck's cards
B6.d.getElementById('save-deck-btn').click();
const savedN = B6.ev('deck.length');
B6.ev("showSetup(); clearHand(); updateReadout();");
B6.d.getElementById('saved-resume').click();
B6.d.getElementById('round-menu-btn').click();
B6.ev("window.__spasso = null; startPassive = c => { window.__spasso = Array.isArray(c) ? c.length : 'hand'; };");   // no voice in the test browser: check what it's given
B6.d.getElementById('game-spasso-btn').click();
ok(B6.ev('window.__spasso') === savedN && B6.ev('container.dataset.view') === 'setup' && B6.d.getElementById('round-menu-btn').getAttribute('aria-expanded') === 'false' && B6.errors.length === 0,
   `A spasso from the round menu plays this round's cards — the saved deck's ${savedN}, with an empty hand — leaving the round as Change nouns does`);
// ---- A phone's round: Scrivi / Gira in the menu, Salta up top ----
const B7 = boot({ 'flipcards-subject': 'nouns', 'mazzo-answer-mode': 'type' });
B7.ev("clearHand(); topicsIn(['tempo']); updateReadout();");
B7.d.getElementById('start-btn').click();
B7.d.getElementById('round-menu-btn').click();
const menuModes = [...B7.d.querySelectorAll('#controls .menu-answer-mode [data-answer-mode-btn]')];
ok(menuModes.length === 2 && menuModes[0].classList.contains('active'), 'the round menu holds Scrivi / Gira (shown on phones), Scrivi chosen');
menuModes[1].click();
ok(B7.ev('answerMode') === 'turn', 'Gira from the menu: the round turns cards');
B7.d.querySelector('#controls .menu-answer-mode [data-answer-mode-btn="type"]').click();
B7.d.getElementById('round-menu-close').click();
B7.d.getElementById('skip-top').click();
ok(!B7.d.getElementById('feedback').classList.contains('hidden') && /answer is/i.test(B7.d.getElementById('feedback').textContent), 'Salta up top: the card shows its answer, as the old Salta did');
const at = B7.ev('index');
B7.d.getElementById('skip-top').click();
ok(B7.ev('index') === at && B7.errors.length === 0, 'and pressed again while the answer shows, it does nothing (no skipping ahead)');
done();
