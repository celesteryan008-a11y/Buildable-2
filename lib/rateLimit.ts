// Simple in-memory per-user daily rate limiter.
//
// CAVEAT: On Vercel's serverless runtime, each function invocation may run on
// a different instance, and instances are recycled — so this in-memory map
// is NOT a reliable global limit in production. It will catch a lot of casual
// abuse from a single warm instance, but a determined user could exceed it.
// For a real per-user cap, swap this for Vercel KV or a database counter
// (see README "Next steps").

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const DAILY_LIMIT = Number(process.env.DAILY_GENERATION_LIMIT || 30);
const WINDOW_MS = 24 * 60 * 60 * 1000;

export function checkRateLimit(userKey: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const existing = buckets.get(userKey);

  if (!existing || existing.resetAt < now) {
    buckets.set(userKey, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: DAILY_LIMIT - 1 };
  }

  if (existing.count >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  existing.count += 1;
  return { allowed: true, remaining: DAILY_LIMIT - existing.count };
}
