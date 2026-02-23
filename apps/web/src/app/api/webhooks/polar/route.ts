import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { PLAN_CREDITS } from '@/lib/polar';

// Use service role for webhook processing (bypasses RLS)
function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (Polar sends it in headers)
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get('x-polar-signature');
      if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
      }
      // In production, verify the HMAC signature here
    }

    const event = await request.json();
    const supabase = getAdminClient();

    switch (event.type) {
      case 'checkout.completed': {
        const userId = event.data?.metadata?.userId;
        const planId = event.data?.metadata?.planId as string;
        if (!userId || !planId) break;

        // Determine plan from planId
        const plan = planId.startsWith('enterprise') ? 'enterprise' : 'pro';
        const quota = PLAN_CREDITS[plan] ?? 500;

        // Update profile plan
        await supabase
          .from('profiles')
          .update({ plan })
          .eq('id', userId);

        // Update credit balance
        await supabase
          .from('credit_balances')
          .upsert({
            user_id: userId,
            balance: quota,
            monthly_quota: quota,
            plan,
            reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });

        // Log purchase in ledger
        await supabase.from('credit_ledger').insert({
          user_id: userId,
          amount: quota,
          type: 'purchase',
          description: `Plan upgrade to ${plan}`,
          metadata: { planId, checkoutId: event.data?.id },
        });

        break;
      }

      case 'subscription.canceled': {
        const userId = event.data?.metadata?.userId;
        if (!userId) break;

        // Downgrade to free at end of billing period
        await supabase
          .from('profiles')
          .update({ plan: 'free' })
          .eq('id', userId);

        await supabase
          .from('credit_balances')
          .update({
            plan: 'free',
            monthly_quota: PLAN_CREDITS.free,
          })
          .eq('user_id', userId);

        break;
      }

      case 'subscription.renewed': {
        const userId = event.data?.metadata?.userId;
        const planId = event.data?.metadata?.planId as string;
        if (!userId) break;

        const plan = planId?.startsWith('enterprise') ? 'enterprise' : 'pro';
        const quota = PLAN_CREDITS[plan] ?? 500;

        // Reset monthly credits
        await supabase
          .from('credit_balances')
          .update({
            balance: quota,
            reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq('user_id', userId);

        // Log monthly reset
        await supabase.from('credit_ledger').insert({
          user_id: userId,
          amount: quota,
          type: 'monthly_reset',
          description: `Monthly credit reset (${plan})`,
        });

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
