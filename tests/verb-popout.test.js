// Verbi irregolari: resting on a verb's tile shows its six present forms in a popout, the
// ones that break the regular pattern highlighted (contracted infinitives compared with
// the stem their present is built on). Keyboard focus and a long press show it too.
const { boot, ok, done } = require('./harness');

const wait = (B, ms = 15) => new Promise(r => B.w.setTimeout(r, ms));
const chip = (B, k) => B.d.querySelector(`.verb-chip[data-noun="${k}"]`);
const pop = B => B.d.getElementById('conj-pop');
const shown = B => !!pop(B) && !pop(B).hidden;
const over = (B, k) => chip(B, k).dispatchEvent(new B.w.MouseEvent('mouseover', { bubbles: true }));
const out = (B, k) => chip(B, k).dispatchEvent(new B.w.MouseEvent('mouseout', { bubbles: true, relatedTarget: B.d.body }));
const touch = (B, el, type, x = 0, y = 0) => {
  const e = new B.w.Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(e, 'touches', { value: type === 'touchend' ? [] : [{ clientX: x, clientY: y }] });
  el.dispatchEvent(e);
};
const highlighted = B => [...pop(B).querySelectorAll('.conj-pop-forms .conj-irr')].map(s => s.textContent);
const boot2 = subj => { const B = boot({ 'flipcards-subject': subj }); B.ev('CONJ_POP.delay = 1; CONJ_POP.longPress = 25;'); return B; };

