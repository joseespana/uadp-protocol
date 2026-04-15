/**
 * Cosmos Data Seed Script
 *
 * Master data generation for Alejandro Vega across every Cosmos service.
 * Run: bun run data/seed.ts
 */

import { faker } from '@faker-js/faker/locale/en'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

// ---------------------------------------------------------------------------
// Deterministic seed & output
// ---------------------------------------------------------------------------
faker.seed(42)

const OUT = join(import.meta.dir, 'alejandro')
mkdirSync(OUT, { recursive: true })

function save(name: string, data: unknown) {
  writeFileSync(join(OUT, `${name}.json`), JSON.stringify(data, null, 2))
  const kb = (JSON.stringify(data).length / 1024).toFixed(1)
  console.log(`✓ ${name}.json  (${kb} KB)`)
}

// ---------------------------------------------------------------------------
// Time helpers
// ---------------------------------------------------------------------------
const NOW = Date.now()
const ONE_DAY_MS = 86_400_000

function daysAgo(d: number): number {
  return Math.floor((Date.now() - d * 86400000) / 1000)
}

function tsSecondsAgo(days: number, jitterHours = 0): number {
  const jitter = jitterHours ? faker.number.int({ min: 0, max: jitterHours * 3600 }) * 1000 : 0
  return Math.floor((NOW - days * ONE_DAY_MS - jitter) / 1000)
}

function tsRandom(withinDays = 180): number {
  const offset = faker.number.int({ min: 0, max: withinDays * 86_400 })
  return Math.floor(NOW / 1000) - offset
}

function picsum(seed: string, w = 400, h = 400): string {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`
}

function uid(prefix: string): string {
  return `${prefix}:${faker.string.alphanumeric(12)}`
}

function roundUSD(v: number): number {
  return Math.round(v * 100) / 100
}

// ---------------------------------------------------------------------------
// Alejandro's profile constants
// ---------------------------------------------------------------------------
const ALEJANDRO = {
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
  avatar_url: picsum('alejandro_avatar', 200, 200),
  email: 'alejandro@cosmos-demo.local',
  phone: '+1-415-555-1234',
}

const ALEJANDRO_AUTHOR = {
  id: ALEJANDRO.id,
  name: ALEJANDRO.name,
  handle: ALEJANDRO.handle,
  avatar_url: ALEJANDRO.avatar_url,
  verified: false,
}

// ---------------------------------------------------------------------------
// Fictional brands (NO real brands anywhere)
// ---------------------------------------------------------------------------
const BRANDS = {
  convenience: ['MiniExpress', 'QuickStop', 'CornerMart', 'Presto 24h'],
  coffee: ['Blue Bottle', 'Aroma Central', 'The Golden Cup', 'Cafe Ventana'],
  restaurant: ['Sol Kitchen', 'Bistro Valencia', 'Taqueria Don Julio', 'Sushi Kaze', 'Abuela\'s Kitchen', 'The Grill House'],
  grocery: ['SuperMart', 'FreshCo', 'Green Market', 'Trader\'s Market'],
  electronics: ['TechZone', 'ByteShop', 'DigitalPlus', 'CircuitCo'],
  clothing: ['UrbanFit', 'ThreadLine', 'DarkStitch', 'Vestimenta Co.'],
  transport: ['BART SF', 'RidaGo', 'ViaRapido Express', 'SafeTaxi'],
  streaming: ['StreamPlus', 'MelodyWave', 'CinemaGo', 'PodcastHub'],
  software: ['CodeForge Pro', 'DesignLab', 'CloudSync', 'DevTools Pro'],
  gym: ['GymFit Downtown', 'Urban Athlete'],
  pharmacy: ['VitaPharm', 'Health Express'],
  gas: ['PetroMax', 'QuickGas'],
  music: ['LyraMusic', 'SonarBeats', 'WaveFM', 'SoundPulse'],
  vod: ['VortexPlay', 'CineNova', 'ScreenBox', 'RelayFilms'],
  food_delivery: ['FlameEats', 'QuickBite', 'BitesNow', 'EasyDeliver'],
  rideshare: ['CompassGo', 'ViaRapido', 'RouteExpress', 'MoveCity'],
}

function pickBrand(category: keyof typeof BRANDS): string {
  const arr = BRANDS[category]
  return arr[faker.number.int({ min: 0, max: arr.length - 1 })]
}

// ---------------------------------------------------------------------------
// 40 fictional accounts for social feeds
// ---------------------------------------------------------------------------
function makeAuthor(idSeed?: string) {
  const id = idSeed || uid('user')
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()
  return {
    id,
    name: `${firstName} ${lastName}`,
    handle: `@${firstName.toLowerCase()}_${faker.string.alphanumeric(3)}`,
    avatar_url: picsum(id, 100, 100),
    verified: faker.datatype.boolean(0.1),
  }
}

const FORTY_AUTHORS = Array.from({ length: 40 }, (_, i) => makeAuthor(`fakeuser_${i}`))

// =========================================================================
// 1. PROFILE
// =========================================================================
function generateProfile() {
  return {
    uadp_type: 'uadp:profile',
    ...ALEJANDRO,
    bio: 'Full-stack developer in SF. Lover of coffee, hiking, and open source.',
    interests: ['technology', 'coffee', 'hiking', 'electronic music', 'travel', 'craft coffee'],
    social_links: {
      nova: '@alejandro_v',
      pulse: '@alejandro_v',
      codeforge: 'alejandrovega',
    },
    stats: {
      nova_followers: 1243,
      nova_following: 387,
      pulse_followers: 892,
      pulse_following: 214,
      stream_subscribers: 156,
    },
  }
}

// =========================================================================
// 2. NOVA POSTS — 1700 feed, 200 user, 45 notifs, 12 trending
// =========================================================================
const NOVA_ALEJANDRO_TOPICS = [
  'Just deployed my new project with Bun and Elysia. The speed is impressive.',
  'Anyone else trying TypeScript 5.4? The type inference improvements are great.',
  'Friday lunch in the Mission. There is no better plan.',
  'Learned something new about WebAssembly today. The future of the browser is exciting.',
  'My current setup: Bun + SolidJS + Elysia. Maximum productivity.',
  'Sharing my experience migrating from Node to Bun in production.',
  'SF fog season has its charm. Coffee and code.',
  'Reading about LLMs and the new era of agents. Fascinating.',
  'New blog post: "Why Rust made me a better TypeScript developer".',
  'Hackathon weekend. Building a CLI tool with Rust.',
  'The open source ecosystem in the Bay Area is growing fast. Proud to be part of it.',
  'Tip of the day: always write tests before refactoring. Your future self will thank you.',
  'Trying the new Anthrotek API. Their model is incredible for pair programming.',
  'Austin has an amazing tech scene. Great community.',
  'Six months using Linux as a daily driver. No going back.',
  'My favorite coffee shop: Blue Bottle in Hayes Valley. Perfect for working.',
  'Updating my homelab. Kubernetes on an ARM board cluster.',
  'The Rust community in the Bay Area is growing fast. Meetup next Thursday.',
  'Reflection: the best code is the one that needs no comments.',
  'Finishing the sprint. This week was productive. Time to rest.',
]

function generateNovaPosts() {
  // Reply text pools for realistic comments
  const novaReplyPool = [
    'This is so true! \u{1F525}',
    'Great thread, thanks for sharing',
    'I had the same experience',
    'What config are you using?',
    'Following for more updates',
    '100% agree on this',
    'Just bookmarked this',
    'Can you share more details?',
    'This is the way \u{1F64C}',
    'Solid advice, saving this for later',
    'Been saying this for months!',
    'The real question is: does it scale?',
    'Super helpful, thanks!',
    'Underrated take honestly',
    'Thread of the week right here',
    'This needs more likes',
    'Exactly my experience migrating last month',
    'Any repo links? Would love to check it out',
  ]

  // ── Thread definitions ──────────────────────────────────────────────────
  const threadDefs = [
    {
      topic: 'bun_migration',
      tweets: [
        'Thread: Our Bun migration journey \u{1F9F5} We just moved our entire backend from Node 20 to Bun 1.1. Here\'s what happened...',
        'Step 1: We ran our test suite on Bun without any changes. 94% passed immediately. The 6% that failed were all node:crypto edge cases. Fix took 2 hours.',
        'Step 2: Performance results. Cold start went from 1.2s to 180ms. Memory usage dropped 40%. HTTP throughput up 3x on our benchmarks.',
        'Step 3: The gotchas. Some npm packages with native bindings needed recompilation. Our Prisma setup needed a small config tweak. Overall: smoother than expected. Would recommend.',
      ],
      tags: ['bun', 'typescript', 'tech'],
    },
    {
      topic: 'macbook_m5',
      tweets: [
        'Thinking about upgrading to the MacBook Pro M5. My M1 is showing its age with Docker + multiple services running. Anyone made the jump yet?',
        'Update: Pulled the trigger on the M5 Pro 36GB. The migration assistant worked flawlessly. First impression: this thing is FAST. Compiling my Rust project went from 45s to 12s.',
        'One week with the M5 MacBook. Battery life is absurd — 14 hours of real dev work. Docker containers spin up instantly. Best dev machine I\'ve ever owned.',
      ],
      tags: ['tech', 'devlife'],
    },
    {
      topic: 'setup_tour',
      tweets: [
        'My 2025 desk setup tour \u{1F3AE} Dual 27" 4K monitors, mechanical keyboard (Keychron Q1), standing desk, and way too many USB-C cables. Thread with details...',
        'The secret weapon: a dedicated Linux server under the desk running my dev environments. I SSH in from the Mac. Best of both worlds — macOS UX + Linux power.',
      ],
      tags: ['setup', 'tech', 'devlife'],
    },
    {
      topic: 'rust_meetup',
      tweets: [
        'Just got back from the Rust SF meetup. 60+ people showed up! Talks on async runtimes and embedded Rust. The community here is incredible \u{1F980}',
        'My favorite talk was about using Rust for WebAssembly plugins. The speaker built a plugin system that hot-reloads WASM modules. Mind blown. Slides coming soon.',
      ],
      tags: ['rust', 'sf', 'opensource'],
    },
    {
      topic: 'ai_agents',
      tweets: [
        'Hot take: AI coding agents are going to change how we think about software architecture. Not because they write code — but because they force us to write clearer specs.',
        'I\'ve been experimenting with agent workflows for the past month. The key insight: agents work best when your codebase has strong types and good abstractions. Spaghetti code = confused agents.',
        'Prediction: In 2 years, every serious dev tool will have an agent mode. The ones that win will be the ones that give agents the best context, not the fanciest UI.',
      ],
      tags: ['ai', 'tech', 'devlife'],
    },
  ]

  // ── Alejandro's 200 posts ──────────────────────────────────────────────
  const userPosts = Array.from({ length: 200 }, (_, i) => {
    const d = faker.number.float({ min: 0, max: 180 })
    const topic = i < NOVA_ALEJANDRO_TOPICS.length
      ? NOVA_ALEJANDRO_TOPICS[i]
      : NOVA_ALEJANDRO_TOPICS[i % NOVA_ALEJANDRO_TOPICS.length].split('.')[0] + '. ' + faker.lorem.sentence()
    const reposts = faker.number.int({ min: 0, max: 45 })
    const replies_count = faker.number.int({ min: 0, max: 80 })
    const post: Record<string, any> = {
      uadp_type: 'uadp:post' as const,
      id: uid('nova:post'),
      ts: tsSecondsAgo(d, 12),
      label: topic.slice(0, 60),
      body: topic,
      author: ALEJANDRO_AUTHOR,
      likes: faker.number.int({ min: 0, max: 320 }),
      reposts,
      replies_count,
      comments_count: replies_count,
      bookmarks: faker.number.int({ min: 0, max: replies_count * 2 }),
      shares: reposts,
      lang: 'en',
      tags: faker.helpers.arrayElements(
        ['tech', 'sf', 'bun', 'typescript', 'rust', 'opensource', 'devlife', 'coffee', 'bayarea'],
        faker.number.int({ min: 1, max: 3 }),
      ),
      ext: { nova: { boost_score: faker.number.float({ min: 0, max: 1 }) } },
    }

    // ~30% of posts get images
    if (faker.datatype.boolean(0.3)) {
      const imageCount = faker.helpers.weightedArrayElement([
        { value: 1, weight: 6 },
        { value: 2, weight: 2 },
        { value: 3, weight: 1 },
        { value: 4, weight: 1 },
      ])
      post.images = Array.from({ length: imageCount }, (_, j) => ({
        url: picsum(`nova_img_${i}_${j}`, 800, 600),
        width: 800,
        height: 600,
      }))
    }

    return post
  })

  // ── Thread chains ───────────────────────────────────────────────────────
  const threadPosts: Record<string, any>[] = []
  for (const def of threadDefs) {
    const firstId = uid('nova:thread')
    const baseDays = faker.number.float({ min: 5, max: 120 })
    def.tweets.forEach((body, idx) => {
      const post: Record<string, any> = {
        uadp_type: 'uadp:post' as const,
        id: idx === 0 ? firstId : uid('nova:post'),
        ts: tsSecondsAgo(baseDays, 0) + idx * 120, // 2 min apart
        label: body.slice(0, 60),
        body,
        author: ALEJANDRO_AUTHOR,
        likes: faker.number.int({ min: 20, max: 500 }),
        reposts: faker.number.int({ min: 5, max: 100 }),
        replies_count: faker.number.int({ min: 5, max: 120 }),
        comments_count: faker.number.int({ min: 5, max: 120 }),
        bookmarks: faker.number.int({ min: 10, max: 200 }),
        shares: faker.number.int({ min: 5, max: 100 }),
        lang: 'en',
        tags: def.tags,
        thread_id: firstId,
        ext: { nova: { boost_score: faker.number.float({ min: 0.5, max: 1 }) } },
      }
      if (idx > 0) {
        post.reply_to = firstId
      }
      threadPosts.push(post)
    })
  }

  // Insert thread posts into user posts
  userPosts.push(...threadPosts)

  // ── Add replies from others to ~20% of popular posts ────────────────────
  for (const post of userPosts) {
    if (post.replies_count > 20 && faker.datatype.boolean(0.2)) {
      const replyCount = faker.number.int({ min: 2, max: 5 })
      post.replies = Array.from({ length: replyCount }, () => ({
        id: uid('nova:reply'),
        body: faker.helpers.arrayElement(novaReplyPool),
        author: faker.helpers.arrayElement(FORTY_AUTHORS),
        ts: post.ts + faker.number.int({ min: 60, max: 86400 }),
        likes: faker.number.int({ min: 0, max: 50 }),
      }))
    }
  }

  // Sort by timestamp descending
  userPosts.sort((a, b) => b.ts - a.ts)

  // 1700 feed posts from other authors
  const feedTopics = [
    'New JS framework release number 9000 this week.',
    'Anyone know good coworkings in SoMa?',
    'My unpopular opinion: GraphQL is overrated for most projects.',
    'AI is not going to replace programmers. It will replace programmers who don\'t use AI.',
    'Tips for interviewing at FAANG companies as a startup dev.',
    'Remote work salaries keep climbing for senior devs.',
    'Quick recipe: homemade sourdough bread. Thread.',
    'Live streaming: building a REST API from scratch with Bun.',
    'Public transit in SF needs a better app. Who\'s in?',
    'Dev community in Austin. Meetup was a success.',
    'Just finished my first Rust project. The learning curve was worth it.',
    'Anyone using Nix as a package manager? Recommendations?',
    'The new version of SolidJS is out. Faster every time.',
    'Friday working from home with artisan coffee. Who can relate?',
    'My startup just closed a seed round. Excited for what\'s coming.',
  ]

  const feed = Array.from({ length: 1700 }, (_, i) => {
    const author = faker.helpers.arrayElement(FORTY_AUTHORS)
    const d = faker.number.float({ min: 0, max: 180 })
    const body = i < feedTopics.length
      ? feedTopics[i]
      : faker.lorem.sentences({ min: 1, max: 3 })
    const reposts = faker.number.int({ min: 0, max: 800 })
    const replies_count = faker.number.int({ min: 0, max: 200 })
    return {
      uadp_type: 'uadp:post' as const,
      id: uid('nova:post'),
      ts: tsSecondsAgo(d, 12),
      label: body.slice(0, 60),
      body,
      author,
      likes: faker.number.int({ min: 0, max: 5000 }),
      reposts,
      replies_count,
      comments_count: replies_count,
      bookmarks: faker.number.int({ min: 0, max: replies_count * 2 }),
      shares: reposts,
      lang: 'en',
      tags: faker.helpers.arrayElements(
        ['tech', 'bayarea', 'dev', 'life', 'startup', 'fintech', 'design', 'ai'],
        faker.number.int({ min: 0, max: 3 }),
      ),
      ext: { nova: { boost_score: faker.number.float({ min: 0, max: 1 }) } },
    }
  })

  // 45 notifications: likes, replies, follows, mentions
  const notifTypes = ['like', 'reply', 'follow', 'mention'] as const
  const notifications = Array.from({ length: 45 }, (_, i) => {
    const type = faker.helpers.arrayElement(notifTypes)
    const actor = faker.helpers.arrayElement(FORTY_AUTHORS)
    const messages: Record<string, string> = {
      like: `${actor.name} liked your post`,
      reply: `${actor.name} replied to your post`,
      follow: `${actor.name} started following you`,
      mention: `${actor.name} mentioned you in a post`,
    }
    return {
      uadp_type: 'uadp:notification' as const,
      id: uid('nova:notif'),
      ts: tsSecondsAgo(faker.number.float({ min: 0, max: 30 }), 6),
      type,
      message: messages[type],
      read: i > 8,
      actor,
      target_id: type !== 'follow' ? uid('nova:post') : undefined,
    }
  })

  // 12 trending topics
  const trending = [
    { tag: '#TypeScript5', post_count: 24500, description: 'New TypeScript release' },
    { tag: '#BunJS', post_count: 18300, description: 'Bun keeps growing in adoption' },
    { tag: '#TechTwitter', post_count: 45000, description: 'Tech discussions trending worldwide' },
    { tag: '#SanFrancisco', post_count: 32000, description: 'Trending in San Francisco' },
    { tag: '#RustLang', post_count: 12800, description: 'Rust 2024 edition announced' },
    { tag: '#OpenSource', post_count: 9400, description: 'Open source contributions hit record highs' },
    { tag: '#RemoteWork', post_count: 67000, description: 'Remote work trends and tips' },
    { tag: '#StartupLife', post_count: 11200, description: 'Startup culture and founder stories' },
    { tag: '#GenAI', post_count: 38000, description: 'Advances in artificial intelligence' },
    { tag: '#Startups', post_count: 15600, description: 'Record VC investments in Q1 2026' },
    { tag: '#DevOps', post_count: 8900, description: 'CI/CD best practices' },
    { tag: '#WebDev', post_count: 21300, description: 'Web development trends 2025' },
  ]

  return { feed, user_posts: userPosts, notifications, trending }
}

// =========================================================================
// 3. PULSE PHOTOS — 480 feed, 80 user, 15 stories, 60 explore
// =========================================================================
function generatePulsePhotos() {
  const captionPool = [
    'Sunset from the rooftop in Mission District',
    'New desk setup complete',
    'Specialty coffee at Blue Bottle',
    'View from Twin Peaks',
    'Best burrito in the Mission, hands down',
    'Code and coffee, the perfect combo',
    'Walking through Golden Gate Park on Sunday',
    'My monstera plant finally grew a new leaf',
    'Craft beer night with the team',
    'Street art in the Mission',
    'Fog rolling into the Bay',
    'My minimalist desk for coding',
    'Brunch at a cafe in Hayes Valley',
    'Dolores Park in fall, the colors are incredible',
    'Cooking pasta on a Sunday with the family',
  ]

  // TikTok/Reel-style captions for Alejandro's video posts
  const videoCaptionPool = [
    'POV: deploying to production on a Friday \u{1F480} #devlife',
    'My morning coding routine \u2014 coffee, lofi, and vim #developer',
    'This desk setup is *chef\'s kiss* #setup #tech',
    'How I went from 0 to 10K followers as a dev creator #growth',
    'The face when your PR gets approved first try \u{1F389}',
    'Day in the life of a San Francisco developer #sf #tech',
    'Satisfying terminal animations #coding #aesthetic',
  ]

  // Comment pool for Pulse
  const pulseCommentPool = [
    '\u{1F525}\u{1F525}\u{1F525}',
    'This is amazing!',
    'Love this vibe',
    'Where is this?',
    'Goals \u{1F60D}',
    'Need this in my life',
    'So aesthetic',
    'Tutorial please!',
    'Song name?',
    'POV: perfect day',
    'This is everything',
    'Following! \u{1F64C}',
  ]

  // Helper to build a Pulse post with media_type
  function buildPulsePost(i: number, caption: string, author: typeof ALEJANDRO_AUTHOR, seedPrefix: string, isAlejandro: boolean) {
    const id = uid('pulse:post')
    const likes = faker.number.int({ min: isAlejandro ? 5 : 10, max: isAlejandro ? 450 : 8000 })
    const reposts = faker.number.int({ min: 0, max: isAlejandro ? 30 : 500 })
    const replies_count = faker.number.int({ min: 0, max: isAlejandro ? 60 : 150 })

    // Determine media type: 60% image, 30% video, 10% carousel
    const roll = faker.number.float({ min: 0, max: 1 })
    let mediaType: 'image' | 'video' | 'carousel'
    if (roll < 0.6) mediaType = 'image'
    else if (roll < 0.9) mediaType = 'video'
    else mediaType = 'carousel'

    const post: Record<string, any> = {
      uadp_type: 'uadp:media_post' as const,
      id,
      ts: isAlejandro ? tsSecondsAgo(faker.number.float({ min: 0, max: 180 }), 8) : tsRandom(180),
      label: caption.slice(0, 50),
      body: caption,
      author,
      likes,
      reposts,
      replies_count,
      saves: faker.number.int({ min: 0, max: likes }),
      lang: 'en',
      tags: faker.helpers.arrayElements(
        isAlejandro
          ? ['sf', 'coffee', 'dev', 'setup', 'food', 'travel', 'nature', 'code']
          : ['photo', 'life', 'art', 'food', 'travel', 'fashion', 'music', 'nature'],
        faker.number.int({ min: 1, max: 3 }),
      ),
      media_type: mediaType,
    }

    if (mediaType === 'video') {
      post.media_url = picsum(`${seedPrefix}_${i}`, 1080, 1920)
      post.thumbnail_url = picsum(`${seedPrefix}_${i}`, 300, 533)
      post.video_url = picsum(`pulse_vid_${i}`, 1080, 1920)
      post.duration_seconds = faker.number.int({ min: 15, max: 180 })
      post.aspect_ratio = '9:16'
      post.views = faker.number.int({ min: 100, max: 5_000_000 })
    } else if (mediaType === 'carousel') {
      const itemCount = faker.number.int({ min: 2, max: 6 })
      post.media_url = picsum(`${seedPrefix}_${i}`, 1080, 1080)
      post.thumbnail_url = picsum(`${seedPrefix}_${i}`, 300, 300)
      post.media_items = Array.from({ length: itemCount }, (_, j) => ({
        url: picsum(`pulse_carousel_${i}_${j}`, 1080, 1080),
        type: 'image' as const,
      }))
      post.aspect_ratio = '1:1'
    } else {
      // image
      const ar = faker.helpers.arrayElement(['1:1', '1:1', '1:1', '4:5'])
      post.media_url = picsum(`${seedPrefix}_${i}`, 1080, ar === '4:5' ? 1350 : 1080)
      post.thumbnail_url = picsum(`${seedPrefix}_${i}`, 300, ar === '4:5' ? 375 : 300)
      post.aspect_ratio = ar
    }

    return post
  }

  // Alejandro's 80 media posts
  const userPosts = Array.from({ length: 80 }, (_, i) => {
    // Use video captions for video-type posts at the beginning
    let caption: string
    if (i < captionPool.length) {
      caption = captionPool[i]
    } else if (i < captionPool.length + videoCaptionPool.length) {
      caption = videoCaptionPool[i - captionPool.length]
    } else {
      caption = faker.lorem.sentence()
    }
    return buildPulsePost(i, caption, ALEJANDRO_AUTHOR, 'pulse_ale', true)
  })

  // Force first 7 video-caption posts to be video type
  for (let i = captionPool.length; i < captionPool.length + videoCaptionPool.length && i < userPosts.length; i++) {
    const post = userPosts[i]
    post.media_type = 'video'
    post.video_url = picsum(`pulse_vid_ale_${i}`, 1080, 1920)
    post.duration_seconds = faker.number.int({ min: 15, max: 180 })
    post.aspect_ratio = '9:16'
    post.views = faker.number.int({ min: 500, max: 500_000 })
    post.media_url = picsum(`pulse_ale_${i}`, 1080, 1920)
    post.thumbnail_url = picsum(`pulse_ale_${i}`, 300, 533)
  }

  // 520 feed posts from others
  const feed = Array.from({ length: 520 }, (_, i) => {
    const author = faker.helpers.arrayElement(FORTY_AUTHORS)
    const caption = faker.lorem.sentence()
    return buildPulsePost(i, caption, author, 'pulse_feed', false)
  })

  // ── Add comments to ~30% of popular posts ───────────────────────────────
  const allPulsePosts = [...userPosts, ...feed]
  for (const post of allPulsePosts) {
    if (post.replies_count > 15 && faker.datatype.boolean(0.3)) {
      const commentCount = faker.number.int({ min: 2, max: 6 })
      post.comments = Array.from({ length: commentCount }, () => ({
        id: uid('pulse:comment'),
        body: faker.helpers.arrayElement(pulseCommentPool),
        author: faker.helpers.arrayElement(FORTY_AUTHORS),
        ts: post.ts + faker.number.int({ min: 60, max: 172800 }),
        likes: faker.number.int({ min: 0, max: 100 }),
      }))
    }
  }

  // 15 stories with expiration timestamps
  const stories = Array.from({ length: 15 }, (_, i) => {
    const author = i < 3 ? ALEJANDRO_AUTHOR : faker.helpers.arrayElement(FORTY_AUTHORS)
    const storyId = uid('pulse:story')
    const hoursAgo = faker.number.int({ min: 1, max: 23 })
    const tsVal = Math.floor(NOW / 1000) - hoursAgo * 3600
    return {
      uadp_type: 'uadp:story' as const,
      id: storyId,
      author,
      media_url: picsum(`story_${i}`, 1080, 1920),
      ts: tsVal,
      expires_ts: tsVal + 86400, // 24h expiration
      viewed: i > 5,
    }
  })

  // 60 explore posts — curated subset
  const explore = faker.helpers.arrayElements([...feed, ...userPosts], 60).map(p => ({ ...p }))

  return { feed, user_posts: userPosts, stories, explore }
}

// =========================================================================
// 4. ORBIT TRANSACTIONS — checking ~5200, savings ~15000, 500 tx, 1 debit
// =========================================================================

// We will store Market order data here so Orbit can reference it
let MARKET_ORDER_CHARGES: { ts: number; amount: number; label: string }[] = []

function generateOrbitTransactions() {
  const accounts = [
    {
      uadp_type: 'uadp:account',
      id: 'orbit:acc:checking',
      label: 'Checking Account',
      type: 'checking',
      balance: { value: 5200, currency: 'USD' },
      currency: 'USD',
    },
    {
      uadp_type: 'uadp:account',
      id: 'orbit:acc:savings',
      label: 'Savings',
      type: 'savings',
      balance: { value: 15000, currency: 'USD' },
      currency: 'USD',
    },
  ]

  const cards = [
    {
      uadp_type: 'uadp:card',
      id: 'orbit:card:debit',
      label: 'Orbit Debit Card',
      type: 'debit',
      last_four: '4823',
      account_id: 'orbit:acc:checking',
      network: 'Visa',
      status: 'active',
    },
  ]

  // Build transactions over 90 days
  const transactions: any[] = []
  let runningBalance = 6000 // starting balance 90 days ago

  // -- Salary: 4,800 USD on 1st and 15th --
  for (let d = 90; d >= 0; d--) {
    const date = new Date(NOW - d * ONE_DAY_MS)
    const day = date.getDate()

    if (day === 1 || day === 15) {
      runningBalance += 4800
      transactions.push({
        uadp_type: 'uadp:transaction',
        id: uid('orbit:tx'),
        ts: tsSecondsAgo(d, 2),
        label: 'Payroll - TechCorp',
        amount: { value: 4800, currency: 'USD' },
        direction: 'in',
        status: 'completed',
        merchant: { name: 'TechCorp', category: 'salary', city: 'San Francisco', country: 'US' },
        balance_after: { value: roundUSD(runningBalance), currency: 'USD' },
        account_id: 'orbit:acc:checking',
      })
    }
  }

  // -- Recurring monthly: rent ~1800, streaming ~13, gym, telecom --
  const recurringExpenses = [
    { name: 'Rent - Mission District Apt', category: 'housing', amount: 1800 },
    { name: 'StreamPlus', category: 'entertainment', amount: 12.99 },
    { name: 'MelodyWave', category: 'entertainment', amount: 9.99 },
    { name: 'GymFit Downtown', category: 'fitness', amount: 49.99 },
    { name: 'MobileX Unlimited Plan', category: 'telecom', amount: 35 },
    { name: 'FibraMax Internet', category: 'telecom', amount: 45 },
  ]

  for (let month = 0; month < 3; month++) {
    for (const exp of recurringExpenses) {
      const d = 5 + month * 30 + faker.number.int({ min: 0, max: 3 })
      if (d > 90) continue
      runningBalance -= exp.amount
      transactions.push({
        uadp_type: 'uadp:transaction',
        id: uid('orbit:tx'),
        ts: tsSecondsAgo(d, 4),
        label: exp.name,
        amount: { value: exp.amount, currency: 'USD' },
        direction: 'out',
        status: 'completed',
        merchant: { name: exp.name, category: exp.category, city: 'San Francisco', country: 'US' },
        balance_after: { value: roundUSD(runningBalance), currency: 'USD' },
        account_id: 'orbit:acc:checking',
      })
    }
  }

  // -- Weekly grocery ~110 --
  for (let week = 0; week < 13; week++) {
    const d = week * 7 + faker.number.int({ min: 0, max: 2 })
    if (d > 90) continue
    const amount = roundUSD(faker.number.float({ min: 80, max: 150 }))
    runningBalance -= amount
    transactions.push({
      uadp_type: 'uadp:transaction',
      id: uid('orbit:tx'),
      ts: tsSecondsAgo(d, 6),
      label: pickBrand('grocery'),
      amount: { value: amount, currency: 'USD' },
      direction: 'out',
      status: 'completed',
      merchant: { name: pickBrand('grocery'), category: 'groceries', city: 'San Francisco', country: 'US' },
      balance_after: { value: roundUSD(runningBalance), currency: 'USD' },
      account_id: 'orbit:acc:checking',
    })
  }

  // -- Coffee ~6 USD (several times per week) --
  for (let i = 0; i < 30; i++) {
    const d = faker.number.float({ min: 0, max: 90 })
    const amount = roundUSD(faker.number.float({ min: 4, max: 8 }))
    runningBalance -= amount
    transactions.push({
      uadp_type: 'uadp:transaction',
      id: uid('orbit:tx'),
      ts: tsSecondsAgo(d, 10),
      label: pickBrand('coffee'),
      amount: { value: amount, currency: 'USD' },
      direction: 'out',
      status: 'completed',
      merchant: { name: pickBrand('coffee'), category: 'food_drink', city: 'San Francisco', country: 'US' },
      balance_after: { value: roundUSD(runningBalance), currency: 'USD' },
      account_id: 'orbit:acc:checking',
    })
  }

  // -- Gas --
  for (let i = 0; i < 6; i++) {
    const amount = roundUSD(faker.number.float({ min: 40, max: 80 }))
    const d = faker.number.int({ min: 1, max: 85 })
    runningBalance -= amount
    transactions.push({
      uadp_type: 'uadp:transaction',
      id: uid('orbit:tx'),
      ts: tsSecondsAgo(d, 6),
      label: pickBrand('gas'),
      amount: { value: amount, currency: 'USD' },
      direction: 'out',
      status: 'completed',
      merchant: { name: pickBrand('gas'), category: 'gas', city: 'San Francisco', country: 'US' },
      balance_after: { value: roundUSD(runningBalance), currency: 'USD' },
      account_id: 'orbit:acc:checking',
    })
  }

  // -- Market order charges will be injected by cross-reference later --

  // -- Variable expenses to fill up to 180 total --
  const variableCategories: { brands: keyof typeof BRANDS; category: string; min: number; max: number }[] = [
    { brands: 'restaurant', category: 'food_drink', min: 15, max: 80 },
    { brands: 'convenience', category: 'convenience', min: 5, max: 35 },
    { brands: 'transport', category: 'transport', min: 5, max: 30 },
    { brands: 'electronics', category: 'electronics', min: 50, max: 500 },
    { brands: 'clothing', category: 'clothing', min: 30, max: 250 },
    { brands: 'pharmacy', category: 'health', min: 10, max: 80 },
  ]

  const remaining = 500 - transactions.length
  for (let i = 0; i < Math.max(0, remaining); i++) {
    const cat = faker.helpers.arrayElement(variableCategories)
    const brand = pickBrand(cat.brands)
    const amount = roundUSD(faker.number.float({ min: cat.min, max: cat.max }))
    const d = faker.number.float({ min: 0, max: 90 })
    runningBalance -= amount
    transactions.push({
      uadp_type: 'uadp:transaction',
      id: uid('orbit:tx'),
      ts: tsSecondsAgo(d, 10),
      label: brand,
      amount: { value: amount, currency: 'USD' },
      direction: 'out',
      status: faker.helpers.weightedArrayElement([
        { value: 'completed', weight: 0.95 },
        { value: 'pending', weight: 0.04 },
        { value: 'failed', weight: 0.01 },
      ]) as 'completed' | 'pending' | 'failed',
      merchant: { name: brand, category: cat.category, city: 'San Francisco', country: 'US' },
      balance_after: { value: roundUSD(runningBalance), currency: 'USD' },
      account_id: 'orbit:acc:checking',
    })
  }

  // Sort by timestamp descending
  transactions.sort((a, b) => b.ts - a.ts)

  // Adjust final balance to be approximately ~5200 USD
  accounts[0].balance.value = roundUSD(runningBalance > 0 ? runningBalance : 5200)

  return { accounts, transactions, cards }
}

// =========================================================================
// 5. ZINC TRANSACTIONS — USD ~8000, credit 5000, 500 tx, 1 credit card
// =========================================================================
function generateZincTransactions() {
  const accounts = [
    {
      uadp_type: 'uadp:account',
      id: 'zinc:acc:mxn',
      label: 'Zinc Pesos',
      type: 'checking' as const,
      balance: { value: 8000, currency: 'USD' },
      currency: 'USD',
    },
    {
      uadp_type: 'uadp:account',
      id: 'zinc:acc:credit',
      label: 'Zinc International Credit',
      type: 'credit' as const,
      credit_limit: { value: 5000, currency: 'USD' },
      balance_used: { value: 1200, currency: 'USD' },
      currency: 'USD',
    },
  ]

  const cards = [
    {
      uadp_type: 'uadp:card',
      id: 'zinc:card:credit',
      label: 'Zinc Credit Card',
      type: 'credit',
      last_four: '9201',
      account_id: 'zinc:acc:credit',
      network: 'Mastercard',
      status: 'active',
    },
  ]

  // Monthly subscriptions — specific prices as required
  const subscriptions = [
    { name: 'CodeForge Pro', amount: 4.00, category: 'software' },
    { name: 'DesignLab', amount: 12.00, category: 'software' },
    { name: 'CloudSync', amount: 5.00, category: 'software' },
    { name: 'DevTools Pro', amount: 10.00, category: 'software' },
  ]

  const transactions: any[] = []

  // Subscription charges — monthly for ~6 months
  for (let month = 0; month < 6; month++) {
    for (const sub of subscriptions) {
      const d = 3 + month * 30 + faker.number.int({ min: 0, max: 2 })
      if (d > 180) continue
      transactions.push({
        uadp_type: 'uadp:transaction',
        id: uid('zinc:tx'),
        ts: tsSecondsAgo(d, 3),
        label: sub.name,
        amount: { value: sub.amount, currency: 'USD' },
        direction: 'out' as const,
        status: 'completed' as const,
        merchant: { name: sub.name, category: sub.category, country: 'US' },
        account_id: 'zinc:acc:credit',
        ext: {
          cashback: roundUSD(sub.amount * 0.02),
          zinc_points: Math.floor(sub.amount * 3),
          is_subscription: true,
        },
      })
    }
  }

  // Other international purchases to reach 60 total
  const intlMerchants = [
    { name: 'GlobalShop', category: 'shopping', country: 'US', min: 15, max: 200 },
    { name: 'GameVault Store', category: 'gaming', country: 'US', min: 10, max: 70 },
    { name: 'LearnHub', category: 'education', country: 'US', min: 10, max: 90 },
    { name: 'DomainWise', category: 'hosting', country: 'US', min: 8, max: 30 },
    { name: 'CloudNova', category: 'cloud', country: 'US', min: 5, max: 50 },
    { name: 'DeployEdge Pro', category: 'cloud', country: 'US', min: 20, max: 20 },
    { name: 'NotePad Plus', category: 'software', country: 'US', min: 10, max: 10 },
    { name: 'IndieMusic Hub', category: 'music', country: 'US', min: 7, max: 25 },
    { name: 'CraftMarket', category: 'shopping', country: 'US', min: 15, max: 80 },
    { name: 'BookShelf Intl', category: 'books', country: 'UK', min: 10, max: 40 },
  ]

  const remainingTx = 500 - transactions.length
  for (let i = 0; i < remainingTx; i++) {
    const merchant = faker.helpers.arrayElement(intlMerchants)
    const amount = roundUSD(faker.number.float({ min: merchant.min, max: merchant.max }))
    const d = faker.number.float({ min: 0, max: 180 })
    transactions.push({
      uadp_type: 'uadp:transaction',
      id: uid('zinc:tx'),
      ts: tsSecondsAgo(d, 8),
      label: merchant.name,
      amount: { value: amount, currency: 'USD' },
      direction: 'out' as const,
      status: faker.helpers.weightedArrayElement([
        { value: 'completed', weight: 0.92 },
        { value: 'pending', weight: 0.08 },
      ]) as 'completed' | 'pending',
      merchant: { name: merchant.name, category: merchant.category, country: merchant.country },
      account_id: 'zinc:acc:credit',
      ext: {
        cashback: roundUSD(amount * 0.02),
        zinc_points: Math.floor(amount * 3),
        is_subscription: false,
      },
    })
  }

  transactions.sort((a, b) => b.ts - a.ts)

  return { accounts, transactions, cards }
}

// =========================================================================
// 6. MARKET ORDERS — 100 orders, 500 products, 2 cart, 8 wishlist
// =========================================================================
function generateMarketOrders() {
  const productCategories = [
    {
      cat: 'Electronics',
      items: [
        'ProSound Bluetooth Headphones', 'KeyMax Mechanical Keyboard', 'UltraView 27" Monitor',
        'ClickPro Ergonomic Mouse', 'MultiPort USB-C Hub', 'StreamCam HD Webcam',
        'VaultDrive 1TB External SSD', 'PowerPad Wireless Charger',
        'Braided USB-C Cable 2m', 'LumiDesk LED Desk Lamp',
      ],
    },
    {
      cat: 'Home',
      items: [
        'BrewMaster Drip Coffee Maker', 'ChefLine Non-Stick Pan',
        'Premium Towel Set', 'WoodBox Desk Organizer',
        'Artificial Monstera Plant', 'Lavender Scented Candle',
        'BladePro Knife Set', 'DreamSoft Memory Foam Pillow',
        'FlexMat Yoga Mat', 'HydroKeep Insulated Bottle',
      ],
    },
    {
      cat: 'Clothing',
      items: [
        'AlgoPure Basic Tee', 'UrbanFit Hoodie',
        'DenimCo Slim Fit Jeans', 'StepLight Casual Sneakers',
        'CapStyle Snapback Cap', 'RainShield Waterproof Jacket',
        'ComfortWear Socks Pack x6', 'BeltCraft Leather Belt',
        'ShadePro Sunglasses', 'PackIt Urban Backpack',
      ],
    },
    {
      cat: 'Books',
      items: [
        'Clean Code - Special Edition', 'Rust in Action',
        'Modern API Design', 'Advanced TypeScript',
        'The Pragmatic Programmer', 'Real-World Algorithms',
        'Software Architecture', 'DevOps for Agile Teams',
        'Machine Learning with Python', 'History of Computing',
      ],
    },
    {
      cat: 'Food & Beverages',
      items: [
        'Ethiopian Single Origin Coffee 500g GranoOro', 'Artisan Dark Chocolate PuroCacao',
        'Artisanal Hot Sauce', 'Organic Honey',
        'Craft Bourbon 750ml', 'Dried Chili Flakes 200g',
        'NutriMix Premium Granola', 'Ceremonial Matcha Tea 100g',
        'Extra Virgin Olive Oil', 'TostaSnack Mixed Nuts',
      ],
    },
  ]

  // Build 500 products
  const products = productCategories.flatMap(cat =>
    cat.items.map((title, i) => ({
      uadp_type: 'uadp:product' as const,
      id: uid('market:prod'),
      title,
      description: faker.commerce.productDescription(),
      price: {
        value: roundUSD(faker.number.float({ min: 4.99, max: 499.99 })),
        currency: 'USD',
      },
      category: cat.cat,
      image_url: picsum(`prod_${cat.cat}_${i}`, 600, 600),
      rating: roundUSD(faker.number.float({ min: 3.0, max: 5.0 })),
      reviews_count: faker.number.int({ min: 2, max: 2400 }),
    })),
  )

  // Pad to 500
  while (products.length < 500) {
    const cat = faker.helpers.arrayElement(productCategories)
    products.push({
      uadp_type: 'uadp:product',
      id: uid('market:prod'),
      title: `${faker.commerce.productName()} ${faker.string.alphanumeric(3).toUpperCase()}`,
      description: faker.commerce.productDescription(),
      price: {
        value: roundUSD(faker.number.float({ min: 4.99, max: 999.99 })),
        currency: 'USD',
      },
      category: cat.cat,
      image_url: picsum(`prod_extra_${products.length}`, 600, 600),
      rating: roundUSD(faker.number.float({ min: 2.5, max: 5.0 })),
      reviews_count: faker.number.int({ min: 0, max: 3000 }),
    })
  }

  const shippingAddress = {
    name: 'Alejandro Vega',
    street: '245 Valencia St, Apt 8B',
    city: 'San Francisco',
    state: 'CA',
    zip: '94110',
    country: 'US',
  }

  // 100 orders — 1 "shipped" (in transit), rest delivered or other statuses
  const orders = Array.from({ length: 100 }, (_, i) => {
    const numItems = faker.number.int({ min: 1, max: 4 })
    const selectedProducts = faker.helpers.arrayElements(products, numItems)
    const items = selectedProducts.map(p => ({
      product_id: p.id,
      title: p.title,
      qty: faker.number.int({ min: 1, max: 2 }),
      unit_price: p.price,
      image_url: p.image_url,
    }))
    const total = roundUSD(items.reduce((s, it) => s + it.unit_price.value * it.qty, 0))
    const d = faker.number.float({ min: 1, max: 180 })

    // First order is always "shipped" (in transit), rest are weighted
    let status: string
    if (i === 0) {
      status = 'shipped'
    } else {
      status = faker.helpers.weightedArrayElement([
        { value: 'delivered', weight: 0.75 },
        { value: 'pending', weight: 0.15 },
        { value: 'cancelled', weight: 0.10 },
      ])
    }

    const orderTs = tsSecondsAgo(d, 4)

    // Store for cross-reference with Orbit
    if (status !== 'cancelled') {
      MARKET_ORDER_CHARGES.push({ ts: orderTs, amount: total, label: `MercadoMart - Order #${1000 + i}` })
    }

    return {
      uadp_type: 'uadp:order' as const,
      id: uid('market:order'),
      ts: orderTs,
      label: `Order #${1000 + i}`,
      status,
      total: { value: total, currency: 'USD' },
      items,
      shipping_address: shippingAddress,
      tracking_number: status === 'shipped' ? `TRK${faker.string.alphanumeric(12).toUpperCase()}` : undefined,
    }
  })

  // Cart — 2 items
  const cartProducts = faker.helpers.arrayElements(products, 2)
  const cart = {
    items: cartProducts.map(p => ({
      product_id: p.id,
      title: p.title,
      qty: 1,
      unit_price: p.price,
      image_url: p.image_url,
    })),
  }

  // Wishlist — 8 items
  const wishlistProducts = faker.helpers.arrayElements(products, 8)
  const wishlist = wishlistProducts.map(p => ({
    product_id: p.id,
    title: p.title,
    price: p.price,
    image_url: p.image_url,
    added_ts: tsRandom(60),
  }))

  return { orders, products, cart, wishlist }
}

