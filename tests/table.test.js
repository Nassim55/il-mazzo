// The top of the page (Nov 2026): Il Mazzo's masthead with the three families beside it — each opening its own
// menu of sections — and the bell, whose Da fare list holds Ripasso del giorno and Il mazzo salvato; then the
// section's heading; then the table: your hand, one for every section. Start and A spasso play one section as
// before, several as one mixed round.
const { boot, ok, done } = require('./harness');

let B = boot({ 'flipcards-subject': 'nouns' });
let d = B.d, ev = B.ev;
const order = [...d.querySelectorAll('.setup-top-inner > *')].map(e => e.className.split(' ')[0]);
ok(order.join() === 'masthead,table' && /Il Mazzo/.test(d.querySelector('.masthead').textContent) && d.querySelector('.masthead .sections') && d.querySelector('.masthead #bell')
   && d.getElementById('setup-top').compareDocumentPosition(d.getElementById('app-title')) & 4, `Il Mazzo on top, the families and the bell beside it; then your hand (${order.join(' → ')})`);
const fams = [...d.querySelectorAll('.sections .family .family-name')].map(e => e.textContent);
const names = key => [...d.querySelectorAll(`#family-list-${key} .mode-option`)].map(b => b.querySelector('.section-name').textContent);
const open = () => [...d.querySelectorAll('.family-menu.open')].map(m => m.dataset.familyMenu);
ok(fams.join('|') === 'Parole|Verbi|Frasi e storie' && d.querySelector('.family[data-family="parole"]').classList.contains('active') && open().length === 0
   && names('parole').join('|') === 'Sostantivi|Aggettivi|Avverbi e congiunzioni|Possessivi|Preposizioni' && d.querySelector('#family-list-parole [data-subject="nouns"]').classList.contains('active'),
   `three families, Parole current, every menu closed; Parole's holds its five sections (${names('parole').join(', ')}), Sostantivi marked`);
d.querySelector('.family[data-family="verbi"]').click();
ok(ev('subject') === 'nouns' && open().join() === 'verbi' && !d.getElementById('family-list-verbi').hidden && d.getElementById('family-list-parole').hidden
   && names('verbi').join('|') === 'Regolari|Irregolari|Al contrario' && d.querySelector('.family[data-family="verbi"]').getAttribute('aria-expanded') === 'true',
   "Verbi: just its menu opens — Regolari, Irregolari, Al contrario — and nothing switches yet");
d.querySelector('#subject-toggle [data-subject="mipiace"]').click();
ok(ev('subject') === 'mipiace' && open().length === 0 && d.querySelector('.family[data-family="verbi"]').classList.contains('active') && d.querySelector('#family-list-verbi [data-subject="mipiace"]').classList.contains('active'),
   'a section from the menu: switched, the menu closed, Verbi current, Al contrario marked in its menu');
