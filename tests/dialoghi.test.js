// Dialoghi: six everyday scenes in two voices — listen, answer, then write each line
// from dictation. A stand-in speech engine records every utterance (text, voice, pitch,
// rate) so the tests can play a scene through, line by line.
const { boot, ok, done } = require('./harness');

function fakeSpeech(voices) {
  return w => {
    w.__said = [];
    w.__cancels = 0;
    w.SpeechSynthesisUtterance = function (text) { this.text = text; };
    w.speechSynthesis = { getVoices: () => voices, cancel() { w.__cancels++; }, speak(u) { w.__said.push(u); }, addEventListener() {}, speaking: false };
  };
}
const TWO = [
  { name: 'Alice', lang: 'it-IT', voiceURI: 'alice', localService: true },
  { name: 'Luca', lang: 'it-IT', voiceURI: 'luca', localService: true },
  { name: 'Samantha', lang: 'en-US', voiceURI: 'sam', localService: true }
];
// Two versions of one voice are still one person
const ONE = [
  { name: 'Alice', lang: 'it-IT', voiceURI: 'alice', localService: true },
  { name: 'Alice (Enhanced)', lang: 'it-IT', voiceURI: 'alice-enh', localService: true }
];
const open = (B, id) => B.d.querySelector(`[data-open="${id}"]`).click();
const view = B => B.d.querySelector('.container').dataset.view;
const rows = B => [...B.d.querySelectorAll('#dlg-lines .dlg-line')];
const progress = B => JSON.parse(B.w.localStorage.getItem('mazzo-dialoghi-v1') || '{}');

// ---- The section and its scenes ----
let B = boot({ 'flipcards-subject': 'dialoghi' }, fakeSpeech(TWO));
ok(B.warns.length === 0 && B.errors.length === 0, 'loads cleanly — every word of every line is in the deck, no line or English prompt twice, every question sound');
const tabs = [...B.d.querySelectorAll('#subject-toggle .mode-option')].map(b => b.textContent.trim());
ok(tabs[7] === 'Dialoghi' && tabs[6] === 'Scrittura' && tabs[8] === 'Racconto', 'Dialoghi is a section of its own, between Scrittura and Racconto');
const cards = [...B.d.querySelectorAll('.dlg-card')];
ok(cards.map(c => c.querySelector('.dlg-card-title').textContent).join('|') === 'Al bar|Al mercato|Alla stazione|Al ristorante|La vicina|Il tetto',
   'six scenes: the bar, the market, the station, the restaurant, the neighbour, the roof');
ok(B.ev('DIALOGUES.every(x => x.lines.length === 8 && x.questions.length === 3)') && B.ev('DIALOGUE_ITEMS.length') === 48, 'eight lines and three questions each — 48 lines in all');
ok(cards[0].querySelector('.dlg-card-steps').textContent.replace(/\s+/g, ' ').trim() === 'Ascoltato Domande Dettato 0/8', 'each card shows its three steps, none done yet');

// ---- Ascolta: the text hidden at first; two voices ----
open(B, 'bar');
ok(view(B) === 'dialogue' && B.d.querySelector('.dlg-title').textContent === 'Al bar', 'a scene opens on its own page');
ok(rows(B).length === 8 && B.d.getElementById('dlg-lines').classList.contains('is-veiled') && !B.d.querySelector('.dlg-it')
   && rows(B).map(r => r.querySelector('.dlg-speaker').textContent).slice(0, 2).join('|') === 'Barista|Cliente', 'the text starts hidden — listen first — with who says each line');
B.d.getElementById('dlg-play').click();
let said = B.w.__said;
ok(said.length === 8 && said[0].text === 'Buongiorno! Cosa prende?' && said.every((u, k) => u.voice.name === (k % 2 ? 'Luca' : 'Alice') && u.rate === 1 && u.pitch === 1),
   '▶ Ascolta il dialogo: all eight lines, each in its speaker\'s voice (two different Italian voices), at normal speed');
ok(B.d.getElementById('dlg-play').textContent === '■ Ferma', 'while it plays the button stops it');
said[0].onstart();
ok(rows(B)[0].classList.contains('is-speaking'), 'the line being spoken is highlighted (even with the text hidden)');
said[0].onend(); said[1].onstart();
ok(!rows(B)[0].classList.contains('is-speaking') && rows(B)[1].classList.contains('is-speaking'), '…and the highlight moves on with the conversation');
for (let k = 1; k < 8; k++) { said[k].onstart(); said[k].onend(); }
const p1 = progress(B);
ok(/^\d{4}-\d{2}-\d{2}$/.test(p1.read && p1.read.bar) && !B.d.getElementById('dlg-heard').hidden && /Ascoltato/.test(B.d.getElementById('dlg-heard').textContent)
   && B.d.getElementById('dlg-play').textContent === '▶ Ascolta il dialogo', 'heard to the end: Ascoltato, dated (kept, and synced)');
