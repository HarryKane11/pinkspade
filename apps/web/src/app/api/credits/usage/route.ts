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

  // Get current month's usage grouped by day
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('credit_ledger')
    .select('amount, type, model_id, created_at')
    .eq('user_id', user.id)
    .lt('amount', 0) // only debits
    .gte('created_at', startOfMonth.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Aggregate by day
  const dailyUsage: Record<string, number> = {};
  const modelUsage: Record<string, number> = {};

  for (const entry of data ?? []) {
    const day = new Date(entry.created_at).toISOString().split('T')[0];
    dailyUsage[day] = (dailyUsage[day] ?? 0) + Math.abs(entry.amount);

    const model = entry.model_id ?? 'text';
    modelUsage[model] = (modelUsage[model] ?? 0) + Math.abs(entry.amount);
  }

  const totalUsed = Object.values(dailyUsage).reduce((sum, v) => sum + v, 0);

  return NextResponse.json({
    totalUsed,
    dailyUsage,
    modelUsage,
  });
}
