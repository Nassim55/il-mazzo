// Preposizioni: the old preposizioni game rebuilt inside Il Mazzo — fusion drills and usage
// cards from the deck's own words, a rule for every kind of slip (Why), the fusion table,
// grouped themes, Ripasso and sync.
const { boot, ok, done } = require('./harness');
const { w, d, ev, errors, warns } = boot({ 'flipcards-subject': 'prepositions' });
ok(errors.length === 0 && warns.length === 0, 'loads cleanly: every word of every card is in the deck, a small word or a name');
const tabs = [...d.querySelectorAll('#subject-toggle .mode-option')].map(b => b.textContent.trim());
ok(tabs.join('|') === 'Sostantivi|Verbi regolari|Verbi irregolari|Aggettivi|Preposizioni|Frasi|Scrittura|Racconto'
   && d.querySelector('#subject-toggle [data-subject="prepositions"]').classList.contains('active'), 'Preposizioni is a section of its own, after Aggettivi');
ok(ev('PREP_ITEMS.length') === 224 && ev('PREP_THEMES.length') === 27 && ev('PREP_GROUPS.length') === 6, '224 cards in 27 themes, in six groups');
// Everything the old game drilled, with at least as many cards (it called some of them by English names)
const OLD = { 'di-art': 22, 'a-art': 8, 'da-art': 22, 'in-art': 8, 'su-art': 8, citta: 6, paesi: 6, 'da-persona': 6, luoghi: 8, possesso: 6, origine: 6, momenti: 7, periodi: 8, 'verbi-a': 7, 'verbi-di': 6, 'verbi-inf': 8 };
const size = k => ev(`(PREP_THEMES.find(t => t.key === ${JSON.stringify(k)}) || { nouns: [] }).nouns.length`);
ok(Object.entries(OLD).every(([k, n]) => size(k) >= n), `every one of the old game's 16 patterns is here, with at least as many cards (di + articolo ${size('di-art')}, da + articolo ${size('da-art')})`);
ok(ev('PREP_THEMES.every(t => t.nouns.length) && PREP_ITEMS.every(n => n.rule && n.rule.length > 20)'), 'every theme has cards, and every card a rule for when its preposition is wrong');

