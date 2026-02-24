import { Polar } from '@polar-sh/sdk';

const isSandbox = process.env.POLAR_SANDBOX === 'true';

export const polar = new Polar({
  accessToken: process.env.POLAR_API_KEY ?? '',
  ...(isSandbox && { server: 'sandbox' as const }),
});

// Product IDs from Polar (configured in .env.local)
export const POLAR_PRODUCTS: Record<string, string> = {
  pro_monthly: process.env.POLAR_PRODUCT_PRO_MONTHLY ?? '',
  pro_yearly: process.env.POLAR_PRODUCT_PRO_YEARLY ?? '',
  ultra_monthly: process.env.POLAR_PRODUCT_ULTRA_MONTHLY ?? '',
  ultra_yearly: process.env.POLAR_PRODUCT_ULTRA_YEARLY ?? '',
};

// Plan → monthly credit quota
export const PLAN_CREDITS: Record<string, number> = {
  free: 500,
  pro: 5000,
  ultra: 30000,
  enterprise: 999999,
};
