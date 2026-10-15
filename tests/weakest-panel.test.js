const { boot, ok, done } = require('./harness');
// Regular-verb history in the verb game's original format. capire 15/20 → 0.68, finire 8/10 → 0.67,
// pulire 3/3 → 0.60, pensare 6/10 → 0.50, vendere 1/2 and ascoltare 1/2 → tie at 0.25 (A–Z: ascoltare first), parlare 0/30 (never wrong)
const hist = { capire: [20, 15], finire: [10, 8], pulire: [3, 3], pensare: [10, 6], vendere: [2, 1], ascoltare: [2, 1], parlare: [30, 0] };
const store = { 'verbi-regolari-stats': JSON.stringify(Object.fromEntries(Object.entries(hist).map(([k, [a, w]]) => [k, { attempts: a, wrongs: w }]))) };
let { w, d, ev, key, errors, warns } = boot(store);
ok(!d.getElementById('weak-panel'), 'noun screen: no weakest box');
d.querySelector('#subject-toggle [data-subject="verbs"]').click();
const side = d.querySelector('.setup-side');
ok(side && side.children[0].classList.contains('endings') && side.children[0].querySelector('.endings-title').textContent === 'Le desinenze' && side.children[1].id === 'weak-panel',
   'regular section: Da ripassare sits directly under Le desinenze');
const rows = () => [...d.querySelectorAll('#weak-panel .weak-row')].map(r => r.querySelector('.weak-it').textContent);
ok(d.querySelector('#weak-panel .endings-title').textContent === 'Da ripassare' && /Your 6 weakest · EN → IT/.test(d.querySelector('#weak-panel .endings-sub').textContent), 'title and "Your 6 weakest · EN → IT"');
ok(JSON.stringify(rows()) === JSON.stringify(['capire', 'finire', 'pulire', 'pensare', 'ascoltare', 'vendere']), `order: ${rows().join(', ')} (never-wrong parlare left out)`);
const first = d.querySelector('#weak-panel .weak-row');
ok(first.querySelector('.weak-en').textContent === 'to understand' && first.querySelector('.weak-stat').textContent.replace(/\s+/g, ' ') === '15/20 err75%' && first.getAttribute('style').includes('--rate: 75%'),
   'row shows meaning, 15/20 err, 75%, and the error-rate bar');
ok(JSON.stringify(ev('weakestNouns(10)').slice(0, 4)) === JSON.stringify(rows().slice(0, 4)), 'matches the Weakest 10 button (beyond the tie)');
// select these
d.getElementById('weak-select').click();
ok(ev('selectedNouns.size') === 6 && rows().every(v => ev(`selectedNouns.has('${v}')`)) && d.querySelectorAll('.verb-chip:not(.unselected)').length === 6, '"select these 6" selects exactly the listed verbs');
// direction switch: IT→EN has its own (empty) history
d.querySelector('#direction-toggle [data-direction="it-en"]').click();
ok(rows().length === 0 && /No mistakes logged yet in this direction/.test(d.getElementById('weak-panel').textContent) && /IT → EN/.test(d.querySelector('#weak-panel .endings-sub').textContent), 'IT→EN: empty state for that direction');
d.querySelector('#direction-toggle [data-direction="en-it"]').click();
ok(rows().length === 6, 'back to EN→IT: list returns');
// play: get studiare wrong twice, then back to setup
d.getElementById('clear-all').click();
ev("selectedNouns = new Set(['studiare']); updateReadout();");
d.getElementById('start-btn').click();
for (const p of ['io', 'tu']) { ev(`index = deck.findIndex(c => c.person === '${p}'); render();`); d.getElementById('answer').value = 'sbagliato'; d.getElementById('submit').click(); }
d.getElementById('change-btn').click();
ok(rows().includes('studiare'), `after a game, studiare (2/2 wrong) appears (${rows().join(', ')})`);
// reset empties it
w.confirm = () => true;
d.getElementById('reset-stats').click();
ok(rows().length === 0 && /No mistakes logged yet\./.test(d.getElementById('weak-panel').textContent), 'reset progress → empty state');
// irregular section has its own box and history
w.localStorage.setItem('verbi-irregolari-stats', JSON.stringify({ venire: { attempts: 6, wrongs: 4 }, essere: { attempts: 9, wrongs: 1 } }));
d.querySelector('#subject-toggle [data-subject="irregular"]').click();
const irrSide = d.querySelector('.setup-side');
ok(irrSide.children[0].classList.contains('irregular-panel') && irrSide.children[1].id === 'weak-panel', 'irregular section: box sits under Gli irregolari');
ok(JSON.stringify(rows()) === JSON.stringify(['venire', 'essere']), `irregular list from its own history: ${rows().join(', ')}`);
ok(errors.length === 0 && warns.length === 0, `no runtime errors or warnings (${errors.join('; ')})`);
done();
