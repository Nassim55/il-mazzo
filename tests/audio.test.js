const { boot, ok, done } = require('./harness');
// A stand-in speech engine: a voice list, and a record of everything "spoken"
function fakeSpeech(voices) {
  return w => {
    w.__spoken = [];
    w.SpeechSynthesisUtterance = function (text) { this.text = text; };
    w.speechSynthesis = { getVoices: () => voices, cancel() {}, speak(u) { w.__spoken.push({ text: u.text, voice: u.voice && u.voice.name, rate: u.rate, lang: u.lang }); }, addEventListener() {} };
  };
}
const VOICES = [
  { name: 'Samantha', lang: 'en-US', voiceURI: 'sam', localService: true },
  { name: 'Alice', lang: 'it-IT', voiceURI: 'alice', localService: true },
  { name: 'Federica (Enhanced)', lang: 'it-IT', voiceURI: 'federica-enh', localService: true }
];
let { w, d, ev, key, errors, warns } = boot({}, fakeSpeech(VOICES));
const spoken = () => w.__spoken.map(s => s.text);
const last = () => w.__spoken[w.__spoken.length - 1];
ok(warns.length === 0 && errors.length === 0, 'loads cleanly with speech available');
ok(ev('chosenVoice().name') === 'Federica (Enhanced)', 'picks the best Italian voice (Enhanced over standard, never the English one)');
const opts = [...d.querySelectorAll('#audio-voice option')].map(o => o.textContent);
ok(JSON.stringify(opts) === JSON.stringify(['Alice', 'Federica (Enhanced)']) && d.getElementById('audio-auto').checked, `voice settings list only Italian voices (${opts.join(', ')}); read-aloud on by default`);
d.getElementById('audio-test').click();
ok(last().text === 'Ciao! Questa è la mia voce.' && last().voice === 'Federica (Enhanced)' && last().lang === 'it-IT', '▶ test speaks in the chosen Italian voice');
// ---- Nouns, EN→IT: no 🔊 on the card before answering (it would give the answer away) ----
ev("selectedNouns = new Set(['pane', 'zaino']); updateReadout();");
d.getElementById('start-btn').click();
ev("index = deck.findIndex(c => c.noun === 'pane'); render();");
ok(d.getElementById('card-speak').hidden && w.__spoken.length === 1, 'EN→IT: no 🔊 on the card, nothing spoken before you answer');
d.getElementById('answer').value = 'il pane'; d.getElementById('submit').click();
ok(last().text === 'il pane' && !!d.getElementById('speak-btn'), 'after answering: "il pane" is read aloud, with a 🔊 to replay');
const n = w.__spoken.length; d.getElementById('speak-btn').click();
ok(w.__spoken.length === n + 1 && last().text === 'il pane', '🔊 replays it');
ev("index = deck.findIndex(c => c.noun === 'zaino'); render();");
d.getElementById('answer').value = 'il zaino'; d.getElementById('submit').click();
ok(last().text === 'lo zaino', 'a wrong answer reads the right one: "lo zaino"');
// ---- Read-aloud off: silent, but 🔊 still works ----
d.getElementById('change-btn').click();
d.getElementById('audio-auto').checked = false; d.getElementById('audio-auto').dispatchEvent(new w.Event('change'));
ok(JSON.parse(w.localStorage.getItem('mazzo-audio-v1')).auto === false, 'turning read-aloud off is remembered');
d.getElementById('start-btn').click();
const before = w.__spoken.length;
d.getElementById('answer').value = 'x'; d.getElementById('submit').click();
ok(w.__spoken.length === before && !!d.getElementById('speak-btn'), 'with read-aloud off nothing is spoken automatically, but 🔊 is there');
d.getElementById('change-btn').click();
d.getElementById('audio-auto').checked = true; d.getElementById('audio-auto').dispatchEvent(new w.Event('change'));
// ---- Speed and voice choice ----
const rate = d.getElementById('audio-rate'); rate.value = '0.7'; rate.dispatchEvent(new w.Event('change'));
ok(last().rate === 0.7 && ev('audioPrefs.rate') === 0.7, 'slow speed is used and remembered');
const vsel = d.getElementById('audio-voice'); vsel.value = 'alice'; vsel.dispatchEvent(new w.Event('change'));
ok(last().voice === 'Alice' && ev('chosenVoice().name') === 'Alice', 'choosing another Italian voice switches to it');
// ---- Verbs: conjugations are spoken with their pronoun ----
d.querySelector('#subject-toggle [data-subject="verbs"]').click();
ev("selectedNouns = new Set(['capire']); updateReadout(); verbMode = 'conjugations';");
d.getElementById('start-btn').click();
ev("index = deck.findIndex(c => c.person === 'lui'); render();");
d.getElementById('answer').value = 'capisce'; d.getElementById('submit').click();
ok(last().text === 'lui capisce', 'verbs: "lui capisce" — the form with its pronoun');
// ---- IT→EN: a 🔊 on the card to hear the prompt ----
d.querySelector('.direction-toggle [data-dir="it-en"]').click();
ev("index = deck.findIndex(c => c.person === 'noi'); render();");
ok(!d.getElementById('card-speak').hidden, 'IT→EN: 🔊 on the card');
d.getElementById('card-speak').click();
ok(last().text === 'noi capiamo', 'it plays the Italian prompt before you answer');
// ---- Listening ----
d.querySelector('.direction-toggle [data-dir="listen"]').click();
ok(ev('direction') === 'listen' && d.querySelector('.direction-toggle [data-dir="listen"]').classList.contains('active'), 'in-game toggle: 🔊 Listen');
const c0 = ev('deck[index]');
ok(last().text === `${c0.pronounLabel.split(' / ')[0]} ${c0.italian}` && !!d.getElementById('listen-btn') && !d.getElementById('prompt').textContent.includes(c0.italian), 'listening: the card speaks the Italian and shows no text');
ok(d.getElementById('pronoun-hint').textContent === 'type what you hear' && d.getElementById('verb-meta').style.display === 'none', 'no meaning or person shown — just "type what you hear"');
const k = w.__spoken.length; d.getElementById('listen-btn').click();
ok(w.__spoken.length === k + 1, '"ascolta di nuovo" plays it again');
d.getElementById('answer').value = c0.italian; d.getElementById('submit').click();
ok(d.getElementById('feedback').className.includes('correct') && d.querySelector('.fb-meaning').textContent === c0.english, `typing what you heard is marked right, and the meaning is shown (${c0.english})`);
ok(JSON.parse(w.localStorage.getItem('verbi-regolari-stats-listen')).capire.attempts === 1, 'listening keeps its own progress');
key(d.body, 'Enter');
ok(w.__spoken.length >= k + 3, 'moving on speaks the next card');
d.getElementById('change-btn').click();
ok(/🔊 Listening/.test(d.getElementById('setup-meta').textContent) && /🔊 Listening/.test(d.querySelector('#weak-panel .endings-sub').textContent), 'setup labels say Listening');
ok(d.querySelector('#direction-toggle [data-direction="listen"]').classList.contains('active'), 'the setup direction toggle has Listening too');
// ---- Nouns & phrases in listening ----
d.querySelector('#subject-toggle [data-subject="phrases"]').click();
ev("selectedNouns = new Set(['mi-chiamo']); updateReadout();");
d.getElementById('start-btn').click();
d.querySelector('.direction-toggle [data-dir="listen"]').click();
ok(last().text === 'Mi chiamo', 'phrases: "Mi chiamo…" is spoken without the ellipsis');
d.getElementById('answer').value = 'mi chiamo'; d.getElementById('submit').click();
ok(d.getElementById('feedback').className.includes('correct'), 'and typing it is right');
ok(Object.keys(ev('buildBackup()').data).includes('mazzo-audio-v1'), 'voice settings are included in backups');
ok(errors.length === 0, `no runtime errors ${errors.join('; ')}`);
// ---- No Italian voice: helpful message, nothing breaks ----
const r = boot({}, fakeSpeech([{ name: 'Samantha', lang: 'en-US', voiceURI: 'sam' }]));
ok(/No Italian voice found/.test(r.d.getElementById('audio-row').textContent) && /ⓘ next to System voice/.test(r.d.getElementById('audio-row').textContent), 'no Italian voice: the settings row explains how to add one');
r.ev("selectedNouns = new Set(['pane']); updateReadout();"); r.d.getElementById('start-btn').click();
r.d.querySelector('.direction-toggle [data-dir="listen"]').click();
ok(/no Italian voice found/.test(r.d.getElementById('pronoun-hint').textContent), 'listening without a voice says so on the card');
r.d.getElementById('answer').value = 'il pane'; r.d.getElementById('submit').click();
ok(!r.d.getElementById('speak-btn') && r.errors.length === 0, 'no 🔊 buttons and no errors without a voice');
// ---- No speech support at all ----
const z = boot();
ok(/isn't available in this browser/.test(z.d.getElementById('audio-row').textContent) && z.errors.length === 0, 'no speech support: one quiet line, no errors');
done();