(async () => {
  // ---- Resting on a tile ----
  let B = boot2('irregular');
  over(B, 'andare'); await wait(B);
  ok(shown(B), 'resting on an irregular verb\'s tile opens a popout');
  const rows = [...pop(B).querySelectorAll('.conj-pop-forms tr')].map(r => r.querySelector('th').textContent + ': ' + r.querySelector('td').textContent);
  ok(pop(B).querySelector('.conj-pop-inf').textContent === 'andare' && pop(B).querySelector('.conj-pop-en').textContent === 'to go'
     && rows.join(' | ') === 'io: vado | tu: vai | lui / lei: va | noi: andiamo | voi: andate | loro: vanno', 'its six present forms, with their pronouns');
  ok(highlighted(B).join(' ') === 'vado vai va vanno' && /breaks the regular -are pattern/.test(pop(B).querySelector('.conj-pop-key').textContent),
     'the forms that break the regular -are pattern highlighted (vado, vai, va, vanno — not andiamo, andate)');
  ok(chip(B, 'andare').getAttribute('aria-describedby') === 'conj-pop' && pop(B).getAttribute('role') === 'tooltip', 'screen readers hear it as the tile\'s description');
  out(B, 'andare');
  ok(!shown(B) && !chip(B, 'andare').hasAttribute('aria-describedby'), 'moving off the tile closes it');
  over(B, 'essere'); out(B, 'essere'); await wait(B);
  ok(!shown(B), 'sweeping across the grid flashes nothing: it waits a moment first');

  // ---- What it highlights ----
  const breaks = k => B.ev(`(() => { const v = irregularVerbData.find(x => x.it === ${JSON.stringify(k)}); const b = conjBreaks(v); return personOrder.filter((p, i) => b[i]).map(p => v.conj[p]).join(' '); })()`);
  ok(breaks('essere') === 'sono sei è siamo siete sono' && breaks('avere') === 'ho hai ha abbiamo hanno' && breaks('dare') === 'dai dà danno'
     && breaks('uscire') === 'esco esci esce escono' && breaks('dovere') === 'devo devi deve dobbiamo devono',
     'essere breaks everywhere; avere all but avete; dare at dai, dà, danno; uscire at esc-; dovere all but dovete');
  over(B, 'proporre'); await wait(B);
  ok(highlighted(B).join(' ') === 'propongo propongono' && /Built on the stem propon-, with -ere endings — highlighted, where it breaks even that/.test(pop(B).querySelector('.conj-pop-key').textContent),
     'a contracted infinitive is compared with the stem its present is built on: proporre, on propon-');
  out(B, 'proporre');
  over(B, 'produrre'); await wait(B);
  ok(highlighted(B).length === 0 && pop(B).querySelector('.conj-pop-key').textContent === 'Built on the stem produc-, with -ere endings.', '…produrre on produc-, where nothing else breaks');
  out(B, 'produrre');
  over(B, 'dire'); await wait(B);
  ok(highlighted(B).join(' ') === 'dite' && /stem dic-/.test(pop(B).textContent), 'dire, on dic-: only dite breaks even that');
  out(B, 'dire');
  ok(B.ev("conjPattern('cercare').plain.join(' ')") === 'cerco cerchi cerca cerchiamo cercate cercano' && B.ev("conjPattern('mangiare').plain.join(' ')") === 'mangio mangi mangia mangiamo mangiate mangiano'
     && B.ev("conjBreaks({ it: 'finire', conj: { io: 'finisco', tu: 'finisci', lui: 'finisce', noi: 'finiamo', voi: 'finite', loro: 'finiscono' } }).some(Boolean)") === false,
     'the regular pattern knows its spelling rules (cerchi, mangi) and both -ire patterns (finisco is regular)');

  // ---- Not while painting a selection ----
  chip(B, 'essere').dispatchEvent(new B.w.MouseEvent('mousedown', { bubbles: true, button: 0 }));
  chip(B, 'avere').dispatchEvent(new B.w.MouseEvent('mouseover', { bubbles: true, buttons: 1 }));
  await wait(B);
  ok(!shown(B) && B.ev('dragMode') !== null, 'click and drag paints the selection, with no popouts in the way');
  B.d.dispatchEvent(new B.w.MouseEvent('mouseup', { bubbles: true }));

  // ---- Keyboard ----
  B = boot2('irregular');
  chip(B, 'venire').dispatchEvent(new B.w.FocusEvent('focusin', { bubbles: true })); await wait(B);
  ok(shown(B) && pop(B).querySelector('.conj-pop-inf').textContent === 'venire', 'tabbing to a tile shows its forms too');
  chip(B, 'venire').dispatchEvent(new B.w.FocusEvent('focusout', { bubbles: true, relatedTarget: B.d.body }));
  ok(!shown(B), '…and tabbing away closes them');
  chip(B, 'stare').dispatchEvent(new B.w.MouseEvent('mousedown', { bubbles: true, button: 0 }));
  chip(B, 'stare').dispatchEvent(new B.w.FocusEvent('focusin', { bubbles: true })); await wait(B);
  B.d.dispatchEvent(new B.w.MouseEvent('mouseup', { bubbles: true }));
  ok(!shown(B), 'the focus a click brings doesn\'t open it (the click is choosing the tile)');

  // ---- A long press on a phone ----
  B = boot2('irregular');
  const was = B.ev("selectedNouns.has('fare')");
  touch(B, chip(B, 'fare'), 'touchstart', 50, 50); await wait(B, 40);
  ok(shown(B) && pop(B).querySelector('.conj-pop-inf').textContent === 'fare', 'a long press on a phone opens the forms');
  touch(B, chip(B, 'fare'), 'touchend');
  chip(B, 'fare').dispatchEvent(new B.w.MouseEvent('mousedown', { bubbles: true, button: 0 }));   // what a phone may send after it
  B.d.dispatchEvent(new B.w.MouseEvent('mouseup', { bubbles: true }));
  ok(B.ev("selectedNouns.has('fare')") === was && shown(B), '…without toggling the tile, and stays open to read');
  touch(B, B.d.body, 'touchstart', 300, 300);
  ok(!shown(B), 'a touch anywhere else closes it');
  touch(B, chip(B, 'dare'), 'touchstart', 50, 50); touch(B, chip(B, 'dare'), 'touchend'); await wait(B, 40);
  ok(!shown(B), 'a quick tap is still just a tap');
  touch(B, chip(B, 'dare'), 'touchstart', 50, 50); touch(B, chip(B, 'dare'), 'touchmove', 50, 90); await wait(B, 40);
  ok(!shown(B), 'nor does a finger moving off to scroll open it');

  // ---- Only the irregular verbs; gone when a round starts ----
  B = boot2('irregular');
  B.ev("selectedNouns = new Set(['avere']); updateReadout();");
  over(B, 'avere'); await wait(B);
  const openBefore = shown(B);
  B.d.getElementById('start-btn').click();
  ok(openBefore && !shown(B) && B.d.querySelector('.container').dataset.view === 'game', 'starting a round closes it');
  B = boot2('verbs');
  over(B, B.ev('nounData[0].noun')); await wait(B);
  ok(!shown(B), 'regular verbs: no popout');
  B = boot2('nouns');
  over(B, 'casa'); await wait(B);
  ok(!shown(B) && B.errors.length === 0, 'nouns: no popout');
  done();
})();
