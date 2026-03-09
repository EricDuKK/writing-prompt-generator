'use client';

import { useEffect, useState } from 'react';
import { Coins } from 'lucide-react';

interface CreditInfo {
  balance: number;
  daily_limit: number;
  purchased_credits: number;
  plan: string;
}

export function CreditBadge() {
  const [credits, setCredits] = useState<CreditInfo | null>(null);

  const fetchCredits = async () => {
    try {
      const res = await fetch('/api/auth/credits');
      if (res.ok) {
        const data = await res.json();
        setCredits(data);
      }
    } catch {
      // Silently fail
    }
  };

  useEffect(() => {
    fetchCredits();

    // Listen for credit updates from API calls
    const handler = () => fetchCredits();
    window.addEventListener('credits-updated', handler);
    return () => window.removeEventListener('credits-updated', handler);
  }, []);

  if (!credits) return null;

  const total = credits.balance + credits.purchased_credits;
  const isEmpty = total <= 0;
  const isLow = total <= 3;

  return (
    <div
      className={`flex items-center gap-1.5 h-8 px-2.5 rounded-full border text-xs font-medium transition-colors ${
        isEmpty
          ? 'border-destructive/50 bg-destructive/5 text-destructive'
          : isLow
            ? 'border-amber-500/50 bg-amber-500/5 text-amber-600 dark:text-amber-400'
            : 'border-border bg-muted/50 text-muted-foreground'
      }`}
    >
      <Coins className="size-3.5" />
      <span>{total}</span>
    </div>
  );
}

/**
 * Dispatch event to refresh credit badge after API calls.
 */
export function notifyCreditsUpdated() {
  window.dispatchEvent(new Event('credits-updated'));
}
