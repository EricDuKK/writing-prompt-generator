import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient, isSupabaseServerConfigured } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

const PRICE_MAP: Record<string, Record<string, string | undefined>> = {
  basic: {
    monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY,
    yearly: process.env.STRIPE_PRICE_BASIC_YEARLY,
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
  },
};

const PLAN_ORDER: Record<string, number> = {
  free: 0,
  basic: 1,
  pro: 2,
  power: 3,
};

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  if (!isSupabaseServerConfigured()) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { planId, period } = await req.json();

  const priceId = PRICE_MAP[planId]?.[period];
  if (!priceId) {
    return NextResponse.json({ error: 'Invalid plan or period' }, { status: 400 });
  }

  // Check if user already has an active subscription
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, stripe_subscription_id')
    .eq('id', user.id)
    .single();

  if (profile?.stripe_subscription_id) {
    // User has an existing subscription — upgrade/downgrade via Stripe API
    try {
      const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);

      if (subscription.status !== 'active') {
        // Subscription is not active, treat as new subscription
        return await createNewSubscription(req, user, planId, period, priceId);
      }

      const currentItemId = subscription.items.data[0]?.id;
      if (!currentItemId) {
        return NextResponse.json({ error: 'No subscription item found' }, { status: 400 });
      }

      // Update the subscription and immediately invoice the proration difference
      const updatedSubscription = await stripe.subscriptions.update(profile.stripe_subscription_id, {
        items: [{
          id: currentItemId,
          price: priceId,
        }],
        proration_behavior: 'always_invoice',
        payment_behavior: 'error_if_incomplete',
        metadata: {
          user_id: user.id,
          plan_id: planId,
        },
      });

      // Immediately update plan and credits in database
      const serviceClient = getServiceClient();
      const dailyLimit = planId === 'power' ? 999999 : planId === 'pro' ? 200 : planId === 'basic' ? 60 : 15;

      await serviceClient
        .from('profiles')
        .update({
          plan: planId,
          stripe_subscription_id: updatedSubscription.id,
        })
        .eq('id', user.id);

      // Only increase credits on upgrade, don't reduce on downgrade
      const isUpgrade = (PLAN_ORDER[planId] || 0) > (PLAN_ORDER[profile.plan] || 0);
      if (isUpgrade) {
        await serviceClient
          .from('credits')
          .update({
            balance: dailyLimit,
            last_reset_date: new Date().toISOString().split('T')[0],
          })
          .eq('user_id', user.id);
      }

      console.log(`[stripe subscribe] User ${user.id} changed plan: ${profile.plan} -> ${planId}`);

      return NextResponse.json({
        success: true,
        plan: planId,
        message: isUpgrade ? 'Plan upgraded successfully!' : 'Plan changed successfully!',
      });
    } catch (err) {
      console.error('[stripe subscribe] Failed to update subscription:', err);
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
    }
  }

  // No existing subscription — create new checkout session
  return await createNewSubscription(req, user, planId, period, priceId);
}

async function createNewSubscription(
  req: NextRequest,
  user: { id: string; email?: string },
  planId: string,
  period: string,
  priceId: string,
) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: user.email!,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${req.nextUrl.origin}/dashboard?tab=plans&subscription=success`,
    cancel_url: `${req.nextUrl.origin}/dashboard?tab=plans&subscription=cancelled`,
    metadata: {
      user_id: user.id,
      plan_id: planId,
    },
    subscription_data: {
      metadata: {
        user_id: user.id,
        plan_id: planId,
      },
    },
  });

  return NextResponse.json({ url: session.url });
}
