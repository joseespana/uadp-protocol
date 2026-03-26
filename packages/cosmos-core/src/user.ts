export const ALEJANDRO = {
  id: 'user:alejandro_vega',
  name: 'Alejandro Vega',
  handle: '@alejandro_v',
  age: 31,
  city: 'San Francisco',
  country: 'US',
  occupation: 'Software developer',
  language: 'en',
  currency: 'USD',
  joined_cosmos: '2021-03-15',
  avatar_url: '/avatars/alejandro.jpg',
  email: 'alejandro@cosmos-demo.local',
  phone: '+1-415-555-1234'
} as const

export const ALEJANDRO_AUTHOR = {
  id: ALEJANDRO.id,
  name: ALEJANDRO.name,
  handle: ALEJANDRO.handle,
  avatar_url: ALEJANDRO.avatar_url,
  verified: false
} as const

export const JOSE = {
  id: 'user:jose_espana',
  name: 'Jose Espana',
  handle: '@jose_espana',
  age: 34,
  city: 'San Francisco',
  country: 'US',
  occupation: 'CTO & Full-stack Developer',
  language: 'en',
  currency: 'USD',
  joined_cosmos: '2020-08-10',
  avatar_url: 'https://picsum.photos/seed/jose_espana_avatar/200/200',
  email: 'jose.espana@perseusoft.tech',
  phone: '+1-415-555-9876'
} as const

export const TEST_USER = {
  id: 'user:test_user',
  name: 'Alex Morgan',
  handle: '@alex_morgan',
  age: 28,
  city: 'San Francisco',
  country: 'US',
  occupation: 'QA Engineer',
  language: 'en',
  currency: 'USD',
  joined_cosmos: '2023-01-20',
  avatar_url: 'https://picsum.photos/seed/test_user_avatar/200/200',
  email: 'test@perseusoft.tech',
  phone: '+1-415-555-5000'
} as const

export const USERS: Record<string, typeof ALEJANDRO | typeof JOSE | typeof TEST_USER> = {
  alejandro: ALEJANDRO,
  jose_espana: JOSE,
  test_user: TEST_USER,
}

export function getUserByEmail(email: string) {
  return Object.values(USERS).find(u => u.email === email) ?? null
}

export function getUserById(userId: string) {
  return USERS[userId] ?? ALEJANDRO
}
