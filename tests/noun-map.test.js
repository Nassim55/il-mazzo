// La mappa: the nouns page is the map. The picks and Start come first; then a line of
// squares per topic in the grid's colours (strongest first, the untried plain at the end,
// those in the deck outlined), and beside it a panel: tap a topic and its nouns open
// there, each one tap away from the deck. The % is how much of the topic you know (knowState:
// the track record), the known first along the line; topics ranked by it. The grid folds away below.
const { boot, ok, done } = require('./harness');

const stats = { casa: { seen: 6, wrong: 0 }, cane: { seen: 5, wrong: 4 }, gatto: { seen: 2, wrong: 1 }, libro: { seen: 8, wrong: 1 }, acqua: { seen: 3, wrong: 3 } };
// Known, by the track record: casa (6 of 6) and libro (7 of 8) are; cane, gatto and acqua aren't
let B = boot({ 'flipcards-subject': 'nouns', 'sostantivi-stats-v1': JSON.stringify(stats) });
const map = () => B.d.getElementById('noun-map');
const panel = () => B.d.getElementById('map-panel');
const row = k => map().querySelector(`.map-row[data-topic="${k}"]`);
const redraw = () => B.ev("document.getElementById('noun-map').innerHTML = nounMapInner()");   // what the next frame does
ok(B.errors.length === 0 && map() && map().querySelectorAll('.map-row').length === 38, 'the nouns page shows La mappa: a line for each of its 38 topics');

// ---- The page: the picks and Start first, then the map; no theme chips; the grid folded ----
const parts = [...B.d.querySelectorAll('.setup-main > *')].map(e => e.id || e.className.split(' ')[0]);
ok(B.d.getElementById('hand').compareDocumentPosition(B.d.getElementById('noun-map')) & 4 && parts.indexOf('noun-map') < parts.indexOf('grid-fold')
   && B.d.querySelector('#hand #start-btn') && B.d.querySelector('#hand [data-direction="spasso"]') && B.d.querySelector('.setup-foot #setup-meta') && B.d.querySelector('.setup-foot #audio-row') && !B.d.querySelector('#setup-more'),
    `the hand — Start, with A spasso in its switch — comes above the map; your progress and the voice at the foot (${parts.filter(x => x !== 'theme-row').join(' → ')})`);
ok(B.d.getElementById('theme-row').hidden && B.d.getElementById('verb-grid').closest('details.grid-fold') && !B.d.getElementById('grid-fold').open
   && /Every noun, one by one \(1495\)/.test(B.d.querySelector('.grid-fold summary').textContent), 'the theme chips give way to the map; the 1495 nouns fold away underneath');
ok(B.d.querySelector('.container').dataset.map === '1' && ['verbs', 'irregular', 'adjectives'].every(s => boot({ 'flipcards-subject': s }).d.querySelector('.container').dataset.map === '1') && ['phrases', 'prepositions'].every(s => boot({ 'flipcards-subject': s }).d.querySelector('.container').dataset.map === '0'), 'a wide page for the map — the word sections');

// ---- A topic's line ----
ok(B.ev('NOUN_THEMES').every(t => row(t.key).querySelectorAll('.map-strip .map-cell').length === t.nouns.length), 'a square for every noun in every topic');
ok(map().querySelector('.theme-eyebrow') && map().querySelector('.shade-key .shade-key-bar') && /La mappa · English → Italian/.test(map().querySelector('.map-eyebrow').textContent) && /in your deck/.test(map().querySelector('.shade-key').textContent) && map().querySelector('details.map-how'),
   'in the site\'s own pieces: the theme row\'s eyebrow, the grid\'s colour key');
