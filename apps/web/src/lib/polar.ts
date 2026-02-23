import { Polar } from '@polar-sh/sdk';

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN ?? '',
});

// Product IDs from Polar dashboard (configure these in .env)
export const POLAR_PRODUCTS = {
  pro_monthly: process.env.POLAR_PRODUCT_PRO_MONTHLY ?? '',
  pro_yearly: process.env.POLAR_PRODUCT_PRO_YEARLY ?? '',
  enterprise_monthly: process.env.POLAR_PRODUCT_ENTERPRISE_MONTHLY ?? '',
  enterprise_yearly: process.env.POLAR_PRODUCT_ENTERPRISE_YEARLY ?? '',
};

// Plan → credit quota mapping
export const PLAN_CREDITS: Record<string, number> = {
  free: 500,
  pro: 5000,
  enterprise: 999999,
};
