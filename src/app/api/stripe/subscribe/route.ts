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

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
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
