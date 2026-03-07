// Credit costs per action
export const CREDIT_COSTS = {
  'generate-ideas': 1,
  'generate-prompt': 2,
  'generate-text': 3,
  'translate-prompt': 1,
  'ai-edit': 2,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

// Plan limits (daily credits)
export const PLAN_LIMITS = {
  free: 20,
  basic: 100,
  pro: 500,
  power: 999999,
} as const;

export type Plan = keyof typeof PLAN_LIMITS;
