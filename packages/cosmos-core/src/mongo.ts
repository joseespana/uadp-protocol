/**
 * Optional MongoDB connection for UADP services.
 *
 * When MONGO_URI is set, services read fresh scraped data from Mongo.
 * When not set (or connection fails), services fall back to static JSON.
 * This allows zero-config local dev with seed data, while production
 * serves real scraped content.
 */

import { MongoClient, type Db, type Collection } from "mongodb";

let db: Db | null = null;
let connected = false;

export async function connectMongo(): Promise<boolean> {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB ?? "astral_uadp";
  if (!uri) return false;

  try {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });
    await client.connect();
    db = client.db(dbName);
    connected = true;
    console.log(`[mongo] Connected to ${dbName} — serving real data`);
    return true;
  } catch (e) {
    console.warn(`[mongo] Could not connect (${(e as Error).message}) — using static JSON`);
    return false;
  }
}

export function hasMongo(): boolean { return connected; }

export function getCollection(name: string): Collection | null {
  return db?.collection(name) ?? null;
}

/**
 * Generic Mongo-first feed: returns items from Mongo collection sorted
 * by `ts` descending, falling back to `staticItems` if Mongo is empty
 * or unavailable. Caches results and refreshes every `refreshMs`.
 */
export function createMongoFeed<T>(
  collectionName: string,
  staticItems: T[],
  opts: { limit?: number; refreshMs?: number } = {},
): { getItems: () => T[]; refresh: () => Promise<void> } {
  const limit = opts.limit ?? 500;
  const refreshMs = opts.refreshMs ?? 5 * 60_000;
  let cached: T[] = staticItems;

  async function refresh() {
    if (hasMongo()) {
      const col = getCollection(collectionName);
      if (col) {
        const docs = await col.find({}).sort({ ts: -1 }).limit(limit).toArray();
        if (docs.length > 0) {
          cached = docs as unknown as T[];
          return;
        }
      }
    }
    cached = staticItems;
  }

  // Initial load + periodic refresh
  refresh().catch(() => {});
  setInterval(() => refresh().catch(() => {}), refreshMs);

  return {
    getItems: () => cached,
    refresh,
  };
}
