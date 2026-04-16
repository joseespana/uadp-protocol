/**
 * Article scraper — fetches URLs from RSS feeds, extracts full content,
 * converts to markdown, and upserts into MongoDB as uadp:article objects.
 */

import { extract } from "@extractus/article-extractor";
import TurndownService from "turndown";
import { fetchRSS, type RSSItem } from "./rss.js";
import { articles } from "../db.js";
import { config } from "../config.js";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

/** Category → RSS feed URLs mapping from env. */
const CATEGORY_FEEDS: Record<string, string[]> = {
  Technology: config.rss.tech,
  World: config.rss.world,
  Science: config.rss.science,
  Economy: config.rss.economy,
  Health: config.rss.health,
  Travel: config.rss.travel,
  Sports: config.rss.sports,
  Entertainment: config.rss.entertainment,
  Lifestyle: config.rss.lifestyle,
  Gaming: config.rss.gaming,
};

export async function scrapeArticles(): Promise<number> {
  let total = 0;
  const maxPerCategory = Math.ceil(config.limits.articles / Object.keys(CATEGORY_FEEDS).length);

  for (const [category, feeds] of Object.entries(CATEGORY_FEEDS)) {
    if (feeds.length === 0) continue;
    let categoryCount = 0;

    // Fetch all RSS items from all feeds for this category
    const rssResults = await Promise.allSettled(feeds.map(f => fetchRSS(f)));
    const allItems: RSSItem[] = [];
    for (const r of rssResults) {
      if (r.status === "fulfilled") allItems.push(...r.value);
    }

    // Deduplicate by URL
    const seen = new Set<string>();
    const unique = allItems.filter(item => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    });

    console.log(`[articles] ${category}: ${unique.length} unique items from ${feeds.length} feeds`);

    // Scrape each article (limit per category)
    for (const item of unique.slice(0, maxPerCategory)) {
      if (categoryCount >= maxPerCategory) break;
      try {
        const existing = await articles().findOne({ url: item.url });
        if (existing) continue; // already scraped

        const extracted = await extract(item.url);
        if (!extracted || !extracted.content) continue;

        const bodyMd = turndown.turndown(extracted.content);
        if (bodyMd.length < 100) continue; // too short, skip

        const words = bodyMd.split(/\s+/).length;
        const firstPara = bodyMd.split("\n\n").find(p => p.length > 40 && !p.startsWith("#")) ?? "";
        const summary = firstPara.slice(0, 280).trim() + (firstPara.length > 280 ? "…" : "");

        let domain = "";
        try { domain = new URL(item.url).hostname.replace("www.", ""); } catch {}

        const doc = {
          uadp_type: "uadp:article",
          id: `herald:art:${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          ts: extracted.published
            ? Math.floor(new Date(extracted.published).getTime() / 1000)
            : Math.floor(Date.now() / 1000),
          label: extracted.title ?? item.title,
          title: extracted.title ?? item.title,
          summary,
          body_markdown: bodyMd.length > 15000 ? bodyMd.slice(0, 15000) + "\n\n…(truncated)" : bodyMd,
          category,
          author_name: extracted.author ?? "",
          image_url: extracted.image ?? "",
          url: item.url,
          source_domain: domain,
          favicon_url: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
          read_time_min: Math.max(1, Math.round(words / 220)),
          scraped_at: new Date(),
        };

        await articles().updateOne(
          { url: item.url },
          { $set: doc },
          { upsert: true },
        );
        categoryCount++;
        total++;
        console.log(`  ✓ ${doc.title.slice(0, 60)} (${domain}, ${words} words)`);
      } catch (e) {
        console.warn(`  ✗ ${item.url}: ${(e as Error).message}`);
      }
    }
  }

  console.log(`[articles] Total scraped: ${total}`);
  return total;
}
