/**
 * Music scraper — fetches trending tracks, top artists, and charts from
 * Last.fm (free API) and enriches with MusicBrainz metadata. Stores as
 * uadp:track objects in MongoDB for the Lyra service.
 *
 * Last.fm free tier: 5 req/s, no hard monthly cap.
 * MusicBrainz: 1 req/s, no key needed.
 */

import { tracks } from "../db.js";
import { config } from "../config.js";

const LASTFM_BASE = "https://ws.audioscrobbler.com/2.0/";
const MB_BASE = "https://musicbrainz.org/ws/2/";

async function lastfm(method: string, params: Record<string, string> = {}): Promise<any> {
  if (!config.lastfmApiKey) return null;
  const qs = new URLSearchParams({
    method,
    api_key: config.lastfmApiKey,
    format: "json",
    ...params,
  });
  const res = await fetch(`${LASTFM_BASE}?${qs}`, {
    headers: { "User-Agent": "Astral-UADP-Scraper/1.0" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  return res.json();
}

async function mbLookup(artist: string, track: string): Promise<{ duration?: number; tags?: string[] }> {
  try {
    const q = encodeURIComponent(`recording:"${track}" AND artist:"${artist}"`);
    const res = await fetch(`${MB_BASE}recording/?query=${q}&limit=1&fmt=json`, {
      headers: { "User-Agent": "Astral-UADP-Scraper/1.0 (jose.espana@perseusoft.tech)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return {};
    const data = await res.json();
    const rec = data.recordings?.[0];
    if (!rec) return {};
    return {
      duration: rec.length ? Math.round(rec.length / 1000) : undefined,
      tags: rec.tags?.slice(0, 5).map((t: any) => t.name) ?? [],
    };
  } catch {
    return {};
  }
}

// Rate limiter for MusicBrainz (1 req/s)
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export async function scrapeMusic(): Promise<number> {
  if (!config.lastfmApiKey) {
    console.log("[music] No LASTFM_API_KEY configured, skipping");
    return 0;
  }

  let total = 0;
  const max = config.limits.tracks;

  // 1. Top tracks globally
  const topTracks = await lastfm("chart.gettoptracks", { limit: String(Math.min(max, 50)) });
  const topList = topTracks?.tracks?.track ?? [];
  console.log(`[music] Last.fm top tracks: ${topList.length}`);

  for (const t of topList) {
    if (total >= max) break;
    const url = t.url ?? "";
    const existing = await tracks().findOne({ url });
    if (existing) continue;

    // Enrich with MusicBrainz (rate-limited)
    const mb = await mbLookup(t.artist?.name ?? "", t.name ?? "");
    await sleep(1100); // MusicBrainz rate limit

    const doc = {
      uadp_type: "uadp:track",
      id: `lyra:track:${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ts: Math.floor(Date.now() / 1000),
      label: `${t.name} — ${t.artist?.name}`,
      title: t.name,
      artist: t.artist?.name ?? "Unknown",
      artist_id: `lyra:artist:${(t.artist?.name ?? "unknown").toLowerCase().replace(/\s+/g, "-")}`,
      album: "",
      duration_seconds: mb.duration ?? (parseInt(t.duration ?? "0", 10) || 210),
      playcount: parseInt(t.playcount ?? "0", 10),
      listeners: parseInt(t.listeners ?? "0", 10),
      image_url: t.image?.find((i: any) => i.size === "extralarge")?.["#text"]
        ?? t.image?.find((i: any) => i.size === "large")?.["#text"]
        ?? "",
      url,
      tags: mb.tags ?? [],
      source: "lastfm",
      scraped_at: new Date(),
    };

    await tracks().updateOne({ url }, { $set: doc }, { upsert: true });
    total++;
    if (total % 10 === 0) console.log(`  [music] ${total} tracks processed...`);
  }

  // 2. Top artists → get their top tracks for more variety
  if (total < max) {
    const topArtists = await lastfm("chart.gettopartists", { limit: "20" });
    const artistList = topArtists?.artists?.artist ?? [];

    for (const artist of artistList) {
      if (total >= max) break;
      const artistTracks = await lastfm("artist.gettoptracks", {
        artist: artist.name,
        limit: "10",
      });
      const tList = artistTracks?.toptracks?.track ?? [];

      for (const t of tList) {
        if (total >= max) break;
        const url = t.url ?? "";
        const existing = await tracks().findOne({ url });
        if (existing) continue;

        const doc = {
          uadp_type: "uadp:track",
          id: `lyra:track:${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          ts: Math.floor(Date.now() / 1000),
          label: `${t.name} — ${artist.name}`,
          title: t.name,
          artist: artist.name,
          artist_id: `lyra:artist:${artist.name.toLowerCase().replace(/\s+/g, "-")}`,
          album: "",
          duration_seconds: parseInt(t.duration ?? "0", 10) || 210,
          playcount: parseInt(t.playcount ?? "0", 10),
          listeners: parseInt(t.listeners ?? "0", 10),
          image_url: artist.image?.find((i: any) => i.size === "extralarge")?.["#text"] ?? "",
          url,
          tags: [],
          source: "lastfm",
          scraped_at: new Date(),
        };

        await tracks().updateOne({ url }, { $set: doc }, { upsert: true });
        total++;
      }
    }
  }

  console.log(`[music] Total scraped: ${total}`);
  return total;
}
