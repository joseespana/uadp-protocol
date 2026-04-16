/**
 * YouTube video scraper — two strategies:
 *  1. Direct YouTube RSS by channel ID (no API key)
 *  2. RSSHub YouTube keyword search (no API key, no channel IDs needed)
 *
 * Both produce uadp:video objects in MongoDB for the Stream service.
 */

import { fetchRSS } from "./rss.js";
import { videos } from "../db.js";
import { config } from "../config.js";

export async function scrapeVideos(): Promise<number> {
  let total = 0;
  const feeds: string[] = [];

  // Strategy 1: direct YouTube channel RSS (if channel IDs provided)
  for (const ch of config.ytChannels) {
    feeds.push(`https://www.youtube.com/feeds/videos.xml?channel_id=${ch}`);
  }

  // Strategy 2: RSSHub YouTube search by keywords (no IDs needed!)
  if (config.rsshubUrl) {
    for (const kw of config.ytKeywords) {
      feeds.push(`${config.rsshubUrl}/youtube/search/${encodeURIComponent(kw)}/relevance`);
    }
  }

  if (feeds.length === 0) {
    console.log("[videos] No YouTube channels or keywords configured, skipping");
    return 0;
  }

  const rssResults = await Promise.allSettled(feeds.map(f => fetchRSS(f)));
  const allItems = rssResults
    .filter((r): r is PromiseFulfilledResult<any[]> => r.status === "fulfilled")
    .flatMap(r => r.value);

  // Deduplicate by URL
  const seen = new Set<string>();
  const unique = allItems.filter(item => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  console.log(`[videos] ${unique.length} unique items from ${feeds.length} feeds`);

  for (const item of unique.slice(0, config.limits.videos)) {
    try {
      const existing = await videos().findOne({ url: item.url });
      if (existing) continue;

      // Extract YouTube video ID from URL
      const ytMatch = item.url.match(/(?:watch\?v=|youtu\.be\/|\/v\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
      const ytId = ytMatch?.[1] ?? "";
      if (!ytId) continue;

      // Try to extract channel name from title pattern "Title - Channel" or from description
      const channelName = item.title.split(" - ").pop()?.trim() || "YouTube";

      const doc = {
        uadp_type: "uadp:video",
        id: `stream:vid:${ytId}`,
        ts: item.published
          ? Math.floor(new Date(item.published).getTime() / 1000)
          : Math.floor(Date.now() / 1000),
        label: item.title,
        title: item.title.split(" - ").slice(0, -1).join(" - ") || item.title,
        description: item.description || "",
        channel: { id: `stream:ch:${ytId.slice(0, 6)}`, name: channelName, subscribers: 0 },
        thumbnail_url: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
        youtube_url: `https://www.youtube.com/watch?v=${ytId}`,
        url: item.url,
        views: 0,
        likes: 0,
        tags: ["scraped"],
        scraped_at: new Date(),
      };

      await videos().updateOne(
        { url: item.url },
        { $set: doc },
        { upsert: true },
      );
      total++;
      console.log(`  ✓ ${doc.title.slice(0, 60)}`);
    } catch (e) {
      console.warn(`  ✗ ${item.url}: ${(e as Error).message}`);
    }
  }

  console.log(`[videos] Total scraped: ${total}`);
  return total;
}
