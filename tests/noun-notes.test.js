// Notes for every noun, written in batches, most common first: where each comes from —
// above all the English words that share its origin — and a tip where one helps.
const { boot, ok, done } = require('./harness');

const B = boot({ 'flipcards-subject': 'nouns' });
const notes = B.ev('NOUN_NOTES');
const keys = Object.keys(notes);
ok(B.warns.length === 0 && B.errors.length === 0, 'loads cleanly: every note is for a real noun, and none clashes with a note it already had');
ok(keys.every(k => B.ev(`NOUN_ITEMS.find(n => n.noun === ${JSON.stringify(k)}).note`) === notes[k]), `each of the ${keys.length} notes reaches its noun`);
const withNote = B.ev('NOUN_ITEMS.filter(n => n.note).length');
ok(withNote >= 610, `${withNote} of 941 nouns have a note`);
const firstWithout = B.ev('NOUN_FREQUENCY_ORDER.findIndex(k => !NOUN_ITEMS.find(n => n.noun === k).note)');
ok(firstWithout === -1 || firstWithout >= 471, `the most common nouns are covered first: the first ${firstWithout === -1 ? 941 : firstWithout} by frequency all have one`);
const bad = keys.filter(k => {
  const v = notes[k];
  return (v.match(/<em>/g) || []).length !== (v.match(/<\/em>/g) || []).length || /<(?!\/?em>)/.test(v) || v.length < 40 || v.length > 420 || /\s{2,}/.test(v);
});
ok(bad.length === 0, `every note is tidy: tags in pairs (only <em>), between 40 and 420 characters (${bad.join(', ') || 'all fine'})`);
ok(keys.filter(k => /English/.test(notes[k])).length >= keys.length * 0.9, 'and nearly all give an English word that shares the origin');

// After answering, the card shows it
B.ev("selectedNouns = new Set(['giorno']); updateReadout();");
B.d.getElementById('start-btn').click();
B.d.getElementById('answer').value = 'il giorno';
B.d.getElementById('submit').click();
ok(/English 'diurnal', 'journal' and 'journey'/.test(B.d.getElementById('feedback').textContent), 'after answering, the card shows the note: il giorno — diurnal, journal, journey');
ok(/'curfew'/.test(B.ev("NOUN_ITEMS.find(n => n.noun === 'fuoco').note")) && /'zero' itself/.test(B.ev("NOUN_ITEMS.find(n => n.noun === 'cifra').note")), 'batch 2 too: il fuoco — focus, fuel, curfew; la cifra — cipher, zero');
ok(B.errors.length === 0, 'no errors along the way');
done();
