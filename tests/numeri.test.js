// Numeri (Nov 2026): numbers by how they're built, then real life. In lettere (the digits → the Italian),
// In cifre (the Italian → the digits), A orecchio (heard → the digits). Accents and spaces don't count.
const { boot, ok, done } = require('./harness');
const B = boot({ 'flipcards-subject': 'numeri' });
const d = B.d, ev = B.ev;

// ---- The engine: every rule ----
const W = n => ev(`numeriWords(${n})`);
ok(W(21) === 'ventuno' && W(28) === 'ventotto' && W(23) === 'ventitré' && W(3) === 'tre', 'the tens drop their vowel before uno and otto; a final tre takes an accent, tre alone does not');
ok(W(101) === 'centouno' && W(108) === 'centootto' && W(180) === 'centottanta' && W(203) === 'duecentotré', 'cento keeps its o before uno and otto, drops it before ottanta');
ok(W(1000) === 'mille' && W(2000) === 'duemila' && W(21000) === 'ventunomila' && W(23000) === 'ventitremila' && W(1003) === 'milletré' && W(1987) === 'millenovecentottantasette',
   'mille, then mila; ventunomila; no accent inside a word (ventitremila); all one word');
ok(W(1e6) === 'un milione' && W(2e6) === 'due milioni' && W(2.1e7) === 'ventun milioni' && W(1.5e6) === 'un milione cinquecentomila' && W(1e9) === 'un miliardo',
   'milione and miliardo apart, as nouns: un milione, due milioni, ventun milioni');
ok(ev('numeriOrdinal(1)') === 'primo' && ev('numeriOrdinal(11)') === 'undicesimo' && ev('numeriOrdinal(23)') === 'ventitreesimo' && ev('numeriOrdinal(28)') === 'ventottesimo',
   'ordinals: primo… decimo, then -esimo (ventitreesimo, ventottesimo)');

// ---- The section ----
ok([...d.querySelectorAll('#family-list-parole .section-name')].map(x => x.textContent).join() === 'Sostantivi,Aggettivi,Numeri,Avverbi e congiunzioni,Possessivi,Preposizioni'
   && ev("SECTION_DESC.numeri") === 'Counting, prices, times and dates', 'Numeri sits in Parole, after Aggettivi: Counting, prices, times and dates');
ok(ev('NUMERI_ITEMS.length') === 230 && ev('NUMERI_THEMES.map(t => t.nouns.length).join()') === '11,9,8,72,24,24,10,20,16,16,20'
   && ev('NUMERI_ITEMS.every(n => n.note)') && ev('new Set(NUMERI_ITEMS.map(n => n.en)).size') === 230, '230 numbers in eleven rows, each with its note, every prompt different');
ok(d.querySelectorAll('#noun-map .map-row').length === 11 && /In lettere/.test(d.querySelector('.map-eyebrow').textContent)
   && [...d.querySelectorAll('#mode-toggle .mode-option')].map(b => b.textContent).join() === 'In lettere,In cifre,A orecchio' && d.querySelector('#mode-toggle .mode-option.active').textContent === 'In lettere',
   'the map: eleven rows; the switch In lettere · In cifre · A orecchio — In lettere to start with');

// ---- In lettere: the digits, you write the Italian ----
const pick = keys => ev(`clearHand(); ${JSON.stringify(keys)}.forEach(k => selectedNouns.add(k)); updateReadout();`);
const play = (keys, answers) => {
  pick(keys);
  d.getElementById('start-btn').click();
  const out = [];
  for (let i = 0; i < keys.length; i++) {
    const key = ev('deck[index].noun');
    d.getElementById('answer').value = answers[key];
    d.getElementById('submit').click();
    out.push({ key, prompt: d.getElementById('prompt') ? d.getElementById('prompt').textContent : '', right: !/not quite/i.test(d.getElementById('feedback').textContent), fb: d.getElementById('feedback').textContent });
    d.getElementById('submit').click();
  }
  ev('showSetup()');
  return out;
};
const lettere = play(['n23', 'y2026', 'n108', 'e350', 't0745'], { n23: 'ventitre', y2026: 'duemila ventisei', n108: 'centotto', e350: 'tre e cinquanta', t0745: 'le sette e quarantacinque' });
ok(lettere.length === 5 && lettere.every(r => r.right), `In lettere: ventitre (no accent), duemila ventisei (a space), centotto, tre e cinquanta, le sette e quarantacinque — all right (${lettere.filter(r => !r.right).map(r => r.key).join(', ') || 'all'})`);
ok(/ventitré/.test(lettere.find(r => r.key === 'n23').fb), '…and the card shows the right spelling: ventitré');

