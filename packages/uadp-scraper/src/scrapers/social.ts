/**
 * Social/Twitter scraper — fetches tweets via RSSHub (self-hosted) and
 * stores as uadp:post objects in MongoDB for the Nova service.
 *
 * RSSHub generates RSS feeds from Twitter accounts/hashtags/lists
 * without needing a Twitter API key.
 *
 * Feed patterns (RSSHub):
 *   /twitter/user/:id          → timeline of a user
 *   /twitter/keyword/:keyword  → search by keyword
 *   /twitter/trending          → trending topics
 */

import { fetchRSS } from "./rss.js";
import { posts } from "../db.js";
import { config } from "../config.js";

/** Map RSSHub-style paths to Nova categories. */
interface SocialFeed {
  url: string;
  category: string;
}

function buildFeeds(): SocialFeed[] {
  const base = config.rsshubUrl;
  if (!base) return [];
  const feeds: SocialFeed[] = [];

  // Trending
  feeds.push({ url: `${base}/twitter/trending`, category: "trending" });

  // User timelines
  for (const handle of config.twitterAccounts) {
    feeds.push({ url: `${base}/twitter/user/${handle}`, category: "timeline" });
  }

  // Keyword searches
  for (const kw of config.twitterKeywords) {
    feeds.push({ url: `${base}/twitter/keyword/${encodeURIComponent(kw)}`, category: "search" });
  }

  return feeds;
}

export async function scrapeSocial(): Promise<number> {
  const feeds = buildFeeds();
  if (feeds.length === 0) {
    console.log("[social] No RSSHub URL or feeds configured, skipping");
    return 0;
  }

  let total = 0;
  const max = config.limits.posts;

  for (const feed of feeds) {
    if (total >= max) break;
    try {
      const items = await fetchRSS(feed.url);
      console.log(`[social] ${feed.category}: ${items.length} items from ${feed.url}`);

      for (const item of items) {
        if (total >= max) break;
        const existing = await posts().findOne({ url: item.url });
        if (existing) continue;

        // Extract handle from URL or title
        const handleMatch = item.url.match(/twitter\.com\/([^/]+)/i)
          ?? item.url.match(/x\.com\/([^/]+)/i);
        const handle = handleMatch?.[1] ?? "unknown";

        let domain = "";
        try { domain = new URL(item.url).hostname.replace("www.", ""); } catch {}

        const doc = {
          uadp_type: "uadp:post",
          id: `nova:post:${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          ts: item.published
            ? Math.floor(new Date(item.published).getTime() / 1000)
            : Math.floor(Date.now() / 1000),
          label: item.title.slice(0, 140),
          body: item.description || item.title,
          author: {
            id: `nova:user:${handle}`,
            name: handle,
            handle: `@${handle}`,
            avatar_url: `https://unavatar.io/twitter/${handle}`,
          },
          url: item.url,
          source_domain: domain,
          category: feed.category,
          likes: 0,
          reposts: 0,
          replies: 0,
          tags: config.twitterKeywords.filter(kw =>
            item.title.toLowerCase().includes(kw.toLowerCase())
          ),
          scraped_at: new Date(),
        };

        await posts().updateOne(
          { url: item.url },
          { $set: doc },
          { upsert: true },
        );
        total++;
      }
    } catch (e) {
      console.warn(`[social] Error on ${feed.url}:`, (e as Error).message);
    }
  }

  console.log(`[social] Total scraped: ${total}`);
  return total;
}
