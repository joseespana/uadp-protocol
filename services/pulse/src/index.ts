import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { loadAllUsersData, requestLogger, uadpAuth, uadpAuthRoutes } from 'cosmos-core'
import type { UadpManifest, UadpAiHints } from 'cosmos-core'

// ── Data ────────────────────────────────────────────────────────────────────

interface PulsePhoto {
  uadp_type: string
  id: string
  ts: number
  label: string
  body: string
  author: {
    id: string
    name: string
    handle: string
    avatar_url: string
    verified?: boolean
  }
  media_url?: string
  media_type?: string
  aspect_ratio?: string
  likes: number
  reposts: number
  replies_count: number
  lang: string
  tags: string[]
}

interface PulseStory {
  id: string
  user: {
    id: string
    name: string
    handle: string
    avatar_url: string
  }
  media_url: string
  ts: number
  expires_at: number
  seen: boolean
}

interface PulseData {
  feed: PulsePhoto[]
  user_posts: PulsePhoto[]
  stories: PulseStory[]
  explore: PulsePhoto[]
}

const allUsersData = loadAllUsersData<PulseData>('pulse-photos')

// Per-user mutable state
const userAllPosts = new Map<string, PulsePhoto[]>()
const userStories = new Map<string, PulseStory[]>()
const userExplore = new Map<string, PulsePhoto[]>()
const userProfiles = new Map<string, Map<string, PulsePhoto['author']>>()

for (const [userId, data] of allUsersData) {
  const feed = data.feed ?? []
  userAllPosts.set(userId, [...feed])
  userStories.set(userId, data.stories ?? [])
  userExplore.set(userId, data.explore ?? [])

  const profiles = new Map<string, PulsePhoto['author']>()
  for (const post of feed) {
    if (!profiles.has(post.author.id)) {
      profiles.set(post.author.id, post.author)
    }
  }
  userProfiles.set(userId, profiles)
}

function getAllPosts(userId: string): PulsePhoto[] {
  return userAllPosts.get(userId) || userAllPosts.get('alejandro') || []
}
function getStories(userId: string): PulseStory[] {
  return userStories.get(userId) || userStories.get('alejandro') || []
}
function getExplore(userId: string): PulsePhoto[] {
  return userExplore.get(userId) || userExplore.get('alejandro') || []
}
function getProfiles(userId: string): Map<string, PulsePhoto['author']> {
  return userProfiles.get(userId) || userProfiles.get('alejandro') || new Map()
}

// ── UADP Manifest ───────────────────────────────────────────────────────────

const manifest: UadpManifest = {
  service_id: 'pulse',
  service_name: 'Pulse',
  uadp_version: '1.0',
  category: 'uadp:visual_social',
  base_url: '/uadp/v1',
  endpoints: [
    { path: '/uadp/v1/auth/register', method: 'POST', description: 'Register with email to get passkey', auth_required: false },
    { path: '/uadp/v1/auth/login', method: 'POST', description: 'Login with email + passkey to get session token', auth_required: false },
    { path: '/uadp/v1/auth/verify', method: 'POST', description: 'Verify if a token is valid', auth_required: false },
    { path: '/uadp/v1/feed', method: 'GET', description: 'Paginated visual feed', auth_required: false },
    { path: '/uadp/v1/feed/stream', method: 'GET', description: 'SSE stream of feed posts', auth_required: false, streaming: true },
    { path: '/uadp/v1/explore', method: 'GET', description: 'Explore / discover feed', auth_required: false },
    { path: '/uadp/v1/stories', method: 'GET', description: 'Active stories carousel', auth_required: false },
    { path: '/uadp/v1/profile/:id', method: 'GET', description: 'User profile and media grid', auth_required: false },
    { path: '/uadp/v1/notifications', method: 'GET', description: 'User notifications', auth_required: false },
    { path: '/uadp/v1/post/create', method: 'POST', description: 'Create a media post', auth_required: true },
    { path: '/uadp/v1/post/:id/like', method: 'POST', description: 'Like a post', auth_required: true },
    { path: '/uadp/v1/dm/inbox', method: 'GET', description: 'Direct messages inbox', auth_required: false },
  ],
  ai_hints: {
    persona: 'Pulse is a visual social network combining Instagram and TikTok. Content includes photos, carousels, and short-form vertical videos.',
    language: 'en',
    rendering: {
      layout: 'media_grid',
      accent: '#fb923c',
      date_format: 'relative',
      card: {
        title: '$.author.name',
        subtitle: '$.author.handle',
        body: '$.body',
        image: '$.media_url',
        avatar: '$.author.avatar_url',
        meta: ['$.likes | number', '$.reposts | number'],
      },
      detail: {
        body: '$.body',
        media: '$.media_url',
        media_type: 'image',
      },
      actions: [
        { label: 'Like', icon: 'heart', endpoint: '/uadp/v1/post/:id/like', method: 'POST' },
      ],
      config: {
        grid_columns: 3,
        aspect_ratio_field: '$.aspect_ratio',
        media_type_field: '$.media_type',
        story_support: true,
        dynamic_media_type: '$.media_type',
      },
      empty_state: { icon: 'image', message: 'No photos or videos found.' },
    },
    key_concepts: {
      'aspect_ratio': 'Width-to-height ratio for rendering media (e.g. 1:1, 4:5, 9:16).',
      'media_type': 'image, video, or carousel.',
    },
    user_goals: [
      'Browse the visual feed of photos and videos',
      'Explore trending visual content',
      'View stories from friends',
      'Post a new photo with a caption',
    ],
    auth: {
      method: 'Bearer token in Authorization header',
      get_token: 'POST /uadp/v1/auth/register with email, then POST /uadp/v1/auth/login with email and passkey',
    },
  } satisfies UadpAiHints,
  pagination: { strategy: 'cursor', default_page_size: 20, max_page_size: 50 },
  realtime: [
    { transport: 'sse', endpoint: '/uadp/v1/feed/stream', event_types: ['new_post'], event_schema: 'uadp:media_post', trigger: 'on_view_open' },
  ],
  versioning: { hints_version: '2.0.0', last_updated: 1743300000 },
}

