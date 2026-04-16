/** Scraper configuration from environment. */

export const config = {
  mongo: {
    uri: process.env.MONGO_URI ?? "mongodb://localhost:27017",
    db: process.env.MONGO_DB ?? "astral_uadp",
  },
  limits: {
    articles: parseInt(process.env.SCRAPE_ARTICLES_MAX ?? "500", 10),
    videos: parseInt(process.env.SCRAPE_VIDEOS_MAX ?? "30", 10),
    products: parseInt(process.env.SCRAPE_PRODUCTS_MAX ?? "20", 10),
    posts: parseInt(process.env.SCRAPE_POSTS_MAX ?? "200", 10),
    tracks: parseInt(process.env.SCRAPE_TRACKS_MAX ?? "100", 10),
  },
  rss: {
    tech: (process.env.RSS_TECH ?? "").split(",").filter(Boolean),
    world: (process.env.RSS_WORLD ?? "").split(",").filter(Boolean),
    science: (process.env.RSS_SCIENCE ?? "").split(",").filter(Boolean),
    economy: (process.env.RSS_ECONOMY ?? "").split(",").filter(Boolean),
    health: (process.env.RSS_HEALTH ?? "").split(",").filter(Boolean),
  },
  ytChannels: (process.env.YT_CHANNELS ?? "").split(",").filter(Boolean),
  rssProducts: (process.env.RSS_PRODUCTS ?? "").split(",").filter(Boolean),
  // RSSHub (self-hosted) for Twitter/X scraping
  rsshubUrl: process.env.RSSHUB_URL ?? "",
  twitterAccounts: (process.env.TWITTER_ACCOUNTS ?? "").split(",").filter(Boolean),
  twitterKeywords: (process.env.TWITTER_KEYWORDS ?? "").split(",").filter(Boolean),
  // Last.fm for music
  lastfmApiKey: process.env.LASTFM_API_KEY ?? "",
  cron: process.env.SCRAPE_CRON ?? "0 0 * * *",
};
