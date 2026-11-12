// The topics in your deck (Nov 2026). The deck is a set of words, and the topics you add are
// remembered too — so taking one topic out never takes another with it, wherever you do it
// (the map's ✓ In deck, the topic's panel, the hand's ✕, a theme chip or its group), a topic
// doesn't join the hand just because others cover its words, and Practise the weakest, a round
// or a trip to another section leave your deck as it was.
const { boot, ok, done } = require('./harness');

const setUp = (subj) => {
  const B = boot({ 'flipcards-subject': subj });
  B.has = k => B.ev(`selectedNouns.has(${JSON.stringify(k)})`);
  B.nouns = k => B.ev(`themeByKey(${JSON.stringify(k)}).nouns`);
  B.redraw = () => B.ev("if (document.getElementById('noun-map')) document.getElementById('noun-map').innerHTML = nounMapInner();");
  B.pill = k => { B.redraw(); B.d.querySelector(`.map-row[data-topic="${k}"] .map-add`).click(); B.redraw(); };
  B.isIn = k => { B.redraw(); return !!B.d.querySelector(`.map-row[data-topic="${k}"] .map-add.in`); };
  B.card = k => B.d.querySelector(`#hand-fan .hand-card[data-topic="${k}"]`);
  B.panel = (k, what) => { B.ev(`mapOpen = ${JSON.stringify(k)}`); B.redraw(); B.d.querySelector(`[data-map-pick="${what}"]`).click(); B.redraw(); };
  B.d.getElementById('clear-all').click();
  return B;
};

// ---- Two topics that share words: Tempo and Natura (the four seasons) ----
for (const route of ['pill', 'panel', 'hand']) {
  const B = setUp('nouns');
  B.pill('tempo'); B.pill('natura');
  const shared = B.nouns('tempo').filter(k => B.nouns('natura').includes(k));
  if (route === 'pill') B.pill('tempo');
  else if (route === 'panel') B.panel('tempo', 'none');
  else B.d.querySelector('#hand-fan [data-hand-remove="tempo"]').click();
  B.redraw();
  ok(B.nouns('natura').every(B.has) && B.isIn('natura') && B.card('natura') && !B.isIn('tempo') && !B.card('tempo')
     && B.nouns('tempo').filter(k => !shared.includes(k)).every(k => !B.has(k)),
     `Tempo out (${route === 'pill' ? 'the map\'s ✓ In deck' : route === 'panel' ? 'its panel' : 'the hand\'s ✕'}): Natura stays whole and in, seasons (${shared.join(', ')}) and all; the rest of Tempo goes`);
}

// ---- A topic covered by others isn't in the hand until you add it ----
let B = setUp('nouns');
B.pill('tempo'); B.pill('natura');
ok(B.ev('syncDeckTopics().join()') === 'tempo,natura', 'the deck remembers the topics you added, in order');
B.ev("selectedNouns.add('pane'); updateReadout();");
ok(/1/.test(B.d.querySelector('#hand-fan .hand-loose .hand-n').textContent) && B.ev('syncDeckTopics().join()') === 'tempo,natura', 'a word added on its own sits on the single-words card; the topics stay');

// ---- Inside a bigger topic: -care/-gare and -iare inside -are ----
B = setUp('verbs');
B.pill('are');
ok(B.card('are') && !B.card('cgare') && !B.card('iare') && B.isIn('cgare') && B.isIn('iare'), '-are in: one card; -care/-gare and -iare show as in, inside it');
B.d.querySelector('#hand-fan [data-hand-remove="are"]').click(); B.redraw();
ok(!B.nouns('are').some(B.has) && !B.card('cgare') && !B.card('iare') && B.ev('selectedNouns.size') === 0, '✕ on -are: all of it goes, -care/-gare and -iare too — no cards pop back');
B.pill('are'); B.pill('iare');
ok(!B.nouns('iare').some(B.has) && B.card('are') && new RegExp(`^${B.nouns('are').length - B.nouns('iare').length}/${B.nouns('are').length}$`).test(B.card('are').querySelector('.hand-n').textContent),
   'taking -iare out on its own makes a hole in -are — its card says how many are left');
B.pill('are');
ok(B.nouns('are').every(B.has) && B.isIn('are') && B.isIn('iare'), '＋ Add on -are fills the hole');

// ---- A topic showing as in keeps its words, even when it's only in inside a bigger one ----
B = setUp('adjectives');
const big = B.ev("THEMES.filter(t => THEMES.some(a => a !== t && THEMES.some(b => b !== t && b !== a && a.nouns.every(n => t.nouns.includes(n)) && b.nouns.every(n => t.nouns.includes(n)) && a.nouns.some(n => b.nouns.includes(n)) && !a.nouns.every(n => b.nouns.includes(n)) && !b.nouns.every(n => a.nouns.includes(n))))).map(t => t.key)[0]");
const pair = B.ev(`(() => { const T = themeByKey(${JSON.stringify(big)}), ins = THEMES.filter(t => t !== T && t.nouns.every(n => T.nouns.includes(n)));
  for (const a of ins) for (const b of ins) if (a !== b && a.nouns.some(n => b.nouns.includes(n)) && !a.nouns.every(n => b.nouns.includes(n)) && !b.nouns.every(n => a.nouns.includes(n))) return [a.key, b.key]; })()`);
