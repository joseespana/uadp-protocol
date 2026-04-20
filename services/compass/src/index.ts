import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { loadAllUsersData, requestLogger, uadpAuth, uadpAuthRoutes, type UadpManifest } from 'cosmos-core'

// ── Data ────────────────────────────────────────────────────────────────────

interface CompassRide {
  uadp_type: 'uadp:ride'
  id: string
  ts: number
  label: string
  status: 'completed' | 'cancelled' | 'in_progress'
  origin: { name: string; lat: number; lng: number }
  destination: { name: string; lat: number; lng: number }
  distance_km: number
  duration_minutes: number
  fare: { value: number; currency: string }
  driver?: { name: string; rating: number; vehicle: string; plate: string }
  ride_type: 'standard' | 'premium' | 'shared'
}

interface CompassSavedPlace {
  uadp_type: 'uadp:saved_place'
  id: string
  name: string
  label: string
  address: string
  lat: number
  lng: number
  category: 'home' | 'work' | 'favorite'
}

interface CompassData {
  rides: CompassRide[]
  saved_places: CompassSavedPlace[]
}

const allUsersData = loadAllUsersData<CompassData>('compass-rides')

function getUserData(userId: string): CompassData {
  return allUsersData.get(userId) || allUsersData.get('jose_espana') || { rides: [], saved_places: [] }
}

// ── Manifest ────────────────────────────────────────────────────────────────

