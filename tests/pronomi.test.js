// Pronomi (Nov 2026): the object pronouns — lo, gli, ci, ne. One card, two ways to play: Dall'inglese
// ("I see him." → Lo vedo.) and Al posto del nome ("Vedo [Marco]." → Lo vedo.), each with its own progress;
// answered in Italian both ways; a note after each answer; Le regole by the title.
const { boot, ok, done } = require('./harness');

const B = boot({ 'flipcards-subject': 'pronomi' });
const { d, ev } = B;
ok(B.errors.length === 0 && B.warns.length === 0, 'loads cleanly');
ok(ev("FAMILIES.find(f => f.key === 'parole').sections.join()") === 'nouns,adjectives,numeri,avverbi,possessives,pronomi,prepositions' && d.getElementById('app-title').textContent === 'Pronomi',
   'a section of its own in Parole, after Possessivi');

// ---- The cards ----
ok(ev('PRON_ITEMS.length') === 100 && ev('PRON_THEMES.map(t => t.nouns.length).join()') === '12,10,10,10,8,12,10,8,10,10', '100 cards in ten topics');
ok(ev('new Set(PRON_ITEMS.map(n => n.noun)).size') === 100, "every card's Italian is different — it's the card's key");
ok(ev('PRON_ITEMS.every(n => (n.sub.match(/\\[/g) || []).length === 1 && !n.it.toLowerCase().includes(n.sub.match(/\\[([^\\]]+)\\]/)[1].toLowerCase()))'),
   'each has the words a pronoun replaces — and its answer no longer has them');
ok(ev('PRON_ITEMS.every(n => n.note && n.note.length > 30)'), 'and a note for after answering');

// ---- The page ----
const groups = [...d.querySelectorAll('#noun-map .map-group[data-group]')].map(g => `${g.dataset.label}: ${d.querySelectorAll(`#noun-map .map-row[data-group="${g.dataset.group}"]`).length}`);
ok(groups.join(' · ') === 'Diretti: 5 · Indiretti: 3 · Ci e ne: 2', `La mappa, in teaching order: ${groups.join(' · ')}`);
ok(/Me lo, glielo/.test((d.querySelector('#noun-map .map-later-note') || {}).textContent || ''), 'and the doubled forms, for later');
ok([...d.querySelectorAll('#mode-toggle .mode-option')].map(b => b.textContent).join() === "Dall'inglese,Al posto del nome" && d.querySelector('#mode-toggle .mode-option.active').dataset.mode === 'en-it',
   "one Practise switch: Dall'inglese · Al posto del nome — from English, to start with");
d.getElementById('rules-btn').click();
const cells = [...d.querySelectorAll('#chart-overlay .eg-pron .eg-cell')].map(c => c.textContent.trim());
ok(cells.length === 16 && cells[4] === 'lo' && cells[5] === 'gli' && /Telefonare, rispondere/.test(d.getElementById('chart-overlay').textContent),
   'Le regole: the table (lui — lo, gli) and the rules, «a» or not');
d.getElementById('chart-close').click();

// ---- Playing ----
const play = (keys, answers) => {
  ev(`clearHand(); selectedNouns = new Set(${JSON.stringify(keys)}); capValue = ''; updateReadout();`);
  d.getElementById('start-btn').click();
  const out = {};   // the first answer to each card (a missed one comes back later in the round)
  for (let i = 0; i < keys.length * 4 && Object.keys(out).length < keys.length && ev('container.dataset.view') === 'game'; i++) {
    const key = ev('deck[index].noun');
    const r = { key, prompt: d.getElementById('prompt').textContent, under: (d.querySelector('#prompt .pron-sub') || {}).textContent || '', hint: d.getElementById('pronoun-hint').textContent,
                digits: d.getElementById('container').classList.contains('kb-digits'), english: ev('answersEnglish(deck[index])') };
    d.getElementById('answer').value = answers[key];
    d.getElementById('submit').click();
    Object.assign(r, { right: !/not quite/i.test(d.getElementById('feedback').textContent), fb: d.getElementById('feedback').textContent.replace(/\s+/g, ' ') });
    if (!out[key]) out[key] = r;
    if (!r.right) { d.getElementById('answer').value = ev('deck[index].italian'); d.getElementById('submit').click(); }   // a miss: type it right, which goes straight on
    else d.getElementById('submit').click();   // right: the next card
  }
  ev('showSetup()');
  return out;
};
const en = play(['lo-vedo', 'voglio-vederlo', 'le-telefono'], { 'lo-vedo': 'lo vedo', 'voglio-vederlo': 'Lo voglio vedere.', 'le-telefono': 'la telefono' });
ok(en['lo-vedo'].prompt === 'I see him.' && en['lo-vedo'].hint === '+ pronome' && en['lo-vedo'].right && !en['lo-vedo'].english,
   "Dall'inglese: 'I see him.' → lo vedo, right without capitals or full stop");
ok(en['voglio-vederlo'].right, 'the pronoun before the modal is right too: Lo voglio vedere. for Voglio vederlo.');
ok(!en['le-telefono'].right && /Telefonare a/.test(en['le-telefono'].fb), 'La telefono is marked wrong — and the note says why: telefonare a');

d.querySelector('#mode-toggle .mode-option[data-mode="it-en"]').click();
ok(ev('direction') === 'it-en' && /Al posto del nome/.test(d.querySelector('#noun-map .map-eyebrow').textContent), 'Al posto del nome: the switch moves, and the map says so');
const sub = play(['lo-vedo', 'ne-voglio-due'], { 'lo-vedo': 'Lo vedo.', 'ne-voglio-due': 'ne voglio due' });
ok(sub['lo-vedo'].prompt === 'Vedo Marco.' && sub['lo-vedo'].under === 'Marco' && sub['lo-vedo'].hint === 'al posto del nome',
   'the card is the Italian, the words to replace underlined: Vedo [Marco].');
ok(sub['lo-vedo'].right && sub['ne-voglio-due'].right && !sub['lo-vedo'].english && !sub['ne-voglio-due'].digits,
   'answered in Italian, on the letters (not the number pad): Lo vedo., ne voglio due');
const kept = (store, key) => ev(`(() => { try { return Object.prototype.hasOwnProperty.call(JSON.parse(localStorage.getItem('${store}') || '{}'), '${key}'); } catch (e) { return false; } })()`);
ok(kept('pronomi-stats-sub-v1', 'ne-voglio-due') && !kept('pronomi-stats-v1', 'ne-voglio-due') && kept('pronomi-stats-v1', 'voglio-vederlo'),
   'each way to play keeps its own progress');
ok(ev("checkCard(\"L'apro.\", cardsForItem(PRON_ITEMS.find(n => n.it === 'La apro.'))[0], false).correct") && ev("checkCard('La apro', cardsForItem(PRON_ITEMS.find(n => n.it === 'La apro.'))[0], false).correct"),
   "before a vowel, both: la apro and l'apro");
ok(!ev("RIPASSO_SECTIONS.includes('pronomi')"), 'like Possessivi, its phrases stay in the section — Ripasso del giorno is for words');
ok(B.errors.length === 0, 'no errors along the way');
done();
