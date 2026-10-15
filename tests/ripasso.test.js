// Ripasso del giorno: spaced repetition across sections, with the clock under test control.
const { boot, ok, done } = require('./harness');
const DAY = 86400000;
const T0 = Date.UTC(2026, 9, 16, 9, 0, 0);   // tests run in UTC (CI and local runs)
let clock = T0;
const timeHook = w => { w.Date.now = () => clock; };
const history = {
  'sostantivi-stats-v1': JSON.stringify({ pane: { seen: 6, wrong: 3 }, casa: { seen: 4, wrong: 1 }, libro: { seen: 5, wrong: 0 }, acqua: { seen: 1, wrong: 0 } }),
  'verbi-regolari-stats': JSON.stringify({ capire: { attempts: 4, wrongs: 2 } }),
  'frasi-stats-v1': JSON.stringify({ grazie: { seen: 2, wrong: 1 } }),
  'flipcards-subject': 'nouns'
};
let { w, d, ev, key, errors, warns } = boot(history, timeHook);
const t0 = ev('today()');
const rec = (subj, k, dir = 'en-it') => ev(`loadSrs('${subj}', '${dir}')['${k}']`);
const strip = () => d.getElementById('ripasso').textContent.replace(/\s+/g, ' ').trim();
ok(warns.length === 0 && errors.length === 0, 'loads cleanly');
// ---- Seeding from earlier history ----
ok(rec('nouns', 'pane').b === 1 && rec('nouns', 'pane').d === t0 && rec('nouns', 'casa').d === t0, 'weak words (≥ 25% wrong) come due straight away');
const libro = rec('nouns', 'libro'), acqua = rec('nouns', 'acqua');
ok(libro.b === 4 && libro.d > t0 && libro.d <= t0 + 8 && acqua.b === 3 && acqua.d > t0 && acqua.d <= t0 + 4, 'solid words are spread over the coming days');
ok(/4 due today/.test(strip()) && /2 nouns · 1 regular verb · 1 phrase/.test(strip()), `strip: "${strip()}"`);
// ---- The schedule rules ----
ev("srsAnswer('nouns', 'en-it', 'gatto', true)");
ok(rec('nouns', 'gatto').b === 1 && rec('nouns', 'gatto').d === t0 + 1, 'a first correct answer: box 1, back tomorrow');
ev("srsAnswer('nouns', 'en-it', 'gatto', true)");
ok(rec('nouns', 'gatto').b === 1, 'a second correct answer the same day does not move it again');
clock += DAY; ev("srsAnswer('nouns', 'en-it', 'gatto', true)");
ok(rec('nouns', 'gatto').b === 2 && rec('nouns', 'gatto').d === t0 + 1 + 2, 'next day: box 2, two days out');
ev("srsAnswer('nouns', 'en-it', 'gatto', false)");
ok(rec('nouns', 'gatto').b === 1 && rec('nouns', 'gatto').d === t0 + 2, 'a wrong answer: back to box 1, due tomorrow');
for (let i = 0; i < 9; i++) { clock += DAY; ev("srsAnswer('nouns', 'en-it', 'cane', true)"); }
ok(rec('nouns', 'cane').b === 7 && rec('nouns', 'cane').d === ev('today()') + 64, 'intervals cap at 64 days (box 7)');
clock = T0;
// ---- A mixed review ----
ev("selectedNouns = new Set(['pane']); updateReadout();");
d.getElementById('ripasso-start').click();
ok(ev('reviewMode') && d.getElementById('app-title').textContent === 'Ripasso del giorno' && ev('deck.length') === 4, 'Start: a review of the 4 due cards');
ok(new Set(ev('deck.map(c => c.subject)')).size === 3 && ev("deck.every(c => c.key.startsWith(c.subject + ':'))"), 'cards from three sections, each keyed by section');
ok(d.querySelector('.direction-toggle').hidden && !d.getElementById('game-focus-btn') && d.getElementById('change-btn').textContent === '← Back to setup', 'direction and Focus are hidden; "← Back to setup"');
const verbCard = ev("deck.find(c => c.subject === 'verbs')");
ok(!!verbCard.person && !!verbCard.pron, `verbs appear as a conjugation (${verbCard.pronounLabel} ${verbCard.italian})`);
let rightAll = true; const sections = [];
for (let i = 0; i < 4; i++) {
  ev(`index = ${i}; render();`);
  const c = ev(`deck[${i}]`);
  sections.push(d.getElementById('card-section').textContent);
  d.getElementById('answer').value = c.person ? `${c.pronounLabel.split(' / ')[0]} ${c.italian}` : c.italian;
  d.getElementById('submit').click();
  if (!d.getElementById('feedback').className.includes(' correct')) rightAll = false;
}
ok(rightAll, 'each card is checked by its own section\'s rules (nouns with articles, verbs with pronouns, phrases)');
ok(sections.includes('Sostantivi') && sections.includes('Verbi Regolari') && sections.includes('Frasi'), `each card shows its section (${[...new Set(sections)].join(', ')})`);
ok(JSON.parse(w.localStorage.getItem('sostantivi-stats-v1')).pane.seen === 7 && JSON.parse(w.localStorage.getItem('verbi-regolari-stats')).capire.attempts === 5 && JSON.parse(w.localStorage.getItem('frasi-stats-v1')).grazie.seen === 3, 'answers are saved to each section\'s own progress');
ok(rec('nouns', 'pane').b === 2 && rec('nouns', 'pane').d === t0 + 2 && rec('verbs', 'capire').d === t0 + 2, 'and each is rescheduled: box 2, two days out');
ev('index = deck.length; render();');
ok(/FINE DEL RIPASSO/.test(d.querySelector('.badge').textContent) && /Fatto!/.test(d.querySelector('.msg').textContent) && d.getElementById('back-to-setup').textContent === '← Back to setup', 'completion: "Fatto!"');
d.getElementById('back-to-setup').click();
ok(ev('subject') === 'nouns' && !ev('reviewMode') && ev('selectedNouns.size') === 1 && ev("selectedNouns.has('pane')") && d.getElementById('app-title').textContent === 'Sostantivi', 'back to Sostantivi, with its selection intact');
ok(/All done for today ✓/.test(strip()), `strip afterwards: "${strip()}"`);
// ---- Two days later ----
clock = T0 + 2 * DAY;
d.querySelector('#subject-toggle [data-subject="verbs"]').click(); d.querySelector('#subject-toggle [data-subject="nouns"]').click();
ok(/due today/.test(strip()) && ev("dueList('en-it').some(x => x.n.noun === 'pane')"), 'two days later they are due again');
// ---- Wrong answers, and practising missed cards inside a review ----
d.getElementById('ripasso-start').click();
const n0 = ev('deck.length');
for (let i = 0; i < n0; i++) { ev(`index = ${i}; render();`); d.getElementById('answer').value = 'sbagliato'; d.getElementById('submit').click(); }
const anyKey = ev('deck[0].noun'), anySubj = ev('deck[0].subject');
ok(rec(anySubj, anyKey).b === 1 && rec(anySubj, anyKey).d === ev('today()') + 1, 'a wrong answer in the review: due tomorrow');
ev('index = deck.length; render();');
ok(!!d.getElementById('practise-missed') && /back tomorrow/.test(d.querySelector('.msg').textContent), 'missed cards can be practised again straight away');
d.getElementById('practise-missed').click();
ok(ev('reviewMode') && ev('deck.length') === n0 && ev('sessionPool.length') >= n0, 'practising the missed cards stays inside the review');
d.getElementById('change-btn').click();
ok(ev('subject') === 'nouns' && !ev('reviewMode'), 'and "← Back to setup" returns to the section');
// ---- Other directions ----
d.querySelector('#ripasso [data-ripasso-dir="it-en"]').click();
ok(w.localStorage.getItem('mazzo-ripasso-dir') === 'it-en' && /come back here/.test(strip()), 'Italian → English has its own schedule (nothing yet)');
d.querySelector('#ripasso [data-ripasso-dir="en-it"]').click();
// ---- Backups and reset ----
const keys = Object.keys(ev('buildBackup()').data);
ok(keys.includes('sostantivi-stats-v1:srs') && keys.includes('verbi-regolari-stats:srs') && keys.includes('mazzo-ripasso-dir'), 'backups include the schedules');
w.confirm = () => true;
d.getElementById('reset-stats').click();
ok(w.localStorage.getItem('sostantivi-stats-v1:srs') === null && w.localStorage.getItem('verbi-regolari-stats:srs') !== null, "resetting a section's progress clears its schedule only");
ok(errors.length === 0, `no runtime errors ${errors.join('; ')}`);
// ---- Listening review, with a stand-in Italian voice ----
clock = T0;
const spoken = [];
const L = boot({ 'sostantivi-stats-listen-v1': JSON.stringify({ pane: { seen: 2, wrong: 2 } }), 'mazzo-ripasso-dir': 'listen' }, win => {
  timeHook(win);
  win.SpeechSynthesisUtterance = function (t) { this.text = t; };
  win.speechSynthesis = { getVoices: () => [{ name: 'Alice', lang: 'it-IT', voiceURI: 'alice', localService: true }], cancel() {}, speak(u) { spoken.push(u.text); }, addEventListener() {} };
});
ok(/1 due today/.test(L.d.getElementById('ripasso').textContent), 'a Listening review counts listening history');
L.d.getElementById('ripasso-start').click();
ok(L.ev('direction') === 'listen' && spoken.includes('il pane') && !!L.d.getElementById('listen-btn'), 'it speaks the Italian, as Listening does');
L.d.getElementById('answer').value = 'il pane'; L.d.getElementById('submit').click();
ok(JSON.parse(L.w.localStorage.getItem('sostantivi-stats-listen-v1:srs')).pane.b === 2 && L.errors.length === 0, 'and reschedules it in the listening schedule');
done();
