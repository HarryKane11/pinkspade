import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks';
import { PLAN_CREDITS } from '@/lib/polar';

// Use service role for webhook processing (bypasses RLS)
function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('POLAR_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  // Read raw body for signature verification
  const body = await request.text();
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  // Verify webhook signature using Polar SDK (Standard Webhooks)
  let event: { type: string; data?: Record<string, unknown> };
  try {
    event = validateEvent(body, headers, webhookSecret) as typeof event;
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }
    console.error('Webhook validation error:', err);
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
  }

  try {
    const supabase = getAdminClient();

    switch (event.type) {
      case 'checkout.completed': {
        const metadata = event.data?.metadata as Record<string, string> | undefined;
        const userId = metadata?.userId;
        const planId = metadata?.planId;
        if (!userId || !planId) {
          console.warn('Webhook checkout.completed missing userId or planId:', metadata);
          break;
        }

        const plan = planId.startsWith('ultra') ? 'ultra' : 'pro';
        const quota = PLAN_CREDITS[plan] ?? 500;

        // Update profile plan
        const { error: profileErr } = await supabase
          .from('profiles')
          .update({ plan })
          .eq('id', userId);
        if (profileErr) console.error('Webhook checkout: profiles update failed:', profileErr);

        // Update credit balance
        const { error: balanceErr } = await supabase
          .from('credit_balances')
          .upsert({
            user_id: userId,
            balance: quota,
            monthly_quota: quota,
            plan,
            reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });
        if (balanceErr) console.error('Webhook checkout: credit_balances upsert failed:', balanceErr);

        // Log purchase in ledger
        const { error: ledgerErr } = await supabase.from('credit_ledger').insert({
          user_id: userId,
          amount: quota,
          type: 'purchase',
          description: `Plan upgrade to ${plan}`,
          metadata: { planId, checkoutId: (event.data as Record<string, unknown>)?.id },
        });
        if (ledgerErr) console.error('Webhook checkout: credit_ledger insert failed:', ledgerErr);

        break;
      }

      case 'subscription.canceled': {
        const metadata = event.data?.metadata as Record<string, string> | undefined;
        const userId = metadata?.userId;
        if (!userId) {
          console.warn('Webhook subscription.canceled missing userId:', metadata);
          break;
        }

        const { error: profileErr } = await supabase
          .from('profiles')
          .update({ plan: 'free' })
          .eq('id', userId);
        if (profileErr) console.error('Webhook cancel: profiles update failed:', profileErr);

        const { error: balanceErr } = await supabase
          .from('credit_balances')
          .update({
            plan: 'free',
            monthly_quota: PLAN_CREDITS.free,
          })
          .eq('user_id', userId);
        if (balanceErr) console.error('Webhook cancel: credit_balances update failed:', balanceErr);

        break;
      }

      case 'subscription.renewed': {
        const metadata = event.data?.metadata as Record<string, string> | undefined;
        const userId = metadata?.userId;
        const planId = metadata?.planId;
        if (!userId) {
          console.warn('Webhook subscription.renewed missing userId:', metadata);
          break;
        }

        const plan = planId?.startsWith('ultra') ? 'ultra' : 'pro';
        const quota = PLAN_CREDITS[plan] ?? 500;

        const { error: balanceErr } = await supabase
          .from('credit_balances')
          .update({
            balance: quota,
            reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq('user_id', userId);
        if (balanceErr) console.error('Webhook renew: credit_balances update failed:', balanceErr);

        const { error: ledgerErr } = await supabase.from('credit_ledger').insert({
          user_id: userId,
          amount: quota,
          type: 'monthly_reset',
          description: `Monthly credit reset (${plan})`,
        });
        if (ledgerErr) console.error('Webhook renew: credit_ledger insert failed:', ledgerErr);

        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 202 });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
