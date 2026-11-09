// Da ripassare — the box of your weakest items under a section's chart. The word sections
// (nouns, both verb sections, adjectives) have La mappa instead, whose panel does this job;
// the phrase sections keep the box.
const { boot, ok, done } = require('./harness');
// Frasi history. Smoothed error rates: ciao 15/20 → 0.68, buongiorno 8/10 → 0.67, buonasera 3/3 → 0.60,
// buonanotte 6/10 → 0.50, salve 1/2 and arrivederci 1/2 → tie at 0.25 (A–Z: arrivederci first), a-presto 0/30 (never wrong)
const hist = { ciao: [20, 15], buongiorno: [10, 8], buonasera: [3, 3], buonanotte: [10, 6], salve: [2, 1], arrivederci: [2, 1], 'a-presto': [30, 0] };
const store = { 'frasi-stats-v1': JSON.stringify(Object.fromEntries(Object.entries(hist).map(([k, [s, w]]) => [k, { seen: s, wrong: w }]))) };
let { w, d, ev, errors, warns } = boot(store);
for (const s of ['nouns', 'verbs', 'irregular', 'adjectives']) {
  d.querySelector(`#subject-toggle [data-subject="${s}"]`).click();
  ok(!d.getElementById('weak-panel') && !d.querySelector('.setup-side') && d.getElementById('map-panel'), `${s}: no box — La mappa's panel instead`);
}
d.querySelector('#subject-toggle [data-subject="phrases"]').click();
const side = d.querySelector('.setup-side');
ok(side && side.children[0].classList.contains('endings') && side.children[1].id === 'weak-panel', 'Frasi: Da ripassare sits directly under its chart');
const rows = () => [...d.querySelectorAll('#weak-panel .weak-row')].map(r => r.querySelector('.weak-it').textContent);
const keys = () => [...d.querySelectorAll('#weak-panel .weak-row')].map(r => r.dataset.noun || r.getAttribute('data-noun'));
ok(d.querySelector('#weak-panel .endings-title').textContent === 'Da ripassare' && /Your 6 weakest · EN → IT/.test(d.querySelector('#weak-panel .endings-sub').textContent), 'title and "Your 6 weakest · EN → IT"');
const want = ev('weakestNouns(10)').slice(0, 6);   // the Weakest pick fills up to 10; the ones with mistakes come first
const itOf = k => ev(`PHRASE_ITEMS.find(n => n.noun === ${JSON.stringify(k)}).display || PHRASE_ITEMS.find(n => n.noun === ${JSON.stringify(k)}).it || ${JSON.stringify(k)}`);
ok(want.length === 6 && !want.includes('a-presto') && rows().length === 6, `the six with mistakes, the never-wrong left out (${want.join(', ')})`);
const ciao = [...d.querySelectorAll('#weak-panel .weak-row')].find(r => r.querySelector('.weak-en').textContent === ev("PHRASE_ITEMS.find(n => n.noun === 'ciao').en"));
ok(ciao && ciao.querySelector('.weak-stat').textContent.replace(/\s+/g, ' ') === '15/20 err75%' && ciao.getAttribute('style').includes('--rate: 75%'),
   'a row shows the meaning, 15/20 err, 75%, and the error-rate bar');
d.getElementById('weak-select').click();
ok(ev('selectedNouns.size') === 6 && want.every(v => ev(`selectedNouns.has(${JSON.stringify(v)})`)) && d.querySelectorAll('.verb-chip:not(.unselected)').length === 6, '"select these 6" selects exactly the listed phrases');
// Italian → English has its own (empty) history
ev("direction = 'it-en'; stats = loadStats(); renderWeakPanel();");
ok(rows().length === 0 && /No mistakes logged yet in this direction/.test(d.getElementById('weak-panel').textContent) && /IT → EN/.test(d.querySelector('#weak-panel .endings-sub').textContent), 'IT→EN: empty state for that direction');
ev("direction = 'en-it'; stats = loadStats(); renderWeakPanel();");
ok(rows().length === 6, 'back to EN→IT: list returns');
// play: get ci-vediamo wrong, then back to setup
d.getElementById('clear-all').click();
ev("selectedNouns = new Set(['ci-vediamo']); updateReadout();");
d.getElementById('start-btn').click();
d.getElementById('answer').value = 'sbagliato'; d.getElementById('submit').click();
d.getElementById('change-btn').click();
ok(ev('weakestNouns(10)').includes('ci-vediamo') && rows().length === 7, `after a game, ci-vediamo (1/1 wrong) joins the list (${ev('weakestNouns(10)').join(', ')})`);
w.confirm = () => true;
d.getElementById('reset-stats').click();
ok(rows().length === 0 && /No mistakes logged yet\./.test(d.getElementById('weak-panel').textContent), 'reset progress → empty state');
// Preposizioni has its own box and history
w.localStorage.setItem('preposizioni-stats-v1', JSON.stringify({ 'parlo-del-cane': { seen: 6, wrong: 4 }, 'parlo-del-libro': { seen: 9, wrong: 1 } }));
d.querySelector('#subject-toggle [data-subject="prepositions"]').click();
ok(d.querySelector('.setup-side #weak-panel') && JSON.stringify(ev('weakestNouns(10)').slice(0, 2)) === JSON.stringify(['parlo-del-cane', 'parlo-del-libro']) && rows().length === 2, `Preposizioni: its own box, from its own history`);
ok(errors.length === 0 && warns.length === 0, `no runtime errors or warnings (${errors.join('; ')})`);
done();
