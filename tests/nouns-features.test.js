const { boot, ok, done } = require('./harness');
const { w, d, ev, key, fire, setVal, errors } = boot();
const before = (a, b) => !!(d.getElementById(a).compareDocumentPosition(d.getElementById(b)) & w.Node.DOCUMENT_POSITION_FOLLOWING);
// --- layout ---
ok(before('start-btn', 'theme-chips') && before('theme-chips', 'verb-grid') && !d.getElementById('setup-more') && d.querySelector('.setup-foot #setup-meta'), 'layout: the hand → themes → grid; your progress and the voice at the foot');
ok(!d.querySelector('aside.endings:not(.map-panel)') && !d.getElementById('mode-toggle'), 'noun setup has no verb panels (the map\'s panel only borrows their look)');
d.querySelector('.theme-chip[data-theme="casa"]').click();
const n = ev('selectedNouns.size');
const casaN = ev("NOUN_THEMES.find(t => t.key === 'casa').nouns.length");
ok(n === casaN && d.getElementById('start-btn').textContent.includes(`${casaN} cards`), 'theme click updates counts and Start');
const chips = d.querySelectorAll('.verb-chip.unselected');
fire(chips[0], 'mousedown'); fire(chips[1], 'mouseover'); fire(chips[2], 'mouseover'); fire(d, 'mouseup');
ok(ev('selectedNouns.size') === n + 3, 'click-and-drag selects chips');
// --- frequency: 10 most common Natura ---
ev("selectedNouns.clear(); deckTopics = []; updateReadout();");
const natura = ev("THEMES.find(t => t.key === 'natura').nouns");
const byRank = [...natura].sort((a, b) => ev('frequencyRank')[a] - ev('frequencyRank')[b]);
ev(`selectedNouns = new Set(${JSON.stringify(natura)}); updateReadout();`);
ev("capValue = '10'; updateReadout();"); ev("capMode = 'frequent'; updateReadout();");
ok(d.getElementById('start-btn').textContent.includes('10 most common cards'), 'Start: "10 most common cards"');
d.getElementById('start-btn').click();
let deck = ev('deck.map(c => c.noun)');
ok(deck.length === 10 && byRank.slice(0, 10).every(x => deck.includes(x)), 'deck = 10 most common Natura nouns');
setVal('game-trim-input', '15', 'change');
deck = ev('deck.map(c => c.noun)');
ok(deck.length === 15 && byRank.slice(0, 15).every(x => deck.includes(x)), 'Deck size 15 adds the next 5 most common');
// --- focus modal mid-game ---
d.getElementById('game-focus-btn').click();
key(d.getElementById('focus-search'), 'Enter');
ok(ev('answered') === false && ev('index') === 0, 'Enter in Focus search does not submit the card');
d.getElementById('focus-top-input').value = '5'; key(d.getElementById('focus-top-input'), 'Enter');
const checked = [...d.querySelectorAll('#focus-list input:checked')].map(c => c.dataset.noun);
ok(checked.length === 5 && byRank.slice(0, 5).every(x => checked.includes(x)) && d.getElementById('focus-sort').value === 'frequency', 'Top 5 checks the 5 most common and sorts by frequency');
ok(/^#\d+$/.test(d.querySelector('#focus-list .focus-rank').textContent), 'rank column renders');
d.getElementById('focus-apply').click();
ok(ev('deck.length') === 5 && ev('index') === 0, 'Apply restarts on those 5');
d.getElementById('game-focus-btn').click();
ok(d.getElementById('focus-total').textContent === String(natura.length) && d.querySelectorAll('#focus-list input:checked').length === 5, 'reopened Focus lists the whole selection, 5 checked');
d.getElementById('focus-cancel').click();
setVal('game-trim-rest', String(natura.length - ev('sessionMaxDeck.length')), 'change');   // after a Focus pick: the Focus cards + the rest
ok(ev('deck.length') === natura.length, 'Deck size can grow back to the whole selection');
// --- weakest-first ordering ---
ev("stats = { tramonto: {seen: 13, wrong: 10}, pianeta: {seen: 34, wrong: 15}, grotta: {seen: 3, wrong: 3}, sole: {seen: 12, wrong: 0} }");
const order = ev("['pianeta','tramonto','grotta','sole','radura'].sort(compareWeakness)");
ok(JSON.stringify(order) === JSON.stringify(['grotta', 'radura', 'tramonto', 'pianeta', 'sole']), `weakest-first by error rate, unseen as 100% (${order.join(', ')})`);
// --- whole deck: nothing selected, 100 most common ---
d.getElementById('change-btn').click();
ev("selectedNouns.clear(); deckTopics = []; updateReadout();");
ev("capValue = '100'; updateReadout();"); ev("capMode = 'frequent'; updateReadout();");
ok(d.getElementById('start-btn').disabled, 'nothing in the hand + a deck size: Start waits (a number alone no longer draws from the whole deck)');
ev("nounData.forEach(n => selectedNouns.add(n.noun)); deckTopics = null; updateReadout();");
ok(/100 most common/.test(d.getElementById('start-btn').textContent) && !d.getElementById('start-btn').disabled, 'All + 100, most common → Start · 100 most common cards');
d.getElementById('start-btn').click();
deck = ev('deck.map(c => c.noun)');
ok(deck.length === 100 && ev('FREQUENCY_ORDER.slice(0, 100)').every(x => deck.includes(x)) && ev('sessionPool.length') === 1360, 'plays the 100 most common, pool = whole deck');
d.getElementById('reshuffle-btn').click();
ok(ev('deck.length') === 100, 'Reshuffle works with nothing selected');
d.getElementById('change-btn').click();
ok(ev('capValue') === '100' && ev('capMode') === 'frequent', 'subset number and mode remembered');
// --- newest 100 nouns & themes ---
ev("selectedNouns.clear(); deckTopics = []; updateReadout();"); ev("capValue = ''; updateReadout();");
ok(!!d.querySelector('.theme-chip[data-theme="idee"]') && !!d.querySelector('.theme-chip[data-theme="media"]'), 'Idee and Media themes present');
ev("selectedNouns = new Set(['soldi']); updateReadout();"); d.getElementById('start-btn').click();
d.getElementById('answer').value = 'i soldi'; d.getElementById('submit').click();
ok(d.getElementById('feedback').className.includes('correct') && /solidus/.test(d.querySelector('.feedback-note')?.textContent || ''), 'plural card "i soldi" with its note');
// --- hand-pick with nothing selected ---
d.getElementById('change-btn').click(); ev("selectedNouns.clear(); deckTopics = []; updateReadout();");
ev("openFocusModal('setup')");
ok(d.getElementById('focus-total').textContent === '1360', 'Hand-pick with nothing selected lists all 1360');
d.getElementById('focus-top-input').value = '100'; d.getElementById('focus-top-btn').click(); d.getElementById('focus-apply').click();
ok(d.querySelectorAll('.verb-chip:not(.unselected)').length === 100, 'Hand-pick Top 100 lights up 100 chips');
ok(errors.length === 0, `no runtime errors (${errors.join('; ')})`);
done();
