import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { loadData, loadAllUsersData, requestLogger, uadpAuth, uadpAuthRoutes } from 'cosmos-core'
import type { UadpManifest, UadpArticle } from 'cosmos-core'

// --- Data -------------------------------------------------------------------

interface HeraldData {
  articles: UadpArticle[]
  bookmarks: string[]
}

// Shared articles loaded once (from alejandro or first available)
const sharedData = loadData<HeraldData>('herald-articles')
const articles: UadpArticle[] = sharedData.articles ?? []

// Per-user bookmarks
const allUsersData = loadAllUsersData<HeraldData>('herald-articles')
const userBookmarks = new Map<string, string[]>()

for (const [userId, data] of allUsersData) {
  userBookmarks.set(userId, [...(data.bookmarks ?? [])])
}

function getBookmarks(userId: string): string[] {
  if (!userBookmarks.has(userId)) userBookmarks.set(userId, [])
  return userBookmarks.get(userId)!
}

// --- Helpers ----------------------------------------------------------------

function paginate<T>(items: T[], cursor: string | null, limit = 10) {
  let start = 0
  if (cursor) {
    const idx = parseInt(cursor, 10)
    if (!isNaN(idx)) start = idx
  }
  const slice = items.slice(start, start + limit)
  const nextCursor = start + limit < items.length ? String(start + limit) : null
  return { items: slice, cursor: nextCursor }
}

// --- Manifest ---------------------------------------------------------------

const manifest: UadpManifest = {
  service_id: 'herald',
  service_name: 'Herald',
  uadp_version: '0.1',
  category: 'news',
  base_url: 'http://localhost:4008',
  endpoints: [
    { path: '/uadp/v1/feed/latest', method: 'GET', description: 'Latest articles, paginated', auth_required: false },
    { path: '/uadp/v1/feed/category/:cat', method: 'GET', description: 'Articles by category', auth_required: false },
    { path: '/uadp/v1/article/:id', method: 'GET', description: 'Full article with body_markdown', auth_required: false },
    { path: '/uadp/v1/search', method: 'GET', description: 'Search articles', auth_required: false },
    { path: '/uadp/v1/bookmarks', method: 'GET', description: 'Bookmarked articles', auth_required: false },
    { path: '/uadp/v1/bookmarks/add', method: 'POST', description: 'Add a bookmark', auth_required: true },
  ],
  ai_hints: {
    description: 'News portal. Users read tech and economy news.',
    rendering: 'Display as article cards with images and read time. Categories: Technology, Economy, Culture, World.',
    user_context: 'Users follow technology and economy sections closely, occasionally reads culture and world news.',
    categories: ['Technology', 'Economy', 'Culture', 'World'],
  },
}

// --- App --------------------------------------------------------------------

const app = new Elysia()
  .use(cors())
  .use(requestLogger('Herald'))
  .use(uadpAuth())
  .use(uadpAuthRoutes())

  // Manifest
  .get('/.well-known/uadp.json', () => manifest)

  // Latest articles — paginated, sorted by ts descending
  .get('/uadp/v1/feed/latest', ({ query, authToken }) => {
    const sorted = [...articles].sort((a, b) => b.ts - a.ts)
    const { items, cursor } = paginate(sorted, query.cursor ?? null, 10)
    return { type: 'uadp:feed' as const, cursor, items, authenticated: !!authToken }
  }, {
    query: t.Object({ cursor: t.Optional(t.String()) }),
  })

  // Articles by category
  .get('/uadp/v1/feed/category/:cat', ({ params, query, authToken }) => {
    const cat = decodeURIComponent(params.cat)
    const filtered = articles
      .filter(a => a.category.toLowerCase() === cat.toLowerCase())
      .sort((a, b) => b.ts - a.ts)
    const { items, cursor } = paginate(filtered, query.cursor ?? null, 10)
    return { type: 'uadp:feed' as const, cursor, items, authenticated: !!authToken }
  }, {
    query: t.Object({ cursor: t.Optional(t.String()) }),
  })

  // Single article
  .get('/uadp/v1/article/:id', ({ params, authToken }) => {
    const article = articles.find(a => a.id === params.id)
    if (!article) return { error: 'not_found', message: 'Article not found' }
    return { ...article, authenticated: !!authToken }
  })

  // Search articles
  .get('/uadp/v1/search', ({ query, authToken }) => {
    const q = (query.q ?? '').toLowerCase()
    if (!q) return { type: 'uadp:feed' as const, cursor: null, items: [], authenticated: !!authToken }
    const results = articles.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.author_name.toLowerCase().includes(q)
    )
    return { type: 'uadp:feed' as const, cursor: null, items: results, authenticated: !!authToken }
  }, {
    query: t.Object({ q: t.Optional(t.String()) }),
  })

  // Bookmarks
  .get('/uadp/v1/bookmarks', ({ userId, authToken }) => {
    const bookmarks = getBookmarks(userId)
    const bookmarked = articles.filter(a => bookmarks.includes(a.id))
    return { type: 'uadp:list' as const, items: bookmarked, authenticated: !!authToken }
  })

  // Add bookmark
  .post('/uadp/v1/bookmarks/add', ({ body, userId, authToken }) => {
    if (!authToken) {
      return new Response(JSON.stringify({
        error: 'unauthorized',
        message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    const bookmarks = getBookmarks(userId)
    const { article_id } = body
    const article = articles.find(a => a.id === article_id)
    if (!article) return { error: 'not_found', message: 'Article not found' }
    if (!bookmarks.includes(article_id)) {
      bookmarks.push(article_id)
    }
    return { status: 'bookmarked', article_id, authenticated: !!authToken }
  }, {
    body: t.Object({
      article_id: t.String(),
    }),
  })

  .listen(4008)

console.log('Herald running on http://localhost:4008')
