// La mappa: the nouns page is the map. The picks and Start come first; then a line of
// squares per topic in the grid's colours (strongest first, the untried plain at the end,
// those in the deck outlined), and beside it a panel: tap a topic and its nouns open
// there, weakest first, each one tap away from the deck. The grid folds away below.
const { boot, ok, done } = require('./harness');

const stats = { casa: { seen: 6, wrong: 0 }, cane: { seen: 5, wrong: 4 }, gatto: { seen: 2, wrong: 1 }, libro: { seen: 8, wrong: 1 }, acqua: { seen: 3, wrong: 3 } };
let B = boot({ 'flipcards-subject': 'nouns', 'sostantivi-stats-v1': JSON.stringify(stats) });
const map = () => B.d.getElementById('noun-map');
const panel = () => B.d.getElementById('map-panel');
const row = k => map().querySelector(`.map-row[data-topic="${k}"]`);
const redraw = () => B.ev("document.getElementById('noun-map').innerHTML = nounMapInner()");   // what the next frame does
ok(B.errors.length === 0 && map() && map().querySelectorAll('.map-row').length === 23, 'the nouns page shows La mappa: a line for each of its 23 topics');

// ---- The page: the picks and Start first, then the map; no theme chips; the grid folded ----
const parts = [...B.d.querySelectorAll('.setup-main > *')].map(e => e.id || e.className.split(' ')[0]);
ok(parts.indexOf('setup-controls') < parts.indexOf('start-btn') && parts.indexOf('start-btn') < parts.indexOf('noun-map') && parts.indexOf('noun-map') < parts.indexOf('grid-fold'),
   `the controls for picking, and Start, come above the map (${parts.filter(x => x !== 'theme-row').join(' → ')})`);
ok(B.d.getElementById('theme-row').hidden && B.d.getElementById('verb-grid').closest('details.grid-fold') && !B.d.getElementById('grid-fold').open
   && /Every noun, one by one \(941\)/.test(B.d.querySelector('.grid-fold summary').textContent), 'the theme chips give way to the map; the 941 nouns fold away underneath');
ok(B.d.querySelector('.container').dataset.map === '1' && boot({ 'flipcards-subject': 'adjectives' }).d.querySelector('.container').dataset.map === '0', 'a wide page for the map — Sostantivi only');

// ---- A topic's line ----
ok(B.ev('NOUN_THEMES').every(t => row(t.key).querySelectorAll('.map-strip .map-cell').length === t.nouns.length), 'a square for every noun in every topic');
ok(map().querySelector('.theme-eyebrow') && map().querySelector('.shade-key .shade-key-bar') && /outlined: in your deck · English → Italian/.test(map().querySelector('.shade-key').textContent),
   'in the site\'s own pieces: the theme row\'s eyebrow, the grid\'s colour key');
const topicOf = k => B.ev(`NOUN_THEMES.find(t => t.nouns.includes(${JSON.stringify(k)})).key`);
const animali = row(topicOf('cane'));
const titles = [...animali.querySelectorAll('.map-strip .map-cell')].map(c => c.getAttribute('title'));
const firstNew = titles.findIndex(x => /not tried yet/.test(x));
ok(titles.slice(0, firstNew).every(x => /right \d+ of \d+/.test(x)) && titles.slice(firstNew).every(x => /not tried yet/.test(x)), 'tried squares first, coloured; the untried plain at the end');
const order = titles.slice(0, firstNew).map(x => x.split(' — ')[0]);
const rateOf = it => { const k = B.ev(`NOUN_ITEMS.find(n => n.it === ${JSON.stringify(it)}).noun`); return stats[k].wrong / stats[k].seen; };
ok(order.every((it, i) => i === 0 || rateOf(order[i - 1]) <= rateOf(it)), `strongest first along the line (${order.join(', ')})`);
map().querySelector('[data-map-sort="weak"]').click();
const scores = [...map().querySelectorAll('.map-rows .map-row')].map(r => r.querySelector('.map-score').textContent);
const scored = scores.filter(x => x !== '—').map(x => parseInt(x, 10));
ok(scored.every((x, i) => i === 0 || scored[i - 1] <= x) && scores.slice(scored.length).every(x => x === '—'), 'Weakest first: the topics you get wrong most at the top');
map().querySelector('[data-map-sort="order"]').click();

// ---- The panel ----
ok(panel().classList.contains('endings') && panel().querySelector('.endings-title').textContent === 'I temi' && panel().querySelector(`.weak-row[data-map-open="${topicOf('cane')}"]`),
   'before a topic is opened, the panel — a side panel like the others — lists your weakest topics, as Da ripassare lists nouns');
panel().querySelector(`[data-map-open="${topicOf('cane')}"]`).click();
ok(panel().querySelector('.endings-title').textContent === B.ev(`NOUN_THEMES.find(t => t.key === ${JSON.stringify(topicOf('cane'))}).label`)
   && row(topicOf('cane')).classList.contains('open') && /To work on/.test(panel().textContent), 'tap one (here, or its line on the map): its nouns open in the panel beside the map');
const firstChip = panel().querySelector('.map-tiles .map-tile');
ok(firstChip.textContent.includes(B.ev("NOUN_ITEMS.find(n => n.noun === 'cane').it")) && /Right 1 of 5/.test(firstChip.title) && firstChip.querySelector('.verb-chip-italian') && firstChip.classList.contains('shaded')
   && firstChip.classList.contains('unselected'), 'weakest first, as the grid\'s tiles: shaded by your record, dashed while not in the deck');

