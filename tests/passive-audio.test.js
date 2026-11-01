// A spasso with the phone locked: where this device is signed in, each card's Italian and
// English come from the Worker as MP3 clips, joined with the pauses into one track that an
// audio player plays (so it carries on locked). Stand-ins for the player, the lock screen,
// blob URLs, the clip store and the Worker; the clips are real MP3 frames.
const { boot, ok, done } = require('./harness');

const FRAME = 96, HEAD = [0xFF, 0xF3, 0x44, 0xC0];   // MPEG-2 Layer III, 24 kHz, 32 kbit/s, mono: 576 samples (24 ms) a frame
function clip(text) {   // an "Info" header frame first (to be dropped), then 25 + length frames
  const n = 25 + text.length, out = new Uint8Array((n + 1) * FRAME);
  out.set(HEAD, 0); out.set([...'Info'].map(c => c.charCodeAt(0)), 4);
  for (let k = 1; k <= n; k++) { out.set(HEAD, k * FRAME); out.fill((text.length % 200) + 1, k * FRAME + 4, (k + 1) * FRAME); }
  return out;
}
const VOICES = [{ name: 'Alice', lang: 'it-IT', voiceURI: 'alice', localService: true }, { name: 'Daniel', lang: 'en-GB', voiceURI: 'daniel', localService: true }];
const TOKEN = 'T'.repeat(43);
function fakes(o = {}) {
  return w => {
    w.__audios = []; w.__blobs = new Map(); w.__revoked = []; w.__tts = []; w.__handlers = {}; w.__wakes = [];
    w.__ttsStatus = o.ttsStatus || 200;
    w.Audio = class {
      constructor() { this.srcs = []; this._src = ''; this.currentTime = 0; this.paused = true; this.plays = 0; this.pauses = 0; this.ls = {}; w.__audios.push(this); }
      set src(v) { this._src = v; if (v) this.srcs.push(v); } get src() { return this._src; }
      play() { this.paused = false; this.plays++; return Promise.resolve(); }
      pause() { this.paused = true; this.pauses++; }
      addEventListener(t, f) { (this.ls[t] = this.ls[t] || []).push(f); }
      removeEventListener(t, f) { this.ls[t] = (this.ls[t] || []).filter(x => x !== f); }
      fire(t) { for (const f of this.ls[t] || []) f(); }
      removeAttribute(a) { if (a === 'src') this._src = ''; }
      load() {}
    };
    let n = 0;
    w.URL.createObjectURL = b => { const u = `blob:fake/${++n}`; w.__blobs.set(u, b); return u; };
    w.URL.revokeObjectURL = u => { w.__revoked.push(u); };
    Object.defineProperty(w.navigator, 'mediaSession', { configurable: true, value: { metadata: null, setActionHandler: (a, f) => { w.__handlers[a] = f; } } });
    w.MediaMetadata = function (m) { Object.assign(this, m); };
    Object.defineProperty(w.navigator, 'wakeLock', { configurable: true, value: { request: async () => { const l = { release: async () => {}, addEventListener() {} }; w.__wakes.push(l); return l; } } });
    w.__said = [];
    w.SpeechSynthesisUtterance = function (t) { this.text = t; };
    Object.defineProperty(w, 'speechSynthesis', { configurable: true, value: { getVoices: () => VOICES, cancel() {}, speak(u) { w.__said.push(u); }, addEventListener() {}, speaking: false } });
    if (o.cache) {
      const store = new Map(); w.__cache = store;
      w.caches = { open: async () => ({ match: async k => store.get(k), put: async (k, r) => { store.set(k, r); } }) };
      w.Response = class { constructor(b) { this.b = b; } async arrayBuffer() { return this.b.buffer.slice(this.b.byteOffset, this.b.byteOffset + this.b.byteLength); } };
    }
    const resp = (status, data, bytes) => ({ ok: status >= 200 && status < 300, status, json: async () => data,
      arrayBuffer: async () => (bytes ? bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) : new ArrayBuffer(0)) });
    w.fetch = async (url, init = {}) => {
      const u = String(url), method = init.method || 'GET';
      if (u.endsWith('/v1/tts')) {
        const b = JSON.parse(init.body);
        w.__tts.push({ ...b, auth: (init.headers || {}).Authorization });
        return w.__ttsStatus === 200 ? resp(200, null, clip(b.text)) : resp(w.__ttsStatus, { error: 'no' });
      }
      if (u.endsWith('/v1/progress')) return method === 'GET' ? resp(200, { version: 0, items: {} }) : resp(200, { version: 1 });
      if (u.endsWith('/v1/config')) return resp(200, { googleClientId: null });
      return resp(404, {});
    };
  };
}
const wait = (B, ms = 30) => new Promise(r => B.w.setTimeout(r, ms));
const store = signedIn => (signedIn ? { 'mazzo-sync-meta-v1': JSON.stringify({ session: TOKEN }) } : {});
function start(keys, o = {}) {
  const B = boot({ 'flipcards-subject': 'nouns', ...store(o.signedIn !== false) }, fakes(o));
  B.ev(`selectedNouns = new Set(${JSON.stringify(keys)}); updateReadout();`);
  if (o.chunk) B.ev(`PASSIVE_AUDIO.chunkCards = ${o.chunk};`);
  B.d.getElementById('passive-btn').click();
  return B;
}
const audio = B => B.w.__audios[0];
const txt = (B, id) => B.d.getElementById(id).textContent.trim();
const bytesOf = async (B, url) => {
  const blob = B.w.__blobs.get(url);
  return new Promise(res => { const fr = new B.w.FileReader(); fr.onload = () => res(new Uint8Array(fr.result)); fr.readAsArrayBuffer(blob); });
};

