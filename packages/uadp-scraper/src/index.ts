/**
 * UADP Scraper — cron-based service that fetches real content from
 * RSS feeds + YouTube channels, extracts to markdown, and stores in
 * MongoDB for the UADP services to serve.
 *
 * Run modes:
 *   bun run start   → starts cron scheduler (runs in Docker)
 *   bun run scrape  → one-shot manual scrape
 */

import { connect } from "./db.js";
import { config } from "./config.js";
import { scrapeArticles } from "./scrapers/articles.js";
import { scrapeVideos } from "./scrapers/videos.js";
import { scrapeSocial } from "./scrapers/social.js";
import { scrapeMusic } from "./scrapers/music.js";
import { MongoClient } from "mongodb";

console.log("╔══════════════════════════════════════╗");
console.log("║   UADP Scraper — cron mode           ║");
console.log(`║   Schedule: ${config.cron.padEnd(24)}║`);
console.log("╚══════════════════════════════════════╝\n");

const db = await connect();
const meta = db.collection("_scraper_meta");

// Check if we need to scrape: either never ran, or last success was >20h ago
const lastRun = await meta.findOne({ _id: "last_scrape" as any });
const hoursSinceLast = lastRun?.ts
  ? (Date.now() - new Date(lastRun.ts).getTime()) / 3_600_000
  : Infinity;

if (hoursSinceLast > 20) {
  const reason = lastRun?.ts
    ? `Last scrape was ${Math.round(hoursSinceLast)}h ago — catching up`
    : "First run — no previous scrape found";
  console.log(`[startup] ${reason}`);
  await runScrape();
} else {
  console.log(`[startup] Last scrape ${Math.round(hoursSinceLast)}h ago — skipping (next at midnight UTC)`);
}

// Parse simple cron and schedule — for a proper cron lib we'd use
// node-cron, but for a daily 03:00 cron this is enough:
function msUntilNext(): number {
  const [min, hour] = config.cron.split(" ").map(Number);
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(hour, min, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next.getTime() - now.getTime();
}

function scheduleCron() {
  const ms = msUntilNext();
  const hrs = (ms / 3_600_000).toFixed(1);
  console.log(`[cron] Next scrape in ${hrs}h`);
  setTimeout(async () => {
    await runScrape();
    scheduleCron(); // re-schedule
  }, ms);
}

scheduleCron();

async function runScrape() {
  const start = Date.now();
  console.log(`\n[scrape] Starting at ${new Date().toISOString()}`);
  try {
    const [articles, videos, socialPosts, musicTracks] = await Promise.all([
      scrapeArticles(),
      scrapeVideos(),
      scrapeSocial(),
      scrapeMusic(),
    ]);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`[scrape] Done in ${elapsed}s — ${articles} articles, ${videos} videos, ${socialPosts} posts, ${musicTracks} tracks`);

    // Record successful scrape so next startup knows we're fresh
    await meta.updateOne(
      { _id: "last_scrape" as any },
      { $set: { ts: new Date(), articles, videos, posts: socialPosts, tracks: musicTracks, elapsed_s: parseFloat(elapsed) } },
      { upsert: true },
    );
  } catch (e) {
    console.error("[scrape] Error:", (e as Error).message);
  }
}