// ---- The panel's actions are buttons; the panel scrolls with the page ----
const acts = panel().querySelector('.map-actions');
ok(acts.querySelector('button.submit.map-practise[data-map-pick="weak"]') && /▶ Practise the \d+ weakest/.test(acts.textContent)
   && acts.querySelector('button.submit.secondary[data-map-pick="all"]') && /\+ Add all \d+/.test(acts.textContent),
   'the actions are the game\'s buttons: dark to practise the weakest, outlined to add to the deck');
const st = (prev, dy, h, win) => B.ev(`mapStickTop(${prev}, ${dy}, ${h}, ${win})`);
ok(st(12, 500, 600, 800) === 12 && st(12, 300, 2000, 800) === -288 && st(-288, 5000, 2000, 800) === -1212 && st(-1212, -400, 2000, 800) === -812 && st(-812, -5000, 2000, 800) === 12,
   'one scroll, not two: a short panel stays put; a tall one moves with the page until its foot shows, holds, and comes back on the way up');

// ---- One noun at a time ----
firstChip.click();
ok(B.ev('selectedNouns.has("cane")') && B.d.getElementById('selected-count').textContent === '1' && !panel().querySelector('[data-map-noun="cane"]').classList.contains('unselected')
   && /● 1 in your deck/.test(row(topicOf('cane')).textContent) && row(topicOf('cane')).querySelector('.map-cell.in'), 'tap a noun: it\'s in the deck — solid, with the gold mark; its square outlined; the topic says how many');
panel().querySelector('[data-map-noun="cane"]').click();
ok(!B.ev('selectedNouns.has("cane")') && !/in your deck/.test(row(topicOf('cane')).querySelector('.map-name').textContent), 'tap again: out');

// ---- Whole topics, added up ----
const topicSize = k => B.ev(`NOUN_THEMES.find(t => t.key === ${JSON.stringify(k)}).nouns.length`);
panel().querySelector('[data-map-pick="all"]').click();
const animaliN = topicSize(topicOf('cane'));
ok(B.ev('selectedNouns.size') === animaliN && /Take all \d+ out/.test(panel().textContent), `Add all: the whole topic (${animaliN}) is in`);
row(topicOf('casa')).querySelector('.map-head').click();
panel().querySelector('[data-map-pick="new"]').click();
const newInCasa = B.ev(`NOUN_THEMES.find(t => t.key === ${JSON.stringify(topicOf('casa'))}).nouns.filter(k => !${JSON.stringify(Object.keys(stats))}.includes(k)).length`);
ok(B.ev('selectedNouns.size') >= animaliN + newInCasa - 2 && B.ev('selectedNouns.has("cane")'), 'Add the not tried, in another topic: added to what was there, not instead');
panel().querySelector('[data-map-pick="all"]').click();
panel().querySelector('[data-map-pick="none"]').click();
ok(!B.ev(`NOUN_THEMES.find(t => t.key === ${JSON.stringify(topicOf('casa'))}).nouns.some(k => selectedNouns.has(k))`) && B.ev('selectedNouns.has("cane")') === !B.ev(`NOUN_THEMES.find(t => t.key === ${JSON.stringify(topicOf('casa'))}).nouns.includes("cane")`),
   'Take all out: just that topic leaves the deck');

// ---- The picks above, and the map follows ----
B.d.getElementById('select-all').click();
redraw();
ok(B.ev('NOUN_THEMES').every(t => new RegExp(`● ${t.nouns.length} in your deck`).test(row(t.key).textContent)), 'Select all, above: every topic shows all its nouns in the deck');
B.d.getElementById('clear-all').click();
redraw();
ok(!map().querySelector('.map-indeck') && !map().querySelector('.map-cell.in:not(.new)') && B.ev('selectedNouns.size') === 0, 'Clear all: none');

// ---- Practise just the weakest: picked, and off ----
row(topicOf('cane')).querySelector('.map-head').click();
row(topicOf('cane')).querySelector('.map-head').click();
ok(!map().querySelector('.map-row.open') && panel().querySelector('.endings-title').textContent === 'I temi', 'tap an open topic\'s line again to close it');
panel().querySelector(`[data-map-open="${topicOf('cane')}"]`).click();
panel().querySelector('[data-map-pick="weak"]').click();
const withSlips = Object.keys(stats).filter(k => stats[k].wrong > 0 && B.ev(`NOUN_THEMES.find(t => t.key === ${JSON.stringify(topicOf('cane'))}).nouns.includes(${JSON.stringify(k)})`));
ok(B.d.querySelector('.container').dataset.view === 'game' && B.ev('deck.length') === withSlips.length && B.ev(`deck.every(c => ${JSON.stringify(withSlips)}.includes(c.noun))`),
   `Practise just the weakest: a round of exactly those starts (${withSlips.join(', ')})`);

// ---- Hide, direction ----
B = boot({ 'flipcards-subject': 'nouns', 'sostantivi-stats-v1': JSON.stringify(stats) });
map().querySelector('#map-hide').click();
ok(map().querySelector('#map-show') && !map().querySelector('.map-row') && JSON.parse(B.w.localStorage.getItem('mazzo-noun-map-v1')).hidden === true, 'hide: folded to one line, remembered');
map().querySelector('#map-show').click();
B.ev("direction = 'it-en'; stats = loadStats(); showSetup();");
ok(!B.d.querySelector('#noun-map .map-cell:not(.new)') && /Italian → English/.test(B.d.querySelector('#noun-map .shade-key').textContent),
   'it follows the direction: Italian → English has its own record');
ok(B.errors.length === 0, 'no errors along the way');
done();
