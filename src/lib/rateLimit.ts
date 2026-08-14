/**
 * Prosty rate limiting w pamięci procesu (sekcja 21).
 * Wystarczający na start; przy skalowaniu na wiele instancji zastąpić Upstash/Redis.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

export function rateLimit(key: string, limit = 5, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  const b = buckets.get(key);

  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSec: 0 };
  }

  b.count += 1;
  if (b.count > limit) {
    return { allowed: false, remaining: 0, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  }
  return { allowed: true, remaining: limit - b.count, retryAfterSec: 0 };
}

/** Sprzątanie wygasłych wpisów, żeby mapa nie rosła w nieskończoność. */
export function pruneRateLimits(): void {
  const now = Date.now();
  for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k);
}