// =========================================================================
// 7. STREAM HISTORY — 300 feed, 250 history, 40 subs, 3 user videos
// =========================================================================
function generateStreamHistory() {
  const channelNames = [
    'Easy Code', 'DevTalks', 'Tech Explained', 'Rust for Everyone',
    'Frontend Masters', 'Linux and More', 'Data Science', 'Gaming Central',
    'Easy Cooking', 'Pop Science', 'Lofi Music', 'Travel Vlogs',
    'Home Fitness', 'Simple Economics', 'Digital Design', 'AI Explained',
    'Bun Tutorial', 'Podcast Dev', 'Retro Gaming', 'Crypto Analysis',
    'Math Visualized', 'Music Production', 'Bike Mechanic', 'Solar Punk',
    'Space News Daily', 'Chef at Home', 'Urban Gardening', 'Drone Footage',
    'History Uncovered', 'DIY Electronics', 'Mindful Meditation', 'Street Art',
    'Typography Talk', 'Rust Crab', 'TypeScript Tips', 'Go Gopher',
    'Python Tricks', 'Java Brew', 'C++ Deep Dive', 'Kotlin Daily',
  ]

  const channels = channelNames.map((name, i) => ({
    id: uid('stream:ch'),
    name,
    subscribers: faker.number.int({ min: 500, max: 2_000_000 }),
    avatar_url: picsum(`ch_${i}`, 100, 100),
  }))

  const videoTitles = [
    'Tutorial: Building an API with Bun and Elysia',
    'Rust vs Go in 2025: Which to choose?',
    'Minimalist dev setup for productivity',
    'Deploying to the cloud on a $0 budget',
    'The 10 VS Code extensions I use daily',
    'Introduction to WebAssembly for web developers',
    'My experience as a remote dev in San Francisco',
    'Building a CLI tool from scratch with TypeScript',
    'Containers and orchestration explained in 15 minutes',
    'Review: the best headphones for coding',
    'Solving LeetCode problems live',
    'How to contribute to open source as a beginner',
    'Linux tips every developer needs',
    'Automating my homelab with scripts',
    'Understanding async/await in depth',
    'MacBook Pro M5 review: is it worth the upgrade?',
    'iPhone 17 Pro: developer features you need to know',
    'iPad as a portable dev machine — full setup guide',
    'Building a news aggregator with AI in 30 minutes',
    'My $3000 home server build for development',
    'Neovim vs VS Code: the ultimate comparison',
    'Docker Compose for local development — full tutorial',
    'GraphQL vs REST: when to use which',
    'The complete guide to SSH keys and GPG signing',
    'How I automate my entire workflow with scripts',
    'PostgreSQL tips for backend developers',
    'Redis caching patterns that actually work',
    'Building real-time features with WebSockets',
    'CI/CD pipeline from scratch with GitHub Actions',
    'Monitoring your app with Prometheus and Grafana',
    'Tailwind CSS: love it or hate it?',
    'React Server Components explained simply',
    'SolidJS: the React killer?',
    'Svelte 5 runes: a game changer',
    'Next.js vs Remix vs Astro — framework showdown',
    'Mobile dev with React Native in 2025',
    'Flutter vs Swift: cross-platform or native?',
    'Kubernetes for small teams — is it worth it?',
    'The truth about microservices architecture',
    'Event-driven architecture with Kafka',
    'Machine learning for web developers — crash course',
    'Building an AI chatbot from scratch',
    'Computer science basics you should know',
    'Data structures explained with animations',
    'System design interview prep — live walkthrough',
    'How DNS actually works — deep dive',
    'TLS/SSL explained: securing your connections',
    'OAuth 2.0 and OpenID Connect demystified',
    'Best mechanical keyboards for developers 2025',
    'Standing desk review after 1 year of use',
  ]

  // Pool of real, embeddable YouTube IDs (dev/tech content).
  // Thumbnails and playback will pull from YouTube CDN directly.
  const REAL_YT_IDS = [
    'dQw4w9WgXcQ', 'zQnBQ4tB3ZA', 'pTB0EiLXUC8', 'TlB_eWDSMt4', 'Tn6-PIqc4UM',
    'zOjov-2OZ0E', 'qombFJDSBR0', 'lIFE7h3m40U', 'z1rdIIEcA4c', 'DHvZLI7Db8E',
    '8jLOx1hD3_o', 'ZRCdORJiUgU', 'WTLPmUHTPqo', '6c0gpm9uAwQ', 'oI1b8eM9up8',
    'l6Q-CnL0jh4', 'uNjxe8ShM-8', 'mTa2d3OLXhg', 'YQHsXMglC9A', 'JGwWNGJdvx8',
    'kXYiU_JCYtU', 'NBcqPvAAPRM', 'L_LUpnjgPso', '3tmd-ClpJxA', 'fRh_vgS2dFE',
    'RgKAFK5djSk', 'OPf0YbXqDm0', 'CevxZvSJLk8', 'hT_nvWreIhg', 'JGwWNGJdvx8',
  ]
  let ytCursor = 0
  const nextYt = () => REAL_YT_IDS[(ytCursor++) % REAL_YT_IDS.length]

  function makeVideo(channelOverride?: typeof channels[0], daysRange = 180) {
    const channel = channelOverride || faker.helpers.arrayElement(channels)
    const ytId = nextYt()
    const vidId = `stream:vid:${ytId}`
    return {
      uadp_type: 'uadp:video' as const,
      id: vidId,
      ts: tsRandom(daysRange),
      label: faker.helpers.arrayElement(videoTitles),
      title: faker.helpers.arrayElement(videoTitles),
      description: faker.lorem.paragraph(),
      channel: { id: channel.id, name: channel.name, subscribers: channel.subscribers },
      duration_seconds: faker.number.int({ min: 120, max: 7200 }),
      views: faker.number.int({ min: 100, max: 5_000_000 }),
      likes: faker.number.int({ min: 10, max: 200_000 }),
      thumbnail_url: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
      youtube_url: `https://www.youtube.com/watch?v=${ytId}`,
      tags: faker.helpers.arrayElements(
        ['tutorial', 'dev', 'tech', 'rust', 'bun', 'typescript', 'linux', 'review', 'ai', 'web'],
        faker.number.int({ min: 1, max: 4 }),
      ),
    }
  }

  // 300 feed videos
  const feed = Array.from({ length: 300 }, () => makeVideo())

  // 250 history entries (watched videos)
  const history = Array.from({ length: 250 }, () => {
    const vid = makeVideo(undefined, 180)
    return {
      ...vid,
      watched_seconds: faker.number.int({ min: 30, max: vid.duration_seconds }),
      watched_at: tsRandom(90),
    }
  })

  // Alejandro's channel: "Codigo con Alejandro"
  const alejandroChannel = {
    id: 'stream:ch:alejandro',
    name: 'Code with Alejandro',
    subscribers: 156,
    avatar_url: ALEJANDRO.avatar_url,
  }

  const aleYt1 = nextYt(), aleYt2 = nextYt(), aleYt3 = nextYt()
  const userVideos = [
    {
      uadp_type: 'uadp:video' as const,
      id: `stream:vid:${aleYt1}`,
      ts: tsSecondsAgo(45, 2),
      label: 'My 2025 dev setup — Full tour',
      title: 'My 2025 dev setup — Full tour',
      description: 'I show you my complete full-stack development setup. Includes hardware, software, and my homelab configuration.',
      channel: alejandroChannel,
      duration_seconds: 1245,
      views: 3420,
      likes: 287,
      thumbnail_url: `https://i.ytimg.com/vi/${aleYt1}/hqdefault.jpg`,
      youtube_url: `https://www.youtube.com/watch?v=${aleYt1}`,
      tags: ['setup', 'dev', 'tutorial'],
    },
    {
      uadp_type: 'uadp:video' as const,
      id: `stream:vid:${aleYt2}`,
      ts: tsSecondsAgo(90, 2),
      label: 'Migrating from Node to Bun in production — What I learned',
      title: 'Migrating from Node to Bun in production — What I learned',
      description: 'I share my experience migrating a microservice from Node.js to Bun. Benchmarks, issues, and solutions.',
      channel: alejandroChannel,
      duration_seconds: 1830,
      views: 8910,
      likes: 645,
      thumbnail_url: `https://i.ytimg.com/vi/${aleYt2}/hqdefault.jpg`,
      youtube_url: `https://www.youtube.com/watch?v=${aleYt2}`,
      tags: ['bun', 'nodejs', 'tutorial', 'migration'],
    },
    {
      uadp_type: 'uadp:video' as const,
      id: `stream:vid:${aleYt3}`,
      ts: tsSecondsAgo(150, 2),
      label: 'Building a real-time chat with Elysia WebSockets',
      title: 'Building a real-time chat with Elysia WebSockets',
      description: 'Step-by-step tutorial to create a real-time chat using Elysia and WebSockets with Bun.',
      channel: alejandroChannel,
      duration_seconds: 2460,
      views: 5230,
      likes: 412,
      thumbnail_url: `https://i.ytimg.com/vi/${aleYt3}/hqdefault.jpg`,
      youtube_url: `https://www.youtube.com/watch?v=${aleYt3}`,
      tags: ['elysia', 'websockets', 'tutorial', 'bun'],
    },
  ]

  // 18 subscriptions
  const subscriptions = channels.map(ch => ({
    uadp_type: 'uadp:subscription' as const,
    channel_id: ch.id,
    channel_name: ch.name,
    channel_avatar: ch.avatar_url,
    subscribers: ch.subscribers,
    subscribed_at: tsRandom(365),
    notifications_enabled: faker.datatype.boolean(0.6),
  }))

  return { feed, history, subscriptions, user_videos: userVideos }
}

// =========================================================================
// 8. ECHO CONVERSATIONS — 12 convos, ~1000 messages
// =========================================================================
function generateEchoConversations() {
  // Family: Mom Rosa, Dad Carlos, sister Diana
  const contacts = {
    mama_rosa: { id: 'user:rosa_vega', name: 'Rosa Vega' },
    papa_carlos: { id: 'user:carlos_vega', name: 'Carlos Vega' },
    hermana_diana: { id: 'user:diana_vega', name: 'Diana Vega' },
    // Work devs (5 coworkers)
    daniel: { id: 'user:daniel_mora', name: 'Daniel Mora' },
    lucia: { id: 'user:lucia_reyes', name: 'Lucia Reyes' },
    pablo: { id: 'user:pablo_herrera', name: 'Pablo Herrera' },
    mariana: { id: 'user:mariana_torres', name: 'Mariana Torres' },
    ivan: { id: 'user:ivan_lopez', name: 'Ivan Lopez' },
    // Friends SF (4 friends)
    camila: { id: 'user:camila_ruiz', name: 'Camila Ruiz' },
    andres: { id: 'user:andres_silva', name: 'Andres Silva' },
    fernanda: { id: 'user:fernanda_diaz', name: 'Fernanda Diaz' },
    rodrigo: { id: 'user:rodrigo_mendez', name: 'Rodrigo Mendez' },
  }

  const ale = { id: ALEJANDRO.id, name: ALEJANDRO.name }

  interface ConvDef {
    type: 'group' | 'direct'
    name: string
    members: { id: string; name: string }[]
    msgCount: number
    topicPool: string[]
  }

  const convDefs: ConvDef[] = [
    // Group: Vega Family (Mom Rosa, Dad Carlos, sister Diana)
    {
      type: 'group',
      name: 'Vega Family',
      members: [ale, contacts.mama_rosa, contacts.papa_carlos, contacts.hermana_diana],
      msgCount: 150,
      topicPool: [
        'Who\'s coming for Sunday lunch?',
        'Mom, I need the lasagna recipe',
        'Happy birthday Diana!',
        'Can someone pick up grandma?',
        'Sending you the photos from the get-together',
        'Just got home',
        'What are we having for dinner?',
        'Diana, can I borrow your car tomorrow?',
        'Dad says the grill is ready',
        'See you at 3 at mom\'s house',
        'Kids, food is ready',
        'Alejandro, don\'t forget the cake',
        'Already picked up groceries',
        'What time is brunch?',
        'Mom, I already sent the utility money',
        'Don\'t forget to call your uncle',
        'I made empanadas, come get some',
        'Dad\'s birthday is next week, any gift ideas?',
        'The wifi at mom\'s house is down again',
        'Diana, did you take my charger?',
        'Family photo turned out great!',
        'Who left their jacket here?',
        'Movie night this Friday at my place?',
        'The plumber is coming tomorrow morning',
        'Sending the grocery list for Sunday',
      ],
    },
    // Group: Work Devs (5 coworkers)
    {
      type: 'group',
      name: 'Work Devs',
      members: [ale, contacts.daniel, contacts.lucia, contacts.pablo, contacts.mariana, contacts.ivan],
      msgCount: 200,
      topicPool: [
        'Staging deploy failed, anyone looking into it?',
        'PR ready for review',
        'Sprint meeting in 10 min',
        'Found a bug in the payments module',
        'Anyone have access to the production dashboard?',
        'Merged the feature/auth branch',
        'Client wants changes in the API',
        'TypeScript strict mode saved us again',
        'Who can code review my PR?',
        'Bun is 3x faster than Node for this task',
        'Need help with integration tests',
        'The hotfix is up',
        'Anyone tested the new endpoint?',
        'Database took 3 seconds to respond',
        'Coffee run to Blue Bottle?',
      ],
    },
    // Group: SF Friends (4 friends)
    {
      type: 'group',
      name: 'SF Friends',
      members: [ale, contacts.camila, contacts.andres, contacts.fernanda, contacts.rodrigo],
      msgCount: 150,
      topicPool: [
        'Anyone down for lunch today?',
        'There\'s a concert at the Fillmore on Saturday',
        'Wanna get together to watch the game?',
        'New bar in the Mission, it\'s amazing',
        'Who\'s in for hiking at Lands End?',
        'Have you seen the new movie at CinemaGo?',
        'BBQ on Sunday at my place',
        'Anyone have a dentist recommendation?',
        'See you at Dolores Park at 5',
        'The corner diner changed their menu',
        'What\'s up with the music festival?',
        'Anyone want to go to the museum on Saturday?',
        'Found a new rooftop bar with amazing views',
        'Who\'s running the marathon this year?',
        'Weekend road trip to Tahoe anyone?',
        'That new sushi place is fire',
        'Game night at my place, bring snacks',
        'Beach bonfire tomorrow night?',
        'Anyone selling their old bike?',
        'Trivia night at The Pub, we need a team',
        'The fog is insane today, check my story',
        'Spotted a coyote in Golden Gate Park!',
        'Food truck festival this weekend in SOMA',
        'Escape room next Friday, who\'s in?',
      ],
    },
  ]

  // 9 Direct chats to reach 12 total conversations
  const dmContacts = [
    contacts.daniel, contacts.lucia, contacts.camila,
    contacts.andres, contacts.hermana_diana, contacts.mariana,
    contacts.rodrigo, contacts.fernanda, contacts.pablo,
  ]

  for (const contact of dmContacts) {
    const firstName = contact.name.split(' ')[0]
    convDefs.push({
      type: 'direct',
      name: contact.name,
      members: [ale, contact],
      msgCount: faker.number.int({ min: 30, max: 80 }),
      topicPool: [
        `Hey ${firstName}, got a minute?`,
        'Thanks for the help!',
        'Sending you the link',
        'Saw your message',
        'Cool, see you there',
        'Hahaha awesome',
        'Hey, how\'s it going?',
        'Send me the address please',
        'Done, all set',
        'Sorry, didn\'t see your message earlier',
        'Hey did you see what Daniel posted?',
        'Can you recommend a good place for dinner?',
      ],
    })
  }

  const conversations: any[] = []
  const messages: Record<string, any[]> = {}

  for (const def of convDefs) {
    const convId = uid('echo:conv')
    const convMessages: any[] = []

    for (let m = 0; m < def.msgCount; m++) {
      const d = faker.number.float({ min: 0, max: 60 })
      const author = faker.helpers.arrayElement(def.members)
      const body = faker.helpers.arrayElement(def.topicPool)
      convMessages.push({
        uadp_type: 'uadp:message',
        id: uid('echo:msg'),
        conversation_id: convId,
        body,
        author: { id: author.id, name: author.name },
        ts: tsSecondsAgo(d, 12),
        read: d > 0.5,
      })
    }

    convMessages.sort((a, b) => a.ts - b.ts)
    messages[convId] = convMessages

    const lastMsg = convMessages[convMessages.length - 1]
    const unread = convMessages.filter(m => !m.read).length

    conversations.push({
      uadp_type: 'uadp:conversation',
      id: convId,
      ts: lastMsg.ts,
      label: def.name,
      type: def.type,
      name: def.name,
      members: def.members,
      last_message: {
        body: lastMsg.body,
        author: lastMsg.author.name,
        ts: lastMsg.ts,
      },
      unread_count: unread,
      muted: faker.datatype.boolean(0.15),
    })
  }

  conversations.sort((a, b) => b.ts - a.ts)

  return { conversations, messages }
}

// =========================================================================
// 9. HERALD ARTICLES — 500+ articles, 8 bookmarks
// =========================================================================
function generateHeraldArticles() {
  const categoryPool: { cat: string; titlePool: string[] }[] = [
    {
      cat: 'Technology',
      titlePool: [
        'Bun 2.0 promises to revolutionize the JavaScript ecosystem',
        'TypeScript 5.5: new features you need to know',
        'WebAssembly consolidates as the future of the browser',
        'Rust ranks as the most loved language for the fifth year',
        'Generative AI is transforming software development',
        'Kubernetes vs serverless: the debate continues',
        'The rise of edge computing in enterprise environments',
        'Open source community hits record contributions in 2026',
        'AI startups raise $12B in Q1 2026',
        'The era of AI agents: what it means for developers',
        'New UI framework challenges frontend giants',
        'Linux turns 34: its impact on the industry',
        'API security: best practices for 2025',
        'Alternative runtimes bet on full Node compatibility',
        'The future of databases: SQL is not dead',
        'MacBook Pro M5 Pro and M5 Max: Apple\'s Fusion Architecture changes everything',
      ],
    },
    {
      cat: 'Economy',
      titlePool: [
        'Fed holds interest rates steady at 4.5%',
        'European Central Bank cuts rates for the third time',
        'Remote work reshapes the commercial real estate market',
        'AI companies now account for 30% of S&P 500 gains',
        'Venture capital rebounds: Q1 2026 sees record investments',
        'The gig economy grows 25% as AI tools lower barriers',
        'Inflation cools to 2.1% in the US and EU',
        'Cryptocurrency regulation: what the new SEC framework means',
        'Supply chain reshoring accelerates amid global tensions',
        'SaaS valuations recover after two-year correction',
      ],
    },
    {
      cat: 'Culture',
      titlePool: [
        'The rise of AI-generated music: creativity or controversy?',
        'New museum of technology opens in London',
        'Streaming wars 2026: who is winning and why',
        'The podcast boom shows no signs of slowing down',
        'Independent game developers break into mainstream',
        'Street photography in the age of AI cameras',
        'Electronic music festivals go carbon-neutral',
        'Digital art and NFTs: what survived the hype',
        'The golden age of television continues with record shows',
        'How TikTok changed the music industry forever',
      ],
    },
    {
      cat: 'World',
      titlePool: [
        'EU passes comprehensive AI regulation act',
        'Japan launches next-generation bullet train network',
        'India becomes the world\'s third-largest economy',
        'UK tech sector grows 40% post-Brexit adjustments',
        'Australia leads global push for renewable energy',
        'Singapore positions itself as the AI hub of Asia',
        'Canada attracts record tech immigration in 2026',
        'Germany\'s startup ecosystem challenges Silicon Valley',
        'South Korea dominates semiconductor manufacturing',
        'Nordic countries top global quality of life index again',
      ],
    },
    {
      cat: 'Science',
      titlePool: [
        'NASA confirms water ice deposits on lunar south pole',
        'CRISPR gene therapy trial shows 95% success rate',
        'Fusion reactor achieves net energy gain for second time',
        'New antibiotic discovered using AI protein folding',
        'Quantum computing reaches 1000-qubit milestone',
        'Mars sample return mission enters final planning phase',
        'Brain-computer interface allows paralyzed patient to type',
        'Deep sea expedition discovers New species in Pacific trench',
        'Superconductor breakthrough at near room temperature',
        'James Webb telescope finds oldest galaxy ever observed',
        'Synthetic biology creates fully artificial cell',
        'Electric aircraft completes first transatlantic crossing',
      ],
    },
    {
      cat: 'Health',
      titlePool: [
        'Universal flu vaccine enters phase 3 clinical trials',
        'Study links gut microbiome diversity to mental health',
        'Wearable devices now predict seizures 30 minutes ahead',
        'Plant-based diets shown to reverse early heart disease',
        'AI diagnostic tool matches dermatologists in accuracy',
        'New sleep study reveals optimal nap duration for productivity',
        'Cancer immunotherapy combined approach shows 80% response',
        'WHO declares end to last major disease outbreak of decade',
        'Telemedicine adoption triples in rural communities',
        'Mental health apps prove effective in randomized trials',
        'Exercise shown to be as effective as antidepressants',
        'New rapid test detects infections in under 5 minutes',
      ],
    },
    {
      cat: 'Sports',
      titlePool: [
        'Formula E surpasses Formula 1 in global viewership',
        'Esports officially recognized as Olympic discipline',
        'Record-breaking marathon time set in Berlin',
        'NBA introduces AI-powered referee assistance system',
        'Women\'s soccer league reaches historic TV deal',
        'Surf competition in SF draws record crowds',
        'CrossFit games expand to 40 countries',
        'Ultra-marathon runner completes seven continents challenge',
        'Bay Area startup revolutionizes sports analytics',
        'College basketball introduces 4-point line experiment',
        'Climate-controlled stadiums become new standard',
        'Drone racing league secures major broadcast deal',
      ],
    },
    {
      cat: 'Environment',
      titlePool: [
        'Solar energy now cheapest source in 90% of countries',
        'Ocean cleanup project removes millionth ton of plastic',
        'Urban forests reduce city temperatures by 5 degrees',
        'Electric vehicle sales surpass gas cars in Europe',
        'Carbon capture technology scales to industrial level',
        'Rewilding project restores ecosystem in Central California',
        'Vertical farming feeds entire neighborhood in Tokyo',
        'Biodegradable packaging becomes industry standard',
        'Global tree planting initiative hits 1 billion milestone',
        'Coral reef restoration shows unprecedented recovery',
        'Hydrogen-powered ships enter commercial service',
        'Smart grid technology eliminates 30% of energy waste',
      ],
    },
    {
      cat: 'Education',
      titlePool: [
        'AI tutoring platforms close achievement gaps in schools',
        'Coding bootcamps now accepted as equivalent to CS degrees',
        'VR classrooms show 40% better retention in studies',
        'Open source textbooks save students $2B annually',
        'University offers first degree in AI ethics',
        'Micro-credentials gain acceptance across Fortune 500',
        'Gamification in education boosts engagement by 60%',
        'Online learning platform reaches 500 million users',
        'Lifelong learning accounts proposed in new legislation',
        'STEM education gap narrows for first time in decade',
        'Peer-to-peer learning platforms disrupt traditional tutoring',
        'AI grading tools free teachers for one-on-one mentoring',
      ],
    },
  ]

  const articles: any[] = []

  // Generate from title pools
  for (const { cat, titlePool } of categoryPool) {
    for (let i = 0; i < titlePool.length; i++) {
      const artId = uid('herald:art')
      const p1 = faker.lorem.paragraphs(1)
      const p2 = faker.lorem.paragraphs(1)
      const p3 = faker.lorem.paragraphs(1)
      articles.push({
        uadp_type: 'uadp:article',
        id: artId,
        ts: tsRandom(180),
        label: titlePool[i],
        title: titlePool[i],
        summary: faker.lorem.sentences(2),
        body_markdown: `# ${titlePool[i]}\n\n${p1}\n\n${p2}\n\n${p3}`,
        category: cat,
        author_name: `${faker.person.firstName()} ${faker.person.lastName()}`,
        image_url: picsum(`herald_${cat}_${i}`, 1200, 630),
        read_time_min: faker.number.int({ min: 3, max: 15 }),
      })
    }
  }

  // Pad to 500 articles
  while (articles.length < 500) {
    const { cat, titlePool } = faker.helpers.arrayElement(categoryPool)
    const artId = uid('herald:art')
    const title = `${faker.helpers.arrayElement(titlePool).split(':')[0]}: ${faker.lorem.sentence().slice(0, 40)}`
    const p1 = faker.lorem.paragraphs(1)
    const p2 = faker.lorem.paragraphs(1)
    articles.push({
      uadp_type: 'uadp:article',
      id: artId,
      ts: tsRandom(180),
      label: title,
      title,
      summary: faker.lorem.sentences(2),
      body_markdown: `# ${title}\n\n${p1}\n\n${p2}`,
      category: cat,
      author_name: `${faker.person.firstName()} ${faker.person.lastName()}`,
      image_url: picsum(`herald_extra_${articles.length}`, 1200, 630),
      read_time_min: faker.number.int({ min: 3, max: 12 }),
    })
  }

  articles.sort((a, b) => b.ts - a.ts)

  // 8 bookmarked article IDs
  const bookmarks = faker.helpers.arrayElements(articles, 8).map(a => a.id)

  return { articles, bookmarks }
}

