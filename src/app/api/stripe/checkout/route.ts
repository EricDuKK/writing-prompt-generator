import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient, isSupabaseServerConfigured } from '@/lib/supabase/server';
import { CREDIT_PACKS } from '@/config/credits';

export async function POST(req: NextRequest) {
  if (!isSupabaseServerConfigured()) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { packId } = await req.json();

  const pack = CREDIT_PACKS.find((p) => p.id === packId);
  if (!pack) {
    return NextResponse.json({ error: 'Invalid pack' }, { status: 400 });
  }

  // Create purchase record
  const { data: purchase, error: insertError } = await supabase
    .from('credit_purchases')
    .insert({
      user_id: user.id,
      pack_id: pack.id,
      credits: pack.credits,
      amount_cents: pack.price,
      status: 'pending',
    })
    .select('id')
    .single();

  if (insertError || !purchase) {
    console.error('[stripe] Insert purchase error:', insertError);
    return NextResponse.json({ error: 'Failed to create purchase' }, { status: 500 });
  }

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${pack.name} - ${pack.credits} Credits`,
            description: `${pack.credits} credits for Writing Prompt Generator (never expire)`,
          },
          unit_amount: pack.price,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${req.nextUrl.origin}/dashboard?tab=plans&purchase=success`,
    cancel_url: `${req.nextUrl.origin}/dashboard?tab=plans&purchase=cancelled`,
    metadata: {
      user_id: user.id,
      purchase_id: purchase.id,
      pack_id: pack.id,
      credits: String(pack.credits),
    },
  });

  // Update purchase with stripe session id
  await supabase
    .from('credit_purchases')
    .update({ stripe_session_id: session.id })
    .eq('id', purchase.id);

  return NextResponse.json({ url: session.url });
}
