import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { loadAllUsersData, requestLogger, uadpAuth, uadpAuthRoutes, type UadpManifest } from 'cosmos-core'

// ── Data ────────────────────────────────────────────────────────────────────

interface LyraTrack {
  uadp_type: 'uadp:track'
  id: string
  ts: number
  label: string
  title: string
  artist: { id: string; name: string; image_url: string }
  album: { id: string; name: string; cover_url: string }
  duration_seconds: number
  plays: number
  played_at?: number
}

interface LyraPlaylist {
  uadp_type: 'uadp:playlist'
  id: string
  name: string
  description: string
  cover_url: string
  owner: { id: string; name: string }
  track_count: number
  duration_seconds: number
  followers: number
  is_public: boolean
  tracks: string[]
}

interface LyraData {
  tracks: LyraTrack[]
  playlists: LyraPlaylist[]
  recently_played: LyraTrack[]
  liked_tracks: string[]
  artists: { id: string; name: string; image_url: string }[]
  albums: { id: string; name: string; artist: any; cover_url: string; year: number }[]
}

const allUsersData = loadAllUsersData<LyraData>('lyra-music')

function getUserData(userId: string): LyraData {
  return allUsersData.get(userId) || allUsersData.get('alejandro') || { tracks: [], playlists: [], recently_played: [], liked_tracks: [], artists: [], albums: [] }
}

// Per-user liked tracks (mutable)
const userLikedTracks = new Map<string, Set<string>>()
for (const [userId, data] of allUsersData) {
  userLikedTracks.set(userId, new Set(data.liked_tracks ?? []))
}

function getLikedTracks(userId: string): Set<string> {
  if (!userLikedTracks.has(userId)) userLikedTracks.set(userId, new Set())
  return userLikedTracks.get(userId)!
}

// ── Manifest ────────────────────────────────────────────────────────────────