// =========================================================================
// 10. LYRA MUSIC — 500 tracks, 15 playlists, 50 recently played, 40 liked
// =========================================================================
function generateLyraMusic() {
  const artistNames = [
    'Electric Moon', 'Valley Shadows', 'DJ Nexo', 'Maria Soledad',
    'The Circuits', 'Neon Pacific', 'Cosmic Vibe', 'Southern Acoustic',
    'Urban Pulse', 'Celeste Nova', 'The Digital Fox', 'Zero Frequency',
    'Crystal Soul', 'Wild Rhythm', 'Tropical Echo', 'Nocturna',
    'Sonic Volcano', 'Alternating Current', 'Fine Wood', 'Red Horizon',
  ]

  const artists = artistNames.map((name, i) => ({
    id: uid('lyra:artist'),
    name,
    image_url: picsum(`artist_${i}`, 300, 300),
  }))

  const albumNames = [
    'Nights of Code', 'Frequencies', 'Pulse', 'Digital Dawn',
    'Electric Roots', 'Waves', 'Open Circuit', 'Echoes of the South',
    'Neon', 'Journey', 'Signals', 'Zero Latitude', 'Fragments',
    'Horizon', 'Synergy', 'Reverberation', 'Crystal', 'Magnetic',
    'Spectrum', 'Inner Orbit',
  ]

  const albums = albumNames.map((name, i) => {
    const artist = faker.helpers.arrayElement(artists)
    return {
      id: uid('lyra:album'),
      name,
      artist,
      cover_url: picsum(`album_${i}`, 600, 600),
      year: faker.number.int({ min: 2018, max: 2025 }),
    }
  })

  const trackTitles = [
    'Midnight in the City', 'Compile and Run', 'Bits and Kisses',
    'Error 404 (Not Found)', 'Infinite Loop', 'Merge Conflict',
    'Coffee at 3am', 'Deploy Friday', 'Async Awaiting You',
    'Open Terminal', 'Refactor of the Heart', 'Null Pointer',
    'Sudo Make Me Coffee', 'Git Push My Love', 'Kernel Panic',
    'The BART Route', 'Sunday in the Park', 'Fog in the Bay',
    'Sunrise Code', 'Stack Overflow', 'Breakpoint',
    'The Algorithm of Love', 'Cache Miss', 'Runtime Exception',
    'Syntax Highlight', 'Lambda Function', 'Recursion Dreams',
    'Binary Sunset', 'Midnight Hotfix', 'Final Version',
  ]

  // Real SoundCloud track URLs for embeddable playback
  const SOUNDCLOUD_TRACKS = [
    { url: 'https://soundcloud.com/zephyr_deer/way-back-home', scTitle: 'Way Back Home' },
    { url: 'https://soundcloud.com/zephyr_deer/everglow', scTitle: 'Everglow' },
    { url: 'https://soundcloud.com/zephyr_deer/cozy', scTitle: 'Cozy' },
    { url: 'https://soundcloud.com/zephyr_deer/far-away', scTitle: 'Far Away' },
    { url: 'https://soundcloud.com/user-186652270/drkmnd-meteor-shower-ft-ambulo', scTitle: 'Meteor Shower' },
    { url: 'https://soundcloud.com/masonhart-scmusic/pure-dusk', scTitle: 'Pure Dusk' },
    { url: 'https://soundcloud.com/liamshore/lucid', scTitle: 'Lucid' },
    { url: 'https://soundcloud.com/alicks14/stars', scTitle: 'Stars' },
    { url: 'https://soundcloud.com/evenbluermusic/half-remembered', scTitle: 'Half Remembered' },
    { url: 'https://soundcloud.com/mellow-beats-854430450/cozy-room', scTitle: 'Cozy Room' },
    { url: 'https://soundcloud.com/vexaic/vexaic-soar-the-skies', scTitle: 'Soar The Skies' },
    { url: 'https://soundcloud.com/mrsuicidesheep/cma-so-far-away-feat-wonder', scTitle: 'So Far Away' },
    { url: 'https://soundcloud.com/mikesemesky/mike-semesky-hide-and-seek', scTitle: 'Hide And Seek' },
    { url: 'https://soundcloud.com/sappheirosmusic/sappheiros-beyond-remake', scTitle: 'Beyond' },
    { url: 'https://soundcloud.com/mrsuicidesheep/mark-eliyahu-journey', scTitle: 'Journey' },
    { url: 'https://soundcloud.com/lofi_girl/compilation', scTitle: '1 A.M Study Session' },
    { url: 'https://soundcloud.com/nigeldelviero/chill-study-beats-lofi-hip-hop-mix-2018', scTitle: 'Chill Study Beats' },
    { url: 'https://soundcloud.com/ambientmusicalgenre/memories-chill-mix-chill-ambient-instrumental-beats', scTitle: 'Memories Chill Mix' },
    { url: 'https://soundcloud.com/programmingandcodingmusicclub/lofi-programming-music', scTitle: 'LoFi Programming Music' },
    { url: 'https://soundcloud.com/max-acid-348214225/electronic-music-for-studying-concentration-chill-out-electronic-study-music-instrumental-mix', scTitle: 'Electronic Focus Mix' },
  ]

  // Build 500 tracks (first 20 have real SoundCloud URLs)
  const tracks = Array.from({ length: 500 }, (_, i) => {
    const album = faker.helpers.arrayElement(albums)
    const sc = i < SOUNDCLOUD_TRACKS.length ? SOUNDCLOUD_TRACKS[i] : null
    const title = i < trackTitles.length
      ? trackTitles[i]
      : `${faker.helpers.arrayElement(trackTitles).split(' ')[0]} ${faker.lorem.words(2)}`
    return {
      uadp_type: 'uadp:track' as const,
      id: uid('lyra:track'),
      ts: tsRandom(365),
      label: `${title} — ${album.artist.name}`,
      title,
      artist: album.artist,
      album: { id: album.id, name: album.name, cover_url: album.cover_url },
      duration_seconds: faker.number.int({ min: 120, max: 360 }),
      plays: faker.number.int({ min: 1000, max: 50_000_000 }),
      ...(sc ? { soundcloud_url: sc.url } : {}),
    }
  })

  // 15 playlists
  const playlistNames = [
    'Late Night Coding', 'Coffee and Code', 'Electronic SF',
    'Focus Mode', 'Deploy Friday', 'California Chill',
    'Workout Beats', 'Road Trip', 'Indie Vibes',
    'Deep Work', 'Morning Coffee', 'Good Vibes Only',
    'Lofi for Debugging', 'Weekend Vibes', 'Throwback Classics',
  ]

  const playlists = playlistNames.map((name, i) => {
    const playlistTracks = faker.helpers.arrayElements(tracks, faker.number.int({ min: 15, max: 50 }))
    return {
      uadp_type: 'uadp:playlist' as const,
      id: uid('lyra:playlist'),
      name,
      description: faker.lorem.sentence(),
      cover_url: picsum(`playlist_${i}`, 600, 600),
      owner: i < 8
        ? { id: ALEJANDRO.id, name: ALEJANDRO.name }
        : { id: uid('lyra:user'), name: `${faker.person.firstName()} ${faker.person.lastName()}` },
      track_count: playlistTracks.length,
      duration_seconds: playlistTracks.reduce((s, t) => s + t.duration_seconds, 0),
      followers: faker.number.int({ min: 0, max: 5000 }),
      is_public: faker.datatype.boolean(0.7),
      tracks: playlistTracks.map(t => t.id),
    }
  })

  // 50 recently played
  const recently_played = faker.helpers.arrayElements(tracks, 50).map(t => ({
    ...t,
    played_at: tsRandom(14),
  })).sort((a, b) => b.played_at - a.played_at)

  // 40 liked songs
  const liked_tracks = faker.helpers.arrayElements(tracks, 40).map(t => t.id)

  return { tracks, playlists, recently_played, liked_tracks, artists, albums }
}

// =========================================================================
// 11. VORTEX CATALOG — 350+ titles, 25 continue watching, 80 my list
// =========================================================================
function generateVortexCatalog() {
  const genres = ['Action', 'Comedy', 'Drama', 'Sci-Fi', 'Documentary', 'Thriller', 'Horror', 'Romance', 'Animation', 'Crime']

  const movieTitles = [
    'The Last Algorithm', 'Neon Nights', 'Broken Code',
    'The Crystal City', 'Operation Darknet', 'Beyond the Firewall',
    'The Bay Area Hacker', 'Signals from the Future', 'Protocol Zero',
    'Inner Galaxy', 'Flight of the Falcon', 'Digital Ashes',
    'Invisible Border', 'The Hourglass', 'Parallel Dimension',
    'The Silent Network', 'Vanishing Point', 'Hidden Current',
    'The Data Labyrinth', 'Solar Storm',
    'Memories of a Robot', 'The Dream Collector',
    'Beneath the Surface', 'Crossroads', 'Final Flash',
    'Silicon Island', 'Echoes of Tomorrow', 'Dormant Virus',
    'The Shadow Architect', 'Titanium Waves',
    'Binary Horizon', 'Ghost Protocol', 'Digital Mirage',
    'The Cloud Atlas', 'Neon Rain', 'Firewall Down',
    'Code Red', 'Proxy War', 'Deep Packet',
    'The Compiler', 'Quantum Break', 'Byte Storm',
    'Dark Network', 'End of Line', 'The Transistor',
    'Null Island', 'Stack Trace', 'Process Kill',
    'The Fork', 'Memory Leak', 'Dead Reckoning',
    'Circuit Breaker', 'The Emulator', 'Output Error',
    'Blue Screen', 'Kernel Panic', 'The Debugger',
    'Return Value', 'Infinite Recursion', 'The Interpreter',
    'Machine Code', 'Static Noise', 'The Assembler',
    'Overflow', 'Segfault', 'The Linker',
    'Runtime', 'Cold Boot', 'The Indexer',
    'Hash Collision', 'Thread Lock', 'The Daemon',
    'Packet Loss', 'Bit Flip', 'The Router',
    'Sync Error', 'The Gateway', 'Broadcast Storm',
    'Wired', 'Unplugged', 'The Terminal',
    'Zero Day', 'Exploit', 'The Sandbox',
    'Containment', 'Root Shell', 'The Payload',
    'Injection', 'The Backdoor', 'Cleartext',
    'Encrypted', 'The Cipher', 'Plaintext War',
    'Binary Star', 'The Matrix Reboot', 'Virtual Memory',
    'Pointer', 'The Reference', 'Garbage Collected',
    'Heap Space', 'The Allocator', 'Free Memory',
    'Swap File', 'The Partition', 'Boot Sector',
    'Recovery Mode', 'The Restore', 'Backup Plan',
    'Snapshot', 'The Archive', 'Compression',
    'Lossy', 'The Encoder', 'Pixel Perfect',
    'Frame Drop', 'The Renderer', 'Anti-Alias',
    'Depth Buffer', 'The Shader', 'Ray Traced',
    'Polygon Mesh', 'The Texture', 'UV Mapped',
    'Light Source', 'The Camera', 'Focus Pull',
    'Wide Angle', 'The Lens', 'Chromatic',
    'Exposure', 'The Filter', 'Color Grade',
    'Final Cut', 'The Edit', 'Rough Draft',
    'Second Take', 'The Director', 'Opening Scene',
    'Credits Roll', 'The Producer', 'Box Office',
    'Standing Ovation', 'The Critic', 'Five Stars',
    'Red Carpet', 'The Premiere', 'After Party',
    'Sequel', 'The Franchise', 'Spin Off',
    'Prequel', 'The Remaster', 'Directors Cut',
    'Extended Edition', 'The Anthology', 'Season Finale',
    'Cliffhanger', 'The Pilot', 'Episode One',
    'Story Arc', 'The Narrator', 'Plot Twist',
    'Double Cross', 'The Reveal', 'Hidden Agenda',
    'Secret Identity', 'The Mask', 'Undercover',
    'Shadow Agent', 'The Informant', 'Deep Cover',
    'Safe House', 'The Extraction', 'Exit Strategy',
    'Point of No Return', 'The Escape', 'Freedom Run',
    'Last Stand', 'The Siege', 'Breach Point',
    'Countdown', 'The Timer', 'Final Hour',
    'Red Zone', 'The Perimeter', 'Lockdown',
    'Quarantine', 'The Outbreak', 'Patient Zero',
    'Ground Zero', 'The Epicenter', 'Shock Wave',
    'Aftershock', 'The Tremor', 'Fault Line',
    'Fracture', 'The Collapse', 'Free Fall',
    'Impact Zone', 'The Crater', 'Dust Cloud',
    'Clear Sky', 'The Horizon', 'First Light',
    'Golden Hour', 'The Dawn', 'New Morning',
    'Fresh Start', 'The Beginning', 'Chapter One',
  ]

  const seriesTitles = [
    'DevOps: The Series', 'Startup Nation', 'Line of Code',
    'The Server', 'Closed Circuit', 'Midnight Hackers',
    'The Incubator', 'Debug', 'Seed Round',
    'Control+Z', 'Beta Testers', 'Full Stack',
    'The Deployment', 'Root Access', 'Merge Request',
    'Latency', 'Kernel', 'The Secret Repo',
    'Pipeline', 'Iteration',
    'The API', 'Webhook', 'Push Notification',
    'Serverless', 'The Container', 'Orchestrated',
    'Microservice', 'The Monolith', 'Refactored',
    'Legacy Code', 'The Migration', 'Breaking Changes',
    'Deprecation Notice', 'The Update', 'Patch Tuesday',
    'Release Candidate', 'The Branch', 'Main Line',
    'Feature Flag', 'The Toggle', 'A/B Tested',
    'Experiment', 'The Hypothesis', 'Data Driven',
    'Machine Learned', 'The Model', 'Training Set',
    'Validation', 'The Benchmark', 'Stress Tested',
    'Load Balanced', 'The Cluster', 'Distributed',
    'Replicated', 'The Shard', 'Partitioned',
    'Consistent', 'The Transaction', 'Committed',
    'Rolled Back', 'The Snapshot', 'Point in Time',
    'The Recovery', 'Failover', 'High Availability',
    'Redundant', 'The Backup', 'Disaster Recovery',
    'Incident Report', 'The Postmortem', 'Root Cause',
    'The Fix', 'Hot Patch', 'Cold Deploy',
    'Blue Green', 'The Canary', 'Rolling Update',
    'Circuit Open', 'The Retry', 'Exponential Backoff',
    'Rate Limited', 'The Throttle', 'Queue Full',
    'Dead Letter', 'The Consumer', 'Event Sourced',
    'CQRS', 'The Projection', 'Eventually Consistent',
    'Saga Pattern', 'The Orchestrator', 'Choreography',
    'Domain Event', 'The Aggregate', 'Bounded Context',
    'Ubiquitous Language', 'The Domain', 'Value Object',
    'Entity', 'The Repository', 'Unit of Work',
    'Specification', 'The Factory', 'Abstract Type',
    'Concrete Implementation', 'The Adapter', 'Port and Adapter',
    'Hexagonal', 'The Layer', 'Clean Architecture',
    'The Dependency', 'Inverted Control', 'Injected',
    'Wired Up', 'The Configuration', 'Environment',
    'Development Mode', 'The Staging', 'Production Ready',
  ]

  // 250 movies
  const movies = movieTitles.map((title, i) => ({
    uadp_type: 'uadp:title' as const,
    id: uid('vortex:title'),
    ts: tsRandom(365),
    label: title,
    title,
    synopsis: faker.lorem.paragraph(),
    type: 'movie' as const,
    genre: faker.helpers.arrayElements(genres, faker.number.int({ min: 1, max: 3 })),
    poster_url: picsum(`movie_${i}`, 400, 600),
    backdrop_url: picsum(`movie_bg_${i}`, 1920, 1080),
    rating: roundUSD(faker.number.float({ min: 5.0, max: 9.8 })),
    year: faker.number.int({ min: 2019, max: 2025 }),
    duration_minutes: faker.number.int({ min: 80, max: 180 }),
  }))

  // 100+ series
  const series = seriesTitles.map((title, i) => ({
    uadp_type: 'uadp:title' as const,
    id: uid('vortex:title'),
    ts: tsRandom(365),
    label: title,
    title,
    synopsis: faker.lorem.paragraph(),
    type: 'series' as const,
    genre: faker.helpers.arrayElements(genres, faker.number.int({ min: 1, max: 3 })),
    poster_url: picsum(`series_${i}`, 400, 600),
    backdrop_url: picsum(`series_bg_${i}`, 1920, 1080),
    rating: roundUSD(faker.number.float({ min: 6.0, max: 9.5 })),
    year: faker.number.int({ min: 2020, max: 2025 }),
    seasons: faker.number.int({ min: 1, max: 6 }),
    episodes: faker.number.int({ min: 6, max: 60 }),
  }))

  let catalog = [...movies, ...series]

  // Pad catalog to 500 titles with generated entries
  while (catalog.length < 500) {
    const isMovie = faker.datatype.boolean(0.6)
    const title = isMovie
      ? `${faker.word.adjective()} ${faker.word.noun()}`
      : `${faker.word.adjective()} ${faker.word.noun()}: Season ${faker.number.int({ min: 1, max: 5 })}`
    const idx = catalog.length
    if (isMovie) {
      catalog.push({
        uadp_type: 'uadp:title' as const,
        id: uid('vortex:title'),
        ts: tsRandom(365),
        label: title,
        title,
        synopsis: faker.lorem.paragraph(),
        type: 'movie' as const,
        genre: faker.helpers.arrayElements(genres, faker.number.int({ min: 1, max: 3 })),
        poster_url: picsum(`movie_extra_${idx}`, 400, 600),
        backdrop_url: picsum(`movie_bg_extra_${idx}`, 1920, 1080),
        rating: roundUSD(faker.number.float({ min: 5.0, max: 9.8 })),
        year: faker.number.int({ min: 2019, max: 2025 }),
        duration_minutes: faker.number.int({ min: 80, max: 180 }),
      } as any)
    } else {
      catalog.push({
        uadp_type: 'uadp:title' as const,
        id: uid('vortex:title'),
        ts: tsRandom(365),
        label: title,
        title,
        synopsis: faker.lorem.paragraph(),
        type: 'series' as const,
        genre: faker.helpers.arrayElements(genres, faker.number.int({ min: 1, max: 3 })),
        poster_url: picsum(`series_extra_${idx}`, 400, 600),
        backdrop_url: picsum(`series_bg_extra_${idx}`, 1920, 1080),
        rating: roundUSD(faker.number.float({ min: 6.0, max: 9.5 })),
        year: faker.number.int({ min: 2020, max: 2025 }),
        seasons: faker.number.int({ min: 1, max: 6 }),
        episodes: faker.number.int({ min: 6, max: 60 }),
      } as any)
    }
  }

  // 25 "continue watching" with progress
  const continue_watching = faker.helpers.arrayElements(catalog, 25).map(t => ({
    ...t,
    progress: t.type === 'series'
      ? { season: faker.number.int({ min: 1, max: (t as any).seasons || 1 }), episode: faker.number.int({ min: 1, max: 8 }), percent: faker.number.int({ min: 10, max: 85 }) }
      : { percent: faker.number.int({ min: 10, max: 85 }) },
  }))

  // 80 "my list"
  const my_list = faker.helpers.arrayElements(catalog, 80).map(t => t.id)

  // Trending (top 10)
  const trending = faker.helpers.arrayElements(catalog, 10)

  return { catalog, continue_watching, my_list, trending }
}

// =========================================================================
// 12. BEACON EMAILS — 400 inbox, 100 sent, 15 drafts
// =========================================================================
function generateBeaconEmails() {
  const senders = [
    { name: 'GitHub Notifications', address: 'noreply@github-demo.local' },
    { name: 'TechCorp - HR', address: 'rrhh@techcorp-demo.local' },
    { name: 'TechCorp - Finance', address: 'finanzas@techcorp-demo.local' },
    { name: 'Daniel Mora', address: 'daniel.mora@techcorp-demo.local' },
    { name: 'Lucia Reyes', address: 'lucia.reyes@techcorp-demo.local' },
    { name: 'Mariana Torres', address: 'mariana.torres@techcorp-demo.local' },
    { name: 'Pablo Herrera', address: 'pablo.herrera@techcorp-demo.local' },
    { name: 'Diana Vega', address: 'diana.vega@correo-demo.local' },
    { name: 'Rosa Vega', address: 'rosa.vega@correo-demo.local' },
    { name: 'MercadoMart', address: 'pedidos@mercadomart-demo.local' },
    { name: 'Orbit Bank', address: 'notificaciones@orbit-demo.local' },
    { name: 'Zinc', address: 'alerts@zinc-demo.local' },
    { name: 'LyraMusic', address: 'updates@lyra-demo.local' },
    { name: 'Newsletter Dev', address: 'newsletter@devweekly-demo.local' },
    { name: 'CloudSync', address: 'billing@cloudsync-demo.local' },
    { name: 'TechConf SF', address: 'info@conftech-demo.local' },
    { name: 'Camila Ruiz', address: 'camila.ruiz@correo-demo.local' },
    { name: 'FlameEats', address: 'pedidos@flameeats-demo.local' },
  ]

  const subjectPool = [
    '[PR #342] feat: add UADP auth middleware — merged',
    '[PR #338] fix: resolve race condition in payment flow',
    'Your biweekly pay stub is available',
    'ACH transfer confirmation',
    'Your order #1024 has been delivered',
    'Weekly summary of your Orbit account',
    'Charge alert: $12.99 USD on your Zinc card',
    'New episode: Podcast Dev Weekly #87',
    'Your CloudSync invoice — March 2025',
    'Invitation: TechConf SF 2025 — Early bird',
    'Re: Sprint meeting tomorrow at 10am',
    'Hey Ale, did you see yesterday\'s deploy?',
    'Little bro, mom says come over on Sunday',
    'Your playlist "Focus Mode" has new recommendations',
    'FlameEats order confirmation #8834',
    'Review requested on PR #345',
    'Monthly expense summary — Zinc',
    'Security update on your account',
    'Re: Client feedback on API v2',
    'Sweetie, sending you the recipe you asked for',
    'Your flight to Austin — Confirmation',
    'Meetup invitation: Rust Bay Area - SF',
    '30% off your next purchase — MercadoMart',
    'Re: Microservices architecture proposal',
    'Reminder: FibraMax internet payment',
  ]

  const aleEmail = { name: ALEJANDRO.name, address: ALEJANDRO.email }

  // 400 inbox emails
  const inbox = Array.from({ length: 400 }, (_, i) => {
    const sender = faker.helpers.arrayElement(senders)
    const subject = i < subjectPool.length ? subjectPool[i] : `${faker.helpers.arrayElement(subjectPool).split(':')[0]}: ${faker.lorem.sentence().slice(0, 40)}`
    return {
      uadp_type: 'uadp:email' as const,
      id: uid('beacon:email'),
      ts: tsRandom(90),
      label: subject,
      subject,
      from: sender,
      to: [aleEmail],
      body_text: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 4 })),
      folder: 'inbox' as const,
      read: i > 12,
      starred: faker.datatype.boolean(0.1),
      attachments: faker.datatype.boolean(0.15)
        ? [{ name: `${faker.system.fileName()}.pdf`, size_bytes: faker.number.int({ min: 10000, max: 5000000 }), type: 'application/pdf' }]
        : undefined,
    }
  })

  // 40 sent emails
  const sentSubjects = [
    'Re: Sprint meeting tomorrow at 10am',
    'Microservices architecture proposal',
    'Feedback on the payments endpoint',
    'Vacation request — April 15 to 22',
    'Re: Your biweekly pay stub is available',
  ]

  const sent = Array.from({ length: 100 }, (_, i) => {
    const recipient = faker.helpers.arrayElement(senders)
    const subject = i < sentSubjects.length ? sentSubjects[i] : `Re: ${faker.lorem.sentence().slice(0, 40)}`
    return {
      uadp_type: 'uadp:email' as const,
      id: uid('beacon:email'),
      ts: tsRandom(90),
      label: subject,
      subject,
      from: aleEmail,
      to: [recipient],
      body_text: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 3 })),
      folder: 'sent' as const,
      read: true,
      starred: false,
    }
  })

  // 15 drafts
  const drafts = Array.from({ length: 15 }, () => {
    const recipient = faker.helpers.arrayElement(senders)
    return {
      uadp_type: 'uadp:email' as const,
      id: uid('beacon:email'),
      ts: tsRandom(30),
      label: faker.lorem.sentence().slice(0, 40),
      subject: faker.lorem.sentence().slice(0, 40),
      from: aleEmail,
      to: [recipient],
      body_text: faker.lorem.sentences(faker.number.int({ min: 1, max: 3 })),
      folder: 'drafts' as const,
      read: true,
      starred: false,
    }
  })

  const emails = [...inbox, ...sent, ...drafts].sort((a, b) => b.ts - a.ts)

  // Labels/folders summary
  const folders = {
    inbox: { count: inbox.length, unread: inbox.filter(e => !e.read).length },
    sent: { count: sent.length },
    drafts: { count: drafts.length },
    spam: { count: 3 },
    trash: { count: 7 },
  }

  return { emails, folders }
}

// =========================================================================
// 13. COMPASS RIDES — 500 rides, 5 saved places
// =========================================================================
function generateCompassRides() {
  const sfPlaces = [
    { name: 'Mission District Apartment', lat: 37.7599, lng: -122.4148 },
    { name: 'TechCorp — Office', lat: 37.7849, lng: -122.3994 },
    { name: 'Blue Bottle Coffee', lat: 37.7763, lng: -122.4213 },
    { name: 'SuperMart SoMa', lat: 37.7785, lng: -122.3950 },
    { name: 'GymFit Downtown', lat: 37.7870, lng: -122.4000 },
    { name: 'SFO Airport', lat: 37.6213, lng: -122.3790 },
    { name: 'Berkeley', lat: 37.8716, lng: -122.2727 },
    { name: 'Nob Hill', lat: 37.7930, lng: -122.4161 },
    { name: 'Downtown / Union Square', lat: 37.7879, lng: -122.4074 },
    { name: 'Golden Gate Park', lat: 37.7694, lng: -122.4862 },
    { name: 'Palo Alto', lat: 37.4419, lng: -122.1430 },
    { name: 'Market Street', lat: 37.7831, lng: -122.4093 },
    { name: 'Hayes Valley', lat: 37.7759, lng: -122.4245 },
    { name: 'Sausalito', lat: 37.8590, lng: -122.4852 },
    { name: 'Stanford', lat: 37.4275, lng: -122.1697 },
    { name: 'Fisherman\'s Wharf', lat: 37.8080, lng: -122.4177 },
    { name: 'Chinatown', lat: 37.7941, lng: -122.4078 },
    { name: 'Castro', lat: 37.7609, lng: -122.4350 },
    { name: 'Embarcadero', lat: 37.7936, lng: -122.3930 },
    { name: 'Presidio', lat: 37.7989, lng: -122.4662 },
    { name: 'Japantown', lat: 37.7854, lng: -122.4294 },
    { name: 'UCSF Medical Center', lat: 37.7631, lng: -122.4576 },
    { name: 'Oracle Park', lat: 37.7786, lng: -122.3893 },
    { name: 'Treasure Island', lat: 37.8235, lng: -122.3708 },
    { name: 'Twin Peaks', lat: 37.7544, lng: -122.4477 },
    { name: 'Ocean Beach', lat: 37.7596, lng: -122.5107 },
    { name: 'Sunset District', lat: 37.7525, lng: -122.4938 },
    { name: 'Richmond District', lat: 37.7803, lng: -122.4716 },
    { name: 'North Beach', lat: 37.8060, lng: -122.4103 },
    { name: 'Pacific Heights', lat: 37.7925, lng: -122.4382 },
    { name: 'Potrero Hill', lat: 37.7610, lng: -122.4000 },
    { name: 'Dogpatch', lat: 37.7586, lng: -122.3872 },
    { name: 'Bernal Heights', lat: 37.7438, lng: -122.4157 },
    { name: 'Glen Park', lat: 37.7340, lng: -122.4332 },
    { name: 'San Jose', lat: 37.3382, lng: -121.8863 },
    { name: 'Oakland', lat: 37.8044, lng: -122.2712 },
    { name: 'Daly City', lat: 37.6879, lng: -122.4702 },
    { name: 'South San Francisco', lat: 37.6547, lng: -122.4077 },
    { name: 'Half Moon Bay', lat: 37.4636, lng: -122.4286 },
  ]

  const vehicles = [
    'Nissan Sentra White 2023', 'Toyota Corolla Grey 2022', 'Honda Civic Black 2021',
    'Volkswagen Jetta Blue 2023', 'Hyundai Elantra Red 2022', 'Kia Forte Silver 2023',
    'Mazda 3 White 2024', 'Toyota Camry Black 2023', 'Chevrolet Malibu Grey 2022',
  ]

  const rideTypes = ['standard', 'premium', 'shared'] as const

  // 500 past rides
  const rides = Array.from({ length: 500 }, () => {
    const origin = faker.helpers.arrayElement(sfPlaces)
    let destination = faker.helpers.arrayElement(sfPlaces)
    while (destination.name === origin.name) {
      destination = faker.helpers.arrayElement(sfPlaces)
    }
    const distance = roundUSD(faker.number.float({ min: 1.5, max: 25 }))
    const duration = Math.floor(distance * faker.number.float({ min: 3, max: 6 }))
    const rideType = faker.helpers.arrayElement(rideTypes)
    const baseFare = distance * faker.number.float({ min: 1.5, max: 3.5 })
    const multiplier = rideType === 'premium' ? 1.8 : rideType === 'shared' ? 0.7 : 1.0
    const fare = roundUSD(baseFare * multiplier)

    return {
      uadp_type: 'uadp:ride' as const,
      id: uid('compass:ride'),
      ts: tsRandom(365),
      label: `${origin.name} → ${destination.name}`,
      status: faker.helpers.weightedArrayElement([
        { value: 'completed' as const, weight: 0.9 },
        { value: 'cancelled' as const, weight: 0.1 },
      ]),
      origin: { name: origin.name, lat: origin.lat + faker.number.float({ min: -0.002, max: 0.002 }), lng: origin.lng + faker.number.float({ min: -0.002, max: 0.002 }) },
      destination: { name: destination.name, lat: destination.lat + faker.number.float({ min: -0.002, max: 0.002 }), lng: destination.lng + faker.number.float({ min: -0.002, max: 0.002 }) },
      distance_km: distance,
      duration_minutes: duration,
      fare: { value: fare, currency: 'USD' },
      driver: {
        name: `${faker.person.firstName()} ${faker.person.lastName()}`,
        rating: roundUSD(faker.number.float({ min: 4.2, max: 5.0 })),
        vehicle: faker.helpers.arrayElement(vehicles),
        plate: `${faker.string.alpha({ length: 3, casing: 'upper' })}-${faker.string.numeric(4)}`,
      },
      ride_type: rideType,
    }
  }).sort((a, b) => b.ts - a.ts)

  // 5 saved places
  const saved_places = [
    { id: uid('compass:place'), name: 'Home', label: 'My apartment', address: '245 Valencia St, Apt 8B, Mission District, SF', lat: 37.7599, lng: -122.4148, category: 'home' as const },
    { id: uid('compass:place'), name: 'Work', label: 'TechCorp', address: '101 2nd St, Floor 12, SoMa, SF', lat: 37.7849, lng: -122.3994, category: 'work' as const },
    { id: uid('compass:place'), name: 'Blue Bottle Coffee', label: 'My favorite coffee shop', address: '315 Linden St, Hayes Valley, SF', lat: 37.7763, lng: -122.4213, category: 'favorite' as const },
    { id: uid('compass:place'), name: 'Mom House', label: 'Mom Rosa\'s house', address: '428 Noe St, Noe Valley, SF', lat: 37.7510, lng: -122.4310, category: 'favorite' as const },
    { id: uid('compass:place'), name: 'Airport', label: 'SFO Terminal 2', address: 'San Francisco International Airport, T2', lat: 37.6213, lng: -122.3790, category: 'favorite' as const },
  ].map(p => ({ uadp_type: 'uadp:saved_place' as const, ...p }))

  return { rides, saved_places }
}

// =========================================================================
// 14. FLAME FOOD ORDERS — 500 orders, 30 favorite restaurants
// =========================================================================
function generateFlameOrders() {
  const restaurants = [
    { id: uid('flame:rest'), name: 'Taqueria Don Julio', cuisine: 'Mexican', rating: 4.8, image_url: picsum('rest_0', 400, 300) },
    { id: uid('flame:rest'), name: 'Sushi Kaze', cuisine: 'Japanese', rating: 4.6, image_url: picsum('rest_1', 400, 300) },
    { id: uid('flame:rest'), name: 'Bistro Alameda', cuisine: 'French', rating: 4.5, image_url: picsum('rest_2', 400, 300) },
    { id: uid('flame:rest'), name: 'Abuela\'s Kitchen', cuisine: 'Mexican', rating: 4.9, image_url: picsum('rest_3', 400, 300) },
    { id: uid('flame:rest'), name: 'La Cocina de Sol', cuisine: 'Mexican', rating: 4.7, image_url: picsum('rest_4', 400, 300) },
    { id: uid('flame:rest'), name: 'Pizza Vulcano', cuisine: 'Italian', rating: 4.3, image_url: picsum('rest_5', 400, 300) },
    { id: uid('flame:rest'), name: 'Wok Express', cuisine: 'Chinese', rating: 4.2, image_url: picsum('rest_6', 400, 300) },
    { id: uid('flame:rest'), name: 'Burger Craft', cuisine: 'American', rating: 4.4, image_url: picsum('rest_7', 400, 300) },
    { id: uid('flame:rest'), name: 'Falafel House', cuisine: 'Middle Eastern', rating: 4.5, image_url: picsum('rest_8', 400, 300) },
    { id: uid('flame:rest'), name: 'Cevicheria del Mar', cuisine: 'Seafood', rating: 4.6, image_url: picsum('rest_9', 400, 300) },
    { id: uid('flame:rest'), name: 'Veggie Verde', cuisine: 'Vegetarian', rating: 4.3, image_url: picsum('rest_10', 400, 300) },
    { id: uid('flame:rest'), name: 'El Fogon Kitchen', cuisine: 'Mexican', rating: 4.8, image_url: picsum('rest_11', 400, 300) },
    { id: uid('flame:rest'), name: 'Thai Garden', cuisine: 'Thai', rating: 4.5, image_url: picsum('rest_12', 400, 300) },
    { id: uid('flame:rest'), name: 'Mumbai Bites', cuisine: 'Indian', rating: 4.7, image_url: picsum('rest_13', 400, 300) },
    { id: uid('flame:rest'), name: 'Seoul Kitchen', cuisine: 'Korean', rating: 4.6, image_url: picsum('rest_14', 400, 300) },
    { id: uid('flame:rest'), name: 'Pho House', cuisine: 'Vietnamese', rating: 4.4, image_url: picsum('rest_15', 400, 300) },
    { id: uid('flame:rest'), name: 'Mediterranean Grill', cuisine: 'Mediterranean', rating: 4.5, image_url: picsum('rest_16', 400, 300) },
    { id: uid('flame:rest'), name: 'Poke Paradise', cuisine: 'Hawaiian', rating: 4.3, image_url: picsum('rest_17', 400, 300) },
    { id: uid('flame:rest'), name: 'Empanada Express', cuisine: 'Argentine', rating: 4.6, image_url: picsum('rest_18', 400, 300) },
    { id: uid('flame:rest'), name: 'Ramen Lab', cuisine: 'Japanese', rating: 4.8, image_url: picsum('rest_19', 400, 300) },
    { id: uid('flame:rest'), name: 'Greek Corner', cuisine: 'Greek', rating: 4.4, image_url: picsum('rest_20', 400, 300) },
    { id: uid('flame:rest'), name: 'BBQ Smokehouse', cuisine: 'American', rating: 4.7, image_url: picsum('rest_21', 400, 300) },
    { id: uid('flame:rest'), name: 'Dim Sum Palace', cuisine: 'Chinese', rating: 4.5, image_url: picsum('rest_22', 400, 300) },
    { id: uid('flame:rest'), name: 'Ethiopian Delight', cuisine: 'Ethiopian', rating: 4.6, image_url: picsum('rest_23', 400, 300) },
    { id: uid('flame:rest'), name: 'Taco Bell Cantina', cuisine: 'Mexican', rating: 3.9, image_url: picsum('rest_24', 400, 300) },
    { id: uid('flame:rest'), name: 'Bagel Bros', cuisine: 'American', rating: 4.2, image_url: picsum('rest_25', 400, 300) },
    { id: uid('flame:rest'), name: 'Curry House', cuisine: 'Indian', rating: 4.5, image_url: picsum('rest_26', 400, 300) },
    { id: uid('flame:rest'), name: 'Acai Bowl Bar', cuisine: 'Brazilian', rating: 4.3, image_url: picsum('rest_27', 400, 300) },
  ]

  const menusByRestType: Record<string, { name: string; price: number }[]> = {
    Mexican: [
      { name: 'Tacos al Pastor x4', price: 10.99 }, { name: 'Huitlacoche Quesadilla', price: 7.49 },
      { name: 'Red Pozole', price: 14.99 }, { name: 'Chicken Tamales x3', price: 9.49 },
      { name: 'Enchiladas Suizas', price: 11.99 }, { name: 'Horchata Water 1L', price: 4.49 },
      { name: 'Guacamole with Tortilla Chips', price: 8.49 }, { name: 'Corn on the Cob', price: 4.99 },
    ],
    Japanese: [
      { name: 'California Roll x8', price: 15.99 }, { name: 'Tonkotsu Ramen', price: 17.99 },
      { name: 'Gyoza x6', price: 10.99 }, { name: 'Edamames', price: 6.99 },
      { name: 'Mixed Nigiri x6', price: 21.99 }, { name: 'Green Tea', price: 3.49 },
    ],
    French: [
      { name: 'Ham and Cheese Croissant', price: 8.99 }, { name: 'Croque Monsieur', price: 13.99 },
      { name: 'Nicoise Salad', price: 11.99 }, { name: 'Nutella Crepe', price: 7.99 },
    ],
    Italian: [
      { name: 'Pizza Margherita', price: 18.99 }, { name: 'Carbonara Pasta', price: 16.99 },
      { name: 'Bruschetta x4', price: 9.49 }, { name: 'Tiramisu', price: 10.99 },
    ],
    Chinese: [
      { name: 'Mixed Fried Rice', price: 11.99 }, { name: 'Kung Pao Chicken', price: 14.99 },
      { name: 'Spring Rolls x4', price: 7.99 }, { name: 'Chow Mein', price: 12.99 },
    ],
    American: [
      { name: 'Classic Burger', price: 15.99 }, { name: 'French Fries', price: 5.99 },
      { name: 'Chocolate Milkshake', price: 7.99 }, { name: 'BBQ Wings x8', price: 14.99 },
    ],
    'Middle Eastern': [
      { name: 'Falafel Wrap', price: 11.99 }, { name: 'Hummus with Pita Bread', price: 7.99 },
      { name: 'Chicken Shawarma', price: 13.99 }, { name: 'Baklava x3', price: 6.99 },
    ],
    Seafood: [
      { name: 'Shrimp Ceviche', price: 16.99 }, { name: 'Green Aguachile', price: 17.99 },
      { name: 'Tuna Tostada', price: 10.99 }, { name: 'Seafood Cocktail', price: 19.99 },
    ],
    Vegetarian: [
      { name: 'Buddha Bowl', price: 14.99 }, { name: 'Jackfruit Tacos x3', price: 10.99 },
      { name: 'Green Smoothie', price: 7.99 }, { name: 'Quinoa Salad', price: 11.99 },
    ],
    Thai: [
      { name: 'Pad Thai', price: 14.99 }, { name: 'Green Curry', price: 15.99 },
      { name: 'Tom Yum Soup', price: 11.99 }, { name: 'Mango Sticky Rice', price: 8.99 },
    ],
    Indian: [
      { name: 'Butter Chicken', price: 16.99 }, { name: 'Garlic Naan x2', price: 5.99 },
      { name: 'Biryani', price: 15.99 }, { name: 'Samosa x3', price: 7.99 },
    ],
    Korean: [
      { name: 'Bibimbap', price: 15.99 }, { name: 'Korean Fried Chicken', price: 14.99 },
      { name: 'Kimchi Jjigae', price: 13.99 }, { name: 'Bulgogi', price: 17.99 },
    ],
    Vietnamese: [
      { name: 'Pho Beef', price: 14.99 }, { name: 'Banh Mi Sandwich', price: 10.99 },
      { name: 'Spring Rolls x4', price: 8.99 }, { name: 'Vietnamese Coffee', price: 5.99 },
    ],
    Mediterranean: [
      { name: 'Grilled Lamb Kebab', price: 18.99 }, { name: 'Mixed Mezze Platter', price: 14.99 },
      { name: 'Fattoush Salad', price: 10.99 }, { name: 'Baklava', price: 6.99 },
    ],
    Hawaiian: [
      { name: 'Ahi Poke Bowl', price: 16.99 }, { name: 'Spam Musubi x3', price: 8.99 },
      { name: 'Loco Moco', price: 14.99 }, { name: 'Açaí Bowl', price: 12.99 },
    ],
    Argentine: [
      { name: 'Beef Empanadas x4', price: 12.99 }, { name: 'Choripan', price: 9.99 },
      { name: 'Milanesa Napolitana', price: 16.99 }, { name: 'Dulce de Leche Flan', price: 7.99 },
    ],
    Greek: [
      { name: 'Gyro Platter', price: 15.99 }, { name: 'Spanakopita', price: 9.99 },
      { name: 'Moussaka', price: 14.99 }, { name: 'Greek Salad', price: 10.99 },
    ],
    Ethiopian: [
      { name: 'Doro Wot', price: 16.99 }, { name: 'Injera Combo Platter', price: 19.99 },
      { name: 'Kitfo', price: 17.99 }, { name: 'Ethiopian Coffee', price: 4.99 },
    ],
    Brazilian: [
      { name: 'Açaí Bowl Grande', price: 14.99 }, { name: 'Coxinha x4', price: 9.99 },
      { name: 'Pão de Queijo x6', price: 7.99 }, { name: 'Guaraná', price: 3.99 },
    ],
  }

  // Default menu for cuisines not listed
  const defaultMenu = [
    { name: 'Daily Special', price: 13.99 }, { name: 'Special Appetizer', price: 7.99 },
    { name: 'Beverage', price: 3.99 }, { name: 'Dessert', price: 6.99 },
  ]

  // 500 food orders
  const orders = Array.from({ length: 500 }, () => {
    const restaurant = faker.helpers.arrayElement(restaurants)
    const menu = menusByRestType[restaurant.cuisine] || defaultMenu
    const numItems = faker.number.int({ min: 1, max: 4 })
    const selectedItems = faker.helpers.arrayElements(menu, Math.min(numItems, menu.length)).map(item => ({
      name: item.name,
      qty: faker.number.int({ min: 1, max: 2 }),
      unit_price: { value: item.price, currency: 'USD' },
    }))
    const subtotal = selectedItems.reduce((s, it) => s + it.unit_price.value * it.qty, 0)
    const deliveryFee = roundUSD(faker.number.float({ min: 2.99, max: 6.99 }))
    const total = roundUSD(subtotal + deliveryFee)

    return {
      uadp_type: 'uadp:food_order' as const,
      id: uid('flame:order'),
      ts: tsRandom(365),
      label: `${restaurant.name} — $${total} USD`,
      status: faker.helpers.weightedArrayElement([
        { value: 'delivered' as const, weight: 0.85 },
        { value: 'cancelled' as const, weight: 0.1 },
        { value: 'in_progress' as const, weight: 0.05 },
      ]),
      restaurant,
      items: selectedItems,
      total: { value: total, currency: 'USD' },
      delivery_fee: { value: deliveryFee, currency: 'USD' },
      delivery_address: '245 Valencia St, Apt 8B, Mission District, SF',
      estimated_minutes: faker.number.int({ min: 20, max: 55 }),
    }
  }).sort((a, b) => b.ts - a.ts)

  // 12 favorite restaurants
  const favorites = restaurants.map(r => r.id)

  return { orders, restaurants, favorites }
}

