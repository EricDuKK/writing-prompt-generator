'use client';

import { useEffect, useState } from 'react';
import { Coins, Sparkles } from 'lucide-react';

interface CreditInfo {
  balance: number;
  daily_limit: number;
  purchased_credits: number;
  plan: string;
}

interface AnonymousInfo {
  totalRemaining: number;
  totalLimit: number;
}

export function CreditBadge({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const [credits, setCredits] = useState<CreditInfo | null>(null);
  const [anonymous, setAnonymous] = useState<AnonymousInfo | null>(null);

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

  const fetchAnonymousCredits = async () => {
    try {
      const res = await fetch('/api/auth/anonymous-credits');
      if (res.ok) {
        const data = await res.json();
        setAnonymous(data);
      }
    } catch {
      // Silently fail
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchCredits();
    } else {
      fetchAnonymousCredits();
    }

    const handler = () => {
      if (isLoggedIn) {
        fetchCredits();
      } else {
        fetchAnonymousCredits();
      }
    };
    window.addEventListener('credits-updated', handler);
    return () => window.removeEventListener('credits-updated', handler);
  }, [isLoggedIn]);

  // Logged-in user: show credit balance
  if (isLoggedIn && credits) {
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

  // Anonymous user: show remaining free trials
  if (!isLoggedIn && anonymous) {
    const { totalRemaining, totalLimit } = anonymous;
    const isEmpty = totalRemaining <= 0;

    return (
      <div
        className={`flex items-center gap-1.5 h-8 px-2.5 rounded-full border text-xs font-medium transition-colors ${
          isEmpty
            ? 'border-destructive/50 bg-destructive/5 text-destructive'
            : 'border-emerald-500/50 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
        }`}
        title={isEmpty ? 'Free trial exhausted. Sign in for more.' : `Free trial: ${totalRemaining}/${totalLimit} remaining`}
      >
        <Sparkles className="size-3.5" />
        <span>{totalRemaining}/{totalLimit}</span>
      </div>
    );
  }

  return null;
}

/**
 * Dispatch event to refresh credit badge after API calls.
 */
export function notifyCreditsUpdated() {
  window.dispatchEvent(new Event('credits-updated'));
}
