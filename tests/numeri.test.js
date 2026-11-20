// Numeri (Nov 2026): counting — every number to 100, every hundred to 10.000, every ten thousand to a million. In lettere (the digits → the Italian),
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

// ---- The section ----
ok([...d.querySelectorAll('#family-list-parole .section-name')].map(x => x.textContent).join() === 'Sostantivi,Aggettivi,Numeri,Avverbi e congiunzioni,Possessivi,Preposizioni'
   && ev("SECTION_DESC.numeri") === 'Counting, from zero to a million', 'Numeri sits in Parole, after Aggettivi: Counting, from zero to a million');
ok(ev('NUMERI_ITEMS.length') === 299 && ev('NUMERI_THEMES.map(t => t.nouns.length).join()') === '101,99,99'
   && ev("NUMERI_THEMES.map(t => NUMERI_DATA.find(p => p.key === t.nouns[0]).en + '-' + NUMERI_DATA.find(p => p.key === t.nouns[t.nouns.length - 1]).en).join()") === '0-100,200-10.000,20.000-1.000.000'
   && ev('NUMERI_ITEMS.every(n => n.note)') && ev('new Set(NUMERI_ITEMS.map(n => n.en)).size') === 299,
   '299 numbers in three rows — every number to 100, every hundred to 10.000, every ten thousand to a million — each with its note');
ok(d.querySelectorAll('#noun-map .map-row').length === 3 && /In lettere/.test(d.querySelector('.map-eyebrow').textContent)
   && [...d.querySelectorAll('#mode-toggle .mode-option')].map(b => b.textContent).join() === 'In lettere,In cifre,A orecchio' && d.querySelector('#mode-toggle .mode-option.active').textContent === 'In lettere',
   'the map: three rows; the switch In lettere · In cifre · A orecchio — In lettere to start with');

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
const lettere = play(['n23', 'n2600', 'n180000', 'n100'], { n23: 'ventitre', n2600: 'duemila seicento', n180000: 'centoottantamila', n100: 'cento' });
ok(lettere.length === 4 && lettere.every(r => r.right), `In lettere: ventitre (no accent), duemila seicento (a space), centoottantamila (cento's o kept), cento — all right (${lettere.filter(r => !r.right).map(r => r.key).join(', ') || 'all'})`);
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

// ---- The builder: from Le regole, by the title ----
d.getElementById('rules-btn').click();
const inp = d.getElementById('numeri-build');
inp.value = '21000'; inp.dispatchEvent(new B.w.Event('input', { bubbles: true }));
ok(/ventunomila/.test(d.getElementById('numeri-out').textContent) && d.querySelectorAll('#numeri-out .nb-part').length === 1, 'the builder: type 21000, see ventunomila');
inp.value = '1.987'; inp.dispatchEvent(new B.w.Event('input', { bubbles: true }));
ok(/millenovecentottantasette/.test(d.getElementById('numeri-out').textContent) && d.querySelectorAll('#numeri-out .nb-part').length === 4, '1.987 (with its dot) → millenovecentottantasette, in four parts');
d.getElementById('chart-close').click();

// ---- Elsewhere, Listen goes back to EN → IT ----
ev("subject = 'nouns'; showSetup();");
ok(ev('direction') === 'en-it', 'opening Sostantivi: A orecchio stays in Numeri — the hand is back to EN → IT');
ok(B.errors.length === 0, `no errors (${B.errors.slice(0, 2).join(' | ')})`);
done();
