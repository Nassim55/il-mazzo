// Ripasso as a daily dose (Nov 2026): 30 a day, the words you're getting wrong first; a backlog spread over
// the coming days, never more than a dose a day; a word you know, right again, skips the short gaps.
const { boot, ok, done } = require('./harness');
const B = boot({ 'flipcards-subject': 'nouns' });
const d = B.d, ev = B.ev;
ev(`(() => { const s = loadSrs('nouns', 'en-it'), t = today();
  NOUN_FREQUENCY_ORDER.slice(0, 40).forEach((k, i) => { s[k] = i < 35 ? { b: 3, d: t - 2, l: t - 6, h: '111' } : { b: 1, d: t, l: t - 1, h: '10' }; });
  localStorage.setItem(srsKey('nouns', 'en-it'), JSON.stringify(s)); localStorage.removeItem('mazzo-ripasso-spread-en-it'); renderRipasso(); })()`);
const today = ev("dueList('en-it').map(x => x.n.noun)");
ok(today.length === 30, `a backlog of 40: today's dose is 30 (${today.length})`);
const struggling = ev('NOUN_FREQUENCY_ORDER.slice(35, 40)');
ok(struggling.every(k => today.slice(0, 5).includes(k)), "the 5 you're getting wrong come first");
ok(ev("dueOnDay('en-it', today() + 1)") === 10, 'the other 10 wait for tomorrow — none lost');
ok(/30 due today/.test(d.getElementById('todo-items').textContent) && d.getElementById('bell-count').textContent === '1', 'the bell: 30 due today');
ev('startRipasso()');
ok(ev('deck.length') === 30, 'Start plays the dose: 30');
ev('showSetup()');
// a bigger backlog never puts more than a dose on any day
ev(`(() => { const s = loadSrs('nouns', 'en-it'), t = today();
  NOUN_FREQUENCY_ORDER.slice(0, 200).forEach(k => { s[k] = { b: 2, d: t - 3, l: t - 5, h: '11' }; });
  localStorage.setItem(srsKey('nouns', 'en-it'), JSON.stringify(s)); localStorage.removeItem('mazzo-ripasso-spread-en-it'); renderRipasso(); })()`);
const days = ev("[0, 1, 2, 3, 4, 5, 6, 7].map(i => dueOnDay('en-it', today() + i))");
const dose = ev("dueList('en-it').length"), later = days.slice(1);
ok(dose === 30 && later.every(n => n <= 30) && dose + later.reduce((a, b) => a + b, 0) === 200, `200 due: 30 today, then no day over 30 (${later.join(', ')}) — all 200 still on the schedule`);
// a word you know skips the short gaps; one you're still learning climbs as before
ev(`(() => { const s = loadSrs('nouns', 'en-it'), t = today(); s.casa = { b: 1, d: t, l: t - 1, h: '1111111111' }; s.cane = { b: 1, d: t, l: t - 1, h: '10' };
  localStorage.setItem(srsKey('nouns', 'en-it'), JSON.stringify(s)); srsAnswer('nouns', 'en-it', 'casa', true); srsAnswer('nouns', 'en-it', 'cane', true); })()`);
ok(ev("loadSrs('nouns', 'en-it').casa.b") === 4 && ev("loadSrs('nouns', 'en-it').casa.d - today()") === 8, 'a word you know, right again: next in 8 days');
ok(ev("loadSrs('nouns', 'en-it').cane.b") === 2 && ev("loadSrs('nouns', 'en-it').cane.d - today()") === 2, 'a word still being learnt: next in 2 days, as before');
// all done for today: a dose more, from the next ones on the schedule
ev(`(() => { const s = loadSrs('nouns', 'en-it'), t = today(); for (const k of Object.keys(s)) if (s[k].d <= t) s[k].d = t + 1; localStorage.setItem(srsKey('nouns', 'en-it'), JSON.stringify(s)); renderRipasso(); })()`);
ok(/All done for today/.test(d.getElementById('todo-items').textContent) && d.getElementById('ripasso-more'), 'all done for today — with 30 more on offer');
d.getElementById('ripasso-more').click();
ok(ev('container.dataset.view') === 'game' && ev('deck.length') === 30, 'a dose more: 30 of the next on the schedule');
ok(B.errors.length === 0, 'no errors');
done();
