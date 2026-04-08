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

// ─── UADP Rendering Hints (v2) ──────────────────────────────────
// These hints are prescriptive — the browser uses them directly to
// render content without if/else chains. The service tells the
// browser exactly how to display its data.

/** Which visual layout the browser should use. */
export type UadpLayout =
  | 'timeline'          // Vertical feed of posts (social)
  | 'media_grid'        // Image/video grid (visual social)
  | 'finance_dashboard' // Accounts + transaction list
  | 'video_gallery'     // Video cards with thumbnails + embed player
  | 'music_player'      // Track list with playback controls
  | 'product_catalog'   // Product cards with prices + ratings
  | 'article_reader'    // Article cards → full read view
  | 'email_inbox'       // Email rows with folder tabs
  | 'chat_threads'      // Messaging threads → bubble view
  | 'poster_grid'       // Movie/series poster grid
  | 'trip_list'         // Origin → destination cards (rides, delivery)
  | 'calendar_agenda'   // Agenda / schedule view

/** Format pipe — how to render a value. Appended after field path with |  */
export type UadpFormatPipe =
  | 'number'     // 1234567 → "1,234,567" or "1.2M"
  | 'money'      // reads .value + .currency → "$1,234.56"
  | 'duration'   // seconds → "3:42" or "1h 23m"
  | 'date'       // unix ts → relative ("2h ago") or absolute
  | 'date_abs'   // unix ts → "Mar 29, 2026"
  | 'stars'      // number → ★★★★☆
  | 'percent'    // 0.73 → "73%"
  | 'size'       // bytes → "4.2 MB"
  | 'initials'   // "John Doe" → "JD" (avatar fallback)
  | 'join'       // ["Rock","Pop"] → "Rock, Pop" (array to string)
  | 'boolean'    // true → "Yes" / false → "No"
  | 'uppercase'  // "hello" → "HELLO"

/** Card field mapping — tells the browser which data field to render where. */
export interface UadpCardHints {
  /** Main display title. e.g. "$.title" or "$.subject" */
  title: string
  /** Secondary line. e.g. "$.author.name" or "$.artist.name" */
  subtitle?: string
  /** Third line or body preview. e.g. "$.body" or "$.summary" */
  body?: string
  /** Image URL field. e.g. "$.thumbnail_url" or "$.album.cover_url" */
  image?: string
  /** Avatar URL for the author/sender. e.g. "$.author.avatar_url" */
  avatar?: string
  /** Badge text. e.g. "$.category" or "$.status" */
  badge?: string
  /** Array of metadata items shown below the card. e.g. ["$.views | number", "$.duration_seconds | duration"] */
  meta?: string[]
  /** If the card has a price. e.g. "$.price | money" */
  price?: string
  /** Color field for per-item accent. e.g. "$.color" */
  color_field?: string
}

/** Detail view — what to show when the user clicks/expands an item. */
export interface UadpDetailHints {
  /** Full body/content field. e.g. "$.body_markdown || $.body || $.body_text" */
  body?: string
  /** Embeddable media URL. e.g. "$.youtube_url" or "$.media_url" */
  media?: string
  /** How to render the media: embed an iframe, show an image, or play audio. */
  media_type?: 'video_embed' | 'image' | 'audio' | 'iframe'
  /** Key-value fields shown in the detail view. */
  fields?: Array<{ label: string; value: string }>
}

/** Action the user can perform from the UI. */
export interface UadpActionHint {
  label: string
  icon?: string
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  /** If true, ask the user for confirmation before executing. */
  confirm?: boolean
}

/** Complete rendering specification that a service provides in ai_hints. */
export interface UadpRenderingHints {
  /** Which layout component the browser should use. This is the PRIMARY signal. */
  layout: UadpLayout
  /** Default accent color for this service (hex). */
  accent?: string
  /** Card field mapping. */
  card: UadpCardHints
  /** Detail/expanded view mapping. */
  detail?: UadpDetailHints
  /** Date format preference. */
  date_format?: 'relative' | 'absolute' | 'smart'
  /** Number format preference. */
  number_format?: 'full' | 'compact'
  /** Available user actions. */
  actions?: UadpActionHint[]
  /** What to show when no items are found. */
  empty_state?: { icon?: string; message: string }
  /** Additional layout-specific config (e.g. grid columns, group_by). */
  config?: Record<string, unknown>
}

