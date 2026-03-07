import { createClient, isSupabaseServerConfigured } from '@/lib/supabase/server';
import { CREDIT_COSTS, type CreditAction } from '@/config/credits';

export interface CreditCheckResult {
  ok: boolean;
  remaining?: number;
  error?: string;
  userId?: string;
}

/**
 * Check user auth and deduct credits for an action.
 * If Supabase is not configured, allow free usage (no auth required).
 */
export async function useCredits(action: CreditAction): Promise<CreditCheckResult> {
  // If Supabase isn't configured, skip credit checks (free mode)
  if (!isSupabaseServerConfigured()) {
    return { ok: true };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'Authentication required. Please sign in.' };
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
    return { ok: false, error: 'Insufficient credits. Please wait until tomorrow or upgrade your plan.' };
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

  return data as { balance: number; daily_limit: number; plan: string };
}
