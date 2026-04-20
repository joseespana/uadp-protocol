// Shared secret for token signing (demo — in production this would be env var)
const TOKEN_SECRET = 'cosmos-uadp-demo-secret-2026'
const TOKEN_TTL = 3600 // 1 hour

export interface UadpToken {
  sub: string       // user ID (e.g., 'jose_espana')
  email: string     // user email
  iat: number       // issued at (unix seconds)
  exp: number       // expires at (unix seconds)
  scope: string     // 'all' for full access
}

// Pre-generated passkeys per user (deterministic for demo)
export const USER_PASSKEYS: Record<string, string> = {
  jose_espana: 'ak_je5p4n4k3y0000000000000000000000000000000000000000000000000000000',
  test_user: 'ak_t3st4cc3ss000000000000000000000000000000000000000000000000000000',
}

// Simple HMAC-like signature using Web Crypto (available in Bun)
async function sign(payload: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(TOKEN_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function verifySignature(payload: string, sig: string): Promise<boolean> {
  const expected = await sign(payload)
  return expected === sig
}

export async function createToken(userId: string, email: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const token: UadpToken = {
    sub: userId,
    email,
    iat: now,
    exp: now + TOKEN_TTL,
    scope: 'all',
  }
  const payload = btoa(JSON.stringify(token))
  const sig = await sign(payload)
  return `${payload}.${sig}`
}

export function decodeToken(tokenString: string): UadpToken | null {
  try {
    const [payload] = tokenString.split('.')
    if (!payload) return null
    const decoded = JSON.parse(atob(payload)) as UadpToken
    return decoded
  } catch {
    return null
  }
}

export async function verifyToken(tokenString: string): Promise<UadpToken | null> {
  try {
    const parts = tokenString.split('.')
    if (parts.length !== 2) return null
    const [payload, sig] = parts

    // Verify signature
    const valid = await verifySignature(payload, sig)
    if (!valid) return null

    // Decode and check expiry
    const token = JSON.parse(atob(payload)) as UadpToken
    const now = Math.floor(Date.now() / 1000)
    if (token.exp < now) return null

    return token
  } catch {
    return null
  }
}

export function validatePasskey(userId: string, passkey: string): boolean {
  return USER_PASSKEYS[userId] === passkey
}

// Legacy compat — keep these for services that still use them
export function createMockToken(service: string): UadpToken {
  const now = Math.floor(Date.now() / 1000)
  return { sub: 'user:jose_espana', email: 'jose.espana@perseusoft.tech', iat: now, exp: now + TOKEN_TTL, scope: 'all' }
}

export function encodeToken(token: UadpToken): string {
  return btoa(JSON.stringify(token))
}
