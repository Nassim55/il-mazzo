const { boot, ok, done } = require('./harness');
const seeded = { simpatico: { seen: 4, wrong: 3 }, grigio: { seen: 10, wrong: 5 }, grande: { seen: 20, wrong: 0 } };
let { w, d, ev, key, setVal, errors, warns } = boot({ 'aggettivi-stats-v1': JSON.stringify(seeded) });
ok(warns.length === 0 && errors.length === 0, 'loads with no validator warnings or errors');
const labels = [...d.querySelectorAll('#subject-toggle .mode-option')].map(b => b.textContent.trim());
ok(JSON.stringify(labels) === JSON.stringify(['Sostantivi', 'Regolari', 'Irregolari', 'Al contrario', 'Aggettivi', 'Avverbi e congiunzioni', 'Possessivi', 'Preposizioni', 'Frasi', 'Scrittura', 'Dialoghi', 'Racconto']), `section switch: ${labels.join(' | ')}`);
d.querySelector('#subject-toggle [data-subject="adjectives"]').click();
ok(ev('subject') === 'adjectives' && d.getElementById('app-title').textContent === 'Aggettivi' && d.title === 'Il Mazzo · Aggettivi', 'title and tab');
ok(ev('selectedNouns.size') === 0, 'adjectives start empty — the hand is shared by every section');
d.getElementById('select-all').click();
ok(ev('selectedNouns.size') === 200 && d.querySelector('.deck-readout').textContent.replace(/\s+/g, ' ').includes('200 adjectives · 200 cards'), 'All: every adjective (now 200 · 200 cards)');
ok(d.querySelector('#map-panel .map-chart .agreement-panel .endings-title')?.textContent === 'Le concordanze' && !d.querySelector('.setup-side') && d.getElementById('noun-map').querySelectorAll('.map-row').length === ev('ADJ_THEMES.length'), 'La mappa, a line per topic — with Le concordanze in its panel');
ok(/1\/200 practised|3\/200 practised/.test(d.getElementById('setup-meta').textContent), 'original history shows in the stats strip');
const weakRows = ev('weakestNouns(10)').slice(0, 2);
ok(JSON.stringify(weakRows) === JSON.stringify(['simpatico', 'grigio']), `the Weakest picks rank by error rate like the original Weakest (${weakRows.join(', ')})`);
const chips = [...d.querySelectorAll('.theme-chip')].map(c => c.textContent.replace(/\s+/g, ' ').trim());
ok(chips.length === 19 && chips.some(c => /^-chi · -ghi ?9$/.test(c)) && chips.some(c => /^Quantità ?7$/.test(c)), `19 theme chips (11 original + 4 new + 4 patterns): …${chips.slice(11).join(' | ')}`);
d.querySelector('#mode-toggle [data-mode="forms"]').click();
ok(d.getElementById('card-count').textContent === '667', 'All forms: 667 cards for all 200');
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
d.getElementById('select-all').click();   // a deck size picks from your hand (Nov 2026: no longer from the whole deck when the hand is empty)
setVal('deck-cap', '5'); setVal('deck-cap-mode', 'frequent', 'change');
d.getElementById('start-btn').click();
ok(JSON.stringify(ev('deck.map(c => c.noun).sort()')) === JSON.stringify(['grande', 'italiano', 'nuovo', 'primo', 'vero']), 'the 5 most common: primo, nuovo, grande, italiano, vero');
// All 100 notes render
ev("adjMode = 'dictionary'; selectedNouns = new Set(adjData.map(a => a.it)); sessionMaxDeck = null; sessionPool = null; startGame();");
let notes = 0; for (let i = 0; i < ev('deck.length'); i++) { ev(`index = ${i}; render();`); d.getElementById('answer').value = 'x'; d.getElementById('submit').click(); const expected = ev(`ADJ_ITEMS.find(x => x.noun === deck[${i}].noun).note`).replace(/<[^>]+>/g, ''); if (d.querySelector('.feedback-note')?.textContent === expected) notes++; }
ok(notes === 200, `all 200 adjective notes render (${notes})`);
// Other sections untouched; backups; reload
d.getElementById('change-btn').click();
d.querySelector('#subject-toggle [data-subject="nouns"]').click();
ok(ev('subject') === 'nouns' && ev('selectedNouns.size') === 0 && !d.querySelector('.setup-side') && d.querySelectorAll('.verb-chip').length === 1061, 'nouns unchanged: no side panel, 1061 chips');
ok(['aggettivi-stats-v1', 'aggettivi-assoc-v1'].every(k => Object.keys(ev('buildBackup()').data).includes(k)), 'backups include the adjectives');
d.querySelector('#subject-toggle [data-subject="adjectives"]').click();
const store = {}; for (let i = 0; i < w.localStorage.length; i++) { const k = w.localStorage.key(i); store[k] = w.localStorage.getItem(k); }
const r = boot(store);
ok(r.ev('subject') === 'adjectives' && r.d.getElementById('app-title').textContent === 'Aggettivi', 'reload reopens Aggettivi');
ok(errors.length === 0 && r.errors.length === 0, `no runtime errors (${errors.join('; ')})`);
// ---- 151–200 (Nov 2026): the next 50, chosen and ranked as 101–150 were ----
({ w, d, ev } = boot({ 'flipcards-subject': 'adjectives' }));
const NEXT50 = ['comune', 'grave', 'famoso', 'continuo', 'impossibile', 'pericoloso', 'solito', 'incredibile', 'naturale', 'mezzo'];
ok(ev('ADJ_FREQUENCY_ORDER.length') === 200 && ev('ADJ_FREQUENCY_ORDER.slice(150, 160).join()') === NEXT50.join() && ev('ADJ_FREQUENCY_ORDER[199]') === 'scientifico'
   && ev("ADJ_FREQUENCY_ORDER.slice(0, 150).join()").startsWith('primo,nuovo,grande') && ev("ADJ_FREQUENCY_ORDER[149]") === 'breve',
   '151–200 follow on from 150 (comune, grave, famoso… scientifico); the first 150 keep their order');