const manifest: UadpManifest = {
  service_id: 'lyra',
  service_name: 'Lyra',
  uadp_version: '0.1.0',
  category: 'media:music',
  base_url: 'http://localhost:4009',
  endpoints: [
    { path: '/uadp/v1/auth/register', method: 'POST', description: 'Register with email to get passkey', auth_required: false },
    { path: '/uadp/v1/auth/login', method: 'POST', description: 'Login with email + passkey to get session token', auth_required: false },
    { path: '/uadp/v1/auth/verify', method: 'POST', description: 'Verify if a token is valid', auth_required: false },
    { path: '/uadp/v1/recently-played', method: 'GET', description: 'Recently played tracks', auth_required: false },
    { path: '/uadp/v1/playlists', method: 'GET', description: 'User playlists', auth_required: false },
    { path: '/uadp/v1/playlists/:id', method: 'GET', description: 'Playlist detail with tracks', auth_required: false },
    { path: '/uadp/v1/liked', method: 'GET', description: 'Liked tracks', auth_required: false },
    { path: '/uadp/v1/search', method: 'GET', description: 'Search tracks, artists, albums', auth_required: false },
    { path: '/uadp/v1/now-playing', method: 'GET', description: 'Current playback state', auth_required: false },
  ],
  ai_hints: {
    persona: 'Lyra is the music streaming platform — similar to Spotify. Listen to music, manage playlists, and discover artists.',
    language: 'en',
    rendering: {
      layout: 'music_player',
      accent: '#ec4899',
      date_format: 'relative',
      card: {
        title: '$.title',
        subtitle: '$.artist.name',
        image: '$.album.cover_url || $.artist.image_url',
        meta: ['$.duration_seconds | duration', '$.plays | number'],
      },
      detail: {
        fields: [
          { label: 'Album', value: '$.album.name' },
          { label: 'Artist', value: '$.artist.name' },
          { label: 'Duration', value: '$.duration_seconds | duration' },
          { label: 'Plays', value: '$.plays | number' },
        ],
        media: '$.soundcloud_url',
        media_type: 'audio',
      },
      empty_state: { icon: 'music', message: 'No tracks found. Try a different search.' },
      config: {
        playback: true,
        duration_field: '$.duration_seconds',
        cover_field: '$.album.cover_url',
        artist_field: '$.artist.name',
      },
    },
    key_concepts: {
      'soundcloud_url': 'Real SoundCloud track URL — embed as an audio player when present.',
    },
    user_goals: [
      'See recently played tracks',
      'View my playlists',
      'Search for a song or artist',
      'View favorite tracks',
    ],
    auth: {
      method: 'Bearer token in Authorization header',
      get_token: 'POST /uadp/v1/auth/register with email, then POST /uadp/v1/auth/login with email and passkey',
    },
  } satisfies UadpAiHints,
  search: {
    endpoint: '/uadp/v1/search',
    param: 'q',
    fields_searched: ['title', 'artist.name', 'album.name'],
    min_length: 2,
    response_schema: {
      result_keys: ['items', 'tracks', 'artists'],
      result_types: { items: 'uadp:track | uadp:artist', tracks: 'uadp:track', artists: 'uadp:artist' },
    },
    preview_fields: {
      title: '$.title || $.name',
      snippet: '$.artist.name || $.label',
      image: '$.album.cover_url || $.image_url',
      meta: ['$.plays | number', '$.duration_seconds | duration'],
    },
    domain_tags: ['music', 'songs', 'listen', 'audio', 'playlists', 'artists', 'albums', 'spotify'],
    relevance_weight: 0.5,
  },
  pagination: { strategy: 'cursor', default_page_size: 20, max_page_size: 50 },
  cache: {
    '/uadp/v1/playlists': { max_age_seconds: 600, offline_safe: true },
    '/uadp/v1/recently-played': { max_age_seconds: 30, offline_safe: false },
  },
  versioning: { hints_version: '2.0.0', last_updated: 1743300000 },
  content_stats: {
    total_items: 500,
    types: { 'uadp:track': 420, 'uadp:playlist': 80 },
    update_frequency: 'daily',
    last_content_update: '2026-04-08T00:00:00Z',
  },
  content_taxonomy: ['rock', 'electronic', 'hip-hop', 'jazz', 'classical', 'latin', 'pop'],
  intents: {
    listen:           { description: 'Play a track or resume recently played',    endpoints: ['/uadp/v1/recently-played', '/uadp/v1/now-playing'] },
    search:           { description: 'Search for tracks, artists, or albums',     endpoints: ['/uadp/v1/search'] },
    'create-playlist':{ description: 'View and manage personal playlists',         endpoints: ['/uadp/v1/playlists'] },
    discover:         { description: 'Discover new music via liked tracks',        endpoints: ['/uadp/v1/liked'] },
  },
  featured: [
    { uadp_type: 'uadp:track',    title: 'Oye Como Va — Carlos Santana',               category: 'latin',      artist: 'Santana'          },
    { uadp_type: 'uadp:track',    title: 'Blinding Lights — The Weeknd',               category: 'pop',        artist: 'The Weeknd'       },
    { uadp_type: 'uadp:playlist', title: 'Friday Work Session — focus beats playlist', category: 'electronic'                             },
  ],
  quality: {
    data_source:       'licensed',
    verification:      'verified',
    content_freshness: 'daily',
    content_rating:    'general',
  },
  relationships: [
    { service: 'stream', relation: 'music_videos', description: 'Music videos for Lyra tracks available on Stream' },
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
  .use(requestLogger('Lyra'))
  .use(uadpAuth())
  .use(uadpAuthRoutes())

  .get('/.well-known/uadp.json', () => manifest)

  // Recently played
  .get('/uadp/v1/recently-played', ({ query, userId, authToken }) => {
    const data = getUserData(userId)
    const recentlyPlayed = data.recently_played ?? []
    const limit = Math.min(Number(query.limit) || 20, 50)
    const { items, next_cursor } = paginate(recentlyPlayed, query.cursor ?? null, limit)
    return { type: 'uadp:recently_played', cursor: next_cursor, items, authenticated: !!authToken }
  })

  // Playlists
  .get('/uadp/v1/playlists', ({ userId, authToken }) => {
    const data = getUserData(userId)
    const playlists = data.playlists ?? []
    return { type: 'uadp:playlists', items: playlists.map(({ tracks: _t, ...p }) => p), authenticated: !!authToken }
  })

  // Playlist detail
  .get('/uadp/v1/playlists/:id', ({ params, userId, authToken }) => {
    const data = getUserData(userId)
    const playlists = data.playlists ?? []
    const tracks = data.tracks ?? []
    const playlist = playlists.find(p => p.id === params.id)
    if (!playlist) return { error: 'not_found', message: 'Playlist not found' }
    const playlistTracks = playlist.tracks
      .map(tid => tracks.find(t => t.id === tid))
      .filter(Boolean)
    return { ...playlist, tracks: playlistTracks, authenticated: !!authToken }
  })

  // Liked tracks
  .get('/uadp/v1/liked', ({ query, userId, authToken }) => {
    const data = getUserData(userId)
    const likedTracks = getLikedTracks(userId)
    const tracks = data.tracks ?? []
    const liked = tracks.filter(t => likedTracks.has(t.id))
    const limit = Math.min(Number(query.limit) || 20, 50)
    const { items, next_cursor } = paginate(liked, query.cursor ?? null, limit)
    return { type: 'uadp:liked', cursor: next_cursor, items, authenticated: !!authToken }
  })

  // Search (public)
  .get('/uadp/v1/search', ({ query, userId, authToken }) => {
    const data = getUserData(userId)
    const tracks = data.tracks ?? []
    const artists = data.artists ?? []
    const q = (query.q ?? '').toLowerCase().trim()
    if (!q) return { type: 'uadp:search_results' as const, query: '', items: [], total: 0, groups: { tracks: [], artists: [] }, authenticated: !!authToken }

    const matchedTracks = tracks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.artist.name.toLowerCase().includes(q) ||
      t.album.name.toLowerCase().includes(q)
    ).slice(0, 20)

    const matchedArtists = artists.filter(a =>
      a.name.toLowerCase().includes(q)
    ).slice(0, 10)

    const allResults = [...matchedTracks, ...matchedArtists]
    return { type: 'uadp:search_results' as const, query: q, items: allResults, total: allResults.length, groups: { tracks: matchedTracks, artists: matchedArtists }, authenticated: !!authToken }
  })

  // Now playing (simulated)
  .get('/uadp/v1/now-playing', ({ userId, authToken }) => {
    const data = getUserData(userId)
    const recentlyPlayed = data.recently_played ?? []
    const current = recentlyPlayed[0]
    if (!current) return { type: 'uadp:now_playing', is_playing: false, authenticated: !!authToken }
    return {
      type: 'uadp:now_playing',
      is_playing: true,
      track: current,
      progress_seconds: Math.floor(current.duration_seconds * 0.35),
      shuffle: true,
      repeat: 'off',
      authenticated: !!authToken,
    }
  })

  .listen(4009)

console.log('Lyra running on http://localhost:4009')