// =========================================================================
// 15. ATLAS EVENTS — 500+ calendar events across 3 calendars
// =========================================================================
function generateAtlasEvents() {
  const calendars = [
    { name: 'Personal', color: '#4285F4' },
    { name: 'Work', color: '#0B8043' },
    { name: 'Fitness', color: '#D50000' },
  ]

  // Recurring work events
  const workEvents = [
    { title: 'Daily Standup', description: 'Daily dev team meeting', duration_min: 15, recurrence: 'daily' as const, hour: 10 },
    { title: 'Sprint Planning', description: 'Monday sprint planning', duration_min: 60, recurrence: 'weekly' as const, hour: 11 },
    { title: 'Code Review Session', description: 'Team code review session', duration_min: 45, recurrence: 'weekly' as const, hour: 15 },
    { title: '1:1 with Daniel', description: 'One-on-one with the tech lead', duration_min: 30, recurrence: 'weekly' as const, hour: 14 },
    { title: 'Sprint Retro', description: 'Sprint retrospective', duration_min: 60, recurrence: 'weekly' as const, hour: 16 },
  ]

  const fitnessEvents = [
    { title: 'Gym — Weights', description: 'Strength routine at GymFit Centro', duration_min: 60, recurrence: 'weekly' as const, hour: 7 },
    { title: 'Run at Golden Gate Park', description: '5K at Golden Gate Park', duration_min: 45, recurrence: 'weekly' as const, hour: 6 },
  ]

  const personalOneOff = [
    { title: 'Lunch with mom', description: 'Lunch at mom Rosa\'s house, bring dessert', hour: 14, daysFromNow: 3 },
    { title: 'Meetup Rust Bay Area', description: 'Monthly Rust community meetup in SF', hour: 19, daysFromNow: 5, location: 'WeWork SoMa, SF' },
    { title: 'Dentist appointment', description: 'Biannual dental cleaning', hour: 11, daysFromNow: 8, location: 'Dr. Ramirez Dental, Mission District' },
    { title: 'Flight to Austin', description: 'TechConf Austin 2025', hour: 7, daysFromNow: 15, location: 'SFO Terminal 2' },
    { title: 'TechConf Austin', description: 'Technology conference in Austin, talk about UADP', hour: 9, daysFromNow: 16, location: 'Austin Convention Center' },
    { title: 'Diana\'s birthday', description: 'My sister\'s birthday party', hour: 18, daysFromNow: 22, location: 'Diana\'s place, Marina' },
    { title: 'Renew passport', description: 'Post office appointment for passport renewal', hour: 9, daysFromNow: -2 },
    { title: 'Pay property tax', description: 'Last day for property tax payment with discount', hour: 10, daysFromNow: -5 },
    { title: 'Hackathon Fintech', description: '48-hour hackathon with the team', hour: 9, daysFromNow: 30, location: 'Google SF Campus' },
    { title: 'Dinner with friends', description: 'Dinner at Bistro on Valencia with the SF crew', hour: 20, daysFromNow: 1, location: 'Bistro on Valencia, Mission' },
    { title: 'Haircut', description: 'Fellow Barber appointment', hour: 12, daysFromNow: 6, location: 'Fellow Barber, Hayes Valley' },
    { title: 'Car maintenance', description: '30,000 mile maintenance service', hour: 8, daysFromNow: 12, location: 'AutoCare Express, SoMa' },
    { title: 'Doctor appointment', description: 'Annual checkup with Dr. Kim', hour: 10, daysFromNow: -15, location: 'SF Medical Center' },
    { title: 'Grocery shopping', description: 'Weekly big shopping run', hour: 11, daysFromNow: -8 },
    { title: 'Movie night', description: 'New sci-fi release at CinemaGo IMAX', hour: 20, daysFromNow: -3, location: 'CinemaGo IMAX, Metreon' },
    { title: 'Oil change', description: 'Quick oil change for the car', hour: 9, daysFromNow: -20, location: 'QuickLube SoMa' },
    { title: 'Concert at The Fillmore', description: 'Indie rock show with Andres and Camila', hour: 20, daysFromNow: 10, location: 'The Fillmore, SF' },
    { title: 'Weekend hike', description: 'Mt. Tamalpais trail with SF friends', hour: 8, daysFromNow: 14, location: 'Mt. Tamalpais' },
    { title: 'Tax filing deadline', description: 'Submit federal and state taxes', hour: 17, daysFromNow: -25 },
    { title: 'UADP demo prep', description: 'Final rehearsal for TechConf talk', hour: 15, daysFromNow: 13 },
    { title: 'Team happy hour', description: 'Friday drinks with TechCorp team', hour: 18, daysFromNow: -10, location: 'The Pub, SoMa' },
    { title: 'Apartment cleaning', description: 'Deep clean before guests arrive', hour: 10, daysFromNow: -12 },
    { title: 'Bike repair', description: 'Fix flat tire and brake adjustment', hour: 14, daysFromNow: -18, location: 'Bay Cycles, Mission' },
    { title: 'Farmers market', description: 'Saturday farmers market in Ferry Building', hour: 9, daysFromNow: -6, location: 'Ferry Building, Embarcadero' },
    { title: 'Board game night', description: 'Board games at Rodrigo\'s place', hour: 19, daysFromNow: 7, location: 'Rodrigo\'s apartment, SoMa' },
    { title: 'Photography walk', description: 'Sunset photography session', hour: 17, daysFromNow: 9, location: 'Baker Beach, SF' },
    { title: 'Volunteer event', description: 'Beach cleanup with SF Cares', hour: 9, daysFromNow: 20, location: 'Ocean Beach, SF' },
    { title: 'Cooking class', description: 'Japanese cooking workshop', hour: 18, daysFromNow: 25, location: 'Culinary Academy, SF' },
    { title: 'Eye exam', description: 'Annual eye exam and new glasses', hour: 14, daysFromNow: -30, location: 'Bay Vision, Union Square' },
    { title: 'Return Amazon package', description: 'Return faulty USB hub at UPS', hour: 12, daysFromNow: -22, location: 'UPS Store, Valencia St' },
    { title: 'Library visit', description: 'Pick up reserved tech books', hour: 16, daysFromNow: -35, location: 'SF Public Library, Civic Center' },
    { title: 'Car wash', description: 'Monthly car wash', hour: 10, daysFromNow: -40 },
    { title: 'Furniture delivery', description: 'New standing desk arrives', hour: 13, daysFromNow: -45 },
    { title: 'Lease renewal', description: 'Sign lease renewal for apartment', hour: 11, daysFromNow: -50 },
    { title: 'AWS re:Invent meetup', description: 'Local re:Invent watch party', hour: 18, daysFromNow: 35, location: 'AWS SF Office' },
    { title: 'Birthday dinner', description: 'Andres birthday celebration', hour: 20, daysFromNow: 40, location: 'Nobu, SF' },
    { title: 'Wine tasting', description: 'Napa Valley day trip with friends', hour: 10, daysFromNow: 45, location: 'Napa Valley' },
    { title: 'Home gym setup', description: 'Assemble new workout bench', hour: 14, daysFromNow: -55 },
    { title: 'Podcast recording', description: 'Guest spot on DevTalks podcast', hour: 16, daysFromNow: 50 },
    { title: 'Beach day', description: 'Relaxing day at Stinson Beach', hour: 10, daysFromNow: 55, location: 'Stinson Beach' },
    { title: 'Career coaching', description: 'Session with career coach', hour: 11, daysFromNow: -60 },
    { title: 'Piano lesson', description: 'Started learning piano', hour: 17, daysFromNow: -65, location: 'SF Music School' },
    { title: 'Camping trip', description: 'Weekend camping at Big Sur', hour: 7, daysFromNow: 60, location: 'Big Sur, CA' },
    { title: 'Immigration paperwork', description: 'Submit work visa renewal docs', hour: 10, daysFromNow: -70 },
    { title: 'Computer upgrade', description: 'Install new RAM and SSD', hour: 15, daysFromNow: -75 },
    { title: 'Potluck dinner', description: 'Neighborhood potluck event', hour: 18, daysFromNow: 65, location: 'Community Center, Mission' },
    { title: 'Thrift shopping', description: 'Vintage shopping in Haight', hour: 13, daysFromNow: -80, location: 'Haight-Ashbury, SF' },
    { title: 'Kayaking', description: 'Morning kayak on the Bay', hour: 8, daysFromNow: 70, location: 'SF Kayak Center' },
  ]

  const events: any[] = []

  // Generate recurring work events for 180 days (past 90 + future 90)
  for (const we of workEvents) {
    for (let d = -90; d <= 90; d++) {
      const date = new Date(NOW + d * ONE_DAY_MS)
      const dayOfWeek = date.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) continue // skip weekends

      if (we.recurrence === 'daily' || (we.recurrence === 'weekly' && dayOfWeek === 1)) {
        // Daily standup every workday, weekly events on Mondays
        if (we.recurrence === 'weekly' && we.title === 'Code Review Session' && dayOfWeek !== 3) continue // Wed
        if (we.recurrence === 'weekly' && we.title === '1:1 with Daniel' && dayOfWeek !== 2) continue // Tue
        if (we.recurrence === 'weekly' && we.title === 'Sprint Retro' && dayOfWeek !== 5) continue // Fri

        const startTs = Math.floor(date.setHours(we.hour, 0, 0, 0) / 1000)
        events.push({
          uadp_type: 'uadp:calendar_event',
          id: uid('atlas:event'),
          ts: startTs,
          label: we.title,
          title: we.title,
          description: we.description,
          start_ts: startTs,
          end_ts: startTs + we.duration_min * 60,
          all_day: false,
          calendar: 'Work',
          color: '#0B8043',
          recurrence: we.recurrence,
          attendees: [
            { name: 'Daniel Mora', email: 'daniel.mora@techcorp-demo.local', status: 'accepted' as const },
            { name: 'Lucia Reyes', email: 'lucia.reyes@techcorp-demo.local', status: 'accepted' as const },
            { name: 'Pablo Herrera', email: 'pablo.herrera@techcorp-demo.local', status: 'pending' as const },
          ],
        })
      }
    }
  }

  // Fitness events: Gym Mon/Wed/Fri, Running Tue/Thu
  for (let d = -90; d <= 90; d++) {
    const date = new Date(NOW + d * ONE_DAY_MS)
    const dayOfWeek = date.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) continue

    if ([1, 3, 5].includes(dayOfWeek)) {
      const fe = fitnessEvents[0] // Gym
      const startTs = Math.floor(new Date(date).setHours(fe.hour, 0, 0, 0) / 1000)
      events.push({
        uadp_type: 'uadp:calendar_event', id: uid('atlas:event'), ts: startTs,
        label: fe.title, title: fe.title, description: fe.description,
        start_ts: startTs, end_ts: startTs + fe.duration_min * 60,
        all_day: false, calendar: 'Fitness', color: '#D50000',
        recurrence: 'weekly',
      })
    }
    if ([2, 4].includes(dayOfWeek)) {
      const fe = fitnessEvents[1] // Running
      const startTs = Math.floor(new Date(date).setHours(fe.hour, 0, 0, 0) / 1000)
      events.push({
        uadp_type: 'uadp:calendar_event', id: uid('atlas:event'), ts: startTs,
        label: fe.title, title: fe.title, description: fe.description,
        start_ts: startTs, end_ts: startTs + fe.duration_min * 60,
        all_day: false, calendar: 'Fitness', color: '#D50000',
        recurrence: 'weekly',
      })
    }
  }

  // Personal one-off events
  for (const pe of personalOneOff) {
    const date = new Date(NOW + pe.daysFromNow * ONE_DAY_MS)
    const startTs = Math.floor(date.setHours(pe.hour, 0, 0, 0) / 1000)
    events.push({
      uadp_type: 'uadp:calendar_event', id: uid('atlas:event'), ts: startTs,
      label: pe.title, title: pe.title, description: pe.description,
      start_ts: startTs, end_ts: startTs + 3600,
      all_day: false, location: (pe as any).location,
      calendar: 'Personal', color: '#4285F4',
      recurrence: null,
    })
  }

  // Pad with additional personal/social events to reach 500+
  const padEventTemplates = [
    'Coffee with friend', 'Grocery run', 'Laundry', 'Read at cafe',
    'Side project work', 'YouTube recording session', 'Blog writing',
    'Budget review', 'Apartment tidy up', 'Cook meal prep',
    'Respond to emails', 'Review PRs', 'Study session', 'Meditation',
    'Call with recruiter', 'Dentist followup', 'Pharmacy run',
    'Return library books', 'Water plants', 'Update resume',
    'Research conference talks', 'Practice presentation', 'Team lunch',
    'Networking event', 'Watch tech talk', 'Update portfolio',
    'Fix personal website', 'Organize photos', 'Backup data',
    'Plan weekend trip', 'Review investments', 'Cancel subscriptions',
  ]

  while (events.length < 500) {
    const d = faker.number.int({ min: -90, max: 90 })
    const date = new Date(NOW + d * ONE_DAY_MS)
    const hour = faker.number.int({ min: 7, max: 21 })
    const startTs = Math.floor(date.setHours(hour, 0, 0, 0) / 1000)
    const durationMin = faker.helpers.arrayElement([15, 30, 45, 60, 90, 120])
    const calIdx = faker.number.int({ min: 0, max: 2 })
    events.push({
      uadp_type: 'uadp:calendar_event',
      id: uid('atlas:event'),
      ts: startTs,
      label: faker.helpers.arrayElement(padEventTemplates),
      title: faker.helpers.arrayElement(padEventTemplates),
      description: faker.lorem.sentence(),
      start_ts: startTs,
      end_ts: startTs + durationMin * 60,
      all_day: false,
      calendar: calendars[calIdx].name,
      color: calendars[calIdx].color,
      recurrence: null,
    })
  }

  events.sort((a, b) => a.start_ts - b.start_ts)

  return { events, calendars }
}

// =========================================================================
// Cross-reference: Flame and Compass charges -> Orbit transactions
// =========================================================================
let EXTRA_ORBIT_CHARGES: { ts: number; amount: number; label: string; category: string }[] = []

// =========================================================================
// Cross-reference: Market orders -> matching Orbit charges
// =========================================================================
function crossReferenceMarketToOrbit(
  orbitData: ReturnType<typeof generateOrbitTransactions>,
) {
  for (const charge of MARKET_ORDER_CHARGES) {
    orbitData.transactions.push({
      uadp_type: 'uadp:transaction',
      id: uid('orbit:tx'),
      ts: charge.ts,
      label: charge.label,
      amount: { value: charge.amount, currency: 'USD' },
      direction: 'out',
      status: 'completed',
      merchant: { name: 'MercadoMart Online', category: 'shopping', city: 'San Francisco', country: 'US' },
      balance_after: { value: roundUSD(orbitData.accounts[0].balance.value - charge.amount), currency: 'USD' },

      account_id: 'orbit:acc:checking',
    })
  }
  orbitData.transactions.sort((a, b) => b.ts - a.ts)
}

// =========================================================================
// RUN ALL GENERATORS
// =========================================================================
console.log('Cosmos Data Seed — Generating data for Alejandro Vega...\n')

const profile = generateProfile()
const novaPosts = generateNovaPosts()
const pulsePhotos = generatePulsePhotos()
const marketOrders = generateMarketOrders()       // Must run before Orbit for cross-ref
const orbitTransactions = generateOrbitTransactions()
const zincTransactions = generateZincTransactions()
const streamHistory = generateStreamHistory()
const echoConversations = generateEchoConversations()
const heraldArticles = generateHeraldArticles()
const lyraMusic = generateLyraMusic()
const vortexCatalog = generateVortexCatalog()
const beaconEmails = generateBeaconEmails()
const compassRides = generateCompassRides()
const flameOrders = generateFlameOrders()
const atlasEvents = generateAtlasEvents()

// Inject Market order charges into Orbit transactions (same dates, same amounts)
crossReferenceMarketToOrbit(orbitTransactions)

// Inject Flame and Compass charges into Orbit for temporal coherence
for (const order of flameOrders.orders) {
  if (order.status !== 'cancelled') {
    EXTRA_ORBIT_CHARGES.push({ ts: order.ts, amount: order.total.value, label: `FlameEats - ${order.restaurant.name}`, category: 'food_delivery' })
  }
}
for (const ride of compassRides.rides) {
  if (ride.status === 'completed') {
    EXTRA_ORBIT_CHARGES.push({ ts: ride.ts, amount: ride.fare.value, label: `CompassGo - ${ride.label}`, category: 'transport' })
  }
}
for (const charge of EXTRA_ORBIT_CHARGES) {
  orbitTransactions.transactions.push({
    uadp_type: 'uadp:transaction',
    id: uid('orbit:tx'),
    ts: charge.ts,
    label: charge.label,
    amount: { value: charge.amount, currency: 'USD' },
    direction: 'out',
    status: 'completed',
    merchant: { name: charge.label.split(' - ')[0], category: charge.category, city: 'San Francisco', country: 'US' },
    balance_after: { value: roundUSD(orbitTransactions.accounts[0].balance.value - charge.amount), currency: 'USD' },
    account_id: 'orbit:acc:checking',
  })
}
orbitTransactions.transactions.sort((a: any, b: any) => b.ts - a.ts)

// Also add streaming subscriptions to Orbit (Lyra monthly, Vortex monthly)
for (let month = 0; month < 3; month++) {
  const d = 5 + month * 30
  orbitTransactions.transactions.push({
    uadp_type: 'uadp:transaction',
    id: uid('orbit:tx'),
    ts: tsSecondsAgo(d, 2),
    label: 'LyraMusic Premium',
    amount: { value: 9.99, currency: 'USD' },
    direction: 'out',
    status: 'completed',
    merchant: { name: 'LyraMusic', category: 'entertainment', city: 'San Francisco', country: 'US' },
    balance_after: { value: roundUSD(orbitTransactions.accounts[0].balance.value), currency: 'USD' },
    account_id: 'orbit:acc:checking',
  })
  orbitTransactions.transactions.push({
    uadp_type: 'uadp:transaction',
    id: uid('orbit:tx'),
    ts: tsSecondsAgo(d + 1, 2),
    label: 'VortexPlay Monthly',
    amount: { value: 14.99, currency: 'USD' },
    direction: 'out',
    status: 'completed',
    merchant: { name: 'VortexPlay', category: 'entertainment', city: 'San Francisco', country: 'US' },
    balance_after: { value: roundUSD(orbitTransactions.accounts[0].balance.value), currency: 'USD' },
    account_id: 'orbit:acc:checking',
  })
}
orbitTransactions.transactions.sort((a: any, b: any) => b.ts - a.ts)

// =========================================================================
// NARRATIVE THREADS — Cross-service content alignment for AI joins
// =========================================================================
// Each thread groups items across services by topic. Items get:
//   ext.topics  — shared topic tags for AI semantic matching
//   ext.thread  — thread identifier for explicit joins
// Timestamps are aligned so related content appears close in time.
// Some new Nova posts are added that explicitly reference videos/articles.

function findByText<T extends Record<string, any>>(items: T[], ...keywords: string[]): T | undefined {
  return items.find((item) => {
    const text = `${item.body || ''} ${item.title || ''} ${item.label || ''} ${item.subject || ''}`.toLowerCase()
    return keywords.every((kw) => text.toLowerCase().includes(kw.toLowerCase()))
  })
}

function tagItems(threadId: string, topics: string[], ...items: (any | undefined)[]) {
  for (const item of items) {
    if (!item) continue
    if (!item.ext) item.ext = {}
    item.ext.thread = threadId
    item.ext.topics = topics
  }
}

// --- Thread 1: Bun Migration (90 days ago) ---
{
  const ts = tsSecondsAgo(90, 2)
  const topics = ['bun', 'nodejs', 'migration', 'performance', 'backend']

  const nova = findByText(novaPosts.user_posts, 'migrating', 'node', 'bun')
  const stream = streamHistory.user_videos.find(v => v.title.includes('Migrating from Node to Bun'))
  const herald = findByText(heraldArticles.articles, 'bun', 'revolutionize')

  if (nova) nova.ts = ts
  if (stream) stream.ts = ts - 3600 // video 1hr before tweet
  if (herald) herald.ts = ts - 86400 * 2 // article 2 days before

  tagItems('bun_migration', topics, nova, stream, herald)

  // New tweet referencing video and article
  novaPosts.user_posts.push({
    uadp_type: 'uadp:post' as const,
    id: uid('nova:post'),
    ts: ts + 7200,
    label: 'My video about migrating from Node to Bun is up',
    body: 'My video about migrating from Node to Bun in production is up on my Stream channel. Throughput 3x, memory -40%. If you haven\'t seen it, the Herald article about Bun 2.0 gives good context.',
    author: ALEJANDRO_AUTHOR,
    likes: faker.number.int({ min: 40, max: 200 }),
    reposts: faker.number.int({ min: 5, max: 40 }),
    replies_count: faker.number.int({ min: 10, max: 50 }),
    lang: 'en',
    tags: ['bun', 'nodejs', 'stream', 'migration'],
    ext: { thread: 'bun_migration', topics },
  })
}

// --- Thread 2: Elysia WebSockets (150 days ago) ---
{
  const ts = tsSecondsAgo(150, 2)
  const topics = ['elysia', 'websockets', 'bun', 'realtime', 'tutorial']

  const nova = findByText(novaPosts.user_posts, 'deployed', 'bun', 'elysia')
  const stream = streamHistory.user_videos.find(v => v.title.includes('real-time chat with Elysia'))
  const herald = findByText(heraldArticles.articles, 'alternative runtimes') || findByText(heraldArticles.articles, 'runtimes')

  if (nova) nova.ts = ts + 86400
  if (stream) stream.ts = ts
  if (herald) herald.ts = ts - 86400 * 3

  tagItems('elysia_realtime', topics, nova, stream, herald)

  novaPosts.user_posts.push({
    uadp_type: 'uadp:post' as const,
    id: uid('nova:post'),
    ts: ts + 86400 * 2,
    label: 'WebSockets tutorial with Elysia on my Stream channel',
    body: 'Published the tutorial on how to build a real-time chat with Elysia and WebSockets. The native Bun integration makes it ridiculously fast. Link on my Stream profile.',
    author: ALEJANDRO_AUTHOR,
    likes: faker.number.int({ min: 30, max: 150 }),
    reposts: faker.number.int({ min: 3, max: 25 }),
    replies_count: faker.number.int({ min: 5, max: 35 }),
    lang: 'en',
    tags: ['elysia', 'websockets', 'bun', 'stream', 'tutorial'],
    ext: { thread: 'elysia_realtime', topics },
  })
}

// --- Thread 3: Dev Setup 2025 (45 days ago) ---
{
  const ts = tsSecondsAgo(45, 2)
  const topics = ['setup', 'productivity', 'tools', 'dev', 'hardware']

  const nova = findByText(novaPosts.user_posts, 'current setup')
  const stream = streamHistory.user_videos.find(v => v.title.includes('dev setup'))
  const pulse = findByText(pulsePhotos.user_posts, 'setup', 'desk')

  if (nova) nova.ts = ts
  if (stream) stream.ts = ts - 3600
  if (pulse) pulse.ts = ts + 1800

  tagItems('dev_setup_2025', topics, nova, stream, pulse)

  // Find an electronics Market order and link it
  const marketOrder = marketOrders.orders.find(o =>
    o.items.some((it: any) => it.title?.toLowerCase().includes('monitor') || it.title?.toLowerCase().includes('teclado') || it.title?.toLowerCase().includes('audifonos'))
  )
  if (marketOrder) {
    marketOrder.ts = ts - 86400 * 5 // purchased 5 days before setup video
    tagItems('dev_setup_2025', topics, marketOrder)
  }

  novaPosts.user_posts.push({
    uadp_type: 'uadp:post' as const,
    id: uid('nova:post'),
    ts: ts + 3600,
    label: 'New video: tour of my 2025 dev setup',
    body: 'Uploaded the tour video of my new setup to Stream. After buying the new monitor on MercadoMart and reorganizing everything, it looks incredible. Also posted photos on Pulse.',
    author: ALEJANDRO_AUTHOR,
    likes: faker.number.int({ min: 50, max: 250 }),
    reposts: faker.number.int({ min: 5, max: 30 }),
    replies_count: faker.number.int({ min: 15, max: 60 }),
    lang: 'en',
    tags: ['setup', 'dev', 'stream', 'pulse', 'productivity'],
    ext: { thread: 'dev_setup_2025', topics },
  })
}

// --- Thread 4: WebAssembly (60 days ago) ---
{
  const ts = tsSecondsAgo(60, 2)
  const topics = ['webassembly', 'wasm', 'browser', 'performance', 'web']

  const nova = findByText(novaPosts.user_posts, 'webassembly')
  const herald = findByText(heraldArticles.articles, 'webassembly', 'consolidates')
  const streamVid = findByText(streamHistory.feed, 'webassembly')

  if (nova) nova.ts = ts
  if (herald) herald.ts = ts - 86400 * 3
  if (streamVid) streamVid.ts = ts - 86400

  tagItems('webassembly_future', topics, nova, herald, streamVid)

  novaPosts.user_posts.push({
    uadp_type: 'uadp:post' as const,
    id: uid('nova:post'),
    ts: ts + 3600,
    label: 'WebAssembly is the future, and Herald has a great article',
    body: 'Just watched a great video about WebAssembly on Stream and read the Herald article about how it consolidates as the future of the browser. Increasingly convinced that WASM is going to change everything.',
    author: ALEJANDRO_AUTHOR,
    likes: faker.number.int({ min: 20, max: 120 }),
    reposts: faker.number.int({ min: 2, max: 20 }),
    replies_count: faker.number.int({ min: 5, max: 30 }),
    lang: 'en',
    tags: ['webassembly', 'wasm', 'web', 'stream', 'herald'],
    ext: { thread: 'webassembly_future', topics },
  })
}

// --- Thread 5: Rust Bay Area Community (recent, ~5 days ago) ---
{
  const ts = tsSecondsAgo(5, 2)
  const topics = ['rust', 'bayarea', 'meetup', 'community', 'programming']

  const nova = findByText(novaPosts.user_posts, 'rust', 'bay area', 'growing')
  const herald = findByText(heraldArticles.articles, 'rust', 'loved')
  const streamVid = findByText(streamHistory.feed, 'rust')
  const atlasEvent = atlasEvents.events.find((e: any) => e.title?.includes('Meetup Rust'))
  const beaconEmail = findByText(beaconEmails.emails, 'meetup', 'rust')

  if (nova) nova.ts = ts
  if (herald) herald.ts = ts - 86400 * 7
  if (streamVid) streamVid.ts = ts - 86400 * 2
  if (beaconEmail) beaconEmail.ts = ts - 86400 * 3

  tagItems('rust_bayarea', topics, nova, herald, streamVid, atlasEvent, beaconEmail)

  novaPosts.user_posts.push({
    uadp_type: 'uadp:post' as const,
    id: uid('nova:post'),
    ts: ts + 3600,
    label: 'Rust Bay Area meetup this week, don\'t miss it',
    body: 'This week is the Rust Bay Area meetup here in SF. Watched a great video on Stream about Rust vs Go and Herald published that Rust is the most loved language for the fifth year. The community here keeps growing. See you there!',
    author: ALEJANDRO_AUTHOR,
    likes: faker.number.int({ min: 60, max: 300 }),
    reposts: faker.number.int({ min: 10, max: 50 }),
    replies_count: faker.number.int({ min: 20, max: 70 }),
    lang: 'en',
    tags: ['rust', 'meetup', 'bayarea', 'sf', 'community'],
    ext: { thread: 'rust_bayarea', topics },
  })
}

// --- Thread 6: AI & Agents (30 days ago) ---
{
  const ts = tsSecondsAgo(30, 2)
  const topics = ['ai', 'llm', 'agents', 'ai', 'development']

  const nova = findByText(novaPosts.user_posts, 'llm', 'agents')
  const herald1 = findByText(heraldArticles.articles, 'generative ai', 'transforming')
  const herald2 = findByText(heraldArticles.articles, 'era of ai agents')
  const novaAnthrotek = findByText(novaPosts.user_posts, 'anthrotek')

  if (nova) nova.ts = ts
  if (herald1) herald1.ts = ts - 86400 * 5
  if (herald2) herald2.ts = ts - 86400 * 2
  if (novaAnthrotek) { novaAnthrotek.ts = ts + 86400; }

  tagItems('ai_agents_era', topics, nova, herald1, herald2, novaAnthrotek)

  novaPosts.user_posts.push({
    uadp_type: 'uadp:post' as const,
    id: uid('nova:post'),
    ts: ts + 86400 * 2,
    label: 'Thread: my notes on AI agents and LLMs',
    body: 'After reading both Herald articles about generative AI and the era of agents, and trying the Anthrotek API for pair programming, I\'m convinced that agents are going to be the next big leap. Thread with my notes 🧵',
    author: ALEJANDRO_AUTHOR,
    likes: faker.number.int({ min: 80, max: 400 }),
    reposts: faker.number.int({ min: 20, max: 80 }),
    replies_count: faker.number.int({ min: 30, max: 100 }),
    lang: 'en',
    tags: ['ai', 'llm', 'agents', 'herald', 'anthrotek'],
    ext: { thread: 'ai_agents_era', topics },
  })
}

// --- Thread 7: Open Source Bay Area (40 days ago) ---
{
  const ts = tsSecondsAgo(40, 2)
  const topics = ['opensource', 'bayarea', 'community', 'contribution', 'code']

  const nova = findByText(novaPosts.user_posts, 'open source', 'bay area')
  const herald = findByText(heraldArticles.articles, 'open source', 'record')
  const streamVid = findByText(streamHistory.feed, 'open source')

  if (nova) nova.ts = ts
  if (herald) herald.ts = ts - 86400 * 4
  if (streamVid) streamVid.ts = ts - 86400

  tagItems('opensource_bayarea', topics, nova, herald, streamVid)
}

// --- Thread 8: Linux Daily Driver (50 days ago) ---
{
  const ts = tsSecondsAgo(50, 2)
  const topics = ['linux', 'development', 'devtools', 'system', 'productivity']

  const nova = findByText(novaPosts.user_posts, 'linux', 'daily driver')
  const herald = findByText(heraldArticles.articles, 'linux', 'turns')
  const streamVid = findByText(streamHistory.feed, 'linux tips')

  if (nova) nova.ts = ts
  if (herald) herald.ts = ts - 86400 * 10
  if (streamVid) streamVid.ts = ts + 86400 * 2

  tagItems('linux_daily', topics, nova, herald, streamVid)

  novaPosts.user_posts.push({
    uadp_type: 'uadp:post' as const,
    id: uid('nova:post'),
    ts: ts + 3600,
    label: 'Six months on Linux and found a great tips video',
    body: 'Six months with Linux as a daily driver and I\'m not going back. Watched an excellent video on Stream with Linux tips for devs, and Herald published a great article for Linux\'s 34th anniversary. Highly recommend both.',
    author: ALEJANDRO_AUTHOR,
    likes: faker.number.int({ min: 30, max: 150 }),
    reposts: faker.number.int({ min: 3, max: 20 }),
    replies_count: faker.number.int({ min: 8, max: 40 }),
    lang: 'en',
    tags: ['linux', 'dev', 'stream', 'herald'],
    ext: { thread: 'linux_daily', topics },
  })
}

// --- Thread 9: TypeScript (20 days ago) ---
{
  const ts = tsSecondsAgo(20, 2)
  const topics = ['typescript', 'types', 'javascript', 'language']

  const nova = findByText(novaPosts.user_posts, 'typescript', '5.4')
  const herald = findByText(heraldArticles.articles, 'typescript', '5.5')
  const rustBlog = findByText(novaPosts.user_posts, 'rust', 'better', 'typescript')

  if (nova) nova.ts = ts
  if (herald) herald.ts = ts - 86400
  if (rustBlog) rustBlog.ts = ts + 86400 * 3

  tagItems('typescript_evolution', topics, nova, herald, rustBlog)
}

// --- Thread 10: Hackathon Fintech (upcoming, ~30 days from now) ---
{
  const topics = ['hackathon', 'fintech', 'rust', 'cli', 'event']

  const nova = findByText(novaPosts.user_posts, 'hackathon', 'cli', 'rust')
  const atlasEvent = atlasEvents.events.find((e: any) => e.title?.includes('Hackathon'))
  const beaconEmail = findByText(beaconEmails.emails, 'conf tech')
  const heraldFintech = findByText(heraldArticles.articles, 'venture capital') || findByText(heraldArticles.articles, 'fintech')

  tagItems('hackathon_fintech', topics, nova, atlasEvent, beaconEmail, heraldFintech)
}

