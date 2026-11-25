// Il mio italiano (Nov 2026): progress across every section, counted in words, not cards — a strip at the foot
// of the shared heading, and the full view behind Details. A word counts once, whatever section teaches it;
// understood = known in any direction, can say = known English → Italian; sentences add no words, but the words in
// a sentence you've got right count as used; grammar is a list of patterns, solid at 80% known English → Italian.
const { boot, ok, done } = require('./harness');

const B = boot({ 'flipcards-subject': 'nouns' });
const { d, ev } = B;
const strip = () => d.getElementById('italiano-strip').textContent.replace(/\s+/g, ' ').trim();
ok(B.errors.length === 0 && /^Il mio italiano/.test(strip()) && /Your words will gather here/.test(strip()) && !!d.getElementById('italiano-more'),
   'a fresh start: the strip says your words will gather here — no row of zeros');
ok(ev('italianoWords().length') > 1900 && ev("italianoWords().filter(w => w.id === 'rosso').length") === 1 && ev("italianoWords().find(w => w.id === 'rosso').refs.length") === 2,
   'every word once: rosso is one word, taught as a noun and an adjective');

// Known records: right 10 times out of 10, on 3 different days
const knowIt = (subj, dir, keys) => ev(`(() => {
  const k = SUBJECTS[${JSON.stringify(subj)}].statsKeys[${JSON.stringify(dir)}];
  const st = JSON.parse(localStorage.getItem(k) || '{}'), srs = JSON.parse(localStorage.getItem(k + ':srs') || '{}');
  for (const key of ${JSON.stringify(keys)}) { st[key] = { seen: 10, wrong: 0 }; srs[key] = { h: '1111111111', b: 3, rd: 3 }; }
  localStorage.setItem(k, JSON.stringify(st)); localStorage.setItem(k + ':srs', JSON.stringify(srs));
})()`);
knowIt('nouns', 'en-it', ['casa']);
knowIt('nouns', 'it-en', ['rosso']);
knowIt('adjectives', 'en-it', ['rosso']);
knowIt('adjectives', 'it-en', ['bello']);
knowIt('numeri', 'en-it', ['n20']);
knowIt('possessives', 'en-it', ev("SUBJECTS.possessives.themes[0].nouns"));
knowIt('sentences', 'en-it', ['bevo-un-caffe']);
ev('renderItalianoStrip()');
const s = ev('italianoStats()');
ok(s.understood === 4 && s.say === 3, `understood ${s.understood} (casa, rosso once — a noun one way, an adjective the other — bello, venti) — can say ${s.say} (casa, rosso, venti: the ones known English → Italian)`);
ok(s.cover > 0 && s.cover < s.ceiling && Math.abs(s.ceiling - 0.545) < 0.01, `everyday Italian: ${(s.cover * 100).toFixed(2)}% so far, of a possible ${(s.ceiling * 100).toFixed(1)}% with every word in Il Mazzo`);
ok(s.solid === 1 && s.patterns.length === 38 && s.patterns.find(x => x.state === 'solid').label === ev('SUBJECTS.possessives.themes[0].label'),
   `grammar: ${s.solid} of ${s.patterns.length} patterns solid — the Possessivi topic known in full`);
ok(s.used >= 2 && s.kinds.find(k => k.k === 'number words').n === 1, `"Bevo un caffè." got right: its words count as used (${s.used}) — and venti counts as a number word`);
ok(/4 words you understand/.test(strip()) && /3 you can say/.test(strip()) && /of everyday Italian/.test(strip()) && /this week/.test(strip()) && /1\/38 grammar patterns/.test(strip()),
   `the strip: ${strip().slice(0, 140)}…`);

// ---- The full view ----
d.getElementById('italiano-more').click();
const panel = d.getElementById('italiano-panel');
ok(!!panel && [...panel.querySelectorAll('h3')].map(h => h.textContent).join(' · ') === 'Words · How much Italian · Over time · Grammar' && panel.querySelector('.it-sheet').getAttribute('aria-modal') === 'true',
   'Details opens the full view: Words · How much Italian · Over time · Grammar');
ok(/of [\d,]+ in Il Mazzo/.test(panel.textContent) && /The 500 most common/.test(panel.textContent) && panel.querySelectorAll('.it-chip').length === 38 && panel.querySelectorAll('.it-chip.solid').length === 1,
   'every word in Il Mazzo, the milestones, and all 38 patterns — one solid');
ok(d.activeElement && d.activeElement.id === 'it-close', 'focus starts on its close button');
panel.dispatchEvent(new d.defaultView.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
ok(!d.getElementById('italiano-panel') && d.activeElement && d.activeElement.id === 'italiano-more', 'Escape closes it, back to Details');
ok(!/\b(sync|synced|syncing|offline)\b/i.test(strip()), 'and nothing in it speaks of syncing');

// ---- The slimmer heading ----
ok(d.querySelector('#hand .hand-count .hand-title').textContent === 'La tua mano' && !d.querySelector('#hand .hand-sub'), 'La tua mano: a label on the count\'s row, no subtitle');
ev("clearHand(); topicsIn([SUBJECTS.nouns.themes[0].key]); updateReadout();");
ok(/^▶ Start · \d+ cards?$/.test(d.getElementById('start-btn').textContent), `Start, shorter: ${d.getElementById('start-btn').textContent}`);
ok(B.errors.length === 0, 'no errors');
done();
