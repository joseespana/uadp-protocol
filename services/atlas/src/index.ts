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
  return allUsersData.get(userId) || allUsersData.get('jose_espana') || { events: [], calendars: [] }
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
    { path: '/uadp/v1/search', method: 'GET', description: 'Search events by title, description, or location', auth_required: false },
  ],
  ai_hints: {
    persona: 'Atlas is the calendar service — similar to Google Calendar. Multiple calendars with color coding, recurring events, and attendee management.',
    language: 'en',
    rendering: {
      layout: 'calendar_agenda',
      accent: '#38bdf8',
      date_format: 'smart',
      card: {
        title: '$.title',
        subtitle: '$.location',
        badge: '$.calendar',
        color_field: '$.color',
        meta: ['$.start_ts | date', '$.end_ts | date'],
      },
      detail: {
        body: '$.description',
        fields: [
          { label: 'Start', value: '$.start_ts | date_abs' },
          { label: 'End', value: '$.end_ts | date_abs' },
          { label: 'Location', value: '$.location' },
          { label: 'Calendar', value: '$.calendar' },
          { label: 'Attendees', value: '$.attendees' },
          { label: 'Recurrence', value: '$.recurrence' },
        ],
      },
      empty_state: { icon: 'calendar', message: 'No events found.' },
      config: {
        color_by_calendar: true,
        all_day_field: '$.all_day',
      },
    },
    user_goals: [
      'See what I have today',
      'View my week agenda',
      'View events from a specific calendar',
      'View event details with attendees',
    ],
    auth: {
      method: 'Bearer token in Authorization header',
      get_token: 'POST /uadp/v1/auth/register with email, then POST /uadp/v1/auth/login with email and passkey',
    },
  } satisfies UadpAiHints,
  search: {
    endpoint: '/uadp/v1/search',
    query_param: 'q',
    fields_searched: ['title', 'description', 'location', 'calendar'],
    min_length: 2,
    response_schema: {
      result_keys: ['items'],
      result_types: { items: 'uadp:calendar_event' },
    },
    preview_fields: {
      title: '$.title',
      snippet: '$.description',
      meta: ['$.calendar', '$.start_ts | date', '$.location'],
    },
    domain_tags: ['calendar', 'events', 'agenda', 'schedule', 'meetings', 'appointments', 'reminder'],
    relevance_weight: 0.7,
  },
  pagination: { strategy: 'cursor', default_page_size: 20, max_page_size: 50 },
  versioning: { hints_version: '2.0.0', last_updated: 1743300000 },
  content_stats: {
    total_items: 500,
    types: { 'uadp:calendar_event': 500 },
    update_frequency: 'real-time',
    last_content_update: '2026-04-08T12:00:00Z',
  },
  content_taxonomy: ['work', 'personal', 'birthdays', 'meetings', 'deadlines', 'social'],
  intents: {
    'view-schedule': { description: 'View today or weekly event schedule',          endpoints: ['/uadp/v1/events/today', '/uadp/v1/events/upcoming'] },
    'create-event':  { description: 'View calendars and create a new event',        endpoints: ['/uadp/v1/calendars'],                                auth_required: true },
    search:          { description: 'Search events by title, location, or keyword', endpoints: ['/uadp/v1/search'] },
    'set-reminder':  { description: 'View upcoming events with reminders',          endpoints: ['/uadp/v1/events/upcoming'] },
  },
  featured: [
    { uadp_type: 'uadp:calendar_event', title: 'Standup diario — Fintech team 10:00 AM', category: 'meetings',  calendar: 'Trabajo', recurrence: 'daily'  },
    { uadp_type: 'uadp:calendar_event', title: 'Cumpleaños mamá — April 15',              category: 'birthdays', calendar: 'Personal'                      },
    { uadp_type: 'uadp:calendar_event', title: 'Sprint review Q2 — presentation',        category: 'deadlines', calendar: 'Trabajo'                       },
  ],
  quality: {
    data_source:       'user-generated',
    verification:      'none',
    content_freshness: 'real-time',
    content_rating:    'general',
  },
  relationships: [
    { service: 'beacon', relation: 'event_invites',  description: 'Atlas calendar invites sent and received via Beacon email' },
    { service: 'echo',   relation: 'meeting_links',  description: 'Echo meeting links embedded in Atlas event descriptions' },
  ],
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

  // Search events
  .get('/uadp/v1/search', ({ query, userId, authToken }) => {
    const q = ((query as Record<string, string>).q ?? '').toLowerCase().trim()
    if (!q) return { type: 'uadp:search_results' as const, query: '', items: [], total: 0, authenticated: !!authToken }

    const data = getUserData(userId)
    const results = (data.events ?? []).filter(e =>
      e.title?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q) ||
      e.location?.toLowerCase().includes(q) ||
      e.calendar?.toLowerCase().includes(q)
    ).slice(0, 50)

    return { type: 'uadp:search_results' as const, query: q, items: results, total: results.length, authenticated: !!authToken }
  })

  .listen(4014)

console.log('Atlas running on http://localhost:4014')
