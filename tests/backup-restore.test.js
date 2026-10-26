const { boot, ok, done } = require('./harness');
// ---- Session A: some history in both subjects ----
const A = boot({
  'sostantivi-stats-v1': JSON.stringify({ pane: { seen: 4, wrong: 1 }, casa: { seen: 2, wrong: 0 } }),
  'sostantivi-assoc-v1': JSON.stringify({ pane: 'companion' }),
  'verbi-regolari-stats': JSON.stringify({ capire: { attempts: 6, wrongs: 2 } }),
  'verbi-regolari-assoc-v1': JSON.stringify({ capire: 'grasp' }),
  'flipcards-subject': 'verbs'
});
ok(A.d.title === 'Il Mazzo · Verbi Regolari' && A.d.getElementById('app-subtitle').textContent === 'Il Mazzo · Presente Indicativo', `rebranded: tab "${A.d.title}", subtitle "${A.d.getElementById('app-subtitle').textContent}"`);
const meta = A.d.getElementById('setup-meta').textContent.replace(/\s+/g, ' ').trim();
ok(/back up · restore ·\s?reset progress/.test(meta), `strip shows back up · restore · reset ("${meta}")`);
const backup = A.ev('buildBackup()');
ok(backup.app === 'il-mazzo' && ['flipcards-subject', 'sostantivi-stats-v1', 'sostantivi-assoc-v1', 'verbi-regolari-stats', 'verbi-regolari-assoc-v1', 'sostantivi-stats-v1:srs', 'verbi-regolari-stats:srs'].every(k => k in backup.data) && Object.keys(backup.data).length === 7 && backup.data['verbi-regolari-assoc-v1'].includes('grasp'), `backup holds the 5 saved keys plus the review schedules seeded from them (${Object.keys(backup.data).join(', ')})`);
// The download itself (jsdom has no object URLs, so stub them and catch the click)
let downloaded = null;
A.w.URL.createObjectURL = () => 'blob:test'; A.w.URL.revokeObjectURL = () => {};
A.w.HTMLAnchorElement.prototype.click = function () { downloaded = this.download; };
A.d.getElementById('backup-progress').click();
ok(/^il-mazzo-backup-\d{4}-\d{2}-\d{2}\.json$/.test(downloaded || ''), `"back up" downloads ${downloaded}`);

// ---- Session B: a renamed file in a browser with separate storage (starts empty) ----
const B = boot();
const metaB = B.d.getElementById('setup-meta');
ok(!metaB.classList.contains('empty') && /No noun progress logged yet/.test(metaB.textContent) && !B.d.getElementById('reset-stats') && !!B.d.getElementById('restore-progress'),
   'empty file: strip still visible with "restore" (no reset link)');
const text = JSON.stringify(backup);
B.w.alert = () => {};
B.w.confirm = () => false;
ok(B.ev(`restoreFromText(${JSON.stringify(text)})`) === false && ['sostantivi-stats-v1','sostantivi-assoc-v1','verbi-regolari-stats','verbi-regolari-assoc-v1'].every(k => B.w.localStorage.getItem(k) === null) && B.ev('subject') === 'nouns', 'cancelling the confirmation changes nothing');
let alerted = ''; B.w.alert = m => { alerted = m; };
ok(B.ev(`restoreFromText('{"hello": 1}')`) === false && /isn't an Il Mazzo backup/.test(alerted), 'a non-backup file is refused with a clear message');
B.w.confirm = () => true;
const tampered = JSON.parse(text); tampered.data['some-other-site'] = '{"x":1}'; tampered.data['sostantivi-assoc-v1'] = JSON.stringify({ pane: 'companion' });
ok(B.ev(`restoreFromText(${JSON.stringify(JSON.stringify(tampered))})`) === true, 'restore accepted');
ok(B.w.localStorage.getItem('some-other-site') === null, 'unknown keys in the file are ignored');
ok(B.ev('subject') === 'verbs' && B.d.getElementById('app-title').textContent === 'Verbi Regolari', 'last-used subject restored (verbs)');
ok(/1\/150 practised/.test(B.d.getElementById('setup-meta').textContent), 'verb progress restored in the strip');
ok(JSON.parse(B.w.localStorage.getItem('verbi-regolari-stats')).capire.attempts === 6, 'verb stats restored in their original format');
B.d.querySelector('#subject-toggle [data-subject="nouns"]').click();
ok(/2\/941 practised · 1 with errors logged/.test(B.d.getElementById('setup-meta').textContent.replace(/\s+/g, ' ')), 'noun progress restored');
B.ev("selectedNouns = new Set(['pane']); updateReadout();"); B.d.getElementById('start-btn').click();
B.d.getElementById('answer').value = 'il pane'; B.d.getElementById('submit').click();
ok(B.d.querySelector('.assoc-text')?.textContent === 'companion', 'noun association restored and shown after answering');
ok(A.errors.length === 0 && B.errors.length === 0 && A.warns.length === 0 && B.warns.length === 0, 'no runtime errors or warnings');
done();
