'use client';

import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LoginFormProps {
  callbackUrl?: string;
  className?: string;
  errorMessage?: string;
}

export function LoginForm({ callbackUrl, className, errorMessage }: LoginFormProps) {
  const isAuthError = errorMessage?.includes('Authentication required') || !errorMessage;
  const isAnonymousLimitReached = errorMessage?.includes('Free trial') || errorMessage?.includes('Sign in to use');
  const showSignIn = isAuthError || isAnonymousLimitReached;

  const handleSignIn = async () => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className={cn('flex flex-col items-center gap-5 p-6', className)}>
      <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
        {showSignIn ? (
          <Sparkles className="size-7 text-amber-600 dark:text-amber-400" />
        ) : (
          <AlertCircle className="size-7 text-orange-600 dark:text-orange-400" />
        )}
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <h3 className="text-lg font-semibold tracking-tight">
          {isAnonymousLimitReached
            ? 'Free Trial Limit Reached'
            : isAuthError
              ? 'Unlock AI-Powered Writing'
              : 'Insufficient Credits'}
        </h3>
        <p className="text-sm text-muted-foreground max-w-[280px]">
          {isAnonymousLimitReached
            ? 'Sign in to get more free daily credits and unlock all features.'
            : isAuthError
              ? 'Log in to generate prompts, get AI inspiration, and more. Enjoy free daily credits on us.'
              : 'You have run out of credits. Please try again tomorrow or upgrade your plan.'}
        </p>
      </div>

      {showSignIn && isSupabaseConfigured && (
        <Button
          onClick={handleSignIn}
          className="w-full max-w-[260px] h-10 gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
        >
          <svg className="size-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign in with Google
        </Button>
      )}

      {!showSignIn && (
        <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-4 py-2.5 text-center max-w-[280px]">
          Daily credits reset at midnight PT. You can continue using the features then.
        </div>
      )}
    </div>
  );
}
