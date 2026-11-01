// The infinitive first: in a conjugation round each verb starts with its infinitive —
// typed right before its forms begin, counting for nothing — and then stays on the card
// above each form until the next verb. On unless "Prima l'infinito" is unticked.
const { boot, ok, done } = require('./harness');

const on = w => { w.MAZZO_INFINITIVE_FIRST = true; };   // the real default (the harness turns it off for other tests)
const deal = (subj, keys, extra = '') => {
  const B = boot({ 'flipcards-subject': subj }, on);
  B.ev(`selectedNouns = new Set(${JSON.stringify(keys)}); ${extra} updateReadout();`);
  B.d.getElementById('start-btn').click();
  return B;
};
const el = (B, id) => B.d.getElementById(id);
const txt = (B, id) => el(B, id).textContent.replace(/\s+/g, ' ').trim();
const type = (B, s) => { el(B, 'answer').value = s; el(B, 'submit').click(); };
const onScreen = B => B.ev('currentCard()');

// ---- The setting ----
let B = boot({ 'flipcards-subject': 'verbs' }, on);
const box = el(B, 'inf-first');
ok(box && box.checked && /Prima l'infinito/.test(box.closest('label').textContent), "Prima l'infinito sits with the persons, ticked from the start");
box.checked = false; box.dispatchEvent(new B.w.Event('change'));
ok(JSON.parse(B.w.localStorage.getItem('mazzo-verb-persons-v1')).infinitiveFirst === false, 'unticking it is remembered (and synced, with the persons)');

// ---- A verb begins with its infinitive ----
B = deal('verbs', ['parlare']);
const first = onScreen(B);
ok(first.gate && first.italian === 'parlare' && txt(B, 'prompt') === B.ev("verbData.find(v => v.it === 'parlare').en.replace(/ \\/ /g, '\\u00a0/ ')").replace(/\u00a0/g, ' ').trim()
   && txt(B, 'pronoun-hint') === "l'infinito" && /infinitive/.test(el(B, 'answer').placeholder) && B.ev('index') === 0,
   'a conjugation round opens on the verb\'s infinitive: its meaning, "l\'infinito", the box asking for the infinitive');
type(B, 'parlare');
ok(el(B, 'feedback').classList.contains('correct') && /The infinitive doesn't count towards your score — now its forms, io to loro/.test(txt(B, 'feedback'))
   && B.ev('score') === 0 && JSON.stringify(B.ev('stats')) === '{}' && B.ev('roundMissed.size') === 0, 'right: it says so — and counts for nothing (no score, no record)');
el(B, 'submit').click();
ok(!onScreen(B).gate && onScreen(B).person === 'io' && B.ev('index') === 0 && B.d.querySelector('#verb-meta .meta-inf') && B.d.querySelector('#verb-meta .meta-inf').textContent === 'parlare',
   'then its forms, from io — with the infinitive kept above each one');
for (let k = 0; k < 6; k++) { const c = onScreen(B); type(B, c.italian); el(B, 'submit').click(); }
ok(B.ev('score') === 6 && B.d.querySelector('.container').dataset.view === 'complete', 'six forms, six points: the round is the forms alone');

// ---- From one verb to the next ----
B = deal('verbs', ['parlare', 'vedere']);
const v1 = onScreen(B).italian;
type(B, v1); el(B, 'submit').click();
for (let k = 0; k < 6; k++) {
  ok(k > 0 || txt(B, 'verb-meta').startsWith(v1), `(${v1}, pinned)`);
  const c = onScreen(B); type(B, c.italian); el(B, 'submit').click();
}
const next = onScreen(B);
ok(next.gate && next.italian !== v1 && B.ev('index') === 6 && el(B, 'verb-meta').style.display === 'none', 'after the last form, the next verb\'s infinitive');

// ---- A miss, or a skip, still asks for it — and still counts for nothing ----
B = deal('verbs', ['vedere']);
type(B, 'vedare');
ok(el(B, 'feedback').classList.contains('incorrect') && /Not quite — the infinitive is vedere/.test(txt(B, 'feedback')) && el(B, 'submit').textContent === 'Riscrivi →',
   'a slip shows the infinitive, and asks for it to be typed');
type(B, 'vedere');
ok(onScreen(B).person === 'io' && B.ev('index') === 0 && B.ev('score') === 0 && JSON.stringify(B.ev('stats')) === '{}' && B.ev('roundMissed.size') === 0,
   '…typed right, the forms begin — nothing recorded, nothing in the missed list');
B = deal('verbs', ['vedere']);
el(B, 'skip-btn').click();
ok(/Skipped — the infinitive is vedere/.test(txt(B, 'feedback')) && el(B, 'submit').textContent === 'Riscrivi →' && JSON.stringify(B.ev('stats')) === '{}', 'Salta: shown, then typed — still not counted');

// ---- Rounds, directions, modes, sections ----
B = deal('verbs', ['parlare']);
type(B, 'parlare'); el(B, 'submit').click();
for (let k = 0; k < 6; k++) { const c = onScreen(B); type(B, c.italian); el(B, 'submit').click(); }
el(B, 'play-again').click();
ok(onScreen(B).gate, 'Play all again: the infinitive comes first again');
B = deal('verbs', ['parlare'], "direction = 'listen';");
ok(onScreen(B).gate, 'Listening too: hear the infinitive, type it');
B = deal('verbs', ['parlare'], "direction = 'it-en';");
ok(!onScreen(B).gate && onScreen(B).person, 'Italian → English: straight to the forms (the infinitive would give the meaning away)');
B = deal('verbs', ['parlare'], "verbMode = 'infinitives';");
ok(!onScreen(B).gate && B.ev('deck.length') === 1, 'infinitive rounds are unchanged');
B = deal('irregular', ['essere']);
ok(onScreen(B).gate && onScreen(B).italian === 'essere', 'the irregular verbs start with their infinitive too');
B = boot({ 'flipcards-subject': 'verbs', 'mazzo-verb-persons-v1': JSON.stringify({ infinitiveFirst: false }) }, on);
B.ev("selectedNouns = new Set(['parlare']); updateReadout();"); el(B, 'start-btn').click();
ok(!onScreen(B).gate && onScreen(B).person === 'io', "Prima l'infinito unticked: straight to the forms");
ok(B.ev("wantsInfinitive({ noun: 'parlare', person: 'io', subject: 'verbs' })") === false, 'not in Ripasso\'s mixed rounds, where each verb comes as a single form');
ok(B.errors.length === 0, 'no errors along the way');
done();
