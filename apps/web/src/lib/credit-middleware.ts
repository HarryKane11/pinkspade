import { createClient } from '@/lib/supabase/server';

interface DeductResult {
  success: boolean;
  balance?: number;
  deducted?: number;
  error?: string;
}

/**
 * Check and deduct credits atomically via Supabase RPC.
 * Call this from API routes before performing costly operations.
 */
export async function checkAndDeductCredits(
  amount: number,
  type: 'generation' | 'copy',
  modelId?: string
): Promise<DeductResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'not_authenticated' };
  }

  const { data, error } = await supabase.rpc('deduct_credits', {
    p_user_id: user.id,
    p_amount: amount,
    p_type: type,
    p_model_id: modelId ?? null,
    p_description: `${type}: ${modelId ?? 'text'}`,
  });

  if (error) {
    console.error('Credit deduction error:', error);
    return { success: false, error: error.message };
  }

  // data is the JSONB result from the SQL function
  const result = data as { success: boolean; balance?: number; deducted?: number; error?: string };
  return result;
}

/**
 * Refund credits after a failed generation.
 * Adds credits back and logs a refund entry in the ledger.
 */
export async function refundCredits(
  amount: number,
  modelId?: string
): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  // Add credits back
  await supabase.rpc('deduct_credits', {
    p_user_id: user.id,
    p_amount: -amount, // negative = refund
    p_type: 'refund',
    p_model_id: modelId ?? null,
    p_description: `refund: ${modelId ?? 'unknown'} (generation failed)`,
  });
}

/**
 * Get user's current credit balance.
 */
export async function getCreditBalance(): Promise<{
  balance: number;
  plan: string;
  monthlyQuota: number;
  resetAt: string;
} | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('credit_balances')
    .select('balance, plan, monthly_quota, reset_at')
    .eq('user_id', user.id)
    .single();

  if (error || !data) return null;

  return {
    balance: data.balance,
    plan: data.plan,
    monthlyQuota: data.monthly_quota,
    resetAt: data.reset_at,
  };
}
