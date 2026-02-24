import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PLAN_CREDITS } from '@/lib/polar';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 });
  }

  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Find user by email from auth.users
  const { data: users, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) {
    return NextResponse.json({ error: listErr.message }, { status: 500 });
  }

  const user = users.users.find((u) => u.email === email);
  if (!user) {
    return NextResponse.json({ error: `User not found: ${email}` }, { status: 404 });
  }

  const quota = PLAN_CREDITS.enterprise;

  // Update profile plan
  const { error: profileErr } = await supabase
    .from('profiles')
    .update({ plan: 'enterprise' })
    .eq('id', user.id);
  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  // Upsert credit balance
  const { error: balanceErr } = await supabase
    .from('credit_balances')
    .upsert({
      user_id: user.id,
      balance: quota,
      monthly_quota: quota,
      plan: 'enterprise',
      reset_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    });
  if (balanceErr) {
    return NextResponse.json({ error: balanceErr.message }, { status: 500 });
  }

  // Log in ledger
  await supabase.from('credit_ledger').insert({
    user_id: user.id,
    amount: quota,
    type: 'purchase',
    description: `Enterprise plan activated for ${email}`,
  });

  return NextResponse.json({
    success: true,
    userId: user.id,
    email,
    plan: 'enterprise',
    balance: quota,
  });
}
