// Conjugation rounds: each verb's forms come together, io → tu → lui → noi → voi → loro,
// while the verbs themselves come in random order.
const { boot, ok, done } = require('./harness');

const ORDER = ['io', 'tu', 'lui', 'noi', 'voi', 'loro'];
const runs = cards => {   // the deck as runs of one verb: [[verb, [persons…]], …]
  const out = [];
  for (const c of cards) {
    const last = out[out.length - 1];
    if (last && last[0] === c.noun) last[1].push(c.person); else out.push([c.noun, [c.person]]);
  }
  return out;
};
const inOrder = ps => ps.every((p, i) => i === 0 || ORDER.indexOf(p) > ORDER.indexOf(ps[i - 1]));
const together = r => new Set(r.map(x => x[0])).size === r.length;   // no verb in two runs
const deal = (subj, keys, extra = '') => {
  const B = boot({ 'flipcards-subject': subj });
  B.ev(`selectedNouns = new Set(${JSON.stringify(keys)}); ${extra} updateReadout();`);
  B.d.getElementById('start-btn').click();
  return B;
};
const VERBS = ['parlare', 'mangiare', 'cercare', 'vedere'];

// ---- Each verb's forms together, io to loro; the verbs in random order ----
let B = deal('verbs', VERBS);
let r = runs(B.ev('deck'));
ok(B.ev('deck.length') === 24 && together(r) && r.every(([, ps]) => ps.join() === ORDER.join()), 'every verb\'s six forms together, io → tu → lui → noi → voi → loro');
const orders = new Set([r.map(x => x[0]).join()]);
for (let k = 0; k < 6; k++) orders.add(runs(deal('verbs', VERBS).ev('deck')).map(x => x[0]).join());
ok(orders.size > 1, `the verbs themselves in random order (${orders.size} different orders in 7 rounds)`);
B = deal('irregular', ['essere', 'avere', 'andare']);
r = runs(B.ev('deck'));
ok(together(r) && r.length === 3 && r.every(([, ps]) => ps.join() === ORDER.join()), 'the irregular verbs too');

// ---- Fewer persons, fewer cards ----
B = deal('verbs', VERBS, "saveVerbPersons('verbs', ['io', 'tu', 'lui']);");
r = runs(B.ev('deck'));
ok(B.ev('deck.length') === 12 && together(r) && r.every(([, ps]) => ps.join() === 'io,tu,lui'), 'with the persons narrowed (io, tu, lui), those, in order');
B = deal('verbs', VERBS, "document.getElementById('deck-cap').value = '8';");
r = runs(B.ev('deck'));
ok(B.ev('deck.length') === 8 && together(r) && r.every(([, ps]) => inOrder(ps) && ps[0] === 'io'), 'play just 8: a verb is only ever cut at its end (io, tu, … as far as it goes)');

// ---- Play all again; practise the missed ----
B = deal('verbs', VERBS);
const keys0 = B.ev('deck.map(c => c.key).join()');
B.ev('index = deck.length; render();');
B.d.getElementById('play-again').click();
r = runs(B.ev('deck'));
ok(together(r) && r.every(([, ps]) => ps.join() === ORDER.join()) && B.ev('deck.length') === 24, 'Play all again: still each verb in order');
// miss a scattering of cards across the verbs, then practise the missed
B = deal('verbs', VERBS);
const miss = new Set(B.ev("deck.filter(c => ['tu', 'loro'].includes(c.person) || (c.person === 'io' && c.noun === 'cercare')).map(c => c.key)"));
for (let k = 0; k < 24; k++) {
  const c = B.ev('deck[index]');
  if (miss.has(c.key)) {   // wrong, then the retype (which moves on by itself)
    B.d.getElementById('answer').value = 'xyz'; B.d.getElementById('submit').click();
    B.d.getElementById('answer').value = c.italian; B.d.getElementById('submit').click();
  } else {                 // right, then Avanti
    B.d.getElementById('answer').value = c.italian; B.d.getElementById('submit').click();
    B.d.getElementById('submit').click();
  }
}
B.d.getElementById('practise-missed').click();
r = runs(B.ev('deck'));
ok(B.ev('deck.length') === 9 && together(r) && r.every(([v, ps]) => ps.join() === (v === 'cercare' ? 'io,tu,loro' : 'tu,loro')), 'practise the missed: each verb\'s missed forms together, in order (cercare io, tu, loro)');

// ---- Infinitives are unaffected; A spasso reads them in order too ----
B = deal('verbs', VERBS, "verbMode = 'infinitives';");
ok(B.ev('deck.length') === 4 && B.ev('deck.every(c => !c.person)'), 'infinitive rounds: one card a verb, in random order as before');
B = boot({ 'flipcards-subject': 'verbs' });
B.ev(`selectedNouns = new Set(${JSON.stringify(VERBS)}); updateReadout(); passiveDeck = passiveDeck;`);
r = runs(B.ev('passiveDeck()'));
ok(together(r) && r.every(([, ps]) => ps.join() === ORDER.join()), 'A spasso reads each verb\'s forms in order too');

// ---- In a round: the deck-size slider, the verb on screen, played cards ----
B = deal('verbs', VERBS, "document.getElementById('deck-cap').value = '8';");
ok(B.ev('deck.length') === 8, '(the round starts with 8 cards: one verb whole, the next cut short)');
const firstRun = runs(B.ev('deck'))[1];   // the verb cut short
B.ev('index = 3;'); B.ev('render();');
B.d.getElementById('game-trim-input').value = '14';
B.ev('handleGameResize();');
const after = B.ev('deck');
r = runs(after);
const cut = r.find(([v]) => v === firstRun[0]);
ok(after.length === 14 && together(r) && cut[1].join() === ORDER.join() && r.every(([, ps]) => inOrder(ps) && ps[0] === 'io'),
   'growing the deck mid-round finishes the verb cut short (io to loro), then adds new verbs whole, from io');
const g = (cards, from) => B.ev(`groupConjugations(${JSON.stringify(cards)}, ${from}).map(c => c.noun + (c.person ? ':' + c.person : '')).join(' ')`);
const C = (noun, person) => ({ noun, person, key: noun + person });
ok(g([C('A', 'io'), C('B', 'io'), C('C', 'io'), C('A', 'tu'), C('B', 'tu'), { noun: 'casa', key: 'casa' }], 2) === 'A:io B:io B:tu A:tu C:io casa',
   'the verb on screen carries on first, then a verb already started, then the rest; played cards and other cards stay put');
ok(B.errors.length === 0 && B.warns.length === 0, 'no errors along the way');
done();
