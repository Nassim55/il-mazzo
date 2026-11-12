// The top of the page (Nov 2026): Il Mazzo's masthead; the sections in three families, then the open
// family's sections; and the table — three tabs: La tua mano (one hand for every section), Ripasso del
// giorno, Il mazzo salvato. Start and A spasso play one section as before, several as one mixed round.
const { boot, ok, done } = require('./harness');

let B = boot({ 'flipcards-subject': 'nouns' });
let d = B.d, ev = B.ev;
const order = [...d.querySelectorAll('.setup-top-inner > *')].map(e => e.className.split(' ')[0]);
ok(order.join() === 'masthead,sections,table' && /Il Mazzo/.test(d.querySelector('.masthead').textContent)
   && d.getElementById('setup-top').compareDocumentPosition(d.getElementById('app-title')) & 4, `Il Mazzo on top, then the sections, then the table — then the section's own title (${order.join(' → ')})`);
const fams = [...d.querySelectorAll('.sections .family .family-name')].map(e => e.textContent);
const shown = () => [...d.querySelectorAll('#subject-toggle .mode-option:not([hidden])')].map(b => b.textContent.trim());
ok(fams.join('|') === 'Parole|Verbi|Frasi e storie' && d.querySelector('.family[data-family="parole"]').classList.contains('active')
   && shown().join('|') === 'Sostantivi|Aggettivi|Avverbi e congiunzioni|Possessivi|Preposizioni', `three families; Parole open, with its five sections (${shown().join(', ')})`);
d.querySelector('.family[data-family="verbi"]').click();
ok(ev('subject') === 'verbs' && shown().join('|') === 'Regolari|Irregolari|Al contrario', 'Verbi: its first section, and its three');
d.querySelector('#subject-toggle [data-subject="mipiace"]').click();
d.querySelector('.family[data-family="frasi"]').click();
ok(ev('subject') === 'phrases' && shown().join('|') === 'Frasi|Scrittura|Dialoghi|Racconto', 'Frasi e storie: Frasi, Scrittura, Dialoghi, Racconto');
d.querySelector('.family[data-family="verbi"]').click();
ok(ev('subject') === 'mipiace', 'back to Verbi: the section you last used there (Al contrario)');
d.querySelector('.family[data-family="parole"]').click();

// ---- The tabs ----
const tabs = () => [...d.querySelectorAll('#table-tabs .table-tab')].map(t => t.dataset.tableTab);
ok(tabs().join() === 'hand,ripasso' && !d.getElementById('table-hand').hidden && d.getElementById('table-ripasso').hidden, 'La tua mano and Ripasso del giorno — the hand open; no saved deck, no third tab');
d.querySelector('[data-table-tab="ripasso"]').click();
ok(d.getElementById('table-hand').hidden && !d.getElementById('table-ripasso').hidden && d.getElementById('table-ripasso').contains(d.getElementById('ripasso')), 'the Ripasso tab: Ripasso del giorno, as it was');
ok(B.w.localStorage.getItem('mazzo-table-tab') === 'ripasso', '…and the tab is remembered');
d.querySelector('[data-table-tab="hand"]').click();

// ---- One hand, every section ----
d.querySelector('.map-row[data-topic="tempo"] .map-add').click();
d.querySelector('#subject-toggle [data-subject="verbs"]').click();
d.querySelector('.map-row[data-topic="are"] .map-add').click();
const cards = () => [...d.querySelectorAll('#hand-fan .hand-card[data-topic]')].map(c => `${c.dataset.section}:${c.dataset.topic}`);
const words = ev("NOUN_THEMES.find(t => t.key === 'tempo').nouns.length") + ev("SUBJECTS.verbs.themes.find(t => t.key === 'are').nouns.length");
ok(cards().join() === 'nouns:tempo,verbs:are' && /Sostantivi/.test(d.querySelector('#hand-fan [data-topic="tempo"] .hand-sect').textContent) && /Verbi regolari/.test(d.querySelector('#hand-fan [data-topic="are"] .hand-sect').textContent),
   'on the verbs page, the hand holds Tempo (Sostantivi) and -are (Verbi regolari), each card tagged with its section');
ok(d.getElementById('selected-count').textContent === String(words) && d.getElementById('hand-words').textContent === 'words' && /2 sections/.test(d.getElementById('readout-scope').textContent)
   && new RegExp(`${words} words · 2 sections`).test(d.querySelector('[data-table-tab="hand"] .table-tab-sub').textContent), `the count is the whole hand: ${words} words, 2 sections — the tab says so too`);
const total = +d.getElementById('card-count').textContent;
d.getElementById('start-btn').click();
ok(ev('reviewMode') && ev('[...new Set(deck.map(c => c.subject))].sort().join()') === 'nouns,verbs' && ev('deck.length') === total && ev("deck.every(c => c.key.startsWith(c.subject + ':'))")
   && d.getElementById('app-title').textContent === 'La tua mano', `Start: one round of ${total} cards from both sections, each card in its own section`);
d.getElementById('change-btn').click();
ok(ev('subject') === 'verbs' && !ev('reviewMode') && cards().join() === 'nouns:tempo,verbs:are', 'afterwards, back on the verbs page, the hand as it was');
d.querySelector('#hand-fan [data-hand-remove="tempo"][data-section="nouns"]').click();
ok(cards().join() === 'verbs:are' && ev('subjectState.nouns.selected.size') === 0, '✕ on the nouns card, from the verbs page: Tempo leaves the hand');
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
ok(ev('subject') === 'nouns' && d.getElementById('container').dataset.view === 'setup' && cards().join() === 'verbs:are,nouns:corpo', '…and back on the nouns page, the hand as it was');

// ---- One direction for the whole hand ----
d.querySelector('#direction-toggle [data-direction="it-en"]').click();
d.querySelector('#subject-toggle [data-subject="verbs"]').click();
ok(ev('direction') === 'it-en' && d.querySelector('#direction-toggle [data-direction="it-en"]').classList.contains('active') && /Italian → English/.test(d.querySelector('#noun-map .map-eyebrow').textContent),
   'the direction is the hand\'s: IT → EN on the nouns page, IT → EN on the verbs page');
ev("ripassoDir = 'en-it';");
d.querySelector('[data-table-tab="ripasso"]').click();
ev(`(() => { const s = loadSrs('nouns', 'en-it'); s.casa = { d: today() - 1, b: 1 }; localStorage.setItem(srsKey('nouns', 'en-it'), JSON.stringify(s)); renderRipasso(); })()`);
ok(d.querySelector('[data-table-tab="ripasso"] .table-dot') && /\d+ due today/.test(d.querySelector('[data-table-tab="ripasso"] .table-tab-sub').textContent), 'cards due: a dot on the Ripasso tab');
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
done();