const topicOf = k => B.ev(`NOUN_THEMES.find(t => t.nouns.includes(${JSON.stringify(k)})).key`);
const animali = row(topicOf('cane'));
const titles = [...animali.querySelectorAll('.map-strip .map-cell')].map(c => c.getAttribute('title'));
const firstNew = titles.findIndex(x => /not tried yet/.test(x));
ok(titles.slice(0, firstNew).every(x => /right \d+ of \d+/.test(x)) && titles.slice(firstNew).every(x => /not tried yet/.test(x)), 'tried squares first, coloured; the untried plain at the end');
const casaTitles = [...row(topicOf('casa')).querySelectorAll('.map-cell')].map(c => c.getAttribute('title'));
ok(titles.some(x => /right 1 of 2 · 4 more right answers to count/.test(x)) && casaTitles.some(x => /^.+ — .+: right 6 of 6 · known$/.test(x)), 'each square\'s tooltip says whether it\'s known — or what it still needs');
const order = titles.slice(0, firstNew).map(x => x.split(' — ')[0]);
const rateOf = it => { const k = B.ev(`NOUN_ITEMS.find(n => n.it === ${JSON.stringify(it)}).noun`); return stats[k].wrong / stats[k].seen; };
const knownIts = ['casa', 'libro'].map(k => B.ev(`NOUN_ITEMS.find(n => n.noun === ${JSON.stringify(k)}).it`));
const rest = order.filter(it => !knownIts.includes(it));
ok(order.slice(0, order.length - rest.length).every(it => knownIts.includes(it)) && rest.every((it, i) => i === 0 || rateOf(rest[i - 1]) <= rateOf(it)), `the known first along the line, then the rest strongest first (${order.join(', ')})`);
ok([...row(topicOf('casa')).querySelectorAll('.map-cell.known')].length === B.ev(`NOUN_THEMES.find(t => t.key === ${JSON.stringify(topicOf('casa'))}).nouns.filter(k => ['casa', 'libro'].includes(k)).length`) && !row(topicOf('cane')).querySelector('.map-cell.known') === !B.ev(`NOUN_THEMES.find(t => t.key === ${JSON.stringify(topicOf('cane'))}).nouns.some(k => ['casa', 'libro'].includes(k))`), 'the known squares are dotted — what the % counts');
// ---- The percentage: how much of the topic you know ----
const pctOf = key => B.ev(`(() => { const t = NOUN_THEMES.find(t => t.key === ${JSON.stringify(key)}); return Math.round(t.nouns.filter(k => ['casa', 'libro'].includes(k)).length / t.nouns.length * 100); })()`);
const shown = key => row(key).querySelector('.map-score').textContent;
ok(shown(topicOf('casa')) === `${pctOf(topicOf('casa'))}%` && shown(topicOf('casa')) !== '0%' && shown(topicOf('cane')) === `${pctOf(topicOf('cane'))}%`,
   `the % is the share of the topic's nouns you know: casa's topic ${shown(topicOf('casa'))}, cane's ${shown(topicOf('cane'))} (gatto, right 1 of 2, doesn't count yet)`);
ok(row('arabo').querySelector('.map-score').textContent === '0%' && row('arabo').querySelector('.map-score').classList.contains('untried'), 'a topic not started: 0%, faded');
const scores = [...map().querySelectorAll('.map-rows .map-row')].map(r => parseInt(r.querySelector('.map-score').textContent, 10));
const keysNow = [...map().querySelectorAll('.map-rows .map-row')].map(r => r.dataset.topic);
ok(scores.every((x, i) => i === 0 || scores[i - 1] >= x) && keysNow[0] === [topicOf('casa'), topicOf('libro')].sort((a, b) => pctOf(b) - pctOf(a))[0] && !map().querySelector('[data-map-sort]') && !map().querySelector('#map-hide'),
   'topics by how much you know, the highest at the top — always, with no sort or hide links');
ok(/dotted: known — right 5 times or more, on 8 of your last 10 answers, wrong no more than 1 time in 4 over your last 20, and right on 3 different days/.test(map().querySelector('.shade-key').textContent) && /the % is how much of the topic you know/.test(map().querySelector('.shade-key').textContent), 'the key says what the dots and the % mean');

// ---- The panel ----
ok(panel().classList.contains('endings') && panel().querySelector('.endings-title').textContent === 'I progressi' && panel().querySelectorAll('.prog-tile').length === 3 && panel().querySelectorAll('.prog-chart').length === 2 && panel().querySelector('.prog-tiles + .prog-split'),
   'before a topic is opened, the panel — a side panel like the others — shows I progressi');
