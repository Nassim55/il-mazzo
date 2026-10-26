const { boot, ok, done } = require('./harness');
// Seed the verb game's saved history in its ORIGINAL format
const seeded = { capire: { attempts: 20, wrongs: 15 }, finire: { attempts: 10, wrongs: 8 }, pulire: { attempts: 6, wrongs: 1 }, parlare: { attempts: 30, wrongs: 0 } };
let { w, d, ev, key, setVal, errors } = boot({ 'verbi-regolari-stats': JSON.stringify(seeded) });
d.querySelector('.theme-chip[data-theme="casa"]').click();        // a noun selection to check it survives the switch
setVal('deck-cap', '7');
d.querySelector('#subject-toggle [data-subject="verbs"]').click();
ok(ev('subject') === 'verbs' && d.getElementById('app-title').textContent === 'Verbi Regolari' && d.title === 'Il Mazzo · Verbi Regolari', 'switch → Verbi Regolari title and page title');
ok(!!d.querySelector('aside.endings .eg') && d.querySelector('.endings-title').textContent === 'Le desinenze', 'endings panel present beside the grid');
ok(ev('selectedNouns.size') === 0 && d.getElementById('deck-cap').value === '', 'verbs start with their own empty selection and subset box');
ok(/[134]\/150 practised/.test(d.getElementById('setup-meta').textContent), `old verb history shows in the stats strip ("${d.getElementById('setup-meta').textContent.replace(/\s+/g, ' ').trim()}")`);
// Weakest 10 uses the verb game's smoothed formula: capire 15/22, finire 8/12, pulire 1/8
d.getElementById('weakest-10').click();
const sel = ev('[...selectedNouns]');
ok(sel.length === 10 && sel.slice(0, 3).join() === 'capire,finire,pulire', `Weakest 10 starts capire, finire, pulire (${sel.slice(0, 3).join(', ')})`);
// Themes and card counts
d.getElementById('clear-all').click();
d.querySelector('.theme-chip[data-theme="isc"]').click();
ok(d.querySelector('.deck-readout').textContent.replace(/\s+/g, ' ').includes('8 verbs · 48 cards'), '-isc- theme: 8 verbs · 48 cards');
d.querySelector('#mode-toggle [data-mode="infinitives"]').click();
ok(d.getElementById('card-count').textContent === '8', 'Infinitives only → 8 cards');
d.querySelector('#mode-toggle [data-mode="conjugations"]').click();
// Play conjugations
d.getElementById('start-btn').click();
ok(ev('deck.length') === 48 && new Set(ev('deck.map(c => c.key)')).size === 48, 'game has 48 distinct cards');
ev("index = deck.findIndex(c => c.noun === 'capire' && c.person === 'io'); render();");
ok(d.getElementById('prompt').textContent === 'I understand' && d.getElementById('verb-meta').textContent === 'to understand' && d.getElementById('pronoun-hint').textContent === 'io', 'card shows prompt, verb meaning and person');
ok(d.getElementById('answer').placeholder === 'type the italian conjugation…', 'placeholder asks for the conjugation');
d.getElementById('answer').value = 'io capisco'; d.getElementById('submit').click();
let fb = d.getElementById('feedback');
ok(fb.className.includes('correct') && fb.querySelector('.pron')?.textContent === 'ca·pì·sco', `"io capisco" correct, pronunciation ${fb.querySelector('.pron')?.textContent}`);
ok(/capere/.test(fb.querySelector('.feedback-note')?.textContent || '') && !!d.getElementById('assoc-edit'), 'history note and association control on a verb');
d.getElementById('assoc-edit').click(); d.getElementById('assoc-input').value = 'capture → grasp'; key(d.getElementById('assoc-input'), 'Enter');
ok(JSON.parse(w.localStorage.getItem('verbi-regolari-assoc-v1') || '{}').capire === 'capture → grasp' && !(JSON.parse(w.localStorage.getItem('sostantivi-assoc-v1') || '{}').capire), 'verb association saved separately from noun ones');
let saved = JSON.parse(w.localStorage.getItem('verbi-regolari-stats'));
ok(saved.capire.attempts === 21 && saved.capire.wrongs === 15 && !('seen' in saved.capire), `progress saved in the original format (${JSON.stringify(saved.capire)})`);
ev("index = deck.findIndex(c => c.noun === 'finire' && c.person === 'io'); render();");
d.getElementById('answer').value = 'tu finisco'; d.getElementById('submit').click();
ok(/Wrong pronoun — should be io finisco/.test(d.getElementById('feedback').textContent), 'wrong pronoun detected');
const before = JSON.parse(w.localStorage.getItem('verbi-regolari-stats')).pulire;
ev("index = deck.findIndex(c => c.noun === 'pulire' && c.person === 'noi'); render();");
d.getElementById('submit').click();
ok(JSON.stringify(JSON.parse(w.localStorage.getItem('verbi-regolari-stats')).pulire) === JSON.stringify(before) && d.getElementById('feedback').classList.contains('hidden') && d.getElementById('answer').placeholder === 'type your answer first…', 'an empty answer leaves verb progress untouched — it is asked for again');
// Focus and Deck size work per verb
d.getElementById('game-focus-btn').click();
ok(d.getElementById('focus-total').textContent === '8', 'Focus lists the 8 verbs');
d.getElementById('focus-top-input').value = '3'; key(d.getElementById('focus-top-input'), 'Enter'); d.getElementById('focus-apply').click();
ok(ev('deck.length') === 18 && new Set(ev('deck.map(c => c.noun)')).size === 3, 'Focus top 3 → 18 cards from 3 verbs');
setVal('game-trim-rest', String(48 - ev('sessionMaxDeck.length')), 'change');   // the Focus cards + the rest = 48
ok(ev('deck.length') === 48 && new Set(ev('deck.map(c => c.key)')).size === 48, 'Deck size grows back to 48 with no duplicate cards');
// IT → EN in game
d.querySelector('.direction-toggle [data-dir="it-en"]').click();
ev("index = deck.findIndex(c => c.noun === 'capire' && c.person === 'lui'); render();");
ok(d.getElementById('prompt').textContent === 'capisce' && d.getElementById('verb-meta').style.display === 'none' && d.getElementById('pronoun-hint').style.display === 'none', 'IT→EN: Italian prompt, meaning and person hidden');
d.getElementById('answer').value = 'she understands'; d.getElementById('submit').click();
ok(d.getElementById('feedback').className.includes('correct'), 'lenient English: "she understands" accepted for he/she');
ev("index = deck.findIndex(c => c.noun === 'capire' && c.person === 'voi'); render();");
d.getElementById('answer').value = 'you guys understand'; d.getElementById('submit').click();
ok(!!d.getElementById('override-btn'), 'near-miss English offers "I was right"');
d.getElementById('override-btn').click();
ok(d.getElementById('feedback').className.includes('correct') && !!d.querySelector('.feedback .pron'), 'override keeps the pronunciation');
ok(!!w.localStorage.getItem('verbi-regolari-stats-iten') && JSON.parse(w.localStorage.getItem('verbi-regolari-stats')).capire.attempts === 21, 'IT→EN progress kept separately');
// Completion screen wording
ev('index = deck.length; render();');
ok(/← Change verbs/.test(d.querySelector('.complete-actions').textContent), 'completion screen says "Change verbs"');
// Infinitive mode + most common, nothing selected
d.getElementById('back-to-setup').click();
d.querySelector('#direction-toggle [data-direction="en-it"]').click();
d.getElementById('clear-all').click();
d.querySelector('#mode-toggle [data-mode="infinitives"]').click();
setVal('deck-cap', '10'); setVal('deck-cap-mode', 'frequent', 'change');
ok(d.getElementById('start-btn').textContent.includes('10 most common cards') && d.querySelector('.deck-readout').textContent.includes('drawn from all 150 verbs'), 'nothing selected + 10 most common → from all 100 verbs');
d.getElementById('start-btn').click();
const top10 = ev('FREQUENCY_ORDER.slice(0, 10)'), deck10 = ev('deck.map(c => c.noun)');
ok(deck10.length === 10 && top10.every(v => deck10.includes(v)), `plays the 10 most common verbs (${top10.slice(0, 4).join(', ')}…)`);
ev("index = deck.findIndex(c => c.noun === 'pensare'); render();");
ok(d.getElementById('prompt').textContent === 'to think' && d.getElementById('answer').placeholder === 'type the italian infinitive…', 'infinitive card');
d.getElementById('answer').value = 'pensare'; d.getElementById('submit').click();
ok(d.querySelector('.feedback .pron')?.textContent === 'pen·sà·re' && /weigh/.test(d.querySelector('.feedback-note')?.textContent || ''), 'infinitive pronunciation and the pensare note');
// Back to nouns: everything as it was
d.getElementById('change-btn').click();
d.querySelector('#subject-toggle [data-subject="nouns"]').click();
ok(ev('subject') === 'nouns' && ev('selectedNouns.size') === 73 && d.getElementById('deck-cap').value === '7' && d.getElementById('app-title').textContent === 'Sostantivi', 'nouns: Casa selection and subset "7" kept, title restored');
ok(!d.querySelector('aside.endings') && d.querySelectorAll('.verb-chip').length === 941, 'noun setup restored (941 chips, no endings panel)');
const store = {}; for (let i = 0; i < w.localStorage.length; i++) { const k = w.localStorage.key(i); store[k] = w.localStorage.getItem(k); }
// Reload remembers the last subject
d.querySelector('#subject-toggle [data-subject="verbs"]').click();
const store2 = {}; for (let i = 0; i < w.localStorage.length; i++) { const k = w.localStorage.key(i); store2[k] = w.localStorage.getItem(k); }
const r = boot(store2);
ok(r.ev('subject') === 'verbs' && r.d.getElementById('app-title').textContent === 'Verbi Regolari', 'reload reopens the last subject (verbs)');
ok(errors.length === 0 && r.errors.length === 0 && r.warns.length === 0, `no runtime errors or warnings (${errors.concat(r.errors).join('; ')})`);
done();
