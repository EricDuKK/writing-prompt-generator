'use client';

import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { LogIn, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LoginFormProps {
  callbackUrl?: string;
  className?: string;
  errorMessage?: string;
}

export function LoginForm({ callbackUrl, className, errorMessage }: LoginFormProps) {
  const isAuthError = errorMessage?.includes('Authentication required') || !errorMessage;

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
        {isAuthError ? (
          <Sparkles className="size-7 text-amber-600 dark:text-amber-400" />
        ) : (
          <AlertCircle className="size-7 text-orange-600 dark:text-orange-400" />
        )}
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <h3 className="text-lg font-semibold tracking-tight">
          {isAuthError ? 'Unlock AI-Powered Writing' : 'Insufficient Credits'}
        </h3>
        <p className="text-sm text-muted-foreground max-w-[280px]">
          {isAuthError
            ? 'Log in to generate prompts, get AI inspiration, and more. Enjoy free daily credits on us.'
            : 'You have run out of credits. Please try again tomorrow or upgrade your plan.'}
        </p>
      </div>

      {isAuthError && isSupabaseConfigured && (
        <Button
          onClick={handleSignIn}
          className="w-full max-w-[260px] h-10 gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
        >
          <LogIn className="size-4" />
          Sign in with Google
        </Button>
      )}

      {!isAuthError && (
        <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-4 py-2.5 text-center max-w-[280px]">
          Daily credits reset at midnight PT. You can continue using the features then.
        </div>
      )}
    </div>
  );
}
