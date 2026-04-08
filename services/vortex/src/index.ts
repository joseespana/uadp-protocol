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
    { path: '/uadp/v1/continue-watching', method: 'GET', description: 'Titles in progress', auth_required: false },
    { path: '/uadp/v1/my-list', method: 'GET', description: 'User saved titles', auth_required: false },
    { path: '/uadp/v1/trending', method: 'GET', description: 'Top 10 trending titles', auth_required: false },
    { path: '/uadp/v1/catalog', method: 'GET', description: 'Full catalog, filterable by type and genre', auth_required: false },
    { path: '/uadp/v1/title/:id', method: 'GET', description: 'Title detail', auth_required: false },
    { path: '/uadp/v1/search', method: 'GET', description: 'Search titles by name or genre', auth_required: false },
  ],
  ai_hints: {
    persona: 'Vortex is the movies and series platform — similar to Netflix. Browse catalog, manage watchlist, and track viewing progress.',
    language: 'en',
    rendering: {
      layout: 'poster_grid',
      accent: '#c084fc',
      date_format: 'relative',
      card: {
        title: '$.title',
        subtitle: '$.genre | join',
        image: '$.poster_url',
        badge: '$.type',
        meta: ['$.rating | stars', '$.year', '$.duration_minutes | duration'],
      },
      detail: {
        body: '$.synopsis',
        media: '$.backdrop_url',
        media_type: 'image',
        fields: [
          { label: 'Type', value: '$.type' },
          { label: 'Year', value: '$.year' },
          { label: 'Rating', value: '$.rating | stars' },
          { label: 'Seasons', value: '$.seasons' },
          { label: 'Episodes', value: '$.episodes' },
        ],
      },
      empty_state: { icon: 'film', message: 'No movies or series found.' },
      config: {
        progress_field: '$.progress',
        poster_aspect: '2:3',
      },
    },
    user_goals: [
      'See what I am currently watching',
      'Search for a movie or series',
      'See trending titles',
      'View my saved list',
    ],
    auth: {
      method: 'Bearer token in Authorization header',
      get_token: 'POST /uadp/v1/auth/register with email, then POST /uadp/v1/auth/login with email and passkey',
    },
  } satisfies UadpAiHints,
  search: {
    endpoint: '/uadp/v1/search',
    query_param: 'q',
    fields_searched: ['title', 'synopsis', 'genre'],
    min_length: 2,
    response_schema: {
      result_keys: ['items'],
      result_types: { items: 'uadp:title' },
    },
    preview_fields: {
      title: '$.title',
      snippet: '$.synopsis',
      image: '$.poster_url',
      meta: ['$.rating | stars', '$.year | number', '$.type'],
    },
    domain_tags: ['movies', 'series', 'films', 'watch', 'netflix', 'entertainment', 'vod'],
    relevance_weight: 0.5,
  },
  pagination: { strategy: 'cursor', default_page_size: 20, max_page_size: 50 },
  versioning: { hints_version: '2.0.0', last_updated: 1743300000 },
  content_stats: {
    total_items: 500,
    types: { 'uadp:title': 500 },
    update_frequency: 'weekly',
    last_content_update: '2026-04-07T00:00:00Z',
  },
  content_taxonomy: ['action', 'drama', 'comedy', 'sci-fi', 'thriller', 'documentary', 'anime'],
  intents: {
    watch:       { description: 'Watch or resume a movie or series',         endpoints: ['/uadp/v1/continue-watching', '/uadp/v1/title/:id'] },
    search:      { description: 'Search catalog by title, genre, or year',   endpoints: ['/uadp/v1/search'] },
    'add-to-list':{ description: 'Save a title to My List',                  endpoints: ['/uadp/v1/my-list'] },
    rate:        { description: 'View ratings and top trending titles',       endpoints: ['/uadp/v1/trending'] },
  },
  featured: [
    { uadp_type: 'uadp:title', title: 'Dune: Part Three',                        category: 'sci-fi',  type: 'movie',  year: 2026 },
    { uadp_type: 'uadp:title', title: 'Narco Republic — Season 2',               category: 'thriller', type: 'series', year: 2025 },
    { uadp_type: 'uadp:title', title: 'Planeta Tierra IV — nature documentary', category: 'documentary', type: 'series', year: 2026 },
  ],
  quality: {
    data_source:       'licensed',
    verification:      'curated',
    content_freshness: 'weekly',
    content_rating:    'mature',
  },
  relationships: [
    { service: 'herald', relation: 'reviews', description: 'Herald publishes reviews and news about Vortex titles' },
  ],
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
    return { type: 'uadp:continue_watching', items: getContinueWatching(userId), authenticated: !!authToken }
  })

  // My list
  .get('/uadp/v1/my-list', ({ userId, authToken }) => {
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
    if (!q) return { type: 'uadp:search_results' as const, query: '', items: [], total: 0, authenticated: !!authToken }
    const results = catalog.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.synopsis.toLowerCase().includes(q) ||
      t.genre.some(g => g.toLowerCase().includes(q))
    )
    return { type: 'uadp:search_results' as const, query: q, items: results, total: results.length, authenticated: !!authToken }
  })

  .listen(4010)

console.log('Vortex running on http://localhost:4010')
