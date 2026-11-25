// Ripasso del giorno counts practice done anywhere: a due word answered in any deck is
// rescheduled just as Ripasso would — and a word held twice (a word marked in a story that's
// also a noun or an adjective: its card keeps the deck's key) counts for both.
const { boot, ok, done } = require('./harness');

const stats = {
  'flipcards-subject': 'nouns',
  'sostantivi-stats-v1': JSON.stringify({ casa: { seen: 4, wrong: 2 }, cestino: { seen: 4, wrong: 2 } }),
  'verbi-regolari-stats': JSON.stringify({ parlare: { attempts: 6, wrongs: 3 } }),
  'aggettivi-stats-v1': JSON.stringify({ piccolo: { seen: 4, wrong: 2 }, perfetto: { seen: 4, wrong: 2 } }),
  'racconti-stats-v1': JSON.stringify({ cestino: { seen: 3, wrong: 2 } }),
  'mazzo-racconti-words-v1': JSON.stringify({ cestino: { ref: 'nouns:cestino', story: 'fontanella', p: 11, f: 'cestino', on: 1, at: 1 } })   // marked in Il treno per Fontanella
};
let B = boot(stats);
const due = (dir = 'en-it') => B.ev(`dueList('${dir}').map(x => x.subj + ':' + x.n.noun)`);
const play = (subj, keys, setup = '') => {
  B.ev(`showSetup(); applySubject('${subj}'); ${setup} showSetup(); selectedNouns = new Set(${JSON.stringify(keys)}); updateReadout();`);
  B.d.getElementById('start-btn').click();
  const n = B.ev('deck.length');
  for (let i = 0; i < n; i++) { B.d.getElementById('answer').value = B.ev('deck[index].italian'); B.d.getElementById('submit').click(); B.d.getElementById('submit').click(); }
};
const before = due();
ok(['nouns:casa', 'verbs:parlare', 'adjectives:piccolo', 'nouns:cestino', 'racconti:cestino'].every(x => before.includes(x)), `due today: ${before.join(', ')}`);
play('nouns', ['casa']);
ok(!due().includes('nouns:casa') && B.ev("loadSrs('nouns', 'en-it').casa.b") === 2, 'la casa, practised in an ordinary nouns deck: done for today — up a box, as Ripasso would');
play('verbs', ['parlare'], "verbMode = 'conjugations';");
ok(!due().includes('verbs:parlare'), 'parlare, conjugated in an ordinary verbs deck: done too');
play('adjectives', ['piccolo'], "adjMode = 'forms';");
ok(!due().includes('adjectives:piccolo'), 'piccolo, in its four forms: done');
B.ev('showSetup()');
ok(new RegExp(`${due().length} due today`).test(B.d.getElementById('todo-items').textContent.replace(/\s+/g, ' ')) && due().length === before.length - 3,
   `and the strip counts down, ${before.length} to ${due().length}: ${B.d.getElementById('todo-items').textContent.replace(/\s+/g, ' ').trim().slice(0, 60)}`);

// ---- A word held twice ----
play('nouns', ['cestino']);
ok(!due().includes('nouns:cestino') && !due().includes('racconti:cestino') && B.ev("loadSrs('racconti', 'en-it').cestino.b") === 2,
   'il cestino, practised in Sostantivi: done as a noun — and as the word you marked in the story too');
ok(!B.ev("loadSrs('racconti', 'en-it').perfetto"), '(perfetto was never marked in a story: it has no story card)');
play('adjectives', ['perfetto'], "adjMode = 'dictionary';");
ok(!B.ev("loadSrs('racconti', 'en-it').perfetto") && !due().includes('adjectives:perfetto'), 'practising the adjective doesn\'t put a story card on the schedule');

// ---- A wrong answer counts too; "I was right" puts both back ----
B = boot(stats);
B.ev("direction = 'it-en'; stats = loadStats(); selectedNouns = new Set(['cestino']); updateReadout();");
B.w.localStorage.setItem('racconti-stats-iten-v1', JSON.stringify({ cestino: { seen: 2, wrong: 1 } }));
B.w.localStorage.setItem('sostantivi-stats-iten-v1', JSON.stringify({ cestino: { seen: 2, wrong: 1 } }));
B.ev('stats = loadStats();');
B.d.getElementById('start-btn').click();
B.d.getElementById('answer').value = 'the brightness';
B.d.getElementById('submit').click();
const t = B.ev('today()');
ok(B.ev("loadSrs('nouns', 'it-en').cestino.d") === t + 1 && B.ev("loadSrs('racconti', 'it-en').cestino.d") === t + 1, 'a wrong answer: both come back tomorrow, as in Ripasso');
const right = B.d.querySelector('.override-btn');
ok(!!right, '(after a wrong Italian → English answer, "I was right" is offered)');
right.click();
ok(B.ev("loadSrs('nouns', 'it-en').cestino.b") >= 2 && B.ev("loadSrs('racconti', 'it-en').cestino.b") >= 2 && B.ev("loadSrs('racconti', 'it-en').cestino.d") > t + 1, '"I was right": both put back as correct');

// ---- Each direction keeps its own ----
B = boot(stats);
B.ev("direction = 'it-en'; stats = loadStats();");
play('nouns', ['casa'], "direction = 'it-en'; stats = loadStats();");
ok(due('en-it').includes('nouns:casa'), 'practice Italian → English counts for that direction; the English → Italian schedule is its own');
ok(B.errors.length === 0, 'no errors along the way');
done();
