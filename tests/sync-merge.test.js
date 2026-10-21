// Sync, part 1: which saved data counts as progress, how two devices' copies merge
// (counters add up, schedules keep the latest answer, resets win), and a two-device
// simulation through a stand-in server.
const { boot, ok, done } = require('./harness');
const quiet = w => { w.confirm = () => true; w.alert = () => {}; };
const A0 = { 'sostantivi-stats-v1': JSON.stringify({ casa: { seen: 3, wrong: 1 } }), 'flipcards-subject': 'nouns' };
const { d, ev, errors, warns } = boot(A0, quiet);
ok(errors.length === 0 && warns.length === 0, 'loads cleanly');

// ---- What syncs ----
const keys = ev('[...syncedKeys().keys()]');
ok(keys.length === 58, `58 stores sync (${keys.length}) — Preposizioni added 7: its three directions' stats and schedules, and its word associations`);
ok(['sostantivi-stats-v1', 'verbi-regolari-stats:srs', 'frasi-stats-listen-v1', 'aggettivi-assoc-v1', 'mazzo-story-v1', 'mazzo-verb-persons-v1'].every(k => keys.includes(k)),
   'stats, review schedules, associations, story progress and the verb persons chosen, for every section and direction');
ok(!['mazzo-audio-v1', 'mazzo-ripasso-dir', 'flipcards-subject', 'mazzo-sync-meta-v1', 'mazzo-sync-base-v1'].some(k => keys.includes(k)),
   'device settings (voice, review direction, last section) and sync bookkeeping stay on the device');

// ---- Counters ----
const m = (kind, b, l, r) => ev(`SYNC_MERGERS[${JSON.stringify(kind)}](${JSON.stringify(b)}, ${JSON.stringify(l)}, ${JSON.stringify(r)})`);
const c = m('counters', { casa: { seen: 3, wrong: 1 } }, { casa: { seen: 5, wrong: 1 }, gatto: { seen: 1, wrong: 0 } }, { casa: { seen: 4, wrong: 2 }, cane: { seen: 2, wrong: 1 } });
ok(c.casa.seen === 6 && c.casa.wrong === 2, 'counters: both devices\' new answers add up (3 seen, +2 here, +1 there = 6)');
ok(c.gatto.seen === 1 && c.cane.seen === 2, 'counters: words practised on only one device are kept');
const cv = m('counters', { amare: { attempts: 2, wrongs: 0 } }, { amare: { attempts: 4, wrongs: 1 } }, { amare: { attempts: 3, wrongs: 0 } });
ok(cv.amare.attempts === 5 && cv.amare.wrongs === 1, "the regular verbs' attempts/wrongs format merges the same way");
const nb = m('counters', undefined, { casa: { seen: 4, wrong: 1 }, cane: { seen: 7, wrong: 0 } }, { casa: { seen: 4, wrong: 1 }, cane: { seen: 5, wrong: 2 } });
ok(nb.casa.seen === 4 && nb.casa.wrong === 1 && nb.cane.seen === 7 && nb.cane.wrong === 2, "with no shared starting point (a device's first sync) the larger count is kept, so a backup restored on two devices isn't counted twice");
ok(m('counters', {}, { casa: { seen: 2, wrong: 0 } }, { casa: { seen: 3, wrong: 1 } }).casa.seen === 5, 'a word first practised on both devices since the last sync: both sessions count');

// ---- Review schedules ----
const s = m('schedule', { a: { b: 2, d: 10, l: 8 }, b: { b: 2, d: 10, l: 8 }, c: { b: 3, d: 12, l: 9 }, del: { b: 1, d: 9, l: 8 } },
  { a: { b: 3, d: 14, l: 10 }, b: { b: 2, d: 10, l: 8 }, c: { b: 4, d: 20, l: 12 }, del: { b: 1, d: 9, l: 8 }, mine: { b: 1, d: 11, l: 10 } },
  { a: { b: 2, d: 10, l: 8 }, b: { b: 1, d: 11, l: 10 }, c: { b: 1, d: 13, l: 13 }, theirs: { b: 1, d: 11, l: 10 } });