(async () => {
  // ---- The track: clips from the Worker, joined with the pauses ----
  let B = start(['casa', 'pane', 'acqua']);
  ok(B.ev('passive.mode') === 'audio' && audio(B).srcs.length === 1 && /^blob:/.test(audio(B).srcs[0]) && audio(B).plays === 1,
     'signed in: a track rather than the device\'s voice — the player unlocked from the tap with a moment of silence');
  ok(/Preparing the audio/.test(txt(B, 'passive-msg')) && B.d.getElementById('passive-lock').hidden && /Plays with your phone locked: lock it as usual/.test(txt(B, 'passive-note'))
     && B.w.__wakes.length === 0, 'while it\'s made: "Preparing the audio…"; no pocket lock, no keeping the screen on — just lock the phone');
  await wait(B);
  const cards = B.ev('passive.cards');
  const reqs = B.w.__tts;
  ok(reqs.length === 6 && new Set(reqs.map(r => r.lang + r.text)).size === 6 && reqs.every(r => r.auth === `Bearer ${TOKEN}`)
     && cards.every(c => reqs.some(r => r.lang === 'it-IT' && r.rate === 0.9 && r.text === B.ev(`sayText(${JSON.stringify(c)})`)) && reqs.some(r => r.lang === 'en-GB' && r.rate === 0.95 && r.text === B.ev(`spokenEnglish(${JSON.stringify(c.english)})`))),
     'each card\'s Italian (0.9 speed) and English (0.95, said cleanly), asked of the Worker with this device\'s sign-in');
  const chunk = B.ev('({ marks: passive.chunk.marks, seconds: passive.chunk.seconds, url: passive.chunk.url })');
  ok(audio(B).src === chunk.url && audio(B).plays === 2 && chunk.marks.length === 30
     && chunk.marks.slice(0, 4).map(m => `${m.index}${m.phase}${m.rep}`).join() === '0it0,0en0,0it1,0en1', 'then the track plays: card by card, Italian then English, five times each (30 lines for 3 cards)');
  const bytes = await bytesOf(B, chunk.url);
  const frames = t => 25 + t.length, sec = n => n * 576 / 24000;
  const itT = B.ev('sayText(passive.cards[0])'), enT = B.ev('spokenEnglish(passive.cards[0].english)');
  const gap = ms => Math.max(1, Math.round(ms / 1000 * 24000 / 576));
  ok(Math.abs(chunk.marks[1].t - (sec(frames(itT)) + sec(gap(700)))) < 1e-9 && Math.abs(chunk.marks[2].t - chunk.marks[1].t - (sec(frames(enT)) + sec(gap(1100)))) < 1e-9,
     'the pauses are there: 0.7 s after the Italian, 1.1 s before the next time round');
  ok(bytes[3] === 0xC0 && bytes[4] === (itT.length % 200) + 1 && bytes.length % FRAME === 0, 'the clips\' own header frames are dropped (they\'d tell the player the whole track lasted one clip)');
  const silence = bytes.subarray(frames(itT) * FRAME, frames(itT) * FRAME + FRAME);
  ok(silence[0] === 0xFF && silence[1] === 0xF3 && silence[4] === 0 && silence.every((b, i) => i < 4 || b === 0), 'and the pauses are silent MP3 frames of the same kind');

  // ---- Following the track: the screen and the lock screen ----
  audio(B).currentTime = chunk.marks[7].t + 0.1; audio(B).fire('timeupdate');
  ok(txt(B, 'passive-rep') === 'Ripetizione 4 di 5' && B.d.getElementById('passive-en').classList.contains('speaking') && txt(B, 'passive-it') === itT,
     'the screen follows the track: which card, which time round, Italian or English');
  ok(B.w.navigator.mediaSession.metadata && B.w.navigator.mediaSession.metadata.title === `${itT} — ${cards[0].english}` && B.w.navigator.mediaSession.metadata.artist === 'Il Mazzo · A spasso',
     'and the lock screen shows the card');
  audio(B).currentTime = chunk.marks[10].t; audio(B).fire('timeupdate');
  ok(B.ev('passive.index') === 1 && B.w.navigator.mediaSession.metadata.title.startsWith(B.ev('sayText(passive.cards[1])')), '…moving on with it');
  ok(['play', 'pause', 'nexttrack', 'previoustrack'].every(a => typeof B.w.__handlers[a] === 'function'), 'play, pause and skip work from the lock screen and headphones');

  // ---- Pause, carry on, skip ----
  const p0 = audio(B).pauses;
  B.d.getElementById('passive-play').click();
  ok(audio(B).pauses === p0 + 1 && txt(B, 'passive-play') === '▶ Riprendi', 'Pausa pauses the track');
  B.w.__handlers.play();
  ok(!audio(B).paused && txt(B, 'passive-play') === '⏸ Pausa', '…and the lock screen\'s play carries on');
  B.d.getElementById('passive-next').click();
  ok(Math.abs(audio(B).currentTime - chunk.marks[20].t) < 1e-9 && B.ev('passive.index') === 2, '⏭ jumps to the next card\'s first Italian');
  B.w.__handlers.previoustrack();
  ok(Math.abs(audio(B).currentTime - chunk.marks[10].t) < 1e-9 && B.ev('passive.index') === 1, '⏮ (or the lock screen\'s back) goes back one');
  ok(B.d.dispatchEvent(new B.w.Event('visibilitychange')) && !audio(B).paused, 'the screen going off leaves the track playing');

  // ---- The next part; round again ----
  await wait(B);
  const nextUrl = B.ev('passive.next && passive.next.url');
  audio(B).fire('ended');
  ok(nextUrl && audio(B).src === nextUrl && B.ev('passive.pass') === 2 && /giro 2/.test(txt(B, 'passive-where')) && B.ev('passive.cards.map(c => c.noun).sort().join()') === 'acqua,casa,pane'
     && B.w.__revoked.includes(chunk.url) && B.w.__tts.length === 6, 'at the end of the deck the next part (made while this one played) carries on: round again, reshuffled — from clips already fetched');

  // ---- Repeats changed: made again ----
  B.d.getElementById('passive-less').click(); B.d.getElementById('passive-less').click();
  await wait(B);
  ok(B.ev('passive.chunk.marks.length') === 18 && B.ev('passive.chunk.marks.every(m => m.rep < 3)'), 'fewer repeats: the track is made again from the card playing (3 times each)');

  // ---- Leaving ----
  const u = B.ev('passive.chunk.url');
  B.d.getElementById('passive-end').click();
  ok(audio(B).paused && B.w.__revoked.includes(u) && B.w.__handlers.play === null && B.ev('passive') === null && B.d.querySelector('.container').dataset.view === 'setup',
     'Fine: the track stops, its memory is freed, and the lock screen lets go');

  // ---- Parts, a few cards at a time ----
  B = start(['casa', 'pane', 'acqua'], { chunk: 1 });
  await wait(B);
  const first = B.ev('passive.chunk.end'), firstIdx = B.ev('passive.chunk.marks[0].index');
  await wait(B);
  audio(B).fire('ended');
  ok(first === 1 && firstIdx === 0 && B.ev('passive.chunk.start') === 1 && B.ev('passive.index') === 1 && B.ev('passive.pass') === 1, 'a long deck is made a part at a time, each part playing on from the last');

  // ---- Clips kept in the browser ----
  B = start(['casa'], { cache: true });
  await wait(B);
  const asked = B.w.__tts.length;
  B.d.getElementById('passive-more').click();
  await wait(B);
  ok(asked === 2 && B.w.__tts.length === 2 && B.w.__cache.size === 2 && B.ev('passive.chunk.marks.length') === 12, 'clips are kept in the browser: made again with more repeats, nothing is fetched twice');

  // ---- Where it can't: the device's voice ----
  B = start(['casa'], { signedIn: false });
  ok(B.ev('passive.mode') === 'speech' && B.w.__said.length === 1 && /sign in with Google on this device/.test(txt(B, 'passive-note')) && !B.d.getElementById('passive-lock').hidden,
     'not signed in on this device: the device\'s voice as before (screen kept on), and the note says how to play locked');
  B = start(['casa'], { ttsStatus: 503 });
  await wait(B);
  ok(B.ev('passive.mode') === 'speech' && txt(B, 'passive-play') === '▶ Riprendi' && /Tap ▶ to play with this device’s voice/.test(txt(B, 'passive-msg'))
     && /aren’t switched on yet/.test(txt(B, 'passive-note')) && audio(B).paused, 'voices not switched on (no Google key yet): it falls back, waiting on a tap to start the device\'s voice');
  B.d.getElementById('passive-play').click();
  ok(B.w.__said.length === 1 && B.w.__said[0].text === B.ev('sayText(passive.cards[0])'), '…which then plays as before');
  B = start(['casa'], { ttsStatus: 401 });
  await wait(B);
  ok(/sign in with Google on this device/.test(txt(B, 'passive-note')), 'a sign-in that has run out: the same note');
  ok(B.errors.length === 0, 'no errors along the way');
  done();
})();
