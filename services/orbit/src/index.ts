import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { loadAllUsersData, requestLogger, uadpAuth, uadpAuthRoutes, requireAuth } from 'cosmos-core'

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface OrbitCard {
  id: string
  label: string
  type: string
  last_four: string
  network: string
  linked_account: string
  status: string
  frozen: boolean
  exp_month: number
  exp_year: number
}

interface OrbitAccount {
  uadp_type: string
  id: string
  label: string
  type: string
  balance: { value: number; currency: string }
  currency: string
  clabe: string
  ext?: Record<string, unknown>
}

interface OrbitTransaction {
  uadp_type: string
  id: string
  ts: number
  label: string
  amount: { value: number; currency: string }
  direction: 'in' | 'out'
  status: string
  account_id: string
  merchant?: { name: string; category: string; city: string; country: string }
  balance_after?: { value: number; currency: string }
  ext?: Record<string, unknown>
}

interface OrbitData {
  accounts: OrbitAccount[]
  transactions: OrbitTransaction[]
  cards: OrbitCard[]
}

const allUsersData = loadAllUsersData<OrbitData>('orbit-transactions')

// Per-user mutable state
const userAccounts = new Map<string, OrbitAccount[]>()
const userTransactions = new Map<string, OrbitTransaction[]>()
const userCards = new Map<string, OrbitCard[]>()
const userTransfers = new Map<string, Record<string, { id: string; status: string; ts: number }>>()

for (const [userId, data] of allUsersData) {
  userAccounts.set(userId, data.accounts ?? [])
  userTransactions.set(userId, data.transactions ?? [])
  userCards.set(userId, data.cards ?? [])
  userTransfers.set(userId, {})
}

function getAccounts(userId: string): OrbitAccount[] {
  return userAccounts.get(userId) || userAccounts.get('alejandro') || []
}
function getTransactions(userId: string): OrbitTransaction[] {
  return userTransactions.get(userId) || userTransactions.get('alejandro') || []
}
function getCards(userId: string): OrbitCard[] {
  return userCards.get(userId) || userCards.get('alejandro') || []
}
function getTransfers(userId: string): Record<string, { id: string; status: string; ts: number }> {
  if (!userTransfers.has(userId)) userTransfers.set(userId, {})
  return userTransfers.get(userId)!
}

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

