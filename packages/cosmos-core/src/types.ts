// Base UADP item
export interface UadpItem {
  uadp_type: string
  id: string
  ts: number
  label: string
  ext?: Record<string, unknown>
}

// UADP Feed response
export interface UadpFeed {
  type: 'uadp:feed'
  cursor: string | null
  items: UadpItem[]
}

// UADP Manifest (/.well-known/uadp.json)
export interface UadpManifest {
  service_id: string
  service_name: string
  uadp_version: string
  category: string
  base_url: string
  endpoints: UadpEndpoint[]
  ai_hints: Record<string, unknown>
}

export interface UadpEndpoint {
  path: string
  method: string
  description: string
  auth_required: boolean
  streaming?: boolean
}

// Post (Nova, Pulse)
export interface UadpPost extends UadpItem {
  uadp_type: 'uadp:post' | 'uadp:media_post'
  body: string
  author: UadpAuthor
  likes: number
  reposts: number
  replies_count: number
  lang: string
  tags: string[]
}

export interface UadpAuthor {
  id: string
  name: string
  handle: string
  avatar_url: string
  verified?: boolean
}

// Transaction (Orbit, Zinc)
export interface UadpTransaction extends UadpItem {
  uadp_type: 'uadp:transaction'
  amount: UadpMoney
  direction: 'in' | 'out'
  status: 'completed' | 'pending' | 'failed'
  merchant?: UadpMerchant
  balance_after?: UadpMoney
}

export interface UadpMoney {
  value: number
  currency: string
}

export interface UadpMerchant {
  name: string
  category: string
  city?: string
  country?: string
}

// Account (Orbit, Zinc)
export interface UadpAccount {
  uadp_type: 'uadp:account'
  id: string
  label: string
  type: 'checking' | 'savings' | 'credit'
  balance: UadpMoney
  currency: string
}

// Order (Market)
export interface UadpOrder extends UadpItem {
  uadp_type: 'uadp:order'
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled'
  total: UadpMoney
  items: UadpOrderItem[]
  shipping_address: UadpAddress
}

export interface UadpOrderItem {
  product_id: string
  title: string
  qty: number
  unit_price: UadpMoney
  image_url: string
}

export interface UadpAddress {
  name: string
  street: string
  city: string
  zip: string
}

// Product (Market)
export interface UadpProduct {
  uadp_type: 'uadp:product'
  id: string
  title: string
  description: string
  price: UadpMoney
  category: string
  image_url: string
  rating: number
  reviews_count: number
}

// Conversation (Echo)
export interface UadpConversation extends UadpItem {
  uadp_type: 'uadp:conversation'
  type: 'direct' | 'group'
  name: string
  members: { id: string; name: string }[]
  last_message: {
    body: string
    author: string
    ts: number
  }
  unread_count: number
  muted: boolean
}

// Message (Echo)
export interface UadpMessage {
  uadp_type: 'uadp:message'
  id: string
  conversation_id: string
  body: string
  author: { id: string; name: string }
  ts: number
  read: boolean
}

// Article (Herald)
export interface UadpArticle extends UadpItem {
  uadp_type: 'uadp:article'
  title: string
  summary: string
  body_markdown: string
  category: string
  author_name: string
  image_url: string
  read_time_min: number
}

// Video (Stream)
export interface UadpVideo extends UadpItem {
  uadp_type: 'uadp:video'
  title: string
  description: string
  channel: { id: string; name: string; subscribers: number }
  duration_seconds: number
  views: number
  likes: number
  thumbnail_url: string
  tags: string[]
}

// Notification
export interface UadpNotification {
  uadp_type: 'uadp:notification'
  id: string
  ts: number
  type: 'like' | 'reply' | 'follow' | 'mention' | 'system'
  message: string
  read: boolean
  actor?: UadpAuthor
  target_id?: string
}

// Story (Pulse)
export interface UadpStory {
  uadp_type: 'uadp:story'
  id: string
  author: UadpAuthor
  media_url: string
  ts: number
  expires_ts: number
  viewed: boolean
}

// Track (Lyra — music streaming)
export interface UadpTrack extends UadpItem {
  uadp_type: 'uadp:track'
  title: string
  artist: { id: string; name: string; image_url: string }
  album: { id: string; name: string; cover_url: string }
  duration_seconds: number
  plays: number
}

// Playlist (Lyra)
export interface UadpPlaylist {
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
}

// Title (Vortex — video on demand / series & movies)
export interface UadpTitle extends UadpItem {
  uadp_type: 'uadp:title'
  title: string
  synopsis: string
  type: 'movie' | 'series'
  genre: string[]
  poster_url: string
  backdrop_url: string
  rating: number
  year: number
  duration_minutes?: number
  seasons?: number
  episodes?: number
  progress?: { season?: number; episode?: number; percent: number }
}

// Email (Beacon)
export interface UadpEmail extends UadpItem {
  uadp_type: 'uadp:email'
  subject: string
  from: { name: string; address: string }
  to: { name: string; address: string }[]
  body_text: string
  body_html?: string
  folder: 'inbox' | 'sent' | 'drafts' | 'spam' | 'trash'
  read: boolean
  starred: boolean
  attachments?: { name: string; size_bytes: number; type: string }[]
}

// Ride (Compass — maps & ride-hailing)
export interface UadpRide extends UadpItem {
  uadp_type: 'uadp:ride'
  status: 'completed' | 'cancelled' | 'in_progress'
  origin: { name: string; lat: number; lng: number }
  destination: { name: string; lat: number; lng: number }
  distance_km: number
  duration_minutes: number
  fare: UadpMoney
  driver?: { name: string; rating: number; vehicle: string; plate: string }
  ride_type: 'standard' | 'premium' | 'shared'
}

// SavedPlace (Compass)
export interface UadpSavedPlace {
  uadp_type: 'uadp:saved_place'
  id: string
  name: string
  label: string
  address: string
  lat: number
  lng: number
  category: 'home' | 'work' | 'favorite'
}

// FoodOrder (Flame — food delivery)
export interface UadpFoodOrder extends UadpItem {
  uadp_type: 'uadp:food_order'
  status: 'delivered' | 'in_progress' | 'cancelled'
  restaurant: { id: string; name: string; cuisine: string; rating: number; image_url: string }
  items: { name: string; qty: number; unit_price: UadpMoney }[]
  total: UadpMoney
  delivery_fee: UadpMoney
  delivery_address: string
  estimated_minutes?: number
}

// CalendarEvent (Atlas)
export interface UadpCalendarEvent extends UadpItem {
  uadp_type: 'uadp:calendar_event'
  title: string
  description: string
  start_ts: number
  end_ts: number
  all_day: boolean
  location?: string
  calendar: string
  color: string
  recurrence?: 'daily' | 'weekly' | 'monthly' | null
  attendees?: { name: string; email: string; status: 'accepted' | 'declined' | 'pending' }[]
}
