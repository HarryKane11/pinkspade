import { NextRequest, NextResponse } from 'next/server';
import { polar, POLAR_PRODUCTS } from '@/lib/polar';
import { createClient } from '@/lib/supabase/server';

interface CheckoutRequest {
  planId: 'pro_monthly' | 'pro_yearly' | 'ultra_monthly' | 'ultra_yearly';
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body: CheckoutRequest = await request.json();
    const productId = POLAR_PRODUCTS[body.planId];

    if (!productId) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pinkspade.app';
    const checkout = await polar.checkouts.create({
      products: [productId],
      successUrl: `${appUrl}/dashboard?checkout=success`,
      customerEmail: user.email ?? undefined,
      metadata: {
        userId: user.id,
        planId: body.planId,
      },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    console.error('Checkout error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
