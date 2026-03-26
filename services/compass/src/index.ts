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
  return allUsersData.get(userId) || allUsersData.get('alejandro') || { rides: [], saved_places: [] }
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
    { path: '/uadp/v1/rides', method: 'GET', description: 'Past rides, paginated', auth_required: true },
    { path: '/uadp/v1/rides/:id', method: 'GET', description: 'Ride detail', auth_required: true },
    { path: '/uadp/v1/saved-places', method: 'GET', description: 'Saved places (home, work, favorites)', auth_required: true },
    { path: '/uadp/v1/spending', method: 'GET', description: 'Ride spending summary', auth_required: true },
  ],
  ai_hints: {
    description:
      'Compass is the ride-hailing app — similar to Uber. Request rides, save frequent places and review ride history.',
    features: [
      'Ride history with origin, destination, fare and driver',
      'Saved places (home, work, favorites)',
      'Transport spending summary',
      'Ride types: standard, premium, shared',
    ],
    rendering: {
      default_view: 'list',
      ride_card: 'Show origin -> destination, date, fare and ride type',
    },
    user_goals: [
      'View ride history',
      'Check transport spending',
      'View saved places',
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
  .use(requestLogger('Compass'))
  .use(uadpAuth())
  .use(uadpAuthRoutes())

  .get('/.well-known/uadp.json', () => manifest)

  // Rides history
  .get('/uadp/v1/rides', ({ query, userId, authToken }) => {
    if (!authToken) {
      return new Response(JSON.stringify({
        error: 'unauthorized',
        message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    const data = getUserData(userId)
    const rides = data.rides ?? []
    const limit = Math.min(Number(query.limit) || 15, 50)
    const { items, next_cursor } = paginate(rides, query.cursor ?? null, limit)
    return { type: 'uadp:rides', cursor: next_cursor, items, authenticated: !!authToken }
  })

  // Ride detail
  .get('/uadp/v1/rides/:id', ({ params, userId, authToken }) => {
    if (!authToken) {
      return new Response(JSON.stringify({
        error: 'unauthorized',
        message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    const data = getUserData(userId)
    const rides = data.rides ?? []
    const ride = rides.find(r => r.id === params.id)
    if (!ride) return { error: 'not_found', message: 'Ride not found' }
    return { ...ride, authenticated: !!authToken }
  })

  // Saved places
  .get('/uadp/v1/saved-places', ({ userId, authToken }) => {
    if (!authToken) {
      return new Response(JSON.stringify({
        error: 'unauthorized',
        message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    const data = getUserData(userId)
    return { type: 'uadp:saved_places', items: data.saved_places ?? [], authenticated: !!authToken }
  })

  // Spending summary
  .get('/uadp/v1/spending', ({ userId, authToken }) => {
    if (!authToken) {
      return new Response(JSON.stringify({
        error: 'unauthorized',
        message: 'Authentication required. Get a token via POST /uadp/v1/auth/login on this service.'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
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

  .listen(4012)

console.log('Compass running on http://localhost:4012')