/** Full ai_hints structure with typed rendering. */
export interface UadpAiHints {
  /** One-paragraph description of the service for LLM context. */
  persona: string
  /** Primary language of the content. */
  language: string
  /** Prescriptive rendering specification. */
  rendering: UadpRenderingHints
  /** Keywords that help agents understand domain concepts. */
  key_concepts?: Record<string, string>
  /** What the user typically wants to do with this service. */
  user_goals?: string[]
  /** Authentication instructions. */
  auth?: Record<string, string>
  /** Safety rules for agents handling this data. */
  safety_rules?: string[]
  /** Proactive suggestions for the agent. */
  proactive_suggestions?: string[]
  /** Accessibility hints for screen readers and high contrast. */
  accessibility?: UadpAccessibilityHints
  /** Onboarding: what to show/fetch on first visit. */
  onboarding?: string[]
}

/** Accessibility hints for inclusive rendering. */
export interface UadpAccessibilityHints {
  /** Template for card aria-label. e.g. "Post by $.author.name: $.body" */
  card_aria_label?: string
  /** Template for image alt text. e.g. "$.title album cover" */
  image_alt?: string
  /** High-contrast alternative accent color (WCAG AA compliant). */
  high_contrast_accent?: string
}

/** Search behavior declaration. */
export interface UadpSearchHints {
  /** The search endpoint path. */
  endpoint: string
  /** Query parameter name (default: "q"). */
  param?: string
  /** Which data fields are searched. */
  fields_searched?: string[]
  /** Minimum query length. */
  min_length?: number
  /** Available filter parameters. */
  filters?: string[]
  /** Available sort options. */
  sort_options?: string[]

  // ── Search Response Contract (v2.1) ──────────────────────────────

  /** Describes the shape of search responses so agents can parse them generically. */
  response_schema?: {
    /** Key(s) in the response JSON that hold result arrays. Default: ["items"]. */
    result_keys: string[]
    /** Maps each result key to the uadp_type it contains. */
    result_types: Record<string, string>
  }

  /** Compact preview mapping for cross-service search result display. */
  preview_fields?: {
    /** JSON path to the display title. e.g. "$.title" */
    title: string
    /** JSON path to the text snippet. e.g. "$.body" */
    snippet: string
    /** JSON path to thumbnail/image. e.g. "$.thumbnail_url" */
    image?: string
    /** Additional metadata paths. e.g. ["$.likes | number", "$.ts | date"] */
    meta?: string[]
  }

  /** Semantic domain tags for cross-service search relevance ranking. */
  domain_tags?: string[]

  /** Base relevance weight (0.0–1.0) for cross-service search prioritization. Higher = more likely to surface. */
  relevance_weight?: number
}

/** Standard search response that all UADP services should return. */
export interface UadpSearchResponse {
  type: 'uadp:search_results'
  /** The original query string. */
  query: string
  /** Primary result array — agents should always check this key first. */
  items: UadpItem[]
  /** Total number of matching results (may be greater than items.length). */
  total: number
  /** Optional grouped results for services that return multiple types. */
  groups?: Record<string, UadpItem[]>
  /** Whether the request was authenticated. */
  authenticated?: boolean
}

/** Pagination strategy declaration. */
export interface UadpPaginationHints {
  /** Pagination strategy. */
  strategy: 'cursor' | 'offset' | 'page'
  /** Default page size. */
  default_page_size?: number
  /** Maximum page size. */
  max_page_size?: number
  /** Cursor parameter name (default: "cursor"). */
  cursor_param?: string
}

/** Real-time update declaration. */
export interface UadpRealtimeHints {
  /** Transport protocol. */
  transport: 'sse' | 'websocket' | 'polling'
  /** Endpoint path for the real-time stream. */
  endpoint: string
  /** What event types this stream emits. */
  event_types?: string[]
  /** Schema type of emitted events. */
  event_schema?: string
  /** When to connect: 'on_view_open' | 'on_login' | 'always' */
  trigger?: 'on_view_open' | 'on_login' | 'always'
  /** Polling interval in seconds (only for transport: 'polling'). */
  poll_interval_seconds?: number
}

/** Cache policy per endpoint. */
export interface UadpCacheHints {
  /** Max age in seconds before data is considered stale. */
  max_age_seconds: number
  /** Whether this data can be stored for offline use. */
  offline_safe?: boolean
}

/** Cross-service link declaration. */
export interface UadpCrossServiceLink {
  /** Field on this service's data that links to another service. */
  field: string
  /** Target service ID. */
  target_service: string
  /** Endpoint template on the target service. */
  target_endpoint: string
  /** Human-readable label for the link. */
  label: string
}

