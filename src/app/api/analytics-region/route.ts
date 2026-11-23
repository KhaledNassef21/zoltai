import { NextRequest, NextResponse } from 'next/server';
import { requiresAnalyticsConsent } from '@/lib/analytics-region';

export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  // Vercel supplies this from the request IP. Do not use a browser override.
  const country = process.env.VERCEL === '1'
    ? request.headers.get('x-vercel-ip-country')
    : null;
  return NextResponse.json(
    { consentRequired: requiresAnalyticsConsent(country) },
    { headers: { 'Cache-Control': 'private, no-store, max-age=0', 'Vercel-CDN-Cache-Control': 'no-store' } },
  );
}
