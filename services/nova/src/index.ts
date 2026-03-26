import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { loadAllUsersData, requestLogger, uadpAuth, uadpAuthRoutes, USERS, getUserById } from 'cosmos-core'
import type { UadpManifest, UadpPost, UadpNotification } from 'cosmos-core'

// ---------- Data ----------

interface NovaData {
  feed: UadpPost[]
  user_posts: UadpPost[]
  notifications: UadpNotification[]
  trending: { tag: string; count: number }[]
}

const allUsersData = loadAllUsersData<NovaData>('nova-posts')

// Per-user mutable state
const userPosts = new Map<string, UadpPost[]>()
const userProfiles = new Map<string, Map<string, UadpPost['author']>>()
const userNotifications = new Map<string, UadpNotification[]>()
const userTrending = new Map<string, { tag: string; count: number }[]>()

for (const [userId, data] of allUsersData) {
  const feed = data.feed ?? []
  userPosts.set(userId, [...feed])
  userNotifications.set(userId, data.notifications ?? [])
  userTrending.set(userId, data.trending ?? [])

  const profiles = new Map<string, UadpPost['author']>()
  for (const post of feed) {
    if (!profiles.has(post.author.id)) {
      profiles.set(post.author.id, post.author)
    }
  }
  userProfiles.set(userId, profiles)
}

function getUserPosts(userId: string): UadpPost[] {
  return userPosts.get(userId) || userPosts.get('alejandro') || []
}

function getUserProfiles(userId: string): Map<string, UadpPost['author']> {
  return userProfiles.get(userId) || userProfiles.get('alejandro') || new Map()
}

function getUserNotifications(userId: string): UadpNotification[] {
  return userNotifications.get(userId) || userNotifications.get('alejandro') || []
}

function getUserTrending(userId: string): { tag: string; count: number }[] {
  return userTrending.get(userId) || userTrending.get('alejandro') || []
}

// ---------- UADP Manifest ----------

const manifest: UadpManifest = {
  service_id: 'nova',
  service_name: 'Nova',
  uadp_version: '1.0',
  category: 'uadp:reading_social',
  base_url: '/uadp/v1',
  endpoints: [
    { path: '/uadp/v1/auth/register', method: 'POST', description: 'Register with email to get passkey', auth_required: false },
    { path: '/uadp/v1/auth/login', method: 'POST', description: 'Login with email + passkey to get session token', auth_required: false },
    { path: '/uadp/v1/auth/verify', method: 'POST', description: 'Verify if a token is valid', auth_required: false },
    { path: '/uadp/v1/feed',            method: 'GET',  description: 'Main timeline feed',              auth_required: true },
    { path: '/uadp/v1/feed/stream',     method: 'GET',  description: 'Real-time timeline (SSE)',        auth_required: true, streaming: true },
    { path: '/uadp/v1/profile/:id',     method: 'GET',  description: 'User profile',                    auth_required: true },
    { path: '/uadp/v1/notifications',   method: 'GET',  description: 'User notifications',              auth_required: true },
    { path: '/uadp/v1/search',          method: 'GET',  description: 'Search posts',                    auth_required: true },
    { path: '/uadp/v1/post/create',     method: 'POST', description: 'Create a new post',               auth_required: true },
    { path: '/uadp/v1/post/:id/like',   method: 'POST', description: 'Like a post',                     auth_required: true },
    { path: '/uadp/v1/trending',        method: 'GET',  description: 'Trending topics',                 auth_required: false },
  ],
  ai_hints: {
    persona: 'Nova is a text-based social network for conversations about technology, culture, and daily life — similar to Twitter/X.',
    language: 'en',
    rendering: {
      default_view: 'timeline',
      date_format: 'relative',
      group_by: 'none',
    },
    key_concepts: {
      'ext.nova.view_count': 'Number of times the post was viewed.',
      'ext.nova.quote_count': 'Number of times it was quoted.',
    },
    user_goals: [
      'See what people I follow have posted',
      'Create a new post',
      'Check my notifications',
      'Search posts about a topic',
    ],
    auth: {
      method: 'Bearer token in Authorization header',
      public_endpoints: 'Endpoints with auth_required: false work without a token',
      private_endpoints: 'Endpoints with auth_required: true need Authorization: Bearer <token>',
      get_token: 'POST /uadp/v1/auth/register with email, then POST /uadp/v1/auth/login with email and passkey',
    },
    proactive_suggestions: [
      'If there are more than 10 unread notifications, mention it when opening.',
      'If a trending topic relates to the user interests, suggest it.',
    ],
  },
}

// ---------- App ----------

