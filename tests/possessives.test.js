// Possessivi: my, your, his, her, our, their — English in, Italian out. Pairs, singular then
// plural, like the articolate; a chart of every form; a note after each answer saying what
// the possessive agrees with; and Why for each kind of slip: the thing's form, the owner's
// word, the article (and none for one family member), loro that never changes.
const { boot, ok, done } = require('./harness');

let B = boot({ 'flipcards-subject': 'possessives' });
const { d, ev } = B;
ok(B.errors.length === 0 && B.warns.length === 0, 'loads cleanly — every word of every accepted answer in the deck, no phrase or English prompt twice');
const tabs = [...d.querySelectorAll('#subject-toggle .mode-option')].map(b => b.textContent.trim());
ok(tabs.length === 11 && tabs[5] === 'Possessivi' && tabs[4] === 'Aggettivi' && tabs[6] === 'Preposizioni' && d.getElementById('app-title').textContent === 'Possessivi',
   'a section of its own, after Aggettivi');
ok(ev('POSS_ITEMS.length') === 71 && ev('POSS_ITEMS.filter(n => n.pl).length') === 46 && ev('POSS_ITEMS.flatMap(cardsForItem).length') === 117,
   '71 phrases — 46 of them singular/plural pairs — 117 cards');
const groups = [...d.querySelectorAll('#theme-chips .theme-group')].map(g => g.querySelector('.theme-group-btn').textContent + ': ' + g.querySelectorAll('.theme-chip').length);
ok(groups.join(' · ') === 'Di chi?: 7 · Casi speciali: 4', `the themes: one per owner (mio … loro, and formal Suo), then the special cases (${groups.join(' · ')})`);

// ---- The chart ----
const chart = d.querySelector('.poss-panel');
const cells = [...chart.querySelectorAll('.eg-poss .eg-cell')].map(c => c.textContent.trim());
ok(cells.length === 24 && cells.slice(0, 4).join(',') === 'il mio,la mia,i miei,le mie' && cells.slice(20).join(',') === 'il loro,la loro,i loro,le loro'
   && ['It agrees with the thing', 'With the article', 'Family', 'Loro never changes', 'Your, formally', 'Mine, yours'].every(h => chart.textContent.includes(h)),
   'the chart: every form with its article, io to loro, and the rules beside it');
ok(ev("CHART_TITLES.possessives") === 'I possessivi', 'and in a round, ▦ I possessivi opens it');

// ---- Singular, plural or both: its own setting ----
d.querySelector('#number-toggle [data-num="pl"]').click();
ok(JSON.stringify(JSON.parse(B.w.localStorage.getItem('mazzo-verb-persons-v1')).possessivi) === '["sg"]' && !('prepositions' in JSON.parse(B.w.localStorage.getItem('mazzo-verb-persons-v1')))
   && ev('POSS_ITEMS.flatMap(cardsForItem).length') === 71, 'Singolare only: one card a phrase — kept for this section, Preposizioni\'s setting untouched');
d.querySelector('#number-toggle [data-num="pl"]').click();

// ---- A pair: the singular, then its plural ----
B = boot({ 'flipcards-subject': 'possessives' });
B.ev("selectedNouns = new Set([POSS_ITEMS.find(n => n.it === 'mia sorella').noun]); updateReadout();");
B.d.getElementById('start-btn').click();
ok(B.ev('deck.map(c => c.italian).join(" | ")') === 'mia sorella | le mie sorelle', 'a pair is dealt together: mia sorella, then le mie sorelle');
ok(B.d.getElementById('pronoun-hint').textContent === '+ possessivo', 'the card says what it drills: + possessivo');
const answer = (s) => { B.d.getElementById('answer').value = s; B.d.getElementById('submit').click(); };
answer('mia sorella');
const fb = () => B.d.getElementById('feedback').textContent.replace(/\s+/g, ' ');
ok(/No article one family member: mia sorella/.test(fb()) && /Word for word my sister/.test(fb()), 'after answering: why there\'s no article, and word for word');
B.d.getElementById('submit').click();
answer('le mie sorelle');
ok(/The article is back in the plural: le mie sorelle/.test(fb()), '…and why it\'s back in the plural');

