import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { loadAllUsersData, requestLogger, uadpAuth, uadpAuthRoutes, type UadpManifest } from 'cosmos-core'

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface Product {
  id: string
  title: string
  description: string
  price: { value: number; currency: string }
  category: string
  image_url: string
  rating: number
  reviews_count: number
  in_stock: boolean
  tags?: string[]
}

interface CartItem {
  product_id: string
  title: string
  qty: number
  unit_price: { value: number; currency: string }
  image_url: string
}

interface Order {
  id: string
  ts: number
  status: string
  items: CartItem[]
  total: { value: number; currency: string }
  shipping_address: string
}

interface WishlistItem {
  product_id: string
  title: string
  price: { value: number; currency: string }
  image_url: string
  added_ts: number
}

interface MarketData {
  orders: Order[]
  products: Product[]
  cart: { items: CartItem[] }
  wishlist: WishlistItem[]
}

const allUsersData = loadAllUsersData<MarketData>('market-orders')

// Per-user mutable state
const userProducts = new Map<string, Product[]>()
const userOrders = new Map<string, Order[]>()
const userCarts = new Map<string, { items: CartItem[] }>()
const userWishlists = new Map<string, WishlistItem[]>()

for (const [userId, raw] of allUsersData) {
  userProducts.set(userId, raw.products ?? [])
  userOrders.set(userId, raw.orders ?? [])
  userCarts.set(userId, raw.cart ?? { items: [] })
  userWishlists.set(userId, raw.wishlist ?? [])
}

function getProducts(userId: string): Product[] {
  return userProducts.get(userId) || userProducts.get('alejandro') || []
}
function getOrders(userId: string): Order[] {
  return userOrders.get(userId) || userOrders.get('alejandro') || []
}
function getCart(userId: string): { items: CartItem[] } {
  if (!userCarts.has(userId)) userCarts.set(userId, { items: [] })
  return userCarts.get(userId)!
}
function getWishlist(userId: string): WishlistItem[] {
  return userWishlists.get(userId) || userWishlists.get('alejandro') || []
}

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

