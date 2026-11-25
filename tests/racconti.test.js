// Racconti (Nov 2026): a family of its own, with an Indice of stories. In the reader, a tap on a word you don't know
// marks it at once — saved there and then, no button, no wait — shows its meaning and makes it a card (its dictionary
// form, the story's sentence as its example). Nov 25: a tap only shows the meaning; Segna, in the word's box, marks it.
// A tap anywhere else closes the box. Marks fade as the card is learnt, and are gone once it's known. A
// marked deck word keeps the deck's key, so practising it anywhere counts (ripasso-anywhere tests that).
const { boot, ok, done } = require('./harness');
const B = boot({ 'flipcards-subject': 'racconti' });
const { d, ev } = B;
const stored = () => JSON.parse(B.w.localStorage.getItem('mazzo-racconti-words-v1') || '{}');

// ---- The section, its family, and the old story gone ----
ok(B.errors.length === 0 && B.warns.length === 0, `loads with no errors and no data warnings ${B.warns.join(' ')}`);
ok(ev("FAMILIES.map(f => f.name).join('|')") === 'Parole|Grammatica|Frasi e dialoghi|Racconti' && ev("FAMILIES.find(f => f.key === 'racconti').sections.join()") === 'racconti'
   && !ev("'story' in SUBJECTS") && !ev("[...syncedKeys().keys()].some(k => /racconto-stats|mazzo-story/.test(k))"),
   'Racconti is a family of its own; the old Racconto (La casa di pietra) is gone, and nothing of it syncs');
ok(ev("RACCONTI.every(s => s.paragraphs.every(p => p === '---' || storySegments(s, p).every(sg => !sg.unknown)))"), 'every word of every story reads as something — a deck word, a small word, a name, or the story\'s own');

// ---- The Indice ----
ok(!!d.querySelector('.rc-home') && d.querySelectorAll('.rc-entry').length === ev('RACCONTI.length') && /Il treno per Fontanella/.test(d.querySelector('.rc-entry-title').textContent)
   && /A1 · 1,1\d\d words · about 10 minutes/.test(d.querySelector('.rc-entry-meta').textContent) && /Leggi/.test(d.querySelector('.rc-entry .story-read-btn').textContent)
   && /No words yet/.test(d.querySelector('.rc-home').textContent), `the Indice: ${d.querySelector('.rc-entry-meta').textContent} — and no words yet`);

// ---- Reading, and marking ----
d.querySelector('.rc-entry [data-open]').click();
const words = () => [...d.querySelectorAll('.rc-w')];
const word = f => words().find(w => w.dataset.f === f);
const pop = () => d.getElementById('rc-pop');
const tap = f => { if (!pop().hidden) d.body.click(); word(f).click(); };   // like a reader: tap away to close a box, then tap the word
const mark = f => { tap(f); pop().querySelector('[data-pop="mark"]').click(); };   // …and press Segna
ok(d.querySelector('.container').dataset.view === 'racconto' && d.querySelectorAll('.rc-para').length > 50 && words().length > 1000 && !!d.querySelector('.rc-break') && !!d.querySelector('.rc-first'),
   `the reader: ${d.querySelectorAll('.rc-para').length} paragraphs, ${words().length} words to tap, a drop cap and the section break`);
word('binario').click();
ok(!pop().hidden && /il binario/.test(pop().textContent) && /Not in your words yet/.test(pop().textContent) && !!pop().querySelector('[data-pop="mark"]')
   && !stored().binario && !word('binario').classList.contains('is-marked'), 'a tap on binario shows what it means, with Segna — but marks nothing');
pop().querySelector('[data-pop="mark"]').click();
const rec = stored().binario;
ok(rec && rec.on === 1 && rec.ref === 'nouns:binario' && rec.story === 'fontanella' && word('binario').classList.contains('is-marked'),
   'Segna: binario is marked, and already saved — nothing more to press, nothing to wait for');
const item = ev("RACCONTI_ITEMS.find(n => n.noun === 'binario')");
ok(item && item.it === 'il binario' && /platform/.test(item.en) && item.example[0] === 'Pago e vado al binario quattro.',
   `its card: ${item && item.it} — ${item && item.en}, with the story's sentence: “${item && item.example[0]}”`);
ok(/il binario/.test(pop().textContent) && /Marked/.test(pop().textContent) && !pop().hidden && !!pop().querySelector('[data-pop="unmark"]'), 'its box says so, and offers Togli instead');

