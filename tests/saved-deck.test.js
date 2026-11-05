// Il mazzo salvato: save the deck you're playing — exactly: its cards, order, pool and
// focus, your place, score and misses, the section, direction and modes — and pick it up
// from the home page next visit. Once saved, the round keeps its snapshot current.
const { boot, ok, done } = require('./harness');

const KEY = 'mazzo-saved-deck-v1';
let B = boot({ 'flipcards-subject': 'nouns' });
const snap = () => { const v = B.w.localStorage.getItem(KEY); return v ? JSON.parse(v).deck : null; };
const play = (right = true) => { B.d.getElementById('answer').value = right ? B.ev('deck[index].italian') : 'boh'; B.d.getElementById('submit').click(); if (!right) { B.d.getElementById('answer').value = B.ev('deck[index].italian'); B.d.getElementById('submit').click(); } else B.d.getElementById('submit').click(); };
const strip = () => B.d.getElementById('saved-deck');

ok(strip() && strip().hidden && !snap(), 'nothing saved yet: no strip on the home page');
B.ev("selectedNouns = new Set(['giorno','casa','tempo','anno','parte','mondo']); updateReadout();");
B.d.getElementById('start-btn').click();
play(); play(false);
const order = B.ev('deck.map(c => c.key)');
B.d.getElementById('save-deck-btn').click();
let s = snap();
ok(s && s.subject === 'nouns' && s.direction === 'en-it' && JSON.stringify(s.deck) === JSON.stringify(order) && s.index === 2 && s.score === 1 && s.missed.length === 1
   && /✓ Deck saved/.test(B.d.getElementById('save-deck-btn').textContent), 'Save deck: the exact deck in its order, your place (card 3), the score and the card you missed');
ok(s.cards.every(c => !('note' in c)) && s.cards.length === 6, 'each card stored once, the notes left out (they come back from the game itself)');

// ---- On the home page, and next visit ----
B.ev('showSetup()');
ok(!strip().hidden && /Il mazzo salvato/.test(strip().textContent) && /Sostantivi · card 3 of 6 · 1 right so far/.test(strip().textContent.replace(/\s+/g, ' ')) && B.d.getElementById('saved-resume'),
   'the home page shows it under Ripasso del giorno: Sostantivi, card 3 of 6, 1 right — Riprendi');
const store = { 'flipcards-subject': 'adjectives', [KEY]: B.w.localStorage.getItem(KEY) };
B = boot(store);
ok(!strip().hidden && /Sostantivi/.test(strip().textContent), 'next visit, on another section: still there');
B.d.getElementById('saved-resume').click();
ok(B.ev('subject') === 'nouns' && B.d.querySelector('.container').dataset.view === 'game' && JSON.stringify(B.ev('deck.map(c => c.key)')) === JSON.stringify(order)
   && B.ev('index') === 2 && B.ev('score') === 1 && B.ev('roundMissed.size') === 1 && B.d.getElementById('prompt').textContent.trim() === B.ev('deck[2].english'),
   'Riprendi: back in Sostantivi, the same deck in the same order, at card 3, score 1, the miss remembered');
ok(/diurnal/.test(B.ev("deck.find(c => c.noun === 'giorno').note")), 'the notes are back on the cards');

// ---- The saved round keeps its place; finishing; again ----
play();
ok(snap().index === 3 && snap().score === 2, 'play on: the snapshot follows (card 4, score 2)');
play(); play(); play();
ok(snap().done && snap().index === 6, 'finished: saved as finished');
B.ev('showSetup()');
ok(/finished · 5 of 6 right/.test(strip().textContent.replace(/\s+/g, ' ')) && /Play it again/.test(B.d.getElementById('saved-resume').textContent), 'the home page offers to play it again');
B.d.getElementById('saved-resume').click();
ok(B.ev('index') === 0 && B.ev('score') === 0 && JSON.stringify(B.ev('deck.map(c => c.key)')) === JSON.stringify(order), 'Play it again: the same deck from the top');
play();
B.ev('showSetup()');
B.d.getElementById('saved-restart').click();
ok(B.ev('index') === 0 && B.ev('score') === 0, 'from the start, mid-way: back to card 1');

// ---- Other rounds leave it alone ----
const before = B.w.localStorage.getItem(KEY);
B.ev('showSetup()');
B.ev("selectedNouns = new Set(['cane','gatto']); updateReadout();");
B.d.getElementById('start-btn').click();
play(false);
ok(B.w.localStorage.getItem(KEY) === before, 'a new deck from the setup doesn\'t touch it');
play();
B.d.getElementById('practise-missed') && B.d.getElementById('practise-missed').click();
ok(B.w.localStorage.getItem(KEY) === before, 'nor does practising the missed cards');

// ---- The pool behind the deck, verbs, Ripasso ----
B = boot({ 'flipcards-subject': 'irregular' });
B.ev("verbMode = 'conjugations'; selectedNouns = new Set(['essere','andare','fare']); updateReadout();");
B.d.getElementById('start-btn').click();
B.ev("deck = deck.slice(0, 7); sessionMaxDeck = deck.slice(); render();");
B.d.getElementById('save-deck-btn').click();
const v = snap();
B = boot({ 'flipcards-subject': 'nouns', [KEY]: JSON.stringify({ deck: v }) });
B.d.getElementById('saved-resume').click();
ok(B.ev('subject') === 'irregular' && B.ev('verbMode') === 'conjugations' && B.ev('deck.length') === 7 && B.ev('sessionPool.length') === v.pool.length && v.pool.length > 7
   && B.ev('deck.every(c => c.person)'), 'a trimmed deck of conjugations comes back trimmed — with its whole pool behind it, so Deck size still works');
B = boot({ 'flipcards-subject': 'nouns', 'sostantivi-stats-v1': JSON.stringify({ pane: { seen: 6, wrong: 3 }, casa: { seen: 4, wrong: 2 } }) });
B.ev('startRipasso()');
B.d.getElementById('save-deck-btn').click();
const r = snap();
B = boot({ 'flipcards-subject': 'adjectives', [KEY]: JSON.stringify({ deck: r }) });
ok(/Ripasso del giorno/.test(strip().textContent), 'a Ripasso round can be saved too');
B.d.getElementById('saved-resume').click();
ok(B.ev('reviewMode') && B.ev('deck.every(c => c.subject)') && B.d.getElementById('app-title').textContent === 'Ripasso del giorno', '…and comes back as one');
B.ev('showSetup()');
ok(B.ev('subject') === 'adjectives', 'and leaving it goes back where you were');

// ---- Forget; sync ----
B.d.getElementById('saved-forget').click();
ok(!B.w.localStorage.getItem(KEY) && strip().hidden, 'forget it: gone');
ok(B.ev(`syncedKeys().get('${KEY}')`) === 'latest', 'it syncs between devices');
const merged = B.ev(`syncMergeLatest({ deck: { at: 1 } }, { deck: { at: 5, subject: 'nouns' } }, { deck: { at: 9, subject: 'verbs' } })`);
const merged2 = B.ev(`syncMergeLatest({ deck: { at: 1 } }, { deck: { at: 1 } }, {})`);
ok(merged.deck.subject === 'verbs' && !merged2.deck, 'saved on both: the newer one wins; forgotten on one: forgotten');
ok(B.errors.length === 0, 'no errors along the way');
done();
