import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import {
  loadAllUsersData,
  requestLogger,
  uadpAuth,
  uadpAuthRoutes,
  type UadpManifest,
  type UadpAccount,
  type UadpTransaction,
  type UadpAiHints,
} from 'cosmos-core'

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface ZincData {
  accounts: UadpAccount[]
  transactions: (UadpTransaction & { ext?: Record<string, unknown> })[]
  cards: Record<string, unknown>[]
}

const allUsersData = loadAllUsersData<ZincData>('zinc-transactions')

function getUserData(userId: string): ZincData {
  return allUsersData.get(userId) || allUsersData.get('alejandro') || { accounts: [], transactions: [], cards: [] }
}

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

const manifest: UadpManifest = {
  service_id: 'zinc',
  service_name: 'Zinc',
  uadp_version: '1.0',
  category: 'uadp:banking',
  base_url: 'http://localhost:4004',
  endpoints: [
    { path: '/uadp/v1/auth/register', method: 'POST', description: 'Register with email to get passkey', auth_required: false },
    { path: '/uadp/v1/auth/login', method: 'POST', description: 'Login with email + passkey to get session token', auth_required: false },
    { path: '/uadp/v1/auth/verify', method: 'POST', description: 'Verify if a token is valid', auth_required: false },
    { path: '/uadp/v1/accounts', method: 'GET', description: 'List linked accounts (USD checking + credit line)', auth_required: false },
    { path: '/uadp/v1/transactions', method: 'GET', description: 'Paginated transaction feed with FX details', auth_required: false },
    { path: '/uadp/v1/cards', method: 'GET', description: 'List physical and virtual cards', auth_required: false },
    { path: '/uadp/v1/spending/analytics', method: 'GET', description: 'Spending breakdown by category', auth_required: false },
    { path: '/uadp/v1/fx/rate', method: 'GET', description: 'Current USD/EUR exchange rate', auth_required: false },
    { path: '/uadp/v1/fx/convert', method: 'POST', description: 'Convert an amount between currencies', auth_required: true },
    { path: '/uadp/v1/search', method: 'GET', description: 'Search transactions by merchant, label, or category', auth_required: false },
  ],
  ai_hints: {
    persona: 'Zinc is a neobank for international purchases. USD accounts with FX conversion, cashback on foreign transactions, and a zinc_points loyalty program.',
    language: 'en',
    rendering: {
      layout: 'finance_dashboard',
      accent: '#a78bfa',
      date_format: 'smart',
      card: {
        title: '$.merchant.name || $.label',
        subtitle: '$.merchant.category',
        price: '$.amount | money',
        badge: '$.direction',
        meta: ['$.ext.cashback | number', '$.ext.zinc_points | number'],
      },
      detail: {
        fields: [
          { label: 'Cashback', value: '$.ext.cashback | number' },
          { label: 'Points', value: '$.ext.zinc_points | number' },
          { label: 'Subscription', value: '$.ext.is_subscription' },
          { label: 'FX Rate', value: '$.ext.fx_rate' },
        ],
      },
      config: {
        account_card: { balance: '$.balance | money', type: '$.type' },
        direction_colors: { in: '#34d399', out: '#ef4444' },
      },
      empty_state: { icon: 'credit-card', message: 'No transactions found.' },
    },
    user_goals: [
      'Check account balance',
      'View international transaction history',
      'See cashback earned',
      'Check FX rates',
    ],
    safety_rules: [
      'Always mask account numbers — show only the last 4 digits.',
      'Confirm transfer details before executing.',
    ],
    auth: {
      method: 'Bearer token in Authorization header',
      get_token: 'POST /uadp/v1/auth/register with email, then POST /uadp/v1/auth/login with email and passkey',
    },
  } satisfies UadpAiHints,
  security_tier: 'elevated',
  pagination: { strategy: 'cursor', default_page_size: 25, max_page_size: 100 },
  search: {
    endpoint: '/uadp/v1/search',
    query_param: 'q',
    fields_searched: ['label', 'merchant.name', 'merchant.category'],
    min_length: 2,
    response_schema: {
      result_keys: ['items'],
      result_types: { items: 'uadp:transaction' },
    },
    preview_fields: {
      title: '$.label',
      snippet: '$.merchant.name',
      meta: ['$.amount | money', '$.ext.cashback | number', '$.ts | date'],
    },
    domain_tags: ['banking', 'international', 'credit-card', 'subscriptions', 'cashback'],
    relevance_weight: 0.5,
  },
  cache: {
    '/uadp/v1/accounts': { max_age_seconds: 300, offline_safe: false },
  },
  versioning: { hints_version: '2.0.0', last_updated: 1743300000 },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20

function paginate<T extends { ts: number }>(
  items: T[],
  cursor: string | null,
  limit: number = PAGE_SIZE,
) {
  let start = 0
  if (cursor) {
    const idx = items.findIndex((i) => i.ts.toString() === cursor)
    if (idx >= 0) start = idx + 1
  }
  const page = items.slice(start, start + limit)
  const nextCursor = page.length === limit ? page[page.length - 1].ts.toString() : null
  return { items: page, cursor: nextCursor }
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

const app = new Elysia()
  .use(cors())
  .use(requestLogger('Zinc'))
  .use(uadpAuth())
  .use(uadpAuthRoutes())

  // ---- Manifest -----------------------------------------------------------
  .get('/.well-known/uadp.json', () => manifest)

  // ---- Accounts -----------------------------------------------------------
  .get('/uadp/v1/accounts', ({ userId, authToken }) => {
    const data = getUserData(userId)
    return { type: 'uadp:list', items: data.accounts ?? [], authenticated: !!authToken }
  })

  // ---- Transactions -------------------------------------------------------
  .get('/uadp/v1/transactions', ({ query, userId, authToken }) => {
    const data = getUserData(userId)
    const sorted = [...(data.transactions ?? [])].sort((a, b) => b.ts - a.ts)
    const { items, cursor } = paginate(sorted, (query as Record<string, string>).cursor ?? null)
    return { type: 'uadp:feed', items, cursor, authenticated: !!authToken }
  })

  // ---- Cards --------------------------------------------------------------
  .get('/uadp/v1/cards', ({ userId, authToken }) => {
    const data = getUserData(userId)
    return { type: 'uadp:list', items: data.cards ?? [], authenticated: !!authToken }
  })

  // ---- Spending Analytics -------------------------------------------------
  .get('/uadp/v1/spending/analytics', ({ userId, authToken }) => {
    const data = getUserData(userId)
    const txs = (data.transactions ?? []).filter((t) => t.direction === 'out' && t.status === 'completed')
    const byCategory: Record<string, number> = {}
    for (const tx of txs) {
      const cat = tx.merchant?.category ?? 'other'
      byCategory[cat] = (byCategory[cat] ?? 0) + tx.amount.value
    }
    const categories = Object.entries(byCategory)
      .map(([category, total]) => ({ category, total: Math.round(total * 100) / 100, currency: 'USD' }))
      .sort((a, b) => b.total - a.total)

    const totalSpent = categories.reduce((s, c) => s + c.total, 0)
    return {
      type: 'uadp:analytics',
      period: 'last_30_days',
      total_spent: { value: Math.round(totalSpent * 100) / 100, currency: 'USD' },
      categories,
      authenticated: !!authToken,
    }
  })

  // ---- FX Rate ------------------------------------------------------------
  .get('/uadp/v1/fx/rate', ({ authToken }) => {
    return {
      type: 'uadp:fx_rate',
      pair: 'USD/EUR',
      rate: 0.92,
      inverse: Math.round((1 / 0.92) * 1_000_000) / 1_000_000,
      ts: Math.floor(Date.now() / 1000),
      authenticated: !!authToken,
    }
  })

  // ---- FX Convert ---------------------------------------------------------
  .post('/uadp/v1/fx/convert', ({ body, authToken }) => {
    const { amount, from, to } = body as { amount: number; from: string; to: string }
    const rate = 0.92 // mock USD/EUR

    let converted: number
    let usedRate: number

    if (from === 'USD' && to === 'EUR') {
      converted = amount * rate
      usedRate = rate
    } else if (from === 'EUR' && to === 'USD') {
      converted = amount / rate
      usedRate = Math.round((1 / rate) * 1_000_000) / 1_000_000
    } else {
      return new Response(JSON.stringify({ error: 'Only USD/EUR pair supported' }), { status: 400 })
    }

    return {
      type: 'uadp:fx_conversion',
      original: { value: amount, currency: from },
      converted: { value: Math.round(converted * 100) / 100, currency: to },
      rate: usedRate,
      ts: Math.floor(Date.now() / 1000),
      authenticated: !!authToken,
    }
  })

  // Search transactions
  .get('/uadp/v1/search', ({ query, userId, authToken }) => {
    const q = ((query as Record<string, string>).q ?? '').toLowerCase().trim()
    if (!q) return { type: 'uadp:search_results' as const, query: '', items: [], total: 0, authenticated: !!authToken }

    const data = getUserData(userId)
    const results = (data.transactions ?? []).filter(tx =>
      tx.label?.toLowerCase().includes(q) ||
      tx.merchant?.name?.toLowerCase().includes(q) ||
      tx.merchant?.category?.toLowerCase().includes(q)
    ).slice(0, 50)

    return { type: 'uadp:search_results' as const, query: q, items: results, total: results.length, authenticated: !!authToken }
  })

  .listen(4004)

console.log('Zinc running on http://localhost:4004')