// --- Thread 11: Coffee and Code (7 days ago) ---
{
  const ts = tsSecondsAgo(7, 2)
  const topics = ['coffee', 'sf', 'hayesvalley', 'work', 'remote']

  const nova = findByText(novaPosts.user_posts, 'blue bottle')
  const novaSf = findByText(novaPosts.user_posts, 'sf', 'fog', 'coffee')
  const pulse = findByText(pulsePhotos.user_posts, 'blue bottle')
  const compassPlace = compassRides.saved_places?.find((p: any) => p.name?.includes('Blue Bottle') || p.label?.includes('Blue Bottle'))

  if (nova) nova.ts = ts
  if (novaSf) novaSf.ts = ts - 86400
  if (pulse) pulse.ts = ts + 1800

  tagItems('coffee_code', topics, nova, novaSf, pulse, compassPlace)
}

// --- Thread 12: Austin Tech Trip (15 days from now) ---
{
  const topics = ['austin', 'conference', 'tech', 'trip', 'uadp']

  const novaAustin = findByText(novaPosts.user_posts, 'austin', 'tech')
  const atlasFlight = atlasEvents.events.find((e: any) => e.title?.includes('Flight to Austin'))
  const atlasConf = atlasEvents.events.find((e: any) => e.title?.includes('TechConf Austin'))
  const beaconFlight = findByText(beaconEmails.emails, 'flight', 'austin')
  const beaconConf = findByText(beaconEmails.emails, 'techconf')
  const heraldAustin = findByText(heraldArticles.articles, 'germany') || findByText(heraldArticles.articles, 'startup')

  tagItems('austin_tech_trip', topics, novaAustin, atlasFlight, atlasConf, beaconFlight, beaconConf, heraldAustin)

  novaPosts.user_posts.push({
    uadp_type: 'uadp:post' as const,
    id: uid('nova:post'),
    ts: tsSecondsAgo(2, 1),
    label: 'In two weeks I\'ll be at TechConf Austin',
    body: 'In two weeks I\'m heading to Austin for TechConf Austin 2025. I\'ll be giving a talk about UADP and how we\'re building the protocol. Anyone else going?',
    author: ALEJANDRO_AUTHOR,
    likes: faker.number.int({ min: 40, max: 200 }),
    reposts: faker.number.int({ min: 8, max: 35 }),
    replies_count: faker.number.int({ min: 15, max: 50 }),
    lang: 'en',
    tags: ['austin', 'conference', 'tech', 'uadp'],
    ext: { thread: 'austin_tech_trip', topics },
  })
}

// --- Thread 13: Homelab & Kubernetes (35 days ago) ---
{
  const ts = tsSecondsAgo(35, 2)
  const topics = ['homelab', 'kubernetes', 'infrastructure', 'arm', 'devops']

  const nova = findByText(novaPosts.user_posts, 'homelab', 'kubernetes')
  const herald = findByText(heraldArticles.articles, 'kubernetes')
  const streamVid = findByText(streamHistory.feed, 'homelab') || findByText(streamHistory.feed, 'containers')

  if (nova) nova.ts = ts
  if (herald) herald.ts = ts - 86400 * 8
  if (streamVid) streamVid.ts = ts - 86400 * 2

  tagItems('homelab_k8s', topics, nova, herald, streamVid)
}

// --- Thread 14: Compra y review de audífonos (25 days ago) ---
{
  const ts = tsSecondsAgo(25, 2)
  const topics = ['headphones', 'review', 'purchase', 'productivity', 'hardware']

  const streamVid = findByText(streamHistory.feed, 'headphones')

  if (streamVid) streamVid.ts = ts

  // Find a Market order with electronics and link it
  const marketElectronics = marketOrders.orders.find(o =>
    o.status === 'delivered' &&
    o.items.some((it: any) => {
      const t = (it.title || '').toLowerCase()
      return t.includes('headphone') || t.includes('earbuds') || t.includes('prosound')
    })
  )
  if (marketElectronics) {
    marketElectronics.ts = ts - 86400 * 7 // purchased a week before review
    tagItems('headphones_review', topics, marketElectronics)
  }

  tagItems('headphones_review', topics, streamVid)

  novaPosts.user_posts.push({
    uadp_type: 'uadp:post' as const,
    id: uid('nova:post'),
    ts: ts + 86400,
    label: 'Review of my new headphones for coding',
    body: 'Watched the review on Stream of the best headphones for coding and decided to buy some on MercadoMart. One week later, I confirm: noise cancellation is essential for focus. Full review on my channel.',
    author: ALEJANDRO_AUTHOR,
    likes: faker.number.int({ min: 25, max: 130 }),
    reposts: faker.number.int({ min: 2, max: 15 }),
    replies_count: faker.number.int({ min: 8, max: 35 }),
    lang: 'en',
    tags: ['headphones', 'review', 'stream', 'market', 'productivity'],
    ext: { thread: 'headphones_review', topics },
  })
}

// --- Thread 15: Food & Social (3 days ago) ---
{
  const ts = tsSecondsAgo(3, 1)
  const topics = ['food', 'friends', 'sf', 'social', 'mission']

  const novaFood = findByText(novaPosts.user_posts, 'lunch', 'mission')
  const pulseFood = findByText(pulsePhotos.user_posts, 'burrito', 'mission')
  const atlasEvent = atlasEvents.events.find((e: any) => e.title?.includes('Dinner with friends'))

  // Find a recent Flame order (tacos/mexican)
  const flameOrder = flameOrders.orders.find((o: any) => o.restaurant?.cuisine === 'Mexican' && o.status === 'delivered')

  if (novaFood) novaFood.ts = ts
  if (pulseFood) pulseFood.ts = ts + 600
  if (flameOrder) flameOrder.ts = ts - 86400

  tagItems('food_social', topics, novaFood, pulseFood, atlasEvent, flameOrder)
}

// --- Thread 16: MacBook Pro M5 — Research, Purchase, Unboxing (10 days ago) ---
// Real YouTube video links for rendering in Astral
{
  const purchaseTs = tsSecondsAgo(10, 2)
  const researchTs = tsSecondsAgo(18, 2) // started researching 18 days ago
  const topics = ['macbook', 'm5', 'laptop', 'apple', 'hardware', 'developer', 'purchase']

  // --- Real YouTube videos Alejandro watched while researching ---
  const macbookVideos = [
    {
      uadp_type: 'uadp:video' as const,
      id: uid('stream:vid'),
      ts: researchTs,
      label: 'M5 Max MacBook Pro (2026): OVERKILL?',
      title: 'M5 Max MacBook Pro (2026): OVERKILL?',
      description: 'MKBHD reviews the M5 Max MacBook Pro — performance benchmarks, real-world tests, and whether Apple\'s Fusion Architecture is overkill for most users.',
      channel: { id: 'stream:ch:mkbhd', name: 'MKBHD', subscribers: 19_700_000 },
      duration_seconds: 1020,
      views: 4_200_000,
      likes: 142_000,
      thumbnail_url: `https://img.youtube.com/vi/dSCF648wk1U/maxresdefault.jpg`,
      youtube_url: 'https://www.youtube.com/watch?v=dSCF648wk1U',
      tags: ['macbook', 'm5', 'apple', 'review', 'laptop'],
      ext: { thread: 'macbook_m5_purchase', topics },
    },
    {
      uadp_type: 'uadp:video' as const,
      id: uid('stream:vid'),
      ts: researchTs + 86400,
      label: 'Apple\'s M5 Max is INSANE!',
      title: 'Apple\'s M5 Max is INSANE!',
      description: 'Dave2D covers Apple\'s M5 Max chip — Fusion Architecture performance, real-world battery life, and why this might be the biggest generational leap yet.',
      channel: { id: 'stream:ch:dave2d', name: 'Dave2D', subscribers: 3_800_000 },
      duration_seconds: 780,
      views: 2_100_000,
      likes: 78_000,
      thumbnail_url: `https://img.youtube.com/vi/xDHZ1bEEeUI/maxresdefault.jpg`,
      youtube_url: 'https://www.youtube.com/watch?v=xDHZ1bEEeUI',
      tags: ['macbook', 'm5', 'apple', 'review', 'laptop'],
      ext: { thread: 'macbook_m5_purchase', topics },
    },
    {
      uadp_type: 'uadp:video' as const,
      id: uid('stream:vid'),
      ts: researchTs + 86400 * 2,
      label: '2026 MacBook Pro with M5 Pro & M5 Max - Big EXPECTATIONS!',
      title: '2026 MacBook Pro with M5 Pro & M5 Max - Big EXPECTATIONS!',
      description: 'Max Tech puts the M5 Pro and M5 Max through their paces. Benchmarks, thermal testing, export times, and real-world developer workflows compared.',
      channel: { id: 'stream:ch:maxtech', name: 'Max Tech', subscribers: 1_400_000 },
      duration_seconds: 1440,
      views: 1_800_000,
      likes: 52_000,
      thumbnail_url: `https://img.youtube.com/vi/CbGdf2jW4JY/maxresdefault.jpg`,
      youtube_url: 'https://www.youtube.com/watch?v=CbGdf2jW4JY',
      tags: ['macbook', 'm5', 'apple', 'comparison', 'benchmark'],
      ext: { thread: 'macbook_m5_purchase', topics },
    },
    {
      uadp_type: 'uadp:video' as const,
      id: uid('stream:vid'),
      ts: researchTs + 86400 * 3,
      label: 'M5 Pro/Max are HERE - Apple just KILLED Windows!',
      title: 'M5 Pro/Max are HERE - Apple just KILLED Windows!',
      description: 'In-depth look at the M5 Pro and M5 Max chips — Fusion Architecture benchmarks and why Windows laptops can\'t compete.',
      channel: { id: 'stream:ch:macrumors', name: 'MacRumors', subscribers: 820_000 },
      duration_seconds: 900,
      views: 950_000,
      likes: 31_000,
      thumbnail_url: `https://img.youtube.com/vi/jRxHH56sehc/maxresdefault.jpg`,
      youtube_url: 'https://www.youtube.com/watch?v=jRxHH56sehc',
      tags: ['macbook', 'm5', 'apple', 'review'],
      ext: { thread: 'macbook_m5_purchase', topics },
    },
    {
      uadp_type: 'uadp:video' as const,
      id: uid('stream:vid'),
      ts: researchTs - 86400,
      label: 'MacBook Pro M5 Review — MacRumors',
      title: 'MacBook Pro M5 Review — MacRumors',
      description: 'MacRumors full review of the MacBook Pro M5 — Fusion Architecture, Thunderbolt 5, and everything new in the 2026 lineup.',
      channel: { id: 'stream:ch:wylsacom', name: 'Wylsacom', subscribers: 11_300_000 },
      duration_seconds: 1260,
      views: 3_500_000,
      likes: 95_000,
      thumbnail_url: `https://img.youtube.com/vi/gWii2NItLo4/maxresdefault.jpg`,
      youtube_url: 'https://www.youtube.com/watch?v=gWii2NItLo4',
      tags: ['macbook', 'm5', 'apple', 'review'],
      ext: { thread: 'macbook_m5_purchase', topics },
    },
  ]

  // Inject videos into Stream feed + history (he watched them all)
  for (const vid of macbookVideos) {
    streamHistory.feed.push(vid)
    streamHistory.history.push({
      ...vid,
      watched_seconds: vid.duration_seconds, // watched fully
      watched_at: vid.ts + 3600,
    })
  }

  // --- Market: MacBook Pro M5 Pro purchase ---
  const macbookProduct = {
    uadp_type: 'uadp:product' as const,
    id: uid('market:product'),
    title: 'MacBook Pro 14" M5 Pro — 24GB RAM / 1TB SSD — Space Black',
    description: 'Apple MacBook Pro 14-inch with M5 Pro chip, Fusion Architecture, 16-core CPU, 22-core GPU, 24GB unified memory, 1TB SSD, Liquid Retina XDR display, Thunderbolt 5, MagSafe.',
    price: { value: 2499, currency: 'USD' },
    category: 'Electronics',
    image_url: picsum('macbook_m5_pro', 800, 800),
    rating: 4.9,
    reviews_count: 1847,
  }
  marketOrders.products.push(macbookProduct)

  const macbookOrder = {
    uadp_type: 'uadp:order' as const,
    id: uid('market:order'),
    ts: purchaseTs,
    label: 'Order #1025 — MacBook Pro M5 Pro',
    status: 'delivered',
    total: { value: 2499, currency: 'USD' },
    items: [{
      product_id: macbookProduct.id,
      title: macbookProduct.title,
      qty: 1,
      unit_price: macbookProduct.price,
      image_url: macbookProduct.image_url,
    }],
    shipping_address: {
      street: '245 Valencia St, Apt 8B',
      city: 'San Francisco',
      state: 'CA',
      zip: '94110',
    },
    tracking_number: `TRK${faker.string.alphanumeric(12).toUpperCase()}`,
    ext: { thread: 'macbook_m5_purchase', topics },
  }
  marketOrders.orders.unshift(macbookOrder)

  // --- Orbit: Matching bank charge ---
  const macbookOrbitTx = {
    uadp_type: 'uadp:transaction',
    id: uid('orbit:tx'),
    ts: purchaseTs,
    label: 'MercadoMart - Order #1025 MacBook Pro',
    amount: { value: 2499, currency: 'USD' },
    direction: 'out' as const,
    status: 'completed',
    merchant: { name: 'MercadoMart Online', category: 'electronics', city: 'San Francisco', country: 'US' },
    balance_after: { value: roundUSD(orbitTransactions.accounts[0].balance.value - 2499), currency: 'USD' },
    account_id: 'orbit:acc:checking',
    ext: { thread: 'macbook_m5_purchase', topics },
  }
  orbitTransactions.transactions.push(macbookOrbitTx)

  // --- Beacon: Order confirmation + shipping emails ---
  const orderConfirmEmail = {
    uadp_type: 'uadp:email' as const,
    id: uid('beacon:email'),
    ts: purchaseTs + 60,
    label: 'Order confirmed: MacBook Pro 14" M5 Pro — MercadoMart',
    subject: 'Order confirmed: MacBook Pro 14" M5 Pro — MercadoMart',
    from: { name: 'MercadoMart', address: 'orders@mercadomart-demo.local' },
    to: [{ name: ALEJANDRO.name, address: ALEJANDRO.email }],
    body_text: 'Hi Alejandro, your order #1025 has been confirmed. MacBook Pro 14" M5 Pro — 24GB RAM / 1TB SSD — Space Black. Total: $2,499.00 USD. Estimated delivery: 3-5 business days.',
    folder: 'inbox' as const,
    read: true,
    starred: true,
    attachments: undefined,
    ext: { thread: 'macbook_m5_purchase', topics },
  }
  const deliveryEmail = {
    uadp_type: 'uadp:email' as const,
    id: uid('beacon:email'),
    ts: purchaseTs + 86400 * 3,
    label: 'Your MacBook Pro has been delivered! — MercadoMart',
    subject: 'Your MacBook Pro has been delivered! — MercadoMart',
    from: { name: 'MercadoMart', address: 'orders@mercadomart-demo.local' },
    to: [{ name: ALEJANDRO.name, address: ALEJANDRO.email }],
    body_text: 'Great news! Your order #1025 (MacBook Pro 14" M5 Pro) has been delivered to 245 Valencia St, Apt 8B. Enjoy your new laptop!',
    folder: 'inbox' as const,
    read: true,
    starred: false,
    attachments: undefined,
    ext: { thread: 'macbook_m5_purchase', topics },
  }
  beaconEmails.emails.push(orderConfirmEmail, deliveryEmail)

  // --- Nova: Tweets about researching, buying, and unboxing ---
  const researchTweet = {
    uadp_type: 'uadp:post' as const,
    id: uid('nova:post'),
    ts: researchTs + 86400 * 2,
    label: 'Been binge-watching MacBook M5 reviews on Stream',
    body: 'Been binge-watching MacBook M5 Pro reviews on Stream all week. MKBHD, Dave2D, and Max Tech all say the same thing — the M5 Pro with Fusion Architecture is the sweet spot for devs. 16-core CPU and 22-core GPU crushes everything. I think I\'m convinced.',
    author: ALEJANDRO_AUTHOR,
    likes: faker.number.int({ min: 30, max: 180 }),
    reposts: faker.number.int({ min: 3, max: 25 }),
    replies_count: faker.number.int({ min: 10, max: 45 }),
    lang: 'en',
    tags: ['macbook', 'm5', 'apple', 'stream', 'review', 'dev'],
    ext: { thread: 'macbook_m5_purchase', topics },
  }
  const purchaseTweet = {
    uadp_type: 'uadp:post' as const,
    id: uid('nova:post'),
    ts: purchaseTs + 3600,
    label: 'Just pulled the trigger — MacBook Pro M5 Pro ordered',
    body: 'Just pulled the trigger on a MacBook Pro 14" M5 Pro, 24GB / 1TB in Space Black from MercadoMart. $2,499 USD — not cheap but after watching every review on Stream and reading the Herald article about M5 benchmarks, I\'m all in. Fusion Architecture is real.',
    author: ALEJANDRO_AUTHOR,
    likes: faker.number.int({ min: 60, max: 350 }),
    reposts: faker.number.int({ min: 10, max: 50 }),
    replies_count: faker.number.int({ min: 25, max: 80 }),
    lang: 'en',
    tags: ['macbook', 'm5', 'apple', 'market', 'upgrade'],
    ext: { thread: 'macbook_m5_purchase', topics },
  }
  const unboxingTweet = {
    uadp_type: 'uadp:post' as const,
    id: uid('nova:post'),
    ts: purchaseTs + 86400 * 3 + 7200,
    label: 'MacBook M5 Pro just arrived — first impressions are insane',
    body: 'MacBook M5 Pro just arrived from MercadoMart. First impressions: the Space Black finish is gorgeous, Thunderbolt 5 is blazing, and `bun install` on our monorepo went from 12s to 3s. Photos on Pulse. This machine is a beast.',
    author: ALEJANDRO_AUTHOR,
    likes: faker.number.int({ min: 80, max: 400 }),
    reposts: faker.number.int({ min: 15, max: 60 }),
    replies_count: faker.number.int({ min: 30, max: 90 }),
    lang: 'en',
    tags: ['macbook', 'm5', 'apple', 'unboxing', 'pulse', 'dev'],
    ext: { thread: 'macbook_m5_purchase', topics },
  }
  const setupTweet = {
    uadp_type: 'uadp:post' as const,
    id: uid('nova:post'),
    ts: purchaseTs + 86400 * 5,
    label: 'One week with the M5 Pro — here\'s what surprised me',
    body: 'One week with the MacBook Pro M5 Pro. Docker builds are 3x faster, battery lasts through a full workday + coffee shop session, and I can run a 13B parameter LLM locally for pair programming. 16-core CPU is no joke. Best dev machine I\'ve ever owned.',
    author: ALEJANDRO_AUTHOR,
    likes: faker.number.int({ min: 50, max: 250 }),
    reposts: faker.number.int({ min: 8, max: 35 }),
    replies_count: faker.number.int({ min: 15, max: 55 }),
    lang: 'en',
    tags: ['macbook', 'm5', 'apple', 'dev', 'review', 'productivity'],
    ext: { thread: 'macbook_m5_purchase', topics },
  }
  novaPosts.user_posts.push(researchTweet, purchaseTweet, unboxingTweet, setupTweet)

  // --- Pulse: Unboxing photos ---
  pulsePhotos.user_posts.push({
    uadp_type: 'uadp:media_post' as const,
    id: uid('pulse:post'),
    ts: purchaseTs + 86400 * 3 + 3600,
    label: 'New MacBook Pro M5 Pro unboxing',
    body: 'New MacBook Pro M5 Pro in Space Black just arrived. This thing is beautiful. Setup time! 💻',
    author: ALEJANDRO_AUTHOR,
    media_url: picsum('macbook_m5_unboxing', 1080, 1080),
    thumbnail_url: picsum('macbook_m5_unboxing', 300, 300),
    likes: faker.number.int({ min: 50, max: 300 }),
    reposts: faker.number.int({ min: 5, max: 30 }),
    replies_count: faker.number.int({ min: 15, max: 60 }),
    lang: 'en',
    tags: ['macbook', 'm5', 'apple', 'unboxing', 'setup', 'tech'],
    ext: { thread: 'macbook_m5_purchase', topics },
  })

  // --- Herald: Tag existing tech article about M5/laptops ---
  const heraldM5 = findByText(heraldArticles.articles, 'bun', 'revolutionize') ||
                   findByText(heraldArticles.articles, 'best laptop') ||
                   heraldArticles.articles.find((a: any) => a.category === 'Technology')
  if (heraldM5) {
    tagItems('macbook_m5_purchase', topics, heraldM5)
  }

  // --- Echo: Messages about the laptop in work chat ---
  const workConvo = echoConversations.conversations.find((c: any) => c.name === 'Work Devs')
  if (workConvo) {
    const workMsgs = echoConversations.messages[workConvo.id]
    if (workMsgs) {
      workMsgs.push(
        {
          uadp_type: 'uadp:message' as const,
          id: uid('echo:msg'),
          conversation_id: workConvo.id,
          body: 'Just ordered an M5 Pro MacBook. Anyone else upgraded yet?',
          author: { id: ALEJANDRO.id, name: ALEJANDRO.name },
          ts: purchaseTs + 7200,
          read: true,
        },
        {
          uadp_type: 'uadp:message' as const,
          id: uid('echo:msg'),
          conversation_id: workConvo.id,
          body: 'Nice! I have the M5 Max — you\'re going to love it. Docker and Xcode fly on Fusion Architecture.',
          author: { id: 'user:daniel_mora', name: 'Daniel Mora' },
          ts: purchaseTs + 7500,
          read: true,
        }
      )
    }
  }
}

// --- Also add ext.topics to financial cross-refs for better AI matching ---

// Market orders → Orbit: tag matching transactions
for (const order of marketOrders.orders) {
  if (order.status === 'cancelled') continue
  if (!order.ext) order.ext = {}
  order.ext.topics = [...(order.ext.topics || []), 'purchase', 'mercadomart', 'expense']

  // Find matching Orbit tx by label
  const orbitTx = orbitTransactions.transactions.find(
    (tx: any) => tx.label?.includes('MercadoMart') && Math.abs(tx.ts - order.ts) < 86400
  )
  if (orbitTx) {
    if (!orbitTx.ext) orbitTx.ext = {}
    orbitTx.ext.topics = ['purchase', 'mercadomart', 'expense']
  }
}

// Flame orders → Orbit
for (const order of flameOrders.orders) {
  if (order.status === 'cancelled') continue
  if (!order.ext) order.ext = {}
  order.ext.topics = [...(order.ext.topics || []), 'food', 'delivery', 'expense']

  const orbitTx = orbitTransactions.transactions.find(
    (tx: any) => tx.label?.includes('FlameEats') && Math.abs(tx.ts - order.ts) < 86400
  )
  if (orbitTx) {
    if (!orbitTx.ext) orbitTx.ext = {}
    orbitTx.ext.topics = ['food', 'delivery', 'expense']
  }
}

// Compass rides → Orbit
for (const ride of compassRides.rides) {
  if (ride.status !== 'completed') continue
  if (!ride.ext) ride.ext = {}
  ride.ext.topics = [...(ride.ext.topics || []), 'transport', 'trip', 'expense']

  const orbitTx = orbitTransactions.transactions.find(
    (tx: any) => tx.label?.includes('CompassGo') && Math.abs(tx.ts - ride.ts) < 86400
  )
  if (orbitTx) {
    if (!orbitTx.ext) orbitTx.ext = {}
    orbitTx.ext.topics = ['transport', 'trip', 'expense']
  }
}

// Lyra/Vortex subscriptions → Orbit
for (const tx of orbitTransactions.transactions) {
  if (tx.label?.includes('LyraMusic')) {
    if (!tx.ext) tx.ext = {}
    tx.ext.topics = ['music', 'subscription', 'entertainment']
  }
  if (tx.label?.includes('VortexPlay')) {
    if (!tx.ext) tx.ext = {}
    tx.ext.topics = ['movies', 'subscription', 'entertainment']
  }
}

// Re-sort Nova posts after injections
novaPosts.user_posts.sort((a: any, b: any) => b.ts - a.ts)
novaPosts.feed.sort((a: any, b: any) => b.ts - a.ts)

console.log('Writing JSON files to data/alejandro/:\n')

save('profile', profile)
save('nova-posts', novaPosts)
save('pulse-photos', pulsePhotos)
save('orbit-transactions', orbitTransactions)
save('zinc-transactions', zincTransactions)
save('market-orders', marketOrders)
save('stream-history', streamHistory)
save('echo-conversations', echoConversations)
save('herald-articles', heraldArticles)
save('lyra-music', lyraMusic)
save('vortex-catalog', vortexCatalog)
save('beacon-emails', beaconEmails)
save('compass-rides', compassRides)
save('flame-orders', flameOrders)
save('atlas-events', atlasEvents)

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
const totalMessages = Object.values(echoConversations.messages).flat().length

console.log('\n--- Summary ---')
console.log(`  Profile:  Alejandro Vega (${ALEJANDRO.city})`)
console.log(`  Nova:     ${novaPosts.feed.length} feed posts, ${novaPosts.user_posts.length} user posts, ${novaPosts.notifications.length} notifications, ${novaPosts.trending.length} trending`)
console.log(`  Pulse:    ${pulsePhotos.feed.length} feed posts, ${pulsePhotos.user_posts.length} user posts, ${pulsePhotos.stories.length} stories, ${pulsePhotos.explore.length} explore`)
console.log(`  Orbit:    ${orbitTransactions.transactions.length} transactions, ${orbitTransactions.accounts.length} accounts, ${orbitTransactions.cards.length} card(s)`)
console.log(`  Zinc:     ${zincTransactions.transactions.length} transactions, ${zincTransactions.accounts.length} accounts, ${zincTransactions.cards.length} card(s)`)
console.log(`  Market:   ${marketOrders.orders.length} orders, ${marketOrders.products.length} products, ${marketOrders.cart.items.length} cart items, ${marketOrders.wishlist.length} wishlist`)
console.log(`  Stream:   ${streamHistory.feed.length} feed, ${streamHistory.history.length} history, ${streamHistory.subscriptions.length} subs, ${streamHistory.user_videos.length} user videos`)
console.log(`  Echo:     ${echoConversations.conversations.length} conversations, ${totalMessages} messages`)
console.log(`  Herald:   ${heraldArticles.articles.length} articles, ${heraldArticles.bookmarks.length} bookmarks`)
console.log(`  Lyra:     ${lyraMusic.tracks.length} tracks, ${lyraMusic.playlists.length} playlists, ${lyraMusic.recently_played.length} recently played, ${lyraMusic.liked_tracks.length} liked`)
console.log(`  Vortex:   ${vortexCatalog.catalog.length} titles, ${vortexCatalog.continue_watching.length} continue watching, ${vortexCatalog.my_list.length} my list`)
console.log(`  Beacon:   ${beaconEmails.emails.length} emails (${beaconEmails.folders.inbox.unread} unread)`)
console.log(`  Compass:  ${compassRides.rides.length} rides, ${compassRides.saved_places.length} saved places`)
console.log(`  Flame:    ${flameOrders.orders.length} food orders, ${flameOrders.restaurants.length} restaurants`)
console.log(`  Atlas:    ${atlasEvents.events.length} events, ${atlasEvents.calendars.length} calendars`)
// =========================================================================
// ADDITIONAL USERS — Jose Espana & Alex Morgan (test)
// =========================================================================

function saveUser(dirName: string, name: string, data: unknown) {
  const dir = join(import.meta.dir, dirName)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, `${name}.json`), JSON.stringify(data, null, 2))
  const kb = (JSON.stringify(data).length / 1024).toFixed(1)
  console.log(`  ✓ ${dirName}/${name}.json  (${kb} KB)`)
}

