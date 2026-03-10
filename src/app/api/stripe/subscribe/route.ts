import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient, isSupabaseServerConfigured } from '@/lib/supabase/server';
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
    // User has an existing subscription — redirect to Customer Portal for upgrade/downgrade
    try {
      const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);

      if (subscription.status !== 'active') {
        return await createNewSubscription(req, user, planId, period, priceId);
      }

      const customerId = typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer.id;

      // Open portal directly on the subscription update flow with the target price
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${req.nextUrl.origin}/dashboard?tab=plans&subscription=success`,
        flow_data: {
          type: 'subscription_update_confirm',
          subscription_update_confirm: {
            subscription: profile.stripe_subscription_id,
            items: [{
              id: subscription.items.data[0].id,
              price: priceId,
              quantity: 1,
            }],
          },
        },
      });

      return NextResponse.json({ url: portalSession.url });
    } catch (err) {
      console.error('[stripe subscribe] Failed to create portal session:', err);
      return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
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
