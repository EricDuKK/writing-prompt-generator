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
  try {
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

    console.log(`[stripe webhook] Received event: ${event.type}, id: ${event.id}`);

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

        const subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription.id;

        const { error } = await supabase
          .from('profiles')
          .update({
            plan: planId,
            stripe_subscription_id: subscriptionId,
          })
          .eq('id', userId);

        if (error) {
          console.error('[stripe webhook] Failed to update plan:', error);
          return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
        }

        console.log(`[stripe webhook] User ${userId} subscribed to ${planId}`);

        // Immediately refresh daily credits to match new plan
        const dailyLimit = planId === 'power' ? 999999 : planId === 'pro' ? 200 : planId === 'basic' ? 60 : 15;
        await supabase
          .from('credits')
          .update({
            balance: dailyLimit,
            last_reset_date: new Date().toISOString().split('T')[0],
          })
          .eq('user_id', userId);
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

        // Log the purchase in usage_log so it shows in Usage History
        const packId = session.metadata?.pack_id || 'unknown';
        await supabase.from('usage_log').insert({
          user_id: userId,
          action: 'purchase-credits',
          credits_used: credits,
          source: packId,
        });

        console.log(`[stripe webhook] Added ${credits} credits for user ${userId}`);
      }
    }

    // Handle subscription created (backup for checkout.session.completed)
    if (event.type === 'customer.subscription.created') {
      const subscription = event.data.object;
      const userId = subscription.metadata?.user_id;
      const planId = subscription.metadata?.plan_id;

      console.log(`[stripe webhook] subscription.created metadata:`, subscription.metadata);

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

          // Immediately refresh daily credits to match new plan
          const dailyLimit = planId === 'power' ? 999999 : planId === 'pro' ? 200 : planId === 'basic' ? 60 : 15;
          const { error: creditError } = await supabase
            .from('credits')
            .update({
              balance: dailyLimit,
              last_reset_date: new Date().toISOString().split('T')[0],
            })
            .eq('user_id', userId);

          if (creditError) {
            console.error('[stripe webhook] Failed to refresh credits:', creditError);
          } else {
            console.log(`[stripe webhook] Refreshed credits for ${userId}: ${dailyLimit}`);
          }
        }
      }
    }

    // Handle subscription updated (plan change via Customer Portal)
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const userId = subscription.metadata?.user_id;

      if (userId) {
        // Always determine plan from the current price (metadata may be stale after Portal upgrade)
        const priceId = subscription.items.data[0]?.price?.id;
        let newPlanId: string | undefined;

        const priceBasicMonthly = process.env.STRIPE_PRICE_BASIC_MONTHLY;
        const priceBasicYearly = process.env.STRIPE_PRICE_BASIC_YEARLY;
        const priceProMonthly = process.env.STRIPE_PRICE_PRO_MONTHLY;
        const priceProYearly = process.env.STRIPE_PRICE_PRO_YEARLY;

        if (priceId === priceBasicMonthly || priceId === priceBasicYearly) {
          newPlanId = 'basic';
        } else if (priceId === priceProMonthly || priceId === priceProYearly) {
          newPlanId = 'pro';
        }

        console.log(`[stripe webhook] subscription.updated priceId: ${priceId}, resolved plan: ${newPlanId}`);

        if (newPlanId) {
          // Also update subscription metadata to keep it in sync
          await stripe.subscriptions.update(subscription.id, {
            metadata: { user_id: userId, plan_id: newPlanId },
          });
          const { error } = await supabase
            .from('profiles')
            .update({
              plan: newPlanId,
              stripe_subscription_id: subscription.id,
            })
            .eq('id', userId);

          if (error) {
            console.error('[stripe webhook] Failed to update plan on subscription.updated:', error);
          } else {
            console.log(`[stripe webhook] subscription.updated: User ${userId} -> ${newPlanId}`);

            // Refresh daily credits to match new plan
            const dailyLimit = newPlanId === 'power' ? 999999 : newPlanId === 'pro' ? 200 : newPlanId === 'basic' ? 60 : 15;
            await supabase
              .from('credits')
              .update({
                balance: dailyLimit,
                last_reset_date: new Date().toISOString().split('T')[0],
              })
              .eq('user_id', userId);

            console.log(`[stripe webhook] Refreshed credits for ${userId}: ${dailyLimit}`);
          }
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
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error('[stripe webhook] Unhandled error:', message, stack);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
