import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { loadAllUsersData, requestLogger, uadpAuth, uadpAuthRoutes, getUserById } from 'cosmos-core'
import type { UadpManifest, UadpConversation, UadpMessage } from 'cosmos-core'

// --- Data -------------------------------------------------------------------

interface EchoData {
  conversations: UadpConversation[]
  messages: Record<string, UadpMessage[]>
}

const allUsersData = loadAllUsersData<EchoData>('echo-conversations')

// Per-user mutable state
const userConversations = new Map<string, UadpConversation[]>()
const userMessages = new Map<string, Record<string, UadpMessage[]>>()

for (const [userId, data] of allUsersData) {
  userConversations.set(userId, data.conversations ?? [])
  userMessages.set(userId, data.messages ?? {})
}

function getConversations(userId: string): UadpConversation[] {
  return userConversations.get(userId) || userConversations.get('alejandro') || []
}
function getMessages(userId: string): Record<string, UadpMessage[]> {
  if (!userMessages.has(userId)) userMessages.set(userId, {})
  return userMessages.get(userId)!
}

// --- Manifest ---------------------------------------------------------------

const manifest: UadpManifest = {
  service_id: 'echo',
  service_name: 'Echo',
  uadp_version: '0.1',
  category: 'messaging',
  base_url: 'http://localhost:4007',
  endpoints: [
    { path: '/uadp/v1/auth/register', method: 'POST', description: 'Register with email to get passkey', auth_required: false },
    { path: '/uadp/v1/auth/login', method: 'POST', description: 'Login with email + passkey to get session token', auth_required: false },
    { path: '/uadp/v1/auth/verify', method: 'POST', description: 'Verify if a token is valid', auth_required: false },
    { path: '/uadp/v1/inbox', method: 'GET', description: 'Conversations list sorted by last message', auth_required: false },
    { path: '/uadp/v1/conversation/:id', method: 'GET', description: 'Conversation with messages', auth_required: false },
    { path: '/uadp/v1/conversation/:id/stream', method: 'GET', description: 'SSE stream for new messages', auth_required: false, streaming: true },
    { path: '/uadp/v1/message/send', method: 'POST', description: 'Send a message', auth_required: true },
    { path: '/uadp/v1/search', method: 'GET', description: 'Search messages across conversations', auth_required: false },
  ],
  ai_hints: {
    persona: 'Echo is a messaging platform similar to WhatsApp. Conversations with family, friends, and work colleagues.',
    language: 'en',
    rendering: {
      layout: 'chat_threads',
      accent: '#818cf8',
      date_format: 'smart',
      card: {
        title: '$.name',
        subtitle: '$.last_message.author.name',
        body: '$.last_message.body',
        avatar: '$.members[0].name | initials',
        badge: '$.unread_count',
        meta: ['$.last_message.ts | date'],
      },
      detail: {
        body: '$.body',
        fields: [
          { label: 'Members', value: '$.members' },
          { label: 'Type', value: '$.type' },
        ],
      },
      empty_state: { icon: 'message-square', message: 'No conversations found.' },
      config: {
        bubble_layout: true,
        privacy: 'Do not show message previews in notifications.',
      },
    },
    safety_rules: [
      'Messages are private. Do not display message content outside the conversation view.',
    ],
    user_goals: [
      'View recent conversations',
      'Read and send messages',
      'Search conversations',
    ],
    auth: {
      method: 'Bearer token in Authorization header',
      get_token: 'POST /uadp/v1/auth/register with email, then POST /uadp/v1/auth/login with email and passkey',
    },
  } satisfies UadpAiHints,
  search: {
    endpoint: '/uadp/v1/search',
    param: 'q',
    fields_searched: ['name', 'members.name', 'last_message.body'],
    min_length: 2,
    response_schema: {
      result_keys: ['items'],
      result_types: { items: 'uadp:message' },
    },
    preview_fields: {
      title: '$.author.name',
      snippet: '$.body',
      meta: ['$.conversation_name', '$.ts | date'],
    },
    domain_tags: ['messaging', 'chat', 'conversations', 'contacts'],
    relevance_weight: 0.4,
  },
  pagination: { strategy: 'cursor', default_page_size: 20, max_page_size: 50 },
  realtime: [
    { transport: 'sse', endpoint: '/uadp/v1/conversation/:id/stream', event_types: ['message', 'typing', 'read'], event_schema: 'uadp:message', trigger: 'on_view_open' },
  ],
  cache: {
    '/uadp/v1/inbox': { max_age_seconds: 15, offline_safe: false },
  },
  versioning: { hints_version: '2.0.0', last_updated: 1743300000 },
}

