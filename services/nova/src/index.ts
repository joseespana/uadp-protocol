import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { loadAllUsersData, requestLogger, uadpAuth, uadpAuthRoutes, USERS, getUserById, connectMongo, createMongoFeed } from 'cosmos-core'
import type { UadpManifest, UadpPost, UadpNotification, UadpAiHints } from 'cosmos-core'

// ---------- Data ----------

interface NovaData {
  feed: UadpPost[]
  user_posts: UadpPost[]
  notifications: UadpNotification[]
  trending: { tag: string; count: number }[]
}

const allUsersData = loadAllUsersData<NovaData>('nova-posts')

// MongoDB feed for real scraped social posts — falls back to static JSON
await connectMongo()
const staticPosts = (allUsersData.get('alejandro') ?? { feed: [] }).feed ?? []
const mongoPosts = createMongoFeed<UadpPost>('posts', [], { limit: 200 })

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
  const base = userPosts.get(userId) || userPosts.get('alejandro') || []
  const scraped = mongoPosts.getItems()
  return scraped.length > 0 ? [...scraped, ...base] : base
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
    { path: '/uadp/v1/feed',            method: 'GET',  description: 'Main timeline feed',              auth_required: false },
    { path: '/uadp/v1/feed/stream',     method: 'GET',  description: 'Real-time timeline (SSE)',        auth_required: false, streaming: true },
    { path: '/uadp/v1/profile/:id',     method: 'GET',  description: 'User profile',                    auth_required: false },
    { path: '/uadp/v1/notifications',   method: 'GET',  description: 'User notifications',              auth_required: false },
    { path: '/uadp/v1/search',          method: 'GET',  description: 'Search posts',                    auth_required: false },
    { path: '/uadp/v1/post/create',     method: 'POST', description: 'Create a new post',               auth_required: true },
    { path: '/uadp/v1/post/:id/thread', method: 'GET',  description: 'Get post with replies/thread',    auth_required: false },
    { path: '/uadp/v1/post/:id/like',   method: 'POST', description: 'Like a post',                     auth_required: true },
    { path: '/uadp/v1/trending',        method: 'GET',  description: 'Trending topics',                 auth_required: false },
  ],
  ai_hints: {
    persona: 'Nova is a text-based social network for conversations about technology, culture, and daily life — similar to Twitter/X.',
    language: 'en',
    rendering: {
      layout: 'timeline',
      accent: '#3b82f6',
      date_format: 'relative',
      card: {
        title: '$.author.name',
        subtitle: '$.author.handle',
        body: '$.body',
        avatar: '$.author.avatar_url',
        badge: '$.lang',
        meta: ['$.likes | number', '$.reposts | number', '$.replies_count | number'],
      },
      detail: {
        body: '$.body',
        fields: [
          { label: 'Tags', value: '$.tags' },
          { label: 'Posted', value: '$.ts | date' },
        ],
      },
      actions: [
        { label: 'Like', icon: 'heart', endpoint: '/uadp/v1/post/:id/like', method: 'POST' },
        { label: 'New Post', icon: 'edit', endpoint: '/uadp/v1/post/create', method: 'POST' },
      ],
      empty_state: { icon: 'message-circle', message: 'No posts found. Try a different search.' },
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
      get_token: 'POST /uadp/v1/auth/register with email, then POST /uadp/v1/auth/login with email and passkey',
    },
    proactive_suggestions: [
      'If there are more than 10 unread notifications, mention it when opening.',
      'If a trending topic relates to the user interests, suggest it.',
    ],
  } satisfies UadpAiHints,
  search: {
    endpoint: '/uadp/v1/search',
    param: 'q',
    fields_searched: ['body', 'author.name', 'author.handle', 'tags'],
    min_length: 2,
    sort_options: ['relevance', 'recent', 'popular'],
    response_schema: {
      result_keys: ['items'],
      result_types: { items: 'uadp:post' },
    },
    preview_fields: {
      title: '$.author.name',
      snippet: '$.body',
      image: '$.author.avatar_url',
      meta: ['$.likes | number', '$.ts | date'],
    },
    domain_tags: ['social', 'posts', 'tweets', 'discussions', 'tech', 'community', 'timeline', 'threads'],
    relevance_weight: 0.7,
  },
  pagination: { strategy: 'cursor', default_page_size: 20, max_page_size: 50 },
  realtime: [
    { transport: 'sse', endpoint: '/uadp/v1/feed/stream', event_types: ['new_post', 'like', 'repost'], event_schema: 'uadp:post', trigger: 'on_view_open' },
  ],
  cache: {
    '/uadp/v1/feed': { max_age_seconds: 30, offline_safe: false },
    '/uadp/v1/trending': { max_age_seconds: 300, offline_safe: true },
    '/uadp/v1/profile/:id': { max_age_seconds: 600, offline_safe: true },
  },
  versioning: { hints_version: '2.0.0', last_updated: 1743300000, changelog: 'v2: prescriptive rendering hints with layout, card, detail, actions.' },
  content_stats: {
    total_items: 1927,
    types: { 'uadp:post': 1927 },
    update_frequency: 'minutely',
    last_content_update: '2026-04-08T12:00:00Z',
  },
  content_taxonomy: ['tech', 'culture', 'daily-life', 'startups', 'programming'],
  intents: {
    browse:  { description: 'Browse the main timeline feed',        endpoints: ['/uadp/v1/feed'] },
    post:    { description: 'Create a new post',                    endpoints: ['/uadp/v1/post/create'],   auth_required: true },
    search:  { description: 'Search posts by keyword or tag',       endpoints: ['/uadp/v1/search'] },
    like:    { description: 'Like a post',                          endpoints: ['/uadp/v1/post/:id/like'], auth_required: true },
    follow:  { description: 'Follow another user profile',          endpoints: ['/uadp/v1/profile/:id'] },
  },
  featured: [
    { uadp_type: 'uadp:post', title: 'Just shipped a new open-source Rust HTTP client — check it out!', category: 'programming' },
    { uadp_type: 'uadp:post', title: 'Hot take: AI agents will replace SaaS dashboards within 3 years', category: 'tech' },
    { uadp_type: 'uadp:post', title: 'México City skyline at dawn — nothing beats the CDMX morning',   category: 'daily-life' },
  ],
  quality: {
    data_source:       'user-generated',
    verification:      'none',
    content_freshness: 'real-time',
    content_rating:    'general',
  },
  relationships: [
    { service: 'pulse',  relation: 'cross-posted', description: 'Visual posts cross-posted from Pulse' },
    { service: 'herald', relation: 'shared',        description: 'Herald articles shared and discussed on Nova' },
  ],
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
    return { items: getUserNotifications(userId), authenticated: !!authToken }
  })

  // Search
  .get('/uadp/v1/search', ({ query, userId, authToken }) => {
    const allPosts = getUserPosts(userId)
    const q = (query.q ?? '').toLowerCase()
    if (!q) return { type: 'uadp:search_results' as const, query: '', items: [], total: 0, authenticated: !!authToken }
    const results = allPosts.filter(
      (p) =>
        p.body.toLowerCase().includes(q) ||
        p.label.toLowerCase().includes(q) ||
        p.tags.some((tag) => tag.toLowerCase().includes(q))
    )
    return { type: 'uadp:search_results' as const, query: q, items: results, total: results.length, authenticated: !!authToken }
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

  // Thread / replies for a post
  .get('/uadp/v1/post/:id/thread', ({ params, userId, authToken }) => {
    const allPosts = getUserPosts(userId)
    const post = allPosts.find((p) => p.id === params.id)
    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404 })
    }

    // Generate deterministic fake replies based on post ID
    const replyCount = post.replies_count || post.comments_count || 0
    const actualCount = Math.min(replyCount, 15) // cap at 15 replies
    const replyAuthors = [
      { id: 'reply_user_1', name: 'María García', handle: '@maria_dev', avatar_url: 'https://picsum.photos/seed/reply1/100/100' },
      { id: 'reply_user_2', name: 'Carlos López', handle: '@carlos_tech', avatar_url: 'https://picsum.photos/seed/reply2/100/100' },
      { id: 'reply_user_3', name: 'Ana Martínez', handle: '@ana_writes', avatar_url: 'https://picsum.photos/seed/reply3/100/100' },
      { id: 'reply_user_4', name: 'Diego Ruiz', handle: '@diego_sf', avatar_url: 'https://picsum.photos/seed/reply4/100/100' },
      { id: 'reply_user_5', name: 'Sofia Chen', handle: '@sofia_ux', avatar_url: 'https://picsum.photos/seed/reply5/100/100' },
      { id: 'reply_user_6', name: 'Javier Morales', handle: '@javi_code', avatar_url: 'https://picsum.photos/seed/reply6/100/100' },
      { id: 'reply_user_7', name: 'Valentina Torres', handle: '@val_design', avatar_url: 'https://picsum.photos/seed/reply7/100/100' },
      { id: 'reply_user_8', name: 'Lucas Hernández', handle: '@lucas_pm', avatar_url: 'https://picsum.photos/seed/reply8/100/100' },
    ]
    const replyBodies = [
      'Totally agree with this! Great perspective.',
      'Interesting take. I had a different experience though — the key is consistency.',
      'This is exactly what I was thinking about yesterday. Well said!',
      'Hot take but I think you\'re right. The industry needs to catch up.',
      '100% this. Shared with my team.',
      'Hmm, not sure I agree. What about the edge cases?',
      'This changed my mind about the whole topic. Thanks for sharing.',
      'Been saying this for years! Finally someone gets it.',
      'Great thread. Would love to see a follow-up on this.',
      'Saving this for later. Really insightful.',
      'The data backs this up. I did some research last week and found similar patterns.',
      'Counterpoint: what if we approach it from the user\'s perspective instead?',
      'This is why I follow you. Always dropping knowledge.',
      'Just tried this approach and it actually works. Mind blown.',
      'Nuanced take. Refreshing to see this kind of discussion here.',
    ]

    const replies = Array.from({ length: actualCount }, (_, i) => ({
      uadp_type: 'uadp:post' as const,
      id: `${post.id}:reply:${i}`,
      ts: post.ts - (actualCount - i) * 300, // replies spread over time
      label: replyBodies[i % replyBodies.length].slice(0, 60),
      body: replyBodies[i % replyBodies.length],
      author: { ...replyAuthors[i % replyAuthors.length], verified: i % 5 === 0 },
      likes: Math.floor(Math.random() * 50),
      reposts: Math.floor(Math.random() * 10),
      replies_count: 0,
      lang: 'en',
      tags: [],
      parent_id: post.id,
    }))

    return {
      type: 'uadp:thread',
      post,
      replies,
      total_replies: replyCount,
      authenticated: !!authToken,
    }
  })

  // Like post
  .post('/uadp/v1/post/:id/like', ({ params, userId, authToken }) => {
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
