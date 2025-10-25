export const PLANS = {
  STARTER: {
    name: 'Starter',
    price: 15,
    docsPerMonth: 20,
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID,
  },
  GROWTH: {
    name: 'Growth',
    price: 49,
    docsPerMonth: 100,
    stripePriceId: process.env.STRIPE_GROWTH_PRICE_ID,
  },
  PRO: {
    name: 'Pro',
    price: 99,
    docsPerMonth: -1, // Unlimited
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
  },
} as const;

export type PlanType = keyof typeof PLANS;

export function getPlanByPriceId(priceId: string): PlanType | null {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.stripePriceId === priceId) {
      return key as PlanType;
    }
  }
  return null;
}

export function getPlanByType(type: PlanType) {
  return PLANS[type];
} 