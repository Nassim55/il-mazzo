// Avverbi e congiunzioni, examples (Nov 2026): every word has an example sentence, shown with the answer — the
// word in bold, the English beneath — and read out after the word, whether the answer was typed or the card turned.
const { boot, ok, done } = require('./harness');
function fakeSpeech(voices) {
  return w => {
    w.__spoken = [];
    w.SpeechSynthesisUtterance = function (text) { this.text = text; };
    w.speechSynthesis = { getVoices: () => voices, cancel() { w.__spoken.push({ text: '(cancel)' }); }, speak(u) { w.__spoken.push({ text: u.text }); }, addEventListener() {} };
  };
}
const B = boot({ 'flipcards-subject': 'avverbi' }, fakeSpeech([{ name: 'Alice', lang: 'it-IT', voiceURI: 'alice', localService: true }]));
const { w, d, ev } = B;
// ---- The data ----
const items = ev('AVV_ITEMS.map(n => ({ key: n.noun, it: n.it, ex: n.example }))');
const wordIn = (s, word) => new RegExp(`(^|[^\\p{L}])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}])`, 'iu').test(s);
const bad = items.filter(n => !Array.isArray(n.ex) || n.ex.length !== 2 || !wordIn(n.ex[0], n.it) || !/[.!?]$/.test(n.ex[0]) || !n.ex[1]);
ok(items.length === 112 && bad.length === 0, `every one of the ${items.length} words has an example, its word in it as written${bad.length ? ' — not: ' + bad.map(n => n.key).join(', ') : ''}`);
ok(new Set(items.map(n => n.ex[0])).size === 112 && new Set(items.map(n => n.ex[1])).size === 112, 'no two sentences the same, in Italian or in English');
// ---- A typed round ----
const after = () => { const s = w.__spoken; const i = s.map(x => x.text).lastIndexOf('(cancel)'); return s.slice(i + 1).map(x => x.text); };
ev(`clearHand(); topicsIn([SUBJECTS.avverbi.themes[0].key]); updateReadout();`);
d.getElementById('start-btn').click();
let card = ev('({ it: deck[index].italian, ex: deck[index].example })');
d.getElementById('answer').value = 'qwerty'; d.getElementById('submit').click();
const exEl = () => d.querySelector('#feedback .feedback-example');
ok(!!exEl() && exEl().querySelector('.ex-it strong').textContent.toLowerCase() === card.it.toLowerCase() && exEl().querySelector('.ex-en').textContent === card.ex[1]
   && exEl().querySelector('.ex-it').textContent === card.ex[0], `a wrong answer shows the example: “${card.ex[0]}” — ${card.ex[1]}`);
ok(JSON.stringify(after()) === JSON.stringify([card.it, card.ex[0]]), `…and reads the word, then the sentence: ${after().join(' → ')}`);
d.getElementById('speak-btn').click();
ok(JSON.stringify(after()) === JSON.stringify([card.it, card.ex[0]]), '🔊 replays both');
d.getElementById('answer').value = card.it; d.getElementById('submit').click();   // retype the word: on to the next card
card = ev('({ it: deck[index].italian, ex: deck[index].example })');
d.getElementById('answer').value = card.it; d.getElementById('submit').click();
ok(!!exEl() && exEl().querySelector('.ex-it').textContent === card.ex[0] && JSON.stringify(after()) === JSON.stringify([card.it, card.ex[0]]),
   `a right answer too: ${card.it} → “${card.ex[0]}”`);
// ---- Turning the card ----
d.getElementById('submit').click();
ev("setAnswerMode('turn')");
card = ev('({ it: deck[index].italian, ex: deck[index].example })');
ev('giraTurn()');
ok(!!exEl() && exEl().querySelector('.ex-it').textContent === card.ex[0] && JSON.stringify(after()) === JSON.stringify([card.it, card.ex[0]]),
   `turned over: the example shown and read after the word (${card.it})`);
ev("setAnswerMode('type')");
// ---- Other sections are as they were ----
ok(ev("speakCard({ italian: 'il pane', example: null })") && JSON.stringify(after()) === JSON.stringify(['il pane']), 'a card with no example: just the word, as before');
ok(B.errors.length === 0, 'no errors');
done();
