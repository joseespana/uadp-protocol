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

export const JOSE_AUTHOR = {
  id: JOSE.id,
  name: JOSE.name,
  handle: JOSE.handle,
  avatar_url: JOSE.avatar_url,
  verified: true
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

export const USERS: Record<string, typeof JOSE | typeof TEST_USER> = {
  jose_espana: JOSE,
  test_user: TEST_USER,
}

export function getUserByEmail(email: string) {
  return Object.values(USERS).find(u => u.email === email) ?? null
}

export function getUserById(userId: string) {
  return USERS[userId] ?? JOSE
}
