// Tiny stateless admin session: an HMAC-signed token stored in an httpOnly
// cookie. No database, no extra deps — uses Web Crypto (available on Vercel
// Node serverless). The signing secret never leaves the server, so the token
// cannot be forged.

export const ADMIN_COOKIE = 'vs_admin';
const TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

const enc = new TextEncoder();

function toBase64Url(bytes: ArrayBuffer): string {
  const b = Buffer.from(bytes);
  return b.toString('base64url');
}

async function hmac(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return toBase64Url(sig);
}

/** Constant-time-ish string compare. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Mint a signed session token valid for TTL. Payload = `admin.<expiry>`. */
export async function createSession(secret: string): Promise<string> {
  const exp = Date.now() + TTL_MS;
  const payload = `admin.${exp}`;
  const sig = await hmac(payload, secret);
  return `${payload}.${sig}`;
}

/** Verify a token: signature must match and expiry must be in the future. */
export async function verifySession(token: string | undefined, secret: string | undefined): Promise<boolean> {
  if (!token || !secret) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [sub, exp, sig] = parts;
  if (sub !== 'admin') return false;
  const expected = await hmac(`${sub}.${exp}`, secret);
  if (!safeEqual(sig, expected)) return false;
  if (Number(exp) < Date.now()) return false;
  return true;
}

export const SESSION_MAX_AGE = Math.floor(TTL_MS / 1000);
