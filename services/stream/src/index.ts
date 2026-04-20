import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { loadAllUsersData, requestLogger, uadpAuth, uadpAuthRoutes, connectMongo, createMongoFeed, type UadpManifest } from 'cosmos-core'

// ── Data ────────────────────────────────────────────────────────────────────

interface StreamVideo {
  id: string
  ts: number
  title: string
  description: string
  thumbnail_url: string
  video_url: string
  duration_seconds: number
  views: number
  likes: number
  dislikes: number
  channel: {
    id: string
    name: string
    handle: string
    avatar_url: string
    subscribers: number
    verified?: boolean
  }
  tags: string[]
  lang?: string
}

interface StreamChannel {
  id: string
  name: string
  handle: string
  avatar_url: string
  subscribers: number
  verified?: boolean
  description?: string
}

interface StreamData {
  feed: StreamVideo[]
  history: StreamVideo[]
  subscriptions: StreamChannel[]
  user_videos: StreamVideo[]
}

const allUsersData = loadAllUsersData<StreamData>('stream-history')

// MongoDB feed for real scraped videos — falls back to static JSON
await connectMongo()
const staticFeed = (allUsersData.get('jose_espana') ?? { feed: [] }).feed ?? []
const mongoFeed = createMongoFeed<StreamVideo>('videos', staticFeed, { limit: 300 })

function getUserData(userId: string): StreamData {
  const base = allUsersData.get(userId) || allUsersData.get('jose_espana') || { feed: [], history: [], subscriptions: [], user_videos: [] }
  // Merge MongoDB videos into the feed (real scraped content takes priority)
  return { ...base, feed: [...mongoFeed.getItems(), ...base.feed] }
}

// ── Manifest ────────────────────────────────────────────────────────────────

