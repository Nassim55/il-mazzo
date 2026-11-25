// Parole composte (Nov 25, 2026): verb + noun compounds — 53, 46 new — the kitchen and home, personal things, the car,
// outdoors, and people and life. Nearly all masculine (la portaerei is short for la nave portaerei).
const { boot, ok, done } = require('./harness');
const B = boot({ 'flipcards-subject': 'nouns' });
const { d, ev } = B;
const t = ev("NOUN_THEMES.find(t => t.key === 'composte')");
ok(B.errors.length === 0 && B.warns.length === 0, 'loads with no errors or data warnings');
ok(t && t.label === 'Parole composte' && t.en === 'Compound nouns' && t.nouns.length === 53, `the topic: ${t.label} / ${t.en}, ${t.nouns.length} nouns`);
const items = ev("NOUN_THEMES.find(t => t.key === 'composte').nouns.map(k => NOUN_ITEMS.find(n => n.noun === k))");
ok(items.every(n => n && n.note && /^(il |lo |la |l')/.test(n.it)), 'every one a real noun with its article and a note');
ok(items.filter(n => n.g === 'f').map(n => n.noun).sort().join() === 'lavastoviglie,portaerei', 'masculine all but two: la lavastoviglie and la portaerei');
ok(/<em>Apri<\/em> \+ <em>scatole<\/em>/.test(items.find(n => n.noun === 'apriscatole').note) && /gli apriscatole/.test(items.find(n => n.noun === 'apriscatole').note),
   'the notes split each one into its parts: apri + scatole — and say what the plural does');
ok(['lavapiatti'].every(k => ev(`NOUN_THEMES.find(t => t.key === 'chi-ci-lavora').nouns.includes('${k}')`)) && t.nouns.includes('lavapiatti'), 'il lavapiatti is in both: a person who washes dishes, and a compound');
const row = d.querySelector('.map-row[data-topic="composte"]');
ok(row && /Compound nouns · 53/.test(row.querySelector('.map-en').textContent), 'its row on the map');
row.querySelector('[data-map-toggle="composte"]').click();
ok(ev('selectedNouns.size') === 53, '＋ Add puts all 53 in your deck');
done();
