// La mappa: every noun topic at a glance — a line of squares per topic in the grid's
// colours, strongest first and the untried plain at the end; the share right on the
// right; a topic opens to its nouns by name, weakest first, with buttons that pick them.
const { boot, ok, done } = require('./harness');

const stats = { casa: { seen: 6, wrong: 0 }, cane: { seen: 5, wrong: 4 }, gatto: { seen: 2, wrong: 1 }, libro: { seen: 8, wrong: 1 }, acqua: { seen: 3, wrong: 3 } };
let B = boot({ 'flipcards-subject': 'nouns', 'sostantivi-stats-v1': JSON.stringify(stats) });
const map = () => B.d.getElementById('noun-map');
const row = k => map().querySelector(`.map-row[data-topic="${k}"]`);
ok(B.errors.length === 0 && map() && map().querySelectorAll('.map-row').length === 23, 'the nouns section shows La mappa: a line for each of its 23 topics');
ok(B.ev('NOUN_THEMES').every(t => row(t.key).querySelectorAll('.map-strip .map-cell').length === t.nouns.length), 'a square for every noun in every topic');
ok(/5 of 941 nouns practised · 3 often wrong/.test(map().querySelector('.map-overview').textContent.replace(/\s+/g, ' ')), 'above it: how many practised, how many often wrong');

// ---- A topic's line: strongest first, the untried plain at the end ----
const topicOf = k => B.ev(`NOUN_THEMES.find(t => t.nouns.includes(${JSON.stringify(k)})).key`);
const animali = row(topicOf('cane'));
const titles = [...animali.querySelectorAll('.map-strip .map-cell')].map(c => c.getAttribute('title'));
const firstNew = titles.findIndex(x => /not tried yet/.test(x));
ok(titles.slice(0, firstNew).every(x => /right \d+ of \d+/.test(x)) && titles.slice(firstNew).every(x => /not tried yet/.test(x))
   && animali.querySelectorAll('.map-strip .map-cell.new').length === titles.length - firstNew, 'tried squares first, coloured; the untried plain at the end');
const triedHere = Object.keys(stats).filter(k => B.ev(`NOUN_THEMES.find(t => t.key === ${JSON.stringify(topicOf('cane'))}).nouns.includes(${JSON.stringify(k)})`));
const order = titles.slice(0, firstNew).map(x => x.split(' — ')[0]);
const rateOf = it => { const k = B.ev(`NOUN_ITEMS.find(n => n.it === ${JSON.stringify(it)}).noun`); return stats[k].wrong / stats[k].seen; };
ok(order.every((it, i) => i === 0 || rateOf(order[i - 1]) <= rateOf(it)), `strongest first along the line (${order.join(', ')})`);
const casaTopic = row(topicOf('casa'));
const expect = k => { const ks = B.ev(`NOUN_THEMES.find(t => t.key === ${JSON.stringify(k)}).nouns`).filter(x => stats[x]); const s = ks.reduce((a, x) => a + stats[x].seen, 0), w = ks.reduce((a, x) => a + stats[x].wrong, 0); return s ? `${Math.round((1 - w / s) * 100)}%` : '—'; };
ok(casaTopic.querySelector('.map-score').textContent === expect(topicOf('casa')) && row('arabo').querySelector('.map-score').textContent === expect('arabo'),
   `on the right, how often you're right in the topic (${casaTopic.querySelector('.map-score').textContent}; untouched topics show —)`);

// ---- Weakest first ----
map().querySelector('[data-map-sort="weak"]').click();
const rows = [...map().querySelectorAll('.map-row')].map(r => r.querySelector('.map-score').textContent);
const scored = rows.filter(x => x !== '—').map(x => parseInt(x, 10));
ok(scored.every((x, i) => i === 0 || scored[i - 1] <= x) && rows.slice(scored.length).every(x => x === '—') && JSON.parse(B.w.localStorage.getItem('mazzo-noun-map-v1')).sort === 'weak',
   'Weakest first: the topics you get wrong most at the top, untouched ones last — remembered');

// ---- Opening a topic ----
const open = k => row(k).querySelector('.map-head').click();
open(topicOf('cane'));
const detail = row(topicOf('cane')).querySelector('.map-detail');
const labels = [...detail.querySelectorAll('.map-list-label')].map(x => x.textContent);
ok(row(topicOf('cane')).querySelector('.map-head').getAttribute('aria-expanded') === 'true' && labels[0] === 'To work on' && labels.includes('Not tried yet')
   && /right \d+% of the time/.test(detail.querySelector('.map-sum').textContent), 'tap a topic: its nouns by name — to work on, going well, not tried yet');
const work = [...detail.querySelectorAll('.map-chips')][0].querySelectorAll('.map-chip');
ok(work[0].textContent.includes(B.ev("NOUN_ITEMS.find(n => n.noun === 'cane').it")) && /1\/5/.test(work[0].textContent), 'to work on: the weakest first, with how often right');
open(topicOf('casa'));
ok(map().querySelectorAll('.map-row.open').length === 1 && row(topicOf('casa')).classList.contains('open'), 'one topic open at a time');

// ---- Picking from it ----
open(topicOf('cane'));
row(topicOf('cane')).querySelector('[data-map-pick="weak"]').click();
const picked = B.ev('[...selectedNouns]');
const withSlips = triedHere.filter(k => stats[k].wrong > 0).sort((a, b) => stats[b].wrong / stats[b].seen - stats[a].wrong / stats[a].seen);
ok(picked.length === withSlips.length && withSlips.every(k => picked.includes(k)) && B.d.getElementById('selected-count').textContent === String(withSlips.length)
   && /picked/.test(B.d.getElementById('map-picked').textContent), `Practise the weakest: the topic's nouns with mistakes go in the deck (${picked.join(', ')})`);
ok([...B.d.querySelectorAll('.verb-chip:not(.unselected)')].map(c => c.dataset.noun).sort().join() === [...picked].sort().join(), '…lit in the grid below too');
B.d.getElementById('map-go').click();
ok(B.d.activeElement && B.d.activeElement.id === 'start-btn', 'and "start practising" takes you to the start button');
row(topicOf('cane')).querySelector('[data-map-pick="all"]').click();
ok(B.ev('selectedNouns.size') === B.ev(`NOUN_THEMES.find(t => t.key === ${JSON.stringify(topicOf('cane'))}).nouns.length`), 'Pick all: the whole topic');
row(topicOf('cane')).querySelector('[data-map-pick="new"]').click();
ok(B.ev('[...selectedNouns]').every(k => !stats[k]), 'Pick the not tried: just the ones never practised');

// ---- Hide, direction, other sections ----
map().querySelector('#map-hide').click();
ok(map().querySelector('#map-show') && !map().querySelector('.map-row') && JSON.parse(B.w.localStorage.getItem('mazzo-noun-map-v1')).hidden === true, 'hide: folded to one line, remembered');
map().querySelector('#map-show').click();
ok(map().querySelectorAll('.map-row').length === 23, 'show: back again');
B = boot({ 'flipcards-subject': 'nouns', 'sostantivi-stats-v1': JSON.stringify(stats) });
B.ev("direction = 'it-en'; stats = loadStats(); showSetup();");
ok(/^0 of 941 nouns practised/.test(B.d.querySelector('.map-overview').textContent.replace(/\s+/g, ' ').trim()) && /Italian → English/.test(B.d.querySelector('.map-legend').textContent),
   'it follows the direction: Italian → English has its own record');
ok(!boot({ 'flipcards-subject': 'adjectives' }).d.getElementById('noun-map'), 'only in Sostantivi');
ok(B.errors.length === 0, 'no errors along the way');
done();
