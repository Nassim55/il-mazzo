// Avverbi e congiunzioni (Nov 2026): adverbs that mean the same, or nearly (molto, tanto), come side by side in every
// round that has more than one of them — wherever the group lands, in shuffled order within it — so the small
// difference between them gets drilled. Only adverb cards move: the same key in another section stays where it is.
const { boot, ok, done } = require('./harness');
const B = boot({ 'flipcards-subject': 'avverbi' });
const { d, ev } = B;

const groups = ev('AVV_TWINS');
const keys = ev('AVV_DATA.map(p => p.key)');
const flat = groups.flat();
ok(flat.every(k => keys.includes(k)) && new Set(flat).size === flat.length && groups.every(g => g.length >= 2),
   `${groups.length} groups, every one of their ${flat.length} adverbs real, none in two groups`);
ok(ev("AVV_TWIN_OF.get('molto-avv') === AVV_TWIN_OF.get('tanto-avv') && AVV_TWIN_OF.get('ma') === AVV_TWIN_OF.get('però')"), 'molto and tanto together; ma and però together');

// adjacency: every group's members in a deck sit in one unbroken run
const runsOk = deckKeys => groups.every(g => {
  const at = deckKeys.map((k, i) => g.includes(k) ? i : -1).filter(i => i >= 0);
  return at.length < 2 || at[at.length - 1] - at[0] === at.length - 1;
});
let allGood = true, pairsSeen = 0;
for (let i = 0; i < 40; i++) {
  const order = ev('inPlayOrder(shuffleDeck(SUBJECTS.avverbi.items.map(n => ({ noun: n.noun, key: n.noun }))))').map(c => c.noun);
  if (order.length !== 112 || new Set(order).size !== 112 || !runsOk(order)) allGood = false;
  pairsSeen += order.filter((k, j) => j && ev(`AVV_TWIN_OF.get(${JSON.stringify(k)})`) !== undefined && ev(`AVV_TWIN_OF.get(${JSON.stringify(k)}) === AVV_TWIN_OF.get(${JSON.stringify(order[j - 1])})`)).length;
}
ok(allGood, 'the whole section shuffled 40 times: every card still there, each group always side by side');
ok(ev(`(() => { const runs = new Set(); for (let i = 0; i < 30; i++) { const o = inPlayOrder(shuffleDeck(SUBJECTS.avverbi.items.map(n => ({ noun: n.noun, key: n.noun })))).map(c => c.noun); runs.add(o.indexOf('molto-avv') < o.indexOf('tanto-avv') ? 'mt' : 'tm'); } return runs.size === 2; })()`),
   'the order within a group is still shuffled (sometimes molto first, sometimes tanto)');

// other sections' cards, even with the same key, stay put
const mixed = ev(`twinsTogether([
  { noun: 'quindi', key: 'avverbi:quindi', subject: 'avverbi' },
  { noun: 'casa', key: 'nouns:casa', subject: 'nouns' },
  { noun: 'allora', key: 'phrases:allora', subject: 'phrases' },
  { noun: 'gatto', key: 'nouns:gatto', subject: 'nouns' },
  { noun: 'perciò', key: 'avverbi:perciò', subject: 'avverbi' }
]).map(c => c.key)`);
ok([mixed[0], mixed[1]].sort().join() === 'avverbi:perciò,avverbi:quindi' && mixed.slice(2).join() === 'nouns:casa,phrases:allora,nouns:gatto', `a mixed round: quindi and perciò together (either way round), Frasi’s allora left alone (${mixed.join(' · ')})`);

// cards added mid-round: what came before stays where it was
const mid = ev(`twinsTogether([
  { noun: 'molto-avv', key: 'a' }, { noun: 'ieri', key: 'b' }, { noun: 'tanto-avv', key: 'c' }, { noun: 'forse', key: 'd' }, { noun: 'oggi', key: 'e' }, { noun: 'magari', key: 'f' }
], 2).map(c => c.noun)`);
ok(mid.slice(0, 3).join() === 'molto-avv,ieri,tanto-avv' && [mid[3], mid[4]].sort().join() === 'forse,magari' && mid[5] === 'oggi', `mid-round: the cards before stay put; forse and magari join up after, either way round (${mid.join(' · ')})`);

// a real round from Start
ev("clearHand(); topicsIn(SUBJECTS.avverbi.themes.map(t => t.key)); updateReadout();");
d.getElementById('start-btn').click();
const round = ev('deck.map(c => c.noun)');
ok(round.length > 20 && runsOk(round), `a round started with Start (${round.length} cards): near-synonyms side by side`);
ok(B.errors.length === 0, 'no errors');

// ---- Nov 24: inside a group, the words that show the same meaning sit next to each other ----
const deckOf = keys => keys.map(k => `{ noun: ${JSON.stringify(k)}, key: ${JSON.stringify(k)} }`).join(', ');
const next = (o, a, b) => Math.abs(o.indexOf(a) - o.indexOf(b)) === 1;
let pc = true, mp = true, ways = new Set();
for (let i = 0; i < 40; i++) {
  const o = ev(`inPlayOrder(shuffleDeck(SUBJECTS.avverbi.items.map(n => ({ noun: n.noun, key: n.noun }))))`).map(c => c.noun);
  if (!next(o, 'però', 'comunque')) pc = false;
  if (!next(o, 'ma', 'però')) mp = false;
  ways.add(o.indexOf('ma') < o.indexOf('comunque') ? 'ma first' : 'comunque first');
}
ok(pc && mp, 'però always beside comunque ("however") and beside ma ("but") — nothing that shares neither comes between');
ok(ways.size === 2, 'and still not always the same way round');
let sub = true;
for (let i = 0; i < 20; i++) { const o = ev(`twinsTogether(shuffle([${deckOf(['però', 'oggi', 'tuttavia', 'qui', 'comunque', 'ieri'])}]))`).map(c => c.noun); if (!next(o, 'però', 'comunque')) sub = false; }
ok(sub, 'with tuttavia in the round too, però and comunque still side by side');
let others = true;
for (let i = 0; i < 30; i++) {
  const o = ev(`inPlayOrder(shuffleDeck(SUBJECTS.avverbi.items.map(n => ({ noun: n.noun, key: n.noun }))))`).map(c => c.noun);
  if (!next(o, 'tanto-avv', 'così') || !next(o, 'anche', 'troppo-avv') || !next(o, 'abbastanza', 'piuttosto')) others = false;
}
ok(others, 'tanto beside così ("so"), anche beside troppo ("too"), abbastanza beside piuttosto ("quite")');
const anchored = ev(`twinsTogether([${deckOf(['oggi', 'molto-avv', 'ieri', 'qui', 'tanto-avv'])}], 2)`).map(c => c.noun);
ok(anchored.join() === 'oggi,molto-avv,tanto-avv,ieri,qui', `the card you're on pulls its group-mates up behind it: ${anchored.join(' · ')}`);
done();

