import { Redis } from '@upstash/redis';

// ---------------------------------------------------------------------------
// Persistent claim store using Upstash Redis.
// Falls back to in-memory Map when UPSTASH env vars are not set.
// ---------------------------------------------------------------------------

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    redis = new Redis({ url, token });
    return redis;
  }
  return null;
}

// In-memory fallback (warm-instance only)
const memClaims = new Map<string, string>();

function claimKey(wallet: string, date: string): string {
  return `claimed:${wallet}:${date}`;
}

function historyKey(wallet: string): string {
  return `history:${wallet}`;
}

export async function hasClaimedDate(wallet: string, date: string): Promise<boolean> {
  const r = getRedis();
  if (r) {
    const val = await r.get(claimKey(wallet, date));
    return val !== null;
  }
  return memClaims.has(claimKey(wallet, date));
}

export async function recordClaim(wallet: string, date: string, signature: string): Promise<void> {
  const key = claimKey(wallet, date);
  const r = getRedis();
  if (r) {
    // Store claim with 30-day TTL
    await r.set(key, signature, { ex: 30 * 24 * 60 * 60 });
    // Append to wallet history (sorted set scored by date)
    await r.zadd(historyKey(wallet), { score: new Date(date + 'T12:00:00Z').getTime(), member: JSON.stringify({ date, signature }) });
  }
  memClaims.set(key, signature);
}

export async function getClaimHistory(wallet: string): Promise<{ date: string; signature: string }[]> {
  const r = getRedis();
  if (r) {
    const raw = await r.zrange(historyKey(wallet), 0, -1);
    return raw.map((entry) => {
      if (typeof entry === 'string') return JSON.parse(entry);
      return entry;
    });
  }
  // Fallback: reconstruct from in-memory map
  const results: { date: string; signature: string }[] = [];
  for (const [key, sig] of memClaims.entries()) {
    if (key.startsWith(`claimed:${wallet}:`)) {
      const date = key.split(':').pop()!;
      results.push({ date, signature: sig });
    }
  }
  return results.sort((a, b) => a.date.localeCompare(b.date));
}