row(topicOf('cane')).querySelector('.map-head').click();
ok(panel().querySelector('.endings-title').textContent === B.ev(`NOUN_THEMES.find(t => t.key === ${JSON.stringify(topicOf('cane'))}).label`)
   && row(topicOf('cane')).classList.contains('open') && /To work on/.test(panel().textContent), 'tap one (here, or its line on the map): its nouns open in the panel beside the map');
B.ev(`mapOpen = ${JSON.stringify(topicOf('casa'))}`); redraw();
ok(/Known/.test(panel().textContent) && [...panel().querySelectorAll('.endings-note')].find(g => /Known/.test(g.textContent)).textContent.includes(B.ev("NOUN_ITEMS.find(n => n.noun === 'casa').it"))
   && new RegExp(`${B.ev(`NOUN_THEMES.find(t => t.key === ${JSON.stringify(topicOf('casa'))}).nouns.filter(k => ['casa', 'libro'].includes(k)).length`)} of \\d+ known`).test(panel().querySelector('.map-sum').textContent),
   'in the panel: To work on, Known, Not tried yet — and how many of the topic you know');
B.ev(`mapOpen = ${JSON.stringify(topicOf('cane'))}`); redraw();
const firstChip = panel().querySelector('.map-tiles .map-tile');
ok(firstChip.textContent.includes(B.ev("NOUN_ITEMS.find(n => n.noun === 'cane').it")) && /Right 1 of 5/.test(firstChip.title) && firstChip.querySelector('.verb-chip-italian') && firstChip.classList.contains('shaded')
   && firstChip.classList.contains('unselected'), 'weakest first, as the grid\'s tiles: shaded by your record, dashed while not in the deck');

// ---- The panel's actions are buttons; the panel scrolls with the page ----
const acts = panel().querySelector('.map-actions');
ok(acts.querySelector('button.submit.map-addall[data-map-pick="all"]') && /＋ Add all \d+ to your deck/.test(acts.textContent)
     && acts.querySelector('button.submit.secondary.map-practise[data-map-pick="unknown"]') && /▶ Practise the \d+ not yet known/.test(acts.textContent),
     'the actions are the game\'s buttons: dark to add the whole topic, outlined to practise the ones not yet known');
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
ok(B.ev('selectedNouns.size') === animaliN && /take them out/.test(panel().textContent) && row(topicOf('cane')).querySelector('.map-add.in'), `Add all: the whole topic (${animaliN}) is in — its line says ✓ In deck`);
row(topicOf('casa')).querySelector('.map-head').click();
ok(!panel().querySelector('[data-map-pick="new"]') && !/not tried<\/button>|Add the \d+ not tried/.test(panel().innerHTML), 'no button to add the untried ones (Nov 2026: it made way for the words you know)');
panel().querySelector('[data-map-pick="all"]').click();
panel().querySelector('[data-map-pick="none"]').click();
ok(!B.ev(`NOUN_THEMES.find(t => t.key === ${JSON.stringify(topicOf('casa'))}).nouns.some(k => selectedNouns.has(k))`) && B.ev('selectedNouns.has("cane")') === !B.ev(`NOUN_THEMES.find(t => t.key === ${JSON.stringify(topicOf('casa'))}).nouns.includes("cane")`),
   'Take all out: just that topic leaves the deck');

// ---- The picks above, and the map follows ----
B.ev("nounData.forEach(n => selectedNouns.add(n.noun)); deckTopics = null; updateReadout();");
redraw();
ok(B.ev('NOUN_THEMES').every(t => new RegExp(`● ${t.nouns.length} in your deck`).test(row(t.key).textContent)), 'Select all, above: every topic shows all its nouns in the deck');
B.ev("selectedNouns.clear(); deckTopics = []; updateReadout();");
redraw();
ok(!map().querySelector('.map-indeck') && !map().querySelector('.map-cell.in:not(.new)') && B.ev('selectedNouns.size') === 0, 'Clear all: none');