ok(s.a.b === 3 && s.b.b === 1, 'schedules: a change on either side wins');
ok(s.c.l === 13 && s.c.b === 1, 'schedules: changed on both, the most recently answered wins');
ok(!('del' in s) && s.mine && s.theirs, 'schedules: a record removed on one side is removed; new records on both sides are kept');
ok(ev(`syncSame({ a: 1, b: { c: 2, d: 3 } }, { b: { d: 3, c: 2 }, a: 1 })`) && !ev(`syncSame({ a: 1 }, { a: 2 })`), 'copies are compared by content, not by the order words were added in');
ok(JSON.stringify(Object.keys(ev(`syncChanges({ x: { v: { a: 1, b: 2 }, e: 0 }, y: { v: {}, e: 1 } }, { x: { v: { b: 2, a: 1 }, e: 0 }, y: { v: {}, e: 0 } })`))) === '["y"]', 'a save sends only the stores that really changed');
ok(m('schedule', {}, { x: { b: 3, d: 9, l: 7 } }, { x: { b: 2, d: 9, l: 7 } }).x.b === 3, 'schedules: answered the same day on both, the higher box wins');

// ---- Associations and the story ----
const a = m('assoc', { casa: 'home', cane: 'dog', gatto: 'cat' }, { casa: 'my house', cane: 'dog' , gatto: 'kitty' }, { casa: 'home', gatto: 'puss', nuovo: 'new' });
ok(a.casa === 'my house' && !('cane' in a) && a.nuovo === 'new', 'associations: edits and deletions on either side are kept');
ok(a.gatto === 'kitty', "associations: edited on both, this device's version wins");
const st = m('story', null, { read: { c1: '2026-10-10', c2: '2026-10-15' }, quiz: { c1: { score: 2, total: 4 } } }, { read: { c1: '2026-10-12', c3: '2026-10-16' }, quiz: { c1: { score: 4, total: 4 } } });
ok(st.read.c1 === '2026-10-10' && st.read.c2 && st.read.c3 && st.quiz.c1.score === 4, 'story: chapters read on either device count (earliest date), best quiz score kept');

// ---- Epochs: a reset wins outright ----
const all = (b, l, r) => ev(`syncMergeAll(${JSON.stringify(b)}, ${JSON.stringify(l)}, ${JSON.stringify(r)})`);
const K = 'sostantivi-stats-v1';
let r = all({}, { [K]: { v: {}, e: 1 } }, { [K]: { v: { casa: { seen: 9, wrong: 2 } }, e: 0 } });
ok(JSON.stringify(r[K].v) === '{}' && r[K].e === 1, 'a reset on this device beats the other copy, however much history it has');
r = all({}, { [K]: { v: { casa: { seen: 9, wrong: 2 } }, e: 0 } }, { [K]: { v: {}, e: 1 } });
ok(JSON.stringify(r[K].v) === '{}' && r[K].e === 1, '…and a reset elsewhere wins here');
r = all({ [K]: { v: { casa: { seen: 9, wrong: 0 } }, e: 0 } }, { [K]: { v: { casa: { seen: 1, wrong: 0 } }, e: 1 } }, { [K]: { v: { casa: { seen: 2, wrong: 0 } }, e: 1 } });
ok(r[K].v.casa.seen === 2, 'reset on both: the old starting point is ignored (no shared base, so the larger count)');
r = all({}, { [K]: { v: { casa: { seen: 1, wrong: 0 } }, e: 0 } }, {});
ok(r[K].v.casa.seen === 1 && Object.keys(r).length === 1, 'a store only one side has is taken as it is');

