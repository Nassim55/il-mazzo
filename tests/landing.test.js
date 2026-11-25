// The landing page (Nov 2026): someone who isn't signed in sees direction A of the canvas, "Il tavolo",
// instead of the old sign-in card. Signing in is unchanged: Google's own button, the allowed list, the same
// messages. The sections and their counts come from the data, so the page stays true as words are added.
const { boot, ok, done } = require('./harness');
(async () => {
  const rendered = [];
  const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  const B = boot({ 'flipcards-subject': 'nouns' }, w => {
    w.confirm = () => true; w.alert = () => {};
    w.google = { accounts: { id: {
      initialize(cfg) { w.__gis = cfg; },
      renderButton(el) { rendered.push(el.id); el.innerHTML = '<button type="button">Sign in with Google</button>'; },
      prompt() { w.__prompted = (w.__prompted || 0) + 1; }
    } } };
    w.fetch = async url => (new URL(url).pathname === '/v1/config' ? json(200, { googleClientId: 'test.apps.googleusercontent.com' }) : json(404, { error: 'not-found' }));
  });
  for (let i = 0; i < 40; i++) await new Promise(r => setTimeout(r, 5));
  const d = B.d, gate = d.getElementById('signin-gate');
  ok(!!gate && gate.classList.contains('landing') && /Italian,\s*one card\s*at a time\./.test((d.getElementById('landing-title') || {}).textContent || ''),
     'someone not signed in sees the landing page: "Italian, one card at a time."');
  ok(rendered.join() === 'signin-button,signin-button-end' && B.ev('__gis.client_id') === 'test.apps.googleusercontent.com',
     "Google's own button, twice: under the headline and in the closing band");
  ok(d.documentElement.classList.contains('landing-open') && d.getElementById('container').hasAttribute('inert') && gate.getAttribute('aria-modal') === 'true',
     'the app behind waits: no scrolling, tabbing or reading into it');
  const rows = [...gate.querySelectorAll('.landing-row')].map(r => [r.querySelector('.landing-row-name').textContent, r.querySelector('.landing-row-count').textContent]);
  const total = B.ev('FAMILIES.reduce((n, f) => n + f.sections.length, 0)');
  ok(rows.length === total && rows[0][0] === 'Sostantivi' && rows[0][1] === B.ev("SUBJECTS.nouns.items.length.toLocaleString('en-GB')")
     && rows.some(r => r[0] === 'Verbi regolari' && r[1] === String(B.ev('SUBJECTS.verbs.items.length'))),
     `what's inside: every section, counted from the data (${rows.slice(0, 3).map(r => r.join(' ')).join(', ')}…)`);
  ok(new RegExp(`${B.ev(`LANDING_WORDS[${total}]`)} sections in four families`).test(gate.textContent), `"${B.ev(`LANDING_WORDS[${total}]`)} sections in four families"`);
  ok(!/\b(sync|synced|syncing|offline)\b/i.test(gate.textContent), 'nothing on it mentions syncing');
  B.ev("renderSigninGate('test.apps.googleusercontent.com', 'Please sign in again.')");
  ok(d.querySelectorAll('#signin-gate').length === 1 && d.getElementById('signin-msg').textContent === 'Please sign in again.', 'asked again: the same page, the message under the button');
  B.ev("window.__scrolled = []; Element.prototype.scrollIntoView = function () { window.__scrolled.push(this.id); };");
  const prompted = B.ev('window.__prompted || 0');
  d.querySelector('[data-landing-signin]').click();
  d.querySelector('[data-landing-how]').click();
  ok(B.ev('window.__scrolled.join()') === 'signin-button,landing-how' && B.ev('window.__prompted') === prompted + 1,
     'Sign in (top right) brings up Google\'s button and its quick prompt; See how it works scrolls to the steps');
  B.ev('closeSigninGate()');
  ok(!d.getElementById('signin-gate') && !d.documentElement.classList.contains('landing-open') && !d.getElementById('container').hasAttribute('inert'),
     'signed in: the page goes, and the app is back');
  ok(B.errors.length === 0, 'no errors');
  done();
})();
