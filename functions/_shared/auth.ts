// Auth helpers: password hashing + session tokens, using Web Crypto (available in Workers).

const PBKDF2_ITERATIONS = 100_000
const KEY_LEN_BYTES = 32

function bufToHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function hexToBuf(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

export async function hashPassword(password: string, saltHex?: string): Promise<{ salt: string; hash: string }> {
  const salt = saltHex ? hexToBuf(saltHex) : crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    KEY_LEN_BYTES * 8,
  )
  return { salt: bufToHex(salt.buffer as ArrayBuffer), hash: bufToHex(bits) }
}

export async function verifyPassword(password: string, saltHex: string, expectedHash: string): Promise<boolean> {
  const { hash } = await hashPassword(password, saltHex)
  return hash === expectedHash
}

export function newSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return bufToHex(bytes.buffer)
}
