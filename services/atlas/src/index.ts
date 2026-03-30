import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { loadAllUsersData, requestLogger, uadpAuth, uadpAuthRoutes, type UadpManifest } from 'cosmos-core'

// ── Data ────────────────────────────────────────────────────────────────────

interface AtlasEvent {
  uadp_type: 'uadp:calendar_event'
  id: string
  ts: number
  label: string
  title: string
  description: string
  start_ts: number
  end_ts: number
  all_day: boolean
  location?: string
  calendar: string
  color: string
  recurrence?: string | null
  attendees?: { name: string; email: string; status: 'accepted' | 'declined' | 'pending' }[]
}

interface AtlasCalendar {
  name: string
  color: string
}

interface AtlasData {
  events: AtlasEvent[]
  calendars: AtlasCalendar[]
}

const allUsersData = loadAllUsersData<AtlasData>('atlas-events')

function getUserData(userId: string): AtlasData {
  return allUsersData.get(userId) || allUsersData.get('alejandro') || { events: [], calendars: [] }
}

// ── Manifest ────────────────────────────────────────────────────────────────

const manifest: UadpManifest = {
  service_id: 'atlas',
  service_name: 'Atlas',
  uadp_version: '0.1.0',
  category: 'productivity:calendar',
  base_url: 'http://localhost:4014',
  endpoints: [
    { path: '/uadp/v1/auth/register', method: 'POST', description: 'Register with email to get passkey', auth_required: false },
    { path: '/uadp/v1/auth/login', method: 'POST', description: 'Login with email + passkey to get session token', auth_required: false },
    { path: '/uadp/v1/auth/verify', method: 'POST', description: 'Verify if a token is valid', auth_required: false },
    { path: '/uadp/v1/events', method: 'GET', description: 'Events with optional date range and calendar filter', auth_required: false },
    { path: '/uadp/v1/events/today', method: 'GET', description: 'Today\'s events', auth_required: false },
    { path: '/uadp/v1/events/upcoming', method: 'GET', description: 'Next 7 days of events', auth_required: false },
    { path: '/uadp/v1/events/:id', method: 'GET', description: 'Event detail', auth_required: false },
    { path: '/uadp/v1/calendars', method: 'GET', description: 'Available calendars', auth_required: false },
  ],
  ai_hints: {
    description:
      'Atlas is the calendar service — similar to Google Calendar. Multiple calendars with color coding, recurring events, and attendee management.',
    features: [
      'Events with start/end time, location and attendees',
      'Multiple calendars with colors',
      'Recurring events (daily, weekly, monthly)',
      'Today and upcoming 7-day views',
      'Calendar filter',
    ],
    rendering: {
      default_view: 'agenda',
      event_card: 'Show time, title, calendar (color) and location if applicable',
      color_coding: 'Use the calendar color to distinguish event types',
    },
    user_goals: [
      'See what I have today',
      'View my week agenda',
      'View events from a specific calendar',
      'View event detail with attendees',
    ],
  },
}

// ── App ─────────────────────────────────────────────────────────────────────

const ONE_DAY_SEC = 86400

const app = new Elysia()
  .use(cors())
  .use(requestLogger('Atlas'))
  .use(uadpAuth())
  .use(uadpAuthRoutes())

  .get('/.well-known/uadp.json', () => manifest)

  // All events with optional filters
  .get('/uadp/v1/events', ({ query, userId, authToken }) => {
    const data = getUserData(userId)
    let filtered = [...(data.events ?? [])]
    if (query.calendar) {
      filtered = filtered.filter(e => e.calendar.toLowerCase() === query.calendar!.toLowerCase())
    }
    if (query.from) {
      const fromTs = Number(query.from)
      filtered = filtered.filter(e => e.start_ts >= fromTs)
    }
    if (query.to) {
      const toTs = Number(query.to)
      filtered = filtered.filter(e => e.start_ts <= toTs)
    }
    return { type: 'uadp:events', items: filtered, authenticated: !!authToken }
  })

  // Today's events
  .get('/uadp/v1/events/today', ({ userId, authToken }) => {
    const data = getUserData(userId)
    const events = data.events ?? []
    const startOfDay = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000)
    const endOfDay = startOfDay + ONE_DAY_SEC
    const today = events.filter(e => e.start_ts >= startOfDay && e.start_ts < endOfDay)
    return { type: 'uadp:events', date: 'today', items: today, authenticated: !!authToken }
  })

  // Upcoming (next 7 days)
  .get('/uadp/v1/events/upcoming', ({ userId, authToken }) => {
    const data = getUserData(userId)
    const events = data.events ?? []
    const startOfDay = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000)
    const endRange = startOfDay + 7 * ONE_DAY_SEC
    const upcoming = events.filter(e => e.start_ts >= startOfDay && e.start_ts < endRange)
    return { type: 'uadp:events', range: '7_days', items: upcoming, authenticated: !!authToken }
  })

  // Event detail
  .get('/uadp/v1/events/:id', ({ params, userId, authToken }) => {
    const data = getUserData(userId)
    const events = data.events ?? []
    const event = events.find(e => e.id === params.id)
    if (!event) return { error: 'not_found', message: 'Event not found' }
    return { ...event, authenticated: !!authToken }
  })

  // Calendars
  .get('/uadp/v1/calendars', ({ userId, authToken }) => {
    const data = getUserData(userId)
    return { type: 'uadp:calendars', items: data.calendars ?? [], authenticated: !!authToken }
  })

  .listen(4014)

console.log('Atlas running on http://localhost:4014')
