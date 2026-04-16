import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { loadData, loadAllUsersData, requestLogger, uadpAuth, uadpAuthRoutes, connectMongo, createMongoFeed } from 'cosmos-core'
import type { UadpManifest, UadpArticle } from 'cosmos-core'

// --- Data -------------------------------------------------------------------

interface HeraldData {
  articles: UadpArticle[]
  bookmarks: string[]
}

// MongoDB first (real scraped data), fallback to static JSON
await connectMongo()

const sharedData = loadData<HeraldData>('herald-articles')
const staticArticles: UadpArticle[] = sharedData.articles ?? []
const mongoFeed = createMongoFeed<UadpArticle>('articles', staticArticles, { limit: 500 })

// `articles` now reads from Mongo when available, static JSON otherwise
const articles = new Proxy([] as UadpArticle[], {
  get(_target, prop) {
    const items = mongoFeed.getItems()
    return (items as any)[prop]
  },
})

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
    persona: 'Herald is a news portal. Users read tech, economy, culture, and world news articles.',
    language: 'en',
    rendering: {
      layout: 'article_reader',
      accent: '#2dd4bf',
      date_format: 'relative',
      card: {
        title: '$.title',
        subtitle: '$.author_name',
        body: '$.summary',
        image: '$.image_url',
        badge: '$.category',
        meta: ['$.read_time_min', '$.ts | date'],
      },
      detail: {
        body: '$.body_markdown || $.summary',
        media: '$.image_url',
        media_type: 'image',
        fields: [
          { label: 'Author', value: '$.author_name' },
          { label: 'Category', value: '$.category' },
          { label: 'Published', value: '$.ts | date_abs' },
        ],
      },
      actions: [
        { label: 'Bookmark', icon: 'bookmark', endpoint: '/uadp/v1/bookmarks/add', method: 'POST' },
      ],
      empty_state: { icon: 'newspaper', message: 'No articles found. Try a different topic.' },
    },
    user_goals: [
      'Read latest tech and economy news',
      'Search for articles about a topic',
      'View bookmarked articles',
    ],
    auth: {
      method: 'Bearer token in Authorization header',
      get_token: 'POST /uadp/v1/auth/register with email, then POST /uadp/v1/auth/login with email and passkey',
    },
  } satisfies UadpAiHints,
  search: {
    endpoint: '/uadp/v1/search',
    param: 'q',
    fields_searched: ['title', 'summary', 'body_markdown', 'author_name', 'category'],
    min_length: 2,
    filters: ['category'],
    response_schema: {
      result_keys: ['items'],
      result_types: { items: 'uadp:article' },
    },
    preview_fields: {
      title: '$.title',
      snippet: '$.summary',
      image: '$.image_url',
      meta: ['$.category', '$.read_time_min | number', '$.ts | date'],
    },
    domain_tags: ['news', 'articles', 'blogs', 'journalism', 'current-events', 'analysis', 'reading'],
    relevance_weight: 0.8,
  },
  pagination: { strategy: 'cursor', default_page_size: 15, max_page_size: 50 },
  cache: {
    '/uadp/v1/feed/latest': { max_age_seconds: 60, offline_safe: true },
    '/uadp/v1/article/:id': { max_age_seconds: 3600, offline_safe: true },
  },
  versioning: { hints_version: '2.0.0', last_updated: 1743300000 },
  content_stats: {
    total_items: 500,
    types: { 'uadp:article': 500 },
    update_frequency: 'hourly',
    last_content_update: '2026-04-08T12:00:00Z',
  },
  content_taxonomy: ['tech', 'science', 'health', 'sports', 'environment', 'education', 'economy', 'culture'],
  intents: {
    read:                { description: 'Read latest news articles by category',        endpoints: ['/uadp/v1/feed/latest', '/uadp/v1/feed/category/:cat'] },
    search:              { description: 'Search articles by keyword or topic',          endpoints: ['/uadp/v1/search'] },
    bookmark:            { description: 'Save articles to personal bookmarks',          endpoints: ['/uadp/v1/bookmarks/add'], auth_required: true },
    'subscribe-category':{ description: 'Browse articles in a specific category',      endpoints: ['/uadp/v1/feed/category/:cat'] },
  },
  featured: [
    { uadp_type: 'uadp:article', title: 'AI agents are transforming how we use the internet', category: 'tech',    author_name: 'Laura Mendez'   },
    { uadp_type: 'uadp:article', title: 'Climate summit 2026: commitments and skepticism',     category: 'environment', author_name: 'Carlos Reyes' },
    { uadp_type: 'uadp:article', title: 'Mexico startup ecosystem hits record investment',      category: 'economy', author_name: 'Ana Torres'     },
  ],
  quality: {
    data_source:       'curated',
    verification:      'editorial',
    content_freshness: 'hourly',
    content_rating:    'general',
  },
  relationships: [
    { service: 'nova', relation: 'shared', description: 'Herald articles shared and discussed on Nova' },
  ],
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
    if (!q) return { type: 'uadp:search_results' as const, query: '', items: [], total: 0, authenticated: !!authToken }
    const results = articles.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.author_name.toLowerCase().includes(q)
    )
    return { type: 'uadp:search_results' as const, query: q, items: results, total: results.length, authenticated: !!authToken }
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