// ---- Checking, and Why ----
const why = (it, typed) => {
  B.w.__c = B.ev(`(() => { const n = POSS_ITEMS.find(n => n.it === ${JSON.stringify(it)} || (n.pl && n.pl.it === ${JSON.stringify(it)})); return cardsForItem(n).find(c => c.italian === ${JSON.stringify(it)}); })()`);
  if (B.ev(`checkCard(${JSON.stringify(typed)}, window.__c, false).correct`)) return 'accepted';
  return B.ev(`sentenceWhy(${JSON.stringify(typed)}, window.__c)`).map(s => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ')).join(' / ');
};
ok(why('il Suo biglietto', 'il suo biglietto') === 'accepted' && why('Il libro è mio.', 'Il libro è il mio.') === 'accepted' && why('i loro cani', 'I loro cani') === 'accepted',
   'accepted: suo in lower case for the formal Suo; è il mio as well as è mio');
ok(/^suo, not sua: it agrees with il suo libro, masculine singular — not with the owner: suo · sua · suoi · sue\.$/.test(why('il suo libro', 'il sua libro')),
   '"her book" as il sua libro: it agrees with libro, not with her');
ok(/mie, not miei: it agrees with le mie chiavi, feminine plural/.test(why('le mie chiavi', 'le miei chiavi')), '…and in the plural: le mie chiavi');
ok(/^tuo, not suo: tuo is your \(tu\); suo is his, her or its/.test(why('il tuo cane', 'il suo cane')), 'the wrong owner: tuo is your (tu), suo is his or hers');
ok(/^No article with one family member: mia sorella — it comes back in the plural/.test(why('mia sorella', 'la mia sorella')), 'la mia sorella: no article with one family member');
ok(/^Don't drop the article: il mio libro — possessives take the article/.test(why('il mio libro', 'mio libro')), 'mio libro: possessives take the article');
ok(/^Don't drop the article: i loro cani — loro always takes it/.test(why('i loro cani', 'loro cani')) && /loro never changes/.test(why('la loro casa', 'la lora casa')),
   'loro: always the article, and never another ending');
ok(/nella = in \+ la/.test(why('nella mia borsa', 'in la mia borsa')), 'with a preposition: in + la → nella');

// ---- The notes, the words, sync, Ripasso ----
const note = it => B.ev(`(() => { const n = POSS_ITEMS.find(n => n.it === ${JSON.stringify(it)}); return n.note; })()`).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
ok(/^Agreement suo agrees with libro , masculine singular — not with the owner: his or hers, the same word/.test(note('il suo libro'))
   && /^Loro never changes — the article shows the gender and number: il loro cane/.test(note('il loro cane'))
   && /^In una parola in \+ la → nella Agreement mia agrees with borsa/.test(note('nella mia borsa')) && /^After the noun/.test(note('a casa mia')),
   'each note says what the possessive agrees with — or why there\'s no article, or how the preposition joins');
ok(['nostro', 'vostre', 'sua', 'tue'].every(w => B.ev(`sentWordInfo(${JSON.stringify(w)}, 'la').kind`) === 'poss') && B.ev("sentWordInfo('loro', 'il').owner") === 'loro' && B.ev("sentWordInfo('loro', 'a').kind") !== 'poss',
   'every form is known as a possessive — loro only after an article (a loro is "to them")');
ok(B.ev("syncedKeys().get('possessivi-stats-v1')") === 'counters' && B.ev("syncedKeys().get('possessivi-assoc-v1')") === 'assoc' && B.ev("REVIEW_LABEL.possessives") === 'possessive',
   'its progress syncs, and Ripasso counts it like any section');
ok(B.errors.length === 0, 'no errors along the way');
done();
