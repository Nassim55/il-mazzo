// The pick grid, shaded by your record: each tile's colour comes from its error rate in the
// current direction — olive (rarely wrong) through gold to terracotta (wrong half the time
// or more) — faint while it has had few tries; untried tiles stay plain.
const { boot, ok, done } = require('./harness');

const rgb = c => (c.match(/\d+/g) || []).map(Number);
const redness = c => { const [r, g, b] = rgb(c); return r - g; };                  // terracotta: high; olive: negative
const strength = c => { const [r, g, b] = rgb(c); return Math.abs(251 - r) + Math.abs(246 - g) + Math.abs(234 - b); };   // distance from the paper
const tile = (d, k) => d.querySelector(`.verb-chip[data-noun="${k}"]`);
const shade = (d, k) => tile(d, k).style.getPropertyValue('--shade');

// ---- Nothing practised: plain tiles, no key ----
let B = boot({ 'flipcards-subject': 'nouns' });
ok(!B.d.querySelector('.verb-chip.shaded') && !B.d.getElementById('shade-key'), 'nothing practised yet: every tile plain, and no key');
ok(tile(B.d, 'casa').title === 'Not practised yet (English → Italian)', 'hovering an untried tile says so');

// ---- A record: the colour follows the error rate ----
const nounStats = { casa: { seen: 10, wrong: 0 }, acqua: { seen: 8, wrong: 2 }, pane: { seen: 10, wrong: 5 }, tempo: { seen: 6, wrong: 6 }, libro: { seen: 1, wrong: 1 } };
B = boot({ 'flipcards-subject': 'nouns', 'sostantivi-stats-v1': JSON.stringify(nounStats) });
const { d } = B;
ok(['casa', 'acqua', 'pane', 'tempo', 'libro'].every(k => tile(d, k).classList.contains('shaded') && shade(d, k).startsWith('rgb(')) && !tile(d, 'uomo').classList.contains('shaded'),
   'practised tiles are shaded; untried ones stay plain');
ok(redness(shade(d, 'casa')) < redness(shade(d, 'acqua')) && redness(shade(d, 'acqua')) < redness(shade(d, 'pane')),
   'from olive (never wrong) through gold (wrong a quarter of the time) to terracotta (half the time)');
ok(shade(d, 'pane') === shade(d, 'tempo'), 'wrong half the time or more: the full terracotta — the bad end saturates');
ok(strength(shade(d, 'libro')) < strength(shade(d, 'tempo')) && redness(shade(d, 'libro')) > 0,
   'one try, one slip: a faint terracotta, well short of a word missed every time in six tries');
ok(strength(shade(d, 'casa')) < strength(shade(d, 'pane')), 'the bad end stands out more than the good');
ok(tile(d, 'pane').title === 'Wrong 5 of 10 times — 50% (English → Italian)' && tile(d, 'libro').title === 'Wrong 1 of 1 time — 100% (English → Italian)',
   'hovering gives the numbers, and the direction they belong to');
const key = d.getElementById('shade-key');
ok(key && /rarely wrong/.test(key.textContent) && /often wrong/.test(key.textContent) && /fainter: only a few tries/.test(key.textContent)
   && /plain: not tried yet/.test(key.textContent) && /English → Italian/.test(key.textContent) && /linear-gradient/.test(key.querySelector('.shade-key-bar').getAttribute('style')),
   'a key above the grid: the scale, what fainter and plain mean, and the direction');

// ---- Left-out tiles keep their shade ----
B.ev("selectedNouns = new Set(['casa']); showSetup();");
ok(tile(d, 'pane').classList.contains('unselected') && tile(d, 'pane').classList.contains('shaded') && shade(d, 'pane') !== '',
   'a tile left out keeps its shade (its dashed border and fading say it\'s out)');

// ---- The direction's own record ----
B = boot({ 'flipcards-subject': 'nouns', 'sostantivi-stats-v1': JSON.stringify(nounStats), 'sostantivi-stats-iten-v1': JSON.stringify({ casa: { seen: 4, wrong: 4 } }) });
B.ev("direction = 'it-en'; stats = loadStats(); showSetup();");
ok(redness(shade(B.d, 'casa')) > 0 && !tile(B.d, 'pane').classList.contains('shaded') && /Italian → English/.test(B.d.getElementById('shade-key').textContent)
   && tile(B.d, 'casa').title === 'Wrong 4 of 4 times — 100% (Italian → English)', 'switch to Italian → English and the grid shows that record instead');

// ---- Verbs: their own records ----
B = boot({ 'flipcards-subject': 'verbs', 'verbi-regolari-stats': JSON.stringify({ parlare: { attempts: 8, wrongs: 0 }, cercare: { attempts: 10, wrongs: 6 } }) });
ok(tile(B.d, 'parlare').classList.contains('shaded') && shade(B.d, 'parlare') === B.ev('shadeColor(0, 1)') && shade(B.d, 'cercare') === B.ev('shadeColor(1, 1)')
   && tile(B.d, 'cercare').title === 'Wrong 6 of 10 times — 60% (English → Italian)', 'verbs: shaded from their own records (parlare green, cercare terracotta)');
ok(B.errors.length === 0 && B.warns.length === 0, 'no errors along the way');
done();
