// Uses Web Crypto (globalThis.crypto) exclusively — this module is imported
// from middleware.ts, which runs on the Edge runtime and has no access to
// Node's `crypto` module (createHmac, timingSafeEqual, etc).

export const ADMIN_SESSION_COOKIE = 'admin_session'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

const encoder = new TextEncoder()

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

function bytesToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
}

function hexToBytes(hex: string): Uint8Array | null {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) return null
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

async function getSigningKey(): Promise<CryptoKey> {
  const secret = process.env.ENCRYPTION_KEY
  if (!secret) throw new Error('ENCRYPTION_KEY is not configured')

  // Derive a distinct key from ENCRYPTION_KEY so admin sessions don't share
  // key material with provider-secret encryption (Phase 5).
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(`admin-session:${secret}`))
  return crypto.subtle.importKey('raw', digest, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false

  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(password)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ])
  return constantTimeEqual(new Uint8Array(a), new Uint8Array(b))
}

export async function createSessionToken(): Promise<string> {
  const expires = Date.now() + SESSION_TTL_MS
  const key = await getSigningKey()
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(String(expires)))
  return `${expires}.${bytesToHex(sig)}`
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false

  const [payload, sig] = token.split('.')
  if (!payload || !sig) return false

  const expires = Number(payload)
  if (!Number.isFinite(expires) || Date.now() >= expires) return false

  const sigBytes = hexToBytes(sig)
  if (!sigBytes) return false

  const key = await getSigningKey()
  return crypto.subtle.verify('HMAC', key, sigBytes as BufferSource, encoder.encode(payload))
}
