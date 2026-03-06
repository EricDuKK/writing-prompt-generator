// Shim: all models are free in standalone site
export const MODEL_CREDIT_COSTS: Record<string, number> = new Proxy(
  {},
  { get: () => 0 }
);
