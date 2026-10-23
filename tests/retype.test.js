// After a miss, the right answer has to be typed before the next card: the box clears,
// the button reads Riscrivi →, and only a right copy moves on (as leniently checked as
// the answer itself). It's practice: score, history and review schedule stay as the miss
// left them. Everywhere — every section, both directions, Ripasso.
const { boot, ok, done } = require('./harness');
const key = (d, k) => d.dispatchEvent(new d.defaultView.KeyboardEvent('keydown', { key: k, bubbles: true }));

const round = (subj, keys, dir = 'en-it') => {
  const B = boot({ 'flipcards-subject': subj });
  B.ev(`direction = ${JSON.stringify(dir)}; selectedNouns = new Set(${JSON.stringify(keys)}); updateReadout();`);
  B.d.getElementById('start-btn').click();
  return B;
};

// ---- Sostantivi: the whole flow ----
let { d, ev } = round('nouns', ['casa', 'pane']);
const first = ev('deck[0]'), placeholder = d.getElementById('answer').placeholder;
const statsBefore = ev(`JSON.stringify(stats[${JSON.stringify(first.noun)}] || null)`);
d.getElementById('answer').value = 'qualcosa';
d.getElementById('submit').click();
const ans = () => d.getElementById('answer'), sub = () => d.getElementById('submit');
ok(!ans().disabled && ans().value === '' && sub().textContent === 'Riscrivi →' && ans().classList.contains('retype') && ans().placeholder !== placeholder
   && /Type it above to go on/.test(d.getElementById('feedback').textContent), 'a miss: the box clears for the right answer, and the button reads Riscrivi →');
const after = { score: ev('score'), stats: ev(`JSON.stringify(stats[${JSON.stringify(first.noun)}])`), srs: ev(`JSON.stringify(loadSrs('nouns', 'en-it')[${JSON.stringify(first.noun)}])`) };
key(d, 'Enter');
ok(ev('index') === 0 && /Type the answer to go on/.test(d.getElementById('retype-hint').textContent), 'Enter alone does not move on');
ans().value = 'la cosa sbagliata';
sub().click();
ok(ev('index') === 0 && /Not quite/.test(d.getElementById('retype-hint').textContent) && ans().classList.contains('retype-miss'), 'nor does a wrong copy (the box shakes)');
ans().value = first.italian.toUpperCase();
key(d, 'Enter');
ok(ev('index') === 1, 'the right answer (capitals forgiven, like the answer itself) moves on');
ok(ev('score') === after.score && ev(`JSON.stringify(stats[${JSON.stringify(first.noun)}])`) === after.stats && ev(`JSON.stringify(loadSrs('nouns', 'en-it')[${JSON.stringify(first.noun)}])`) === after.srs && statsBefore !== after.stats,
   'the retype is practice: the score, the card\'s history and its review stay as the miss left them');
ok(!ans().classList.contains('retype') && ans().placeholder === placeholder && sub().textContent === 'Controlla' && ans().value === '', 'the next card starts clean');
ans().value = ev('deck[1].italian');
sub().click();
ok(sub().textContent === 'Avanti →' && ans().disabled, 'a right answer needs no retype: Avanti as before');

// ---- Nothing typed: asked for an answer, nothing counted ----
({ d, ev } = round('nouns', ['casa', 'pane']));
const card0 = ev('deck[0]'), ph = d.getElementById('answer').placeholder, stats0 = ev(`JSON.stringify(stats[${JSON.stringify(card0.noun)}] || null)`);
key(d, 'Enter');
d.getElementById('submit').click();
ok(ev('index') === 0 && d.getElementById('feedback').classList.contains('hidden') && !ev('answered') && d.getElementById('answer').placeholder === 'type your answer first…'
   && d.getElementById('answer').classList.contains('retype-miss') && ev('score') === 0 && ev('roundMissed.size') === 0 && ev(`JSON.stringify(stats[${JSON.stringify(card0.noun)}] || null)`) === stats0,
   'an empty answer (Enter by accident) is never wrong: the box asks for an answer, and nothing is counted');
d.getElementById('answer').value = 'sbagliato'; d.getElementById('submit').click();
d.getElementById('answer').value = card0.italian; d.getElementById('submit').click();
ok(ev('index') === 1 && d.getElementById('answer').placeholder === ph, 'after a nudge and a miss, the next card gets its own placeholder back');

// ---- Italian → English: retype the English; "I was right" lifts it ----
({ d, ev } = round('nouns', ['casa'], 'it-en'));
d.getElementById('answer').value = 'home sweet home';
d.getElementById('submit').click();
ok(d.getElementById('submit').textContent === 'Riscrivi →', 'Italian → English: a miss asks for the English');
d.getElementById('override-btn').click();
ok(d.getElementById('submit').textContent === 'Avanti →' && d.getElementById('answer').disabled && !d.getElementById('retype-hint'), '"I was right — count it" lifts the retype');
key(d, 'Enter');
ok(!!d.querySelector('.complete'), 'and Enter moves on');

// ---- Verbs, sentences, prepositions, Ripasso ----
({ d, ev } = round('verbs', ['parlare']));
d.getElementById('answer').value = 'xyz'; d.getElementById('submit').click();
d.getElementById('answer').value = ev('deck[index].italian'); d.getElementById('submit').click();
ok(ev('index') === 1, 'Verbi: the conjugation, typed right, moves on');
({ d, ev } = round('sentences', ['il-cane-beve-l-acqua']));
d.getElementById('answer').value = 'il cane bevi acqua'; d.getElementById('submit').click();
d.getElementById('answer').value = 'il cane beve l acqua'; d.getElementById('submit').click();
ok(ev('index') === 1 && !!d.querySelector('.complete'), "Scrittura: the sentence, as leniently as the answer (no capital, no full stop, l acqua)");
({ d, ev } = round('prepositions', ['parlo-del-libro']));
d.getElementById('answer').value = 'parlo di il libro'; d.getElementById('submit').click();
ok(d.getElementById('submit').textContent === 'Riscrivi →' && !!d.querySelector('.sent-why'), 'Preposizioni: the Why stays on screen to copy from');
d.getElementById('answer').value = 'Parlo del libro'; d.getElementById('submit').click();
ok(ev('index') === 1 && ev('deck[index].italian') === 'Parlo dei libri.', 'and the plural follows once it is typed right');
const R = boot({ 'flipcards-subject': 'nouns' });
R.ev(`(() => { const s = loadSrs('nouns', 'en-it'); s.casa = { b: 1, d: today(), l: today() - 1 }; saveSrs('nouns', 'en-it', s); startRipasso(); })()`);
R.d.getElementById('answer').value = 'no'; R.d.getElementById('submit').click();
ok(R.d.getElementById('submit').textContent === 'Riscrivi →', 'Ripasso del giorno asks for it too');
R.d.getElementById('answer').value = R.ev('deck[index].italian'); R.d.getElementById('submit').click();
ok(!!R.d.querySelector('.complete'), 'and moves on once it is typed right');
done();
