import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { loadAllUsersData, requestLogger, uadpAuth, uadpAuthRoutes, requireAuth, type UadpManifest } from 'cosmos-core'

// ── Data ────────────────────────────────────────────────────────────────────

interface BeaconEmail {
  uadp_type: 'uadp:email'
  id: string
  ts: number
  label: string
  subject: string
  from: { name: string; address: string }
  to: { name: string; address: string }[]
  body_text: string
  folder: 'inbox' | 'sent' | 'drafts' | 'spam' | 'trash'
  read: boolean
  starred: boolean
  attachments?: { name: string; size_bytes: number; type: string }[]
}

interface BeaconData {
  emails: BeaconEmail[]
  folders: Record<string, { count: number; unread?: number }>
}

const allUsersData = loadAllUsersData<BeaconData>('beacon-emails')

function getUserData(userId: string): BeaconData {
  return allUsersData.get(userId) || allUsersData.get('alejandro') || { emails: [], folders: {} }
}

// ── Manifest ────────────────────────────────────────────────────────────────

const manifest: UadpManifest = {
  service_id: 'beacon',
  service_name: 'Beacon',
  uadp_version: '0.1.0',
  category: 'communication:email',
  base_url: 'http://localhost:4011',
  endpoints: [
    { path: '/uadp/v1/auth/register', method: 'POST', description: 'Register with email to get passkey', auth_required: false },
    { path: '/uadp/v1/auth/login', method: 'POST', description: 'Login with email + passkey to get session token', auth_required: false },
    { path: '/uadp/v1/auth/verify', method: 'POST', description: 'Verify if a token is valid', auth_required: false },
    { path: '/uadp/v1/inbox', method: 'GET', description: 'Inbox emails, paginated', auth_required: false },
    { path: '/uadp/v1/folder/:folder', method: 'GET', description: 'Emails by folder (inbox, sent, drafts, spam, trash)', auth_required: false },
    { path: '/uadp/v1/email/:id', method: 'GET', description: 'Full email detail', auth_required: false },
    { path: '/uadp/v1/search', method: 'GET', description: 'Search emails by subject, sender, or body', auth_required: false },
    { path: '/uadp/v1/folders', method: 'GET', description: 'Folder summary with counts', auth_required: false },
    { path: '/uadp/v1/starred', method: 'GET', description: 'Starred emails', auth_required: false },
  ],
  ai_hints: {
    persona: 'Beacon is the email service — similar to Gmail. Notifications from GitHub, work emails, bank receipts, and personal messages.',
    language: 'en',
    rendering: {
      layout: 'email_inbox',
      accent: '#22d3ee',
      date_format: 'smart',
      card: {
        title: '$.subject',
        subtitle: '$.from.name',
        body: '$.body_text',
        avatar: '$.from.address | initials',
        badge: '$.folder',
        meta: ['$.ts | date'],
      },
      detail: {
        body: '$.body_text',
        fields: [
          { label: 'From', value: '$.from.name' },
          { label: 'To', value: '$.to[0].name' },
          { label: 'Date', value: '$.ts | date_abs' },
          { label: 'Folder', value: '$.folder' },
        ],
      },
      empty_state: { icon: 'mail', message: 'No emails found.' },
      config: {
        folders: ['inbox', 'sent', 'drafts', 'spam', 'trash'],
        unread_highlight: true,
        starred_support: true,
      },
    },
    user_goals: [
      'View unread emails',
      'Search for a specific email',
      'View sent or starred emails',
    ],
    auth: {
      method: 'Bearer token in Authorization header',
      get_token: 'POST /uadp/v1/auth/register with email, then POST /uadp/v1/auth/login with email and passkey',
    },
  } satisfies UadpAiHints,
  search: {
    endpoint: '/uadp/v1/search',
    query_param: 'q',
    fields_searched: ['subject', 'from.name', 'from.address', 'body_text'],
    min_length: 2,
    response_schema: {
      result_keys: ['items'],
      result_types: { items: 'uadp:email' },
    },
    preview_fields: {
      title: '$.subject',
      snippet: '$.body_text',
      meta: ['$.from.name', '$.folder', '$.ts | date'],
    },
    domain_tags: ['email', 'communication', 'notifications', 'work', 'personal'],
    relevance_weight: 0.6,
  },
  pagination: { strategy: 'cursor', default_page_size: 20, max_page_size: 50 },
  versioning: { hints_version: '2.0.0', last_updated: 1743300000 },
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
  .use(requestLogger('Beacon'))
  .use(uadpAuth())
  .use(uadpAuthRoutes())

  .get('/.well-known/uadp.json', () => manifest)

  // Inbox (shortcut)
  .get('/uadp/v1/inbox', ({ query, userId, authToken }) => {
    const data = getUserData(userId)
    const emails = data.emails ?? []
    const inbox = emails.filter(e => e.folder === 'inbox').sort((a, b) => b.ts - a.ts)
    const limit = Math.min(Number(query.limit) || 20, 50)
    const { items, next_cursor } = paginate(inbox, query.cursor ?? null, limit)
    return { type: 'uadp:inbox', cursor: next_cursor, unread: inbox.filter(e => !e.read).length, items, authenticated: !!authToken }
  })

  // Folder
  .get('/uadp/v1/folder/:folder', ({ params, query, userId, authToken }) => {
    const data = getUserData(userId)
    const emails = data.emails ?? []
    const folderEmails = emails.filter(e => e.folder === params.folder).sort((a, b) => b.ts - a.ts)
    const limit = Math.min(Number(query.limit) || 20, 50)
    const { items, next_cursor } = paginate(folderEmails, query.cursor ?? null, limit)
    return { type: 'uadp:folder', folder: params.folder, cursor: next_cursor, items, authenticated: !!authToken }
  })

  // Email detail
  .get('/uadp/v1/email/:id', ({ params, userId, authToken }) => {
    const data = getUserData(userId)
    const emails = data.emails ?? []
    const email = emails.find(e => e.id === params.id)
    if (!email) return { error: 'not_found', message: 'Email not found' }
    return email
  })

  // Search
  .get('/uadp/v1/search', ({ query, userId, authToken }) => {
    const data = getUserData(userId)
    const emails = data.emails ?? []
    const q = (query.q ?? '').toLowerCase().trim()
    if (!q) return { type: 'uadp:search_results' as const, query: '', items: [], total: 0, authenticated: !!authToken }
    const results = emails.filter(e =>
      e.subject.toLowerCase().includes(q) ||
      e.from.name.toLowerCase().includes(q) ||
      e.from.address.toLowerCase().includes(q) ||
      e.body_text.toLowerCase().includes(q)
    )
    return { type: 'uadp:search_results' as const, query: q, items: results, total: results.length, authenticated: !!authToken }
  })

  // Folders summary
  .get('/uadp/v1/folders', ({ userId, authToken }) => {
    const data = getUserData(userId)
    return { type: 'uadp:folders', folders: data.folders ?? {}, authenticated: !!authToken }
  })

  // Starred
  .get('/uadp/v1/starred', ({ userId, authToken }) => {
    const data = getUserData(userId)
    const emails = data.emails ?? []
    const starred = emails.filter(e => e.starred).sort((a, b) => b.ts - a.ts)
    return { type: 'uadp:starred', items: starred, authenticated: !!authToken }
  })

  .listen(4011)

console.log('Beacon running on http://localhost:4011')
