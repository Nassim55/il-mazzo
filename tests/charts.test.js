// In a round, each section's chart on demand — the same chart as on its setup screen:
// a button beside Focus…, a drawer (a sheet on a phone) over the card, Escape / × / a click
// outside to close, back to the answer as you left it. In Ripasso it follows each card.
const { boot, ok, done } = require('./harness');

const startRound = (subj, keys) => {
  const B = boot({ 'flipcards-subject': subj });
  B.ev(`selectedNouns = new Set(${JSON.stringify(keys)}); updateReadout();`);
  B.d.getElementById('start-btn').click();
  return B;
};
const key = (d, k) => d.dispatchEvent(new d.defaultView.KeyboardEvent('keydown', { key: k, bubbles: true }));

// ---- Preposizioni: Le articolate ----
const P = startRound('prepositions', ['parlo-del-libro', 'vado-a-roma']);
const pd = P.d, btn = pd.getElementById('chart-btn');
ok(btn && !btn.hidden && btn.textContent.trim() === '▦ Le articolate', 'in a Preposizioni round: ▦ Le articolate, beside the other controls');
pd.getElementById('answer').value = 'del';
btn.click();
const ov = () => pd.getElementById('chart-overlay');
ok(ov() && !ov().hidden && pd.querySelectorAll('#chart-body .eg-cell').length === 35 && /Stay apart/.test(pd.getElementById('chart-body').textContent),
   'it opens the chart: the 35 joined forms and the notes');
const headings = k => [...pd.defaultView.eval(`SECTION_CHARTS.${k}()`).matchAll(/class="en-label">([^<]+)</g)].map(m => m[1].trim());
ok(JSON.stringify(headings('prepositions')) === JSON.stringify(['Which article?', 'To, at, in', 'The uses of di', 'The uses of da', 'Stay apart']),
   `Le articolate: English headings, with di and da in notes of their own (${headings('prepositions').join(' · ')})`);
ok(headings('phrases').includes('Formal or informal you') && headings('phrases').includes('The many uses of prego') && headings('irregular').includes('The noi and voi forms')
   && !['Tu o Lei', 'Prego', 'Così così?', 'Noi &amp; voi', 'di · da'].some(h => [...headings('phrases'), ...headings('irregular'), ...headings('prepositions')].includes(h)),
   'and the same in every chart: no heading in Italian alone');
ok(pd.activeElement && pd.activeElement.id === 'chart-close' && ov().querySelector('[role="dialog"]').getAttribute('aria-label') === 'Le articolate', 'focus moves to its close button; the dialog is named');
key(pd, 'Enter');
ok(!ov().hidden && pd.getElementById('feedback').classList.contains('hidden'), 'Enter does not submit the card behind it');
key(pd, 'Escape');
ok(ov().hidden && pd.getElementById('answer').value === 'del' && pd.activeElement && pd.activeElement.id === 'answer', 'Escape closes it, back in the answer with what you had typed');
btn.click();
pd.getElementById('chart-close').click();
ok(ov().hidden, 'the × closes it');
btn.click();
ov().dispatchEvent(new pd.defaultView.MouseEvent('click', { bubbles: true }));
ok(ov().hidden, 'and so does a click outside the chart');
pd.getElementById('submit').click();
ok(!pd.getElementById('feedback').classList.contains('hidden'), 'the card then plays on as normal');
btn.click();
pd.getElementById('change-btn').click();
ok(ov().hidden, 'leaving the round never leaves it open');

// ---- Each section its own chart; none where there isn't one ----
const label = (subj, keyName) => {
  const B = startRound(subj, [keyName]);
  const b = B.d.getElementById('chart-btn');
  if (!b || b.hidden) return null;
  b.click();
  const title = (B.d.querySelector('#chart-body .endings-title') || {}).textContent;
  return `${b.textContent.trim()} → ${title}`;
};
ok(label('verbs', 'parlare') === '▦ Le desinenze → Le desinenze', 'Verbi regolari: Le desinenze');
ok(label('irregular', 'essere') === '▦ Gli irregolari → Gli irregolari', 'Verbi irregolari: Gli irregolari');
ok(label('adjectives', 'grande') === '▦ Le concordanze → Le concordanze', 'Aggettivi: Le concordanze');
ok(label('phrases', 'grazie') === '▦ In pratica → In pratica', 'Frasi: In pratica');
ok(label('nouns', 'casa') === null && label('sentences', 'bevo-un-caffe') === null, 'Sostantivi and Scrittura have no chart, so no button');

// ---- Ripasso: the button follows each card's own section ----
const R = boot({ 'flipcards-subject': 'nouns' });
R.ev(`(() => {
  for (const [subj, k] of [['prepositions', 'parlo-del-libro'], ['nouns', 'casa'], ['verbs', 'parlare']]) {
    const s = loadSrs(subj, 'en-it'); s[k] = { b: 1, d: today(), l: today() - 1 }; saveSrs(subj, 'en-it', s);
  }
  startRipasso();
})()`);
const seen = [];
for (let k = 0; k < R.ev('deck.length'); k++) {
  const b = R.d.getElementById('chart-btn'), subj = R.ev('subject');
  seen.push(`${subj}:${b.hidden ? '—' : b.textContent.trim()}`);
  R.d.getElementById('answer').value = R.ev('deck[index].italian');
  R.d.getElementById('submit').click();
  R.d.getElementById('submit').click();
}
ok(seen.includes('prepositions:▦ Le articolate') && seen.includes('verbs:▦ Le desinenze') && seen.includes('nouns:—'), `in Ripasso it follows the card: ${seen.join(' · ')}`);
done();
