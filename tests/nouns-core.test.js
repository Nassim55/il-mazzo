// Recreated: data integrity + associations/notes suite (e2e.js) + English checker over all prompts
const { boot, ok, done } = require('./harness');
let { w, d, ev, key, warns, errors } = boot();
ok(warns.length === 0 && errors.length === 0, 'loads with no validator warnings or errors');
ok(ev('subject') === 'nouns' && ev('nounData.length') === 941, 'opens on nouns with 941 nouns');
const keys = ev('nounData.map(n => n.noun)');
ok(new Set(keys).size === 941 && new Set(ev('nounData.map(n => n.en)')).size === 941 && new Set(ev('nounData.map(n => n.it)')).size === 941, 'no duplicate keys, English prompts or Italian forms');
const themed = new Set(ev('THEMES.flatMap(t => t.nouns)'));
ok(keys.every(k => themed.has(k)) && [...themed].every(k => keys.includes(k)), 'every noun themed, no unknown theme keys');
ok(ev('FREQUENCY_ORDER.length') === 941 && keys.every(k => ev(`Number.isFinite(rankOf(${JSON.stringify(k)}))`)), 'every noun ranked');
const fails = ev('nounData.filter(n => !checkEnglish(n.en, { english: n.en }).correct || !checkEnglish(n.en.replace(/\\([^)]*\\)/g, "").replace(/^the /i, "").trim(), { english: n.en }).correct).map(n => n.en)');
ok(fails.length === 0, `English checker accepts all 941 prompts (${fails.slice(0, 3).join(', ')})`);
ok(ev("checkAnswer('l amico', { italian: \"l'amico\", noun: 'amico' }).correct") && ev("checkAnswer('la pane', { italian: 'il pane', noun: 'pane' }).reason") === 'wrong-article'
   && ev("checkAnswer('pane', { italian: 'il pane', noun: 'pane' }).reason") === 'missing-article', 'article checking: apostrophes, wrong article, missing article');

// --- associations & notes (former e2e.js) ---
ev("selectedNouns = new Set(['pane', 'pomodoro']); updateReadout();");
d.getElementById('start-btn').click();
ev("deck.sort((a, b) => (a.noun === 'pane' ? -1 : 1)); render();");
ok(d.getElementById('prompt').textContent === 'the bread', 'card 1 prompt renders');
let card = ev('deck[0]');
d.getElementById('answer').value = card.italian; d.getElementById('submit').click();
let fb = d.getElementById('feedback');
ok(fb.className.includes('correct') && !!fb.querySelector('.feedback-note') && !!d.getElementById('assoc-edit'), 'correct answer: note + "+ Add association" shown');
d.getElementById('assoc-edit').click();
const input = d.getElementById('assoc-input'); input.value = 'companion <shared bread>'; key(input, 'Enter');
ok(ev('index') === 0, 'Enter in the association box saves without advancing');
ok(JSON.parse(w.localStorage.getItem('sostantivi-assoc-v1')).pane === 'companion <shared bread>', 'association saved under the noun key');
ok(d.querySelector('.assoc-text').textContent === 'companion <shared bread>', 'association shown, HTML-escaped');
d.getElementById('assoc-edit').click(); d.getElementById('assoc-input').value = 'x'; key(d.getElementById('assoc-input'), 'Escape');
ok(d.querySelector('.assoc-text').textContent === 'companion <shared bread>', 'Escape cancels an edit');
key(d.body, 'Enter');
ok(ev('index') === 1, 'Enter moves to the next card');
d.getElementById('answer').value = 'qualcosa'; d.getElementById('submit').click();
fb = d.getElementById('feedback');
ok(fb.className.includes('incorrect') && !!fb.querySelector('.feedback-note') && !!d.getElementById('assoc'), 'wrong answer: note + association area');
ok(!d.getElementById('answer').disabled && d.getElementById('answer').value === '' && d.getElementById('submit').textContent === 'Riscrivi →', 'after a miss the box clears for the right answer');
d.getElementById('answer').value = ev('deck[index].italian'); key(d.body, 'Enter');   // typed right: on to the end
d.getElementById('play-again').click();
ev(`index = deck.findIndex(c => c.noun === 'pane'); render();`);
ok(!d.querySelector('.card').textContent.includes('companion'), 'association hidden before answering');
d.getElementById('answer').value = 'il pane'; d.getElementById('submit').click();
ok(d.querySelector('.assoc-text')?.textContent === 'companion <shared bread>', 'association appears after answering');
d.querySelector('.direction-toggle [data-dir="it-en"]').click();
ev(`index = deck.findIndex(c => c.noun === 'pane'); render();`);
ok(d.getElementById('prompt').textContent === 'il pane', 'IT→EN shows the Italian');
d.getElementById('answer').value = 'loaf'; d.getElementById('submit').click();
ok(!!d.getElementById('override-btn'), 'IT→EN wrong answer offers "I was right"');
d.getElementById('override-btn').click();
ok(d.getElementById('feedback').className.includes('correct') && !!d.querySelector('.feedback-note') && d.querySelector('.assoc-text')?.textContent.includes('companion'), 'override keeps note and association');
ok(!d.querySelector('.feedback .pron'), 'noun feedback has no pronunciation line');
ok(errors.length === 0, 'no runtime errors');
const store = { 'sostantivi-assoc-v1': w.localStorage.getItem('sostantivi-assoc-v1') };
({ w, d, ev, errors } = boot(store));
ev("selectedNouns = new Set(['pane']); updateReadout();"); d.getElementById('start-btn').click();
d.getElementById('answer').value = 'il pane'; d.getElementById('submit').click();
ok(d.querySelector('.assoc-text')?.textContent === 'companion <shared bread>', 'association survives a reload');
// ---- The shop (Oct 2026): 52 more nouns, and the food already in the deck filed there too ----
const shop = ev("NOUN_THEMES.find(t => t.key === 'negozio').nouns");
ok(['manzo', 'agnello', 'maiale', 'fagiolo', 'melone', 'arancia', 'cece'].every(k => shop.includes(k)) && shop.length === 142 && ev("NOUN_ITEMS.find(n => n.noun === 'maiale').en") === 'the pig (pork)',
   `Negozio has beef, lamb, pork (il maiale), beans, melon, oranges and chickpeas — ${shop.length} nouns in all`);