ok(!ev("['proprio', 'ii', 'aereo'].some(k => adjData.some(a => a.it === k))"), 'left out, as the rules say: a possessive (proprio), a Roman numeral (II), a word that is nearly always a noun (aereo)');
const F = k => ev(`ADJ_FORMS[${JSON.stringify(k)}].join(' ')`);
ok(F('economico') === 'economico economica economici economiche' && F('tecnico') === 'tecnico tecnica tecnici tecniche' && F('vario') === 'vario varia vari varie'
   && F('medio') === 'medio media medi medie' && F('doppio') === 'doppio doppia doppi doppie' && F('europeo') === 'europeo europea europei europee'
   && F('peggiore') === 'peggiore peggiori', 'the tricky plurals written out: economici but economiche, vari, medi, doppi, europei and europee');
ok(ev("ADJ_THEMES.find(t => t.key === 'quantita').nouns.join()") === 'mezzo,vario,completo,medio,singolo,massimo,doppio' && ev("ADJ_THEMES.find(t => t.key === 'ordine').nouns.includes('quarto')")
   && ev("ADJ_THEMES.find(t => t.key === 'qualita').nouns.includes('peggiore') && ADJ_THEMES.find(t => t.key === 'confronto').nouns.includes('peggiore')"),
   'a new theme, Quantità (mezzo, doppio, singolo…); quarto with the ordinals; peggiore beside migliore');
ok(ev("adjData.find(a => a.it === 'grave').en") === 'grave · serious (illness, problem)' && ev("adjData.find(a => a.it === 'zitto').en") === 'silent (not talking)',
   'prompts that could be mistaken for serio or tranquillo say which is meant');
ok(/cheap/.test(ev("ADJ_ITEMS.find(n => n.noun === 'economico').note")) && /decreto ministeriale/.test(ev("ADJ_ITEMS.find(n => n.noun === 'ministeriale').note")),
   'each has its note: economico is usually "cheap"; the DM in DM 37/08 is a decreto ministeriale');
done();
