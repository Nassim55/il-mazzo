// Preposizioni: the old preposizioni game rebuilt inside Il Mazzo — fusion drills and usage
// cards from the deck's own words, a rule for every kind of slip (Why), the fusion table,
// grouped themes, Ripasso and sync.
const { boot, ok, done } = require('./harness');
const { w, d, ev, errors, warns } = boot({ 'flipcards-subject': 'prepositions' });
ok(errors.length === 0 && warns.length === 0, 'loads cleanly: every word of every card is in the deck, a small word or a name');
const tabs = [...d.querySelectorAll('#subject-toggle .mode-option')].map(b => b.textContent.trim());
ok(tabs.join('|') === 'Sostantivi|Verbi regolari|Verbi irregolari|Aggettivi|Preposizioni|Frasi|Scrittura|Dialoghi|Racconto'
   && d.querySelector('#subject-toggle [data-subject="prepositions"]').classList.contains('active'), 'Preposizioni is a section of its own, after Aggettivi');
ok(ev('PREP_ITEMS.length') === 196 && ev('PREP_ITEMS.flatMap(cardsForItem).length') === 245 && ev('PREP_THEMES.length') === 27 && ev('PREP_GROUPS.length') === 6,
   '196 phrases (49 of them singular/plural pairs) — 245 cards — in 27 themes, six groups');
// Everything the old game drilled, with at least as many cards (it called some of them by English names)
const OLD = { 'di-art': 22, 'a-art': 8, 'da-art': 22, 'in-art': 8, 'su-art': 8, citta: 6, paesi: 6, 'da-persona': 6, luoghi: 8, possesso: 6, origine: 6, momenti: 7, periodi: 8, 'verbi-a': 7, 'verbi-di': 6, 'verbi-inf': 8 };
const size = k => ev(`PREP_ITEMS.filter(n => n.level === ${JSON.stringify(k)}).flatMap(cardsForItem).length`);   // cards, a pair counting two
ok(Object.entries(OLD).every(([k, n]) => size(k) >= n), `every one of the old game's 16 patterns is here, with at least as many cards (di + articolo ${size('di-art')}, da + articolo ${size('da-art')})`);
ok(ev('PREP_THEMES.every(t => t.nouns.length) && PREP_ITEMS.every(n => n.rule && n.rule.length > 20)'), 'every theme has cards, and every card a rule for when its preposition is wrong');

// ---- The fusion drills are right, from the deck's own articles ----
const bad = ev(`(() => {
  const out = [], join = Object.fromEntries(PREP_TABLE.flatMap(([art, forms]) => forms.map((f, i) => [['di', 'a', 'da', 'in', 'su'][i] + '|' + art, f])));
  const check = (prompt, it, plural, lemma) => {
    const m = /^(di|a|da|in|su) \\+ (il|lo|l'|la|i|gli|le) ?(.+)$/.exec(prompt);
    if (!m) return out.push('prompt: ' + prompt);
    const [, prep, art, word] = m;
    const key = NOUN_ITEMS.some(x => x.noun === word) ? word : (sentencePluralNoun(word, storyIndex()) || '').replace(/^nouns:/, '');
    const item = NOUN_ITEMS.find(x => x.noun === key);   // looked up as a noun: on its own, a word like cucina reads as a verb
    if (!item) return out.push('not a deck noun: ' + word);
    if (lemma && item.noun !== lemma) out.push(prompt + ': not the plural of ' + lemma);
    const sing = item.it.match(/^(il|lo|la|l')/)[1];
    const want = !plural ? sing : item.g === 'f' ? 'le' : (sing === 'lo' || sing === "l'") ? 'gli' : 'i';
    if (art !== want) out.push(prompt + ': the article should be ' + want);
    const fused = join[prep + '|' + art] + (art === "l'" ? '' : ' ') + word;
    if (fused !== it) out.push(prompt + ' → ' + it + ' (should be ' + fused + ')');
    return item.noun;
  };
  const VERB = { 'di-art': ['Parlo', 'Parlo'], 'a-art': ['Vado', 'Vado'], 'da-art': ['Vengo', 'Vengo'], 'in-art': ['È', 'Sono'], 'su-art': ['È', 'Sono'] };
  for (const n of PREP_ITEMS.filter(n => n.mech)) {
    const lemma = check(n.mechPrompt, n.fused, false);
    if (!n.pl) { out.push(n.it + ': no plural'); continue; }
    check(n.pl.mechPrompt, n.pl.fused, true, lemma);
    const [v1, v2] = VERB[n.level];
    if (n.it !== v1 + ' ' + n.fused + '.') out.push(n.it + ': should be ' + v1 + ' ' + n.fused + '.');
    if (n.pl.it !== v2 + ' ' + n.pl.fused + '.') out.push(n.pl.it + ': should be ' + v2 + ' ' + n.pl.fused + '.');
  }
  return out;
})()`);
ok(bad.length === 0, `every fusion pair: its deck noun's own article (the plural's from the singular and its gender), joined correctly, after one easy verb per preposition — parlo di, vado a, vengo da, è / sono in, è / sono su (${ev('PREP_ITEMS.filter(n => n.mech).length')} pairs)${bad.length ? ': ' + bad.join('; ') : ''}`);
ok(ev(`PREP_TABLE.every(([art, forms]) => forms.every((f, i) => JSON.stringify(SENT_JOIN[f]) === JSON.stringify([['di', 'a', 'da', 'in', 'su'][i], art])))`), 'the table in the side panel matches the joins Why explains (all 35)');

