'use client';

import { useEffect, useState } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LayoutDashboard, LogOut, User as UserIcon, UserCircle2, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CreditBadge } from '@/components/auth/credit-badge';

export function AuthButton() {
  if (!isSupabaseConfigured) {
    return null;
  }

  return <AuthButtonInner />;
}

function AuthButtonInner() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
    );
  }

  if (!user) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleSignIn}
        className="h-8 px-3 text-xs gap-1.5"
      >
        <UserCircle2 className="size-3.5" />
        Sign In
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <CreditBadge />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2 gap-1.5">
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt=""
                className="size-6 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center">
                <UserIcon className="size-3.5 text-primary" />
              </div>
            )}
            <span className="text-xs max-w-[100px] truncate hidden sm:inline">
              {user.email?.split('@')[0]}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5">
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer text-xs gap-2"
            onClick={() => router.push('/dashboard')}
          >
            <LayoutDashboard className="size-3.5" />
            Dashboard
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer text-xs gap-2"
            onClick={() => router.push('/dashboard?tab=plans')}
          >
            <Zap className="size-3.5" />
            Upgrade Plan
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer text-xs gap-2 text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="size-3.5" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