/** Hints version tracking. */
export interface UadpVersioningHints {
  /** Semantic version of the ai_hints block. */
  hints_version: string
  /** Unix timestamp of last update. */
  last_updated: number
  /** Human-readable changelog. */
  changelog?: string
}

/** Content inventory — how much data this service currently holds. */
export interface UadpContentStats {
  /** Approximate total number of items available. */
  total_items: number
  /** Map of uadp_type → item count. */
  types: Record<string, number>
  /** How often content is updated. */
  update_frequency: 'real-time' | 'minutely' | 'hourly' | 'daily' | 'weekly'
  /** ISO 8601 timestamp of the last content update. */
  last_content_update: string
}

/** An intent declaration — what user action/verb this service can fulfill. */
export interface UadpIntentDeclaration {
  /** Human-readable description of what this intent does. */
  description: string
  /** Endpoint paths that handle this intent. */
  endpoints: string[]
  /** Whether authentication is required for this intent. */
  auth_required?: boolean
}

/** A minimal featured item for agent context (2–3 representative samples). */
export interface UadpFeaturedItem {
  /** UADP schema type of the item. */
  uadp_type: string
  /** Display title. */
  title: string
  /** Domain category this item belongs to. */
  category: string
  /** Additional metadata fields (arbitrary). */
  [key: string]: unknown
}

/** Trust and quality signals for this service's content. */
export interface UadpQualitySignals {
  /** Origin of the data: 'institutional', 'curated', 'user-generated', or combined via '+'. */
  data_source: string
  /** Moderation/verification level applied to content. */
  verification: 'editorial' | 'moderated' | 'community-moderated' | 'verified' | 'licensed' | 'none'
  /** How current the content is. */
  content_freshness: 'real-time' | 'hourly' | 'daily' | 'weekly'
  /** Audience rating of the content. */
  content_rating: 'general' | 'teen' | 'mature'
}

/** How this service relates to another service in the Cosmos ecosystem. */
export interface UadpServiceRelationship {
  /** The service_id of the related service. */
  service: string
  /** Semantic relation type. */
  relation: 'payment_for' | 'cross-posted' | 'reviews' | 'shared' | 'discussed' | 'linked_account' | 'event_invites' | 'meeting_links' | 'music_videos' | 'delivery_tracking' | 'food_charges' | 'ride_charges' | 'purchase_records' | 'order_confirmations'
  /** Human-readable explanation of the relationship. */
  description: string
}

// UADP Manifest (/.well-known/uadp.json)
export interface UadpManifest {
  service_id: string
  service_name: string
  uadp_version: string
  category: string
  base_url: string
  endpoints: UadpEndpoint[]
  ai_hints: UadpAiHints
  /** Search behavior — how the browser should construct search queries. */
  search?: UadpSearchHints
  /** Pagination strategy. */
  pagination?: UadpPaginationHints
  /** Real-time update channels. */
  realtime?: UadpRealtimeHints[]
  /** Cache policies per endpoint path. */
  cache?: Record<string, UadpCacheHints>
  /** Cross-service data links. */
  cross_service_links?: UadpCrossServiceLink[]
  /** Security tier: 'standard' or 'elevated' (banking/gov). Elevated = shorter TTL, biometric confirm. */
  security_tier?: 'standard' | 'elevated'
  /** Hints versioning for cache invalidation. */
  versioning?: UadpVersioningHints

  // ── Autodiscovery fields (v2.1) ──────────────────────────────────────────

  /** Content inventory: how many items and how often they are updated. */
  content_stats?: UadpContentStats
  /** Domain taxonomy tags describing content categories available. */
  content_taxonomy?: string[]
  /** Intent map: user verbs/actions this service can fulfill. */
  intents?: Record<string, UadpIntentDeclaration>
  /** Representative sample items (2–3) for agent context priming. */
  featured?: UadpFeaturedItem[]
  /** Trust and quality signals for content ranking and agent decisions. */
  quality?: UadpQualitySignals
  /** Relationships to other services in the ecosystem. */
  relationships?: UadpServiceRelationship[]
}

export interface UadpEndpoint {
  path: string
  method: string
  description: string
  auth_required: boolean
  streaming?: boolean
  /** Request body schema hint (for POST/PUT endpoints). */
  body_params?: Record<string, string>
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