d.querySelector('.family[data-family="frasi"]').click();
ok(open().join() === 'frasi' && names('frasi').join('|') === 'Frasi|Scrittura|Dialoghi|Racconto', 'Frasi e storie: Frasi, Scrittura, Dialoghi, Racconto');
d.dispatchEvent(new B.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
ok(open().length === 0, 'Esc closes a menu');
d.querySelector('.family[data-family="parole"]').click();
d.body.click();
ok(open().length === 0, 'and so does a click anywhere else');
d.querySelector('#subject-toggle [data-subject="nouns"]').click();

// ---- The bell: Da fare ----
const badge = () => d.getElementById('bell-count');
ok(!d.getElementById('table-tabs') && d.getElementById('table').contains(d.getElementById('hand')) && badge().hidden && d.getElementById('todo').hidden,
   'no tabs: the table is your hand; the bell shows no count with nothing waiting, its list closed');
d.getElementById('bell').click();
ok(!d.getElementById('todo').hidden && /come back here/.test(d.getElementById('todo-items').textContent) && d.getElementById('bell').getAttribute('aria-expanded') === 'true',
   'the bell opens Da fare: nothing waiting yet, and what will come');
d.getElementById('bell').click();
ok(d.getElementById('todo').hidden, '…and closes it');

// ---- One hand, every section ----
d.querySelector('.map-row[data-topic="tempo"] .map-add').click();
d.querySelector('#subject-toggle [data-subject="verbs"]').click();
d.querySelector('.map-row[data-topic="freq1"] .map-add').click();
const cards = () => [...d.querySelectorAll('#hand-fan .hand-card[data-topic]')].map(c => `${c.dataset.section}:${c.dataset.topic}`);
const words = ev("NOUN_THEMES.find(t => t.key === 'tempo').nouns.length") + ev("SUBJECTS.verbs.themes.find(t => t.key === 'freq1').nouns.length");
ok(cards().join() === 'nouns:tempo,verbs:freq1' && /Sostantivi/.test(d.querySelector('#hand-fan [data-topic="tempo"] .hand-sect').textContent) && /Verbi regolari/.test(d.querySelector('#hand-fan [data-topic="freq1"] .hand-sect').textContent),
   'on the verbs page, the hand holds Tempo (Sostantivi) and the 50 most common verbs (Verbi regolari), each card tagged with its section');
ok(d.getElementById('selected-count').textContent === String(words) && d.getElementById('hand-words').textContent === 'words' && /2 sections/.test(d.getElementById('readout-scope').textContent)
, `the count is the whole hand: ${words} words, 2 sections`);
const total = +d.getElementById('card-count').textContent;
d.getElementById('start-btn').click();
ok(ev('reviewMode') && ev('[...new Set(deck.map(c => c.subject))].sort().join()') === 'nouns,verbs' && ev('deck.length') === total && ev("deck.every(c => c.key.startsWith(c.subject + ':'))")
   && d.getElementById('app-title').textContent === 'La tua mano', `Start: one round of ${total} cards from both sections, each card in its own section`);
d.getElementById('change-btn').click();
ok(ev('subject') === 'verbs' && !ev('reviewMode') && cards().join() === 'nouns:tempo,verbs:freq1', 'afterwards, back on the verbs page, the hand as it was');
d.querySelector('#hand-fan [data-hand-remove="tempo"][data-section="nouns"]').click();
ok(cards().join() === 'verbs:freq1' && ev('subjectState.nouns.selected.size') === 0, '✕ on the nouns card, from the verbs page: Tempo leaves the hand');
d.getElementById('start-btn').click();
ok(!ev('reviewMode') && ev('deck.every(c => !c.subject)') && !d.querySelector('.direction-toggle').hidden, 'just this section: a round as before (its own direction toggle and all)');
d.getElementById('change-btn').click();

// ---- A spasso: the whole hand ----
d.querySelector('#subject-toggle [data-subject="nouns"]').click();
d.querySelector('.map-row[data-topic="corpo"] .map-add').click();
ev("chosenVoice = () => ({ name: 'Alice', lang: 'it-IT' });");
d.getElementById('passive-btn').click();
ok(d.getElementById('container').dataset.view === 'passive' && ev('[...new Set(passive.cards.map(c => c.subject))].sort().join()') === 'nouns,verbs', 'A spasso: the whole hand, nouns and verbs');
ev('stopPassive()');
ok(ev('subject') === 'nouns' && d.getElementById('container').dataset.view === 'setup' && cards().join() === 'verbs:freq1,nouns:corpo', '…and back on the nouns page, the hand as it was');

// ---- One direction for the whole hand ----
d.querySelector('#direction-toggle [data-direction="it-en"]').click();
d.querySelector('#subject-toggle [data-subject="verbs"]').click();
ok(ev('direction') === 'it-en' && d.querySelector('#direction-toggle [data-direction="it-en"]').classList.contains('active') && /Italian → English/.test(d.querySelector('#noun-map .map-eyebrow').textContent),
   'the direction is the hand\'s: IT → EN on the nouns page, IT → EN on the verbs page');
ev(`(() => { const s = loadSrs('nouns', 'it-en'); s.casa = { d: today() - 1, b: 1 }; localStorage.setItem(srsKey('nouns', 'it-en'), JSON.stringify(s)); renderRipasso(); })()`);
ok(!badge().hidden && badge().textContent === '1' && /\d+ due today/.test(d.getElementById('todo-items').textContent), 'cards due: a count on the bell, and Ripasso del giorno in its list — in the hand\'s direction');
const rs = d.getElementById('ripasso-start');
if (rs) { rs.click(); d.getElementById('change-btn').click(); }
ok(ev('direction') === 'it-en', 'a Ripasso round keeps its own direction: the hand\'s is still IT → EN afterwards');

// ---- Adjectives start empty; clear empties every section ----
B = boot({ 'flipcards-subject': 'adjectives' });
d = B.d; ev = B.ev;
ok(ev('selectedNouns.size') === 0 && d.getElementById('start-btn').disabled, 'adjectives start empty — the hand is shared by every section');
d.getElementById('select-all').click();
d.querySelector('#subject-toggle [data-subject="nouns"]').click();
d.querySelector('.map-row[data-topic="tempo"] .map-add').click();
d.querySelector('#hand [data-deck-clear]').click();
ok(ev('handSections().length') === 0 && ev('subjectState.adjectives.selected.size') === 0 && d.getElementById('start-btn').disabled, 'clear: the whole hand, every section');
ok(B.errors.length === 0, 'no errors along the way');

// ---- Ripasso del giorno and the saved deck, in the bell's list ----
B = boot({ 'flipcards-subject': 'nouns' });
d = B.d; ev = B.ev;
ev('renderRipasso();');
ok(!d.getElementById('ripasso-start') && d.getElementById('bell-count').hidden, 'nothing practised yet: no Start, no count on the bell');
ev(`(() => { const due = (sec, keys) => { const s = loadSrs(sec, 'en-it'); keys.forEach(k => s[k] = { d: today() - 1, b: 1 }); localStorage.setItem(srsKey(sec, 'en-it'), JSON.stringify(s)); };
  due('nouns', NOUN_THEMES.find(t => t.key === 'tempo').nouns.slice(0, 9)); due('verbs', ['parlare', 'capire']); renderRipasso(); })()`);
const list = () => d.getElementById('todo-items').textContent.replace(/\s+/g, ' ');
ok(/11 due today/.test(list()) && /9 nouns · 2 regular verbs/.test(list()) && d.getElementById('ripasso-start') && d.getElementById('bell-count').textContent === '1',
   'Ripasso del giorno: 11 due today, the breakdown and Start — the bell counts 1');
d.querySelector('.map-row[data-topic="tempo"] .map-add').click();
d.querySelector('.map-row[data-topic="corpo"] .map-add').click();
d.getElementById('start-btn').click();
ev('saveDeckNow()');
d.getElementById('change-btn').click();
const row = d.getElementById('saved-resume') && d.getElementById('saved-resume').closest('.todo-item');
ok(row && /Il mazzo salvato/.test(row.textContent) && /cards, not started/.test(row.textContent) && d.getElementById('bell-count').textContent === '2',
   'a saved round: Il mazzo salvato joins the list, with Riprendi — the bell counts 2');
d.getElementById('saved-forget').click();
ok(!d.getElementById('saved-resume') && d.getElementById('bell-count').textContent === '1', 'forget it: the saved deck leaves the list');
ok(B.errors.length === 0, 'no errors here either');
done();