B.pill(big);
B.pill(pair[0]);
ok(!B.nouns(pair[0]).some(B.has) && !B.isIn(pair[0]) && B.nouns(big).some(B.has),
   `inside ${big}, ${pair[0]} out: always a hole in ${big}, even where its words are shared with ${pair[1]} — which was only in because ${big} was`);
B.d.getElementById('clear-all').click();
B.pill(pair[1]); B.pill(big); B.pill(pair[0]);
ok(B.nouns(pair[1]).every(B.has) && B.isIn(pair[1]), `…but add ${pair[1]} yourself first, and taking ${pair[0]} out leaves ${pair[1]} whole (its card folds into ${big}'s, which shows the hole)`);

// ---- Theme chips and their groups, in the phrase sections ----
B = setUp('phrases');
const chip = k => B.d.querySelector(`#theme-chips .theme-chip[data-theme="${k}"]`);
chip('saluti').click(); chip('tulei').click();
chip('saluti').click();
ok(B.nouns('tulei').every(B.has) && chip('tulei').classList.contains('full') && !chip('saluti').classList.contains('full') && B.card('tulei') && !B.card('saluti'),
   'Frasi: Saluti out by its chip — Tu o Lei, which shares phrases with it, stays whole');
B = setUp('prepositions');
const gbtn = B.d.querySelector('#theme-chips .theme-group-btn');
if (gbtn) {
  const g = gbtn.dataset.group, inG = B.ev(`THEMES.filter(t => t.group === ${JSON.stringify(g)}).map(t => t.key)`);
  gbtn.click();
  ok(inG.every(k => B.d.querySelector(`#theme-chips .theme-chip[data-theme="${k}"]`).classList.contains('full')) && gbtn.classList.contains('full'), 'a group button: all its themes in');
  gbtn.click();
  ok(B.ev('selectedNouns.size') === 0 && !gbtn.classList.contains('full'), '…and out again');
}

// ---- Practise the weakest, a round, another section: the deck stays as it was ----
B = setUp('nouns');
B.ev(`(() => { const data = {}; SUBJECTS.nouns.items.forEach((n, i) => { if (i % 2) data[n.noun] = { seen: 5, wrong: 2 }; }); localStorage.setItem(SUBJECTS.nouns.statsKeys['en-it'], JSON.stringify(data)); stats = loadStats(); })()`);
B.pill('tempo'); B.pill('corpo');
const was = B.ev('JSON.stringify([[...selectedNouns].sort(), syncDeckTopics()])');
B.ev("mapOpen = 'animali'"); B.redraw();
B.d.querySelector('[data-map-pick="weak"]').click();
ok(B.d.querySelector('.container').dataset.view === 'game' && B.ev('deck.length') > 0, 'Practise the weakest (Animali) starts a round of just those');
B.d.getElementById('change-btn').click();
ok(B.ev('JSON.stringify([[...selectedNouns].sort(), syncDeckTopics()])') === was && B.card('tempo') && B.card('corpo'), '…and back at the setup, your hand is as it was: Tempo and Corpo');
B.d.getElementById('start-btn').click(); B.d.getElementById('change-btn').click();
ok(B.ev('JSON.stringify([[...selectedNouns].sort(), syncDeckTopics()])') === was, 'a round of your own deck leaves it as it was');
B.d.querySelector('#subject-toggle [data-subject="verbs"]').click();
B.d.querySelector('#subject-toggle [data-subject="nouns"]').click();
ok(B.ev('JSON.stringify([[...selectedNouns].sort(), syncDeckTopics()])') === was && B.card('tempo'), 'so does a trip to another section and back');

// ---- Picks that aren't topics ----
B = setUp('nouns');
B.d.getElementById('select-all').click();
ok(B.d.querySelectorAll('#hand-fan .hand-card[data-topic]').length === 7 && B.d.querySelector('#hand-fan .hand-more') && B.isIn('tempo'), 'All: every topic counts as added — seven cards and a +N');
B.d.getElementById('clear-all').click();
ok(B.ev('selectedNouns.size') === 0 && B.ev('syncDeckTopics().length') === 0, 'None: an empty deck');
B.ev("saveMapPrefs({ hidden: true }); showSetup();");
ok(/Show the map below to add a topic/.test(B.d.getElementById('hand-fan').textContent), 'with the map hidden, the empty card says to show it');
B.ev("saveMapPrefs({ hidden: false });");
ok(B.errors.length === 0, 'no errors along the way');
done();
