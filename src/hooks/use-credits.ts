// Shim: no credits in standalone site
export function useCreditBalance() {
  return { data: Infinity };
}

export function useInvalidateCredits() {
  return () => {};
}
