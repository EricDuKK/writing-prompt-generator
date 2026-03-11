import { type NextRequest } from 'next/server';
import { createClient, isSupabaseServerConfigured } from '@/lib/supabase/server';
import { CREDIT_COSTS, type CreditAction } from '@/config/credits';
import {
  checkAndUseAnonymousQuota,
  getAnonymousUsageCredits,
  isAnonymousDeducted,
  markAnonymousDeducted,
} from '@/lib/anonymous-rate-limit';

export interface CreditCheckResult {
  ok: boolean;
  remaining?: number;
  error?: string;
  userId?: string;
  anonymous?: boolean;
}

/**
 * Extract client IP from NextRequest.
 */
function getClientIP(request?: NextRequest): string {
  if (!request) return 'unknown';
  // Vercel / reverse proxy headers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}

/**
 * Check user auth and deduct credits for an action.
 * - If Supabase is not configured: allow free usage (no auth required).
 * - If user is logged in: deduct from Supabase credits (with anonymous usage reconciliation).
 * - If user is NOT logged in: use anonymous rate limiting via Upstash Redis.
 */
export async function useCredits(
  action: CreditAction,
  request?: NextRequest
): Promise<CreditCheckResult> {
  // If Supabase isn't configured, skip credit checks (free mode)
  if (!isSupabaseServerConfigured()) {
    return { ok: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const ip = getClientIP(request);

  // --- Anonymous user path ---
  if (!user) {
    const result = await checkAndUseAnonymousQuota(action, ip);
    if (!result.ok) {
      return { ok: false, error: result.error, anonymous: true };
    }
    return { ok: true, remaining: result.remaining, anonymous: true };
  }

  // --- Logged-in user path ---
  // Reconcile: deduct today's anonymous usage from credits (once per user+IP per day)
  const alreadyDeducted = await isAnonymousDeducted(user.id, ip);
  if (!alreadyDeducted) {
    const anonymousCreditsUsed = await getAnonymousUsageCredits(ip);
    if (anonymousCreditsUsed > 0) {
      await supabase.rpc('use_credits', {
        p_user_id: user.id,
        p_action: 'generate-ideas', // action name for logging
        p_cost: anonymousCreditsUsed,
      });
    }
    await markAnonymousDeducted(user.id, ip);
  }

  const cost = CREDIT_COSTS[action];

  const { data, error } = await supabase.rpc('use_credits', {
    p_user_id: user.id,
    p_action: action,
    p_cost: cost,
  });

  if (error) {
    console.error('[credits] RPC error:', error);
    return { ok: false, error: 'Failed to check credits.' };
  }

  const remaining = data as number;
  if (remaining < 0) {
    return { ok: false, error: 'Insufficient credits. Please wait until tomorrow or purchase a credit pack.' };
  }

  return { ok: true, remaining, userId: user.id };
}

/**
 * Get current credit balance for the authenticated user.
 */
export async function getCreditBalance() {
  if (!isSupabaseServerConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase.rpc('get_credit_balance', {
    p_user_id: user.id,
  });

  if (error) {
    console.error('[credits] Balance error:', error);
    return null;
  }

  return data as { balance: number; daily_limit: number; purchased_credits: number; plan: string };
}