B.w.__said = [];
B.d.querySelector('#dlg-speed [data-slow="1"]').click();
B.d.getElementById('dlg-play').click();
ok(B.w.__said.length === 8 && B.w.__said.every(u => u.rate === 0.7), 'Lento: the same scene, slowed down');
B.d.getElementById('dlg-play').click();
ok(B.d.getElementById('dlg-play').textContent === '▶ Ascolta il dialogo' && B.w.__cancels > 0, 'Ferma stops it');
B.w.__said[2].onstart();
ok(!rows(B).some(r => r.classList.contains('is-speaking')), 'and nothing from the stopped reading lights up afterwards');
B.w.__said = [];
rows(B)[3].click();
ok(B.w.__said.length === 1 && B.w.__said[0].text === 'No, grazie. Solo con lo zucchero.' && B.w.__said[0].voice.name === 'Luca', 'tap a line: just that line again, in its speaker\'s voice');

// ---- The text and the English ----
B.d.getElementById('dlg-text').click();
const its = [...B.d.querySelectorAll('.dlg-it')].map(e => e.textContent);
ok(its.length === 8 && its[0] === 'Buongiorno! Cosa prende?' && !B.d.getElementById('dlg-lines').classList.contains('is-veiled'), 'Mostra il testo: the Italian appears');
B.d.getElementById('dlg-en').click();
const first = rows(B)[0], second = rows(B)[1];
ok(first.querySelector('.dlg-en').textContent === 'Good morning! What are you having?' && /Word for word/.test(first.querySelector('.dlg-lit').textContent)
   && /What you take \(formal\)\?/.test(first.querySelector('.dlg-lit').textContent), "Mostra l'inglese: the natural English, and the word for word under it");
ok(second.querySelector('.dlg-en').textContent === 'Good morning. A coffee, please.' && !second.querySelector('.dlg-lit'), '…with no word-for-word line where the English is already word for word');
B.d.getElementById('dlg-text').click();
ok(!B.d.querySelector('.dlg-it') && !B.d.querySelector('.dlg-en') && !B.d.getElementById('dlg-en'), 'hiding the text hides the English with it');

// ---- Capisci? ----
const opt = (qi, k) => B.d.querySelector(`#dlg-quiz .quiz-opt[data-q="${qi}"][data-k="${k}"]`);
opt(0, 0).click();
const q0 = B.d.querySelector('#dlg-quiz .quiz-q[data-q="0"]');
ok(q0.classList.contains('is-right') && /^Esatto!/.test(q0.querySelector('.quiz-fb').textContent) && /«Buongiorno\. Un caffè, per favore\.»/.test(q0.querySelector('.quiz-fb').textContent)
   && /Cliente/.test(q0.querySelector('.quiz-fb').textContent), 'a right answer: Esatto! — with the line that says it, and who says it');
opt(1, 2).click();
const q1 = B.d.querySelector('#dlg-quiz .quiz-q[data-q="1"]');
ok(q1.classList.contains('is-wrong') && /^No — With sugar, no milk\./.test(q1.querySelector('.quiz-fb').textContent) && !!q1.querySelector('.quiz-opt.is-correct'),
   'a wrong one: the right answer, marked, and the line that gives it');
B.d.getElementById('dlg-text').click();
ok(B.d.querySelector('#dlg-quiz .quiz-q[data-q="1"]').classList.contains('is-wrong'), 'showing the text afterwards keeps the answers');
opt(2, 0).click();
ok(B.d.getElementById('dlg-quiz-score').textContent === '2 / 3' && JSON.stringify(progress(B).quiz.bar) === '{"score":2,"total":3}', 'all answered: the score, kept');
B.d.getElementById('dlg-back').click(); open(B, 'bar');
[0, 1, 2].forEach(qi => B.d.querySelector(`#dlg-quiz .quiz-opt[data-q="${qi}"][data-k="0"]`).click());
B.d.getElementById('dlg-back').click(); open(B, 'bar');
[0, 1, 2].forEach(qi => B.d.querySelector(`#dlg-quiz .quiz-opt[data-q="${qi}"][data-k="1"]`).click());
ok(JSON.stringify(progress(B).quiz.bar) === '{"score":3,"total":3}', 'the best score is the one kept');

