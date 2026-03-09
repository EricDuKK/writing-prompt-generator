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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.user_id;
    const purchaseId = session.metadata?.purchase_id;
    const credits = parseInt(session.metadata?.credits || '0', 10);

    if (!userId || !purchaseId || !credits) {
      console.error('[stripe webhook] Missing metadata:', session.metadata);
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Add purchased credits via RPC
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

  return NextResponse.json({ received: true });
}
