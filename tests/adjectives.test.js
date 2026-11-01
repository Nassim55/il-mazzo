const { boot, ok, done } = require('./harness');
const seeded = { simpatico: { seen: 4, wrong: 3 }, grigio: { seen: 10, wrong: 5 }, grande: { seen: 20, wrong: 0 } };
let { w, d, ev, key, setVal, errors, warns } = boot({ 'aggettivi-stats-v1': JSON.stringify(seeded) });
ok(warns.length === 0 && errors.length === 0, 'loads with no validator warnings or errors');
const labels = [...d.querySelectorAll('#subject-toggle .mode-option')].map(b => b.textContent.trim());
ok(JSON.stringify(labels) === JSON.stringify(['Sostantivi', 'Verbi regolari', 'Verbi irregolari', 'Aggettivi', 'Preposizioni', 'Frasi', 'Scrittura', 'Dialoghi', 'Racconto']), `section switch: ${labels.join(' | ')}`);
d.querySelector('#subject-toggle [data-subject="adjectives"]').click();
ok(ev('subject') === 'adjectives' && d.getElementById('app-title').textContent === 'Aggettivi' && d.title === 'Il Mazzo · Aggettivi', 'title and tab');
ok(ev('selectedNouns.size') === 150 && d.querySelector('.deck-readout').textContent.replace(/\s+/g, ' ').includes('150 adjectives · 150 cards'), 'every adjective starts selected, as in the original (now 150 · 150 cards)');
ok(d.querySelector('.agreement-panel .endings-title')?.textContent === 'Le concordanze' && d.querySelector('.setup-side').children[1].id === 'weak-panel', 'Le concordanze panel with Da ripassare under it');
ok(/1\/150 practised|3\/150 practised/.test(d.getElementById('setup-meta').textContent), 'original history shows in the stats strip');
const weakRows = [...d.querySelectorAll('#weak-panel .weak-it')].map(e => e.textContent);
ok(JSON.stringify(weakRows) === JSON.stringify(['simpatico', 'grigio']), `Da ripassare ranks by error rate like the original Weakest (${weakRows.join(', ')})`);
const chips = [...d.querySelectorAll('.theme-chip')].map(c => c.textContent.replace(/\s+/g, ' ').trim());
ok(chips.length === 18 && chips.some(c => /^-chi · -ghi ?9$/.test(c)), `18 theme chips (11 original + 3 new + 4 patterns): …${chips.slice(11).join(' | ')}`);
d.querySelector('#mode-toggle [data-mode="forms"]').click();
ok(d.getElementById('card-count').textContent === '511', 'All forms: 511 cards for all 150');
// Dictionary mode game
d.querySelector('#mode-toggle [data-mode="dictionary"]').click();
d.getElementById('clear-all').click();
ev("selectedNouns = new Set(['piccolo', 'grigio', 'marrone', 'alto', 'blu']); updateReadout();");
d.getElementById('start-btn').click();
ev("index = deck.findIndex(c => c.noun === 'piccolo'); render();");
ok(d.getElementById('prompt').textContent === 'small' && d.getElementById('verb-meta').textContent === '4-form · -o,-a,-i,-e' && d.getElementById('pronoun-hint').textContent === '+ aggettivo', 'card: "small", type label, "+ aggettivo"');
d.getElementById('answer').value = 'piccola'; d.getElementById('submit').click();
let fb = d.getElementById('feedback');
ok(fb.className.includes('correct') && /✓ Bravo — piccola/.test(fb.textContent) && !!fb.querySelector('.feedback-note'), '"piccola" accepted, echoed with Bravo; note shown on a correct answer');
d.getElementById('assoc-edit').click(); d.getElementById('assoc-input').value = 'piccolo flute'; key(d.getElementById('assoc-input'), 'Enter');
ok(JSON.parse(w.localStorage.getItem('aggettivi-assoc-v1')).piccolo === 'piccolo flute', 'association saved under the adjectives key');
ev("index = deck.findIndex(c => c.noun === 'alto'); render();");
d.getElementById('answer').value = 'alti'; d.getElementById('submit').click();
ok(/Not quite — the answer is alto/.test(d.getElementById('feedback').textContent), 'a plural is not the dictionary form');
const s0 = JSON.parse(w.localStorage.getItem('aggettivi-stats-v1')).blu;
ev("index = deck.findIndex(c => c.noun === 'blu'); render();"); d.getElementById('submit').click();
const s1 = JSON.parse(w.localStorage.getItem('aggettivi-stats-v1')).blu;
ok(JSON.stringify(s1) === JSON.stringify(s0) && ev('deck[index].noun') === 'blu' && d.getElementById('feedback').classList.contains('hidden'), 'an empty answer counts for nothing — you are asked for one');
d.getElementById('answer').value = 'rosso'; d.getElementById('submit').click();
const s2 = JSON.parse(w.localStorage.getItem('aggettivi-stats-v1')).blu;
ok(s2.seen === (s0 ? s0.seen : 0) + 1 && s2.wrong === (s0 ? s0.wrong : 0) + 1 && 'seen' in s2, 'a wrong answer counts as a mistake, as in the original; same saved format');
// All forms mode
d.getElementById('change-btn').click();
d.querySelector('#mode-toggle [data-mode="forms"]').click();
d.getElementById('start-btn').click();
ok(ev('deck.length') === 4 + 4 + 2 + 4 + 1, 'All forms: piccolo 4 + grigio 4 + marrone 2 + alto 4 + blu 1 = 15 cards');
ev("index = deck.findIndex(c => c.key === 'piccolo|fpl'); render();");
ok(d.getElementById('prompt').textContent === 'small' && d.getElementById('pronoun-hint').textContent === 'feminine plural', 'card: "small" + "feminine plural"');
d.getElementById('answer').value = 'piccole'; d.getElementById('submit').click();
ok(/✓ Bravo — piccole/.test(d.getElementById('feedback').textContent), '"piccole" accepted');
ev("index = deck.findIndex(c => c.key === 'grigio|fpl'); render();");
d.getElementById('answer').value = 'grige'; d.getElementById('submit').click();
ok(d.getElementById('feedback').className.includes('correct'), 'alternative spelling "grige" accepted');
ev("index = deck.findIndex(c => c.key === 'marrone|pl'); render();");
d.getElementById('answer').value = 'marrone'; d.getElementById('submit').click();
ok(d.getElementById('feedback').className.includes('correct'), '"marrone" accepted as a plural too (per its tip)');
ev("index = deck.findIndex(c => c.key === 'alto|mpl'); render();");
d.getElementById('answer').value = 'alto'; d.getElementById('submit').click();
ok(/the answer is alti \(masculine plural\)/.test(d.getElementById('feedback').textContent), 'wrong form: shows the right one and its gender/number');
// Focus, Deck size, direction
d.getElementById('game-focus-btn').click();
ok(d.getElementById('focus-total').textContent === '5', 'Focus lists the 5 adjectives');
d.getElementById('focus-top-input').value = '2'; key(d.getElementById('focus-top-input'), 'Enter'); d.getElementById('focus-apply').click();
ok(new Set(ev('deck.map(c => c.noun)')).size === 2, 'Focus top 2 → the cards of 2 adjectives');
setVal('game-trim-rest', String(15 - ev('sessionMaxDeck.length')), 'change');   // the Focus cards + the rest = 15
ok(ev('deck.length') === 15 && new Set(ev('deck.map(c => c.key)')).size === 15, 'Deck size grows back to 15 distinct cards');
d.querySelector('.direction-toggle [data-dir="it-en"]').click();
ev("index = deck.findIndex(c => c.key === 'alto|fsg'); render();");
ok(d.getElementById('prompt').textContent === 'alta' && d.getElementById('verb-meta').style.display === 'none', 'IT→EN shows "alta"');
d.getElementById('answer').value = 'high'; d.getElementById('submit').click();
ok(d.getElementById('feedback').className.includes('correct'), '"high" accepted for "tall · high"');
ev("index = deck.findIndex(c => c.noun === 'piccolo'); render();");
d.getElementById('answer').value = 'little'; d.getElementById('submit').click();
ok(!!d.getElementById('override-btn'), 'synonym "little" offers "I was right"');
ev('index = deck.length; render();');
ok(/← Change adjectives/.test(d.querySelector('.complete-actions').textContent), 'completion screen');
// Most common, nothing selected
d.getElementById('back-to-setup').click();
d.querySelector('#direction-toggle [data-direction="en-it"]').click();
d.querySelector('#mode-toggle [data-mode="dictionary"]').click();
d.getElementById('clear-all').click();
setVal('deck-cap', '5'); setVal('deck-cap-mode', 'frequent', 'change');
d.getElementById('start-btn').click();
ok(JSON.stringify(ev('deck.map(c => c.noun).sort()')) === JSON.stringify(['grande', 'italiano', 'nuovo', 'primo', 'vero']), 'the 5 most common: primo, nuovo, grande, italiano, vero');
// All 100 notes render
ev("adjMode = 'dictionary'; selectedNouns = new Set(adjData.map(a => a.it)); sessionMaxDeck = null; sessionPool = null; startGame();");
let notes = 0; for (let i = 0; i < ev('deck.length'); i++) { ev(`index = ${i}; render();`); d.getElementById('answer').value = 'x'; d.getElementById('submit').click(); const expected = ev(`ADJ_ITEMS.find(x => x.noun === deck[${i}].noun).note`).replace(/<[^>]+>/g, ''); if (d.querySelector('.feedback-note')?.textContent === expected) notes++; }
ok(notes === 150, `all 150 adjective notes render (${notes})`);
// Other sections untouched; backups; reload
d.getElementById('change-btn').click();
d.querySelector('#subject-toggle [data-subject="nouns"]').click();
ok(ev('subject') === 'nouns' && ev('selectedNouns.size') === 0 && !d.querySelector('.setup-side') && d.querySelectorAll('.verb-chip').length === 941, 'nouns unchanged: no side panel, 941 chips');
ok(['aggettivi-stats-v1', 'aggettivi-assoc-v1'].every(k => Object.keys(ev('buildBackup()').data).includes(k)), 'backups include the adjectives');
d.querySelector('#subject-toggle [data-subject="adjectives"]').click();
const store = {}; for (let i = 0; i < w.localStorage.length; i++) { const k = w.localStorage.key(i); store[k] = w.localStorage.getItem(k); }
const r = boot(store);
ok(r.ev('subject') === 'adjectives' && r.d.getElementById('app-title').textContent === 'Aggettivi', 'reload reopens Aggettivi');
ok(errors.length === 0 && r.errors.length === 0, `no runtime errors (${errors.join('; ')})`);
done();