// ---- Practise the ones not yet known: picked, and off ----
row(topicOf('cane')).querySelector('.map-head').click();
row(topicOf('cane')).querySelector('.map-head').click();
ok(!map().querySelector('.map-row.open') && panel().querySelector('.endings-title').textContent === 'I progressi', 'tap an open topic\'s line again to close it');
row(topicOf('cane')).querySelector('.map-head').click();
const notKnown = B.ev(`mapNotKnown(mapTopic(NOUN_THEMES.find(t => t.key === ${JSON.stringify(topicOf('cane'))}), new Map(NOUN_ITEMS.map(n => [n.noun, n])))).map(c => c.key)`);
const openSize = B.ev(`NOUN_THEMES.find(t => t.key === ${JSON.stringify(topicOf('cane'))}).nouns.length`);
const deckBefore = B.ev('[...selectedNouns].sort().join()');
panel().querySelector('[data-map-pick="unknown"]').click();
ok(B.d.querySelector('.container').dataset.view === 'game' && notKnown.length > 0 && notKnown.length <= openSize && B.ev('deck.length') > 0 && (B.ev('capValue') ? true : B.ev('deck.length') === notKnown.length)
   && B.ev(`deck.every(c => ${JSON.stringify(notKnown)}.includes(c.noun))`),
   `Practise the ones not yet known: a round of exactly those starts — tried or not (${notKnown.length} of ${openSize})`);
ok(B.ev('[...selectedNouns].sort().join()') === deckBefore, '…and your deck is as it was, for afterwards');

// ---- Practise the ones you know (Nov 2026): to keep them fresh ----
B.ev('showSetup()');
const casaKnown = B.ev(`NOUN_THEMES.find(t => t.key === ${JSON.stringify(topicOf('casa'))}).nouns.slice(0, 3)`);
B.ev(`(() => { const k = SUBJECTS.nouns.statsKeys[direction], st = JSON.parse(localStorage.getItem(k) || '{}'), srs = JSON.parse(localStorage.getItem(k + ':srs') || '{}');
  for (const w of ${JSON.stringify(casaKnown)}) { st[w] = { seen: 10, wrong: 0 }; srs[w] = { h: '1111111111', b: 3, rd: 3 }; }
  localStorage.setItem(k, JSON.stringify(st)); localStorage.setItem(k + ':srs', JSON.stringify(srs)); })()`);
redraw();
row(topicOf('casa')).querySelector('.map-head').click();
const knownBtn = panel().querySelector('button.submit.secondary.map-practise[data-map-pick="known"]');
const knownNow = B.ev(`mapTopic(NOUN_THEMES.find(t => t.key === ${JSON.stringify(topicOf('casa'))}), new Map(NOUN_ITEMS.map(n => [n.noun, n]))).cells.filter(c => c.known).map(c => c.key)`);
ok(!!knownBtn && knownBtn.textContent === `▶ Practise the ${knownNow.length} you know` && knownNow.length >= 3, `the topic's panel offers the words you know: ${knownBtn && knownBtn.textContent}`);
const deckBefore2 = B.ev('[...selectedNouns].sort().join()');
knownBtn.click();
ok(B.d.querySelector('.container').dataset.view === 'game' && (B.ev('capValue') ? B.ev('deck.length') > 0 : B.ev('deck.length') === knownNow.length) && B.ev(`deck.every(c => ${JSON.stringify(knownNow)}.includes(c.noun))`),
   `Practise the ones you know: a round of exactly those starts (${knownNow.length})`);
ok(B.ev('[...selectedNouns].sort().join()') === deckBefore2, '…and your deck is as it was, for afterwards');

// ---- Hide, direction ----
B = boot({ 'flipcards-subject': 'nouns', 'sostantivi-stats-v1': JSON.stringify(stats) });
B.ev("direction = 'it-en'; stats = loadStats(); showSetup();");
ok(!B.d.querySelector('#noun-map .map-cell:not(.new)') && /Italian → English/.test(B.d.querySelector('#noun-map .map-eyebrow').textContent),
   'it follows the direction: Italian → English has its own record');
ok(B.errors.length === 0, 'no errors along the way');
// ---- Each row: the known first, then the rest — each green to red (Nov 2026) ----
const [redKnown, greenNot] = B.ev('NOUN_THEMES[0].nouns.slice(0, 2)');
B.ev(`(() => { const st = readStats('nouns', 'en-it'); st[${JSON.stringify(redKnown)}] = { seen: 10, wrong: 4 }; st[${JSON.stringify(greenNot)}] = { seen: 10, wrong: 1 };
  localStorage.setItem(SUBJECTS.nouns.statsKeys['en-it'], JSON.stringify(st)); stats = loadStats();
  const s = loadSrs('nouns', 'en-it'); s[${JSON.stringify(redKnown)}] = { b: 4, d: today() + 8, l: today(), h: '1111111111', rd: 3 }; s[${JSON.stringify(greenNot)}] = { b: 1, d: today() + 1, l: today(), h: '1111111100', rd: 3 };
  saveSrs('nouns', 'en-it', s); })()`);