const manifest = {
  service_id: 'orbit',
  service_name: 'Orbit',
  uadp_version: '1.0',
  category: 'uadp:banking',
  base_url: 'http://localhost:4003',
  endpoints: [
    { path: '/uadp/v1/auth/register', method: 'POST', description: 'Register with email to get passkey', auth_required: false },
    { path: '/uadp/v1/auth/login', method: 'POST', description: 'Login with email + passkey to get session token', auth_required: false },
    { path: '/uadp/v1/auth/verify', method: 'POST', description: 'Verify if a token is valid', auth_required: false },
    { path: '/uadp/v1/accounts',                  method: 'GET',  description: 'List linked bank accounts',             auth_required: true },
    { path: '/uadp/v1/accounts/:id',              method: 'GET',  description: 'Get account details by ID',             auth_required: true },
    { path: '/uadp/v1/accounts/:id/transactions', method: 'GET',  description: 'Paginated transactions for an account', auth_required: true },
    { path: '/uadp/v1/accounts/:id/statement',    method: 'GET',  description: 'Monthly summary for an account',        auth_required: true },
    { path: '/uadp/v1/cards',                     method: 'GET',  description: 'List debit/credit cards',               auth_required: true },
    { path: '/uadp/v1/cards/:id/freeze',          method: 'POST', description: 'Toggle freeze status on a card',        auth_required: true },
    { path: '/uadp/v1/transfer/initiate',         method: 'POST', description: 'Initiate a bank transfer',               auth_required: true },
    { path: '/uadp/v1/transfer/:id/status',       method: 'GET',  description: 'Check transfer status',                 auth_required: true },
    { path: '/uadp/v1/spending/analytics',        method: 'GET',  description: 'Category breakdown of spending',        auth_required: true },
  ],
  ai_hints: {
    description:
      'Orbit is the primary banking service. It provides checking and savings accounts, wire transfers, debit cards, transaction history, and spending analytics. All amounts are in USD (US Dollars).',
    safety_rules: [
      'Always mask the account number when displaying — show only the last 4 digits.',
      'Confirm transfer details (destination, amount, concept) with the user before calling /transfer/initiate.',
      'Do not cache account balances or transaction data for more than 5 minutes.',
    ],
    data_model: {
      'amount': '{ value: number, currency: string } — The currency field (e.g. "USD") tells you which currency the amount is in. Always read this field, never assume.',
      'balance': '{ value: number, currency: string } — Same pattern. Account balance with its currency.',
      'balance_after': '{ value: number, currency: string } — Running balance after the transaction.',
      'direction': '"in" = income/deposit, "out" = expense/payment.',
      'merchant': '{ name, category, city, country } — category is the spending classification (groceries, food_drink, electronics, housing, transport, entertainment, salary, subscription).',
      'ts': 'Unix timestamp in seconds. Use to sort, filter by date range, and group by month/week for charts.',
      'status': '"completed", "pending", or "failed".',
    },
    rendering: {
      currency_format: 'Read the currency field from amount/balance objects. Format: symbol + value with 2 decimals (e.g. $1,234.56 for USD, €1.234,56 for EUR).',
      transaction_list: 'Show merchant name, amount with currency symbol, direction badge (green ↑ for income, red ↓ for expense), date, and category.',
      account_card: 'Show account label, balance with currency from balance.currency, and account type.',
      date_format: 'relative for recent (today, yesterday), absolute for older.',
      charts: 'Transaction data supports charting: spending by category (pie), income vs expenses by month (bar), spending trend over time (line). Group by merchant.category for breakdowns.',
    },
    auth: {
      method: 'Bearer token in Authorization header',
      public_endpoints: 'Endpoints with auth_required: false work without a token',
      private_endpoints: 'Endpoints with auth_required: true need Authorization: Bearer <token>',
      get_token: 'POST /uadp/v1/auth/register with email, then POST /uadp/v1/auth/login with email and passkey',
    },
    user_goals: [
      'Check account balance',
      'Review recent transactions',
      'Transfer money',
      'Freeze or unfreeze a card',
      'Understand monthly spending patterns',
      'See spending analytics by category',
    ],
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
  .use(requestLogger('Orbit'))
  .use(uadpAuth())
  .use(uadpAuthRoutes())

  // ---- Manifest -----------------------------------------------------------
  .get('/.well-known/uadp.json', () => manifest)

  // ---- Accounts -----------------------------------------------------------
  .get('/uadp/v1/accounts', ({ userId, authToken }) => {
    if (!authToken) {
      return new Response(JSON.stringify({ error: 'unauthorized', message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    return { type: 'uadp:list', items: getAccounts(userId), authenticated: true }
  })

  .get('/uadp/v1/accounts/:id', ({ params, userId, authToken }) => {
    if (!authToken) {
      return new Response(JSON.stringify({ error: 'unauthorized', message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    const account = getAccounts(userId).find((a) => a.id === params.id)
    if (!account) {
      return new Response(JSON.stringify({ error: 'Account not found' }), { status: 404 })
    }
    return { ...account, authenticated: true }
  })

  // ---- Transactions (per account, paginated + filters) --------------------
  .get('/uadp/v1/accounts/:id/transactions', ({ params, query, userId, authToken }) => {
    if (!authToken) {
      return new Response(JSON.stringify({ error: 'unauthorized', message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    let txs = getTransactions(userId).filter((tx) => tx.account_id === params.id)

    // Date range filters (unix timestamps)
    const fromTs = query.from_ts ? parseInt(query.from_ts as string, 10) : null
    const toTs = query.to_ts ? parseInt(query.to_ts as string, 10) : null
    if (fromTs) txs = txs.filter((tx) => tx.ts >= fromTs)
    if (toTs) txs = txs.filter((tx) => tx.ts <= toTs)

    // Category filter
    const category = query.category as string | undefined
    if (category) {
      txs = txs.filter((tx) => tx.merchant?.category === category)
    }

    // Sort descending by timestamp
    txs = [...txs].sort((a, b) => b.ts - a.ts)

    const cursorParam = (query.cursor as string) ?? null
    const limitParam = query.limit ? parseInt(query.limit as string, 10) : PAGE_SIZE
    const { items, cursor } = paginate(txs, cursorParam, limitParam)

    return { type: 'uadp:feed', items, cursor, authenticated: !!authToken }
  })

  // ---- Statement (monthly summary) ---------------------------------------
  .get('/uadp/v1/accounts/:id/statement', ({ params, userId, authToken }) => {
    if (!authToken) {
      return new Response(JSON.stringify({ error: 'unauthorized', message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    const txs = getTransactions(userId).filter(
      (tx) => tx.account_id === params.id && tx.status === 'completed',
    )

    let totalIncome = 0
    let totalExpenses = 0
    const categoryTotals: Record<string, number> = {}

    for (const tx of txs) {
      if (tx.direction === 'in') {
        totalIncome += tx.amount.value
      } else {
        totalExpenses += tx.amount.value
        const cat = tx.merchant?.category ?? 'other'
        categoryTotals[cat] = (categoryTotals[cat] ?? 0) + tx.amount.value
      }
    }

    const topCategories = Object.entries(categoryTotals)
      .map(([category, total]) => ({ category, total: Math.round(total * 100) / 100 }))
      .sort((a, b) => b.total - a.total)

    return {
      type: 'uadp:statement',
      account_id: params.id,
      total_income: Math.round(totalIncome * 100) / 100,
      total_expenses: Math.round(totalExpenses * 100) / 100,
      currency: 'USD',
      top_categories: topCategories,
      authenticated: !!authToken,
    }
  })

  // ---- Cards --------------------------------------------------------------
  .get('/uadp/v1/cards', ({ userId, authToken }) => {
    if (!authToken) {
      return new Response(JSON.stringify({ error: 'unauthorized', message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    return { type: 'uadp:list', items: getCards(userId), authenticated: true }
  })

  .post('/uadp/v1/cards/:id/freeze', ({ params, userId, authToken }) => {
    if (!authToken) {
      return new Response(JSON.stringify({ error: 'unauthorized', message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    const card = getCards(userId).find((c) => c.id === params.id)
    if (!card) {
      return new Response(JSON.stringify({ error: 'Card not found' }), { status: 404 })
    }
    card.frozen = !card.frozen
    return { id: card.id, frozen: card.frozen, status: card.frozen ? 'frozen' : 'active' }
  })

  // ---- Transfer -----------------------------------------------------------
  .post(
    '/uadp/v1/transfer/initiate',
    ({ body, userId, authToken }) => {
      if (!authToken) {
        return new Response(JSON.stringify({ error: 'unauthorized', message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
      }
      const transfers = getTransfers(userId)
      const id = `txfr-${crypto.randomUUID()}`
      const ts = Math.floor(Date.now() / 1000)
      transfers[id] = { id, status: 'pending', ts }
      return { id, status: 'pending', ts }
    },
    {
      body: t.Object({
        destination: t.String({ minLength: 1 }),
        amount: t.Number({ minimum: 0.01 }),
        concept: t.String({ minLength: 1 }),
      }),
    },
  )

  .get('/uadp/v1/transfer/:id/status', ({ params }) => {
    return { id: params.id, status: 'completed' }
  })

  // ---- Spending Analytics -------------------------------------------------
  .get('/uadp/v1/spending/analytics', ({ userId, authToken }) => {
    if (!authToken) {
      return new Response(JSON.stringify({ error: 'unauthorized', message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    const txs = getTransactions(userId).filter(
      (tx) => tx.direction === 'out' && tx.status === 'completed',
    )

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
      period: 'all',
      total_spent: { value: Math.round(totalSpent * 100) / 100, currency: 'USD' },
      categories,
      authenticated: !!authToken,
    }
  })

  .listen(4003)

console.log('Orbit running on http://localhost:4003')