const SHOP_NEW = ['manzo', 'agnello', 'vitello', 'salsiccia', 'salame', 'pancetta', 'tacchino', 'tonno', 'salmone', 'gambero', 'cozza', 'merluzzo', 'bistecca', 'fagiolo', 'cece', 'lenticchia',
  'pisello', 'carota', 'lattuga', 'spinaci', 'peperone', 'zucchina', 'melanzana', 'cetriolo', 'cavolo', 'broccolo', 'sedano', 'mais', 'verdura', 'oliva', 'basilico', 'prezzemolo', 'melone',
  'fragola', 'pesca', 'pera', 'anguria', 'ananas', 'ciliegia', 'albicocca', 'lampone', 'noce', 'mandorla', 'yogurt', 'panna', 'mozzarella', 'parmigiano', 'farina', 'pepe', 'marmellata', 'maionese', 'senape'];
const wrongArticle = ev(`${JSON.stringify(SHOP_NEW)}.map(k => NOUN_ITEMS.find(n => n.noun === k)).filter(n => {
  const [art, word] = n.it.startsWith("l'") ? ["l'", n.it.slice(2)] : n.it.split(' ');
  const plural = /^(i|gli|le)$/.test(art), vowel = /^[aeiouàèéìòù]/.test(word), special = /^(s[^aeiou]|z|gn|ps|x|y)/.test(word);
  const want = n.g === 'f' ? (plural ? 'le' : vowel ? "l'" : 'la') : plural ? (vowel || special ? 'gli' : 'i') : (vowel ? "l'" : special ? 'lo' : 'il');
  return art !== want;
}).map(n => n.it)`);
ok(wrongArticle.length === 0 && SHOP_NEW.every(k => ev(`NOUN_FREQUENCY_ORDER.includes(${JSON.stringify(k)})`) && ev(`NOUN_THEMES.find(t => t.key === 'cibo').nouns.includes(${JSON.stringify(k)})`)),
   `the 52 new shop nouns: each article right for its gender and first letter (lo yogurt, l'ananas, gli spinaci), each ranked, each in Cibo too${wrongArticle.length ? ': ' + wrongArticle.join(', ') : ''}`);
