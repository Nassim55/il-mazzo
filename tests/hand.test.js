// Il mazzo in mano — the setup page's top, the same in every section that has one: your deck as
// a fanned hand of cards, one per whole topic (newest on top; how much of it you know; ✕ to take
// it out), single words on a card of their own, an empty slot saying what to do; beside it, the
// count, the toggles, Start, A spasso, and Settings & more (closed) with everything else.
const { boot, ok, done } = require('./harness');

for (const s of ['nouns', 'verbs', 'irregular', 'mipiace', 'adjectives', 'avverbi', 'possessives', 'prepositions', 'phrases', 'sentences']) {
  const B = boot({ 'flipcards-subject': s });
  const d = B.d, hand = d.getElementById('hand'), more = d.getElementById('setup-more');
  ok(hand && d.getElementById('hand-fan') && hand.querySelector('.hand-title').textContent === 'Il mazzo' && hand.contains(d.getElementById('start-btn')) && hand.contains(d.getElementById('direction-toggle'))
     && more && hand.contains(more) && !more.open && ['weakest-20', 'random-20', 'select-all', 'clear-all', 'hand-pick', 'deck-cap', 'audio-row', 'setup-meta'].every(id => more.contains(d.getElementById(id)))
     && !/Step 01/.test(d.getElementById('game-area').textContent) && B.errors.length === 0,
     `${s}: the hand — Il mazzo, the count, the direction, Start; Settings & more closed with the rest`);
}

let B = boot({ 'flipcards-subject': 'nouns' });
const fan = () => [...B.d.querySelectorAll('#hand-fan .hand-card')].map(c => c.classList.contains('hand-slot') ? 'slot' : c.classList.contains('hand-loose') ? `loose ${c.querySelector('.hand-n').textContent}` : c.classList.contains('hand-more') ? c.querySelector('.hand-name').textContent : c.dataset.topic);
const add = k => B.d.querySelector(`.map-row[data-topic="${k}"] .map-add`).click();
const nouns = k => B.ev(`NOUN_THEMES.find(t => t.key === '${k}').nouns`);
B.d.getElementById('clear-all').click();
ok(fan().join() === 'slot' && /Tap ＋ Add on a topic below/.test(B.d.getElementById('hand-fan').textContent) && B.d.getElementById('start-btn').disabled, 'an empty hand: just the slot, saying what to do; Start waits');
add('tempo'); add('animali');
ok(fan().join() === 'tempo,animali,slot' && B.d.getElementById('selected-count').textContent === String(B.ev('selectedNouns.size')), 'two topics from the map: two cards, newest on top, and the count');
const card = B.d.querySelector('#hand-fan .hand-card[data-topic="tempo"]');
ok(card.querySelector('.hand-n').textContent === String(nouns('tempo').length) && /% known/.test(card.querySelector('.hand-known').textContent) && card.querySelector('.hand-x'), 'a card: its size, how much of it you know, and ✕');
B.d.querySelector('#hand-fan [data-hand-remove="tempo"]').click();
ok(fan().join() === 'animali,slot' && !nouns('tempo').some(k => B.ev(`selectedNouns.has('${k}')`)), '✕ takes the topic out');
add('tempo'); add('natura');
const shared = nouns('tempo').filter(k => nouns('natura').includes(k));
B.d.querySelector('#hand-fan [data-hand-remove="tempo"]').click();
ok(shared.length > 0 && shared.every(k => B.ev(`selectedNouns.has('${k}')`)) && fan().includes('natura'), `…keeping the words another topic in the hand also has (${shared.join(', ')}): Natura stays whole`);
B.ev("selectedNouns.add('pane'); updateReadout();");
ok(fan().join().includes('loose 1'), 'a word picked on its own: a card of its own, Parole scelte');
B.d.querySelector('#hand-fan [data-hand-remove="__loose"]').click();
ok(!B.ev("selectedNouns.has('pane')") && !fan().join().includes('loose'), '…and its ✕ takes the single words out');
B.ev("topicsIn(NOUN_THEMES.slice(0, 10).map(t => t.key)); updateReadout();");   // ten topics added, as the map's ＋ Add does
ok(B.d.querySelectorAll('#hand-fan .hand-card:not(.hand-slot):not(.hand-more):not(.hand-loose)').length === 7 && B.d.querySelector('#hand-fan .hand-more'), 'past seven topics, the oldest fold into a +N card');
B.d.querySelector('#hand [data-deck-clear]').click();
ok(B.ev('selectedNouns.size') === 0 && fan().join() === 'slot', 'clear: an empty hand');
add('corpo');
B.d.getElementById('start-btn').click();
ok(B.d.querySelector('.container').dataset.view === 'game' && B.ev('deck.length') === nouns('corpo').length, 'Start plays the hand');

// ---- A topic inside a bigger one is part of its card; the direction is the hand's too ----
B = boot({ 'flipcards-subject': 'verbs' });
B.ev("selectedNouns.clear(); deckTopics = []; topicsIn(['are']); updateReadout();");   // -are added, as its ＋ Add does
const vfan = [...B.d.querySelectorAll('#hand-fan .hand-card[data-topic]')].map(c => c.dataset.topic);
ok(vfan.join() === 'are', `-are in the hand: one card — -care/-gare and -iare are inside it (${vfan.join(', ')})`);
B.d.querySelector('#direction-toggle [data-direction="it-en"]').click();
ok(B.ev('direction') === 'it-en' && /Italian → English/.test(B.d.querySelector('#noun-map .map-eyebrow').textContent), 'the direction, from the hand: the map follows at once');
B = boot({ 'flipcards-subject': 'phrases' });
B.ev("selectedNouns.clear(); updateReadout();");
B.d.querySelector('#theme-chips [data-theme]').click();
ok(B.d.querySelectorAll('#hand-fan .hand-card[data-topic]').length === 1 && /Tap a group below/.test(B.d.getElementById('hand-fan').textContent), 'Frasi: a theme chip puts its group in the hand');
ok(B.errors.length === 0, 'no errors along the way');
done();