// --- App --------------------------------------------------------------------

const app = new Elysia()
  .use(cors())
  .use(requestLogger('Echo'))
  .use(uadpAuth())
  .use(uadpAuthRoutes())

  // Manifest
  .get('/.well-known/uadp.json', () => manifest)

  // Inbox — sorted by last message ts descending
  .get('/uadp/v1/inbox', ({ userId, authToken }) => {
    const conversations = getConversations(userId)
    const sorted = [...conversations].sort((a, b) => b.last_message.ts - a.last_message.ts)
    return { type: 'uadp:list' as const, items: sorted, authenticated: !!authToken }
  })

  // Conversation detail + messages
  .get('/uadp/v1/conversation/:id', ({ params, userId, authToken }) => {
    const conversations = getConversations(userId)
    const messages = getMessages(userId)
    const conv = conversations.find(c => c.id === params.id)
    if (!conv) return { error: 'not_found', message: 'Conversation not found' }
    const msgs = messages[params.id] ?? []
    return { conversation: conv, messages: msgs, authenticated: !!authToken }
  })

  // SSE stream — replays conversation messages one every 2 seconds
  .get('/uadp/v1/conversation/:id/stream', ({ params, userId, authToken }) => {
    const messages = getMessages(userId)
    const convMessages = messages[params.id] ?? []
    let idx = 0

    return new Response(
      new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder()
          const interval = setInterval(() => {
            if (idx < convMessages.length) {
              const chunk = `event: message\ndata: ${JSON.stringify(convMessages[idx])}\n\n`
              controller.enqueue(encoder.encode(chunk))
              idx++
            } else {
              clearInterval(interval)
              controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'))
              controller.close()
            }
          }, 2000)
        },
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    )
  })

  // Send message
  .post('/uadp/v1/message/send', ({ body, userId, authToken }) => {
    const user = getUserById(userId)
    const conversations = getConversations(userId)
    const messages = getMessages(userId)
    const conv = conversations.find(c => c.id === body.conversation_id)
    if (!conv) return { error: 'not_found', message: 'Conversation not found' }

    const now = Math.floor(Date.now() / 1000)
    const newMsg: UadpMessage = {
      uadp_type: 'uadp:message',
      id: `msg_${Date.now()}`,
      conversation_id: body.conversation_id,
      body: body.body,
      author: { id: user.id, name: user.name },
      ts: now,
      read: true,
    }

    if (!messages[body.conversation_id]) messages[body.conversation_id] = []
    messages[body.conversation_id].push(newMsg)

    // Update last_message on conversation
    conv.last_message = { body: newMsg.body, author: user.name, ts: now }
    conv.ts = now

    return { status: 'sent', message: newMsg, authenticated: !!authToken }
  }, {
    body: t.Object({
      conversation_id: t.String(),
      body: t.String(),
    }),
  })

  // Search messages across all conversations
  .get('/uadp/v1/search', ({ query, userId, authToken }) => {
    const conversations = getConversations(userId)
    const messages = getMessages(userId)
    const q = (query.q ?? '').toLowerCase()
    if (!q) return { type: 'uadp:search_results' as const, query: '', items: [], total: 0, authenticated: !!authToken }

    const results: (UadpMessage & { conversation_name?: string })[] = []
    for (const conv of conversations) {
      const msgs = messages[conv.id] ?? []
      for (const msg of msgs) {
        if (msg.body.toLowerCase().includes(q)) {
          results.push({ ...msg, conversation_name: conv.name })
        }
      }
    }
    return { type: 'uadp:search_results' as const, query: q, items: results, total: results.length, authenticated: !!authToken }
  }, {
    query: t.Object({ q: t.Optional(t.String()) }),
  })

  .listen(4007)

console.log('Echo running on http://localhost:4007')
