import { Redis } from '@upstash/redis';
import { type CreditAction, CREDIT_COSTS } from '@/config/credits';

// Anonymous usage limits per action per day
export const ANONYMOUS_LIMITS: Partial<Record<CreditAction, number>> = {
  'generate-ideas': 3,
  'generate-prompt': 2,
  'generate-text': 1,
  // translate-prompt and ai-edit: not available for anonymous users
};

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  return redis;
}

function getTodayKey(): string {
  // Use UTC date as key suffix
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

function getSecondsUntilEndOfDay(): number {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setUTCHours(23, 59, 59, 999);
  return Math.max(Math.floor((endOfDay.getTime() - now.getTime()) / 1000), 60);
}

/**
 * Check and consume one anonymous usage for the given action and IP.
 * Returns { ok, remaining } where remaining is the number of uses left.
 */
export async function checkAndUseAnonymousQuota(
  action: CreditAction,
  ip: string
): Promise<{ ok: boolean; remaining: number; error?: string }> {
  const limit = ANONYMOUS_LIMITS[action];

  // Action not available for anonymous users
  if (limit === undefined || limit <= 0) {
    return { ok: false, remaining: 0, error: 'Sign in to use this feature.' };
  }

  const client = getRedis();
  if (!client) {
    // Upstash not configured, deny anonymous access
    return { ok: false, remaining: 0, error: 'Authentication required. Please sign in.' };
  }

  const today = getTodayKey();
  const key = `anon:${action}:${ip}:${today}`;

  // Atomic increment
  const count = await client.incr(key);

  // Set TTL on first use
  if (count === 1) {
    await client.expire(key, getSecondsUntilEndOfDay());
  }

  if (count > limit) {
    // Over limit - don't decrement, just reject
    return {
      ok: false,
      remaining: 0,
      error: 'Free trial limit reached. Sign in for more daily usage.',
    };
  }

  return { ok: true, remaining: limit - count };
}

/**
 * Get anonymous usage counts for an IP (for deducting from logged-in credits).
 * Returns total credits used as anonymous today.
 */
export async function getAnonymousUsageCredits(ip: string): Promise<number> {
  const client = getRedis();
  if (!client) return 0;

  const today = getTodayKey();
  let totalCredits = 0;

  for (const [action, limit] of Object.entries(ANONYMOUS_LIMITS)) {
    if (!limit) continue;
    const key = `anon:${action}:${ip}:${today}`;
    const count = (await client.get<number>(key)) || 0;
    // Only count up to the limit (over-limit attempts don't cost anything)
    const actualUsed = Math.min(count, limit);
    const creditCost = CREDIT_COSTS[action as CreditAction];
    totalCredits += actualUsed * creditCost;
  }

  return totalCredits;
}

/**
 * Mark that anonymous usage has been deducted for this user+IP today.
 */
export async function markAnonymousDeducted(userId: string, ip: string): Promise<void> {
  const client = getRedis();
  if (!client) return;
  const today = getTodayKey();
  await client.set(`anon:deducted:${userId}:${ip}:${today}`, '1', {
    ex: getSecondsUntilEndOfDay(),
  });
}

/**
 * Check if anonymous usage has already been deducted for this user+IP today.
 */
export async function isAnonymousDeducted(userId: string, ip: string): Promise<boolean> {
  const client = getRedis();
  if (!client) return true; // If no Redis, skip deduction
  const today = getTodayKey();
  const val = await client.get(`anon:deducted:${userId}:${ip}:${today}`);
  return val === '1';
}

/**
 * Get remaining anonymous quota for display purposes.
 */
export async function getAnonymousRemaining(ip: string): Promise<{
  actions: Record<string, { used: number; limit: number; remaining: number }>;
  totalRemaining: number;
  totalLimit: number;
}> {
  const client = getRedis();
  const today = getTodayKey();
  const actions: Record<string, { used: number; limit: number; remaining: number }> = {};
  let totalRemaining = 0;
  let totalLimit = 0;

  for (const [action, limit] of Object.entries(ANONYMOUS_LIMITS)) {
    if (!limit) continue;
    let used = 0;
    if (client) {
      const key = `anon:${action}:${ip}:${today}`;
      used = (await client.get<number>(key)) || 0;
    }
    const remaining = Math.max(0, limit - used);
    actions[action] = { used, limit, remaining };
    totalRemaining += remaining;
    totalLimit += limit;
  }

  return { actions, totalRemaining, totalLimit };
}
