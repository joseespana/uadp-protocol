import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { requestLogger, getAvailableUsers, USERS } from 'cosmos-core'

const BASE_URL = process.env.COSMOS_BASE_URL || 'http://localhost:41900'

const SERVICES = {
  nova:    { name: 'Nova',    port: 4001, path: '/nova',    category: 'uadp:reading_social' },
  pulse:   { name: 'Pulse',   port: 4002, path: '/pulse',   category: 'uadp:visual_social' },
  orbit:   { name: 'Orbit',   port: 4003, path: '/orbit',   category: 'uadp:banking' },
  zinc:    { name: 'Zinc',    port: 4004, path: '/zinc',    category: 'uadp:banking' },
  market:  { name: 'Market',  port: 4005, path: '/market',  category: 'uadp:commerce' },
  stream:  { name: 'Stream',  port: 4006, path: '/stream',  category: 'uadp:streaming' },
  echo:    { name: 'Echo',    port: 4007, path: '/echo',    category: 'uadp:messaging' },
  herald:  { name: 'Herald',  port: 4008, path: '/herald',  category: 'uadp:news' },
  lyra:    { name: 'Lyra',    port: 4009, path: '/lyra',    category: 'uadp:music' },
  vortex:  { name: 'Vortex',  port: 4010, path: '/vortex',  category: 'uadp:vod' },
  beacon:  { name: 'Beacon',  port: 4011, path: '/beacon',  category: 'uadp:email' },
  compass: { name: 'Compass', port: 4012, path: '/compass', category: 'uadp:transport' },
  flame:   { name: 'Flame',   port: 4013, path: '/flame',   category: 'uadp:food_delivery' },
  atlas:   { name: 'Atlas',   port: 4014, path: '/atlas',   category: 'uadp:calendar' },
}

const app = new Elysia()
  .use(cors())
  .use(requestLogger('Directory'))

  // Service directory — like DNS for UADP services
  .get('/services', () => {
    return {
      type: 'uadp:directory',
      message: 'Each service is independent. Talk to them directly on their URL.',
      items: Object.entries(SERVICES).map(([id, svc]) => ({
        id,
        name: svc.name,
        url: `${BASE_URL}${svc.path}`,
        category: svc.category,
        manifest: `${BASE_URL}${svc.path}/.well-known/uadp.json`,
      })),
    }
  })

  // Known users for this demo
  .get('/users', () => {
    const available = getAvailableUsers()
    return {
      type: 'uadp:users',
      message: 'Use POST /uadp/v1/auth/register on any service with the user email to get started.',
      items: available.map(userId => ({
        id: userId,
        ...(USERS[userId] ? {
          name: USERS[userId].name,
          email: USERS[userId].email,
          handle: USERS[userId].handle,
        } : { name: userId }),
      })),
    }
  })

  .listen(4000)

console.log('Cosmos Directory running on http://localhost:4000')
