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
    description:
      'Lyra is the music streaming platform — similar to Spotify. Listen to music, manage playlists, and discover artists.',
    features: [
      'Music streaming playback',
      'Personal and public playlists',
      'Recently played history',
      'Search by song, artist or album',
      'Liked/favorite tracks',
    ],
    rendering: {
      default_view: 'list',
      track_card: 'Show album cover, title, artist and duration. If soundcloud_url is present, render an embedded SoundCloud player.',
      playlist_card: 'Show cover, name, track count and total duration',
      soundcloud_embed: 'Tracks with a soundcloud_url field are real SoundCloud tracks. Embed using: <iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url={SOUNDCLOUD_URL}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false"></iframe>',
    },
    user_goals: [
      'See what I am listening to or recently played',
      'View my playlists',
      'Search for a song or artist',
      'View my favorite tracks',
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
    if (!q) return { type: 'uadp:search', query: '', tracks: [], artists: [], authenticated: !!authToken }

    const matchedTracks = tracks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.artist.name.toLowerCase().includes(q) ||
      t.album.name.toLowerCase().includes(q)
    ).slice(0, 20)

    const matchedArtists = artists.filter(a =>
      a.name.toLowerCase().includes(q)
    ).slice(0, 10)

    return { type: 'uadp:search', query: q, tracks: matchedTracks, artists: matchedArtists, authenticated: !!authToken }
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
