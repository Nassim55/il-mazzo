// Ripasso del giorno counts practice done anywhere: a due word answered in any deck is
// rescheduled just as Ripasso would — and a word held twice (a story word that's also a
// noun or an adjective) counts for both.
const { boot, ok, done } = require('./harness');

const stats = {
  'flipcards-subject': 'nouns',
  'sostantivi-stats-v1': JSON.stringify({ casa: { seen: 4, wrong: 2 }, buio: { seen: 4, wrong: 2 } }),
  'verbi-regolari-stats': JSON.stringify({ parlare: { attempts: 6, wrongs: 3 } }),
  'aggettivi-stats-v1': JSON.stringify({ piccolo: { seen: 4, wrong: 2 }, perfetto: { seen: 4, wrong: 2 } }),
  'racconto-stats-v1': JSON.stringify({ buio: { seen: 3, wrong: 2 } })
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
ok(['nouns:casa', 'verbs:parlare', 'adjectives:piccolo', 'nouns:buio', 'story:buio'].every(x => before.includes(x)), `due today: ${before.join(', ')}`);
play('nouns', ['casa']);
ok(!due().includes('nouns:casa') && B.ev("loadSrs('nouns', 'en-it').casa.b") === 2, 'la casa, practised in an ordinary nouns deck: done for today — up a box, as Ripasso would');
play('verbs', ['parlare'], "verbMode = 'conjugations';");
ok(!due().includes('verbs:parlare'), 'parlare, conjugated in an ordinary verbs deck: done too');
play('adjectives', ['piccolo'], "adjMode = 'forms';");
ok(!due().includes('adjectives:piccolo'), 'piccolo, in its four forms: done');
B.ev('showSetup()');
ok(new RegExp(`${due().length} due today`).test(B.d.getElementById('ripasso').textContent.replace(/\s+/g, ' ')) && due().length === before.length - 3,
   `and the strip counts down, ${before.length} to ${due().length}: ${B.d.getElementById('ripasso').textContent.replace(/\s+/g, ' ').trim().slice(0, 60)}`);

// ---- A word held twice ----
play('nouns', ['buio']);
ok(!due().includes('nouns:buio') && !due().includes('story:buio') && B.ev("loadSrs('story', 'en-it').buio.b") === 2,
   'il buio, practised in Sostantivi: done as a noun — and as the story word too');
ok(!B.ev("loadSrs('story', 'en-it').perfetto"), '(perfetto was never added from the story: its story schedule stays empty)');
play('adjectives', ['perfetto'], "adjMode = 'dictionary';");
ok(!B.ev("loadSrs('story', 'en-it').perfetto") && !due().includes('adjectives:perfetto'), 'practising the adjective doesn\'t put the story word on the schedule');

// ---- A wrong answer counts too; "I was right" puts both back ----
B = boot(stats);
B.ev("direction = 'it-en'; stats = loadStats(); selectedNouns = new Set(['buio']); updateReadout();");
B.w.localStorage.setItem('racconto-stats-iten-v1', JSON.stringify({ buio: { seen: 2, wrong: 1 } }));
B.w.localStorage.setItem('sostantivi-stats-iten-v1', JSON.stringify({ buio: { seen: 2, wrong: 1 } }));
B.ev('stats = loadStats();');
B.d.getElementById('start-btn').click();
B.d.getElementById('answer').value = 'the brightness';
B.d.getElementById('submit').click();
const t = B.ev('today()');
ok(B.ev("loadSrs('nouns', 'it-en').buio.d") === t + 1 && B.ev("loadSrs('story', 'it-en').buio.d") === t + 1, 'a wrong answer: both come back tomorrow, as in Ripasso');
const right = B.d.querySelector('.override-btn');
ok(!!right, '(after a wrong Italian → English answer, "I was right" is offered)');
right.click();
ok(B.ev("loadSrs('nouns', 'it-en').buio.b") >= 2 && B.ev("loadSrs('story', 'it-en').buio.b") >= 2 && B.ev("loadSrs('story', 'it-en').buio.d") > t + 1, '"I was right": both put back as correct');

// ---- Each direction keeps its own ----
B = boot(stats);
B.ev("direction = 'it-en'; stats = loadStats();");
play('nouns', ['casa'], "direction = 'it-en'; stats = loadStats();");
ok(due('en-it').includes('nouns:casa'), 'practice Italian → English counts for that direction; the English → Italian schedule is its own');
ok(B.errors.length === 0, 'no errors along the way');
done();
