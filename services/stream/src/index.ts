import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { loadAllUsersData, requestLogger, uadpAuth, uadpAuthRoutes, type UadpManifest } from 'cosmos-core'

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

function getUserData(userId: string): StreamData {
  return allUsersData.get(userId) || allUsersData.get('alejandro') || { feed: [], history: [], subscriptions: [], user_videos: [] }
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
    { path: '/uadp/v1/feed', method: 'GET', description: 'Personalized video feed, paginated', auth_required: true },
    { path: '/uadp/v1/history', method: 'GET', description: 'Watch history, paginated', auth_required: true },
    { path: '/uadp/v1/subscriptions', method: 'GET', description: 'Subscribed channels', auth_required: true },
    { path: '/uadp/v1/library', method: 'GET', description: 'Saved and own videos', auth_required: true },
    { path: '/uadp/v1/search', method: 'GET', description: 'Search videos by title, description, or tags', auth_required: false },
    { path: '/uadp/v1/playback/state', method: 'GET', description: 'Last watched video playback state', auth_required: true },
  ],
  ai_hints: {
    description:
      'Stream is the video platform — similar to YouTube. Watch videos, explore a personalized feed, search content and manage subscriptions.',
    features: [
      'Personalized video feed',
      'Watch history',
      'Search by title, description and tags',
      'Channel subscriptions management',
      'Saved and own videos library',
      'Playback state for resuming videos',
    ],
    rendering: {
      default_view: 'list',
      thumbnail_display: 'prominent',
      video_card: 'Show thumbnail, title, channel, views, and duration',
      duration_format: 'mm:ss or hh:mm:ss',
    },
    key_concepts: {
      'youtube_url': 'If present, this is a real YouTube video. Use this URL to embed or link to the actual video. Render with an iframe or open in a new tab.',
      'thumbnail_url': 'Video thumbnail image. For real YouTube videos, this is from img.youtube.com CDN. Always display prominently.',
      'channel': 'Content creator with name and subscriber count. Display alongside the video.',
      'duration_seconds': 'Video length in seconds. Format as mm:ss or hh:mm:ss for display.',
      'views': 'Total view count. Format with commas or abbreviate (e.g., 1.2M).',
      'likes': 'Total like count.',
      'tags': 'Topic tags for categorization and search.',
      'ext.thread': 'If present, links this video to a cross-service narrative thread. Related content exists in other services (Nova posts, Market orders, etc.) with the same thread ID.',
      'ext.topics': 'Semantic topic tags shared across services for AI-powered content joining.',
    },
    user_goals: [
      'Watch recommended video feed',
      'Search videos on a topic',
      'View watch history',
      'View subscriptions',
      'Resume watching a video',
    ],
    auth: {
      method: 'Bearer token in Authorization header',
      public_endpoints: 'Endpoints with auth_required: false work without a token',
      private_endpoints: 'Endpoints with auth_required: true need Authorization: Bearer <token>',
      get_token: 'POST /uadp/v1/auth/register with email, then POST /uadp/v1/auth/login with email and passkey',
    },
    platform_notes: [
      'Thumbnails should be displayed prominently on each video card.',
      'The main feed is sorted by personalized relevance.',
      'History is sorted chronologically, most recent first.',
      'Videos with a youtube_url field are real YouTube videos — use the URL to render an embedded player or link out.',
      'The thumbnail_url for real videos uses https://img.youtube.com/vi/{VIDEO_ID}/maxresdefault.jpg which is a real CDN image.',
    ],
  },
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
    if (!authToken) {
      return new Response(JSON.stringify({
        error: 'unauthorized',
        message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    const data = getUserData(userId)
    const feed = data.feed ?? []
    const limit = Math.min(Number(query.limit) || 10, 50)
    const { items, next_cursor } = paginate(feed, query.cursor ?? null, limit)
    return { type: 'uadp:feed', cursor: next_cursor, items, authenticated: !!authToken }
  })

  // History (paginated)
  .get('/uadp/v1/history', ({ query, userId, authToken }) => {
    if (!authToken) {
      return new Response(JSON.stringify({
        error: 'unauthorized',
        message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    const data = getUserData(userId)
    const history = data.history ?? []
    const limit = Math.min(Number(query.limit) || 10, 50)
    const { items, next_cursor } = paginate(history, query.cursor ?? null, limit)
    return { type: 'uadp:history', cursor: next_cursor, items, authenticated: !!authToken }
  })

  // Subscriptions
  .get('/uadp/v1/subscriptions', ({ userId, authToken }) => {
    if (!authToken) {
      return new Response(JSON.stringify({
        error: 'unauthorized',
        message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    const data = getUserData(userId)
    return { type: 'uadp:subscriptions', items: data.subscriptions ?? [], authenticated: !!authToken }
  })

  // Library (saved / own videos)
  .get('/uadp/v1/library', ({ userId, authToken }) => {
    if (!authToken) {
      return new Response(JSON.stringify({
        error: 'unauthorized',
        message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    const data = getUserData(userId)
    return { type: 'uadp:library', items: data.user_videos ?? [], authenticated: !!authToken }
  })

  // Search (public)
  .get('/uadp/v1/search', ({ query, userId, authToken }) => {
    const data = getUserData(userId)
    const q = (query.q ?? '').toLowerCase().trim()
    if (!q) return { type: 'uadp:search', query: '', items: [], authenticated: !!authToken }

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

    return { type: 'uadp:search', query: q, items: results, authenticated: !!authToken }
  })

  // Playback state
  .get('/uadp/v1/playback/state', ({ userId, authToken }) => {
    if (!authToken) {
      return new Response(JSON.stringify({
        error: 'unauthorized',
        message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
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
