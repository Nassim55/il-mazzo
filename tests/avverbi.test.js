// Avverbi e congiunzioni — the little words: when, where, how much, how; yes, no and maybe;
// question words; and, but, or; the words that link two clauses. A word section like the
// others: La mappa, the known score, Ripasso — with a chart of where they go and the traps.
const { boot, ok, done } = require('./harness');

let B = boot({ 'flipcards-subject': 'avverbi' });
const { d, ev } = B;
ok(B.errors.length === 0 && B.warns.length === 0, 'loads cleanly — every word ranked and in a topic, no English prompt or Italian word twice');
const tabs = [...d.querySelectorAll('#subject-toggle .mode-option')].map(b => b.textContent.trim());
ok(tabs.length === 12 && tabs[5] === 'Avverbi e congiunzioni' && tabs[4] === 'Aggettivi' && d.getElementById('app-title').textContent === 'Avverbi e congiunzioni', 'a section of its own, after Aggettivi');
ok(ev('AVV_ITEMS.length') === 112 && ev('AVV_ORDER.length') === 112 && ev('AVV_ORDER.slice(0, 4).join()') === 'e,non,che-cong,ma', `112 words, most common first (${ev('AVV_ORDER.slice(0, 6).map(k => AVV_ITEMS.find(n => n.noun === k).it).join(", ")')}…)`);
const map = d.getElementById('noun-map');
ok(map.querySelectorAll('.map-row').length === 9 && ['tempo', 'luogo', 'quantita', 'modo', 'certezza', 'discorso', 'domande', 'unire', 'collegare'].every(k => map.querySelector(`.map-row[data-topic="${k}"]`)),
   'La mappa, a line per topic: time, place, amount, manner, yes/no/maybe, talking it through, questions, and/but/or, linking clauses');
ok(d.querySelector('#map-panel .map-chart .endings-title').textContent === 'Le parole piccole' && /Non comes first/.test(d.getElementById('map-panel').textContent) && /An accent changes the word/.test(d.getElementById('map-panel').textContent),
   'its chart in the panel: where they go, and the traps');

// ---- Answers ----
const chk = (k, guess, itToEn = false) => B.w.eval(`checkPhraseAnswer(${JSON.stringify(guess)}, cardsForItem(AVV_ITEMS.find(n => n.noun === ${JSON.stringify(k)}))[0], ${itToEn}).correct`);
ok(chk('adesso', 'ora') && chk('qui', 'qua') && chk('solo-avv', 'soltanto') && chk('neanche', 'nemmeno') && chk('e', 'ed') && chk('quindi', 'dunque') && chk('o', 'oppure'),
   'where two words mean the same, either is right: adesso/ora, qui/qua, solo/soltanto, neanche/nemmeno, e/ed, quindi/dunque, o/oppure');
ok(chk('perché', 'perche') && chk('più', 'piu') && chk('anche-se', 'anche se'), 'accents don\'t count; two-word ones work');
ok(!chk('dopo', 'poi') && !chk('ma', 'però') && !chk('lì', 'qui'), 'near misses don\'t pass: poi for dopo, però for ma');
ok(chk('ancora', 'still', true) && chk('ancora', 'again', true) && chk('più', 'no longer', true) && chk('affatto', 'at all', true) && !chk('ancora', 'already', true),
   'Italian → English: any of its senses — ancora is still, yet, again; not already');
ev("selectedNouns = new Set(['finché']); updateReadout();");
d.getElementById('start-btn').click();
d.getElementById('answer').value = 'finche'; d.getElementById('submit').click();
ok(/aspetto finché non arrivi/.test(d.getElementById('feedback').textContent), 'after answering, its note: where it comes from, and an example');

// ---- Ripasso: small words; the right twins ----
B = boot({ 'flipcards-subject': 'avverbi', 'avverbi-stats-v1': JSON.stringify({ sempre: { seen: 4, wrong: 2 } }) });
ok(/1 small word/.test(B.d.getElementById('ripasso').textContent) && B.ev("dueList('en-it').some(x => x.subj === 'avverbi' && x.n.noun === 'sempre')"), 'a due word comes back in Ripasso: "1 small word"');
B = boot({ 'flipcards-subject': 'avverbi', 'sostantivi-stats-v1': JSON.stringify({ piano: { seen: 3, wrong: 0 } }), 'racconto-stats-v1': JSON.stringify({ spesso: { seen: 2, wrong: 1 } }) });
const pianoBefore = JSON.stringify(B.ev("seedSrs('nouns', 'en-it').piano"));
B.ev("selectedNouns = new Set(['piano-avv', 'spesso']); updateReadout();");
B.d.getElementById('start-btn').click();
for (let i = 0; i < 2; i++) { B.d.getElementById('answer').value = B.ev('deck[index].italian'); B.d.getElementById('submit').click(); B.d.getElementById('submit').click(); }
ok(JSON.stringify(B.ev("loadSrs('nouns', 'en-it').piano")) === pianoBefore, 'piano, softly, keeps its own schedule — not the floor\'s');
ok(B.ev("loadSrs('story', 'en-it').spesso.l") === B.ev('today()'), 'spesso counts for the story\'s spesso too — the same word');

// ---- Known, on the map ----
B = boot({ 'flipcards-subject': 'avverbi' });
B.ev("for (let i = 0; i < 5; i++) srsAnswer('avverbi', 'en-it', 'sempre', true); document.getElementById('noun-map').innerHTML = nounMapInner();");
ok(B.d.querySelector('.map-row[data-topic="tempo"] .map-cell.known') && /^sempre — always: /.test(B.d.querySelector('.map-row[data-topic="tempo"] .map-cell.known').title), 'right 5 times: sempre is known, dotted on the map');
ok(['avverbi-stats-v1', 'avverbi-stats-iten-v1', 'avverbi-stats-listen-v1', 'avverbi-stats-v1:srs', 'avverbi-assoc-v1'].every(k => B.ev(`syncedKeys().has(${JSON.stringify(k)})`)), 'its progress syncs');
ok(B.errors.length === 0, 'no errors along the way');
done();
