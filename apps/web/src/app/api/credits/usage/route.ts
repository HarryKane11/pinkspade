import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Try SQL aggregation via RPC first (much faster for large ledgers)
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_monthly_usage', {
    p_user_id: user.id,
  });

  if (!rpcError && rpcData) {
    return NextResponse.json(rpcData);
  }

  // Fallback: JS aggregation (works before migration is applied)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('credit_ledger')
    .select('amount, type, model_id, created_at')
    .eq('user_id', user.id)
    .lt('amount', 0)
    .gte('created_at', startOfMonth.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Aggregate into arrays (matching CreditUsageChart's expected shape)
  const dailyMap: Record<string, number> = {};
  const modelMap: Record<string, { total: number; count: number }> = {};

  for (const entry of data ?? []) {
    const day = new Date(entry.created_at).toISOString().split('T')[0];
    dailyMap[day] = (dailyMap[day] ?? 0) + Math.abs(entry.amount);

    const model = entry.model_id ?? 'text';
    if (!modelMap[model]) modelMap[model] = { total: 0, count: 0 };
    modelMap[model].total += Math.abs(entry.amount);
    modelMap[model].count += 1;
  }

  const dailyUsage = Object.entries(dailyMap).map(([date, credits]) => ({ date, credits }));
  const modelUsage = Object.entries(modelMap).map(([model_id, { total, count }]) => ({
    model_id,
    total_credits: total,
    count,
  }));
  const totalUsed = dailyUsage.reduce((sum, d) => sum + d.credits, 0);

  return NextResponse.json({ totalUsed, dailyUsage, modelUsage });
}