const app = new Elysia()
  .use(cors())
  .use(requestLogger('Nova'))
  .use(uadpAuth())
  .use(uadpAuthRoutes())

  // UADP Manifest
  .get('/.well-known/uadp.json', () => manifest)

  // Paginated feed
  .get('/uadp/v1/feed', ({ query, userId, authToken }) => {
    if (!authToken) {
      return new Response(JSON.stringify({
        error: 'unauthorized',
        message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    const allPosts = getUserPosts(userId)
    const cursor = query.cursor ? parseInt(query.cursor, 10) : 0
    const limit = query.limit ? parseInt(query.limit, 10) : 20
    const page = allPosts.slice(cursor, cursor + limit)
    const nextCursor = cursor + limit < allPosts.length ? String(cursor + limit) : null

    return {
      type: 'uadp:feed' as const,
      cursor: nextCursor,
      items: page,
      authenticated: !!authToken,
    }
  })

  // SSE feed stream
  .get('/uadp/v1/feed/stream', ({ userId, authToken }) => {
    if (!authToken) {
      return new Response(JSON.stringify({
        error: 'unauthorized',
        message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    const allPosts = getUserPosts(userId)
    let idx = 0

    return new Response(
      new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder()
          const interval = setInterval(() => {
            if (idx < allPosts.length) {
              const chunk = `data: ${JSON.stringify(allPosts[idx])}\n\n`
              controller.enqueue(encoder.encode(chunk))
              idx++
            } else {
              clearInterval(interval)
              controller.close()
            }
          }, 100)
        },
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    )
  })

  // Profile
  .get('/uadp/v1/profile/:id', ({ params, userId, authToken }) => {
    if (!authToken) {
      return new Response(JSON.stringify({
        error: 'unauthorized',
        message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    const profiles = getUserProfiles(userId)
    const allPosts = getUserPosts(userId)
    const profile = profiles.get(params.id)
    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404 })
    }
    const posts = allPosts.filter((p) => p.author.id === params.id)
    return { profile, posts, authenticated: !!authToken }
  })

  // Notifications
  .get('/uadp/v1/notifications', ({ userId, authToken }) => {
    if (!authToken) {
      return new Response(JSON.stringify({
        error: 'unauthorized',
        message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    return { items: getUserNotifications(userId), authenticated: !!authToken }
  })

  // Search
  .get('/uadp/v1/search', ({ query, userId, authToken }) => {
    if (!authToken) {
      return new Response(JSON.stringify({
        error: 'unauthorized',
        message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    const allPosts = getUserPosts(userId)
    const q = (query.q ?? '').toLowerCase()
    if (!q) return { items: [], authenticated: !!authToken }
    const results = allPosts.filter(
      (p) =>
        p.body.toLowerCase().includes(q) ||
        p.label.toLowerCase().includes(q) ||
        p.tags.some((tag) => tag.toLowerCase().includes(q))
    )
    return { items: results, authenticated: !!authToken }
  })

  // Create post
  .post(
    '/uadp/v1/post/create',
    ({ body, userId, authToken }) => {
      if (!authToken) {
        return new Response(JSON.stringify({
          error: 'unauthorized',
          message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.'
        }), { status: 401, headers: { 'Content-Type': 'application/json' } })
      }
      const user = getUserById(userId)
      const allPosts = getUserPosts(userId)
      const newPost: UadpPost = {
        uadp_type: 'uadp:post',
        id: `post:${crypto.randomUUID()}`,
        ts: Date.now(),
        label: body.body.slice(0, 80),
        body: body.body,
        author: {
          id: user.id,
          name: user.name,
          handle: user.handle,
          avatar_url: user.avatar_url,
          verified: false,
        },
        likes: 0,
        reposts: 0,
        replies_count: 0,
        lang: body.lang ?? 'es',
        tags: body.tags ?? [],
      }
      allPosts.unshift(newPost)
      return { ...newPost, authenticated: !!authToken }
    },
    {
      body: t.Object({
        body: t.String({ minLength: 1 }),
        lang: t.Optional(t.String()),
        tags: t.Optional(t.Array(t.String())),
      }),
    }
  )

  // Like post
  .post('/uadp/v1/post/:id/like', ({ params, userId, authToken }) => {
    if (!authToken) {
      return new Response(JSON.stringify({
        error: 'unauthorized',
        message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    const allPosts = getUserPosts(userId)
    const post = allPosts.find((p) => p.id === params.id)
    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404 })
    }
    post.likes += 1
    return { id: post.id, likes: post.likes, authenticated: !!authToken }
  })

  // Trending topics
  .get('/uadp/v1/trending', ({ userId, authToken }) => {
    return { items: getUserTrending(userId), authenticated: !!authToken }
  })

  .listen(4001)

console.log(`Nova running on http://localhost:4001`)
