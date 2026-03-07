import { NextResponse } from 'next/server';
import { getCreditBalance } from '@/lib/credits';

export async function GET() {
  const balance = await getCreditBalance();

  if (!balance) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  return NextResponse.json(balance);
}
