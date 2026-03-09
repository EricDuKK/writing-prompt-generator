// Credit costs per action
export const CREDIT_COSTS = {
  'generate-ideas': 1,
  'generate-prompt': 2,
  'generate-text': 3,
  'translate-prompt': 1,
  'ai-edit': 2,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

// Plan limits (daily credits) - Plan A
export const PLAN_LIMITS = {
  free: 15,
  basic: 60,
  pro: 200,
  power: 999999,
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

// Credit packs (one-time purchase, never expire)
export const CREDIT_PACKS = [
  { id: 'pack-50', name: 'Small Pack', credits: 50, price: 199, priceDisplay: '$1.99' },
  { id: 'pack-200', name: 'Medium Pack', credits: 200, price: 599, priceDisplay: '$5.99' },
  { id: 'pack-500', name: 'Large Pack', credits: 500, price: 999, priceDisplay: '$9.99' },
  { id: 'pack-1500', name: 'Super Pack', credits: 1500, price: 1999, priceDisplay: '$19.99' },
] as const;

export type CreditPackId = (typeof CREDIT_PACKS)[number]['id'];
