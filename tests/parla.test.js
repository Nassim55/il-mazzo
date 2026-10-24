// Parla: say the answer. A stand-in recogniser replaces the browser's (there is no
// microphone here): it records how it was set up and lets the test deliver what was "heard".
const { boot, ok, done } = require('./harness');

let recs = [];
const withMic = w => {
  w.SpeechRecognition = class {
    constructor() { recs.push(this); this.started = false; this.aborted = false; }
    start() { this.started = true; }
    stop() { if (this.onend) this.onend(); }
    abort() { this.aborted = true; }
  };
  w.cancelledSpeech = 0;
  w.speechSynthesis = { speaking: true, cancel() { w.cancelledSpeech++; this.speaking = false; }, speak() {}, getVoices() { return []; }, addEventListener() {} };
  w.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
};
const last = () => recs[recs.length - 1];
const say = (alts, final = true) => last().onresult({ results: [Object.assign(alts.map(t => ({ transcript: t })), { isFinal: final })] });
const round = (subj, keys, dir = 'en-it', mic = true) => {
  recs = [];
  const B = boot({ 'flipcards-subject': subj }, mic ? withMic : null);
  B.ev(`direction = ${JSON.stringify(dir)}; selectedNouns = new Set(${JSON.stringify(keys)}); updateReadout();`);
  B.d.getElementById('start-btn').click();
  B.flush = () => new Promise(r => B.w.setTimeout(r, 5));   // the button settles just after a card is drawn
  return B;
};

