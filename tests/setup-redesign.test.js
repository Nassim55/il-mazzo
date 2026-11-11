// The setup page's top (Nov 2026): a title and one line; practice mode and direction as one row
// of toggles where a section has them; a deck card — what's in it, Start, A spasso; and Settings
// & more, closed, holding the rest. The same in every section that has this page. Whole topics
// are the main way in: each line of the map has its own ＋ Add / ✓ In deck.
const { boot, ok, done } = require('./harness');

for (const s of ['nouns', 'verbs', 'irregular', 'mipiace', 'adjectives', 'avverbi', 'possessives', 'prepositions', 'phrases', 'sentences']) {
  const B = boot({ 'flipcards-subject': s });
  const d = B.d, more = d.getElementById('setup-more');
  ok(!/Step 01/.test(d.getElementById('game-area').textContent) && d.querySelector('.setup-intro .setup-sub').textContent.length < 110
     && d.querySelector('.deck-card #start-btn') && d.querySelector('.deck-card #deck-topics') && more && !more.open
     && ['weakest-20', 'random-20', 'select-all', 'clear-all', 'hand-pick', 'deck-cap', 'audio-row', 'setup-meta'].every(id => more.contains(d.getElementById(id)))
     && (!B.ev(`SUBJECTS.${s}.setupSub`) || /How this section works/.test(more.textContent)) && B.errors.length === 0,
     `${s}: a title and one line, the deck card, and Settings & more (closed) with everything else`);
}

// ---- Whole topics, from the map ----
let B = boot({ 'flipcards-subject': 'nouns' });
const row = k => B.d.querySelector(`.map-row[data-topic="${k}"]`), add = k => row(k).querySelector('.map-add').click();
const size = k => B.ev(`NOUN_THEMES.find(t => t.key === '${k}').nouns.length`);
B.d.getElementById('clear-all').click();
ok(/Your deck is empty — tap ＋ Add on a topic below/.test(B.d.getElementById('deck-topics').textContent), 'an empty deck says what to do');
add('tempo'); add('animali');
const both = B.ev("new Set([...NOUN_THEMES.find(t => t.key === 'tempo').nouns, ...NOUN_THEMES.find(t => t.key === 'animali').nouns]).size");
ok(B.ev('selectedNouns.size') === both && row('tempo').querySelector('.map-add.in') && /✓ In deck/.test(row('tempo').querySelector('.map-add').textContent) && /＋ Add/.test(row('corpo').querySelector('.map-add').textContent),
   `＋ Add on two topics: both whole, ${both} nouns — their lines say ✓ In deck`);
ok(/Tempo · Animali/.test(B.d.getElementById('deck-topics').textContent) && B.d.querySelector('[data-deck-clear]'), 'the deck card names them, with a way to clear');
add('tempo');
ok(B.ev('selectedNouns.size') === size('animali') && !/Tempo/.test(B.d.getElementById('deck-topics').textContent), '✓ In deck again: the topic comes back out');
B.d.querySelector('[data-deck-clear]').click();
ok(B.ev('selectedNouns.size') === 0, 'clear: an empty deck');
add('corpo');
B.d.getElementById('start-btn').click();
ok(B.d.querySelector('.container').dataset.view === 'game' && B.ev('deck.length') === size('corpo'), 'and Start plays the whole topic');

// ---- The map's key: one line; how it's scored, folded away ----
B = boot({ 'flipcards-subject': 'nouns' });
const key = B.d.querySelector('#noun-map .map-key'), how = key.querySelector('details.map-how');
ok(/rarely wrong/.test(key.textContent) && key.querySelectorAll('.mk-cell').length === 3 && how && !how.open && /right 5 times or more, and on 8 of your last 10 answers/.test(how.textContent),
   'the key: the colours and three samples; how it\'s scored, folded away');
ok(!B.d.querySelector('#noun-map .map-rows .mk-cell') && B.d.querySelectorAll('#noun-map .map-row').length === B.ev('NOUN_THEMES.length') && B.d.getElementById('noun-map').contains(B.d.querySelector('.map-add')),
   'the samples aren\'t words, and every line — with its ＋ Add — is inside the map');
ok(B.errors.length === 0, 'no errors along the way');
done();
