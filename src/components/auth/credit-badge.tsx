'use client';

import { useEffect, useState } from 'react';
import { Coins } from 'lucide-react';

interface CreditInfo {
  balance: number;
  daily_limit: number;
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

  const percentage = (credits.balance / credits.daily_limit) * 100;
  const isLow = percentage <= 25;
  const isEmpty = credits.balance <= 0;

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
      <span>{credits.balance}</span>
      <span className="text-muted-foreground/60">/ {credits.daily_limit}</span>
    </div>
  );
}

/**
 * Dispatch event to refresh credit badge after API calls.
 */
export function notifyCreditsUpdated() {
  window.dispatchEvent(new Event('credits-updated'));
}
