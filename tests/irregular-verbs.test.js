const { boot, ok, done } = require('./harness');
const seeded = { venire: { attempts: 20, wrongs: 12 }, porre: { attempts: 9, wrongs: 6 }, essere: { attempts: 30, wrongs: 0 } };
let { w, d, ev, key, setVal, errors, warns } = boot({ 'verbi-irregolari-stats': JSON.stringify(seeded) });
ok(warns.length === 0 && errors.length === 0, 'loads with no validator warnings or errors');
const labels = [...d.querySelectorAll('#subject-toggle .mode-option')].map(b => b.textContent.trim());
ok(JSON.stringify(labels) === JSON.stringify(['Sostantivi', 'Verbi regolari', 'Verbi irregolari', 'Aggettivi', 'Frasi', 'Scrittura', 'Racconto']), `subject switch: ${labels.join(' | ')}`);
// Regular section keeps its own panel
d.querySelector('#subject-toggle [data-subject="verbs"]').click();
ok(d.querySelector('.endings-title')?.textContent === 'Le desinenze' && !d.querySelector('.irregular-panel') && d.querySelectorAll('.verb-chip').length === 150, 'regular section: Le desinenze panel, 150 verbs');
ev("selectedNouns = new Set(['parlare']); updateReadout();");
// Irregular section
d.querySelector('#subject-toggle [data-subject="irregular"]').click();
ok(ev('subject') === 'irregular' && d.getElementById('app-title').textContent === 'Verbi Irregolari' && d.title === 'Il Mazzo · Verbi Irregolari', 'irregular: title and tab');
ok(!!d.querySelector('.irregular-panel') && d.querySelector('.irregular-panel .endings-title').textContent === 'Gli irregolari' && ![...d.querySelectorAll('.endings-title')].some(h => h.textContent === 'Le desinenze'), 'irregular: its own reference panel, not the regular one');
ok(!!d.getElementById('mode-toggle') && !!d.getElementById('direction-toggle') && d.querySelectorAll('.verb-chip').length === 50, 'mode & direction toggles, 50 verb chips');
ok(ev('selectedNouns.size') === 0, 'irregular section has its own (empty) selection');
const chips = [...d.querySelectorAll('.theme-chip')].map(c => c.textContent.replace(/\s+/g, ' ').trim());
ok(chips.length === 11 && chips.some(c => /^-go ?24$/.test(c)), `11 theme chips (${chips.join(' | ')})`);
d.querySelector('.theme-chip[data-theme="go"]').click();
ok(d.querySelector('.deck-readout').textContent.replace(/\s+/g, ' ').includes('24 verbs · 144 cards'), '-go theme: 24 verbs · 144 cards');
d.getElementById('clear-all').click();
d.getElementById('weakest-10').click();
const wk = ev('[...selectedNouns]');
ok(wk.slice(0, 2).join() === 'venire,porre' && wk.length === 10, `Weakest 10 (smoothed): ${wk.slice(0, 2).join(', ')}…`);
// Play
d.getElementById('clear-all').click();
ev("selectedNouns = new Set(['essere', 'potere', 'venire']); updateReadout();");
d.getElementById('start-btn').click();
ok(ev('deck.length') === 18, '3 verbs → 18 cards');
ev("index = deck.findIndex(c => c.noun === 'essere' && c.person === 'io'); render();");
ok(d.getElementById('prompt').textContent === 'I am' && d.getElementById('verb-meta').textContent === 'to be' && d.getElementById('pronoun-hint').textContent === 'io', 'card: "I am", meaning "to be", person io');
d.getElementById('answer').value = 'io sono'; d.getElementById('submit').click();
let fb = d.getElementById('feedback');
ok(fb.className.includes('correct') && fb.querySelector('.pron').textContent === 'sò·no' && /two ancient roots/.test(fb.querySelector('.feedback-note').textContent), '"io sono" correct, sò·no, essere note');
d.getElementById('assoc-edit').click(); d.getElementById('assoc-input').value = 'essence'; key(d.getElementById('assoc-input'), 'Enter');
ok(JSON.parse(w.localStorage.getItem('verbi-irregolari-assoc-v1')).essere === 'essence' && !w.localStorage.getItem('verbi-regolari-assoc-v1'), 'association saved to the irregular section only');
ev("index = deck.findIndex(c => c.noun === 'potere' && c.person === 'lui'); render();");
d.getElementById('answer').value = 'lui puo'; d.getElementById('submit').click();
ok(d.getElementById('feedback').className.includes('correct') && d.querySelector('.feedback .pron').textContent === 'può', '"lui puo" (no accent) accepted for può');
ev("index = deck.findIndex(c => c.noun === 'venire' && c.person === 'noi'); render();");
d.getElementById('answer').value = 'voi veniamo'; d.getElementById('submit').click();
ok(/Wrong pronoun — should be noi veniamo/.test(d.getElementById('feedback').textContent), 'wrong pronoun detected');
const before = JSON.parse(w.localStorage.getItem('verbi-irregolari-stats')).venire;
ev("index = deck.findIndex(c => c.noun === 'venire' && c.person === 'tu'); render();"); d.getElementById('submit').click();
ok(JSON.stringify(JSON.parse(w.localStorage.getItem('verbi-irregolari-stats')).venire) === JSON.stringify(before), 'a skip leaves progress untouched');
ok(JSON.parse(w.localStorage.getItem('verbi-irregolari-stats')).essere.attempts === 31 && !w.localStorage.getItem('verbi-regolari-stats'), 'progress saved in its own key, original format; regular progress untouched');
// Focus, Deck size, direction
d.getElementById('game-focus-btn').click();
ok(d.getElementById('focus-total').textContent === '3', 'Focus lists the 3 verbs');
d.getElementById('focus-top-input').value = '1'; key(d.getElementById('focus-top-input'), 'Enter'); d.getElementById('focus-apply').click();
ok(ev('deck.length') === 6 && ev('deck.every(c => c.noun === "essere")'), 'Focus top 1 → the 6 essere cards');
setVal('game-trim-rest', String(18 - ev('sessionMaxDeck.length')), 'change');   // the Focus cards + the rest = 18
ok(ev('deck.length') === 18 && new Set(ev('deck.map(c => c.key)')).size === 18, 'Deck size grows back to 18 distinct cards');
d.querySelector('.direction-toggle [data-dir="it-en"]').click();
ev("index = deck.findIndex(c => c.noun === 'essere' && c.person === 'lui'); render();");
ok(d.getElementById('prompt').textContent === 'è' && d.getElementById('verb-meta').style.display === 'none', 'IT→EN shows "è", meaning hidden');
d.getElementById('answer').value = 'she is'; d.getElementById('submit').click();
ok(d.getElementById('feedback').className.includes('correct'), '"she is" accepted for è');
ev("index = deck.findIndex(c => c.noun === 'potere' && c.person === 'io'); render();");
d.getElementById('answer').value = 'I am able to'; d.getElementById('submit').click();
ok(!!d.getElementById('override-btn'), 'near-miss English offers "I was right"');
ev('index = deck.length; render();');
ok(/irregulars|Change verbs/.test(d.querySelector('.card.complete').textContent), 'completion screen');
// Most common, infinitives, nothing selected
d.getElementById('back-to-setup').click();
d.querySelector('#direction-toggle [data-direction="en-it"]').click();
d.getElementById('clear-all').click();
d.querySelector('#mode-toggle [data-mode="infinitives"]').click();
setVal('deck-cap', '5'); setVal('deck-cap-mode', 'frequent', 'change');
ok(d.querySelector('.deck-readout').textContent.includes('drawn from all 50 verbs'), 'nothing selected + 5 most common → from all 50');
d.getElementById('start-btn').click();
ok(JSON.stringify(ev('deck.map(c => c.noun).sort()')) === JSON.stringify(['avere', 'essere', 'fare', 'potere', 'stare']), 'plays the 5 most common: essere, avere, fare, potere, stare');
ev("index = deck.findIndex(c => c.noun === 'essere'); render();");
d.getElementById('answer').value = 'essere'; d.getElementById('submit').click();
ok(d.querySelector('.feedback .pron')?.textContent === 'ès·se·re', 'infinitive pronunciation ès·se·re');
// Every irregular note renders
ev("verbMode = 'infinitives'; selectedNouns = new Set(irregularVerbData.map(v => v.it)); sessionMaxDeck = null; sessionPool = null; startGame();");
let notes = 0; for (let i = 0; i < ev('deck.length'); i++) { ev(`index = ${i}; render();`); d.getElementById('answer').value = 'x'; d.getElementById('submit').click(); if ((d.querySelector('.feedback-note')?.textContent || '').length > 100) notes++; }
ok(notes === 50, `all 50 irregular notes render (${notes})`);
// Back to the regular section: its selection survived
d.getElementById('change-btn').click();
d.querySelector('#subject-toggle [data-subject="verbs"]').click();
ok(ev('subject') === 'verbs' && ev('selectedNouns.size') === 1 && ev("selectedNouns.has('parlare')"), 'regular section kept its own selection');
ok(Object.keys(ev('buildBackup()').data).includes('verbi-irregolari-stats'), 'backups include the irregular section');
d.querySelector('#subject-toggle [data-subject="irregular"]').click();
const store = {}; for (let i = 0; i < w.localStorage.length; i++) { const k = w.localStorage.key(i); store[k] = w.localStorage.getItem(k); }
const r = boot(store);
ok(r.ev('subject') === 'irregular' && r.d.getElementById('app-title').textContent === 'Verbi Irregolari', 'reload reopens the irregular section');
ok(errors.length === 0 && r.errors.length === 0, `no runtime errors (${errors.join('; ')})`);
done();