// ---------------------------------------------------------------------------
// Jose Espana
// ---------------------------------------------------------------------------
{
  faker.seed(1001)
  const dirName = 'jose_espana'
  console.log('\n--- Generating data for Jose Espana ---\n')

  const JOSE = {
    id: 'user:jose_espana',
    name: 'Jose España',
    handle: '@jose_espana',
    age: 34,
    city: 'San Francisco',
    country: 'US',
    occupation: 'CTO & Full-stack Developer',
    language: 'en',
    currency: 'USD',
    email: 'jose.espana@perseusoft.tech',
    phone: '+1-415-555-9876',
    avatar_url: picsum('jose_espana_avatar', 200, 200),
    joined_cosmos: '2020-08-10',
  }

  const JOSE_AUTHOR = {
    id: JOSE.id,
    name: JOSE.name,
    handle: JOSE.handle,
    avatar_url: JOSE.avatar_url,
    verified: true,
  }

  // 1. profile.json
  const joseProfile = {
    uadp_type: 'uadp:profile',
    ...JOSE,
    bio: 'CTO at PerseusOft. Building the future with AI/ML, TypeScript, and too much coffee. Runner, electronic music enthusiast, and foodie.',
    interests: ['artificial intelligence', 'machine learning', 'electronic music', 'fine dining', 'running', 'startups', 'Tesla'],
    social_links: {
      nova: '@jose_espana',
      pulse: '@jose_espana',
      codeforge: 'joseespana',
      github: 'joseespana',
    },
    stats: {
      nova_followers: 4820,
      nova_following: 612,
      pulse_followers: 2340,
      pulse_following: 445,
      stream_subscribers: 0,
    },
  }
  saveUser(dirName, 'profile', joseProfile)

  // 2. nova-posts.json
  const JOSE_NOVA_TOPICS = [
    'Just shipped a new AI feature at PerseusOft. The inference pipeline is running 4x faster with our custom ONNX runtime.',
    'Spent the weekend fine-tuning a local LLM for code review. The results are surprisingly good for a 13B model.',
    'Hot take: the best tech stack in 2025 is TypeScript everywhere + Rust where it matters.',
    'Running a 5K in Golden Gate Park this morning. Nothing clears the mind like a good run before a board meeting.',
    'PerseusOft just closed our Series A. Incredibly grateful for the team that made this happen.',
    'New blog post: "Why we migrated our ML pipeline from Python to Rust — and the 10x speedup we got."',
    'Tesla Model 3 road trip to Napa this weekend. Supercharger network in California is getting better.',
    'Electronic music festival at the Midway was incredible last night. Boris Brejcha absolutely destroyed it.',
    'Trying the omakase at Sushi Kaze tonight. Best sushi in SF, hands down.',
    'The AI agent ecosystem is exploding. We are building something at PerseusOft that will blow your mind.',
    'Mentoring junior devs is one of the most rewarding things I do. Watching Alex grow as a QA engineer has been great.',
    'Keynote at Tech Summit went well. Talked about building AI-first companies.',
    'Bun 2.0 is a game changer for our monorepo. Build times dropped from 45s to 12s.',
    'Friday evening: craft cocktails at Trick Dog with the PerseusOft founders.',
    'Just deployed our new UADP-compatible API gateway. Protocol compliance is finally at 100%.',
    'Reading "Designing Machine Learning Systems" by Chip Huyen. Essential for any ML team lead.',
    'PerseusOft team retreat in Napa next month. Wine tasting and strategy sessions.',
    'AWS re:Invent talk accepted! Will be presenting our serverless ML inference architecture.',
    'The future of software is AI-native. Every new feature we build at PerseusOft starts with an AI design doc.',
    'Saturday morning run + specialty coffee + code review. The perfect startup CTO morning routine.',
  ]

  const joseUserPosts = Array.from({ length: 30 }, (_, i) => {
    const d = faker.number.float({ min: 0, max: 180 })
    const topic = i < JOSE_NOVA_TOPICS.length
      ? JOSE_NOVA_TOPICS[i]
      : JOSE_NOVA_TOPICS[i % JOSE_NOVA_TOPICS.length].split('.')[0] + '. ' + faker.lorem.sentence()
    return {
      uadp_type: 'uadp:post' as const,
      id: uid('nova:post'),
      ts: tsSecondsAgo(d, 12),
      label: topic.slice(0, 60),
      body: topic,
      author: JOSE_AUTHOR,
      likes: faker.number.int({ min: 10, max: 500 }),
      reposts: faker.number.int({ min: 0, max: 80 }),
      replies_count: faker.number.int({ min: 0, max: 120 }),
      lang: 'en',
      tags: faker.helpers.arrayElements(
        ['ai', 'ml', 'startup', 'typescript', 'rust', 'perseusoft', 'running', 'tesla', 'sf', 'tech'],
        faker.number.int({ min: 1, max: 3 }),
      ),
      ext: { nova: { boost_score: faker.number.float({ min: 0, max: 1 }) } },
    }
  })

  const joseFeed = Array.from({ length: 200 }, () => {
    const author = faker.helpers.arrayElement(FORTY_AUTHORS)
    const d = faker.number.float({ min: 0, max: 180 })
    const body = faker.lorem.sentences({ min: 1, max: 3 })
    return {
      uadp_type: 'uadp:post' as const,
      id: uid('nova:post'),
      ts: tsSecondsAgo(d, 12),
      label: body.slice(0, 60),
      body,
      author,
      likes: faker.number.int({ min: 0, max: 5000 }),
      reposts: faker.number.int({ min: 0, max: 800 }),
      replies_count: faker.number.int({ min: 0, max: 200 }),
      lang: 'en',
      tags: faker.helpers.arrayElements(
        ['tech', 'ai', 'startup', 'dev', 'life', 'fintech', 'design', 'ml'],
        faker.number.int({ min: 0, max: 3 }),
      ),
      ext: { nova: { boost_score: faker.number.float({ min: 0, max: 1 }) } },
    }
  })

  const joseNotifTypes = ['like', 'reply', 'follow', 'mention'] as const
  const joseNotifications = Array.from({ length: 15 }, (_, i) => {
    const type = faker.helpers.arrayElement(joseNotifTypes)
    const actor = faker.helpers.arrayElement(FORTY_AUTHORS)
    const messages: Record<string, string> = {
      like: `${actor.name} liked your post`,
      reply: `${actor.name} replied to your post`,
      follow: `${actor.name} started following you`,
      mention: `${actor.name} mentioned you in a post`,
    }
    return {
      uadp_type: 'uadp:notification' as const,
      id: uid('nova:notif'),
      ts: tsSecondsAgo(faker.number.float({ min: 0, max: 30 }), 6),
      type,
      message: messages[type],
      read: i > 5,
      actor,
      target_id: type !== 'follow' ? uid('nova:post') : undefined,
    }
  })

  const joseNovaPosts = {
    feed: joseFeed.sort((a, b) => b.ts - a.ts),
    user_posts: joseUserPosts.sort((a, b) => b.ts - a.ts),
    notifications: joseNotifications,
    trending: novaPosts.trending,
  }
  saveUser(dirName, 'nova-posts', joseNovaPosts)

  // 3. pulse-photos.json
  const joseCaptions = [
    'New office setup at PerseusOft HQ. Standing desk life.',
    'Tesla Model 3 road trip to Napa Valley',
    'Omakase dinner at Sushi Kaze. Every piece was perfect.',
    'Morning 5K in Golden Gate Park. Best way to start the day.',
    'PerseusOft team dinner after closing Series A',
    'Keynote stage at Tech Summit',
    'Craft cocktails at Trick Dog',
    'Electronic music night at the Midway',
    'Sunday brunch in Pacific Heights with the wife',
    'New mechanical keyboard arrived. Cherry MX Browns.',
    'Napa wine tasting with the team',
    'Running the SF half marathon. Personal best!',
    'Sunset from our Pacific Heights rooftop',
    'AI lab tour at PerseusOft',
    'Weekend code session with specialty coffee',
  ]

  const josePulseUserPosts = Array.from({ length: 15 }, (_, i) => {
    const id = uid('pulse:post')
    const d = faker.number.float({ min: 0, max: 180 })
    const caption = i < joseCaptions.length ? joseCaptions[i] : faker.lorem.sentence()
    return {
      uadp_type: 'uadp:media_post' as const,
      id,
      ts: tsSecondsAgo(d, 8),
      label: caption.slice(0, 50),
      body: caption,
      author: JOSE_AUTHOR,
      media_url: picsum(`pulse_jose_${i}`, 1080, 1080),
      thumbnail_url: picsum(`pulse_jose_${i}`, 300, 300),
      likes: faker.number.int({ min: 20, max: 800 }),
      reposts: faker.number.int({ min: 0, max: 50 }),
      replies_count: faker.number.int({ min: 0, max: 80 }),
      lang: 'en',
      tags: faker.helpers.arrayElements(
        ['sf', 'tech', 'food', 'running', 'tesla', 'startup', 'office', 'travel'],
        faker.number.int({ min: 1, max: 3 }),
      ),
    }
  })

  const josePulseFeed = Array.from({ length: 100 }, (_, i) => {
    const id = uid('pulse:post')
    const author = faker.helpers.arrayElement(FORTY_AUTHORS)
    return {
      uadp_type: 'uadp:media_post' as const,
      id,
      ts: tsRandom(180),
      label: faker.lorem.sentence().slice(0, 50),
      body: faker.lorem.sentence(),
      author,
      media_url: picsum(`pulse_jose_feed_${i}`, 1080, 1080),
      thumbnail_url: picsum(`pulse_jose_feed_${i}`, 300, 300),
      likes: faker.number.int({ min: 10, max: 8000 }),
      reposts: faker.number.int({ min: 0, max: 500 }),
      replies_count: faker.number.int({ min: 0, max: 150 }),
      lang: 'en',
      tags: faker.helpers.arrayElements(
        ['photo', 'life', 'art', 'food', 'travel', 'fashion', 'music', 'nature'],
        faker.number.int({ min: 1, max: 3 }),
      ),
    }
  })

  const joseStories = Array.from({ length: 5 }, (_, i) => {
    const author = i < 2 ? JOSE_AUTHOR : faker.helpers.arrayElement(FORTY_AUTHORS)
    const storyId = uid('pulse:story')
    const hoursAgo = faker.number.int({ min: 1, max: 23 })
    const tsVal = Math.floor(NOW / 1000) - hoursAgo * 3600
    return {
      uadp_type: 'uadp:story' as const,
      id: storyId,
      author,
      media_url: picsum(`jose_story_${i}`, 1080, 1920),
      ts: tsVal,
      expires_ts: tsVal + 86400,
      viewed: i > 2,
    }
  })

  const joseExplore = faker.helpers.arrayElements([...josePulseFeed, ...josePulseUserPosts], 20).map(p => ({ ...p }))

  saveUser(dirName, 'pulse-photos', {
    feed: josePulseFeed,
    user_posts: josePulseUserPosts,
    stories: joseStories,
    explore: joseExplore,
  })

  // 4. orbit-transactions.json
  const joseOrbitAccounts = [
    {
      uadp_type: 'uadp:account',
      id: 'orbit:acc:jose:checking',
      label: 'Checking Account',
      type: 'checking',
      balance: { value: 12000, currency: 'USD' },
      currency: 'USD',
    },
    {
      uadp_type: 'uadp:account',
      id: 'orbit:acc:jose:savings',
      label: 'Savings',
      type: 'savings',
      balance: { value: 35000, currency: 'USD' },
      currency: 'USD',
    },
  ]

  const joseOrbitCards = [
    {
      uadp_type: 'uadp:card',
      id: 'orbit:card:jose:credit',
      label: 'Orbit Platinum Credit Card',
      type: 'credit',
      last_four: '7291',
      account_id: 'orbit:acc:jose:checking',
      network: 'Visa',
      status: 'active',
    },
  ]

  const joseOrbitTx: any[] = []
  let joseRunning = 14000

  // Salary: 8,500 USD biweekly (1st and 15th)
  for (let d = 90; d >= 0; d--) {
    const date = new Date(NOW - d * ONE_DAY_MS)
    const day = date.getDate()
    if (day === 1 || day === 15) {
      joseRunning += 8500
      joseOrbitTx.push({
        uadp_type: 'uadp:transaction',
        id: uid('orbit:tx'),
        ts: tsSecondsAgo(d, 2),
        label: 'Payroll - PerseusOft',
        amount: { value: 8500, currency: 'USD' },
        direction: 'in',
        status: 'completed',
        merchant: { name: 'PerseusOft', category: 'salary', city: 'San Francisco', country: 'US' },
        balance_after: { value: roundUSD(joseRunning), currency: 'USD' },
        account_id: 'orbit:acc:jose:checking',
      })
    }
  }

  // Recurring monthly expenses
  const joseRecurring = [
    { name: 'Rent - Pacific Heights Apt', category: 'housing', amount: 2800 },
    { name: 'Tesla Financing', category: 'auto', amount: 750 },
    { name: 'VortexPlay Premium', category: 'entertainment', amount: 15.99 },
    { name: 'LyraMusic Family', category: 'entertainment', amount: 10.99 },
    { name: 'AWS Cloud Services', category: 'software', amount: roundUSD(faker.number.float({ min: 150, max: 300 })) },
    { name: 'GitHub Enterprise', category: 'software', amount: 21 },
    { name: 'GymFit Black', category: 'fitness', amount: 59.99 },
    { name: 'FibraMax Fiber 500Mbps', category: 'telecom', amount: 65 },
    { name: 'MobileX Premium Plan', category: 'telecom', amount: 85 },
    { name: 'Tesla Insurance', category: 'insurance', amount: 195 },
  ]

  for (let month = 0; month < 3; month++) {
    for (const exp of joseRecurring) {
      const d = 5 + month * 30 + faker.number.int({ min: 0, max: 3 })
      if (d > 90) continue
      joseRunning -= exp.amount
      joseOrbitTx.push({
        uadp_type: 'uadp:transaction',
        id: uid('orbit:tx'),
        ts: tsSecondsAgo(d, 4),
        label: exp.name,
        amount: { value: exp.amount, currency: 'USD' },
        direction: 'out',
        status: 'completed',
        merchant: { name: exp.name, category: exp.category, city: 'San Francisco', country: 'US' },
        balance_after: { value: roundUSD(joseRunning), currency: 'USD' },
        account_id: 'orbit:acc:jose:checking',
      })
    }
  }

  // Dining out (high-end) - 3-4x per week (~48 over 90 days)
  for (let i = 0; i < 48; i++) {
    const d = faker.number.float({ min: 0, max: 90 })
    const amount = roundUSD(faker.number.float({ min: 25, max: 80 }))
    joseRunning -= amount
    const restaurants = ['Sushi Kaze', 'Bistro Valencia', 'Trick Dog', 'Atelier Crenn', 'Quince', 'Nopa', 'State Bird Provisions', 'Sol Kitchen']
    const restaurant = faker.helpers.arrayElement(restaurants)
    joseOrbitTx.push({
      uadp_type: 'uadp:transaction',
      id: uid('orbit:tx'),
      ts: tsSecondsAgo(d, 10),
      label: restaurant,
      amount: { value: amount, currency: 'USD' },
      direction: 'out',
      status: 'completed',
      merchant: { name: restaurant, category: 'food_drink', city: 'San Francisco', country: 'US' },
      balance_after: { value: roundUSD(joseRunning), currency: 'USD' },
      account_id: 'orbit:acc:jose:checking',
    })
  }

  // Daily coffee (weekdays) — ~60 over 90 days
  for (let i = 0; i < 60; i++) {
    const d = faker.number.float({ min: 0, max: 90 })
    const amount = roundUSD(faker.number.float({ min: 5, max: 8 }))
    joseRunning -= amount
    joseOrbitTx.push({
      uadp_type: 'uadp:transaction',
      id: uid('orbit:tx'),
      ts: tsSecondsAgo(d, 10),
      label: pickBrand('coffee'),
      amount: { value: amount, currency: 'USD' },
      direction: 'out',
      status: 'completed',
      merchant: { name: pickBrand('coffee'), category: 'food_drink', city: 'San Francisco', country: 'US' },
      balance_after: { value: roundUSD(joseRunning), currency: 'USD' },
      account_id: 'orbit:acc:jose:checking',
    })
  }

  // Weekly groceries — ~13 over 90 days
  for (let week = 0; week < 13; week++) {
    const d = week * 7 + faker.number.int({ min: 0, max: 2 })
    if (d > 90) continue
    const amount = roundUSD(faker.number.float({ min: 120, max: 200 }))
    joseRunning -= amount
    joseOrbitTx.push({
      uadp_type: 'uadp:transaction',
      id: uid('orbit:tx'),
      ts: tsSecondsAgo(d, 6),
      label: pickBrand('grocery'),
      amount: { value: amount, currency: 'USD' },
      direction: 'out',
      status: 'completed',
      merchant: { name: pickBrand('grocery'), category: 'groceries', city: 'San Francisco', country: 'US' },
      balance_after: { value: roundUSD(joseRunning), currency: 'USD' },
      account_id: 'orbit:acc:jose:checking',
    })
  }

  // Tesla supercharging — biweekly (~6 over 90 days)
  for (let i = 0; i < 6; i++) {
    const amount = roundUSD(faker.number.float({ min: 50, max: 80 }))
    const d = faker.number.int({ min: 1, max: 85 })
    joseRunning -= amount
    joseOrbitTx.push({
      uadp_type: 'uadp:transaction',
      id: uid('orbit:tx'),
      ts: tsSecondsAgo(d, 6),
      label: 'Tesla Supercharger',
      amount: { value: amount, currency: 'USD' },
      direction: 'out',
      status: 'completed',
      merchant: { name: 'Tesla Supercharger', category: 'auto', city: 'San Francisco', country: 'US' },
      balance_after: { value: roundUSD(joseRunning), currency: 'USD' },
      account_id: 'orbit:acc:jose:checking',
    })
  }

  // Uber/Compass rides — 5-8 per month (~20 over 90 days)
  for (let i = 0; i < 20; i++) {
    const d = faker.number.float({ min: 0, max: 90 })
    const amount = roundUSD(faker.number.float({ min: 8, max: 25 }))
    joseRunning -= amount
    const services = ['CompassRide', 'RidaGo', 'ViaRapido Express', 'SafeTaxi']
    const service = faker.helpers.arrayElement(services)
    joseOrbitTx.push({
      uadp_type: 'uadp:transaction',
      id: uid('orbit:tx'),
      ts: tsSecondsAgo(d, 10),
      label: service,
      amount: { value: amount, currency: 'USD' },
      direction: 'out',
      status: 'completed',
      merchant: { name: service, category: 'transport', city: 'San Francisco', country: 'US' },
      balance_after: { value: roundUSD(joseRunning), currency: 'USD' },
      account_id: 'orbit:acc:jose:checking',
    })
  }

  // Random shopping (electronics, clothing, etc.)
  const joseVarCats = [
    { brands: 'electronics' as keyof typeof BRANDS, category: 'electronics', min: 80, max: 999 },
    { brands: 'clothing' as keyof typeof BRANDS, category: 'clothing', min: 60, max: 500 },
    { brands: 'pharmacy' as keyof typeof BRANDS, category: 'health', min: 10, max: 100 },
  ]

  for (let i = 0; i < 15; i++) {
    const cat = faker.helpers.arrayElement(joseVarCats)
    const brand = pickBrand(cat.brands)
    const amount = roundUSD(faker.number.float({ min: cat.min, max: cat.max }))
    const d = faker.number.float({ min: 0, max: 90 })
    joseRunning -= amount
    joseOrbitTx.push({
      uadp_type: 'uadp:transaction',
      id: uid('orbit:tx'),
      ts: tsSecondsAgo(d, 10),
      label: brand,
      amount: { value: amount, currency: 'USD' },
      direction: 'out',
      status: 'completed',
      merchant: { name: brand, category: cat.category, city: 'San Francisco', country: 'US' },
      balance_after: { value: roundUSD(joseRunning), currency: 'USD' },
      account_id: 'orbit:acc:jose:checking',
    })
  }

  joseOrbitTx.sort((a, b) => b.ts - a.ts)
  joseOrbitAccounts[0].balance.value = roundUSD(joseRunning > 0 ? joseRunning : 12000)

  saveUser(dirName, 'orbit-transactions', {
    accounts: joseOrbitAccounts,
    transactions: joseOrbitTx,
    cards: joseOrbitCards,
  })

  // 5. zinc-transactions.json
  const joseZincAccounts = [
    {
      uadp_type: 'uadp:account',
      id: 'zinc:acc:jose:usd',
      label: 'Zinc USD',
      type: 'checking' as const,
      balance: { value: 4200, currency: 'USD' },
      currency: 'USD',
    },
  ]

  const joseZincCards = [
    {
      uadp_type: 'uadp:card',
      id: 'zinc:card:jose:intl',
      label: 'Zinc International Card',
      type: 'debit',
      last_four: '8834',
      account_id: 'zinc:acc:jose:usd',
      network: 'Mastercard',
      status: 'active',
    },
  ]

  const joseZincTx: any[] = []

  // International subscriptions
  const joseIntlSubs = [
    { name: 'GitHub Enterprise', amount: 21.00, category: 'software' },
    { name: 'AWS Services', amount: 187.50, category: 'cloud' },
    { name: 'Vercel Pro', amount: 20.00, category: 'cloud' },
    { name: 'OpenAI API', amount: 95.00, category: 'ai' },
    { name: 'Figma Business', amount: 45.00, category: 'design' },
  ]

  for (let month = 0; month < 6; month++) {
    for (const sub of joseIntlSubs) {
      const d = 3 + month * 30 + faker.number.int({ min: 0, max: 2 })
      if (d > 180) continue
      joseZincTx.push({
        uadp_type: 'uadp:transaction',
        id: uid('zinc:tx'),
        ts: tsSecondsAgo(d, 3),
        label: sub.name,
        amount: { value: sub.amount, currency: 'USD' },
        direction: 'out' as const,
        status: 'completed' as const,
        merchant: { name: sub.name, category: sub.category, country: 'US' },
        account_id: 'zinc:acc:jose:usd',
        ext: {
          is_subscription: true,
        },
      })
    }
  }

  // Conference registrations and one-off intl purchases
  const joseIntlPurchases = [
    { name: 'AWS re:Invent Registration', amount: 1799.00, category: 'conference' },
    { name: 'TechCrunch Disrupt Ticket', amount: 995.00, category: 'conference' },
    { name: 'O\'Reilly Annual Subscription', amount: 499.00, category: 'education' },
    { name: 'Apple Developer Program', amount: 99.00, category: 'software' },
    { name: 'Anthropic API Credits', amount: 250.00, category: 'ai' },
  ]

  for (const purchase of joseIntlPurchases) {
    const d = faker.number.float({ min: 5, max: 170 })
    joseZincTx.push({
      uadp_type: 'uadp:transaction',
      id: uid('zinc:tx'),
      ts: tsSecondsAgo(d, 8),
      label: purchase.name,
      amount: { value: purchase.amount, currency: 'USD' },
      direction: 'out' as const,
      status: 'completed' as const,
      merchant: { name: purchase.name, category: purchase.category, country: 'US' },
      account_id: 'zinc:acc:jose:usd',
      ext: {
        is_subscription: false,
      },
    })
  }

  joseZincTx.sort((a, b) => b.ts - a.ts)

  saveUser(dirName, 'zinc-transactions', {
    accounts: joseZincAccounts,
    transactions: joseZincTx,
    cards: joseZincCards,
  })

  // 6. market-orders.json
  const joseProducts = marketOrders.products.slice(0, 100)

  const joseShippingAddress = {
    name: 'Jose España',
    street: '340 Pacific Ave, Apt 12A',
    city: 'San Francisco',
    state: 'CA',
    zip: '94115',
    country: 'US',
  }

  // High-end tech orders
  const joseOrderItems = [
    { title: 'MacBook Pro 14" M5 Pro — 24GB RAM / 1TB SSD — Space Black', price: 2499, cat: 'Electronics' },
    { title: 'AirPods Pro 3rd Gen — USB-C', price: 249.99, cat: 'Electronics' },
    { title: 'FlexiDesk Pro Standing Desk — Walnut', price: 899.99, cat: 'Office' },
    { title: 'UltraView 4K 32" HDR Monitor', price: 699.99, cat: 'Electronics' },
    { title: 'KeyMax Custom Mechanical Keyboard — Cherry MX Brown', price: 279.99, cat: 'Electronics' },
    { title: 'ErgoMax Mesh Office Chair', price: 1099.99, cat: 'Office' },
    { title: 'Anthrotek Dev Kit — AI Starter Pack', price: 499.99, cat: 'Electronics' },
    { title: 'Running Shoes UltraBoost Pro', price: 189.99, cat: 'Sports' },
    { title: 'Noise-Cancelling Headphones ProSound Elite', price: 449.99, cat: 'Electronics' },
    { title: 'Portable SSD 2TB VaultDrive Pro', price: 189.99, cat: 'Electronics' },
    { title: 'Smart Home Hub — Alexa Pro', price: 149.99, cat: 'Electronics' },
    { title: 'Craft Coffee Maker Breville Barista', price: 599.99, cat: 'Home' },
    { title: 'Running Watch ProFit Ultra', price: 379.99, cat: 'Sports' },
    { title: 'Book: Designing Machine Learning Systems', price: 44.99, cat: 'Books' },
    { title: 'Webcam StreamCam 4K Pro', price: 229.99, cat: 'Electronics' },
  ]

  const joseOrders = joseOrderItems.map((item, i) => {
    const d = faker.number.float({ min: 1, max: 180 })
    const status = i === 0 ? 'shipped' : faker.helpers.weightedArrayElement([
      { value: 'delivered', weight: 0.8 },
      { value: 'pending', weight: 0.1 },
      { value: 'cancelled', weight: 0.1 },
    ])
    return {
      uadp_type: 'uadp:order' as const,
      id: uid('market:order'),
      ts: tsSecondsAgo(d, 4),
      label: `Order #${2000 + i}`,
      status,
      total: { value: item.price, currency: 'USD' },
      items: [{
        product_id: uid('market:prod'),
        title: item.title,
        qty: 1,
        unit_price: { value: item.price, currency: 'USD' },
        image_url: picsum(`jose_order_${i}`, 600, 600),
      }],
      shipping_address: joseShippingAddress,
      tracking_number: status === 'shipped' ? `TRK${faker.string.alphanumeric(12).toUpperCase()}` : undefined,
    }
  })

  const joseCartProducts = faker.helpers.arrayElements(joseProducts, 2)
  const joseCart = {
    items: joseCartProducts.map(p => ({
      product_id: p.id,
      title: p.title,
      qty: 1,
      unit_price: p.price,
      image_url: p.image_url,
    })),
  }

  const joseWishlist = faker.helpers.arrayElements(joseProducts, 5).map(p => ({
    product_id: p.id,
    title: p.title,
    price: p.price,
    image_url: p.image_url,
    added_ts: tsRandom(60),
  }))

  saveUser(dirName, 'market-orders', {
    orders: joseOrders,
    products: joseProducts,
    cart: joseCart,
    wishlist: joseWishlist,
  })

  // 7. stream-history.json
  const joseChannelNames = [
    'MKBHD Tech', 'Fireship', 'ThePrimeagen', 'Linus Tech Tips',
    'Two Minute Papers', 'Lex Fridman Podcast', 'Computerphile',
    'AI Explained', 'Traversy Media', 'Tech Lead',
  ]

  const joseChannels = joseChannelNames.map((name, i) => ({
    id: uid('stream:ch'),
    name,
    subscribers: faker.number.int({ min: 50000, max: 20_000_000 }),
    avatar_url: picsum(`jose_ch_${i}`, 100, 100),
  }))

  const joseVideoTitles = [
    'M5 Pro MacBook — The Developer\'s Dream Machine',
    'AI Agents Are Changing Everything in 2025',
    'Rust vs Go: Which Should You Learn?',
    'Building Production ML Pipelines with TypeScript',
    'The Future of AI-Native Companies',
    'Tesla Model 3 Highland — 1 Year Later Review',
    'Best Running Gear for Tech Workers',
    'ONNX Runtime: Making AI Fast Everywhere',
    'Startup CTO Mistakes I Made (So You Don\'t Have To)',
    'Electronic Music Production with AI Tools',
    'How to Scale a Startup from 5 to 50 Engineers',
    'Fine-Tuning LLMs on Consumer Hardware',
    'AWS re:Invent 2025 Highlights',
    'TypeScript 5.5 Deep Dive',
    'The State of AI in 2026',
  ]

  function makeJoseVideo(channelOverride?: typeof joseChannels[0], daysRange = 180) {
    const channel = channelOverride || faker.helpers.arrayElement(joseChannels)
    const vidId = uid('stream:vid')
    return {
      uadp_type: 'uadp:video' as const,
      id: vidId,
      ts: tsRandom(daysRange),
      label: faker.helpers.arrayElement(joseVideoTitles),
      title: faker.helpers.arrayElement(joseVideoTitles),
      description: faker.lorem.paragraph(),
      channel: { id: channel.id, name: channel.name, subscribers: channel.subscribers },
      duration_seconds: faker.number.int({ min: 120, max: 7200 }),
      views: faker.number.int({ min: 1000, max: 5_000_000 }),
      likes: faker.number.int({ min: 50, max: 200_000 }),
      thumbnail_url: picsum(vidId, 1280, 720),
      tags: faker.helpers.arrayElements(
        ['ai', 'ml', 'tech', 'rust', 'typescript', 'startup', 'review', 'tutorial'],
        faker.number.int({ min: 1, max: 4 }),
      ),
    }
  }

  const joseFeedVideos = Array.from({ length: 60 }, () => makeJoseVideo())

  // MacBook M5 YouTube videos (real links)
  const macbookResearchTs = tsSecondsAgo(18, 2)
  const joseMacbookVideos = [
    {
      uadp_type: 'uadp:video' as const,
      id: uid('stream:vid'),
      ts: macbookResearchTs,
      label: 'M5 Max MacBook Pro (2026): OVERKILL?',
      title: 'M5 Max MacBook Pro (2026): OVERKILL?',
      description: 'MKBHD reviews the M5 Max MacBook Pro — Fusion Architecture benchmarks, real-world tests.',
      channel: { id: 'stream:ch:mkbhd', name: 'MKBHD', subscribers: 19_700_000 },
      duration_seconds: 1020,
      views: 4_200_000,
      likes: 142_000,
      thumbnail_url: 'https://img.youtube.com/vi/dSCF648wk1U/maxresdefault.jpg',
      youtube_url: 'https://www.youtube.com/watch?v=dSCF648wk1U',
      tags: ['macbook', 'm5', 'apple', 'review'],
    },
    {
      uadp_type: 'uadp:video' as const,
      id: uid('stream:vid'),
      ts: macbookResearchTs + 86400,
      label: 'Apple\'s M5 Max is INSANE!',
      title: 'Apple\'s M5 Max is INSANE!',
      description: 'Dave2D covers Apple\'s M5 Max chip — Fusion Architecture performance and real-world battery life.',
      channel: { id: 'stream:ch:dave2d', name: 'Dave2D', subscribers: 3_800_000 },
      duration_seconds: 780,
      views: 2_100_000,
      likes: 78_000,
      thumbnail_url: 'https://img.youtube.com/vi/xDHZ1bEEeUI/maxresdefault.jpg',
      youtube_url: 'https://www.youtube.com/watch?v=xDHZ1bEEeUI',
      tags: ['macbook', 'm5', 'apple', 'review'],
    },
    {
      uadp_type: 'uadp:video' as const,
      id: uid('stream:vid'),
      ts: macbookResearchTs + 86400 * 2,
      label: '2026 MacBook Pro with M5 Pro & M5 Max - Big EXPECTATIONS!',
      title: '2026 MacBook Pro with M5 Pro & M5 Max - Big EXPECTATIONS!',
      description: 'Max Tech puts the M5 Pro and M5 Max through their paces — benchmarks and developer workflows.',
      channel: { id: 'stream:ch:maxtech', name: 'Max Tech', subscribers: 1_400_000 },
      duration_seconds: 1440,
      views: 1_800_000,
      likes: 52_000,
      thumbnail_url: 'https://img.youtube.com/vi/CbGdf2jW4JY/maxresdefault.jpg',
      youtube_url: 'https://www.youtube.com/watch?v=CbGdf2jW4JY',
      tags: ['macbook', 'm5', 'apple', 'comparison'],
    },
    {
      uadp_type: 'uadp:video' as const,
      id: uid('stream:vid'),
      ts: macbookResearchTs + 86400 * 3,
      label: 'M5 Pro/Max are HERE - Apple just KILLED Windows!',
      title: 'M5 Pro/Max are HERE - Apple just KILLED Windows!',
      description: 'In-depth look at the M5 Pro and M5 Max — Fusion Architecture benchmarks.',
      channel: { id: 'stream:ch:macrumors', name: 'MacRumors', subscribers: 820_000 },
      duration_seconds: 900,
      views: 950_000,
      likes: 31_000,
      thumbnail_url: 'https://img.youtube.com/vi/jRxHH56sehc/maxresdefault.jpg',
      youtube_url: 'https://www.youtube.com/watch?v=jRxHH56sehc',
      tags: ['macbook', 'm5', 'apple', 'review'],
    },
    {
      uadp_type: 'uadp:video' as const,
      id: uid('stream:vid'),
      ts: macbookResearchTs - 86400,
      label: 'MacBook Pro M5 Review — MacRumors',
      title: 'MacBook Pro M5 Review — MacRumors',
      description: 'MacRumors full review of the MacBook Pro M5 — Fusion Architecture and Thunderbolt 5.',
      channel: { id: 'stream:ch:wylsacom', name: 'Wylsacom', subscribers: 11_300_000 },
      duration_seconds: 1260,
      views: 3_500_000,
      likes: 95_000,
      thumbnail_url: 'https://img.youtube.com/vi/gWii2NItLo4/maxresdefault.jpg',
      youtube_url: 'https://www.youtube.com/watch?v=gWii2NItLo4',
      tags: ['macbook', 'm5', 'apple', 'review'],
    },
  ]

  for (const vid of joseMacbookVideos) {
    joseFeedVideos.push(vid)
  }

  const joseHistory = Array.from({ length: 100 }, () => {
    const vid = makeJoseVideo(undefined, 180)
    return {
      ...vid,
      watched_seconds: faker.number.int({ min: 30, max: vid.duration_seconds }),
      watched_at: tsRandom(90),
    }
  })

  // Add macbook videos to history (watched fully)
  for (const vid of joseMacbookVideos) {
    joseHistory.push({
      ...vid,
      watched_seconds: vid.duration_seconds,
      watched_at: vid.ts + 3600,
    })
  }

  const joseSubs = joseChannels.map(ch => ({
    uadp_type: 'uadp:subscription' as const,
    channel_id: ch.id,
    channel_name: ch.name,
    channel_avatar: ch.avatar_url,
    subscribers: ch.subscribers,
    subscribed_at: tsRandom(365),
    notifications_enabled: faker.datatype.boolean(0.6),
  }))

  saveUser(dirName, 'stream-history', {
    feed: joseFeedVideos,
    history: joseHistory,
    subscriptions: joseSubs,
    user_videos: [],
  })

  // 8. echo-conversations.json
  const joseAle = { id: JOSE.id, name: JOSE.name }
  const alexContact = { id: 'user:test_user', name: 'Alex Morgan' }
  const wifeContact = { id: 'user:sofia_espana', name: 'Sofia España' }
  const familyContacts = [
    { id: 'user:pedro_espana', name: 'Pedro España' },
    { id: 'user:maria_espana', name: 'Maria España' },
  ]
  const friendContacts = [
    { id: 'user:carlos_mendez', name: 'Carlos Mendez' },
    { id: 'user:roberto_diaz', name: 'Roberto Diaz' },
  ]
  const teamContacts = [
    alexContact,
    { id: 'user:laura_chen', name: 'Laura Chen' },
    { id: 'user:miguel_santos', name: 'Miguel Santos' },
    { id: 'user:ana_garcia', name: 'Ana Garcia' },
  ]

  const joseConvDefs = [
    {
      type: 'group' as const,
      name: 'PerseusOft Team',
      members: [joseAle, ...teamContacts],
      msgCount: 80,
      topicPool: [
        'Sprint review at 3pm today. Everyone prepare your demos.',
        'PR #891 is ready for review. Alex, can you run the QA suite?',
        'AWS costs are up 15% this month. Let\'s optimize the Lambda functions.',
        'New client onboarding starts next week. Laura, prep the API docs.',
        'Great work on the release everyone! Drinks on me tonight.',
        'The ML inference endpoint is hitting 200ms p99. We need to get it under 100.',
        'Alex found a critical bug in the auth flow. Hotfix needed ASAP.',
        'Board meeting tomorrow. I\'ll present the Q1 numbers.',
        'Who\'s available for the on-call rotation next week?',
        'Deployed v2.4.0 to production. All tests passing.',
        'Let\'s do a team lunch at State Bird Provisions on Friday.',
        'The UADP integration is almost done. Miguel, can you review the spec?',
      ],
    },
    {
      type: 'direct' as const,
      name: 'Alex Morgan',
      members: [joseAle, alexContact],
      msgCount: 40,
      topicPool: [
        'Hey Alex, great catch on that auth bug.',
        'Can you run the full regression suite before EOD?',
        'The test coverage report looks good. Nice improvement.',
        'Want to pair on the API test automation this afternoon?',
        'How\'s the Cypress migration going?',
        'I left some feedback on your PR. Small changes.',
        'Take your time with the learning curve. You\'re doing great.',
        'Did you finish the QA plan for the new feature?',
        'Let me know if you need help with the Docker setup.',
        'Good work this sprint. Keep it up!',
      ],
    },
    {
      type: 'direct' as const,
      name: 'Sofia España',
      members: [joseAle, wifeContact],
      msgCount: 35,
      topicPool: [
        'Hey love, dinner reservation at 8pm tonight.',
        'Can you pick up the dry cleaning on your way home?',
        'Movie night tonight? There\'s a new sci-fi on Vortex.',
        'I booked the Napa trip for next month!',
        'Don\'t forget your mom\'s birthday next week.',
        'Running late from the office. Start dinner without me.',
        'Tesla needs a service appointment. Can you schedule it?',
        'Love you, have a great day!',
        'The brunch place in Pacific Heights was amazing. Let\'s go back.',
        'Should we try that new Italian place in North Beach?',
      ],
    },
    {
      type: 'group' as const,
      name: 'España Family',
      members: [joseAle, wifeContact, ...familyContacts],
      msgCount: 25,
      topicPool: [
        'Sunday lunch at mom\'s house. Who\'s coming?',
        'Happy birthday mom!',
        'Dad, can you send me the recipe for the roast?',
        'Family vacation planning — Hawaii in December?',
        'The Christmas dinner menu is ready.',
        'Sending photos from last weekend.',
        'Who\'s bringing dessert on Sunday?',
      ],
    },
    {
      type: 'group' as const,
      name: 'Friends',
      members: [joseAle, ...friendContacts],
      msgCount: 20,
      topicPool: [
        'Anyone up for the electronic music festival this weekend?',
        'New bar opened in the Mission. Let\'s check it out.',
        'Running the 5K on Saturday. Who\'s in?',
        'Poker night at my place Friday.',
        'Who watched the F1 race? Incredible finish.',
        'Dinner at Atelier Crenn next week. I got a reservation.',
        'Road trip to Napa next month?',
      ],
    },
  ]

  const joseConversations: any[] = []
  const joseMessages: Record<string, any[]> = {}

  for (const def of joseConvDefs) {
    const convId = uid('echo:conv')
    const convMsgs: any[] = []

    for (let m = 0; m < def.msgCount; m++) {
      const d = faker.number.float({ min: 0, max: 60 })
      const author = faker.helpers.arrayElement(def.members)
      const body = faker.helpers.arrayElement(def.topicPool)
      convMsgs.push({
        uadp_type: 'uadp:message',
        id: uid('echo:msg'),
        conversation_id: convId,
        body,
        author: { id: author.id, name: author.name },
        ts: tsSecondsAgo(d, 12),
        read: d > 0.5,
      })
    }

    convMsgs.sort((a, b) => a.ts - b.ts)
    joseMessages[convId] = convMsgs

    const lastMsg = convMsgs[convMsgs.length - 1]
    const unread = convMsgs.filter(m => !m.read).length

    joseConversations.push({
      uadp_type: 'uadp:conversation',
      id: convId,
      ts: lastMsg.ts,
      label: def.name,
      type: def.type,
      name: def.name,
      members: def.members,
      last_message: {
        body: lastMsg.body,
        author: lastMsg.author.name,
        ts: lastMsg.ts,
      },
      unread_count: unread,
      muted: faker.datatype.boolean(0.15),
    })
  }

  joseConversations.sort((a, b) => b.ts - a.ts)

  saveUser(dirName, 'echo-conversations', {
    conversations: joseConversations,
    messages: joseMessages,
  })

  // 9. herald-articles.json (shared, same as Alejandro)
  saveUser(dirName, 'herald-articles', heraldArticles)

  // 10. lyra-music.json
  const josePlaylistDefs = [
    { name: 'Deep Focus', desc: 'Ambient and minimal electronic for deep work sessions' },
    { name: 'Electronic Vibes', desc: 'Techno, house, and progressive electronic' },
    { name: 'Running Mix', desc: 'High BPM tracks for my 5K runs' },
    { name: 'Chill Evening', desc: 'Downtempo and lounge for winding down' },
    { name: 'Coding Sessions', desc: 'Instrumental electronic for pair programming' },
  ]

  const josePlaylists = josePlaylistDefs.map((def, i) => {
    const playlistTracks = faker.helpers.arrayElements(lyraMusic.tracks, faker.number.int({ min: 20, max: 50 }))
    return {
      uadp_type: 'uadp:playlist' as const,
      id: uid('lyra:playlist'),
      name: def.name,
      description: def.desc,
      cover_url: picsum(`jose_playlist_${i}`, 600, 600),
      owner: { id: JOSE.id, name: JOSE.name },
      track_count: playlistTracks.length,
      duration_seconds: playlistTracks.reduce((s, t) => s + t.duration_seconds, 0),
      followers: faker.number.int({ min: 10, max: 2000 }),
      is_public: true,
      tracks: playlistTracks.map(t => t.id),
    }
  })

  const joseRecentlyPlayed = faker.helpers.arrayElements(lyraMusic.tracks, 30).map(t => ({
    ...t,
    played_at: tsRandom(14),
  })).sort((a, b) => b.played_at - a.played_at)

  const joseLikedTracks = faker.helpers.arrayElements(lyraMusic.tracks, 25).map(t => t.id)

  saveUser(dirName, 'lyra-music', {
    tracks: lyraMusic.tracks.slice(0, 200),
    playlists: josePlaylists,
    recently_played: joseRecentlyPlayed,
    liked_tracks: joseLikedTracks,
    artists: lyraMusic.artists,
    albums: lyraMusic.albums,
  })

  // 11. vortex-catalog.json
  const joseContinueWatching = faker.helpers.arrayElements(vortexCatalog.catalog.filter(
    (t: any) => ['Sci-Fi', 'Thriller', 'Documentary'].some(g => t.genre?.includes(g))
  ).length > 0 ? vortexCatalog.catalog.filter(
    (t: any) => ['Sci-Fi', 'Thriller', 'Documentary'].some(g => t.genre?.includes(g))
  ) : vortexCatalog.catalog, 8).map((t: any) => ({
    ...t,
    progress: t.type === 'series'
      ? { season: faker.number.int({ min: 1, max: (t as any).seasons || 1 }), episode: faker.number.int({ min: 1, max: 8 }), percent: faker.number.int({ min: 10, max: 85 }) }
      : { percent: faker.number.int({ min: 10, max: 85 }) },
  }))

  const joseMyList = faker.helpers.arrayElements(vortexCatalog.catalog, 20).map((t: any) => t.id)

  saveUser(dirName, 'vortex-catalog', {
    catalog: vortexCatalog.catalog,
    continue_watching: joseContinueWatching,
    my_list: joseMyList,
    trending: vortexCatalog.trending,
  })

  // 12. beacon-emails.json
  const joseSenders = [
    { name: 'GitHub Notifications', address: 'noreply@github-demo.local' },
    { name: 'PerseusOft Board', address: 'board@perseusoft.tech' },
    { name: 'PerseusOft Finance', address: 'finance@perseusoft.tech' },
    { name: 'Alex Morgan', address: 'test@perseusoft.tech' },
    { name: 'Laura Chen', address: 'laura.chen@perseusoft.tech' },
    { name: 'Miguel Santos', address: 'miguel.santos@perseusoft.tech' },
    { name: 'Ana Garcia', address: 'ana.garcia@perseusoft.tech' },
    { name: 'Sofia España', address: 'sofia.espana@correo-demo.local' },
    { name: 'Maria España', address: 'maria.espana@correo-demo.local' },
    { name: 'MercadoMart', address: 'orders@mercadomart-demo.local' },
    { name: 'Orbit Bank', address: 'notifications@orbit-demo.local' },
    { name: 'Zinc', address: 'alerts@zinc-demo.local' },
    { name: 'AWS', address: 'billing@aws-demo.local' },
    { name: 'TechConf SF', address: 'info@conftech-demo.local' },
    { name: 'Newsletter AI Weekly', address: 'newsletter@aiweekly-demo.local' },
  ]

  const joseSubjectPool = [
    '[PR #891] feat: add ML inference endpoint — merged',
    '[PR #887] fix: optimize Lambda cold start',
    'Board Meeting Agenda — Q1 2025 Review',
    'Client Contract: TechNova — Final Draft',
    'AWS Monthly Invoice — $2,847.50 USD',
    'GitHub: 15 new pull requests need your review',
    'Orbit: ACH transfer confirmation — $8,500 USD',
    'Zinc: International charge — AWS $187.50 USD',
    'MercadoMart: Your MacBook Pro M5 has been delivered!',
    'MercadoMart: Order #2001 — AirPods Pro shipped',
    'TechConf SF 2025 — Speaker Confirmation',
    'AWS re:Invent — Registration Confirmed',
    'Newsletter: Top 10 AI Papers This Week',
    'PerseusOft: New Employee Onboarding — Week 3',
    'Sprint Planning Notes — Sprint 47',
    'Re: ML Pipeline Performance Report',
    'Investor Update — March 2025',
    'Tesla Service: Scheduled maintenance reminder',
    'Love, don\'t forget dinner at 8pm tonight — Sofia',
    'Family Vacation Planning — Hawaii December',
    'Running Club SF — 5K This Saturday',
    'O\'Reilly: New Course Available — Advanced MLOps',
    'PerseusOft: Server health alert — API latency spike',
    'Client feedback: TechNova integration complete',
    'Re: Team retreat logistics — Napa',
  ]

  const joseEmail = { name: JOSE.name, address: JOSE.email }

  const joseInbox = Array.from({ length: 60 }, (_, i) => {
    const sender = faker.helpers.arrayElement(joseSenders)
    const subject = i < joseSubjectPool.length ? joseSubjectPool[i] : `Re: ${faker.lorem.sentence().slice(0, 40)}`
    return {
      uadp_type: 'uadp:email' as const,
      id: uid('beacon:email'),
      ts: tsRandom(90),
      label: subject,
      subject,
      from: sender,
      to: [joseEmail],
      body_text: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 4 })),
      folder: 'inbox' as const,
      read: i > 8,
      starred: faker.datatype.boolean(0.15),
      attachments: faker.datatype.boolean(0.2)
        ? [{ name: `${faker.system.fileName()}.pdf`, size_bytes: faker.number.int({ min: 10000, max: 5000000 }), type: 'application/pdf' }]
        : undefined,
    }
  })

  const joseSent = Array.from({ length: 15 }, (_, i) => {
    const recipient = faker.helpers.arrayElement(joseSenders)
    const subject = i < 5 ? [
      'Re: Board Meeting Agenda — Q1 2025 Review',
      'ML Pipeline Architecture Proposal',
      'Re: Client Contract — Approved',
      'Team: Sprint 47 Priorities',
      'Re: AWS Cost Optimization Plan',
    ][i] : `Re: ${faker.lorem.sentence().slice(0, 40)}`
    return {
      uadp_type: 'uadp:email' as const,
      id: uid('beacon:email'),
      ts: tsRandom(90),
      label: subject,
      subject,
      from: joseEmail,
      to: [recipient],
      body_text: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 3 })),
      folder: 'sent' as const,
      read: true,
      starred: false,
    }
  })

  const joseDrafts = Array.from({ length: 5 }, () => {
    const recipient = faker.helpers.arrayElement(joseSenders)
    return {
      uadp_type: 'uadp:email' as const,
      id: uid('beacon:email'),
      ts: tsRandom(30),
      label: faker.lorem.sentence().slice(0, 40),
      subject: faker.lorem.sentence().slice(0, 40),
      from: joseEmail,
      to: [recipient],
      body_text: faker.lorem.sentences(faker.number.int({ min: 1, max: 3 })),
      folder: 'drafts' as const,
      read: true,
      starred: false,
    }
  })

  const joseAllEmails = [...joseInbox, ...joseSent, ...joseDrafts].sort((a, b) => b.ts - a.ts)

  saveUser(dirName, 'beacon-emails', {
    emails: joseAllEmails,
    folders: {
      inbox: { count: joseInbox.length, unread: joseInbox.filter(e => !e.read).length },
      sent: { count: joseSent.length },
      drafts: { count: joseDrafts.length },
      spam: { count: 2 },
      trash: { count: 4 },
    },
  })

  // 13. compass-rides.json
  const josePlaces = [
    { name: 'Pacific Heights Apartment', lat: 37.7925, lng: -122.4382 },
    { name: 'PerseusOft HQ — SoMa', lat: 37.7849, lng: -122.3994 },
    { name: 'Sushi Kaze', lat: 37.7785, lng: -122.4100 },
    { name: 'SFO Airport', lat: 37.6213, lng: -122.3790 },
    { name: 'Client Office — Palo Alto', lat: 37.4419, lng: -122.1430 },
    { name: 'Trick Dog', lat: 37.7617, lng: -122.4199 },
    { name: 'Golden Gate Park Running Track', lat: 37.7694, lng: -122.4862 },
    { name: 'State Bird Provisions', lat: 37.7876, lng: -122.4400 },
    { name: 'Tesla Service Center', lat: 37.7510, lng: -122.4180 },
    { name: 'Atelier Crenn', lat: 37.7999, lng: -122.4371 },
  ]

  const joseVehicles = [
    'Tesla Model 3 White 2024', 'BMW 330i Black 2023', 'Mercedes C300 Silver 2022',
    'Audi A4 Grey 2023', 'Tesla Model Y Blue 2023',
  ]

  const joseRides = Array.from({ length: 30 }, () => {
    const origin = faker.helpers.arrayElement(josePlaces)
    let destination = faker.helpers.arrayElement(josePlaces)
    while (destination.name === origin.name) {
      destination = faker.helpers.arrayElement(josePlaces)
    }
    const distance = roundUSD(faker.number.float({ min: 2, max: 30 }))
    const duration = Math.floor(distance * faker.number.float({ min: 3, max: 6 }))
    const rideType = faker.helpers.arrayElement(['standard', 'premium', 'premium'] as const)
    const baseFare = distance * faker.number.float({ min: 2, max: 4 })
    const multiplier = rideType === 'premium' ? 1.8 : 1.0
    const fare = roundUSD(baseFare * multiplier)

    return {
      uadp_type: 'uadp:ride' as const,
      id: uid('compass:ride'),
      ts: tsRandom(90),
      label: `${origin.name} → ${destination.name}`,
      status: faker.helpers.weightedArrayElement([
        { value: 'completed' as const, weight: 0.92 },
        { value: 'cancelled' as const, weight: 0.08 },
      ]),
      origin: { name: origin.name, lat: origin.lat + faker.number.float({ min: -0.002, max: 0.002 }), lng: origin.lng + faker.number.float({ min: -0.002, max: 0.002 }) },
      destination: { name: destination.name, lat: destination.lat + faker.number.float({ min: -0.002, max: 0.002 }), lng: destination.lng + faker.number.float({ min: -0.002, max: 0.002 }) },
      distance_km: distance,
      duration_minutes: duration,
      fare: { value: fare, currency: 'USD' },
      driver: {
        name: `${faker.person.firstName()} ${faker.person.lastName()}`,
        rating: roundUSD(faker.number.float({ min: 4.2, max: 5.0 })),
        vehicle: faker.helpers.arrayElement(joseVehicles),
        plate: `${faker.string.alpha({ length: 3, casing: 'upper' })}-${faker.string.numeric(4)}`,
      },
      ride_type: rideType,
    }
  }).sort((a, b) => b.ts - a.ts)

  const joseSavedPlaces = [
    { id: uid('compass:place'), name: 'Home', label: 'Pacific Heights apartment', address: '340 Pacific Ave, Apt 12A, Pacific Heights, SF', lat: 37.7925, lng: -122.4382, category: 'home' as const },
    { id: uid('compass:place'), name: 'PerseusOft', label: 'PerseusOft HQ', address: '101 2nd St, Floor 18, SoMa, SF', lat: 37.7849, lng: -122.3994, category: 'work' as const },
    { id: uid('compass:place'), name: 'Airport', label: 'SFO Terminal 2', address: 'San Francisco International Airport, T2', lat: 37.6213, lng: -122.3790, category: 'favorite' as const },
    { id: uid('compass:place'), name: 'Golden Gate Park', label: 'Running track', address: 'Golden Gate Park, SF', lat: 37.7694, lng: -122.4862, category: 'favorite' as const },
  ].map(p => ({ uadp_type: 'uadp:saved_place' as const, ...p }))

  saveUser(dirName, 'compass-rides', { rides: joseRides, saved_places: joseSavedPlaces })

  // 14. flame-orders.json
  const joseRestaurants = [
    { id: uid('flame:rest'), name: 'Sushi Kaze Premium', cuisine: 'Japanese', rating: 4.9, image_url: picsum('jose_rest_0', 400, 300) },
    { id: uid('flame:rest'), name: 'State Bird Provisions', cuisine: 'Seafood', rating: 4.8, image_url: picsum('jose_rest_1', 400, 300) },
    { id: uid('flame:rest'), name: 'Atelier Crenn', cuisine: 'Modern Fine Dining', rating: 4.9, image_url: picsum('jose_rest_2', 400, 300) },
    { id: uid('flame:rest'), name: 'Nopa', cuisine: 'Italian', rating: 4.7, image_url: picsum('jose_rest_3', 400, 300) },
    { id: uid('flame:rest'), name: 'Quince', cuisine: 'Modern Fine Dining', rating: 4.9, image_url: picsum('jose_rest_4', 400, 300) },
    { id: uid('flame:rest'), name: 'Bistro Pacific', cuisine: 'French', rating: 4.6, image_url: picsum('jose_rest_5', 400, 300) },
    { id: uid('flame:rest'), name: 'Nobu SF', cuisine: 'Japanese Fusion', rating: 4.8, image_url: picsum('jose_rest_6', 400, 300) },
    { id: uid('flame:rest'), name: 'Mourad', cuisine: 'Moroccan-Californian', rating: 4.7, image_url: picsum('jose_rest_7', 400, 300) },
  ]

  const joseFlameMenus: Record<string, { name: string; price: number }[]> = {
    Japanese: [
      { name: 'Premium Omakase Set', price: 55 }, { name: 'Wagyu Nigiri x4', price: 42 },
      { name: 'Sake Flight', price: 28 }, { name: 'Truffle Edamame', price: 14 },
    ],
    'Japanese Fusion': [
      { name: 'Nobu Special Roll x8', price: 45 }, { name: 'Black Cod Miso', price: 38 },
      { name: 'Yellowtail Sashimi', price: 32 }, { name: 'Premium Sake', price: 24 },
    ],
    Seafood: [
      { name: 'Tuna Tostadas x4', price: 22 }, { name: 'Grilled Octopus', price: 32 },
      { name: 'Aguachile Verde', price: 18 }, { name: 'White Wine Glass', price: 15 },
    ],
    'Modern Fine Dining': [
      { name: 'Tasting Menu 8 Courses', price: 145 }, { name: 'Wine Pairing', price: 85 },
      { name: 'Wagyu Tartare', price: 38 }, { name: 'Truffle Risotto', price: 22 },
    ],
    Italian: [
      { name: 'Truffle Pasta', price: 28 }, { name: 'Osso Buco', price: 38 },
      { name: 'Tiramisu Special', price: 15 }, { name: 'Italian Red Wine', price: 22 },
    ],
    French: [
      { name: 'Duck Confit', price: 32 }, { name: 'French Onion Soup', price: 15 },
      { name: 'Creme Brulee', price: 12 }, { name: 'Champagne Glass', price: 22 },
    ],
    'Moroccan-Californian': [
      { name: 'Lamb Tagine', price: 24 }, { name: 'Grilled Branzino', price: 55 },
      { name: 'Pistachio Baklava', price: 15 }, { name: 'Moroccan Mint Tea', price: 18 },
    ],
  }

  const joseFlameOrders = Array.from({ length: 15 }, () => {
    const restaurant = faker.helpers.arrayElement(joseRestaurants)
    const menu = joseFlameMenus[restaurant.cuisine] || [
      { name: 'Chef Special', price: 32 }, { name: 'Wine Pairing', price: 22 },
    ]
    const numItems = faker.number.int({ min: 2, max: 4 })
    const selectedItems = faker.helpers.arrayElements(menu, Math.min(numItems, menu.length)).map(item => ({
      name: item.name,
      qty: faker.number.int({ min: 1, max: 2 }),
      unit_price: { value: item.price, currency: 'USD' },
    }))
    const subtotal = selectedItems.reduce((s, it) => s + it.unit_price.value * it.qty, 0)
    const deliveryFee = roundUSD(faker.number.float({ min: 3.99, max: 7.99 }))
    const total = roundUSD(subtotal + deliveryFee)

    return {
      uadp_type: 'uadp:food_order' as const,
      id: uid('flame:order'),
      ts: tsRandom(90),
      label: `${restaurant.name} — $${total} USD`,
      status: faker.helpers.weightedArrayElement([
        { value: 'delivered' as const, weight: 0.9 },
        { value: 'cancelled' as const, weight: 0.05 },
        { value: 'in_progress' as const, weight: 0.05 },
      ]),
      restaurant,
      items: selectedItems,
      total: { value: total, currency: 'USD' },
      delivery_fee: { value: deliveryFee, currency: 'USD' },
      delivery_address: '340 Pacific Ave, Apt 12A, Pacific Heights, SF',
      estimated_minutes: faker.number.int({ min: 25, max: 55 }),
    }
  }).sort((a, b) => b.ts - a.ts)

  saveUser(dirName, 'flame-orders', {
    orders: joseFlameOrders,
    restaurants: joseRestaurants,
    favorites: joseRestaurants.map(r => r.id),
  })

  // 15. atlas-events.json
  const joseCalendars = [
    { name: 'Personal', color: '#4285F4' },
    { name: 'Work', color: '#0B8043' },
    { name: 'Fitness', color: '#D50000' },
  ]

  const joseEvents: any[] = []

  // Work recurring events
  const joseWorkEvents = [
    { title: 'PerseusOft Board Meeting', description: 'Monthly board meeting with investors', duration_min: 90, recurrence: 'monthly' as const, hour: 10 },
    { title: '1:1 with Alex (QA)', description: 'Weekly 1:1 with Alex Morgan', duration_min: 30, recurrence: 'weekly' as const, hour: 11 },
    { title: 'Client Call — TechNova', description: 'Bi-weekly sync with TechNova client', duration_min: 45, recurrence: 'weekly' as const, hour: 14 },
    { title: 'Sprint Planning', description: 'Monday sprint planning with the team', duration_min: 60, recurrence: 'weekly' as const, hour: 10 },
    { title: 'Architecture Review', description: 'Weekly ML pipeline architecture review', duration_min: 60, recurrence: 'weekly' as const, hour: 15 },
  ]

  for (let d = -7; d <= 30; d++) {
    const date = new Date(NOW + d * ONE_DAY_MS)
    const dayOfWeek = date.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) continue

    for (const we of joseWorkEvents) {
      if (we.recurrence === 'monthly' && date.getDate() !== 1) continue
      if (we.recurrence === 'weekly') {
        if (we.title.includes('Sprint Planning') && dayOfWeek !== 1) continue
        if (we.title.includes('1:1 with Alex') && dayOfWeek !== 2) continue
        if (we.title.includes('Client Call') && dayOfWeek !== 3) continue
        if (we.title.includes('Architecture Review') && dayOfWeek !== 4) continue
      }

      const startTs = Math.floor(new Date(date).setHours(we.hour, 0, 0, 0) / 1000)
      joseEvents.push({
        uadp_type: 'uadp:calendar_event',
        id: uid('atlas:event'),
        ts: startTs,
        label: we.title,
        title: we.title,
        description: we.description,
        start_ts: startTs,
        end_ts: startTs + we.duration_min * 60,
        all_day: false,
        calendar: 'Work',
        color: '#0B8043',
        recurrence: we.recurrence,
        attendees: [
          { name: 'Alex Morgan', email: 'test@perseusoft.tech', status: 'accepted' as const },
          { name: 'Laura Chen', email: 'laura.chen@perseusoft.tech', status: 'accepted' as const },
          { name: 'Miguel Santos', email: 'miguel.santos@perseusoft.tech', status: 'pending' as const },
        ],
      })
    }
  }

  // Fitness events: 5K runs Tue/Thu/Sat, Gym Mon/Wed/Fri
  for (let d = -7; d <= 30; d++) {
    const date = new Date(NOW + d * ONE_DAY_MS)
    const dayOfWeek = date.getDay()

    if ([1, 3, 5].includes(dayOfWeek)) {
      const startTs = Math.floor(new Date(date).setHours(6, 30, 0, 0) / 1000)
      joseEvents.push({
        uadp_type: 'uadp:calendar_event', id: uid('atlas:event'), ts: startTs,
        label: 'Gym — Strength & HIIT', title: 'Gym — Strength & HIIT',
        description: 'Strength training and HIIT at GymFit Black',
        start_ts: startTs, end_ts: startTs + 3600,
        all_day: false, calendar: 'Fitness', color: '#D50000', recurrence: 'weekly',
      })
    }
    if ([2, 4, 6].includes(dayOfWeek)) {
      const startTs = Math.floor(new Date(date).setHours(6, 0, 0, 0) / 1000)
      joseEvents.push({
        uadp_type: 'uadp:calendar_event', id: uid('atlas:event'), ts: startTs,
        label: '5K Run — Golden Gate Park', title: '5K Run — Golden Gate Park',
        description: 'Morning 5K run at Golden Gate Park',
        start_ts: startTs, end_ts: startTs + 2700,
        all_day: false, calendar: 'Fitness', color: '#D50000', recurrence: 'weekly',
      })
    }
  }

  // Personal one-off events
  const josePersonalEvents = [
    { title: 'Dinner reservation — Atelier Crenn', description: 'Anniversary dinner with Sofia', hour: 20, daysFromNow: 2, location: 'Atelier Crenn, Pacific Heights, SF' },
    { title: 'Sofia\'s Birthday', description: 'Birthday celebration', hour: 19, daysFromNow: 18, location: 'Home' },
    { title: 'Napa Team Retreat', description: 'PerseusOft team building in Napa', hour: 8, daysFromNow: 25, location: 'Napa Valley' },
    { title: 'AWS re:Invent', description: 'Speaking: Serverless ML Inference Architecture', hour: 9, daysFromNow: 45, location: 'Las Vegas Convention Center' },
    { title: 'Tesla Service Appointment', description: '20,000 mile service', hour: 10, daysFromNow: 7, location: 'Tesla Service Center SF' },
    { title: 'Half Marathon SF', description: 'SF Half Marathon 2025', hour: 7, daysFromNow: 30, location: 'Golden Gate Bridge' },
    { title: 'Investor Dinner', description: 'Dinner with Series B investors', hour: 20, daysFromNow: 10, location: 'Quince, SF' },
    { title: 'Family Brunch', description: 'Sunday brunch with parents', hour: 12, daysFromNow: 4, location: 'Mom\'s house' },
  ]

  for (const pe of josePersonalEvents) {
    const date = new Date(NOW + pe.daysFromNow * ONE_DAY_MS)
    const startTs = Math.floor(date.setHours(pe.hour, 0, 0, 0) / 1000)
    joseEvents.push({
      uadp_type: 'uadp:calendar_event', id: uid('atlas:event'), ts: startTs,
      label: pe.title, title: pe.title, description: pe.description,
      start_ts: startTs, end_ts: startTs + 3600,
      all_day: false, location: pe.location,
      calendar: 'Personal', color: '#4285F4', recurrence: null,
    })
  }

  joseEvents.sort((a, b) => a.start_ts - b.start_ts)

  saveUser(dirName, 'atlas-events', { events: joseEvents, calendars: joseCalendars })

  console.log(`\n  Jose Espana: ${15} files generated.`)
}

