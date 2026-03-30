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
    description: 'Messaging platform similar to WhatsApp. Conversations with family, friends, and work colleagues.',
    rendering: 'Privacy-focused — do not show message previews in notifications. Group chats should display member count. Use chat bubble layout.',
    user_context: 'User chats with family, friends, work team, and social groups.',
    privacy: 'Messages are private. Do not display message content outside the conversation view.',
  },
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
    if (!q) return { type: 'uadp:list' as const, items: [], authenticated: !!authToken }

    const results: (UadpMessage & { conversation_name?: string })[] = []
    for (const conv of conversations) {
      const msgs = messages[conv.id] ?? []
      for (const msg of msgs) {
        if (msg.body.toLowerCase().includes(q)) {
          results.push({ ...msg, conversation_name: conv.name })
        }
      }
    }
    return { type: 'uadp:list' as const, items: results, authenticated: !!authToken }
  }, {
    query: t.Object({ q: t.Optional(t.String()) }),
  })

  .listen(4007)

console.log('Echo running on http://localhost:4007')