// ---- The fusion drills are right, from the deck's own articles ----
const bad = ev(`(() => {
  const out = [], join = Object.fromEntries(PREP_TABLE.flatMap(([art, forms]) => forms.map((f, i) => [['di', 'a', 'da', 'in', 'su'][i] + '|' + art, f])));
  for (const n of PREP_ITEMS.filter(n => n.mech)) {
    const m = /^(di|a|da|in|su) \\+ (il|lo|l'|la|i|gli|le) ?(.+)$/.exec(n.mechPrompt);
    if (!m) { out.push('prompt: ' + n.mechPrompt); continue; }
    const [, prep, art, word] = m;
    const key = NOUN_ITEMS.some(x => x.noun === word) ? word : (sentencePluralNoun(word, storyIndex()) || '').replace(/^nouns:/, '');
    const item = NOUN_ITEMS.find(x => x.noun === key);   // looked up as a noun: on its own, cucina would be the verb
    if (!item) { out.push('not a deck noun: ' + word); continue; }
    const sing = item.it.match(/^(il|lo|la|l')/)[1], plural = word !== item.noun;
    const want = !plural ? sing : item.g === 'f' ? 'le' : (sing === 'lo' || sing === "l'") ? 'gli' : 'i';
    if (art !== want) out.push(n.mechPrompt + ': the article should be ' + want);
    const fused = join[prep + '|' + art] + (art === "l'" ? '' : ' ') + word;
    if (fused !== n.it) out.push(n.mechPrompt + ' → ' + n.it + ' (should be ' + fused + ')');
  }
  return out;
})()`);
ok(bad.length === 0, `every fusion drill uses its noun's own article from the deck (plurals from the singular), and joins it correctly (${ev('PREP_ITEMS.filter(n => n.mech).length')} drills)${bad.length ? ': ' + bad.join('; ') : ''}`);
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
let r = play('del-libro', 'del libro');
ok(r.right && r.mech && /^di \+ il libro$/.test(r.shown) && /In English of the book/.test(r.note), 'a fusion drill: di + il libro (the + in gold); del libro; the English after');
ok(!/\.prompt\.mech\s*\{[^}]*font/.test(require('fs').readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8')), "fusion drills use the cards' usual face, like every other prompt");
ok(play('dell-amico', 'dell amico').right && play('dell-amico', "dell'amico").right && play('della-citta', 'della citta').right, "apostrophes and accents are forgiven (dell amico, della citta)");
ok(/del = di \+ il: these prepositions join the article into one word/.test(play('del-libro', 'di il libro').why), 'why: di il libro — they join into one word');
ok(/dello, not del: dello = di \+ lo — zucchero starts with s \+ consonant or z/.test(play('dello-zucchero', 'del zucchero').why), 'why: dello, because zucchero starts with z');
ok(/nell', not nella: nell' = in \+ l' — acqua starts with a vowel/.test(play('nell-acqua', 'nella acqua').why), "why: nell', because acqua starts with a vowel");
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
r = play('del-libro', 'of the book', 'it-en');
ok(r.right && !r.mech && r.shown === 'del libro', 'Italian → English: del libro → of the book (a plain Italian prompt)');
ok(play('vado-da-marco', "I'm going to Marco's", 'it-en').right && play('dal-medico', "at the doctor's", 'it-en').right, "Italian → English: I'm going to Marco's · at the doctor's");

// ---- The setup: grouped themes, the table ----
const heads = [...d.querySelectorAll('.theme-group-btn')];
ok(heads.map(b => b.textContent.trim()).join('|') === 'Le articolate|Dove|Di chi, di cosa|Quando|Con i verbi|Con, per, tra' && d.querySelectorAll('#theme-chips .theme-chip').length === 27,
   'the 27 themes sit under their six group headings, as in the old game');
ev('selectedNouns = new Set(); updateReadout();');
d.querySelector('[data-group="art"]').click();
ok(ev('selectedNouns.size') === 22 + 11 + 22 + 11 + 11 && d.querySelector('[data-group="art"]').classList.contains('full'), 'a group heading picks its whole group (all 77 fusion drills)');
d.querySelector('[data-group="art"]').click();
ok(ev('selectedNouns.size') === 0, 'and clicking it again clears it');
const cells = [...d.querySelectorAll('.prep-panel .eg-cell')].map(c => c.textContent.trim());
ok(cells.length === 35 && cells.includes('dello') && cells.includes("nell'") && cells.includes('sugli') && /Stay apart/.test(d.querySelector('.prep-panel').textContent), 'the side panel: the 35 joined forms, and what stays apart (con, per, tra)');

// ---- In Ripasso, synced, and a round ends properly ----
ev(`(() => { const s = loadSrs('prepositions', 'en-it'); s['del-libro'] = { b: 1, d: today(), l: today() - 1 }; saveSrs('prepositions', 'en-it', s); })()`);
ok(ev("dueList('en-it').some(x => x.subj === 'prepositions' && x.n.noun === 'del-libro')") && ev('REVIEW_LABEL.prepositions') === 'preposition', 'cards come back in Ripasso del giorno');
ok(ev("syncedKeys().has('preposizioni-stats-v1') && syncedKeys().has('preposizioni-stats-v1:srs') && storageKeys().includes('preposizioni-stats-v1')"), 'and their progress syncs and is backed up');
const errs = [];
w.addEventListener('error', e => errs.push(e.message));
ev("selectedNouns = new Set(['del-libro', 'vado-a-roma', 'penso-a-te']); updateReadout();");
d.getElementById('start-btn').click();
for (let k = 0; k < 3; k++) { d.getElementById('answer').value = k === 0 ? 'sbagliato' : ev('deck[index].italian'); d.getElementById('submit').click(); d.getElementById('submit').click(); }
ok(!!d.querySelector('.complete') && errs.length === 0 && d.querySelectorAll('.missed-item').length === 1, 'a round with a miss ends on its summary');

// ---- Every slip of these kinds explained, none broken ----
const sweep = ev(`(() => {
  let tried = 0, shown = 0, bad = 0; const PREPS = ['di', 'a', 'da', 'in', 'su', 'con', 'per', 'tra'];
  for (const n of PREP_ITEMS) {
    const card = cardsForItem(n)[0], words = sentenceWords(n.it), norm = words.map(sentenceNorm);
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
