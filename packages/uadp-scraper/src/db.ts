/** MongoDB connection + collection helpers. */

import { MongoClient, type Db, type Collection } from "mongodb";
import { config } from "./config.js";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connect(): Promise<Db> {
  if (db) return db;
  client = new MongoClient(config.mongo.uri);
  await client.connect();
  db = client.db(config.mongo.db);

  const TTL_SECONDS = 60 * 60 * 24 * 365; // 1 year

  // Ensure indexes for fast reads + TTL auto-cleanup
  await db.collection("articles").createIndex({ url: 1 }, { unique: true });
  await db.collection("articles").createIndex({ ts: -1 });
  await db.collection("articles").createIndex({ category: 1, ts: -1 });
  await db.collection("articles").createIndex(
    { title: "text", body_markdown: "text", summary: "text" },
    { name: "articles_fts" }
  );
  await db.collection("articles").createIndex(
    { scraped_at: 1 },
    { expireAfterSeconds: TTL_SECONDS, name: "articles_ttl" }
  );

  await db.collection("videos").createIndex({ url: 1 }, { unique: true });
  await db.collection("videos").createIndex({ ts: -1 });
  await db.collection("videos").createIndex(
    { scraped_at: 1 },
    { expireAfterSeconds: TTL_SECONDS, name: "videos_ttl" }
  );

  await db.collection("products").createIndex({ url: 1 }, { unique: true });
  await db.collection("products").createIndex({ ts: -1 });
  await db.collection("products").createIndex(
    { scraped_at: 1 },
    { expireAfterSeconds: TTL_SECONDS, name: "products_ttl" }
  );

  // Posts (Nova — social/Twitter)
  await db.collection("posts").createIndex({ url: 1 }, { unique: true });
  await db.collection("posts").createIndex({ ts: -1 });
  await db.collection("posts").createIndex({ category: 1, ts: -1 });
  await db.collection("posts").createIndex(
    { body: "text", "author.handle": "text" },
    { name: "posts_fts" }
  );
  await db.collection("posts").createIndex(
    { scraped_at: 1 },
    { expireAfterSeconds: TTL_SECONDS, name: "posts_ttl" }
  );

  // Tracks (Lyra — music)
  await db.collection("tracks").createIndex({ url: 1 }, { unique: true });
  await db.collection("tracks").createIndex({ ts: -1 });
  await db.collection("tracks").createIndex({ artist: 1 });
  await db.collection("tracks").createIndex(
    { title: "text", artist: "text" },
    { name: "tracks_fts" }
  );
  await db.collection("tracks").createIndex(
    { scraped_at: 1 },
    { expireAfterSeconds: TTL_SECONDS, name: "tracks_ttl" }
  );

  console.log(`[db] Connected to ${config.mongo.uri} / ${config.mongo.db}`);
  return db;
}

export function articles(): Collection { return db!.collection("articles"); }
export function videos(): Collection { return db!.collection("videos"); }
export function products(): Collection { return db!.collection("products"); }
export function posts(): Collection { return db!.collection("posts"); }
export function tracks(): Collection { return db!.collection("tracks"); }

export async function disconnect() {
  await client?.close();
  client = null;
  db = null;
}
