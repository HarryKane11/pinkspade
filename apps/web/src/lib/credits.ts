// ─── Credit Cost Constants ───

export const CREDIT_COSTS: Record<string, number> = {
  'flux-schnell': 10,
  'flux-dev': 30,
  'recraft-v4': 30,
  'recraft-v4-pro': 30,
  'recraft-v4-vector': 30,
  'flux-kontext': 30,
  'flux-pro-ultra': 50,
  'nano-banana-pro': 50,
};

export const COPY_COST = 5;

export const PLAN_QUOTAS: Record<string, number> = {
  free: 500,
  pro: 5000,
  enterprise: 999999,
};

export function getCreditCost(modelId: string): number {
  return CREDIT_COSTS[modelId] ?? 30; // default to pro tier
}
