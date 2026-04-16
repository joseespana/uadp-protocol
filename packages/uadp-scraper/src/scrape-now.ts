/** One-shot scrape — run manually with: bun run scrape */

import { connect, disconnect } from "./db.js";
import { scrapeArticles } from "./scrapers/articles.js";
import { scrapeVideos } from "./scrapers/videos.js";
import { scrapeSocial } from "./scrapers/social.js";
import { scrapeMusic } from "./scrapers/music.js";

console.log("╔══════════════════════════════════════╗");
console.log("║   UADP Scraper — manual run          ║");
console.log("╚══════════════════════════════════════╝\n");

const start = Date.now();
await connect();

const [articles, videos, socialPosts, musicTracks] = await Promise.all([
  scrapeArticles(),
  scrapeVideos(),
  scrapeSocial(),
  scrapeMusic(),
]);

console.log(`\n✓ Done in ${((Date.now() - start) / 1000).toFixed(1)}s`);
console.log(`  Articles: ${articles}`);
console.log(`  Videos:   ${videos}`);
console.log(`  Posts:    ${socialPosts}`);
console.log(`  Tracks:   ${musicTracks}`);

await disconnect();
process.exit(0);
