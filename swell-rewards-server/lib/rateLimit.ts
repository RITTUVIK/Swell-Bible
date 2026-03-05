// Simple in-memory rate limiter.
// Tracks requests per IP with a sliding window.

interface RateEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateEntry>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10;     // 10 requests per minute per IP

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count++;
  if (entry.count > MAX_REQUESTS) {
    return true;
  }
  return false;
}