// ---- Playing them ----
const play = (key, raw, dir = 'en-it') => {
  ev(`direction = ${JSON.stringify(dir)}; selectedNouns = new Set([${JSON.stringify(key)}]); updateReadout();`);
  d.getElementById('start-btn').click();
  const p = d.getElementById('prompt'), r0 = { shown: p.textContent, mech: p.classList.contains('mech') };
  d.getElementById('answer').value = raw;
  d.getElementById('submit').click();
  const fb = d.getElementById('feedback');
  const r = { ...r0, html: fb.innerHTML, text: fb.textContent.replace(/\s+/g, ' '), right: fb.classList.contains('correct'), why: [...fb.querySelectorAll('.sent-why-list li')].map(li => li.textContent.replace(/\s+/g, ' ').trim()).join(' | '),
              note: ((fb.querySelector('.feedback-note') || {}).textContent || '').replace(/\s+/g, ' ').trim() };
  d.getElementById('change-btn').click();
  ev("direction = 'en-it'");
  return r;
};
let r = play('parlo-del-libro', 'Parlo del libro');
ok(r.right && r.shown === 'I talk about the book.' && /In una parola di \+ il libro → del libro/.test(r.note) && /Word for word I speak of-the book\./.test(r.note),
   'a fusion drill with its verb: I talk about the book → Parlo del libro; after, the pieces (di + il libro → del libro) and word for word (I speak of-the book)');
ok(play('parlo-del-libro', 'Io parlo del libro').right && play('e-sul-tavolo', 'è sul tavolo').right, 'the subject pronoun is optional as ever; È sul tavolo needs none');
ok(ev("PREP_ITEMS.filter(n => n.mech).every(n => !/\\+/.test(n.en) && !/\\+/.test(n.pl.en))") && new Set(ev('PREP_ITEMS.flatMap(cardsForItem).map(c => c.english.toLowerCase())')).size === ev('PREP_ITEMS.flatMap(cardsForItem).length'),
   'every English prompt is English, and no two cards share one — (m.) and (f.) where the English could be either (to the friend\'s)');
r = play('parlo-del-libro', "Parlo del'libro");
ok(!r.right && /del, not del': no apostrophe here — it stands for a dropped vowel, and only before another vowel/.test(r.why) && play('parlo-dell-amico', 'parlo dell amico').right,
   "an apostrophe Italian doesn't have is wrong (del'libro), with the reason; a missing one is forgiven (dell amico)");
