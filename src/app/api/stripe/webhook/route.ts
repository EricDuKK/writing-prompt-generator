import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient as createServiceClient } from '@supabase/supabase-js';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Use service role client for webhook (no user auth context)
function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('[stripe webhook] Verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = getServiceClient();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.user_id;

    // Handle subscription checkout
    if (session.mode === 'subscription' && session.subscription) {
      const planId = session.metadata?.plan_id;
      if (!userId || !planId) {
        console.error('[stripe webhook] Missing subscription metadata:', session.metadata);
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          plan: planId,
          stripe_subscription_id: session.subscription,
        })
        .eq('id', userId);

      if (error) {
        console.error('[stripe webhook] Failed to update plan:', error);
        return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
      }

      console.log(`[stripe webhook] User ${userId} subscribed to ${planId}`);
    }

    // Handle credit pack purchase
    if (session.mode === 'payment') {
      const purchaseId = session.metadata?.purchase_id;
      const credits = parseInt(session.metadata?.credits || '0', 10);

      if (!userId || !purchaseId || !credits) {
        console.error('[stripe webhook] Missing metadata:', session.metadata);
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      const { error } = await supabase.rpc('add_purchased_credits', {
        p_user_id: userId,
        p_credits: credits,
        p_purchase_id: purchaseId,
      });

      if (error) {
        console.error('[stripe webhook] Failed to add credits:', error);
        return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 });
      }

      console.log(`[stripe webhook] Added ${credits} credits for user ${userId}`);
    }
  }

  // Handle subscription created (backup for checkout.session.completed)
  if (event.type === 'customer.subscription.created') {
    const subscription = event.data.object;
    const userId = subscription.metadata?.user_id;
    const planId = subscription.metadata?.plan_id;

    if (userId && planId) {
      const { error } = await supabase
        .from('profiles')
        .update({
          plan: planId,
          stripe_subscription_id: subscription.id,
        })
        .eq('id', userId);

      if (error) {
        console.error('[stripe webhook] Failed to update plan on subscription.created:', error);
      } else {
        console.log(`[stripe webhook] subscription.created: User ${userId} -> ${planId}`);
      }
    }
  }

  // Handle subscription cancelled/expired
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const userId = subscription.metadata?.user_id;

    if (userId) {
      const { error } = await supabase
        .from('profiles')
        .update({ plan: 'free', stripe_subscription_id: null })
        .eq('id', userId);

      if (error) {
        console.error('[stripe webhook] Failed to downgrade plan:', error);
      } else {
        console.log(`[stripe webhook] User ${userId} downgraded to free`);
      }
    }
  }

  return NextResponse.json({ received: true });
}
