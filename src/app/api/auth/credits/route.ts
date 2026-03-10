import { NextResponse } from 'next/server';
import { getCreditBalance } from '@/lib/credits';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

export async function GET() {
  const balance = await getCreditBalance();

  if (!balance) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Check if subscription is scheduled for cancellation
  let cancel_at_period_end = false;
  let current_period_end: string | null = null;
  let billing_interval: string | null = null;

  if (balance.plan !== 'free') {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('stripe_subscription_id')
          .eq('id', user.id)
          .single();

        if (profile?.stripe_subscription_id) {
          const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
          cancel_at_period_end = subscription.cancel_at_period_end;
          if (cancel_at_period_end && subscription.cancel_at) {
            current_period_end = new Date(subscription.cancel_at * 1000).toISOString();
          } else if (cancel_at_period_end) {
            // Fallback: get period end from subscription item
            const itemPeriodEnd = subscription.items.data[0]?.current_period_end;
            if (itemPeriodEnd) {
              current_period_end = new Date(itemPeriodEnd * 1000).toISOString();
            }
          }
          // Extract billing interval from subscription price
          const interval = subscription.items.data[0]?.price?.recurring?.interval;
          if (interval === 'month') {
            billing_interval = 'monthly';
          } else if (interval === 'year') {
            billing_interval = 'yearly';
          }
        }
      }
    } catch {
      // ignore — just don't show cancellation info
    }
  }

  return NextResponse.json({ ...balance, cancel_at_period_end, current_period_end, billing_interval });
}
