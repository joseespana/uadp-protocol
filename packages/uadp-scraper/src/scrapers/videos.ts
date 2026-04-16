/**
 * YouTube video scraper — fetches channel RSS feeds (no API key needed)
 * and upserts into MongoDB as uadp:video objects.
 */

import { fetchRSS } from "./rss.js";
import { videos } from "../db.js";
import { config } from "../config.js";

export async function scrapeVideos(): Promise<number> {
  if (config.ytChannels.length === 0) return 0;
  let total = 0;

  const feeds = config.ytChannels.map(
    ch => `https://www.youtube.com/feeds/videos.xml?channel_id=${ch}`
  );

  const rssResults = await Promise.allSettled(feeds.map(f => fetchRSS(f)));
  const allItems = rssResults
    .filter((r): r is PromiseFulfilledResult<any[]> => r.status === "fulfilled")
    .flatMap(r => r.value);

  console.log(`[videos] ${allItems.length} items from ${feeds.length} YouTube channels`);

  for (const item of allItems.slice(0, config.limits.videos)) {
    try {
      const existing = await videos().findOne({ url: item.url });
      if (existing) continue;

      // Extract YouTube video ID from URL
      const ytMatch = item.url.match(/(?:watch\?v=|youtu\.be\/|\/v\/)([a-zA-Z0-9_-]{11})/);
      const ytId = ytMatch?.[1] ?? "";
      if (!ytId) continue;

      let domain = "";
      try { domain = new URL(item.url).hostname.replace("www.", ""); } catch {}

      const doc = {
        uadp_type: "uadp:video",
        id: `stream:vid:${ytId}`,
        ts: item.published
          ? Math.floor(new Date(item.published).getTime() / 1000)
          : Math.floor(Date.now() / 1000),
        label: item.title,
        title: item.title,
        description: item.description || "",
        channel: { id: `stream:ch:${domain}`, name: domain, subscribers: 0 },
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
