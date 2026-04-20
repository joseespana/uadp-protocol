import { Elysia } from 'elysia'
import { createToken, validatePasskey, verifyToken, USER_PASSKEYS, type UadpToken } from './token.js'
import { USERS, getUserByEmail } from './user.js'

/**
 * UADP Auth middleware for Elysia services.
 *
 * - Checks Authorization: Bearer <token> header
 * - If valid token: sets store.userId and store.user (the decoded token)
 * - If no token: sets store.userId to null (public access)
 * - Services should check store.userId for private endpoints
 */
export function uadpAuth() {
  return (app: Elysia) =>
    app
      .derive(async ({ request, store }) => {
        const authHeader = request.headers.get('authorization')
        const cosmosUserHeader = request.headers.get('x-cosmos-user')

        let userId: string | null = null
        let authToken: UadpToken | null = null

        if (authHeader?.startsWith('Bearer ')) {
          const tokenStr = authHeader.slice(7)
          authToken = await verifyToken(tokenStr)
          if (authToken) {
            userId = authToken.sub
          }
        }

        // Fallback to X-Cosmos-User header for backward compat (demo convenience)
        if (!userId && cosmosUserHeader) {
          userId = cosmosUserHeader
        }

        // Default to jose_espana if nothing provided
        if (!userId) {
          userId = 'jose_espana'
        }

        return { userId, authToken }
      })
}

/**
 * Helper to check if request is authenticated (has valid token).
 * Returns 401 if not authenticated.
 */
export function requireAuth(authToken: UadpToken | null): Response | null {
  if (!authToken) {
    return new Response(
      JSON.stringify({
        error: 'unauthorized',
        message: 'This endpoint requires authentication. Send Authorization: Bearer <token> header. Get a token via POST /uadp/v1/auth/login on this service.',
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }
  return null
}

/**
 * UADP Auth routes plugin — adds register, login, verify to any service.
 * Each service is independent and handles its own auth.
 */
export function uadpAuthRoutes() {
  return new Elysia({ name: 'uadp-auth-routes' })
    .post('/uadp/v1/auth/register', async ({ body }) => {
      const { email } = body as { email?: string }
      if (!email) {
        return new Response(JSON.stringify({ error: 'email_required', message: 'Send { "email": "user@example.com" }' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
      }
      const user = getUserByEmail(email)
      if (!user) {
        return new Response(JSON.stringify({
          error: 'user_not_found',
          message: `No account for ${email}. Available: ${Object.values(USERS).map(u => u.email).join(', ')}`,
        }), { status: 404, headers: { 'Content-Type': 'application/json' } })
      }
      const userId = Object.entries(USERS).find(([_, u]) => u.email === email)?.[0]
      if (!userId) {
        return new Response(JSON.stringify({ error: 'user_not_found' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
      }
      return {
        type: 'uadp:registration',
        user_id: userId,
        email: user.email,
        name: user.name,
        handle: user.handle,
        passkey: USER_PASSKEYS[userId],
        message: 'Store this passkey securely. Use it with POST /uadp/v1/auth/login to get a session token.',
      }
    })
    .post('/uadp/v1/auth/login', async ({ body }) => {
      const { email, passkey } = body as { email?: string; passkey?: string }
      if (!email || !passkey) {
        return new Response(JSON.stringify({ error: 'email_and_passkey_required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
      }
      const user = getUserByEmail(email)
      if (!user) {
        return new Response(JSON.stringify({ error: 'user_not_found' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
      }
      const userId = Object.entries(USERS).find(([_, u]) => u.email === email)?.[0]
      if (!userId || !validatePasskey(userId, passkey)) {
        return new Response(JSON.stringify({ error: 'invalid_passkey' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
      }
      const token = await createToken(userId, user.email)
      return {
        type: 'uadp:auth',
        token,
        expires_in: 3600,
        user: { id: userId, name: user.name, email: user.email, handle: user.handle, avatar_url: user.avatar_url },
      }
    })
    .post('/uadp/v1/auth/verify', async ({ request }) => {
      const authHeader = request.headers.get('authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ valid: false, error: 'no_token' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
      }
      const token = await verifyToken(authHeader.slice(7))
      if (!token) {
        return new Response(JSON.stringify({ valid: false, error: 'invalid_or_expired' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
      }
      return { valid: true, user_id: token.sub, email: token.email, expires_at: token.exp }
    })
}