// ---- In cifre: the Italian, you type the digits ----
[...d.querySelectorAll('#mode-toggle .mode-option')].find(b => b.textContent === 'In cifre').click();
ok(ev('direction') === 'it-en' && d.querySelector('#direction-toggle .mode-option.active').dataset.direction === 'it-en' && /In cifre/.test(d.querySelector('.map-eyebrow').textContent),
   'In cifre is IT → EN: the hand\'s switch follows, and so does the map');
pick(['n1000']);
d.getElementById('start-btn').click();
ok(/mille/.test(d.getElementById('prompt').textContent), 'the card shows mille');
d.getElementById('answer').value = '1.000'; d.getElementById('submit').click();
ok(!/not quite/i.test(d.getElementById('feedback').textContent), '1.000 is right — and so would 1000 be');
ev('showSetup()');
ok(B.ev("checkPhraseAnswer('1000', cardsForItem(NUMERI_ITEMS.find(n => n.noun === 'n1000'))[0], true).correct"), '1000, without the dot, too');

// ---- A orecchio: heard, typed in digits ----
[...d.querySelectorAll('#mode-toggle .mode-option')].find(b => b.textContent === 'A orecchio').click();
ok(ev('direction') === 'listen' && /A orecchio/.test(d.querySelector('.map-eyebrow').textContent), 'A orecchio: the Listen direction, kept in Numeri');
pick(['n47']);
d.getElementById('start-btn').click();
ok(d.getElementById('listen-btn') && /number you hear|no Italian voice/.test(d.getElementById('pronoun-hint').textContent) && d.getElementById('answer').placeholder === 'type the digits…',
   'the card plays it — nothing to read — and asks for the digits');
d.getElementById('answer').value = '47'; d.getElementById('submit').click();
ok(!/not quite/i.test(d.getElementById('feedback').textContent) && ev("JSON.parse(localStorage.getItem('numeri-stats-listen-v1') || '{}').n47") , '47 is right, and it counts in its own history');
ev('setOwnKeyboard(true)');
ok(d.querySelector('.container').classList.contains('kb-digits'), "on a phone, Il Mazzo's keyboard shows the number pad");
d.getElementById('submit').click();
ev('showSetup(); setOwnKeyboard(false)');

// ---- The builder ----
const inp = d.getElementById('numeri-build');
inp.value = '21000'; inp.dispatchEvent(new B.w.Event('input', { bubbles: true }));
ok(/ventunomila/.test(d.getElementById('numeri-out').textContent) && d.querySelectorAll('#numeri-out .nb-part').length === 1, 'the builder: type 21000, see ventunomila');
inp.value = '1.987'; inp.dispatchEvent(new B.w.Event('input', { bubbles: true }));
ok(/millenovecentottantasette/.test(d.getElementById('numeri-out').textContent) && d.querySelectorAll('#numeri-out .nb-part').length === 4, '1.987 (with its dot) → millenovecentottantasette, in four parts');

// ---- Elsewhere, Listen goes back to EN → IT ----
ev("subject = 'nouns'; showSetup();");
ok(ev('direction') === 'en-it', 'opening Sostantivi: A orecchio stays in Numeri — the hand is back to EN → IT');
ok(B.errors.length === 0, `no errors (${B.errors.slice(0, 2).join(' | ')})`);
done();