const row0 = B.ev(`(() => { const x = mapTopic(NOUN_THEMES[0], new Map(NOUN_ITEMS.map(n => [n.noun, n])), loadSrs('nouns', 'en-it'), readStats('nouns', 'en-it')); return x.cells.map(c => ({ key: c.key, known: c.known })); })()`);
const iRed = row0.findIndex(c => c.key === redKnown), iGreen = row0.findIndex(c => c.key === greenNot);
ok(row0[iRed].known && !row0[iGreen].known && iRed < iGreen, 'a known word, even with a red history, comes before a greener one not yet known');
ok(B.ev(`(() => { const byKey = new Map(NOUN_ITEMS.map(n => [n.noun, n])); return NOUN_THEMES.every(t => { const x = mapTopic(t, byKey); const r = x.tried.map(c => c.rate || 0);
  const k = x.tried.filter(c => c.known).length, run = a => a.every((v, i) => i === 0 || a[i - 1] <= v);
  return x.tried.slice(0, k).every(c => c.known) && run(r.slice(0, k)) && run(r.slice(k)) && x.cells.slice(x.tried.length).every(c => !c.seen && !c.known); }); })()`),
   "every topic: the known squares first, then the rest, each running green to red — and the ones not tried yet last");
// ---- In panetteria (Nov 21, 2026): at the bakery ----
{
  const P = boot({ 'flipcards-subject': 'nouns' });
  const top = P.ev("(() => { const t = SUBJECTS.nouns.themes.find(t => t.key === 'panetteria'); return t ? { label: t.label, en: t.en, n: t.nouns.length, nouns: t.nouns } : null; })()");
  ok(top && top.label === 'In panetteria' && top.en === 'At the bakery' && top.n === 54 && !!P.d.querySelector('#noun-map .map-row[data-topic="panetteria"]'),
     'In panetteria: a row of its own on the map — 54 nouns, from la pagnotta to lo scontrino');
  const fresh = ['pagnotta', 'grissino', 'focaccia', 'cornetto', 'sfogliatella', 'mollica', 'vassoio', 'bignè'];
  ok(fresh.every(k => P.ev(`(() => { const n = SUBJECTS.nouns.items.find(n => n.noun === ${JSON.stringify(k)}); return !!n && !!n.note && Number.isFinite(rankOf(n.noun)); })()`)),
     'the new ones are full nouns: an article, a note on where the word comes from, and a place by frequency');
  ok(['pane', 'torta', 'scontrino', 'resto'].every(k => top.nouns.includes(k)) && P.ev("SUBJECTS.nouns.themes.find(t => t.key === 'cibo').nouns.includes('pane')"),
     'and the ones the app already had join it, staying in their own topics too');
  ok(P.errors.length === 0 && P.warns.length === 0, 'no errors or warnings');
}
// ---- Giardino e orto, to 50 (Nov 21, 2026): mostly words of its own ----
{
  const G = boot({ 'flipcards-subject': 'nouns' });
  const g = G.ev("(() => { const th = SUBJECTS.nouns.themes, t = th.find(t => t.key === 'giardino-orto'); return { n: t.nouns.length, only: t.nouns.filter(n => !th.some(x => x.key !== t.key && x.nouns.includes(n))).length, has: ['vanga', 'carriola', 'serra', 'terriccio', 'rosmarino', 'lombrico', 'coccinella'].every(k => t.nouns.includes(k)) }; })()");
  ok(g.n === 50 && g.only >= 38 && g.has, `Giardino e orto: 50 nouns, ${g.only} of them found in no other topic — la vanga, la carriola, la serra, il terriccio, il rosmarino, il lombrico…`);
  ok(G.errors.length === 0 && G.warns.length === 0, 'no errors or warnings');
}
done();
