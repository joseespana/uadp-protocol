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
  ],
  ai_hints: {
    description:
      'Zinc is a neobank designed for international purchases. It provides USD accounts with built-in FX conversion, cashback on foreign transactions, virtual and physical Visa/Mastercard cards, and a zinc_points loyalty program. Ideal for developers and remote workers who pay for internationally denominated services.',
    features: [
      'Real-time USD/EUR exchange rates',
      'Automatic currency conversion at checkout',
      'Up to 5% cashback on international software & SaaS purchases',
      'zinc_points rewards program — redeem for statement credit or FX fee waivers',
      'Virtual card generation for secure online payments',
      'Spending analytics with category breakdown',
    ],
    data_model: {
      'amount': '{ value: number, currency: string } — Always read the currency field to know the denomination.',
      'ext.cashback': 'Cashback amount earned on this transaction.',
      'ext.zinc_points': 'Loyalty points earned.',
      'ext.is_subscription': 'true if this is a recurring subscription charge.',
    },
    rendering: {
      currency_format: 'Read currency from amount.currency. Format with proper symbol and 2 decimals.',
      transaction_list: 'Show merchant, amount with currency, cashback badge, and zinc_points earned',
      fx_badge: 'When ext.original_amount exists, show converted amount and rate',
    },
  },
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

  .listen(4004)

console.log('Zinc running on http://localhost:4004')