// ---------------------------------------------------------------------------
// Alex Morgan (Test User)
// ---------------------------------------------------------------------------
{
  faker.seed(2002)
  const dirName = 'test_user'
  console.log('\n--- Generating data for Alex Morgan (test user) ---\n')

  const ALEX = {
    id: 'user:test_user',
    name: 'Alex Morgan',
    handle: '@alex_morgan',
    age: 27,
    city: 'San Francisco',
    country: 'US',
    occupation: 'QA Engineer',
    language: 'en',
    currency: 'USD',
    email: 'test@perseusoft.tech',
    phone: '+1-415-555-5000',
    avatar_url: picsum('alex_morgan_avatar', 200, 200),
    joined_cosmos: '2022-11-01',
  }

  const ALEX_AUTHOR = {
    id: ALEX.id,
    name: ALEX.name,
    handle: ALEX.handle,
    avatar_url: ALEX.avatar_url,
    verified: false,
  }

  // 1. profile.json
  const alexProfile = {
    uadp_type: 'uadp:profile',
    ...ALEX,
    bio: 'QA Engineer at PerseusOft. Gamer, anime nerd, and aspiring developer. Learning Rust on weekends. Lofi beats and instant ramen fuel my debugging sessions.',
    interests: ['gaming', 'anime', 'lofi music', 'QA automation', 'learning to code', 'ramen', 'manga'],
    social_links: {
      nova: '@alex_morgan',
      pulse: '@alex_morgan',
      gaming: 'alexm_gamer',
    },
    stats: {
      nova_followers: 342,
      nova_following: 890,
      pulse_followers: 187,
      pulse_following: 456,
      stream_subscribers: 0,
    },
  }
  saveUser(dirName, 'profile', alexProfile)

  // 2. nova-posts.json
  const ALEX_NOVA_TOPICS = [
    'Just found a race condition in the auth flow that nobody caught for 3 months. QA wins again.',
    'Learning Rust on weekends. The borrow checker is destroying me but I refuse to give up.',
    'New anime season is stacked. My watchlist has 12 shows. When do I sleep?',
    'Lofi beats + Cypress tests = the perfect Friday afternoon.',
    'Hot take: manual QA is underrated. Not everything can be automated.',
    'Jose just reviewed my first PR. Only 47 comments. Progress!',
    'Gaming marathon this weekend. 36 hours of the new RPG release.',
    'Finally automated the regression suite. 200 tests running in 8 minutes.',
    'Budget ramen hack: add an egg, some green onions, and a slice of cheese. Trust me.',
    'Anime convention in SF next month. Who\'s going?',
    'The QA life: finding bugs that developers swear don\'t exist.',
    'Started a Cypress course on LearnHub. The instructor is great.',
    'My gaming setup is finally complete. RGB everywhere.',
    'TIL about property-based testing. This changes everything for our API tests.',
    'Debugging production issues at 11pm. Living the dream.',
    'New mechanical keyboard arrived. The click sounds are so satisfying.',
    'Reading "The Art of Software Testing". Old but gold.',
    'Pizza and anime night with college friends. The perfect combo.',
    'Just hit Diamond rank in the competitive ladder. Let\'s go!',
    'PerseusOft sprint retro: zero critical bugs this sprint. First time ever!',
  ]

  const alexUserPosts = Array.from({ length: 30 }, (_, i) => {
    const d = faker.number.float({ min: 0, max: 180 })
    const topic = i < ALEX_NOVA_TOPICS.length
      ? ALEX_NOVA_TOPICS[i]
      : ALEX_NOVA_TOPICS[i % ALEX_NOVA_TOPICS.length].split('.')[0] + '. ' + faker.lorem.sentence()
    return {
      uadp_type: 'uadp:post' as const,
      id: uid('nova:post'),
      ts: tsSecondsAgo(d, 12),
      label: topic.slice(0, 60),
      body: topic,
      author: ALEX_AUTHOR,
      likes: faker.number.int({ min: 2, max: 120 }),
      reposts: faker.number.int({ min: 0, max: 15 }),
      replies_count: faker.number.int({ min: 0, max: 30 }),
      lang: 'en',
      tags: faker.helpers.arrayElements(
        ['qa', 'gaming', 'anime', 'lofi', 'testing', 'rust', 'sf', 'dev', 'cypress'],
        faker.number.int({ min: 1, max: 3 }),
      ),
      ext: { nova: { boost_score: faker.number.float({ min: 0, max: 1 }) } },
    }
  })

  const alexFeed = Array.from({ length: 200 }, () => {
    const author = faker.helpers.arrayElement(FORTY_AUTHORS)
    const d = faker.number.float({ min: 0, max: 180 })
    const body = faker.lorem.sentences({ min: 1, max: 3 })
    return {
      uadp_type: 'uadp:post' as const,
      id: uid('nova:post'),
      ts: tsSecondsAgo(d, 12),
      label: body.slice(0, 60),
      body,
      author,
      likes: faker.number.int({ min: 0, max: 5000 }),
      reposts: faker.number.int({ min: 0, max: 800 }),
      replies_count: faker.number.int({ min: 0, max: 200 }),
      lang: 'en',
      tags: faker.helpers.arrayElements(
        ['tech', 'gaming', 'anime', 'dev', 'life', 'memes', 'lofi', 'qa'],
        faker.number.int({ min: 0, max: 3 }),
      ),
      ext: { nova: { boost_score: faker.number.float({ min: 0, max: 1 }) } },
    }
  })

  const alexNotifTypes = ['like', 'reply', 'follow', 'mention'] as const
  const alexNotifications = Array.from({ length: 15 }, (_, i) => {
    const type = faker.helpers.arrayElement(alexNotifTypes)
    const actor = faker.helpers.arrayElement(FORTY_AUTHORS)
    const messages: Record<string, string> = {
      like: `${actor.name} liked your post`,
      reply: `${actor.name} replied to your post`,
      follow: `${actor.name} started following you`,
      mention: `${actor.name} mentioned you in a post`,
    }
    return {
      uadp_type: 'uadp:notification' as const,
      id: uid('nova:notif'),
      ts: tsSecondsAgo(faker.number.float({ min: 0, max: 30 }), 6),
      type,
      message: messages[type],
      read: i > 5,
      actor,
      target_id: type !== 'follow' ? uid('nova:post') : undefined,
    }
  })

  saveUser(dirName, 'nova-posts', {
    feed: alexFeed.sort((a, b) => b.ts - a.ts),
    user_posts: alexUserPosts.sort((a, b) => b.ts - a.ts),
    notifications: alexNotifications,
    trending: novaPosts.trending,
  })

  // 3. pulse-photos.json
  const alexCaptions = [
    'New gaming setup. Full RGB mode activated.',
    'Anime convention haul. My wallet is crying.',
    'Budget ramen that looks like a million bucks',
    'Late night debugging with lofi and coffee',
    'My mechanical keyboard collection. Yes, I have a problem.',
    'First PR merged at PerseusOft! Small step, big moment.',
    'Pixel art I made during a boring meeting',
    'My cat judging my code. She\'s a harsh reviewer.',
    'College friends reunion. Pizza and gaming.',
    'New anime figure arrived. Mikasa Ackerman!',
    'Sunset from my tiny apartment balcony',
    'Gaming tournament trophy. Diamond rank!',
    'Office desk at PerseusOft. Minimal but cozy.',
    'Instant ramen art. Added kimchi this time.',
    'Weekend at the gaming cafe with friends',
  ]

  const alexPulseUserPosts = Array.from({ length: 15 }, (_, i) => {
    const id = uid('pulse:post')
    const d = faker.number.float({ min: 0, max: 180 })
    const caption = i < alexCaptions.length ? alexCaptions[i] : faker.lorem.sentence()
    return {
      uadp_type: 'uadp:media_post' as const,
      id,
      ts: tsSecondsAgo(d, 8),
      label: caption.slice(0, 50),
      body: caption,
      author: ALEX_AUTHOR,
      media_url: picsum(`pulse_alex_${i}`, 1080, 1080),
      thumbnail_url: picsum(`pulse_alex_${i}`, 300, 300),
      likes: faker.number.int({ min: 5, max: 200 }),
      reposts: faker.number.int({ min: 0, max: 15 }),
      replies_count: faker.number.int({ min: 0, max: 30 }),
      lang: 'en',
      tags: faker.helpers.arrayElements(
        ['gaming', 'anime', 'food', 'setup', 'code', 'lofi', 'cat', 'pixel'],
        faker.number.int({ min: 1, max: 3 }),
      ),
    }
  })

  const alexPulseFeed = Array.from({ length: 100 }, (_, i) => {
    const id = uid('pulse:post')
    const author = faker.helpers.arrayElement(FORTY_AUTHORS)
    return {
      uadp_type: 'uadp:media_post' as const,
      id,
      ts: tsRandom(180),
      label: faker.lorem.sentence().slice(0, 50),
      body: faker.lorem.sentence(),
      author,
      media_url: picsum(`pulse_alex_feed_${i}`, 1080, 1080),
      thumbnail_url: picsum(`pulse_alex_feed_${i}`, 300, 300),
      likes: faker.number.int({ min: 10, max: 8000 }),
      reposts: faker.number.int({ min: 0, max: 500 }),
      replies_count: faker.number.int({ min: 0, max: 150 }),
      lang: 'en',
      tags: faker.helpers.arrayElements(
        ['photo', 'gaming', 'anime', 'food', 'art', 'meme', 'cosplay', 'pixel'],
        faker.number.int({ min: 1, max: 3 }),
      ),
    }
  })

  const alexStories = Array.from({ length: 5 }, (_, i) => {
    const author = i < 1 ? ALEX_AUTHOR : faker.helpers.arrayElement(FORTY_AUTHORS)
    const storyId = uid('pulse:story')
    const hoursAgo = faker.number.int({ min: 1, max: 23 })
    const tsVal = Math.floor(NOW / 1000) - hoursAgo * 3600
    return {
      uadp_type: 'uadp:story' as const,
      id: storyId,
      author,
      media_url: picsum(`alex_story_${i}`, 1080, 1920),
      ts: tsVal,
      expires_ts: tsVal + 86400,
      viewed: i > 2,
    }
  })

  const alexExplore = faker.helpers.arrayElements([...alexPulseFeed, ...alexPulseUserPosts], 20).map(p => ({ ...p }))

  saveUser(dirName, 'pulse-photos', {
    feed: alexPulseFeed,
    user_posts: alexPulseUserPosts,
    stories: alexStories,
    explore: alexExplore,
  })

  // 4. orbit-transactions.json
  const alexOrbitAccounts = [
    {
      uadp_type: 'uadp:account',
      id: 'orbit:acc:alex:checking',
      label: 'Checking Account',
      type: 'checking',
      balance: { value: 2800, currency: 'USD' },
      currency: 'USD',
    },
  ]

  const alexOrbitCards = [
    {
      uadp_type: 'uadp:card',
      id: 'orbit:card:alex:debit',
      label: 'Orbit Debit Card',
      type: 'debit',
      last_four: '3456',
      account_id: 'orbit:acc:alex:checking',
      network: 'Visa',
      status: 'active',
    },
  ]

  const alexOrbitTx: any[] = []
  let alexRunning = 3500

  // Salary: 3,200 USD biweekly
  for (let d = 90; d >= 0; d--) {
    const date = new Date(NOW - d * ONE_DAY_MS)
    const day = date.getDate()
    if (day === 1 || day === 15) {
      alexRunning += 3200
      alexOrbitTx.push({
        uadp_type: 'uadp:transaction',
        id: uid('orbit:tx'),
        ts: tsSecondsAgo(d, 2),
        label: 'Payroll - PerseusOft',
        amount: { value: 3200, currency: 'USD' },
        direction: 'in',
        status: 'completed',
        merchant: { name: 'PerseusOft', category: 'salary', city: 'San Francisco', country: 'US' },
        balance_after: { value: roundUSD(alexRunning), currency: 'USD' },
        account_id: 'orbit:acc:alex:checking',
      })
    }
  }

  // Recurring monthly
  const alexRecurring = [
    { name: 'Rent - Tenderloin Studio', category: 'housing', amount: 1100 },
    { name: 'Discord Nitro', category: 'entertainment', amount: 9.99 },
    { name: 'CrunchyRoll Premium', category: 'entertainment', amount: 7.99 },
    { name: 'GamePass Ultimate', category: 'gaming', amount: 16.99 },
    { name: 'MobileX Basic Plan', category: 'telecom', amount: 25 },
    { name: 'FibraMax Internet 100Mbps', category: 'telecom', amount: 45 },
  ]

  for (let month = 0; month < 3; month++) {
    for (const exp of alexRecurring) {
      const d = 5 + month * 30 + faker.number.int({ min: 0, max: 3 })
      if (d > 90) continue
      alexRunning -= exp.amount
      alexOrbitTx.push({
        uadp_type: 'uadp:transaction',
        id: uid('orbit:tx'),
        ts: tsSecondsAgo(d, 4),
        label: exp.name,
        amount: { value: exp.amount, currency: 'USD' },
        direction: 'out',
        status: 'completed',
        merchant: { name: exp.name, category: exp.category, city: 'San Francisco', country: 'US' },
        balance_after: { value: roundUSD(alexRunning), currency: 'USD' },
        account_id: 'orbit:acc:alex:checking',
      })
    }
  }

  // Food delivery (Flame) — 4-5x per week (~55 over 90 days)
  for (let i = 0; i < 55; i++) {
    const d = faker.number.float({ min: 0, max: 90 })
    const amount = roundUSD(faker.number.float({ min: 12, max: 25 }))
    alexRunning -= amount
    const places = ['Pizza Vulcano', 'Burger Craft', 'Taqueria Don Julio', 'Wok Express', 'Ramen House', 'QuickBite']
    alexOrbitTx.push({
      uadp_type: 'uadp:transaction',
      id: uid('orbit:tx'),
      ts: tsSecondsAgo(d, 10),
      label: `FlameEats - ${faker.helpers.arrayElement(places)}`,
      amount: { value: amount, currency: 'USD' },
      direction: 'out',
      status: 'completed',
      merchant: { name: 'FlameEats', category: 'food_delivery', city: 'San Francisco', country: 'US' },
      balance_after: { value: roundUSD(alexRunning), currency: 'USD' },
      account_id: 'orbit:acc:alex:checking',
    })
  }

  // Weekly groceries — budget (~13 over 90 days)
  for (let week = 0; week < 13; week++) {
    const d = week * 7 + faker.number.int({ min: 0, max: 2 })
    if (d > 90) continue
    const amount = roundUSD(faker.number.float({ min: 50, max: 80 }))
    alexRunning -= amount
    alexOrbitTx.push({
      uadp_type: 'uadp:transaction',
      id: uid('orbit:tx'),
      ts: tsSecondsAgo(d, 6),
      label: pickBrand('grocery'),
      amount: { value: amount, currency: 'USD' },
      direction: 'out',
      status: 'completed',
      merchant: { name: pickBrand('grocery'), category: 'groceries', city: 'San Francisco', country: 'US' },
      balance_after: { value: roundUSD(alexRunning), currency: 'USD' },
      account_id: 'orbit:acc:alex:checking',
    })
  }

  // Gaming purchases — occasional (~6 over 90 days)
  for (let i = 0; i < 6; i++) {
    const d = faker.number.float({ min: 0, max: 90 })
    const amount = roundUSD(faker.number.float({ min: 20, max: 60 }))
    alexRunning -= amount
    const stores = ['SteamStore', 'GameVault', 'PixelMart', 'IndieHub']
    const store = faker.helpers.arrayElement(stores)
    alexOrbitTx.push({
      uadp_type: 'uadp:transaction',
      id: uid('orbit:tx'),
      ts: tsSecondsAgo(d, 10),
      label: store,
      amount: { value: amount, currency: 'USD' },
      direction: 'out',
      status: 'completed',
      merchant: { name: store, category: 'gaming', city: 'San Francisco', country: 'US' },
      balance_after: { value: roundUSD(alexRunning), currency: 'USD' },
      account_id: 'orbit:acc:alex:checking',
    })
  }

  // Convenience stores (snacks, energy drinks) — ~15 over 90 days
  for (let i = 0; i < 15; i++) {
    const d = faker.number.float({ min: 0, max: 90 })
    const amount = roundUSD(faker.number.float({ min: 3, max: 15 }))
    alexRunning -= amount
    alexOrbitTx.push({
      uadp_type: 'uadp:transaction',
      id: uid('orbit:tx'),
      ts: tsSecondsAgo(d, 10),
      label: pickBrand('convenience'),
      amount: { value: amount, currency: 'USD' },
      direction: 'out',
      status: 'completed',
      merchant: { name: pickBrand('convenience'), category: 'convenience', city: 'San Francisco', country: 'US' },
      balance_after: { value: roundUSD(alexRunning), currency: 'USD' },
      account_id: 'orbit:acc:alex:checking',
    })
  }

  // Public transport/budget rides — ~10 per month (~30 over 90 days)
  for (let i = 0; i < 30; i++) {
    const d = faker.number.float({ min: 0, max: 90 })
    const amount = roundUSD(faker.number.float({ min: 5, max: 15 }))
    alexRunning -= amount
    const services = ['BART SF', 'RidaGo', 'ViaRapido Express']
    const service = faker.helpers.arrayElement(services)
    alexOrbitTx.push({
      uadp_type: 'uadp:transaction',
      id: uid('orbit:tx'),
      ts: tsSecondsAgo(d, 10),
      label: service,
      amount: { value: amount, currency: 'USD' },
      direction: 'out',
      status: 'completed',
      merchant: { name: service, category: 'transport', city: 'San Francisco', country: 'US' },
      balance_after: { value: roundUSD(alexRunning), currency: 'USD' },
      account_id: 'orbit:acc:alex:checking',
    })
  }

  // Fill remaining misc transactions
  const alexRemaining = 10
  for (let i = 0; i < alexRemaining; i++) {
    const cats = [
      { brands: 'pharmacy' as keyof typeof BRANDS, category: 'health', min: 5, max: 25 },
      { brands: 'clothing' as keyof typeof BRANDS, category: 'clothing', min: 15, max: 60 },
    ]
    const cat = faker.helpers.arrayElement(cats)
    const brand = pickBrand(cat.brands)
    const amount = roundUSD(faker.number.float({ min: cat.min, max: cat.max }))
    const d = faker.number.float({ min: 0, max: 90 })
    alexRunning -= amount
    alexOrbitTx.push({
      uadp_type: 'uadp:transaction',
      id: uid('orbit:tx'),
      ts: tsSecondsAgo(d, 10),
      label: brand,
      amount: { value: amount, currency: 'USD' },
      direction: 'out',
      status: 'completed',
      merchant: { name: brand, category: cat.category, city: 'San Francisco', country: 'US' },
      balance_after: { value: roundUSD(alexRunning), currency: 'USD' },
      account_id: 'orbit:acc:alex:checking',
    })
  }

  alexOrbitTx.sort((a, b) => b.ts - a.ts)
  alexOrbitAccounts[0].balance.value = roundUSD(alexRunning > 0 ? alexRunning : 2800)

  saveUser(dirName, 'orbit-transactions', {
    accounts: alexOrbitAccounts,
    transactions: alexOrbitTx,
    cards: alexOrbitCards,
  })

  // 5. zinc-transactions.json
  const alexZincAccounts = [
    {
      uadp_type: 'uadp:account',
      id: 'zinc:acc:alex:mxn',
      label: 'Zinc Pesos',
      type: 'checking' as const,
      balance: { value: 350, currency: 'USD' },
      currency: 'USD',
    },
  ]

  const alexZincCards = [
    {
      uadp_type: 'uadp:card',
      id: 'zinc:card:alex:debit',
      label: 'Zinc Debit Card',
      type: 'debit',
      last_four: '6789',
      account_id: 'zinc:acc:alex:mxn',
      network: 'Mastercard',
      status: 'active',
    },
  ]

  const alexZincTx: any[] = []

  // Gaming purchases
  const alexGamingPurchases = [
    { name: 'Steam Store', amount: 24.99, category: 'gaming' },
    { name: 'Steam Store', amount: 14.99, category: 'gaming' },
    { name: 'Steam Store', amount: 39.99, category: 'gaming' },
    { name: 'Steam Store', amount: 9.99, category: 'gaming' },
    { name: 'GameVault Store', amount: 19.99, category: 'gaming' },
    { name: 'CrunchyrollPremium', amount: 7.99, category: 'entertainment' },
    { name: 'Discord Nitro', amount: 9.99, category: 'social' },
    { name: 'Humble Bundle', amount: 12.00, category: 'gaming' },
    { name: 'LearnHub — Cypress Course', amount: 29.99, category: 'education' },
    { name: 'LearnHub — Rust Basics', amount: 19.99, category: 'education' },
  ]

  for (const purchase of alexGamingPurchases) {
    const d = faker.number.float({ min: 5, max: 170 })
    alexZincTx.push({
      uadp_type: 'uadp:transaction',
      id: uid('zinc:tx'),
      ts: tsSecondsAgo(d, 8),
      label: purchase.name,
      amount: { value: purchase.amount, currency: 'USD' },
      direction: 'out' as const,
      status: 'completed' as const,
      merchant: { name: purchase.name, category: purchase.category, country: 'US' },
      account_id: 'zinc:acc:alex:mxn',
      ext: {
        is_subscription: purchase.name.includes('Crunchyroll') || purchase.name.includes('Discord'),
      },
    })
  }

  // Monthly gaming subs
  for (let month = 0; month < 5; month++) {
    const d = 3 + month * 30
    if (d > 170) continue
    alexZincTx.push({
      uadp_type: 'uadp:transaction',
      id: uid('zinc:tx'),
      ts: tsSecondsAgo(d, 3),
      label: 'CrunchyrollPremium',
      amount: { value: 7.99, currency: 'USD' },
      direction: 'out' as const,
      status: 'completed' as const,
      merchant: { name: 'CrunchyrollPremium', category: 'entertainment', country: 'US' },
      account_id: 'zinc:acc:alex:mxn',
      ext: { is_subscription: true },
    })
  }

  alexZincTx.sort((a, b) => b.ts - a.ts)

  saveUser(dirName, 'zinc-transactions', {
    accounts: alexZincAccounts,
    transactions: alexZincTx,
    cards: alexZincCards,
  })

  // 6. market-orders.json
  const alexProducts = marketOrders.products.slice(0, 100)

  const alexShippingAddress = {
    name: 'Alex Morgan',
    street: '45 Turk St, Apt 3C',
    city: 'San Francisco',
    state: 'CA',
    zip: '94102',
    country: 'US',
  }

  const alexOrderItems = [
    { title: 'RGB Mechanical Keyboard — Blue Switches', price: 109.99, cat: 'Electronics' },
    { title: 'Gaming Mouse ProClick 16000 DPI', price: 49.99, cat: 'Electronics' },
    { title: 'Budget Gaming Headset BassMax', price: 39.99, cat: 'Electronics' },
    { title: 'Anime Figure — Mikasa Ackerman Limited Edition', price: 149.99, cat: 'Collectibles' },
    { title: 'Anime Figure — Gojo Satoru', price: 109.99, cat: 'Collectibles' },
    { title: 'LED Strip RGB 5m', price: 19.99, cat: 'Electronics' },
    { title: 'Budget Monitor Stand', price: 34.99, cat: 'Office' },
    { title: 'Book: The Art of Software Testing', price: 29.99, cat: 'Books' },
    { title: 'Book: Learning Rust — Beginner\'s Guide', price: 24.99, cat: 'Books' },
    { title: 'Instant Ramen Variety Pack x24', price: 17.99, cat: 'Food' },
    { title: 'Energy Drink Pack x12 — Monster', price: 24.99, cat: 'Food' },
    { title: 'Mouse Pad XXL — Anime Design', price: 19.99, cat: 'Electronics' },
  ]

  const alexOrders = alexOrderItems.map((item, i) => {
    const d = faker.number.float({ min: 1, max: 180 })
    const status = i === 0 ? 'shipped' : faker.helpers.weightedArrayElement([
      { value: 'delivered', weight: 0.8 },
      { value: 'pending', weight: 0.1 },
      { value: 'cancelled', weight: 0.1 },
    ])
    return {
      uadp_type: 'uadp:order' as const,
      id: uid('market:order'),
      ts: tsSecondsAgo(d, 4),
      label: `Order #${3000 + i}`,
      status,
      total: { value: item.price, currency: 'USD' },
      items: [{
        product_id: uid('market:prod'),
        title: item.title,
        qty: 1,
        unit_price: { value: item.price, currency: 'USD' },
        image_url: picsum(`alex_order_${i}`, 600, 600),
      }],
      shipping_address: alexShippingAddress,
      tracking_number: status === 'shipped' ? `TRK${faker.string.alphanumeric(12).toUpperCase()}` : undefined,
    }
  })

  const alexCartProducts = faker.helpers.arrayElements(alexProducts, 2)
  const alexCart = {
    items: alexCartProducts.map(p => ({
      product_id: p.id,
      title: p.title,
      qty: 1,
      unit_price: p.price,
      image_url: p.image_url,
    })),
  }

  const alexWishlist = faker.helpers.arrayElements(alexProducts, 5).map(p => ({
    product_id: p.id,
    title: p.title,
    price: p.price,
    image_url: p.image_url,
    added_ts: tsRandom(60),
  }))

  saveUser(dirName, 'market-orders', {
    orders: alexOrders,
    products: alexProducts,
    cart: alexCart,
    wishlist: alexWishlist,
  })

  // 7. stream-history.json
  const alexChannelNames = [
    'GameXplain', 'Dunkey Gaming', 'The Anime Man', 'Trash Taste',
    'Fireship', 'FreeCodeCamp', 'Cypress Tutorial', 'The Testing Academy',
    'Lofi Girl', 'GameMakers Toolkit',
  ]

  const alexChannels = alexChannelNames.map((name, i) => ({
    id: uid('stream:ch'),
    name,
    subscribers: faker.number.int({ min: 10000, max: 15_000_000 }),
    avatar_url: picsum(`alex_ch_${i}`, 100, 100),
  }))

  const alexVideoTitles = [
    'Best RPGs of 2025 — Top 20 Ranked',
    'Cypress vs Playwright: Which Should You Learn?',
    'Top 10 Anime of the Season — Winter 2025',
    'How to Start Learning Rust in 2025',
    'Gaming on a Budget — Best Peripherals Under $50',
    'Why Lofi Beats Help You Focus',
    'QA Engineering Career Path — From Manual to Automation',
    'Building Your First Test Suite with Cypress',
    'Anime OST Tier List — The Definitive Ranking',
    'Budget Gaming PC Build Under $800 USD',
    'Learn TypeScript in 1 Hour',
    'The Best Ramen in SF — A Food Tour',
    'Mechanical Keyboards: A Beginner\'s Guide',
    'How I Went from QA to Full-Stack Developer',
    'Top 10 Indie Games You Missed',
  ]

  function makeAlexVideo(channelOverride?: typeof alexChannels[0], daysRange = 180) {
    const channel = channelOverride || faker.helpers.arrayElement(alexChannels)
    const vidId = uid('stream:vid')
    return {
      uadp_type: 'uadp:video' as const,
      id: vidId,
      ts: tsRandom(daysRange),
      label: faker.helpers.arrayElement(alexVideoTitles),
      title: faker.helpers.arrayElement(alexVideoTitles),
      description: faker.lorem.paragraph(),
      channel: { id: channel.id, name: channel.name, subscribers: channel.subscribers },
      duration_seconds: faker.number.int({ min: 120, max: 7200 }),
      views: faker.number.int({ min: 500, max: 10_000_000 }),
      likes: faker.number.int({ min: 20, max: 500_000 }),
      thumbnail_url: picsum(vidId, 1280, 720),
      tags: faker.helpers.arrayElements(
        ['gaming', 'anime', 'tutorial', 'qa', 'cypress', 'rust', 'lofi', 'review', 'budget'],
        faker.number.int({ min: 1, max: 4 }),
      ),
    }
  }

  const alexFeedVideos = Array.from({ length: 60 }, () => makeAlexVideo())

  const alexHistory = Array.from({ length: 80 }, () => {
    const vid = makeAlexVideo(undefined, 180)
    return {
      ...vid,
      watched_seconds: faker.number.int({ min: 30, max: vid.duration_seconds }),
      watched_at: tsRandom(90),
    }
  })

  const alexSubs = alexChannels.map(ch => ({
    uadp_type: 'uadp:subscription' as const,
    channel_id: ch.id,
    channel_name: ch.name,
    channel_avatar: ch.avatar_url,
    subscribers: ch.subscribers,
    subscribed_at: tsRandom(365),
    notifications_enabled: faker.datatype.boolean(0.5),
  }))

  saveUser(dirName, 'stream-history', {
    feed: alexFeedVideos,
    history: alexHistory,
    subscriptions: alexSubs,
    user_videos: [],
  })

  // 8. echo-conversations.json
  const alexAle = { id: ALEX.id, name: ALEX.name }
  const joseContact = { id: 'user:jose_espana', name: 'Jose España' }
  const gamingFriends = [
    { id: 'user:kevin_park', name: 'Kevin Park' },
    { id: 'user:yuki_tanaka', name: 'Yuki Tanaka' },
    { id: 'user:diego_ramirez', name: 'Diego Ramirez' },
  ]
  const collegeFriends = [
    { id: 'user:sara_lopez', name: 'Sara Lopez' },
    { id: 'user:marco_silva', name: 'Marco Silva' },
    { id: 'user:diana_cruz', name: 'Diana Cruz' },
  ]
  const alexTeamContacts = [
    joseContact,
    { id: 'user:laura_chen', name: 'Laura Chen' },
    { id: 'user:miguel_santos', name: 'Miguel Santos' },
    { id: 'user:ana_garcia', name: 'Ana Garcia' },
  ]

  const alexConvDefs = [
    {
      type: 'group' as const,
      name: 'PerseusOft Team',
      members: [alexAle, ...alexTeamContacts],
      msgCount: 60,
      topicPool: [
        'QA report is ready for sprint 47.',
        'Found a regression in the payment flow after the last merge.',
        'Running the full test suite now. ETA 15 min.',
        'Jose, PR #891 needs your sign-off before merge.',
        'All Cypress tests passing. Green light for deploy.',
        'Can someone help me reproduce this edge case?',
        'Sprint retro: what went well, what didn\'t?',
        'The staging environment is down again.',
        'I wrote 20 new integration tests this week.',
        'Lunch at the deli next door?',
      ],
    },
    {
      type: 'direct' as const,
      name: 'Jose España',
      members: [alexAle, joseContact],
      msgCount: 40,
      topicPool: [
        'Hey Jose, I found a critical bug in the auth flow.',
        'Thanks for the code review feedback. I\'ll fix those issues.',
        'Can we pair on the Cypress setup this afternoon?',
        'The regression suite is at 200 tests now!',
        'I\'m stuck on this Rust exercise. Any hints?',
        'Your talk at Tech Summit was awesome!',
        'Can I take Friday off? I want to go to the anime convention.',
        'The test coverage went from 45% to 72% this quarter.',
        'Hey, which book should I read next for testing?',
        'Thanks for mentoring me. I\'m learning a lot.',
      ],
    },
    {
      type: 'group' as const,
      name: 'Gaming Squad',
      members: [alexAle, ...gamingFriends],
      msgCount: 30,
      topicPool: [
        'Anyone online tonight? Let\'s run some ranked matches.',
        'New update dropped! The meta is completely different now.',
        'I just hit Diamond rank! Let\'s gooo!',
        'Gaming marathon this Saturday. Who\'s in?',
        'That last match was insane. GG everyone.',
        'New RPG releases next month. Pre-ordering?',
        'Kevin, you need to stop picking that character. It\'s broken.',
        'Anime convention tickets are on sale. Group buy?',
        'LAN party at my place next weekend?',
      ],
    },
    {
      type: 'group' as const,
      name: 'College Friends',
      members: [alexAle, ...collegeFriends],
      msgCount: 20,
      topicPool: [
        'Who\'s coming to the reunion this Friday?',
        'Pizza night at the usual place?',
        'Sara got promoted! Congrats!',
        'Remember that professor who always lost the exams?',
        'Anyone want to study for the certification together?',
        'Movie night this weekend? New anime movie is out.',
        'Marco, you still owe me $20 from last time.',
      ],
    },
  ]

  const alexConversations: any[] = []
  const alexMessages: Record<string, any[]> = {}

  for (const def of alexConvDefs) {
    const convId = uid('echo:conv')
    const convMsgs: any[] = []

    for (let m = 0; m < def.msgCount; m++) {
      const d = faker.number.float({ min: 0, max: 60 })
      const author = faker.helpers.arrayElement(def.members)
      const body = faker.helpers.arrayElement(def.topicPool)
      convMsgs.push({
        uadp_type: 'uadp:message',
        id: uid('echo:msg'),
        conversation_id: convId,
        body,
        author: { id: author.id, name: author.name },
        ts: tsSecondsAgo(d, 12),
        read: d > 0.5,
      })
    }

    convMsgs.sort((a, b) => a.ts - b.ts)
    alexMessages[convId] = convMsgs

    const lastMsg = convMsgs[convMsgs.length - 1]
    const unread = convMsgs.filter(m => !m.read).length

    alexConversations.push({
      uadp_type: 'uadp:conversation',
      id: convId,
      ts: lastMsg.ts,
      label: def.name,
      type: def.type,
      name: def.name,
      members: def.members,
      last_message: {
        body: lastMsg.body,
        author: lastMsg.author.name,
        ts: lastMsg.ts,
      },
      unread_count: unread,
      muted: faker.datatype.boolean(0.15),
    })
  }

  alexConversations.sort((a, b) => b.ts - a.ts)

  saveUser(dirName, 'echo-conversations', {
    conversations: alexConversations,
    messages: alexMessages,
  })

  // 9. herald-articles.json (shared)
  saveUser(dirName, 'herald-articles', heraldArticles)

  // 10. lyra-music.json
  const alexPlaylistDefs = [
    { name: 'Lofi Study Beats', desc: 'Chill lofi hip hop for late night study and coding' },
    { name: 'Anime OST', desc: 'The best anime openings and soundtracks' },
    { name: 'Gaming Hype', desc: 'High energy tracks for ranked matches' },
    { name: 'Chill', desc: 'Relaxing vibes for after-work unwinding' },
  ]

  const alexPlaylists = alexPlaylistDefs.map((def, i) => {
    const playlistTracks = faker.helpers.arrayElements(lyraMusic.tracks, faker.number.int({ min: 15, max: 40 }))
    return {
      uadp_type: 'uadp:playlist' as const,
      id: uid('lyra:playlist'),
      name: def.name,
      description: def.desc,
      cover_url: picsum(`alex_playlist_${i}`, 600, 600),
      owner: { id: ALEX.id, name: ALEX.name },
      track_count: playlistTracks.length,
      duration_seconds: playlistTracks.reduce((s, t) => s + t.duration_seconds, 0),
      followers: faker.number.int({ min: 0, max: 200 }),
      is_public: true,
      tracks: playlistTracks.map(t => t.id),
    }
  })

  const alexRecentlyPlayed = faker.helpers.arrayElements(lyraMusic.tracks, 25).map(t => ({
    ...t,
    played_at: tsRandom(14),
  })).sort((a, b) => b.played_at - a.played_at)

  const alexLikedTracks = faker.helpers.arrayElements(lyraMusic.tracks, 20).map(t => t.id)

  saveUser(dirName, 'lyra-music', {
    tracks: lyraMusic.tracks.slice(0, 200),
    playlists: alexPlaylists,
    recently_played: alexRecentlyPlayed,
    liked_tracks: alexLikedTracks,
    artists: lyraMusic.artists,
    albums: lyraMusic.albums,
  })

  // 11. vortex-catalog.json
  const alexContinueWatching = faker.helpers.arrayElements(vortexCatalog.catalog.filter(
    (t: any) => ['Animation', 'Action', 'Comedy'].some(g => t.genre?.includes(g))
  ).length > 0 ? vortexCatalog.catalog.filter(
    (t: any) => ['Animation', 'Action', 'Comedy'].some(g => t.genre?.includes(g))
  ) : vortexCatalog.catalog, 10).map((t: any) => ({
    ...t,
    progress: t.type === 'series'
      ? { season: faker.number.int({ min: 1, max: (t as any).seasons || 1 }), episode: faker.number.int({ min: 1, max: 8 }), percent: faker.number.int({ min: 10, max: 85 }) }
      : { percent: faker.number.int({ min: 10, max: 85 }) },
  }))

  const alexMyList = faker.helpers.arrayElements(vortexCatalog.catalog, 25).map((t: any) => t.id)

  saveUser(dirName, 'vortex-catalog', {
    catalog: vortexCatalog.catalog,
    continue_watching: alexContinueWatching,
    my_list: alexMyList,
    trending: vortexCatalog.trending,
  })

  // 12. beacon-emails.json
  const alexSenders = [
    { name: 'PerseusOft HR', address: 'hr@perseusoft.tech' },
    { name: 'Jose España', address: 'jose.espana@perseusoft.tech' },
    { name: 'Laura Chen', address: 'laura.chen@perseusoft.tech' },
    { name: 'GitHub Notifications', address: 'noreply@github-demo.local' },
    { name: 'Steam Store', address: 'noreply@steam-demo.local' },
    { name: 'CrunchyrollPremium', address: 'noreply@crunchyroll-demo.local' },
    { name: 'LearnHub', address: 'courses@learnhub-demo.local' },
    { name: 'MercadoMart', address: 'orders@mercadomart-demo.local' },
    { name: 'Orbit Bank', address: 'notifications@orbit-demo.local' },
    { name: 'Gaming Community SF', address: 'newsletter@gamingsf-demo.local' },
    { name: 'Sara Lopez', address: 'sara.lopez@correo-demo.local' },
    { name: 'College Alumni', address: 'alumni@university-demo.local' },
  ]

  const alexSubjectPool = [
    'PerseusOft: Your biweekly pay stub is available',
    '[PR #892] fix: update test fixtures — approved',
    'Jose left feedback on your PR',
    'Sprint 47 QA Report — Review Needed',
    'Steam: Your purchase receipt — $24.99 USD',
    'Steam: Winter Sale starts now! Up to 80% off',
    'CrunchyrollPremium: New anime this week',
    'LearnHub: Certificate — Cypress Fundamentals Complete!',
    'LearnHub: New Course Available — Advanced Cypress',
    'MercadoMart: Your order #3001 has shipped',
    'MercadoMart: Rate your recent purchase',
    'Orbit: Weekly account summary',
    'Orbit: Debit charge alert — $15 USD',
    'Gaming Tournament SF — Registration Open',
    'Anime Convention SF 2025 — Early Bird Tickets',
    'Sara: Pizza night Friday?',
    'College Alumni: Annual Meetup — Save the Date',
    'PerseusOft: Welcome to Sprint 48',
    'GitHub: 3 pull requests need your review',
    'LearnHub: Your Rust course progress — 35% complete',
  ]

  const alexEmail = { name: ALEX.name, address: ALEX.email }

  const alexInbox = Array.from({ length: 35 }, (_, i) => {
    const sender = faker.helpers.arrayElement(alexSenders)
    const subject = i < alexSubjectPool.length ? alexSubjectPool[i] : `Re: ${faker.lorem.sentence().slice(0, 40)}`
    return {
      uadp_type: 'uadp:email' as const,
      id: uid('beacon:email'),
      ts: tsRandom(90),
      label: subject,
      subject,
      from: sender,
      to: [alexEmail],
      body_text: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 3 })),
      folder: 'inbox' as const,
      read: i > 6,
      starred: faker.datatype.boolean(0.1),
      attachments: faker.datatype.boolean(0.1)
        ? [{ name: `${faker.system.fileName()}.pdf`, size_bytes: faker.number.int({ min: 10000, max: 2000000 }), type: 'application/pdf' }]
        : undefined,
    }
  })

  const alexSent = Array.from({ length: 10 }, (_, i) => {
    const recipient = faker.helpers.arrayElement(alexSenders)
    const subject = i < 3 ? [
      'Re: Sprint 47 QA Report — Submitted',
      'Re: Pizza night Friday? — I\'m in!',
      'Re: Jose left feedback on your PR — Fixed!',
    ][i] : `Re: ${faker.lorem.sentence().slice(0, 40)}`
    return {
      uadp_type: 'uadp:email' as const,
      id: uid('beacon:email'),
      ts: tsRandom(90),
      label: subject,
      subject,
      from: alexEmail,
      to: [recipient],
      body_text: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 2 })),
      folder: 'sent' as const,
      read: true,
      starred: false,
    }
  })

  const alexDrafts = Array.from({ length: 5 }, () => {
    const recipient = faker.helpers.arrayElement(alexSenders)
    return {
      uadp_type: 'uadp:email' as const,
      id: uid('beacon:email'),
      ts: tsRandom(30),
      label: faker.lorem.sentence().slice(0, 40),
      subject: faker.lorem.sentence().slice(0, 40),
      from: alexEmail,
      to: [recipient],
      body_text: faker.lorem.sentences(faker.number.int({ min: 1, max: 2 })),
      folder: 'drafts' as const,
      read: true,
      starred: false,
    }
  })

  const alexAllEmails = [...alexInbox, ...alexSent, ...alexDrafts].sort((a, b) => b.ts - a.ts)

  saveUser(dirName, 'beacon-emails', {
    emails: alexAllEmails,
    folders: {
      inbox: { count: alexInbox.length, unread: alexInbox.filter(e => !e.read).length },
      sent: { count: alexSent.length },
      drafts: { count: alexDrafts.length },
      spam: { count: 5 },
      trash: { count: 3 },
    },
  })

  // 13. compass-rides.json
  const alexPlaces = [
    { name: 'Tenderloin Apartment', lat: 37.7837, lng: -122.4128 },
    { name: 'PerseusOft HQ — SoMa', lat: 37.7849, lng: -122.3994 },
    { name: 'Gaming Cafe — Pixel Arena', lat: 37.7785, lng: -122.4100 },
    { name: 'Westfield Mall', lat: 37.7841, lng: -122.4075 },
    { name: 'BART Powell Station', lat: 37.7844, lng: -122.4080 },
    { name: 'MiniExpress Convenience', lat: 37.7830, lng: -122.4120 },
    { name: 'College Campus', lat: 37.7694, lng: -122.4529 },
  ]

  const alexVehicles = [
    'Nissan Sentra White 2023', 'Toyota Corolla Grey 2022', 'Honda Civic Black 2021',
    'Hyundai Elantra Grey 2022', 'Volkswagen Jetta Blue 2023',
  ]

  const alexRides = Array.from({ length: 20 }, () => {
    const origin = faker.helpers.arrayElement(alexPlaces)
    let destination = faker.helpers.arrayElement(alexPlaces)
    while (destination.name === origin.name) {
      destination = faker.helpers.arrayElement(alexPlaces)
    }
    const distance = roundUSD(faker.number.float({ min: 1.5, max: 15 }))
    const duration = Math.floor(distance * faker.number.float({ min: 3, max: 6 }))
    const rideType = faker.helpers.arrayElement(['standard', 'standard', 'shared'] as const)
    const baseFare = distance * faker.number.float({ min: 1.2, max: 2.5 })
    const multiplier = rideType === 'shared' ? 0.7 : 1.0
    const fare = roundUSD(baseFare * multiplier)

    return {
      uadp_type: 'uadp:ride' as const,
      id: uid('compass:ride'),
      ts: tsRandom(90),
      label: `${origin.name} → ${destination.name}`,
      status: faker.helpers.weightedArrayElement([
        { value: 'completed' as const, weight: 0.9 },
        { value: 'cancelled' as const, weight: 0.1 },
      ]),
      origin: { name: origin.name, lat: origin.lat + faker.number.float({ min: -0.002, max: 0.002 }), lng: origin.lng + faker.number.float({ min: -0.002, max: 0.002 }) },
      destination: { name: destination.name, lat: destination.lat + faker.number.float({ min: -0.002, max: 0.002 }), lng: destination.lng + faker.number.float({ min: -0.002, max: 0.002 }) },
      distance_km: distance,
      duration_minutes: duration,
      fare: { value: fare, currency: 'USD' },
      driver: {
        name: `${faker.person.firstName()} ${faker.person.lastName()}`,
        rating: roundUSD(faker.number.float({ min: 4.0, max: 5.0 })),
        vehicle: faker.helpers.arrayElement(alexVehicles),
        plate: `${faker.string.alpha({ length: 3, casing: 'upper' })}-${faker.string.numeric(4)}`,
      },
      ride_type: rideType,
    }
  }).sort((a, b) => b.ts - a.ts)

  const alexSavedPlaces = [
    { id: uid('compass:place'), name: 'Home', label: 'My apartment', address: '45 Turk St, Apt 3C, Tenderloin, SF', lat: 37.7837, lng: -122.4128, category: 'home' as const },
    { id: uid('compass:place'), name: 'Work', label: 'PerseusOft', address: '101 2nd St, Floor 18, SoMa, SF', lat: 37.7849, lng: -122.3994, category: 'work' as const },
    { id: uid('compass:place'), name: 'Pixel Arena', label: 'Gaming cafe', address: '120 Valencia St, Mission, SF', lat: 37.7785, lng: -122.4100, category: 'favorite' as const },
  ].map(p => ({ uadp_type: 'uadp:saved_place' as const, ...p }))

  saveUser(dirName, 'compass-rides', { rides: alexRides, saved_places: alexSavedPlaces })

  // 14. flame-orders.json (Alex orders A LOT)
  const alexRestaurants = [
    { id: uid('flame:rest'), name: 'Pizza Vulcano', cuisine: 'Italian', rating: 4.3, image_url: picsum('alex_rest_0', 400, 300) },
    { id: uid('flame:rest'), name: 'Burger Craft', cuisine: 'American', rating: 4.4, image_url: picsum('alex_rest_1', 400, 300) },
    { id: uid('flame:rest'), name: 'Taqueria Don Julio', cuisine: 'Mexican', rating: 4.8, image_url: picsum('alex_rest_2', 400, 300) },
    { id: uid('flame:rest'), name: 'Ramen Ichiban', cuisine: 'Japanese', rating: 4.5, image_url: picsum('alex_rest_3', 400, 300) },
    { id: uid('flame:rest'), name: 'Wok Express', cuisine: 'Chinese', rating: 4.2, image_url: picsum('alex_rest_4', 400, 300) },
    { id: uid('flame:rest'), name: 'Pollo Express', cuisine: 'Mexican', rating: 4.1, image_url: picsum('alex_rest_5', 400, 300) },
    { id: uid('flame:rest'), name: 'Hot Dog Mania', cuisine: 'American', rating: 4.0, image_url: picsum('alex_rest_6', 400, 300) },
    { id: uid('flame:rest'), name: 'Sushi Budget Roll', cuisine: 'Japanese', rating: 4.2, image_url: picsum('alex_rest_7', 400, 300) },
  ]

  const alexFlameMenus: Record<string, { name: string; price: number }[]> = {
    Italian: [
      { name: 'Pizza Pepperoni Large', price: 17.99 }, { name: 'Garlic Bread', price: 5.99 },
      { name: 'Coca Cola 600ml', price: 2.99 }, { name: 'Pizza Hawaiian Medium', price: 14.99 },
    ],
    American: [
      { name: 'Double Burger Combo', price: 15.99 }, { name: 'French Fries Large', price: 5.99 },
      { name: 'Milkshake', price: 6.99 }, { name: 'BBQ Wings x8', price: 11.99 },
      { name: 'Hot Dog Classic', price: 5.99 }, { name: 'Onion Rings', price: 4.99 },
    ],
    Mexican: [
      { name: 'Tacos al Pastor x6', price: 11.99 }, { name: 'Quesadilla Combo', price: 9.49 },
      { name: 'Horchata 1L', price: 3.99 }, { name: 'Elote Preparado', price: 4.49 },
      { name: 'Grilled Chicken Burrito', price: 10.99 },
    ],
    Japanese: [
      { name: 'Tonkotsu Ramen', price: 14.99 }, { name: 'Gyoza x6', price: 8.99 },
      { name: 'California Roll x8', price: 11.99 }, { name: 'Green Tea', price: 2.99 },
      { name: 'Budget Sushi Combo x12', price: 16.99 },
    ],
    Chinese: [
      { name: 'Fried Rice Special', price: 10.99 }, { name: 'Spring Rolls x4', price: 5.99 },
      { name: 'Kung Pao Chicken', price: 11.99 }, { name: 'Chow Mein', price: 10.99 },
    ],
  }

  const alexFlameOrders = Array.from({ length: 25 }, () => {
    const restaurant = faker.helpers.arrayElement(alexRestaurants)
    const menu = alexFlameMenus[restaurant.cuisine] || [
      { name: 'Combo Meal', price: 11.99 }, { name: 'Drink', price: 2.99 },
    ]
    const numItems = faker.number.int({ min: 1, max: 3 })
    const selectedItems = faker.helpers.arrayElements(menu, Math.min(numItems, menu.length)).map(item => ({
      name: item.name,
      qty: faker.number.int({ min: 1, max: 2 }),
      unit_price: { value: item.price, currency: 'USD' },
    }))
    const subtotal = selectedItems.reduce((s, it) => s + it.unit_price.value * it.qty, 0)
    const deliveryFee = roundUSD(faker.number.float({ min: 1.99, max: 4.99 }))
    const total = roundUSD(subtotal + deliveryFee)

    return {
      uadp_type: 'uadp:food_order' as const,
      id: uid('flame:order'),
      ts: tsRandom(90),
      label: `${restaurant.name} — $${total} USD`,
      status: faker.helpers.weightedArrayElement([
        { value: 'delivered' as const, weight: 0.88 },
        { value: 'cancelled' as const, weight: 0.07 },
        { value: 'in_progress' as const, weight: 0.05 },
      ]),
      restaurant,
      items: selectedItems,
      total: { value: total, currency: 'USD' },
      delivery_fee: { value: deliveryFee, currency: 'USD' },
      delivery_address: '45 Turk St, Apt 3C, Tenderloin, SF',
      estimated_minutes: faker.number.int({ min: 20, max: 50 }),
    }
  }).sort((a, b) => b.ts - a.ts)

  saveUser(dirName, 'flame-orders', {
    orders: alexFlameOrders,
    restaurants: alexRestaurants,
    favorites: alexRestaurants.slice(0, 5).map(r => r.id),
  })

  // 15. atlas-events.json
  const alexCalendars = [
    { name: 'Personal', color: '#4285F4' },
    { name: 'Work', color: '#0B8043' },
  ]

  const alexEvents: any[] = []

  // Work recurring events
  for (let d = -7; d <= 30; d++) {
    const date = new Date(NOW + d * ONE_DAY_MS)
    const dayOfWeek = date.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) continue

    // Daily standup
    const standupTs = Math.floor(new Date(date).setHours(10, 0, 0, 0) / 1000)
    alexEvents.push({
      uadp_type: 'uadp:calendar_event', id: uid('atlas:event'), ts: standupTs,
      label: 'Daily Standup', title: 'Daily Standup',
      description: 'Daily team standup meeting',
      start_ts: standupTs, end_ts: standupTs + 900,
      all_day: false, calendar: 'Work', color: '#0B8043', recurrence: 'daily',
      attendees: [
        { name: 'Jose España', email: 'jose.espana@perseusoft.tech', status: 'accepted' as const },
        { name: 'Laura Chen', email: 'laura.chen@perseusoft.tech', status: 'accepted' as const },
      ],
    })

    // QA Review Wednesday
    if (dayOfWeek === 3) {
      const qaTs = Math.floor(new Date(date).setHours(14, 0, 0, 0) / 1000)
      alexEvents.push({
        uadp_type: 'uadp:calendar_event', id: uid('atlas:event'), ts: qaTs,
        label: 'QA Review Session', title: 'QA Review Session',
        description: 'Weekly QA review — test results and bug triage',
        start_ts: qaTs, end_ts: qaTs + 2700,
        all_day: false, calendar: 'Work', color: '#0B8043', recurrence: 'weekly',
      })
    }

    // Sprint planning Monday
    if (dayOfWeek === 1) {
      const spTs = Math.floor(new Date(date).setHours(11, 0, 0, 0) / 1000)
      alexEvents.push({
        uadp_type: 'uadp:calendar_event', id: uid('atlas:event'), ts: spTs,
        label: 'Sprint Planning', title: 'Sprint Planning',
        description: 'Monday sprint planning with the team',
        start_ts: spTs, end_ts: spTs + 3600,
        all_day: false, calendar: 'Work', color: '#0B8043', recurrence: 'weekly',
      })
    }
  }

  // Personal events
  const alexPersonalEvents = [
    { title: 'Gaming Tournament — Pixel Arena', description: 'Monthly gaming tournament. Competitive bracket.', hour: 18, daysFromNow: 5, location: 'Pixel Arena, Mission, SF' },
    { title: 'Anime Convention SF', description: 'Annual anime convention. Cosplay contest and merch.', hour: 10, daysFromNow: 20, location: 'Moscone Center, SF' },
    { title: 'Sara\'s Birthday', description: 'College friend Sara\'s birthday party', hour: 20, daysFromNow: 12, location: 'Sara\'s apartment, SoMa' },
    { title: 'Pizza Night with Friends', description: 'Weekly pizza and gaming night', hour: 19, daysFromNow: 3, location: 'Marco\'s apartment' },
    { title: 'Rust Study Group', description: 'Weekly Rust learning session online', hour: 20, daysFromNow: 6 },
    { title: 'Dentist Appointment', description: 'Annual checkup', hour: 11, daysFromNow: 15, location: 'Dental Clinic, Market St' },
    { title: 'Gaming PC Upgrade', description: 'Pick up new GPU from store', hour: 14, daysFromNow: 8, location: 'TechZone, Westfield Mall' },
    { title: 'College Alumni Meetup', description: 'Semester reunion', hour: 19, daysFromNow: 25, location: 'University Campus' },
  ]

  for (const pe of alexPersonalEvents) {
    const date = new Date(NOW + pe.daysFromNow * ONE_DAY_MS)
    const startTs = Math.floor(date.setHours(pe.hour, 0, 0, 0) / 1000)
    alexEvents.push({
      uadp_type: 'uadp:calendar_event', id: uid('atlas:event'), ts: startTs,
      label: pe.title, title: pe.title, description: pe.description,
      start_ts: startTs, end_ts: startTs + 3600,
      all_day: false, location: (pe as any).location,
      calendar: 'Personal', color: '#4285F4', recurrence: null,
    })
  }

  alexEvents.sort((a, b) => a.start_ts - b.start_ts)

  saveUser(dirName, 'atlas-events', { events: alexEvents, calendars: alexCalendars })

  console.log(`\n  Alex Morgan: ${15} files generated.`)
}

console.log('\nDone!')
