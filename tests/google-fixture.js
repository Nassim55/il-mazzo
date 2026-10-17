// Plays Google for the sign-in tests: a real RSA key pair, its public half published
// like Google's (JWKS), and ID tokens signed with it — or with an impostor's key.
// install() points the global fetch at the published keys, as the Worker fetches them.
const { webcrypto } = require('crypto');
const subtle = webcrypto.subtle;
const CLIENT_ID = 'il-mazzo-test.apps.googleusercontent.com';
const ME = 'me@example.com';
const RSA = { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' };

async function makeGoogle() {
  const real = await subtle.generateKey(RSA, true, ['sign', 'verify']);
  const impostor = await subtle.generateKey(RSA, true, ['sign', 'verify']);
  const jwk = await subtle.exportKey('jwk', real.publicKey);
  const jwks = { keys: [{ kty: 'RSA', n: jwk.n, e: jwk.e, kid: 'kid-1', alg: 'RS256', use: 'sig' }] };
  const b64 = x => Buffer.from(typeof x === 'string' ? x : JSON.stringify(x)).toString('base64url');
  async function token(claims = {}, opts = {}) {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: opts.alg || 'RS256', kid: opts.kid || 'kid-1', typ: 'JWT' };
    const payload = { iss: 'https://accounts.google.com', aud: CLIENT_ID, sub: '100000000000000000001', email: ME, email_verified: true, iat: now, exp: now + 3600, ...claims };
    const data = `${b64(header)}.${b64(payload)}`;
    if (opts.unsigned) return `${data}.`;
    const sig = await subtle.sign('RSASSA-PKCS1-v1_5', (opts.impostor ? impostor : real).privateKey, Buffer.from(data));
    return `${data}.${Buffer.from(sig).toString('base64url')}`;
  }
  function install() {
    globalThis.fetch = async url => {
      if (String(url).startsWith('https://www.googleapis.com/oauth2/v3/certs')) {
        return new Response(JSON.stringify(jwks), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' } });
      }
      throw new Error(`unexpected fetch: ${url}`);
    };
  }
  return { token, install, jwks };
}
module.exports = { makeGoogle, CLIENT_ID, ME };
