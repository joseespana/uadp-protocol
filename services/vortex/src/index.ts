import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { loadData, loadAllUsersData, requestLogger, uadpAuth, uadpAuthRoutes, type UadpManifest } from 'cosmos-core'

// ── Data ────────────────────────────────────────────────────────────────────

interface VortexTitle {
  uadp_type: 'uadp:title'
  id: string
  ts: number
  label: string
  title: string
  synopsis: string
  type: 'movie' | 'series'
  genre: string[]
  poster_url: string
  backdrop_url: string
  rating: number
  year: number
  duration_minutes?: number
  seasons?: number
  episodes?: number
  progress?: { season?: number; episode?: number; percent: number }
}

interface VortexData {
  catalog: VortexTitle[]
  continue_watching: VortexTitle[]
  my_list: string[]
  trending: VortexTitle[]
}

// Shared catalog and trending loaded once
const sharedData = loadData<VortexData>('vortex-catalog')
const catalog = sharedData.catalog ?? []
const trending = sharedData.trending ?? []

// Per-user data
const allUsersData = loadAllUsersData<VortexData>('vortex-catalog')
const userContinueWatching = new Map<string, VortexTitle[]>()
const userMyList = new Map<string, Set<string>>()

for (const [userId, data] of allUsersData) {
  userContinueWatching.set(userId, data.continue_watching ?? [])
  userMyList.set(userId, new Set(data.my_list ?? []))
}

function getContinueWatching(userId: string): VortexTitle[] {
  return userContinueWatching.get(userId) || userContinueWatching.get('alejandro') || []
}
function getMyList(userId: string): Set<string> {
  if (!userMyList.has(userId)) userMyList.set(userId, new Set())
  return userMyList.get(userId)!
}

// ── Manifest ────────────────────────────────────────────────────────────────

const manifest: UadpManifest = {
  service_id: 'vortex',
  service_name: 'Vortex',
  uadp_version: '0.1.0',
  category: 'media:vod',
  base_url: 'http://localhost:4010',
  endpoints: [
    { path: '/uadp/v1/auth/register', method: 'POST', description: 'Register with email to get passkey', auth_required: false },
    { path: '/uadp/v1/auth/login', method: 'POST', description: 'Login with email + passkey to get session token', auth_required: false },
    { path: '/uadp/v1/auth/verify', method: 'POST', description: 'Verify if a token is valid', auth_required: false },
    { path: '/uadp/v1/continue-watching', method: 'GET', description: 'Titles in progress', auth_required: true },
    { path: '/uadp/v1/my-list', method: 'GET', description: 'User saved titles', auth_required: true },
    { path: '/uadp/v1/trending', method: 'GET', description: 'Top 10 trending titles', auth_required: false },
    { path: '/uadp/v1/catalog', method: 'GET', description: 'Full catalog, filterable by type and genre', auth_required: false },
    { path: '/uadp/v1/title/:id', method: 'GET', description: 'Title detail', auth_required: false },
    { path: '/uadp/v1/search', method: 'GET', description: 'Search titles by name or genre', auth_required: false },
  ],
  ai_hints: {
    description:
      'Vortex is the movies and series platform — similar to Netflix. Browse catalog, manage a personal list, and track what you are watching.',
    features: [
      'Movies and series catalog',
      'Continue watching — titles in progress',
      'Personal saved titles list',
      'Trending — most popular',
      'Search by title or genre',
    ],
    rendering: {
      default_view: 'grid',
      poster_display: 'prominent',
      title_card: 'Show poster, title, year, rating and genres',
    },
    user_goals: [
      'See what I am currently watching',
      'Search for a movie or series',
      'See what is trending',
      'View my saved list',
    ],
  },
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function paginate<T>(items: T[], cursor: string | null, limit: number): { items: T[]; next_cursor: string | null } {
  const startIdx = cursor ? parseInt(cursor, 10) : 0
  const page = items.slice(startIdx, startIdx + limit)
  const nextIdx = startIdx + limit
  return { items: page, next_cursor: nextIdx < items.length ? String(nextIdx) : null }
}

// ── App ─────────────────────────────────────────────────────────────────────

const app = new Elysia()
  .use(cors())
  .use(requestLogger('Vortex'))
  .use(uadpAuth())
  .use(uadpAuthRoutes())

  .get('/.well-known/uadp.json', () => manifest)

  // Continue watching
  .get('/uadp/v1/continue-watching', ({ userId, authToken }) => {
    if (!authToken) {
      return new Response(JSON.stringify({
        error: 'unauthorized',
        message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    return { type: 'uadp:continue_watching', items: getContinueWatching(userId), authenticated: !!authToken }
  })

  // My list
  .get('/uadp/v1/my-list', ({ userId, authToken }) => {
    if (!authToken) {
      return new Response(JSON.stringify({
        error: 'unauthorized',
        message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    const myList = getMyList(userId)
    const items = catalog.filter(t => myList.has(t.id))
    return { type: 'uadp:my_list', items, authenticated: !!authToken }
  })

  // Trending (public)
  .get('/uadp/v1/trending', ({ authToken }) => {
    return { type: 'uadp:trending', items: trending, authenticated: !!authToken }
  })

  // Catalog with optional filters (public)
  .get('/uadp/v1/catalog', ({ query, authToken }) => {
    let filtered = [...catalog]
    if (query.type) filtered = filtered.filter(t => t.type === query.type)
    if (query.genre) {
      const g = query.genre.toLowerCase()
      filtered = filtered.filter(t => t.genre.some(gg => gg.toLowerCase() === g))
    }
    const limit = Math.min(Number(query.limit) || 20, 50)
    const { items, next_cursor } = paginate(filtered, query.cursor ?? null, limit)
    return { type: 'uadp:catalog', cursor: next_cursor, items, authenticated: !!authToken }
  })

  // Title detail (public)
  .get('/uadp/v1/title/:id', ({ params, authToken }) => {
    const title = catalog.find(t => t.id === params.id)
    if (!title) return { error: 'not_found', message: 'Title not found' }
    return { ...title, authenticated: !!authToken }
  })

  // Search (public)
  .get('/uadp/v1/search', ({ query, authToken }) => {
    const q = (query.q ?? '').toLowerCase().trim()
    if (!q) return { type: 'uadp:search', query: '', items: [], authenticated: !!authToken }
    const results = catalog.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.synopsis.toLowerCase().includes(q) ||
      t.genre.some(g => g.toLowerCase().includes(q))
    )
    return { type: 'uadp:search', query: q, items: results, authenticated: !!authToken }
  })

  .listen(4010)

console.log('Vortex running on http://localhost:4010')
