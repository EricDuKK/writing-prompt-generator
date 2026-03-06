// Shim: no daily usage limits
export async function getDailyUsageAction() {
  return { data: { count: 0, limit: 999 } };
}
