// Verbs: choosing which persons to practise (io, tu, lui/lei, noi, voi, loro), per
// section — in rounds, in Ripasso del giorno, saved, backed up and synced.
const { boot, ok, done } = require('./harness');
const quiet = w => { w.confirm = () => true; w.alert = () => {}; };
const { d, ev, errors, warns } = boot({ 'flipcards-subject': 'verbs' }, quiet);
ok(errors.length === 0 && warns.length === 0, 'loads cleanly');
const chips = (doc = d) => [...doc.querySelectorAll('#person-picker .person-chip')];
const on = (doc = d) => chips(doc).filter(c => c.classList.contains('active')).map(c => c.dataset.person).join(',');
const chip = p => d.querySelector(`#person-picker .person-chip[data-person="${p}"]`);
const quick = k => d.querySelector(`#person-picker [data-set="${k}"]`);
const count = () => d.getElementById('card-count').textContent;

ok(chips().length === 6 && on() === 'io,tu,lui,noi,voi,loro' && !d.getElementById('person-picker').hidden && chip('lui').textContent === 'lui / lei',
   'in Conjugations mode: six persons to choose from, all on to begin with');
const [v1, v2] = ev('verbData.slice(0, 2).map(v => v.it)');
ev(`selectedNouns = new Set(${JSON.stringify([v1, v2])}); updateReadout()`);
ok(count() === '12', 'two verbs × six persons = 12 cards');
chip('tu').click(); chip('voi').click();
ok(on() === 'io,lui,noi,loro' && count() === '8' && chip('tu').getAttribute('aria-pressed') === 'false', 'turning off tu and voi: four persons, 8 cards');
ok(ev(`cardsForItem(VERB_ITEMS.find(n => n.noun === ${JSON.stringify(v1)})).map(c => c.person).join()`) === 'io,lui,noi,loro', 'cards come only from the chosen persons, in the usual order');
ok(JSON.stringify(JSON.parse(ev("localStorage.getItem('mazzo-verb-persons-v1')")).verbs) === '["io","lui","noi","loro"]', 'the choice is saved');
d.getElementById('start-btn').click();
ok(ev('deck.length') === 8 && ev('deck.every(c => ["io", "lui", "noi", "loro"].includes(c.person))'), 'a round asks only those persons');
d.getElementById('change-btn').click();
ok(on() === 'io,lui,noi,loro', 'back on the setup screen, the choice is still there');

// ---- Quick sets, and never none ----
quick('sing').click();
ok(on() === 'io,tu,lui' && quick('sing').classList.contains('active') && count() === '6', '"singular" picks io, tu, lui / lei');
chip('io').click(); chip('tu').click(); chip('lui').click();
ok(on() === 'lui' && /at least one/.test(d.getElementById('person-hint').textContent) && count() === '2', 'the last person can\'t be turned off — it says why');
quick('plur').click();
ok(on() === 'noi,voi,loro' && d.getElementById('person-hint').textContent === '', '"plural" picks noi, voi, loro');
quick('all').click();
ok(on() === 'io,tu,lui,noi,voi,loro' && quick('all').classList.contains('active'), '"all" brings back all six');

// ---- Infinitives mode, other sections ----
quick('plur').click();
d.querySelector('#mode-toggle .mode-option[data-mode="infinitives"]').click();
ok(d.getElementById('person-picker').hidden && count() === '2', 'in Infinitives only mode the persons are hidden: one card per verb');
d.querySelector('#mode-toggle .mode-option[data-mode="conjugations"]').click();
ok(!d.getElementById('person-picker').hidden && count() === '6', 'back to Conjugations, the choice applies again');
d.querySelector('#subject-toggle [data-subject="irregular"]').click();
ok(on() === 'io,tu,lui,noi,voi,loro', 'the irregular verbs have their own choice');
quick('sing').click();
d.querySelector('#subject-toggle [data-subject="verbs"]').click();
ok(on() === 'noi,voi,loro', 'and changing it there leaves the regular verbs\' choice alone');
d.querySelector('#subject-toggle [data-subject="nouns"]').click();
ok(!d.getElementById('person-picker'), 'sections without verbs have no persons to choose');

// ---- Saved, reviewed, backed up, synced ----
const saved = ev("localStorage.getItem('mazzo-verb-persons-v1')");
const B = boot({ 'flipcards-subject': 'irregular', 'mazzo-verb-persons-v1': saved }, quiet);
ok(on(B.d) === 'io,tu,lui', 'the choice survives a reload');
const t = ev('today()');
const R = boot({ 'flipcards-subject': 'nouns', 'mazzo-verb-persons-v1': JSON.stringify({ verbs: ['noi'] }),
                 'verbi-regolari-stats:srs': JSON.stringify({ [v1]: { b: 1, d: t, l: null }, [v2]: { b: 1, d: t, l: null } }) }, quiet);
R.d.getElementById('ripasso-start').click();
ok(R.ev('deck.length') === 2 && R.ev('deck.every(c => c.person === "noi")'), 'Ripasso del giorno asks only the chosen persons too');
const X = boot({ 'flipcards-subject': 'verbs', 'mazzo-verb-persons-v1': JSON.stringify({ verbs: [], irregular: 'nonsense' }) }, quiet);
ok(on(X.d) === 'io,tu,lui,noi,voi,loro' && X.errors.length === 0, 'an empty or damaged saved choice falls back to all six');
ok(JSON.stringify(ev('buildBackup()')).includes('mazzo-verb-persons-v1') && ev("syncedKeys().get('mazzo-verb-persons-v1')") === 'assoc',
   'it goes into backups, and syncs with your progress');
done();
