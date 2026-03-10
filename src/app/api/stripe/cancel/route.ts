import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient, isSupabaseServerConfigured } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  if (!isSupabaseServerConfigured()) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_subscription_id')
    .eq('id', user.id)
    .single();

  if (!profile?.stripe_subscription_id) {
    return NextResponse.json({ error: 'No active subscription' }, { status: 400 });
  }

  try {
    // Cancel at end of current billing period (user keeps access until then)
    await stripe.subscriptions.update(profile.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    console.log(`[stripe cancel] User ${user.id} scheduled cancellation`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[stripe cancel] Failed:', err);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}