// ── App ─────────────────────────────────────────────────────────────────────

const app = new Elysia()
  .use(cors())
  .use(requestLogger('Pulse'))
  .use(uadpAuth())
  .use(uadpAuthRoutes())

  // UADP Manifest
  .get('/.well-known/uadp.json', () => manifest)

  // Paginated feed
  .get('/uadp/v1/feed', ({ query, userId, authToken }) => {
    const allPosts = getAllPosts(userId)
    const cursor = query.cursor ? parseInt(query.cursor, 10) : 0
    const limit = query.limit ? Math.min(parseInt(query.limit, 10), 50) : 20
    const page = allPosts.slice(cursor, cursor + limit)
    const nextCursor = cursor + limit < allPosts.length ? String(cursor + limit) : null

    return {
      type: 'uadp:feed',
      cursor: nextCursor,
      items: page,
      authenticated: !!authToken,
    }
  })

  // SSE feed stream (generator)
  .get('/uadp/v1/feed/stream', ({ userId, authToken }) => {
    const allPosts = getAllPosts(userId)
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

  // Explore feed
  .get('/uadp/v1/explore', ({ userId, authToken }) => {
    return {
      type: 'uadp:feed',
      cursor: null,
      items: getExplore(userId),
      authenticated: !!authToken,
    }
  })

  // Active stories
  .get('/uadp/v1/stories', ({ userId, authToken }) => {
    return {
      type: 'uadp:stories',
      items: getStories(userId),
      authenticated: !!authToken,
    }
  })

  // User profile
  .get('/uadp/v1/profile/:id', ({ params, userId, authToken }) => {
    const profiles = getProfiles(userId)
    const allPosts = getAllPosts(userId)
    const profile = profiles.get(params.id)
    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404 })
    }
    const posts = allPosts.filter((p) => p.author.id === params.id)
    return {
      type: 'uadp:profile',
      profile,
      posts_count: posts.length,
      posts,
      authenticated: !!authToken,
    }
  })

  // Notifications (stub)
  .get('/uadp/v1/notifications', ({ authToken }) => {
    return { items: [], authenticated: !!authToken }
  })

  // Create media post
  .post(
    '/uadp/v1/post/create',
    ({ body, userId, authToken }) => {
      if (!authToken) {
        return new Response(JSON.stringify({
          error: 'unauthorized',
          message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.'
        }), { status: 401, headers: { 'Content-Type': 'application/json' } })
      }
      const allPosts = getAllPosts(userId)
      const newPost: PulsePhoto = {
        uadp_type: 'uadp:media_post',
        id: `pulse-post-${crypto.randomUUID()}`,
        ts: Date.now(),
        label: body.caption.slice(0, 80),
        body: body.caption,
        author: {
          id: 'user:current',
          name: 'Current User',
          handle: '@me',
          avatar_url: '/avatars/default.jpg',
        },
        media_url: body.media_url,
        media_type: body.media_type ?? 'image',
        aspect_ratio: body.aspect_ratio ?? '1:1',
        likes: 0,
        reposts: 0,
        replies_count: 0,
        lang: 'en',
        tags: body.tags ?? [],
      }
      allPosts.unshift(newPost)
      return { type: 'uadp:post_created', post: newPost, authenticated: !!authToken }
    },
    {
      body: t.Object({
        caption: t.String({ minLength: 1 }),
        media_url: t.String(),
        media_type: t.Optional(t.String()),
        aspect_ratio: t.Optional(t.String()),
        tags: t.Optional(t.Array(t.String())),
      }),
    }
  )

  // Like post
  .post('/uadp/v1/post/:id/like', ({ params, userId, authToken }) => {
    const allPosts = getAllPosts(userId)
    const explore = getExplore(userId)
    const post = allPosts.find((p) => p.id === params.id) ?? explore.find((p) => p.id === params.id)
    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404 })
    }
    post.likes += 1
    return { id: post.id, likes: post.likes, authenticated: !!authToken }
  })

  // DM inbox (stub)
  .get('/uadp/v1/dm/inbox', ({ authToken }) => {
    return { items: [], authenticated: !!authToken }
  })

  .listen(4002)

console.log('Pulse running on http://localhost:4002')
