// Scrittura: 100 present-tense sentences from the deck's own words, written in full —
// optional subject pronouns, nothing else given, word-by-word feedback, in Ripasso.
const { boot, ok, done } = require('./harness');
const { w, d, ev, errors, warns } = boot({ 'flipcards-subject': 'sentences' });
ok(errors.length === 0 && warns.length === 0, 'loads cleanly: every word of every sentence is in the deck');
ok(ev('SENTENCE_ITEMS.length') === 100 && ev('SENTENCE_THEMES.length') === 6, '100 sentences, in six levels');
const tabs = [...d.querySelectorAll('#subject-toggle .mode-option')].map(b => b.textContent.trim());
ok(tabs.join('|') === 'Sostantivi|Verbi regolari|Verbi irregolari|Aggettivi|Frasi|Scrittura|Racconto' && d.querySelector('#subject-toggle [data-subject="sentences"]').classList.contains('active'), 'Scrittura is a section of its own, after Frasi');

// ---- Built from the deck, in the present tense ----
const words = ev(`SENTENCE_ITEMS.flatMap(n => sentenceSegments(n.it).filter(s => s.ref).map(s => s.ref))`);
const kinds = new Set(words.map(r => r.split(':')[0]));
ok([...kinds].every(k => ['nouns', 'verbs', 'irregular', 'adjectives', 'phrases', 'fn'].includes(k)), `every word is a deck noun, verb, adjective or phrase, or a small word (${[...kinds].join(', ')})`);
const verbForms = ev(`SENTENCE_ITEMS.flatMap(n => sentenceSegments(n.it).filter(s => s.ref && /^(verbs|irregular):/.test(s.ref)).map(s => [s.text.toLowerCase(), s.ref]))`);
const present = ev(`(() => { const ok = new Set(); for (const v of [...verbData, ...irregularVerbData]) for (const f of Object.values(v.conj)) ok.add(f); return [...ok]; })()`);
ok(verbForms.length >= 95 && verbForms.every(([f]) => present.includes(f)), `every verb (${verbForms.length} of them; non capisco is a phrase card) is a present-tense form from the deck`);
ok(ev(`sentenceSegments('I bambini giocano in giardino.').find(s => s.text === 'bambini').ref`) === 'nouns:bambino' && ev(`sentenceSegments('Abito vicino al lago.').find(s => s.text === 'vicino').ref`) === 'fn:vicino',
   'plurals find their singular card; vicino a means near');