ok(!/\.prompt\.mech\s*\{[^}]*font/.test(require('fs').readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8')), "fusion drills use the cards' usual face, like every other prompt");
ok(play('parlo-dell-amico', 'parlo dell amico').right && play('parlo-dell-amico', "parlo dell'amico").right && play('parlo-della-citta', 'parlo della citta').right, "apostrophes and accents are forgiven (dell amico, della citta)");
ok(/del = di \+ il: these prepositions join the article into one word/.test(play('parlo-del-libro', 'parlo di il libro').why), 'why: di il libro — they join into one word');
ok(/dello, not del: dello = di \+ lo — studente starts with s \+ consonant or z/.test(play('parlo-dello-studente', 'parlo del studente').why), 'why: dello, because studente starts with s + consonant');
ok(/nell', not nella: nell' = in \+ l' — armadio starts with a vowel/.test(play('e-nell-armadio', 'è nella armadio').why), "why: nell', because armadio starts with a vowel");
ok(/dal, not al: venire da is to come from/.test(play('vengo-dal-medico', 'vengo al medico').why), 'why, the wrong preposition: the verb it goes with (venire da)');
r = play('vado-a-roma', 'vado in Roma');
ok(!r.right && /a, not in: cities take a — a Roma, a Milano \(countries take in: in Italia\)/.test(r.why) && play('vado-a-roma', 'Io vado a Roma').right, 'why: cities take a (and the subject pronoun is optional)');
ok(/in, not a: countries and regions take in/.test(play('vado-in-italia', 'vado a Italia').why), 'why: countries take in');
r = play('aspetto-l-autobus', "aspetto per l'autobus");
ok(/per isn't needed here: no preposition in Italian — aspettare is to wait for/.test(r.why) && /Word for word I wait the bus/.test(r.note), "why: aspetto l'autobus needs no preposition; word for word, I wait the bus");
ok(/Correct\s*Aspetto l'autobus/.test(r.text || '') || !/>Io</.test(r.html || ''), 'the comparison uses the plain version — an optional Io is not shown as missing');
ok(/Missing a: pensare a: to think about/.test(play('penso-a-te', 'penso te').why), 'why: a missing preposition, with the verb\'s own rule');
ok(/in, not nella: no article here — just in: in cucina/.test(play('sono-in-cucina', 'sono nella cucina').why), 'why: in cucina takes no article');
ok(/da, not per: for or since: Italian uses da with the present tense/.test(play('abito-qui-da-tre-anni', 'abito qui per tre anni').why), 'why: da + the present tense for "have lived … for"');
ok(play('abito-negli-stati-uniti', 'abito negli Stati Uniti').right && /a country that takes the article joins it/.test(play('abito-negli-stati-uniti', 'abito in Stati Uniti').why),
   'negli Stati Uniti, with its own rule');
ok(/all', not alle: one o'clock is singular/.test(play('all-una', 'alle una').why), "a card's own lesson comes first: all'una, because one o'clock is singular");
r = play('parlo-del-libro', 'I talk about the book', 'it-en');
ok(r.right && r.shown === 'Parlo del libro.', 'Italian → English: Parlo del libro → I talk about the book');
ok(play('vado-da-marco', "I'm going to Marco's", 'it-en').right && play('vengo-dal-medico', "I'm coming from the doctor's", 'it-en').right, "Italian → English: I'm going to Marco's · at the doctor's");

// ---- Pairs: the singular, then its plural ----
ok(play('parlo-del-libro', 'I talk about the books', 'it-en').right === false && (() => { const B = boot({ 'flipcards-subject': 'prepositions' });
  B.ev("direction = 'it-en'; selectedNouns = new Set(['parlo-del-libro']); updateReadout();"); B.d.getElementById('start-btn').click();
  B.d.getElementById('answer').value = 'I talk about the book'; B.d.getElementById('submit').click(); B.d.getElementById('submit').click();
  const second = B.d.getElementById('prompt').textContent; B.d.getElementById('answer').value = 'I talk about the books'; B.d.getElementById('submit').click();
  return second === 'Parlo dei libri.' && B.d.getElementById('feedback').classList.contains('correct'); })(), 'Italian → English too: Parlo del libro, then Parlo dei libri → I talk about the books');
const pairsOk = () => {
  const cards = ev('deck.map(c => [c.noun, c.number || null, c.italian])');
  for (let i = 0; i < cards.length; i++) {
    if (cards[i][1] === 'sg' && !(cards[i + 1] && cards[i + 1][0] === cards[i][0] && cards[i + 1][1] === 'pl')) return false;
    if (cards[i][1] === 'pl' && !(cards[i - 1] && cards[i - 1][0] === cards[i][0] && cards[i - 1][1] === 'sg')) return false;
  }
  return true;
};
ev("selectedNouns = new Set(PREP_ITEMS.filter(n => n.mech).slice(0, 12).map(n => n.noun).concat(['vado-a-roma', 'penso-a-te'])); updateReadout();");
d.getElementById('start-btn').click();
let together = pairsOk();
for (let k = 0; k < 3; k++) { d.getElementById('reshuffle-btn').click(); together = together && pairsOk(); }
ok(together && ev('deck.length') === 26, 'in a round each pair stays together, singular first — through every reshuffle');
d.getElementById('change-btn').click();
ev("selectedNouns = new Set(['parlo-del-libro', 'vado-al-mercato']); capValue = '3'; updateReadout();");
d.getElementById('start-btn').click();
ok(ev('deck.length') === 4 && pairsOk(), 'a deck cut to an odd size never splits a pair (3 → both pairs)');
d.getElementById('change-btn').click();
ev("capValue = ''; selectedNouns = new Set(); updateReadout();");
const grid = ev('nounData.filter(n => n.mech).map(n => n.display)');
ok(grid.length === 49 && grid.includes('Parlo del libro.') && !grid.includes('Parlo dei libri.') && ev('nounData.every(n => !/\\|pl$/.test(n.noun))'), 'the setup lists the singular only — the plural is its second card');

const numBtn = k => d.querySelector(`#number-toggle [data-num="${k}"]`);
ok(numBtn('sg').classList.contains('active') && numBtn('pl').classList.contains('active') && d.getElementById('number-toggle').compareDocumentPosition(d.getElementById('theme-row')) & 4,
   'Singolare · Plurale at the top of the setup, both on to begin with');
numBtn('pl').click();
ev("selectedNouns = new Set(['parlo-del-libro', 'vado-al-mercato', 'vado-a-roma']); updateReadout();");
ok(/3 phrases · 3 cards/.test(d.querySelector('.deck-readout').textContent.replace(/\s+/g, ' ')) && JSON.stringify(ev('verbPersonsSaved().prepositions')) === '["sg"]', 'Plurale off: singular cards only (and the choice is saved)');
numBtn('sg').click();
ok(/at least one/i.test(d.getElementById('number-hint').textContent) && ev("activeNumbers().join()") === 'sg', 'one always stays on');
numBtn('pl').click(); numBtn('sg').click();
d.getElementById('start-btn').click();
ok(ev("deck.filter(c => c.mech).every(c => c.number === 'pl')") && ev("deck.some(c => c.italian === 'Parlo dei libri.')"), 'Singolare off: just the plurals');
d.getElementById('change-btn').click();
numBtn('sg').click();
ok(ev("activeNumbers().join()") === 'sg,pl' && ev("syncedKeys().get(VERB_PERSONS_KEY)") === 'assoc', 'back to both; the choice syncs with the verb persons');
ev("selectedNouns = new Set(); updateReadout();");

// ---- The setup: grouped themes, the table ----
const heads = [...d.querySelectorAll('.theme-group-btn')];
ok(heads.map(b => b.textContent.trim()).join('|') === 'Le articolate|Dove|Di chi, di cosa|Quando|Con i verbi|Con, per, tra' && d.querySelectorAll('#theme-chips .theme-chip').length === 27,
   'the 27 themes sit under their six group headings, as in the old game');
ev('selectedNouns = new Set(); updateReadout();');
d.querySelector('[data-group="art"]').click();
ok(ev('selectedNouns.size') === 49 && d.querySelector('[data-group="art"]').classList.contains('full'), 'a group heading picks its whole group (all 49 fusion pairs)');
d.querySelector('[data-group="art"]').click();
ok(ev('selectedNouns.size') === 0, 'and clicking it again clears it');
const cells = [...d.querySelectorAll('.prep-panel .eg-cell')].map(c => c.textContent.trim());
ok(cells.length === 35 && cells.includes('dello') && cells.includes("nell'") && cells.includes('sugli') && /Stay apart/.test(d.querySelector('.prep-panel').textContent), 'the side panel: the 35 joined forms, and what stays apart (con, per, tra)');

// ---- In Ripasso, synced, and a round ends properly ----
ev(`(() => { const s = loadSrs('prepositions', 'en-it'); s['parlo-del-libro'] = { b: 1, d: today(), l: today() - 1 }; saveSrs('prepositions', 'en-it', s); })()`);
ok(ev("dueList('en-it').some(x => x.subj === 'prepositions' && x.n.noun === 'parlo-del-libro')") && ev('REVIEW_LABEL.prepositions') === 'preposition', 'cards come back in Ripasso del giorno');
ev('startRipasso()');
ok(JSON.stringify(ev("deck.filter(c => c.subject === 'prepositions').map(c => c.italian)")) === JSON.stringify(['Parlo del libro.', 'Parlo dei libri.']), 'and Ripasso deals the whole pair: Parlo del libro, then Parlo dei libri');
d.getElementById('change-btn').click();
ok(ev("syncedKeys().has('preposizioni-stats-v1') && syncedKeys().has('preposizioni-stats-v1:srs') && storageKeys().includes('preposizioni-stats-v1')"), 'and their progress syncs and is backed up');
const errs = [];
w.addEventListener('error', e => errs.push(e.message));
ev("selectedNouns = new Set(['parlo-del-libro', 'vado-a-roma', 'penso-a-te']); updateReadout();");
d.getElementById('start-btn').click();
for (let k = 0, n = ev('deck.length'); k < n; k++) { d.getElementById('answer').value = k === 0 ? 'sbagliato' : ev('deck[index].italian'); d.getElementById('submit').click(); if (k === 0) d.getElementById('answer').value = ev('deck[index].italian'); d.getElementById('submit').click(); }
ok(!!d.querySelector('.complete') && errs.length === 0 && d.querySelectorAll('.missed-item').length === 1, 'a round with a miss ends on its summary');

// ---- Every slip of these kinds explained, none broken ----
const sweep = ev(`(() => {
  let tried = 0, shown = 0, bad = 0; const PREPS = ['di', 'a', 'da', 'in', 'su', 'con', 'per', 'tra'];
  for (const card of PREP_ITEMS.flatMap(cardsForItem)) {
    const words = sentenceWords(card.italian), norm = words.map(sentenceNorm);
    words.forEach((wd, j) => {
      const base = sentPrepOf(norm[j]);
      if (!base) return;
      const reps = [null, ...PREPS.filter(x => x !== base)];
      if (own(SENT_JOIN, norm[j])) for (const [f, [pp]] of Object.entries(SENT_JOIN)) if (pp === base && f !== norm[j]) reps.push(f);
      for (const rep of reps) {
        const g = [...words]; if (rep === null) g.splice(j, 1); else g[j] = rep;
        const raw = g.join(' ').replace(/' /g, "'");
        if (card.accepted.some(a => sentenceNorm(a.replace(/[.?!]/g, '')) === sentenceNorm(raw))) continue;
        tried++;
        const html = sentenceDiffHTML(raw, card);
        if (/sent-why/.test(html)) shown++;
        if (/undefined|NaN|\\[object/.test(html)) bad++;
      }
    });
  }
  return { tried, shown, bad };
})()`);
ok(sweep.tried > 1500 && sweep.shown === sweep.tried && sweep.bad === 0, `every preposition swapped for another, dropped, or joined to the wrong article: each explained, none broken (${sweep.shown}/${sweep.tried})`);
done();
