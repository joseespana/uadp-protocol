import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { loadAllUsersData, requestLogger, uadpAuth, uadpAuthRoutes, type UadpManifest } from 'cosmos-core'

// ── Data ────────────────────────────────────────────────────────────────────

interface FlameRestaurant {
  id: string
  name: string
  cuisine: string
  rating: number
  image_url: string
}

interface FlameOrder {
  uadp_type: 'uadp:food_order'
  id: string
  ts: number
  label: string
  status: 'delivered' | 'in_progress' | 'cancelled'
  restaurant: FlameRestaurant
  items: { name: string; qty: number; unit_price: { value: number; currency: string } }[]
  total: { value: number; currency: string }
  delivery_fee: { value: number; currency: string }
  delivery_address: string
  estimated_minutes?: number
}

interface FlameData {
  orders: FlameOrder[]
  restaurants: FlameRestaurant[]
  favorites: string[]
}

const allUsersData = loadAllUsersData<FlameData>('flame-orders')

// Per-user mutable state
const userOrders = new Map<string, FlameOrder[]>()
const userRestaurants = new Map<string, FlameRestaurant[]>()
const userFavorites = new Map<string, Set<string>>()

for (const [userId, data] of allUsersData) {
  userOrders.set(userId, data.orders ?? [])
  userRestaurants.set(userId, data.restaurants ?? [])
  userFavorites.set(userId, new Set(data.favorites ?? []))
}

function getOrders(userId: string): FlameOrder[] {
  return userOrders.get(userId) || userOrders.get('alejandro') || []
}
function getRestaurants(userId: string): FlameRestaurant[] {
  return userRestaurants.get(userId) || userRestaurants.get('alejandro') || []
}
function getFavorites(userId: string): Set<string> {
  if (!userFavorites.has(userId)) userFavorites.set(userId, new Set())
  return userFavorites.get(userId)!
}

// ── Manifest ────────────────────────────────────────────────────────────────

const manifest: UadpManifest = {
  service_id: 'flame',
  service_name: 'Flame',
  uadp_version: '0.1.0',
  category: 'food:delivery',
  base_url: 'http://localhost:4013',
  endpoints: [
    { path: '/uadp/v1/auth/register', method: 'POST', description: 'Register with email to get passkey', auth_required: false },
    { path: '/uadp/v1/auth/login', method: 'POST', description: 'Login with email + passkey to get session token', auth_required: false },
    { path: '/uadp/v1/auth/verify', method: 'POST', description: 'Verify if a token is valid', auth_required: false },
    { path: '/uadp/v1/orders', method: 'GET', description: 'Past food orders, paginated', auth_required: false },
    { path: '/uadp/v1/orders/:id', method: 'GET', description: 'Order detail', auth_required: false },
    { path: '/uadp/v1/restaurants', method: 'GET', description: 'Available restaurants', auth_required: false },
    { path: '/uadp/v1/favorites', method: 'GET', description: 'Favorite restaurants', auth_required: false },
    { path: '/uadp/v1/reorder/:orderId', method: 'POST', description: 'Re-order a past order', auth_required: true },
    { path: '/uadp/v1/spending', method: 'GET', description: 'Food delivery spending summary', auth_required: false },
  ],
  ai_hints: {
    description:
      'Flame is the food delivery app — similar to Uber Eats / Rappi. Order food from restaurants with delivery.',
    features: [
      'Order history with restaurant, items and total',
      'Available restaurants with cuisine and rating',
      'Favorite restaurants',
      'Re-order past orders',
      'Food delivery spending summary',
    ],
    rendering: {
      default_view: 'list',
      order_card: 'Show restaurant, main items, total and status',
      restaurant_card: 'Show image, name, cuisine and rating',
    },
    user_goals: [
      'View recent orders',
      'Re-order a past order',
      'View favorite restaurants',
      'Check delivery spending',
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
  .use(requestLogger('Flame'))
  .use(uadpAuth())
  .use(uadpAuthRoutes())

  .get('/.well-known/uadp.json', () => manifest)

  // Orders history
  .get('/uadp/v1/orders', ({ query, userId, authToken }) => {
    const orders = getOrders(userId)
    const limit = Math.min(Number(query.limit) || 15, 50)
    const { items, next_cursor } = paginate(orders, query.cursor ?? null, limit)
    return { type: 'uadp:orders', cursor: next_cursor, items, authenticated: !!authToken }
  })

  // Order detail
  .get('/uadp/v1/orders/:id', ({ params, userId, authToken }) => {
    const orders = getOrders(userId)
    const order = orders.find(o => o.id === params.id)
    if (!order) return { error: 'not_found', message: 'Order not found' }
    return { ...order, authenticated: !!authToken }
  })

  // Restaurants (public)
  .get('/uadp/v1/restaurants', ({ query, userId, authToken }) => {
    let filtered = [...getRestaurants(userId)]
    if (query.cuisine) {
      const c = query.cuisine.toLowerCase()
      filtered = filtered.filter(r => r.cuisine.toLowerCase() === c)
    }
    return { type: 'uadp:restaurants', items: filtered, authenticated: !!authToken }
  })

  // Favorites
  .get('/uadp/v1/favorites', ({ userId, authToken }) => {
    const favorites = getFavorites(userId)
    const restaurants = getRestaurants(userId)
    const favRestaurants = restaurants.filter(r => favorites.has(r.id))
    return { type: 'uadp:favorites', items: favRestaurants, authenticated: !!authToken }
  })

  // Re-order
  .post('/uadp/v1/reorder/:orderId', ({ params, userId, authToken }) => {
    const orders = getOrders(userId)
    const order = orders.find(o => o.id === params.orderId)
    if (!order) return { error: 'not_found', message: 'Order not found' }
    return {
      type: 'uadp:reorder',
      status: 'confirmed',
      new_order_id: `flame:order:reorder_${Date.now()}`,
      items: order.items,
      restaurant: order.restaurant,
      estimated_minutes: 35,
      authenticated: !!authToken,
    }
  })

  // Spending summary
  .get('/uadp/v1/spending', ({ userId, authToken }) => {
    const orders = getOrders(userId)
    const delivered = orders.filter(o => o.status === 'delivered')
    const totalSpent = delivered.reduce((s, o) => s + o.total.value, 0)
    const totalDeliveryFees = delivered.reduce((s, o) => s + o.delivery_fee.value, 0)
    const byCuisine: Record<string, number> = {}
    for (const o of delivered) {
      byCuisine[o.restaurant.cuisine] = (byCuisine[o.restaurant.cuisine] || 0) + 1
    }
    return {
      type: 'uadp:spending_summary',
      total_orders: delivered.length,
      total_spent: { value: Math.round(totalSpent * 100) / 100, currency: 'USD' },
      total_delivery_fees: { value: Math.round(totalDeliveryFees * 100) / 100, currency: 'USD' },
      by_cuisine: byCuisine,
      authenticated: !!authToken,
    }
  })

  .listen(4013)

console.log('Flame running on http://localhost:4013')
