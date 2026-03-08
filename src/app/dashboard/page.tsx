'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CREDIT_COSTS } from '@/config/credits';
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Coins,
  Copy,
  Crown,
  FileText,
  History,
  Loader2,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';

// --- Types ---
interface UsageRecord {
  id: number;
  action: string;
  credits_used: number;
  created_at: string;
}

interface WorkRecord {
  id: string;
  input_text: string | null;
  category: string;
  enhanced_options: Record<string, string> | null;
  prompt: string;
  generated_content: string | null;
  created_at: string;
}

interface CreditInfo {
  balance: number;
  daily_limit: number;
  plan: string;
}

// --- Constants ---
const ACTION_LABELS: Record<string, string> = {
  'generate-ideas': 'AI Inspire',
  'generate-prompt': 'Generate Prompt',
  'generate-text': 'Generate Text',
  'translate-prompt': 'Translate',
  'ai-edit': 'AI Edit',
};

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    credits: 20,
    features: ['20 daily credits', 'All AI features', 'Basic support'],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '$9.99',
    period: '/month',
    credits: 100,
    features: ['100 daily credits', 'All AI features', 'Priority support'],
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29.99',
    period: '/month',
    credits: 500,
    features: ['500 daily credits', 'All AI features', 'Priority support', 'API access'],
  },
];

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'usage';
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<CreditInfo | null>(null);

  // Usage history state
  const [usageData, setUsageData] = useState<UsageRecord[]>([]);
  const [usageTotal, setUsageTotal] = useState(0);
  const [usagePage, setUsagePage] = useState(1);
  const [usageLoading, setUsageLoading] = useState(false);

  // My works state
  const [worksData, setWorksData] = useState<WorkRecord[]>([]);
  const [worksTotal, setWorksTotal] = useState(0);
  const [worksPage, setWorksPage] = useState(1);
  const [worksLoading, setWorksLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      router.push('/');
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/');
        return;
      }
      setUser(user);
      setLoading(false);
    });
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchCredits();
      fetchUsageHistory(1);
      fetchWorks(1);
    }
  }, [user]);

  const fetchCredits = async () => {
    try {
      const res = await fetch('/api/auth/credits');
      if (res.ok) setCredits(await res.json());
    } catch { /* ignore */ }
  };

  const fetchUsageHistory = async (page: number) => {
    setUsageLoading(true);
    try {
      const res = await fetch(`/api/dashboard/usage-history?page=${page}&limit=20`);
      if (res.ok) {
        const json = await res.json();
        setUsageData(json.data);
        setUsageTotal(json.total);
        setUsagePage(page);
      }
    } catch { /* ignore */ }
    setUsageLoading(false);
  };

  const fetchWorks = async (page: number) => {
    setWorksLoading(true);
    try {
      const res = await fetch(`/api/dashboard/my-works?page=${page}&limit=10`);
      if (res.ok) {
        const json = await res.json();
        setWorksData(json.data);
        setWorksTotal(json.total);
        setWorksPage(page);
      }
    } catch { /* ignore */ }
    setWorksLoading(false);
  };

  const handleDeleteWork = async (id: string) => {
    try {
      const res = await fetch('/api/dashboard/my-works', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setWorksData((prev) => prev.filter((w) => w.id !== id));
        setWorksTotal((prev) => prev - 1);
      }
    } catch { /* ignore */ }
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const usageTotalPages = Math.ceil(usageTotal / 20);
  const worksTotalPages = Math.ceil(worksTotal / 10);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
              <ArrowLeft className="size-4 mr-1" />
              Back
            </Button>
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            {credits && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Coins className="size-4" />
                <span className="font-medium">{credits.balance}</span>
                <span>/ {credits.daily_limit}</span>
                <Badge variant="outline" className="ml-1 text-xs capitalize">
                  {credits.plan}
                </Badge>
              </div>
            )}
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt=""
                className="size-8 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="usage" className="gap-1.5">
              <History className="size-4" />
              <span className="hidden sm:inline">Usage History</span>
              <span className="sm:hidden">History</span>
            </TabsTrigger>
            <TabsTrigger value="works" className="gap-1.5">
              <FileText className="size-4" />
              <span className="hidden sm:inline">My Works</span>
              <span className="sm:hidden">Works</span>
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-1.5">
              <Crown className="size-4" />
              <span className="hidden sm:inline">Upgrade Plan</span>
              <span className="sm:hidden">Plans</span>
            </TabsTrigger>
          </TabsList>

          {/* Usage History Tab */}
          <TabsContent value="usage" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Credit Usage History</h2>
              <span className="text-sm text-muted-foreground">
                {usageTotal} total records
              </span>
            </div>

            {/* Credit cost reference */}
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Credit costs per action:</p>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(CREDIT_COSTS).map(([action, cost]) => (
                    <div key={action} className="flex items-center gap-1.5 text-xs">
                      <span className="text-muted-foreground">{ACTION_LABELS[action] || action}</span>
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        {cost}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {usageLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : usageData.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <History className="size-10 mb-3 opacity-50" />
                  <p>No usage history yet</p>
                  <p className="text-sm">Start using AI features to see your history here.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {usageData.map((record) => (
                        <div
                          key={record.id}
                          className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-md bg-primary/10">
                              <Zap className="size-3.5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {ACTION_LABELS[record.action] || record.action}
                              </p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="size-3" />
                                {formatDate(record.created_at)}
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            -{record.credits_used} credits
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Pagination */}
                {usageTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={usagePage <= 1}
                      onClick={() => fetchUsageHistory(usagePage - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {usagePage} of {usageTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={usagePage >= usageTotalPages}
                      onClick={() => fetchUsageHistory(usagePage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* My Works Tab */}
          <TabsContent value="works" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">My Works</h2>
              <span className="text-sm text-muted-foreground">
                {worksTotal} saved works
              </span>
            </div>

            {worksLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : worksData.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileText className="size-10 mb-3 opacity-50" />
                  <p>No saved works yet</p>
                  <p className="text-sm">Generate prompts and they will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-4">
                  {worksData.map((work) => (
                    <Card key={work.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            {work.input_text && (
                              <p className="text-xs text-muted-foreground mb-1 truncate">
                                Input: {work.input_text}
                              </p>
                            )}
                            <CardTitle className="text-sm font-medium leading-snug">
                              {work.prompt.length > 150
                                ? work.prompt.slice(0, 150) + '...'
                                : work.prompt}
                            </CardTitle>
                          </div>
                          <div className="flex items-center gap-1 ml-2 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleCopy(work.prompt, work.id)}
                            >
                              {copiedId === work.id ? (
                                <Check className="size-3.5 text-green-500" />
                              ) : (
                                <Copy className="size-3.5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteWork(work.id)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      {work.generated_content && (
                        <CardContent className="pt-0">
                          <div className="bg-muted/50 rounded-md p-3 text-xs text-muted-foreground max-h-32 overflow-y-auto whitespace-pre-wrap">
                            {work.generated_content.length > 500
                              ? work.generated_content.slice(0, 500) + '...'
                              : work.generated_content}
                          </div>
                        </CardContent>
                      )}
                      <div className="px-6 pb-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="size-3" />
                        {formatDate(work.created_at)}
                        <Badge variant="secondary" className="text-xs ml-auto capitalize">
                          {work.category}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {worksTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={worksPage <= 1}
                      onClick={() => fetchWorks(worksPage - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {worksPage} of {worksTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={worksPage >= worksTotalPages}
                      onClick={() => fetchWorks(worksPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Upgrade Plan Tab */}
          <TabsContent value="plans" className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold mb-1">Choose Your Plan</h2>
              <p className="text-sm text-muted-foreground">
                Upgrade to get more daily credits and unlock premium features.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {PLANS.map((plan) => {
                const isCurrent = credits?.plan === plan.id;
                return (
                  <Card
                    key={plan.id}
                    className={`relative overflow-hidden transition-shadow ${
                      plan.popular
                        ? 'border-primary shadow-md'
                        : isCurrent
                          ? 'border-green-500'
                          : ''
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg font-medium">
                        Popular
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {plan.id === 'pro' && <Sparkles className="size-5 text-primary" />}
                        {plan.name}
                        {isCurrent && (
                          <Badge variant="secondary" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-3xl font-bold">{plan.price}</span>
                        <span className="text-sm text-muted-foreground">{plan.period}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-4 text-sm">
                        <Coins className="size-4 text-amber-500" />
                        <span className="font-medium">{plan.credits} credits / day</span>
                      </div>
                      <ul className="space-y-2 mb-6">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm">
                            <Check className="size-4 text-green-500 shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        variant={plan.popular ? 'default' : 'outline'}
                        disabled={isCurrent || plan.id === 'free'}
                      >
                        {isCurrent
                          ? 'Current Plan'
                          : plan.id === 'free'
                            ? 'Free Forever'
                            : 'Coming Soon'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <p className="text-xs text-center text-muted-foreground mt-4">
              Paid plans are coming soon. Stay tuned for updates!
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