(async () => {
  // ---- Only where the browser can listen ----
  let B = round('nouns', ['casa'], 'en-it', false);
  await B.flush();
  ok(B.d.getElementById('mic-btn').hidden, 'no speech recognition in the browser (Firefox, say): no Parla button');

  // ---- Saying it right ----
  B = round('nouns', ['casa', 'pane']);
  await B.flush();
  const { d, ev } = B, mic = () => d.getElementById('mic-btn');
  ok(!mic().hidden && !!mic().querySelector('svg.mic-icon') && /^Parla/.test(mic().getAttribute('aria-label')) && mic().parentElement.id === 'answer-wrap'
     && mic().previousElementSibling.id === 'answer' && d.getElementById('answer-wrap').classList.contains('has-mic'), 'on an English card, a microphone inside the answer box (at its right edge)');
  ok(!d.getElementById('mic-help').hidden && /⇧ Enter/.test(d.getElementById('mic-help').textContent), 'and the help line under the card says so: ⇧ Enter or the microphone to say it');
  const c0 = ev('deck[0]'), s0 = ev(`JSON.stringify(stats[${JSON.stringify(c0.noun)}] || null)`);
  mic().click();
  ok(last().started && last().lang === 'it-IT' && last().maxAlternatives === 5 && last().interimResults === true && mic().classList.contains('listening') && mic().getAttribute('aria-pressed') === 'true'
     && /Listening — say it in Italian/.test(d.getElementById('speak-hint').textContent), 'pressed: it listens in Italian, for up to five guesses, showing words as they come ("Listening — say it in Italian")');
  ok(B.w.cancelledSpeech === 1, 'and the app stops speaking first, so it never hears itself');
  say(['la ca'], false);
  ok(d.getElementById('answer').value === 'la ca' && d.getElementById('answer').classList.contains('interim'), 'words appear in the box as you speak');
  say(['la cosa', c0.italian.toUpperCase()]);
  ok(d.getElementById('feedback').classList.contains('correct') && /Said aloud/.test(d.getElementById('feedback').textContent)
     && ev(`JSON.stringify(stats[${JSON.stringify(c0.noun)}])`) === '{"seen":1,"wrong":0}' && s0 === 'null', 'any of its guesses right (checked as leniently as typing): a right answer, marked Said aloud');
  await B.flush();
  ok(mic().hidden, 'once the answer is out, there is nothing to say: the button steps aside');

  // ---- A mishearing marks nothing ----
  d.getElementById('submit').click();   // Avanti
  await B.flush();
  const c1 = ev('deck[1]'), st1 = ev(`JSON.stringify(stats[${JSON.stringify(c1.noun)}] || null)`);
  ok(!mic().hidden, 'the next card offers it again');
  mic().click();
  say(['qualcosa', 'qualche cosa']);
  ok(!ev('answered') && d.getElementById('feedback').classList.contains('hidden') && d.getElementById('answer').value === 'qualcosa'
     && /Heard “qualcosa” — say it again, fix it, or press Controlla/.test(d.getElementById('speak-hint').textContent) && ev(`JSON.stringify(stats[${JSON.stringify(c1.noun)}] || null)`) === st1,
     'no guess right: nothing is marked — what was heard stays in the box, to say again, fix, or check');
  d.getElementById('submit').click();
  ok(d.getElementById('submit').textContent === 'Riscrivi →' && ev(`stats[${JSON.stringify(c1.noun)}].wrong`) === 1, 'checked by choice, it counts like any answer (and asks for the retype)');
  await B.flush();
  ok(!mic().hidden, 'the retype can be said too');
  mic().click();
  say([c1.italian]);
  ok(ev('index') === 2 && ev(`stats[${JSON.stringify(c1.noun)}].wrong`) === 1, 'saying it right moves on — the retype still changes nothing');

  // ---- ⇧ Enter: say it without leaving the keyboard ----
  B = round('nouns', ['casa']);
  await B.flush();
  const shiftEnter = () => B.d.getElementById('answer').dispatchEvent(new B.w.KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true, cancelable: true }));
  shiftEnter();
  ok(recs.length === 1 && last().started && B.d.getElementById('mic-btn').classList.contains('listening') && !B.ev('answered'), '⇧ Enter starts listening (and checks nothing)');
  shiftEnter();
  ok(last().aborted && !B.d.getElementById('mic-btn').classList.contains('listening'), '⇧ Enter again stops');
  B.d.getElementById('answer').dispatchEvent(new B.w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  ok(recs.length === 1 && B.d.getElementById('answer').placeholder === 'type your answer first…', 'plain Enter is still Enter: on an empty box it asks for an answer');

  // ---- Errors ----
  B = round('nouns', ['casa', 'pane']);
  await B.flush();
  B.d.getElementById('mic-btn').click();
  last().onerror({ error: 'no-speech' });
  ok(/Didn't catch anything/.test(B.d.getElementById('speak-hint').textContent) && !B.d.getElementById('mic-btn').hidden, "silence: Didn't catch anything — try again");
  B.d.getElementById('mic-btn').click();
  last().onerror({ error: 'not-allowed' });
  await B.flush();
  ok(/microphone is blocked/.test(B.d.getElementById('speak-hint').textContent) && B.d.getElementById('mic-btn').hidden, 'a blocked microphone: says so, and the button goes for the session');

  // ---- Directions, shadowing, and listening stopped when it should be ----
  B = round('nouns', ['casa'], 'it-en');
  await B.flush();
  ok(B.d.getElementById('mic-btn').hidden && B.d.getElementById('mic-help').hidden, 'Italian → English: the answer is English, so no Parla (and no mention of it)');
  B = round('sentences', ['il-cane-beve-l-acqua'], 'listen');
  await B.flush();
  ok(!B.d.getElementById('mic-btn').hidden, 'Listen: hear it, then say it back — shadowing');
  B.d.getElementById('mic-btn').click();
  say(["il cane beve l'acqua"]);
  ok(B.d.getElementById('feedback').classList.contains('correct'), '…a whole sentence, no capital or full stop needed');
  B = round('nouns', ['casa', 'pane']);
  await B.flush();
  B.d.getElementById('mic-btn').click();
  const r1 = last();
  B.d.getElementById('mic-btn').click();
  ok(r1.aborted && !B.d.getElementById('mic-btn').classList.contains('listening') && B.d.getElementById('speak-hint').textContent === '', 'pressed again while listening: it stops');
  B.d.getElementById('mic-btn').click();
  const r2 = last();
  B.d.getElementById('answer').value = 'xyz'; B.d.getElementById('skip-btn').click();
  B.d.getElementById('answer').value = B.ev('deck[0].italian'); B.d.getElementById('submit').click();
  ok(r2.aborted, 'a new card stops any listening');
  B = round('prepositions', ['parlo-del-libro']);
  await B.flush();
  B.d.getElementById('mic-btn').click();
  const r3 = last();
  B.d.getElementById('chart-btn').click();
  ok(r3.aborted, 'so does opening the chart');
  done();
})();
