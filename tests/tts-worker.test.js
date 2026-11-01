// The Worker's text-to-speech (A spasso with the phone locked), against real SQLite and
// a stand-in Google Text-to-Speech: who may use it, choosing the voice, making a clip
// once and keeping it, a voice that has gone, failures, and the daily cap.
const { ok, done } = require('./harness');
const path = require('path');
const { makeD1 } = require('./d1-fixture');
const { makeGoogle, CLIENT_ID, ME } = require('./google-fixture');

(async () => {
  const google = await makeGoogle();
  google.install();
  const keysFetch = globalThis.fetch;
  // The stand-in Text-to-Speech: its voices, and a synthesize that records each request
  const tts = { voices: {}, calls: [], lists: 0, fail: null, gone: new Set() };
  tts.voices['it-IT'] = [
    { name: 'it-IT-Standard-A', languageCodes: ['it-IT'], ssmlGender: 'FEMALE' },
    { name: 'it-IT-Neural2-A', languageCodes: ['it-IT'], ssmlGender: 'FEMALE' },
    { name: 'it-IT-Chirp3-HD-Charon', languageCodes: ['it-IT'], ssmlGender: 'MALE' },
    { name: 'it-IT-Chirp3-HD-Aoede', languageCodes: ['it-IT'], ssmlGender: 'FEMALE' },
    { name: 'it-IT-Studio-B', languageCodes: ['it-IT'], ssmlGender: 'MALE' }
  ];
  tts.voices['en-GB'] = [
    { name: 'en-GB-Neural2-A', languageCodes: ['en-GB'], ssmlGender: 'FEMALE' },
    { name: 'en-GB-Neural2-B', languageCodes: ['en-GB'], ssmlGender: 'MALE' },
    { name: 'en-GB-Wavenet-B', languageCodes: ['en-GB'], ssmlGender: 'MALE' }
  ];
  const fakeMp3 = text => Buffer.from(`MP3:${text}`).toString('base64');
  globalThis.fetch = async (url, init = {}) => {
    const u = String(url);
    if (!u.startsWith('https://texttospeech.googleapis.com/v1/')) return keysFetch(url, init);
    const key = (init.headers || {})['X-Goog-Api-Key'];
    if (u.includes('/voices?')) {
      tts.lists++;
      const lang = new URL(u).searchParams.get('languageCode');
      return new Response(JSON.stringify({ voices: tts.voices[lang] || [] }), { status: 200 });
    }
    const body = JSON.parse(init.body);
    tts.calls.push({ key, ...body });
    if (tts.fail) return new Response('{}', { status: tts.fail });
    if (body.voice.name && tts.gone.has(body.voice.name)) return new Response('{"error":{"message":"voice not found"}}', { status: 400 });
    return new Response(JSON.stringify({ audioContent: fakeMp3(body.input.text) }), { status: 200 });
  };
  const mod = await import(path.join(__dirname, '..', 'worker', 'src', 'index.js'));
  const worker = mod.default;
  const env = { DB: makeD1(), GOOGLE_CLIENT_ID: CLIENT_ID, ALLOWED_EMAILS: ME, GOOGLE_TTS_API_KEY: 'test-key' };
  const ORIGIN = 'https://nassim55.github.io';
  const call = async (body, { auth, e = env } = {}) => {
    const h = { Origin: ORIGIN, 'Content-Type': 'application/json' };
    if (auth) h.Authorization = `Bearer ${auth}`;
    const res = await worker.fetch(new Request('https://il-mazzo-sync.il-mazzo.workers.dev/v1/tts', { method: 'POST', headers: h, body: JSON.stringify(body) }), e);
    const bytes = Buffer.from(await res.arrayBuffer());
    let data = null;
    try { data = JSON.parse(bytes.toString()); } catch (err) { /* audio */ }
    return { status: res.status, bytes, data, headers: res.headers };
  };
  const signedIn = await worker.fetch(new Request('https://il-mazzo-sync.il-mazzo.workers.dev/v1/session', {
    method: 'POST', headers: { Origin: ORIGIN, 'Content-Type': 'application/json' }, body: JSON.stringify({ credential: await google.token() })
  }), env);
  const T = (await signedIn.json()).token;
  const raw = env.DB.raw;
  const casa = { text: 'la casa', lang: 'it-IT', rate: 0.9 };

  // ---- Who may use it ----
  let r = await call(casa);
  ok(r.status === 401 && tts.calls.length === 0, 'signed out: refused, and Google is never asked');
  r = await call(casa, { auth: T, e: { ...env, GOOGLE_TTS_API_KEY: undefined } });
  ok(r.status === 503 && r.data.error === 'tts-off', 'with no Google key set, text-to-speech is off (the app uses the device\'s voice)');
  const badOnes = [{ ...casa, text: '' }, { ...casa, text: 'x'.repeat(301) }, { ...casa, lang: 'fr-FR' }, { ...casa, rate: 3 }, { ...casa, rate: 'fast' }];
  const bad = [];
  for (const b of badOnes) { const x = await call(b, { auth: T }); if (x.status !== 400) bad.push(JSON.stringify(b).slice(0, 40)); }
  ok(bad.length === 0 && tts.calls.length === 0, 'no text, too long, another language, a silly speed: all refused before Google is asked');

  // ---- A clip made once, then kept ----
  r = await call(casa, { auth: T });
  const made = tts.calls[0];
  ok(r.status === 200 && r.headers.get('Content-Type') === 'audio/mpeg' && r.bytes.toString() === 'MP3:la casa' && r.headers.get('Access-Control-Allow-Origin') === ORIGIN,
     'signed in: the phrase comes back as audio (MP3), readable by the app');
  ok(made && made.key === 'test-key' && made.voice.name === 'it-IT-Chirp3-HD-Aoede' && made.audioConfig.audioEncoding === 'MP3' && made.audioConfig.sampleRateHertz === 24000 && made.audioConfig.speakingRate === 0.9,
     'the best Italian voice on offer (Chirp 3 HD, the female one preferred), MP3 at 24 kHz, at the speed asked');
  const row = raw.prepare('SELECT voice, text, audio FROM tts_clips').get();
  ok(row && row.voice === 'it-IT-Chirp3-HD-Aoede' && row.text === 'la casa' && Buffer.from(row.audio, 'base64').toString() === 'MP3:la casa', 'and kept in the database');
  r = await call(casa, { auth: T });
  ok(r.status === 200 && r.bytes.toString() === 'MP3:la casa' && tts.calls.length === 1, 'asked again: served from the database — Google isn\'t paid twice');
  r = await call({ ...casa, rate: 0.7 }, { auth: T });
  ok(tts.calls.length === 2 && tts.calls[1].audioConfig.speakingRate === 0.7, 'a different speed (Lento) is a clip of its own');
  r = await call({ text: 'the house', lang: 'en-GB', rate: 0.95 }, { auth: T });
  ok(tts.calls[2].voice.name === 'en-GB-Neural2-B' && r.bytes.toString() === 'MP3:the house', 'English: the best British voice, the male one — two voices tell the languages apart');
  ok(tts.lists === 2, 'the voices are looked up once per language (then remembered for a day)');

  // ---- A voice that has gone; Google failing; a fixed voice ----
  mod._testing.resetVoices();
  tts.gone.add('it-IT-Chirp3-HD-Aoede');
  r = await call({ text: 'il pane', lang: 'it-IT', rate: 0.9 }, { auth: T });
  const retry = tts.calls[tts.calls.length - 1];
  ok(r.status === 200 && r.bytes.toString() === 'MP3:il pane' && !retry.voice.name && retry.voice.languageCode === 'it-IT' && retry.voice.ssmlGender === 'FEMALE',
     'if Google has retired the chosen voice, its default Italian voice steps in — the session doesn\'t break');
  tts.fail = 500;
  r = await call({ text: 'il vino', lang: 'it-IT', rate: 0.9 }, { auth: T });
  ok(r.status === 502 && r.data.error === 'tts-failed' && !raw.prepare("SELECT 1 FROM tts_clips WHERE text = 'il vino'").get(), 'Google failing: an error the app can fall back from, and nothing kept');
  tts.fail = null;
  mod._testing.resetVoices();
  const n0 = tts.lists;
  r = await call({ text: 'il sale', lang: 'it-IT', rate: 0.9 }, { auth: T, e: { ...env, TTS_VOICE_IT: 'it-IT-Wavenet-A' } });
  ok(tts.calls[tts.calls.length - 1].voice.name === 'it-IT-Wavenet-A' && tts.lists === n0, 'TTS_VOICE_IT names a voice outright');

  // ---- The daily cap ----
  const before = tts.calls.length;
  r = await call({ text: 'il latte', lang: 'it-IT', rate: 0.9 }, { auth: T, e: { ...env, TTS_DAILY_MAX: '3' } });
  ok(r.status === 429 && r.data.error === 'tts-daily-limit' && tts.calls.length === before, 'past the day\'s cap of new clips: refused before Google is asked (a runaway bug can\'t run up a bill)');
  r = await call(casa, { auth: T, e: { ...env, TTS_DAILY_MAX: '3' } });
  ok(r.status === 200 && r.bytes.toString() === 'MP3:la casa', '…while clips already made still play');
  done();
})();