const manifest: UadpManifest = {
  service_id: 'market',
  service_name: 'Market',
  uadp_version: '1.0',
  category: 'uadp:commerce',
  base_url: 'http://localhost:4005',
  endpoints: [
    { path: '/uadp/v1/auth/register', method: 'POST', description: 'Register with email to get passkey', auth_required: false },
    { path: '/uadp/v1/auth/login', method: 'POST', description: 'Login with email + passkey to get session token', auth_required: false },
    { path: '/uadp/v1/auth/verify', method: 'POST', description: 'Verify if a token is valid', auth_required: false },
    { path: '/uadp/v1/products/search', method: 'GET', description: 'Search products with filters', auth_required: false },
    { path: '/uadp/v1/products/:id', method: 'GET', description: 'Get product details', auth_required: false },
    { path: '/uadp/v1/cart', method: 'GET', description: 'View current shopping cart', auth_required: true },
    { path: '/uadp/v1/cart/add', method: 'POST', description: 'Add a product to the cart', auth_required: true },
    { path: '/uadp/v1/orders', method: 'GET', description: 'List all orders', auth_required: true },
    { path: '/uadp/v1/orders/:id', method: 'GET', description: 'Get order details', auth_required: true },
    { path: '/uadp/v1/orders/:id/tracking', method: 'GET', description: 'Get order tracking info', auth_required: true },
    { path: '/uadp/v1/wishlist', method: 'GET', description: 'View wishlist', auth_required: true },
  ],
  ai_hints: {
    description:
      'Market is an e-commerce platform similar to Amazon. Users can browse a product catalog, search and filter by category or price range, manage a shopping cart, place orders, and track shipments.',
    features: [
      'Product search with category, price range, and sorting filters',
      'Product detail pages with ratings and review counts',
      'Persistent shopping cart with add-to-cart functionality',
      'Order history with status timeline (ordered, processing, shipped, delivered)',
      'Real-time shipment tracking with stage progression',
      'Wishlist for saving products',
    ],
    data_model: {
      'price': '{ value: number, currency: string } — Read currency field to determine denomination and symbol.',
      'total': '{ value: number, currency: string } — Order total with currency.',
    },
    rendering: {
      currency_format: 'Read currency from price.currency / total.currency. Format with proper symbol and 2 decimals.',
      product_grid: 'Render products in a responsive grid with image, title, price, and rating stars',
      order_timeline: 'Show order tracking as a vertical timeline with status badges and timestamps',
      price_highlight: 'Show prices prominently; use green for discounts',
      image_display: 'Product images should be displayed as cards with consistent aspect ratio',
    },
    auth: {
      method: 'Bearer token in Authorization header',
      public_endpoints: 'Endpoints with auth_required: false work without a token',
      private_endpoints: 'Endpoints with auth_required: true need Authorization: Bearer <token>',
      get_token: 'POST /uadp/v1/auth/register with email, then POST /uadp/v1/auth/login with email and passkey',
    },
  },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function matchesSearch(product: Product, q: string): boolean {
  const lower = q.toLowerCase()
  return (
    product.title.toLowerCase().includes(lower) ||
    product.description.toLowerCase().includes(lower) ||
    product.category.toLowerCase().includes(lower) ||
    (product.tags ?? []).some((tag) => tag.toLowerCase().includes(lower))
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

const app = new Elysia()
  .use(cors())
  .use(requestLogger('Market'))
  .use(uadpAuth())
  .use(uadpAuthRoutes())

  // ---- Manifest -----------------------------------------------------------
  .get('/.well-known/uadp.json', () => manifest)

  // ---- Product Search -----------------------------------------------------
  .get('/uadp/v1/products/search', ({ query, userId, authToken }) => {
    const products = getProducts(userId)
    const params = query as Record<string, string>
    let results = [...products]

    // Text search
    if (params.q) {
      results = results.filter((p) => matchesSearch(p, params.q))
    }

    // Category filter
    if (params.category) {
      const cat = params.category.toLowerCase()
      results = results.filter((p) => p.category.toLowerCase() === cat)
    }

    // Price range
    if (params.min_price) {
      const min = parseFloat(params.min_price)
      if (!isNaN(min)) results = results.filter((p) => p.price.value >= min)
    }
    if (params.max_price) {
      const max = parseFloat(params.max_price)
      if (!isNaN(max)) results = results.filter((p) => p.price.value <= max)
    }

    // Sort
    if (params.sort === 'price_asc') {
      results.sort((a, b) => a.price.value - b.price.value)
    } else if (params.sort === 'price_desc') {
      results.sort((a, b) => b.price.value - a.price.value)
    } else if (params.sort === 'rating') {
      results.sort((a, b) => b.rating - a.rating)
    } else if (params.sort === 'reviews') {
      results.sort((a, b) => b.reviews_count - a.reviews_count)
    } else if (params.sort === 'name') {
      results.sort((a, b) => a.title.localeCompare(b.title))
    }

    // Pagination
    const page = parseInt(params.page ?? '1', 10)
    const limit = parseInt(params.limit ?? '20', 10)
    const start = (page - 1) * limit
    const paged = results.slice(start, start + limit)

    return {
      type: 'uadp:list',
      total: results.length,
      page,
      page_size: limit,
      items: paged,
      authenticated: !!authToken,
    }
  })

  // ---- Product Detail -----------------------------------------------------
  .get('/uadp/v1/products/:id', ({ params, userId, authToken }) => {
    const products = getProducts(userId)
    const product = products.find((p) => p.id === params.id)
    if (!product) {
      return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404 })
    }
    return { ...product, authenticated: !!authToken }
  })

  // ---- Cart: View ---------------------------------------------------------
  .get('/uadp/v1/cart', ({ userId, authToken }) => {
    if (!authToken) {
      return new Response(JSON.stringify({
        error: 'unauthorized',
        message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    const cart = getCart(userId)
    const total = cart.items.reduce((sum, item) => sum + item.unit_price.value * item.qty, 0)
    return {
      type: 'uadp:cart',
      items: cart.items,
      total: { value: Math.round(total * 100) / 100, currency: 'USD' },
      item_count: cart.items.reduce((sum, item) => sum + item.qty, 0),
      authenticated: !!authToken,
    }
  })

  // ---- Cart: Add ----------------------------------------------------------
  .post(
    '/uadp/v1/cart/add',
    ({ body, userId, authToken }) => {
      if (!authToken) {
        return new Response(JSON.stringify({
          error: 'unauthorized',
          message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.'
        }), { status: 401, headers: { 'Content-Type': 'application/json' } })
      }
      const products = getProducts(userId)
      const cart = getCart(userId)
      const product = products.find((p) => p.id === body.product_id)
      if (!product) {
        return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404 })
      }

      const existing = cart.items.find((item) => item.product_id === body.product_id)
      if (existing) {
        existing.qty += body.qty
      } else {
        cart.items.push({
          product_id: product.id,
          title: product.title,
          qty: body.qty,
          unit_price: product.price,
          image_url: product.image_url,
        })
      }

      const total = cart.items.reduce((sum, item) => sum + item.unit_price.value * item.qty, 0)
      return {
        type: 'uadp:cart',
        items: cart.items,
        total: { value: Math.round(total * 100) / 100, currency: 'USD' },
        item_count: cart.items.reduce((sum, item) => sum + item.qty, 0),
        authenticated: !!authToken,
      }
    },
    {
      body: t.Object({
        product_id: t.String(),
        qty: t.Number({ minimum: 1 }),
      }),
    },
  )

  // ---- Orders: List -------------------------------------------------------
  .get('/uadp/v1/orders', ({ userId, authToken }) => {
    if (!authToken) {
      return new Response(JSON.stringify({
        error: 'unauthorized',
        message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    return { type: 'uadp:list', items: getOrders(userId), authenticated: !!authToken }
  })

  // ---- Orders: Single -----------------------------------------------------
  .get('/uadp/v1/orders/:id', ({ params, userId, authToken }) => {
    if (!authToken) {
      return new Response(JSON.stringify({
        error: 'unauthorized',
        message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    const order = getOrders(userId).find((o) => o.id === params.id)
    if (!order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 })
    }
    return { ...order, authenticated: !!authToken }
  })

  // ---- Orders: Tracking ---------------------------------------------------
  .get('/uadp/v1/orders/:id/tracking', ({ params, userId, authToken }) => {
    if (!authToken) {
      return new Response(JSON.stringify({
        error: 'unauthorized',
        message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    const order = getOrders(userId).find((o) => o.id === params.id)
    if (!order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 })
    }

    const orderTs = order.ts
    const stages = [
      { stage: 'ordered',    label: 'Order placed',    ts: orderTs,                completed: true },
      { stage: 'processing', label: 'Processing',      ts: orderTs + 3600,         completed: true },
      { stage: 'shipped',    label: 'Enviado',          ts: orderTs + 3600 * 24,    completed: order.status === 'shipped' || order.status === 'delivered' },
      { stage: 'delivered',  label: 'Entregado',        ts: orderTs + 3600 * 24 * 3, completed: order.status === 'delivered' },
    ]

    return {
      type: 'uadp:tracking',
      order_id: order.id,
      current_status: order.status,
      stages,
      authenticated: !!authToken,
    }
  })

  // ---- Wishlist -----------------------------------------------------------
  .get('/uadp/v1/wishlist', ({ userId, authToken }) => {
    if (!authToken) {
      return new Response(JSON.stringify({
        error: 'unauthorized',
        message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    return { type: 'uadp:list', items: getWishlist(userId), authenticated: !!authToken }
  })

  .listen(4005)

console.log('Market running on http://localhost:4005')
