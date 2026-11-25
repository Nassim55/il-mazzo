// Chi ci lavora (Nov 25, 2026): the people behind the shops and trades — 55 nouns, 45 new — shopkeepers first, in the
// order of Pizzeria & co.'s shops (il macellaio for la macelleria…), then the trades, then the services.
const { boot, ok, done } = require('./harness');
const B = boot({ 'flipcards-subject': 'nouns' });
const { d, ev } = B;
const t = ev("NOUN_THEMES.find(t => t.key === 'chi-ci-lavora')");
ok(B.errors.length === 0 && B.warns.length === 0, 'loads with no errors or data warnings');
ok(t && t.label === 'Chi ci lavora' && t.en === 'Shopkeepers & trades' && t.nouns.length === 55, `the topic: ${t.label} / ${t.en}, ${t.nouns.length} nouns`);
const items = ev("NOUN_THEMES.find(t => t.key === 'chi-ci-lavora').nouns.map(k => NOUN_ITEMS.find(n => n.noun === k))");
ok(items.every(n => n && n.note && /^(il |lo |la |l')/.test(n.it)), 'every one a real noun with its article and a note');
ok(ev("NOUN_THEMES.find(t => t.key === 'chi-ci-lavora').nouns.filter(k => !NOUN_THEMES.some(o => o.key !== 'chi-ci-lavora' && o.nouns.includes(k))).length") >= 44, 'nearly all new to the deck: only the ones it shares stay elsewhere too');
const eria = ev("NOUN_THEMES.find(t => t.key === 'eria').nouns");
const pairs = [['macelleria', 'macellaio'], ['libreria', 'libraio'], ['tabaccheria', 'tabaccaio'], ['gioielleria', 'gioielliere'], ['orologeria', 'orologiaio'], ['pescheria', 'pescivendolo'], ['osteria', 'oste']];
ok(pairs.every(([shop, who]) => eria.includes(shop) && t.nouns.includes(who)) && items.find(n => n.noun === 'macellaio').en === 'the butcher' && items.find(n => n.noun === 'libraio').en === 'the bookseller',
   'the shopkeepers pair with the shops of Pizzeria & co.: la macelleria — il macellaio (the butcher), la libreria — il libraio (the bookseller)…');
ok(items.find(n => n.noun === 'spazzino').it === 'lo spazzino' && items.find(n => n.noun === 'oste').it === "l'oste" && items.find(n => n.noun === 'estetista').g === 'f', 'articles right: lo spazzino, l\'oste, l\'estetista (feminine)');
ok(ev("NOUN_ITEMS.find(n => n.noun === 'portiere').en") === 'the goalkeeper' && items.find(n => n.noun === 'portinaio').en === 'the doorman/concierge', 'il portiere stays the goalkeeper; the doorman is il portinaio');
const row = d.querySelector('.map-row[data-topic="chi-ci-lavora"]');
ok(row && /Shopkeepers & trades · 55/.test(row.querySelector('.map-en').textContent) && row.querySelectorAll('.map-cell').length === 55, 'its row on the map');
done();