// ---- Nov 25: a tap anywhere closes the box ----
d.querySelector('.rc-title').click();
ok(pop().hidden, 'a tap anywhere on the page closes the box — no need for its ×');
word('binario').click();
word('treno').click();
ok(pop().hidden && !stored().treno && !word('treno').classList.contains('is-marked'), 'with the box open, a tap on another word only closes it — it doesn\'t open that word\'s box, and marks nothing');
word('binario').click();
ev('raccontoSpeakPara = i => { window.__para = i; };');
d.querySelector('.rc-para[data-p="3"] .rc-listen').click();
ok(pop().hidden && ev('window.__para') === 3, 'a button still does its job (here a paragraph read aloud) — and the box closes too');
word('binario').click();
d.dispatchEvent(new B.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
ok(pop().hidden, 'Esc closes it from anywhere');
mark('treno');
ok(words().filter(w => w.dataset.f.toLowerCase() === 'treno').every(w => w.classList.contains('is-marked')) && words().filter(w => w.dataset.f.toLowerCase() === 'treno').length >= 5,
   'marking treno marks it everywhere it appears in the story');
mark('prendo');
const verb = ev("RACCONTI_ITEMS.find(n => n.noun === 'prendere')");
ok(verb && verb.it === 'prendere' && verb.exampleWord === 'prendo' && /io prendo/.test(d.getElementById('rc-pop').textContent), `a verb: prendo → its card is prendere, the example bolding prendo; the meaning shows “io prendo”`);
tap('Rosa');
ok(!stored().rosa && !stored()['name-rosa'] && /A name/.test(pop().textContent) && !pop().querySelector('[data-pop="mark"]'), 'a name (Rosa) shows what it is — with no Segna: it never goes into your deck');
ok(d.getElementById('rc-count').textContent === '3' && !d.getElementById('rc-practise').hidden, 'Ripassa · 3 in the bar');

// ---- Taking a mark off ----
tap('treno');
d.querySelector('#rc-pop [data-pop="unmark"]').click();
ok(stored().treno.on === 0 && !ev("RACCONTI_ITEMS.some(n => n.noun === 'treno')") && !word('treno').classList.contains('is-marked') && d.getElementById('rc-count').textContent === '2',
   'Togli: the mark comes off at once — kept as switched off, so an older mark on another device can\'t bring it back');
const merged = ev(`syncMergeLatest(null, { treno: { on: 0, at: 200 } }, { treno: { on: 1, at: 100 }, cane: { on: 1, at: 150 } })`);
ok(merged.treno.on === 0 && merged.cane.on === 1, 'syncing: each word keeps its newer mark or unmark, from either device');

// ---- Fading as you learn ----
const learnt = (key, h, rd) => ev(`(() => { const k = SUBJECTS.racconti.statsKeys['it-en'], st = JSON.parse(localStorage.getItem(k) || '{}'), srs = JSON.parse(localStorage.getItem(k + ':srs') || '{}');
  st[${JSON.stringify(key)}] = { seen: ${h.length}, wrong: ${(h.match(/0/g) || []).length} }; srs[${JSON.stringify(key)}] = { h: ${JSON.stringify(h)}, b: 3, rd: ${rd} };
  localStorage.setItem(k, JSON.stringify(st)); localStorage.setItem(k + ':srs', JSON.stringify(srs)); })()`);
const alpha = f => parseFloat(word(f).style.getPropertyValue('--a') || '0');
const fresh = alpha('prendo');
learnt('binario', '11011', 1);
learnt('prendere', '1111111111', 3);
ev('raccontoRepaint()');
ok(word('binario').classList.contains('is-marked') && alpha('binario') < fresh && alpha('binario') > 0, `half learnt: binario's mark fades (${fresh} → ${alpha('binario')})`);
ok(word('prendo').classList.contains('is-learnt') && !word('prendo').classList.contains('is-marked') && !word('prendo').style.getPropertyValue('--a'),
   'known: prendo\'s mark is gone');
ok(d.getElementById('rc-count').textContent === '1', 'and Ripassa counts only what you\'re still learning');

// ---- Ripassa ----
ev("selectedNouns = new Set(['binario']);");
const keep = ev('[...selectedNouns].sort().join()');
d.getElementById('rc-practise').click();
ok(d.querySelector('.container').dataset.view === 'game' && ev('deck.map(c => c.noun).join()') === 'binario' && ev('subject') === 'racconti',
   'Ripassa: a round of exactly the words still being learnt');
ok(ev('[...selectedNouns].sort().join()') === keep, 'and the section\'s own choice of words is left as it was');
ok(d.querySelector('#feedback') !== null && ev('deck[index].example[0]') === 'Pago e vado al binario quattro.' && ev('deck[index].exampleWord') === 'binario', 'its card carries the sentence you met it in');

// ---- The Indice, afterwards ----
ev('showSetup()');
ok(d.querySelectorAll('.rc-chip').length === 2 && d.querySelector('.rc-chip.is-learnt') && /2 marked, 1 learnt/.test(d.querySelector('.rc-entry-meta').textContent),
   `Le tue parole: ${[...d.querySelectorAll('.rc-chip-it')].map(x => x.textContent).join(', ')} — ${d.querySelector('.rc-entry-meta').textContent}`);
ok(B.errors.length === 0, 'no errors');
done();
