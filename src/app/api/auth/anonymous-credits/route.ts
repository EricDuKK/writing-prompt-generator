import { type NextRequest, NextResponse } from 'next/server';
import { getAnonymousRemaining } from '@/lib/anonymous-rate-limit';

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}

export async function GET(request: NextRequest) {
  const ip = getClientIP(request);
  const fingerprint = request.headers.get('x-fingerprint') || undefined;
  const remaining = await getAnonymousRemaining(ip, fingerprint);
  return NextResponse.json(remaining);
}