const manifest: UadpManifest = {
  service_id: 'compass',
  service_name: 'Compass',
  uadp_version: '0.1.0',
  category: 'transport:rideshare',
  base_url: 'http://localhost:4012',
  endpoints: [
    { path: '/uadp/v1/auth/register', method: 'POST', description: 'Register with email to get passkey', auth_required: false },
    { path: '/uadp/v1/auth/login', method: 'POST', description: 'Login with email + passkey to get session token', auth_required: false },
    { path: '/uadp/v1/auth/verify', method: 'POST', description: 'Verify if a token is valid', auth_required: false },
    { path: '/uadp/v1/rides', method: 'GET', description: 'Past rides, paginated', auth_required: false },
    { path: '/uadp/v1/rides/:id', method: 'GET', description: 'Ride detail', auth_required: false },
    { path: '/uadp/v1/saved-places', method: 'GET', description: 'Saved places (home, work, favorites)', auth_required: false },
    { path: '/uadp/v1/spending', method: 'GET', description: 'Ride spending summary', auth_required: false },
    { path: '/uadp/v1/search', method: 'GET', description: 'Search rides by origin, destination, or driver', auth_required: false },
  ],
  ai_hints: {
    persona: 'Compass is the ride-hailing app — similar to Uber. Request rides, save frequent places, and review ride history.',
    language: 'en',
    rendering: {
      layout: 'trip_list',
      accent: '#a3e635',
      date_format: 'relative',
      card: {
        title: '$.origin.name || $.origin',
        subtitle: '$.destination.name || $.destination',
        price: '$.fare | money',
        badge: '$.ride_type',
        meta: ['$.distance_km', '$.duration_minutes | duration', '$.status'],
      },
      detail: {
        fields: [
          { label: 'Origin', value: '$.origin' },
          { label: 'Destination', value: '$.destination' },
          { label: 'Driver', value: '$.driver.name' },
          { label: 'Fare', value: '$.fare | money' },
          { label: 'Distance', value: '$.distance_km' },
          { label: 'Duration', value: '$.duration_minutes | duration' },
          { label: 'Type', value: '$.ride_type' },
        ],
      },
      empty_state: { icon: 'map-pin', message: 'No rides found.' },
    },
    user_goals: [
      'View ride history',
      'Check transport spending',
      'View saved places',
    ],
    auth: {
      method: 'Bearer token in Authorization header',
      get_token: 'POST /uadp/v1/auth/register with email, then POST /uadp/v1/auth/login with email and passkey',
    },
  } satisfies UadpAiHints,
  search: {
    endpoint: '/uadp/v1/search',
    query_param: 'q',
    fields_searched: ['origin.name', 'destination.name', 'driver.name', 'ride_type'],
    min_length: 2,
    response_schema: {
      result_keys: ['items'],
      result_types: { items: 'uadp:ride' },
    },
    preview_fields: {
      title: '$.label',
      snippet: '$.driver.name',
      meta: ['$.fare | money', '$.distance_km | number', '$.ride_type'],
    },
    domain_tags: ['transport', 'rides', 'uber', 'taxi', 'trip', 'rideshare', 'commute', 'travel'],
    relevance_weight: 0.4,
  },
  pagination: { strategy: 'cursor', default_page_size: 20, max_page_size: 50 },
  versioning: { hints_version: '2.0.0', last_updated: 1743300000 },
  content_stats: {
    total_items: 500,
    types: { 'uadp:transport': 500 },
    update_frequency: 'real-time',
    last_content_update: '2026-04-08T12:00:00Z',
  },
  content_taxonomy: ['rides', 'commute', 'airport', 'weekend'],
  intents: {
    'request-ride': { description: 'View ride options and request a new ride',   endpoints: ['/uadp/v1/saved-places'] },
    'view-history': { description: 'Browse past ride history',                    endpoints: ['/uadp/v1/rides'] },
    track:          { description: 'Track ride spending summary',                 endpoints: ['/uadp/v1/spending'] },
    'rate-driver':  { description: 'View ride details including driver info',     endpoints: ['/uadp/v1/rides/:id'] },
  },
  featured: [
    { uadp_type: 'uadp:transport', title: 'Ride to Aeropuerto AICM — Apr 5, 06:30', category: 'airport',  fare: { value: 385, currency: 'MXN' } },
    { uadp_type: 'uadp:transport', title: 'Daily commute — Condesa to Santa Fe',    category: 'commute',  fare: { value: 142, currency: 'MXN' } },
    { uadp_type: 'uadp:transport', title: 'Saturday night out — Polanco to Roma',   category: 'weekend',  fare: { value: 98,  currency: 'MXN' } },
  ],
  quality: {
    data_source:       'institutional',
    verification:      'verified',
    content_freshness: 'real-time',
    content_rating:    'general',
  },
  relationships: [
    { service: 'orbit', relation: 'ride_charges',  description: 'Compass ride fares charged to Orbit bank account' },
    { service: 'flame', relation: 'food_charges',  description: 'Flame food + Compass ride combo orders' },
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
  .use(requestLogger('Compass'))
  .use(uadpAuth())
  .use(uadpAuthRoutes())

  .get('/.well-known/uadp.json', () => manifest)

  // Rides history
  .get('/uadp/v1/rides', ({ query, userId, authToken }) => {
    const data = getUserData(userId)
    const rides = data.rides ?? []
    const limit = Math.min(Number(query.limit) || 15, 50)
    const { items, next_cursor } = paginate(rides, query.cursor ?? null, limit)
    return { type: 'uadp:rides', cursor: next_cursor, items, authenticated: !!authToken }
  })

  // Ride detail
  .get('/uadp/v1/rides/:id', ({ params, userId, authToken }) => {
    const data = getUserData(userId)
    const rides = data.rides ?? []
    const ride = rides.find(r => r.id === params.id)
    if (!ride) return { error: 'not_found', message: 'Ride not found' }
    return { ...ride, authenticated: !!authToken }
  })

  // Saved places
  .get('/uadp/v1/saved-places', ({ userId, authToken }) => {
    const data = getUserData(userId)
    return { type: 'uadp:saved_places', items: data.saved_places ?? [], authenticated: !!authToken }
  })

  // Spending summary
  .get('/uadp/v1/spending', ({ userId, authToken }) => {
    const data = getUserData(userId)
    const rides = data.rides ?? []
    const completed = rides.filter(r => r.status === 'completed')
    const totalSpent = completed.reduce((s, r) => s + r.fare.value, 0)
    const avgFare = completed.length > 0 ? Math.round((totalSpent / completed.length) * 100) / 100 : 0
    const totalDistance = completed.reduce((s, r) => s + r.distance_km, 0)
    const byType = {
      standard: completed.filter(r => r.ride_type === 'standard').length,
      premium: completed.filter(r => r.ride_type === 'premium').length,
      shared: completed.filter(r => r.ride_type === 'shared').length,
    }
    return {
      type: 'uadp:spending_summary',
      total_rides: completed.length,
      total_spent: { value: Math.round(totalSpent * 100) / 100, currency: 'USD' },
      avg_fare: { value: avgFare, currency: 'USD' },
      total_distance_km: Math.round(totalDistance * 10) / 10,
      by_type: byType,
      authenticated: !!authToken,
    }
  })

  // Search rides
  .get('/uadp/v1/search', ({ query, userId, authToken }) => {
    const q = ((query as Record<string, string>).q ?? '').toLowerCase().trim()
    if (!q) return { type: 'uadp:search_results' as const, query: '', items: [], total: 0, authenticated: !!authToken }

    const data = getUserData(userId)
    const results = (data.rides ?? []).filter(r =>
      r.origin?.name?.toLowerCase().includes(q) ||
      r.destination?.name?.toLowerCase().includes(q) ||
      r.driver?.name?.toLowerCase().includes(q) ||
      r.ride_type?.toLowerCase().includes(q) ||
      r.label?.toLowerCase().includes(q)
    ).slice(0, 50)

    return { type: 'uadp:search_results' as const, query: q, items: results, total: results.length, authenticated: !!authToken }
  })

  .listen(4012)

console.log('Compass running on http://localhost:4012')
