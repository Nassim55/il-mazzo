// Pizzeria & co. (Nov 25, 2026): a noun topic of the commonest nouns in -erìa — 50, 45 of them new — shops and food
// places first, then workshops, offices, things and a few habits. Every one feminine, with a note like the others.
const { boot, ok, done } = require('./harness');
const B = boot({ 'flipcards-subject': 'nouns' });
const { d, ev } = B;
const t = ev("NOUN_THEMES.find(t => t.key === 'eria')");
ok(B.errors.length === 0 && B.warns.length === 0, 'loads with no errors or data warnings');
ok(t && t.label === 'Pizzeria & co.' && t.en === 'Words in -eria' && t.nouns.length === 50 && t.nouns.every(k => k.endsWith('eria')), `the topic: ${t.label} / ${t.en}, ${t.nouns.length} nouns, all in -eria`);
const items = ev("NOUN_THEMES.find(t => t.key === 'eria').nouns.map(k => NOUN_ITEMS.find(n => n.noun === k))");
ok(items.every(n => n && n.g === 'f' && /^(la |l')/.test(n.it) && n.note && /English/.test(n.note)), 'every one a real noun: feminine, with its article and a note that names an English relative');
ok(ev("NOUN_THEMES.find(t => t.key === 'eria').nouns.filter(k => !NOUN_THEMES.some(o => o.key !== 'eria' && o.nouns.includes(k))).length") === 45, '45 of them in no other topic');
ok(items.find(n => n.noun === 'libreria').en === 'the bookshop, the bookcase' && /false friend/.test(items.find(n => n.noun === 'libreria').note), 'la libreria: the bookshop — and the note warns it\'s a false friend (a library is la biblioteca)');
ok(ev("['gelateria', 'libreria', 'stregoneria'].every(k => typeof IT_WEIGHTS[k] === 'number' && IT_WEIGHTS[k] > 0) && rankOf('libreria') < rankOf('stregoneria')"), 'each counts towards everyday Italian, and takes its place by frequency (libreria well ahead of stregoneria)');
const row = d.querySelector('.map-row[data-topic="eria"]');
ok(row && /Pizzeria & co\./.test(row.querySelector('.map-it').textContent) && /Words in -eria · 50/.test(row.querySelector('.map-en').textContent) && row.querySelectorAll('.map-cell').length === 50,
   'it has its row on the map: Pizzeria & co. — Words in -eria · 50');
row.querySelector('[data-map-toggle="eria"]').click();
ok(ev('selectedNouns.size') === 50 && t.nouns.every(k => ev(`selectedNouns.has(${JSON.stringify(k)})`)), '＋ Add puts all 50 in your deck');
done();
