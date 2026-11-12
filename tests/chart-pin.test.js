// Pinning the chart drawer: pinned, it stays open beside the round instead of over it —
// no dimming, keys and clicks carry on — through every card and into the next round, and
// steps aside outside a round. Remembered on the device; × closes and unpins it.
const { boot, ok, done } = require('./harness');

const startRound = (B, subj, keys) => {
  B.ev(`applySubject('${subj}'); showSetup(); clearHand(); selectedNouns = new Set(${JSON.stringify(keys)}); updateReadout();`);   // the hand is shared: just these
  B.d.getElementById('start-btn').click();
};
const key = (el, k) => el.dispatchEvent(new (el.ownerDocument || el).defaultView.KeyboardEvent('keydown', { key: k, bubbles: true }));
const ov = B => B.d.getElementById('chart-overlay');
const docked = B => B.d.body.classList.contains('chart-docked');

// ---- Pin it ----
let B = boot({ 'flipcards-subject': 'prepositions' });
startRound(B, 'prepositions', ['parlo-del-libro', 'vado-a-roma']);
B.d.getElementById('chart-btn').click();
const pin = () => B.d.getElementById('chart-pin');
ok(!ov(B).hidden && pin() && pin().textContent === '📌 Pin' && pin().getAttribute('aria-pressed') === 'false' && ov(B).querySelector('[aria-modal="true"]') && !docked(B),
   'the drawer has a pin; unpinned, it opens over the round as before');
pin().click();
ok(ov(B).classList.contains('pinned') && docked(B) && pin().textContent === '📌 Pinned' && pin().getAttribute('aria-pressed') === 'true'
   && ov(B).querySelector('[role="complementary"]') && !ov(B).querySelector('[aria-modal]') && B.w.localStorage.getItem('mazzo-chart-pinned-v1') === '1',
   'pinned: beside the round, not over it — no longer a dialog, and remembered');
ok(B.d.activeElement && B.d.activeElement.id === 'answer', 'and the answer box has the focus back');

// ---- The round carries on with it there ----
const answer = B.d.getElementById('answer');
answer.value = B.ev('deck[index].italian');
key(answer, 'Enter');
ok(B.d.getElementById('feedback').classList.contains('correct') && !ov(B).hidden, 'Enter answers the card — the pinned chart doesn\'t hold the keys');
key(B.d, 'Escape');
ok(!ov(B).hidden, 'Escape leaves a pinned chart alone');
B.d.getElementById('submit').click();
ok(B.ev('index') === 1 && !ov(B).hidden && docked(B), 'the next card: still there');

// ---- It steps aside outside a round, and comes back in the next ----
B.ev('showSetup()');
ok(ov(B).hidden && !docked(B), 'back at the setup (which shows the chart already): out of the way');
startRound(B, 'prepositions', ['vado-a-roma']);
ok(!ov(B).hidden && docked(B) && /Stay apart/.test(B.d.getElementById('chart-body').textContent), 'the next round: back again, without asking');
answer.value = ''; B.d.getElementById('answer').value = B.ev('deck[index].italian'); B.d.getElementById('submit').click(); B.d.getElementById('submit').click();
ok(B.d.querySelector('.container').dataset.view === 'complete' && ov(B).hidden && !docked(B), 'the round\'s summary: out of the way');

// ---- Other sections: its own chart, or none ----
startRound(B, 'mipiace', B.ev('MIPIACE_ITEMS.slice(0, 2).map(n => n.noun)'));
ok(!ov(B).hidden && /Come piacere/.test(B.d.getElementById('chart-body').textContent) && B.d.getElementById('chart-overlay').querySelector('[aria-label="Come piacere"]'),
   'a round in another section: that section\'s chart');
startRound(B, 'nouns', ['casa', 'cane']);
ok(ov(B).hidden && !docked(B) && B.d.getElementById('chart-btn').hidden, 'a section with no chart: nothing pinned, no button');

// ---- Remembered on the device ----
B = boot({ 'flipcards-subject': 'prepositions', 'mazzo-chart-pinned-v1': '1' });
ok(!B.d.getElementById('chart-overlay') || B.d.getElementById('chart-overlay').hidden, 'pinned last time: nothing over the setup');
startRound(B, 'prepositions', ['vado-a-roma']);
ok(!ov(B).hidden && docked(B) && ov(B).classList.contains('pinned'), '…and the first round opens with it beside the card');

// ---- Unpin, or close ----
pin().click();
ok(!ov(B).classList.contains('pinned') && !docked(B) && !ov(B).hidden && ov(B).querySelector('[aria-modal="true"]') && B.w.localStorage.getItem('mazzo-chart-pinned-v1') === '0',
   'unpinned: over the round again, still open');
key(B.d, 'Escape');
ok(ov(B).hidden, '…and Escape closes it, as before');
B.d.getElementById('chart-btn').click(); pin().click();
B.d.getElementById('chart-close').click();
ok(ov(B).hidden && !docked(B) && B.w.localStorage.getItem('mazzo-chart-pinned-v1') === '0', '× on a pinned chart: closed, and unpinned');
startRound(B, 'prepositions', ['vado-a-roma']);
ok(ov(B).hidden, 'so the next round starts without it');
ok(B.errors.length === 0, 'no errors along the way');
done();
