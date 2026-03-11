import { Redis } from '@upstash/redis';
import { type CreditAction, CREDIT_COSTS } from '@/config/credits';

// Total daily credits for anonymous users
export const ANONYMOUS_DAILY_CREDITS = 6;

// Actions allowed for anonymous users (uses same credit costs as logged-in users)
const ANONYMOUS_ALLOWED_ACTIONS: Set<CreditAction> = new Set([
  'generate-ideas',    // 1 credit
  'generate-prompt',   // 2 credits
  'generate-text',     // 3 credits
]);

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
 * Check and consume anonymous credits for the given action.
 * Uses dual limiting: both IP and fingerprint must have credits remaining.
 */
export async function checkAndUseAnonymousQuota(
  action: CreditAction,
  ip: string,
  fingerprint?: string
): Promise<{ ok: boolean; remaining: number; error?: string }> {
  // Action not allowed for anonymous users
  if (!ANONYMOUS_ALLOWED_ACTIONS.has(action)) {
    return { ok: false, remaining: 0, error: 'Sign in to use this feature.' };
  }

  const client = getRedis();
  if (!client) {
    return { ok: false, remaining: 0, error: 'Authentication required. Please sign in.' };
  }

  const cost = CREDIT_COSTS[action];
  const today = getTodayKey();
  const ttl = getSecondsUntilEndOfDay();

  const ipKey = `anon:credits:ip:${ip}:${today}`;
  const ipUsed = (await client.get<number>(ipKey)) || 0;

  // Check fingerprint if provided
  let fpUsed = 0;
  let fpKey = '';
  if (fingerprint) {
    fpKey = `anon:credits:fp:${fingerprint}:${today}`;
    fpUsed = (await client.get<number>(fpKey)) || 0;
  }

  // Both must have enough credits
  const maxUsed = Math.max(ipUsed, fpUsed);
  if (maxUsed + cost > ANONYMOUS_DAILY_CREDITS) {
    return {
      ok: false,
      remaining: Math.max(0, ANONYMOUS_DAILY_CREDITS - maxUsed),
      error: 'Free trial limit reached. Sign in for more daily usage.',
    };
  }

  // Atomically increment IP counter
  const newIpUsed = await client.incrby(ipKey, cost);
  if (newIpUsed === cost) {
    await client.expire(ipKey, ttl);
  }

  // Atomically increment fingerprint counter
  let newFpUsed = newIpUsed;
  if (fingerprint && fpKey) {
    newFpUsed = await client.incrby(fpKey, cost);
    if (newFpUsed === cost) {
      await client.expire(fpKey, ttl);
    }
  }

  const remaining = ANONYMOUS_DAILY_CREDITS - Math.max(newIpUsed, newFpUsed);
  return { ok: true, remaining: Math.max(0, remaining) };
}

/**
 * Get total anonymous credits used today for an IP+fingerprint (for deducting from logged-in credits).
 */
export async function getAnonymousUsageCredits(ip: string, fingerprint?: string): Promise<number> {
  const client = getRedis();
  if (!client) return 0;

  const today = getTodayKey();
  const ipKey = `anon:credits:ip:${ip}:${today}`;
  const ipUsed = (await client.get<number>(ipKey)) || 0;

  if (!fingerprint) return ipUsed;

  const fpKey = `anon:credits:fp:${fingerprint}:${today}`;
  const fpUsed = (await client.get<number>(fpKey)) || 0;

  return Math.max(ipUsed, fpUsed);
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
  if (!client) return true;
  const today = getTodayKey();
  const val = await client.get(`anon:deducted:${userId}:${ip}:${today}`);
  return val === '1';
}

/**
 * Get remaining anonymous credits for display purposes.
 * Uses the stricter of IP or fingerprint usage.
 */
export async function getAnonymousRemaining(ip: string, fingerprint?: string): Promise<{
  used: number;
  limit: number;
  remaining: number;
}> {
  const client = getRedis();
  const today = getTodayKey();

  let used = 0;
  if (client) {
    const ipKey = `anon:credits:ip:${ip}:${today}`;
    const ipUsed = (await client.get<number>(ipKey)) || 0;

    if (fingerprint) {
      const fpKey = `anon:credits:fp:${fingerprint}:${today}`;
      const fpUsed = (await client.get<number>(fpKey)) || 0;
      used = Math.max(ipUsed, fpUsed);
    } else {
      used = ipUsed;
    }
  }

  return {
    used,
    limit: ANONYMOUS_DAILY_CREDITS,
    remaining: Math.max(0, ANONYMOUS_DAILY_CREDITS - used),
  };
}