const manifest: UadpManifest = {
  service_id: 'stream',
  service_name: 'Stream',
  uadp_version: '0.1.0',
  category: 'media:video',
  base_url: 'http://localhost:4006',
  endpoints: [
    { path: '/uadp/v1/auth/register', method: 'POST', description: 'Register with email to get passkey', auth_required: false },
    { path: '/uadp/v1/auth/login', method: 'POST', description: 'Login with email + passkey to get session token', auth_required: false },
    { path: '/uadp/v1/auth/verify', method: 'POST', description: 'Verify if a token is valid', auth_required: false },
    { path: '/uadp/v1/feed', method: 'GET', description: 'Personalized video feed, paginated', auth_required: false },
    { path: '/uadp/v1/history', method: 'GET', description: 'Watch history, paginated', auth_required: false },
    { path: '/uadp/v1/subscriptions', method: 'GET', description: 'Subscribed channels', auth_required: false },
    { path: '/uadp/v1/library', method: 'GET', description: 'Saved and own videos', auth_required: false },
    { path: '/uadp/v1/search', method: 'GET', description: 'Search videos by title, description, or tags', auth_required: false },
    { path: '/uadp/v1/playback/state', method: 'GET', description: 'Last watched video playback state', auth_required: false },
  ],
  ai_hints: {
    persona: 'Stream is the video platform — similar to YouTube. Watch videos, explore feeds, search content and manage subscriptions.',
    language: 'en',
    rendering: {
      layout: 'video_gallery',
      accent: '#ef4444',
      date_format: 'relative',
      number_format: 'compact',
      card: {
        title: '$.title',
        subtitle: '$.channel.name',
        image: '$.thumbnail_url',
        meta: ['$.views | number', '$.duration_seconds | duration', '$.likes | number'],
      },
      detail: {
        body: '$.description',
        media: '$.youtube_url || $.video_url',
        media_type: 'video_embed',
        fields: [
          { label: 'Channel', value: '$.channel.name' },
          { label: 'Subscribers', value: '$.channel.subscribers | number' },
          { label: 'Published', value: '$.ts | date' },
          { label: 'Tags', value: '$.tags' },
        ],
      },
      empty_state: { icon: 'play-circle', message: 'No videos found. Try a different search.' },
    },
    key_concepts: {
      'youtube_url': 'If present, this is a real YouTube video URL. Falls back to video_url for internal videos.',
      'thumbnail_url': 'Video thumbnail from YouTube CDN. Always display prominently.',
      'duration_seconds': 'Video length in seconds. Format as mm:ss.',
    },
    user_goals: [
      'Watch recommended video feed',
      'Search videos on a topic',
      'View watch history',
      'View subscriptions',
    ],
    auth: {
      method: 'Bearer token in Authorization header',
      get_token: 'POST /uadp/v1/auth/register with email, then POST /uadp/v1/auth/login with email and passkey',
    },
  } satisfies UadpAiHints,
  search: {
    endpoint: '/uadp/v1/search',
    param: 'q',
    fields_searched: ['title', 'description', 'channel.name', 'tags'],
    min_length: 2,
    sort_options: ['relevance', 'date', 'views'],
    response_schema: {
      result_keys: ['items'],
      result_types: { items: 'uadp:video' },
    },
    preview_fields: {
      title: '$.title',
      snippet: '$.description',
      image: '$.thumbnail_url',
      meta: ['$.views | number', '$.duration_seconds | duration', '$.channel.name'],
    },
    domain_tags: ['video', 'youtube', 'watch', 'streaming', 'tutorials', 'tech', 'entertainment', 'reviews'],
    relevance_weight: 0.8,
  },
  pagination: { strategy: 'cursor', default_page_size: 20, max_page_size: 50 },
  cache: {
    '/uadp/v1/feed': { max_age_seconds: 60, offline_safe: false },
    '/uadp/v1/search': { max_age_seconds: 120, offline_safe: true },
  },
  versioning: { hints_version: '2.0.0', last_updated: 1743300000 },
  content_stats: {
    total_items: 560,
    types: { 'uadp:video': 560 },
    update_frequency: 'hourly',
    last_content_update: '2026-04-08T12:00:00Z',
  },
  content_taxonomy: ['tech-reviews', 'tutorials', 'entertainment', 'music-videos', 'vlogs'],
  intents: {
    watch:     { description: 'Watch a video from the feed or search results',  endpoints: ['/uadp/v1/feed'] },
    search:    { description: 'Search for videos by title, channel, or topic',  endpoints: ['/uadp/v1/search'] },
    subscribe: { description: 'View and manage channel subscriptions',          endpoints: ['/uadp/v1/subscriptions'] },
    like:      { description: 'Like a video',                                   endpoints: ['/uadp/v1/feed'] },
  },
  featured: [
    { uadp_type: 'uadp:video', title: 'Rust vs Go in 2026 — which one should you learn?', category: 'tech-reviews', channel: 'CodeLab MX'   },
    { uadp_type: 'uadp:video', title: 'Building a REST API with Bun + Elysia in 20 min',  category: 'tutorials',    channel: 'DevStream LATAM' },
    { uadp_type: 'uadp:video', title: 'My SF apartment studio setup — 2026 edition',      category: 'vlogs',        channel: 'JoseEspana' },
  ],
  quality: {
    data_source:       'user-generated',
    verification:      'community-moderated',
    content_freshness: 'hourly',
    content_rating:    'general',
  },
  relationships: [
    { service: 'nova', relation: 'discussed', description: 'Stream videos discussed and shared on Nova' },
    { service: 'lyra', relation: 'music_videos', description: 'Official music videos from Lyra artists' },
  ],
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function paginate<T>(items: T[], cursor: string | null, limit: number): { items: T[]; next_cursor: string | null } {
  const startIdx = cursor ? parseInt(cursor, 10) : 0
  const page = items.slice(startIdx, startIdx + limit)
  const nextIdx = startIdx + limit
  return {
    items: page,
    next_cursor: nextIdx < items.length ? String(nextIdx) : null,
  }
}

// ── App ─────────────────────────────────────────────────────────────────────

const app = new Elysia()
  .use(cors())
  .use(requestLogger('Stream'))
  .use(uadpAuth())
  .use(uadpAuthRoutes())

  // Manifest
  .get('/.well-known/uadp.json', () => manifest)

  // Feed (paginated)
  .get('/uadp/v1/feed', ({ query, userId, authToken }) => {
    const data = getUserData(userId)
    const feed = data.feed ?? []
    const limit = Math.min(Number(query.limit) || 10, 50)
    const { items, next_cursor } = paginate(feed, query.cursor ?? null, limit)
    return { type: 'uadp:feed', cursor: next_cursor, items, authenticated: !!authToken }
  })

  // History (paginated)
  .get('/uadp/v1/history', ({ query, userId, authToken }) => {
    const data = getUserData(userId)
    const history = data.history ?? []
    const limit = Math.min(Number(query.limit) || 10, 50)
    const { items, next_cursor } = paginate(history, query.cursor ?? null, limit)
    return { type: 'uadp:history', cursor: next_cursor, items, authenticated: !!authToken }
  })

  // Subscriptions
  .get('/uadp/v1/subscriptions', ({ userId, authToken }) => {
    const data = getUserData(userId)
    return { type: 'uadp:subscriptions', items: data.subscriptions ?? [], authenticated: !!authToken }
  })

  // Library (saved / own videos)
  .get('/uadp/v1/library', ({ userId, authToken }) => {
    const data = getUserData(userId)
    return { type: 'uadp:library', items: data.user_videos ?? [], authenticated: !!authToken }
  })

  // Search (public)
  .get('/uadp/v1/search', ({ query, userId, authToken }) => {
    const data = getUserData(userId)
    const q = (query.q ?? '').toLowerCase().trim()
    if (!q) return { type: 'uadp:search_results' as const, query: '', items: [], total: 0, authenticated: !!authToken }

    const allVideos = [...(data.feed ?? []), ...(data.history ?? []), ...(data.user_videos ?? [])]
    const seen = new Set<string>()
    const results: StreamVideo[] = []

    for (const video of allVideos) {
      if (seen.has(video.id)) continue
      const haystack = `${video.title} ${video.description} ${(video.tags ?? []).join(' ')}`.toLowerCase()
      if (haystack.includes(q)) {
        seen.add(video.id)
        results.push(video)
      }
    }

    return { type: 'uadp:search_results' as const, query: q, items: results, total: results.length, authenticated: !!authToken }
  })

  // Playback state
  .get('/uadp/v1/playback/state', ({ userId, authToken }) => {
    const data = getUserData(userId)
    const history = data.history ?? []
    const lastWatched = history.length > 0 ? history[0] : null
    if (!lastWatched) {
      return { type: 'uadp:playback_state', video_id: null, position_seconds: 0, total_seconds: 0, authenticated: !!authToken }
    }
    // Simulate partially-watched state: ~40% through the last video
    const position = Math.floor(lastWatched.duration_seconds * 0.4)
    return {
      type: 'uadp:playback_state',
      video_id: lastWatched.id,
      position_seconds: position,
      total_seconds: lastWatched.duration_seconds,
      authenticated: !!authToken,
    }
  })

  .listen(4006)

console.log('Stream is running on http://localhost:4006')