// ---- Dettato: the scene's lines, in order ----
B.d.getElementById('dlg-dict-btn').click();
ok(view(B) === 'game' && B.ev('direction') === 'listen' && B.ev('deck.map(c => c.key).join()') === [1, 2, 3, 4, 5, 6, 7, 8].map(k => `bar-${k}`).join(),
   'Inizia il dettato: the eight lines, in the scene\'s order, heard and written');
B.d.getElementById('answer').value = 'buongiorno cosa prende';
B.d.getElementById('submit').click();
ok(B.d.getElementById('feedback').classList.contains('correct'), 'written without capitals or punctuation, a line is still right');
B.d.getElementById('submit').click();
B.d.getElementById('answer').value = 'Buongiorno. Un tè, per favore.';
B.d.getElementById('submit').click();
ok(B.d.getElementById('feedback').classList.contains('incorrect') && /Not quite — the line is/.test(B.d.getElementById('feedback').textContent)
   && B.d.getElementById('submit').textContent === 'Riscrivi →', "a slip gets Scrittura's comparison — and the retype");
ok(JSON.parse(B.w.localStorage.getItem('dialoghi-stats-listen-v1:srs') || '{}')['bar-1'], 'lines answered go into Ripasso, like any card');
B.ev('index = deck.length; render();');
B.d.getElementById('play-again').click();
ok(B.ev('deck.map(c => c.key).join()') === [1, 2, 3, 4, 5, 6, 7, 8].map(k => `bar-${k}`).join(), 'Play all again: in the same order');
B.ev('index = deck.length; render();');
B.d.getElementById('back-to-setup').click();
ok(view(B) === 'dialogue' && B.d.querySelector('.dlg-title').textContent === 'Al bar' && /1 of 8/.test(B.d.getElementById('dlg-written').textContent),
   'the round ends back on the scene, with the lines written right so far');
B.d.getElementById('dlg-translate').click();
ok(B.ev('direction') === 'en-it' && B.d.getElementById('prompt').textContent.trim() === 'Good morning! What you take (formal)?'
   && !B.d.getElementById('natural-en').hidden && /Good morning! What are you having\?/.test(B.d.getElementById('natural-en').textContent),
   "Traduci dall'inglese: the word-for-word English (formal marked), the natural English under it");
B.ev('index = deck.length; render();');
B.d.getElementById('back-to-setup').click();
B.d.getElementById('dlg-back').click();
const barCard = B.d.querySelector('.dlg-card[data-dlg="bar"]');
ok(view(B) === 'setup' && barCard.classList.contains('is-heard') && /✓ Ascoltato/.test(barCard.textContent) && /Domande 3\/3/.test(barCard.textContent) && /Dettato 1\/8/.test(barCard.textContent),
   '← Dialoghi: the scene card shows what\'s done');

// ---- Leaving stops the reading; progress syncs ----
open(B, 'mercato');
B.d.getElementById('dlg-play').click();
const mid = B.w.__said.length;
B.d.querySelector('#subject-toggle [data-subject="nouns"]').click();
ok(B.ev('dialogueSpeech') === null && !progress(B).read.mercato && B.w.__said.length === mid, 'leaving mid-scene stops the reading — and an unfinished listen isn\'t Ascoltato');
ok(B.ev("syncedKeys().get('mazzo-dialoghi-v1')") === 'story' && B.ev("storageKeys().includes('mazzo-dialoghi-v1')") && B.ev("syncedKeys().get('dialoghi-stats-listen-v1')") === 'counters',
   'the scenes\' progress syncs (merged like the story\'s) and is in backups; the lines\' stats sync like any section\'s');

// ---- One Italian voice: the second speaker is pitched lower ----
B = boot({ 'flipcards-subject': 'dialoghi' }, fakeSpeech(ONE));
open(B, 'bar');
B.d.getElementById('dlg-play').click();
said = B.w.__said;
ok(said.every(u => u.voice.name === 'Alice (Enhanced)') && said[0].pitch === 1 && said[1].pitch === 0.75, 'one Italian voice (two versions of it): the second speaker is the same voice, pitched lower');

// ---- No Italian voice: the text, and translation instead of dictation ----
B = boot({ 'flipcards-subject': 'dialoghi' });
open(B, 'vicina');
ok(!B.d.getElementById('dlg-play') && B.d.querySelectorAll('.dlg-it').length === 8 && !B.d.getElementById('dlg-dict-btn')
   && B.d.getElementById('dlg-translate').classList.contains('submit'), 'no Italian voice: the text is shown, and the dictation becomes translating from the English');
done();
