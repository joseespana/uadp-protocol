/** RSS feed parser — fetches + parses to a flat item list. */

import { XMLParser } from "fast-xml-parser";

export interface RSSItem {
  title: string;
  url: string;
  published: string;
  description: string;
}

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

export async function fetchRSS(feedUrl: string): Promise<RSSItem[]> {
  try {
    const res = await fetch(feedUrl, {
      headers: { "User-Agent": "Astral-UADP-Scraper/1.0" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const parsed = parser.parse(xml);

    // Handle both RSS 2.0 and Atom feeds
    const rssItems = parsed?.rss?.channel?.item ?? [];
    const atomEntries = parsed?.feed?.entry ?? [];
    const items = Array.isArray(rssItems) ? rssItems : rssItems ? [rssItems] : [];
    const entries = Array.isArray(atomEntries) ? atomEntries : atomEntries ? [atomEntries] : [];

    const result: RSSItem[] = [];

    for (const item of items) {
      result.push({
        title: strip(item.title ?? ""),
        url: strip(item.link ?? item.guid ?? ""),
        published: item.pubDate ?? item["dc:date"] ?? "",
        description: strip(item.description ?? item["content:encoded"] ?? ""),
      });
    }

    for (const entry of entries) {
      const link = Array.isArray(entry.link)
        ? entry.link.find((l: any) => l["@_rel"] === "alternate")?.["@_href"] ?? entry.link[0]?.["@_href"] ?? ""
        : entry.link?.["@_href"] ?? entry.link ?? "";
      result.push({
        title: strip(typeof entry.title === "object" ? entry.title["#text"] ?? "" : entry.title ?? ""),
        url: strip(link),
        published: entry.published ?? entry.updated ?? "",
        description: strip(
          typeof entry.summary === "object" ? entry.summary["#text"] ?? "" : entry.summary ?? entry.content ?? ""
        ),
      });
    }

    return result.filter(r => r.title && r.url);
  } catch (e) {
    console.warn(`[rss] Failed to fetch ${feedUrl}:`, (e as Error).message);
    return [];
  }
}

function strip(s: string | number): string {
  return String(s).replace(/<[^>]+>/g, "").trim();
}
