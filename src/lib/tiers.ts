export type Tier = 'basic' | 'pro';

export const TIER_LIMITS: Record<Tier, number> = {
  basic: 500,
  pro:   2000,
};

export function tierFromPriceId(priceId: string): Tier {
  if (priceId === import.meta.env.STRIPE_PRICE_PRO) return 'pro';
  return 'basic';
}

export function currentPeriod(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}
