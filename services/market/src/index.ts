import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { loadAllUsersData, requestLogger, uadpAuth, uadpAuthRoutes, type UadpManifest, type UadpAiHints } from 'cosmos-core'

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
    { path: '/uadp/v1/cart', method: 'GET', description: 'View current shopping cart', auth_required: false },
    { path: '/uadp/v1/cart/add', method: 'POST', description: 'Add a product to the cart', auth_required: true },
    { path: '/uadp/v1/orders', method: 'GET', description: 'List all orders', auth_required: false },
    { path: '/uadp/v1/orders/:id', method: 'GET', description: 'Get order details', auth_required: false },
    { path: '/uadp/v1/orders/:id/tracking', method: 'GET', description: 'Get order tracking info', auth_required: false },
    { path: '/uadp/v1/wishlist', method: 'GET', description: 'View wishlist', auth_required: false },
  ],
  ai_hints: {
    persona: 'Market is an e-commerce platform similar to Amazon. Browse products, search, manage cart, place orders, and track shipments.',
    language: 'en',
    rendering: {
      layout: 'product_catalog',
      accent: '#f59e0b',
      date_format: 'relative',
      card: {
        title: '$.title',
        subtitle: '$.category',
        body: '$.description',
        image: '$.image_url',
        price: '$.price | money',
        badge: '$.in_stock',
        meta: ['$.rating | stars', '$.reviews_count | number'],
      },
      detail: {
        body: '$.description',
        media: '$.image_url',
        media_type: 'image',
        fields: [
          { label: 'Rating', value: '$.rating | stars' },
          { label: 'Reviews', value: '$.reviews_count | number' },
          { label: 'Tags', value: '$.tags' },
        ],
      },
      actions: [
        { label: 'Add to Cart', icon: 'shopping-cart', endpoint: '/uadp/v1/cart/add', method: 'POST' },
      ],
      empty_state: { icon: 'shopping-bag', message: 'No products found. Try a different search.' },
    },
    user_goals: [
      'Search for products',
      'View product details and reviews',
      'Add to cart and checkout',
      'Track an order',
    ],
    auth: {
      method: 'Bearer token in Authorization header',
      get_token: 'POST /uadp/v1/auth/register with email, then POST /uadp/v1/auth/login with email and passkey',
    },
  } satisfies UadpAiHints,
  search: {
    endpoint: '/uadp/v1/products/search',
    param: 'q',
    fields_searched: ['title', 'description', 'category', 'tags'],
    min_length: 2,
    filters: ['category', 'min_price', 'max_price'],
    sort_options: ['relevance', 'price_asc', 'price_desc', 'rating', 'reviews'],
  },
  pagination: { strategy: 'page', default_page_size: 20, max_page_size: 50 },
  cache: {
    '/uadp/v1/products/search': { max_age_seconds: 300, offline_safe: true },
    '/uadp/v1/cart': { max_age_seconds: 30, offline_safe: false },
  },
  cross_service_links: [
    { field: '$.total', target_service: 'orbit', target_endpoint: '/uadp/v1/accounts/:id/transactions', label: 'View bank charge' },
  ],
  versioning: { hints_version: '2.0.0', last_updated: 1743300000 },
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
    return { type: 'uadp:list', items: getOrders(userId), authenticated: !!authToken }
  })

  // ---- Orders: Single -----------------------------------------------------
  .get('/uadp/v1/orders/:id', ({ params, userId, authToken }) => {
    const order = getOrders(userId).find((o) => o.id === params.id)
    if (!order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 })
    }
    return { ...order, authenticated: !!authToken }
  })

  // ---- Orders: Tracking ---------------------------------------------------
  .get('/uadp/v1/orders/:id/tracking', ({ params, userId, authToken }) => {
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
    return { type: 'uadp:list', items: getWishlist(userId), authenticated: !!authToken }
  })

  .listen(4005)

console.log('Market running on http://localhost:4005')