ok(['spinaci', 'melanzana', 'albicocca'].every(k => ev(`NOUN_THEMES.find(t => t.key === 'arabo').nouns.includes(${JSON.stringify(k)})`)), 'spinaci, melanzana and albicocca join the Arabic-origin words');
// ---- Renovating the house (Oct 2026): 58 more nouns, and the house words already in the deck ----
const reno = ev("NOUN_THEMES.find(t => t.key === 'ristrutturazione')");
const RENO_NEW = ['trave', 'architrave', 'solaio', 'parete', 'tegola', 'coppo', 'grondaia', 'camino', 'gradino', 'infisso', 'persiana', 'davanzale', 'soffitta', 'fienile',
  'calce', 'malta', 'intonaco', 'giunto', 'stilatura', 'mattone', 'cemento', 'ghiaia', 'legno', 'legna', 'tarlo', 'vespaio', 'massetto', 'impianto', 'presa', 'contatore', 'tubo',
  'caldaia', 'stufa', 'scarico', 'bolletta', 'subentro', 'umidità', 'muffa', 'crepa', 'perdita', 'muratore', 'idraulico', 'elettricista', 'falegname', 'geometra', 'impresa',
  'preventivo', 'permesso', 'pratica', 'catasto', 'planimetria', 'caparra', 'bonifico', 'sopralluogo', 'cantiere', 'ponteggio', 'imposta', 'dichiarazione'];
const RENO_OLD = ['tetto', 'muro', 'finestra', 'porta', 'pietra', 'scala', 'pavimento', 'soffitto', 'cantina', 'sabbia', 'castagno', 'interruttore', 'rubinetto', 'fattura', 'comune'];
ok(reno.label === 'Ristrutturazione' && reno.en === 'Renovation' && reno.nouns.length === 73 && RENO_NEW.length === 58
   && [...RENO_NEW, ...RENO_OLD].every(k => reno.nouns.includes(k)) && new Set(reno.nouns).size === 73,
   'Ristrutturazione (Renovation): 73 nouns — 58 new, and the 15 house words already in the deck (il tetto, la sabbia, il castagno…)');
const renoWrongArticle = ev(`${JSON.stringify(RENO_NEW)}.map(k => NOUN_ITEMS.find(n => n.noun === k)).filter(n => {
  const [art, word] = n.it.startsWith("l'") ? ["l'", n.it.slice(2)] : n.it.split(' ');
  const vowel = /^[aeiouàèéìòù]/.test(word), special = /^(s[^aeiou]|z|gn|ps|x|y)/.test(word);
  const want = n.g === 'f' ? (vowel ? "l'" : 'la') : (vowel ? "l'" : special ? 'lo' : 'il');
  return art !== want;
}).map(n => n.it)`);
ok(renoWrongArticle.length === 0 && RENO_NEW.every(k => ev(`NOUN_FREQUENCY_ORDER.includes(${JSON.stringify(k)})`)),
   `each new article right for its gender and first letter (lo scarico, l'architrave, l'umidità), each noun ranked${renoWrongArticle.length ? ': ' + renoWrongArticle.join(', ') : ''}`);
const g = k => ev(`NOUN_ITEMS.find(n => n.noun === ${JSON.stringify(k)}).g`);
ok(g('architrave') === 'm' && g('trave') === 'f' && g('geometra') === 'm' && g('umidità') === 'f' && g('legna') === 'f' && g('legno') === 'm',
   'the genders that catch people out: la trave but l\'architrave (m), il geometra, l\'umidità (f); il legno, the wood, and la legna, the firewood');
const rank = k => ev(`NOUN_FREQUENCY_ORDER.indexOf(${JSON.stringify(k)})`);
ok(rank('impresa') < rank('preventivo') && rank('preventivo') < rank('vespaio') && rank('vespaio') < rank('stilatura') && rank('casa') < rank('impresa'),
   'ranked by the same score as the rest: l\'impresa well up, il preventivo mid-deck, the trade words (il vespaio, la stilatura) at the end');
ok(['muratore', 'idraulico', 'elettricista', 'falegname', 'geometra'].every(k => ev(`NOUN_THEMES.find(t => t.key === 'lavoro').nouns.includes(${JSON.stringify(k)})`))
   && ['parete', 'camino', 'soffitta', 'caldaia', 'stufa'].every(k => ev(`NOUN_THEMES.find(t => t.key === 'casa').nouns.includes(${JSON.stringify(k)})`)),
   'the trades join Lavoro, and the new parts of the house join Casa');
({ w, d, ev, errors } = boot());
ev("selectedNouns = new Set(['architrave', 'scarico']); updateReadout();"); d.getElementById('start-btn').click();
ev("index = deck.findIndex(c => c.noun === 'architrave'); render();");
ok(d.getElementById('prompt').textContent.trim() === 'the lintel', 'a card asks for the lintel…');
d.getElementById('answer').value = "la architrave"; d.getElementById('submit').click();
ok(d.getElementById('feedback').classList.contains('incorrect') && /l'architrave/.test(d.getElementById('feedback').textContent)
   && /false friend/i.test(d.getElementById('feedback').textContent), "…the article matters (l'architrave), and the note flags the false friend");
done();