// ---- Writing them ----
const play = (key, raw) => {
  ev(`selectedNouns = new Set([${JSON.stringify(key)}]); updateReadout();`);
  d.getElementById('start-btn').click();
  d.getElementById('answer').value = raw;
  d.getElementById('submit').click();
  const r = { right: d.getElementById('feedback').classList.contains('correct'), html: d.getElementById('feedback').innerHTML, text: d.getElementById('feedback').textContent };
  d.getElementById('change-btn').click();
  return r;
};
ok(d.getElementById('answer') === null && play('il-cane-beve-l-acqua', "Il cane beve l'acqua.").right, 'the full sentence is right');
ok(play('il-cane-beve-l-acqua', 'il cane beve lacqua').right && play('il-cane-beve-l-acqua', 'IL CANE BEVE L’ACQUA').right, 'capitals, punctuation and apostrophes don\'t matter');
ok(play('bevo-un-caffe', 'bevo un caffe').right && play('bevo-un-caffe', 'Io bevo un caffè').right && play('bevo-un-caffe', 'Prendo un caffè').right, 'the subject pronoun is optional, and other correct Italian counts');
ok(play('lui-parla-con-un-amico', 'Parla con un amico').right && play('dove-abiti', 'Dove abiti tu?').right, '…either way round (Lui parla / Parla; Dove abiti tu?)');
let r = play('il-cane-beve-l-acqua', 'il cane beve acqua');
ok(!r.right && /<mark class="sent-missing">l'<\/mark>acqua/.test(r.html.replace(/&#39;/g, "'")), 'leaving out the article is wrong, and the missing l\' is shown, joined to its noun');
r = play('il-cane-beve-l-acqua', 'il cane bevi acqua');
ok(/<s class="sent-wrong">bevi<\/s>/.test(r.html) && /<mark class="sent-missing">beve<\/mark>/.test(r.html), 'a wrong verb form is struck through in yours and marked in the correct one');
r = play('il-cane-beve-l-acqua', '');
ok(!r.right && /Skipped — the sentence is/.test(r.text) && !/sent-diff/.test(r.html), 'a skip just shows the sentence');
ok(play('i-bambini-giocano-in-giardino', 'I bambini giocano nel giardino.').right, 'natural variants are accepted (nel giardino / in giardino)');

// ---- The other direction, the prompts, and Ripasso ----
const itEn = raw => { ev("direction = 'it-en'"); return play('bevo-un-caffe', raw).right; };
ok(itEn("I'm having a coffee") && itEn('I am drinking a coffee') && itEn('i drink a coffee'), 'Italian → English: the English and its listed variants count');
ev("direction = 'en-it'");
ok(ev("SENTENCE_ITEMS.filter(n => /\\byou\\b/i.test(n.en)).every(n => /\\((tu|voi)\\)/.test(n.en))"), 'every English "you" says whether it means tu or voi');
// ---- Word-for-word English ----
const prompts = ev('SENTENCE_ITEMS.map(n => n.en)');
ok(!prompts.some(e => /\b(am|is|are|'m|'re|'s)\s+\w+ing\b/i.test(e)), 'the English is always the simple present (Italian has one present tense): "I drink", never "I\'m drinking"');
ok(!prompts.some(e => /^(do|does)\b/i.test(e) || /\b(don't|doesn't|do not|does not)\b/i.test(e)), 'no do / does / don\'t, which Italian doesn\'t have: "You eat the meat?", "I not eat the meat"');
ok(prompts.every(e => (e.match(/\(([^)]*)\)/g) || []).every(b => ['(tu)', '(voi)'].includes(b))), 'the only brackets left say (tu) or (voi)');
const en = key => ev(`SENTENCE_ITEMS.find(n => n.noun === ${JSON.stringify(key)}).en`);
ok(en('mangi-la-carne') === 'You eat the meat? (tu)' && en('non-mangio-la-carne') === 'I not eat the meat.' && en('quando-parte-il-treno') === 'When leaves the train?'
   && en('lavoro-in-ufficio') === 'I work in office.' && en('le-mie-sorelle-vivono-in-citta') === 'The my sisters live in city.' && en('ascolti-la-musica') === 'You listen the music. (tu)',
   'word for word, in the Italian\'s order: You eat the meat? · I not eat the meat · When leaves the train? · I work in office · The my sisters · You listen the music');
ev("direction = 'it-en'");
ok(play('mangi-la-carne', 'You eat the meat?').right && play('mangi-la-carne', 'Do you eat meat?').right && play('lavoro-in-ufficio', 'I work in the office').right
   && play('quando-parte-il-treno', 'When does the train leave?').right, 'Italian → English, both the word-for-word and the natural English count');
ev("direction = 'en-it'");
// ---- The natural English, for the ones that don't translate well literally ----
ok(ev('Object.keys(SENTENCE_NATURAL).every(it => SENTENCE_ITEMS.some(n => n.it === it))') && ev('SENTENCE_ITEMS.filter(n => n.natural).length') === ev('Object.keys(SENTENCE_NATURAL).length'),
   `every natural translation belongs to a real sentence (${ev('Object.keys(SENTENCE_NATURAL).length')} of them)`);
const card = (key, dir = 'en-it') => {
  ev(`direction = ${JSON.stringify(dir)}; selectedNouns = new Set([${JSON.stringify(key)}]); updateReadout();`);
  d.getElementById('start-btn').click();
  const el = d.getElementById('natural-en');
  const r = { shown: !el.hidden, text: el.textContent, prompt: d.getElementById('prompt').textContent };
  d.getElementById('change-btn').click();
  ev("direction = 'en-it'");
  return r;
};
let c = card('mangi-la-carne');
ok(c.shown && c.prompt === 'You eat the meat? (tu)' && /in natural English/i.test(c.text) && /Do you eat meat\?/.test(c.text), 'under "You eat the meat? (tu)": in natural English, "Do you eat meat?"');
c = card('quando-parte-il-treno');
ok(c.shown && /When does the train leave\?/.test(c.text), 'under "When leaves the train?": "When does the train leave?"');
ok(!card('apro-la-finestra').shown, 'a prompt that is already good English ("I open the window.") gets no second line');
ok(!card('mangi-la-carne', 'it-en').shown && !card('mangi-la-carne', 'listen').shown, 'Italian → English and listening hide it — it would give the answer away');
const N = boot({ 'flipcards-subject': 'nouns' });
N.ev("selectedNouns = new Set(['casa']); updateReadout();"); N.d.getElementById('start-btn').click();
ok(N.d.getElementById('natural-en').hidden, 'other sections\' cards never show it');
ev("direction = 'it-en'");
ok(play('i-gatti-dormono-tutto-il-giorno', 'The cats sleep all day').right, 'the natural English counts as an answer, Italian → English');
ev("direction = 'en-it'");
// ---- Why it's wrong ----
const why = (key, raw) => ev(`sentenceWhy(${JSON.stringify(raw)}, cardsForItem(SENTENCE_ITEMS.find(n => n.noun === ${JSON.stringify(key)}))[0])`).map(s => s.replace(/<[^>]+>/g, '').replace(/&#39;/g, "'")).join(' | ');
ok(/bella, not bello: it agrees with la città, which is feminine singular — bello · bella · belli · belle/.test(why('la-citta-e-bella', 'La citta è bello')), 'an adjective\'s ending: it agrees with la città, feminine singular (bello · bella · belli · belle)');
ok(/stanchi, not stanco: it agrees with i bambini, which is masculine plural/.test(why('i-bambini-sono-stanchi', 'I bambini sono stanco')) && /grande, not grandi: it agrees with la casa, which is singular — grande · grandi/.test(why('la-casa-e-grande', 'la casa e grandi')),
   '…masculine plural (i bambini), and number only for two-form adjectives');
ok(/stanco, not stanchi: the subject is tu, so singular/.test(why('sei-stanco', 'sei stanchi')), '…or with the subject, when there\'s no noun (tu: singular)');
ok(/beve, not bevi: the subject is il cane, so the verb takes the lui \/ lei form \(bevi is the tu form\)\. bere: bevo · bevi · beve · beviamo · bevete · bevono/.test(why('il-cane-beve-l-acqua', 'il cane bevi l acqua')),
   'a verb\'s ending: the subject (il cane), the form it takes, the form written, and all six');
ok(/the subject is mia madre/.test(why('mia-madre-cucina-la-cena', 'mia madre cucino la cena')) && /the subject is le mie sorelle, so the verb takes the loro form/.test(why('le-mie-sorelle-vivono-in-citta', 'le mie sorelle vive in città')),
   '…naming the subject with its possessive (mia madre, le mie sorelle)');
ok(/l', not la: l' goes before a vowel — l'acqua/.test(why('il-cane-beve-l-acqua', 'il cane beve la acqua')) && /un, not una: messaggio is masculine — un messaggio/.test(why('la-ragazza-scrive-un-messaggio', 'la ragazza scrive una messaggio'))
   && /gli, not i: gli goes with masculine plurals starting with a vowel, s \+ consonant or z — gli studenti/.test(why('gli-studenti-leggono-molti-libri', 'i studenti leggono molti libri')), 'articles: the vowel rule, gender, and gli');
ok(/Don't drop the article: l'acqua/.test(why('il-cane-beve-l-acqua', 'il cane beve acqua')), 'a missing article');
ok(/sul = su \+ il: these prepositions join the article into one word/.test(why('il-gatto-dorme-sul-letto', 'il gatto dorme su il letto')) && /nella, not nel: nella = in \+ la — cucina is feminine/.test(why('il-cane-dorme-in-cucina', 'il cane dorme nel cucina'))
   && /nell', not nel: nell' = in \+ l' — ufficio starts with a vowel/.test(why('lavoro-in-ufficio', 'lavoro nel ufficio')), 'prepositions joining their article (sul = su + il), with the article\'s own reason');
ok(/chiavi, not chiave: plural here — la chiave, plural chiavi/.test(why('cerco-le-chiavi', 'cerco le chiave')), 'a noun\'s number');
ok(/non goes straight before the verb: non mangio/i.test(why('non-mangio-la-carne', 'mangio non la carne')) && /Spelling: libro/.test(why('il-libro-e-nuovo', 'il libbro è nuovo')), 'where non goes, and spelling');
ok(/Don't drop the article: i miei amici — possessives take the article in Italian \(only a single family member goes without: mia madre\)/.test(why('i-miei-amici-arrivano-stasera', 'miei amici arrivano stasera')),
   'a possessive takes the article (i miei amici) — only a single family member goes without');
ok(/la, not i: sera is feminine/.test(ev("(() => { const c = cardsForItem(SENTENCE_ITEMS.find(n => n.noun === 'la-sera-leggo-un-libro'))[0]; return sentenceDiffHTML('i sera leggo un libro', c).replace(/<[^>]+>/g, ''); })()")),
   'of equally close correct versions (La sera · Di sera), the one whose difference a rule explains');
const wr = play('la-citta-e-bella', 'La citta è bello');
ok(/<span class="sent-label">Why<\/span>/.test(wr.html) && /feminine singular/.test(wr.text), 'it shows under "Why" in the feedback');
const t0 = ev('today()');
const R = boot({ 'flipcards-subject': 'nouns', 'scrittura-stats-v1:srs': JSON.stringify({ 'il-cane-beve-l-acqua': { b: 1, d: t0, l: null } }) });
ok(/1 sentence/.test(R.d.getElementById('ripasso').textContent), 'sentences come back in Ripasso del giorno');
ok(ev("syncedKeys().has('scrittura-stats-v1') && syncedKeys().has('scrittura-stats-v1:srs')"), 'and their progress syncs like everything else');
done();
