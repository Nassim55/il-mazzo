const { boot, ok, done } = require('./harness');
let { w, d, ev, key, setVal, errors, warns } = boot();
ok(warns.length === 0 && errors.length === 0, `loads with no validator warnings or errors ${warns.join(' ')}`);
const labels = [...d.querySelectorAll('#subject-toggle .mode-option')].map(b => b.textContent.trim());
ok(labels.length === 6 && labels[4] === 'Frasi' && labels[5] === 'Racconto', `section switch: ${labels.join(' | ')}`);
d.querySelector('#subject-toggle [data-subject="phrases"]').click();
ok(d.getElementById('app-title').textContent === 'Frasi' && d.title === 'Il Mazzo · Frasi' && ev('selectedNouns.size') === 0, 'title, tab, empty selection');
ok(d.querySelector('.phrases-panel .endings-title')?.textContent === 'In pratica' && d.querySelector('.setup-side').children[1].id === 'weak-panel', 'In pratica panel with Da ripassare under it');
const chips = [...d.querySelectorAll('.verb-chip')];
ok(chips.length === 50 && JSON.stringify(chips.map(c => c.dataset.noun)) === JSON.stringify(ev('PHRASE_ORDER')) && chips[0].querySelector('.verb-chip-italian').textContent === 'Grazie!', '50 chips, most common first, showing "Grazie!" not the key');
const themes = Object.fromEntries([...d.querySelectorAll('.theme-chip')].map(c => [c.dataset.theme, +c.textContent.trim().match(/(\d+)$/)[1]]));
ok(JSON.stringify(themes) === JSON.stringify({ saluti: 10, conoscersi: 8, cortesia: 12, cavarsela: 8, reazioni: 12, tulei: 12 }), `themes: ${JSON.stringify(themes)}`);
// ---- The checker, across all 50 ----
const P = ev('phraseData');
const card = k => ev(`cardsForItem(PHRASE_ITEMS.find(x => x.noun === '${k}'))[0]`);
const chk = (k, raw, itToEn) => ev(`checkPhraseAnswer(${JSON.stringify(raw)}, cardsForItem(PHRASE_ITEMS.find(x => x.noun === '${k}'))[0], ${itToEn})`).correct;
const casual = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[!?.,…]/g, '');
let bad = [];
for (const p of P) for (const a of [p.it, ...p.itAlts]) { if (!chk(p.key, a, false)) bad.push(a); if (!chk(p.key, casual(a), false)) bad.push(casual(a)); }
ok(bad.length === 0, `EN→IT: every phrase and alternative accepted, as written and typed casually${bad.length ? ' — failed: ' + bad.slice(0, 5) : ''}`);
const mustFail = [['come-stai', 'come sta'], ['come-sta', 'come stai'], ['scusa', 'mi scusi'], ['mi-scusi', 'scusa'], ['buongiorno', 'buonasera'], ['grazie', 'prego'], ['non-capisco', 'capisco'], ['figurati', 'si figuri'], ['ciao', '']];
const wronglyOk = mustFail.filter(([k, raw]) => chk(k, raw, false));
ok(wronglyOk.length === 0, `wrong or wrong-register answers are rejected (come sta ≠ come stai, scusa ≠ mi scusi…)${wronglyOk.length ? ' — accepted: ' + JSON.stringify(wronglyOk) : ''}`);
bad = [];
for (const p of P) for (const e of [...p.en.split(' / '), ...p.enAlts]) if (!chk(p.key, e, true)) bad.push(e);
ok(bad.length === 0, `IT→EN: every meaning and alternative accepted${bad.length ? ' — failed: ' + bad.slice(0, 5) : ''}`);
const contr = [['non-capisco', 'I do not understand'], ['dove-il-bagno', 'where is the bathroom'], ['come-va', 'how is it going'], ['prego', 'you are welcome'], ['vorrei', 'i would like'], ['come-stai', 'how are you']];
ok(contr.every(([k, e]) => chk(k, e, true)), 'contractions and brackets handled ("I do not understand", "how are you" for "(informal)")');
ok(!chk('buongiorno', 'goodbye', true) && !chk('magari', 'thank goodness', true), 'wrong meanings rejected');
// ---- Play ----
ev("selectedNouns = new Set(['come-stai', 'dove-il-bagno', 'in-bocca-al-lupo']); updateReadout();");
d.getElementById('start-btn').click();
ev("index = deck.findIndex(c => c.noun === 'come-stai'); render();");
ok(d.getElementById('prompt').textContent === 'How are you? (informal)' && d.getElementById('pronoun-hint').textContent === '+ frase', 'card: "How are you? (informal)" + "+ frase"');
d.getElementById('answer').value = 'come stai'; d.getElementById('submit').click();
let fb = d.getElementById('feedback');
ok(fb.className.includes('correct') && /Corretto — Come stai\?/.test(fb.textContent) && /how do you stand/.test(fb.querySelector('.feedback-note').textContent), 'correct: shows "Come stai?" and its note');
d.getElementById('assoc-edit').click(); d.getElementById('assoc-input').value = 'stand'; key(d.getElementById('assoc-input'), 'Enter');
ok(JSON.parse(w.localStorage.getItem('frasi-assoc-v1'))['come-stai'] === 'stand', 'association saved under the phrases key');
ev("index = deck.findIndex(c => c.noun === 'in-bocca-al-lupo'); render();");
d.getElementById('answer').value = 'buona fortuna'; d.getElementById('submit').click();
ok(/Not quite — the phrase is In bocca al lupo!/.test(d.getElementById('feedback').textContent) && /crepi/.test(d.querySelector('.feedback-note').textContent), 'wrong: shows the phrase, and the note gives the reply crepi!');
const st = JSON.parse(w.localStorage.getItem('frasi-stats-v1'));
ok(st['come-stai'].seen === 1 && st['come-stai'].wrong === 0 && st['in-bocca-al-lupo'].wrong === 1, 'progress saved under its own key');
d.querySelector('.direction-toggle [data-dir="it-en"]').click();
ev("index = deck.findIndex(c => c.noun === 'dove-il-bagno'); render();");
ok(d.getElementById('prompt').textContent === "Dov'è il bagno?", 'IT→EN shows "Dov\'è il bagno?"');
d.getElementById('answer').value = 'where is the loo'; d.getElementById('submit').click();
ok(d.getElementById('feedback').className.includes('correct'), '"where is the loo" accepted');
// ---- Setup features ----
d.getElementById('change-btn').click();
ok(/IT → EN/.test(d.querySelector('#weak-panel .endings-sub').textContent) && /in this direction/.test(d.getElementById('weak-panel').textContent), 'Da ripassare follows the direction (IT→EN: nothing missed yet)');
d.getElementById('start-btn').click(); d.querySelector('.direction-toggle [data-dir="en-it"]').click(); d.getElementById('change-btn').click();
ok([...d.querySelectorAll('#weak-panel .weak-it')].map(e => e.textContent).join() === 'In bocca al lupo!', 'EN→IT: Da ripassare lists the phrase you missed, as written');
d.getElementById('clear-all').click();
setVal('deck-cap', '5'); setVal('deck-cap-mode', 'frequent', 'change');
d.getElementById('start-btn').click();
ok(JSON.stringify(ev('deck.map(c => c.noun).sort()')) === JSON.stringify(['ciao', 'grazie', 'mi-scusi', 'per-favore', 'prego']), '"the 5 most common": grazie, ciao, prego, mi scusi, per favore');
ev("selectedNouns = new Set(phraseData.map(p => p.key)); sessionMaxDeck = null; sessionPool = null; startGame();");
let notes = 0; for (let i = 0; i < 50; i++) { ev(`index = ${i}; render();`); d.getElementById('answer').value = 'x'; d.getElementById('submit').click(); const exp = ev(`PHRASE_NOTES[deck[${i}].noun]`).replace(/<[^>]+>/g, ''); if (d.querySelector('.feedback-note')?.textContent === exp) notes++; }
ok(notes === 50, `all 50 notes render (${notes})`);
d.getElementById('change-btn').click();
ok(['frasi-stats-iten-v1', 'frasi-assoc-v1'].every(k => Object.keys(ev('buildBackup()').data).includes(k)), 'backups include the phrases');
const store = {}; for (let i = 0; i < w.localStorage.length; i++) { const k = w.localStorage.key(i); store[k] = w.localStorage.getItem(k); }
const r = boot(store);
ok(r.ev('subject') === 'phrases' && r.d.getElementById('app-title').textContent === 'Frasi', 'reload reopens Frasi');
ok(errors.length === 0 && r.errors.length === 0, `no runtime errors (${errors.join('; ')})`);
done();