// ---- Hooks: reset and restore raise epochs; backups leave sync bookkeeping out ----
d.querySelector('#reset-stats').click();
const ep = ev('syncMeta().epochs');
ok(ep['sostantivi-stats-v1'] === 1 && ep['sostantivi-stats-v1:srs'] === 1 && Object.keys(ep).length === 2, 'reset progress raises the epoch of exactly the stores it cleared');
const backup = JSON.stringify(ev('buildBackup()'));
ok(!/mazzo-sync-/.test(backup), 'backups leave the sync bookkeeping out');
ev(`restoreFromText(${JSON.stringify(backup)})`);
const ep2 = ev('syncMeta().epochs');
ok(Object.keys(ep2).length === 58 && ep2['sostantivi-stats-v1'] === 2 && ep2['frasi-stats-v1'] === 1, 'restoring a backup raises every store\'s epoch, so the restored copy wins');

// ---- Two devices, one stand-in server ----
const server = { items: {} };
const start = { 'sostantivi-stats-v1': JSON.stringify({ casa: { seen: 4, wrong: 1 } }), 'flipcards-subject': 'nouns' };   // the same backup on both
const devA = boot(start, quiet), devB = boot(start, quiet);
// What the sync step will do: merge base, this device and the server; store the result on both
function syncOnce(dev) {
  const merged = dev.ev(`syncMergeAll(syncReadJSON(SYNC_BASE_KEY, {}), syncLocalSnapshot(), ${JSON.stringify(server.items)})`);
  dev.ev(`syncApply(${JSON.stringify(merged)}); localStorage.setItem(SYNC_BASE_KEY, ${JSON.stringify(JSON.stringify(merged))})`);
  server.items = merged;
}
syncOnce(devA); syncOnce(devB);
const practise = (dev, word, seen, wrong) => dev.ev(`(() => { const o = readStats('nouns', 'en-it'); const s = o[${JSON.stringify(word)}] || { seen: 0, wrong: 0 };
  localStorage.setItem('sostantivi-stats-v1', JSON.stringify({ ...o, [${JSON.stringify(word)}]: { seen: s.seen + ${seen}, wrong: s.wrong + ${wrong} } })); })()`);
ok(devB.ev("readStats('nouns', 'en-it').casa.seen") === 4, "first sync of a second device holding the same backup: it isn't counted twice");
practise(devA, 'casa', 3, 1); practise(devA, 'gatto', 2, 0);   // one laptop
practise(devB, 'casa', 2, 0); practise(devB, 'cane', 1, 1);    // the other, before either syncs
syncOnce(devA); syncOnce(devB); syncOnce(devA);
const sa = devA.ev("readStats('nouns', 'en-it')"), sb = devB.ev("readStats('nouns', 'en-it')");
// Same words and counts; the order words were added in can differ between devices
const canon = o => JSON.stringify(Object.keys(o).sort().map(k => [k, o[k]]));
ok(canon(sa) === canon(sb), 'after syncing, both devices hold the same progress');
ok(sa.casa.seen === 9 && sa.casa.wrong === 2 && sa.gatto.seen === 2 && sa.cane.wrong === 1, 'and nothing practised on either device was lost (casa 4 + 3 + 2 = 9 seen)');
ok(devA.ev('stats.casa.seen') === 9 && /\b3\b.*practised|practised/.test(devA.d.querySelector('.setup-meta').textContent), 'the app reloads its progress and redraws the setup screen after a sync');
syncOnce(devA); syncOnce(devB);
ok(devA.ev("readStats('nouns', 'en-it').casa.seen") === 9, 'syncing again with nothing new changes nothing');
devB.d.querySelector('#reset-stats').click();
syncOnce(devB); syncOnce(devA);
ok(JSON.stringify(devA.ev("readStats('nouns', 'en-it')")) === '{}' && JSON.stringify(devA.ev("loadSrs('nouns', 'en-it')")) === '{}', 'a reset on one device reaches the other');
done();
