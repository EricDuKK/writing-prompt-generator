'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CREDIT_COSTS, CREDIT_PACKS } from '@/config/credits';
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
  Package,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- Types ---
interface UsageRecord {
  id: number;
  action: string;
  credits_used: number;
  created_at: string;
}

interface PromptRecord {
  id: string;
  seq: number;
  input_text: string | null;
  category: string;
  prompt: string;
  generated_content: string | null;
  created_at: string;
}

interface ContentRecord {
  id: string;
  prompt_id: string | null;
  prompt_seq: number | null;
  sub_seq: number;
  input_prompt: string | null;
  content: string;
  created_at: string;
}

interface CreditInfo {
  balance: number;
  daily_limit: number;
  purchased_credits: number;
  plan: string;
  cancel_at_period_end?: boolean;
  current_period_end?: string;
  billing_interval?: string | null;
}

// --- Constants ---
const ACTION_LABELS: Record<string, string> = {
  'generate-ideas': 'AI Inspire',
  'generate-prompt': 'Generate Prompt',
  'generate-text': 'Generate Text',
  'translate-prompt': 'Translate',
  'ai-edit': 'AI Edit',
  'daily-refresh': 'Daily Credit Refresh',
  'purchase-credits': 'Purchase Credits',
};

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: { monthly: '$0', yearly: '$0' },
    period: { monthly: 'forever', yearly: 'forever' },
    credits: { monthly: 15, yearly: 15 },
    features: {
      monthly: ['15 daily credits', 'Standard models', 'All AI features'],
      yearly: ['15 daily credits', 'Standard models', 'All AI features'],
    },
  },
  {
    id: 'basic',
    name: 'Basic',
    price: { monthly: '$4.99', yearly: '$49.99' },
    period: { monthly: '/month', yearly: '/year' },
    credits: { monthly: 60, yearly: 80 },
    features: {
      monthly: ['60 daily credits', 'Standard models', 'All AI features'],
      yearly: ['80 daily credits', 'Standard models', 'All AI features'],
    },
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: { monthly: '$12.99', yearly: '$129.99' },
    period: { monthly: '/month', yearly: '/year' },
    credits: { monthly: 200, yearly: 220 },
    features: {
      monthly: ['200 daily credits', 'Advanced models', 'Higher quality & longer outputs', 'All AI features'],
      yearly: ['220 daily credits', 'Advanced models', 'Higher quality & longer outputs', 'All AI features'],
    },
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
  const [worksSubTab, setWorksSubTab] = useState<'prompt' | 'content'>('prompt');
  const [promptsData, setPromptsData] = useState<PromptRecord[]>([]);
  const [promptsTotal, setPromptsTotal] = useState(0);
  const [promptsPage, setPromptsPage] = useState(1);
  const [contentsData, setContentsData] = useState<ContentRecord[]>([]);
  const [contentsTotal, setContentsTotal] = useState(0);
  const [contentsPage, setContentsPage] = useState(1);
  const [worksLoading, setWorksLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedWorkId, setExpandedWorkId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

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
      fetchPrompts(1);
      fetchContents(1);
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

  const fetchPrompts = async (page: number) => {
    setWorksLoading(true);
    try {
      const res = await fetch(`/api/dashboard/my-works?type=prompt&page=${page}&limit=10`);
      if (res.ok) {
        const json = await res.json();
        setPromptsData(json.data);
        setPromptsTotal(json.total);
        setPromptsPage(page);
      }
    } catch { /* ignore */ }
    setWorksLoading(false);
  };

  const fetchContents = async (page: number) => {
    setWorksLoading(true);
    try {
      const res = await fetch(`/api/dashboard/my-works?type=content&page=${page}&limit=10`);
      if (res.ok) {
        const json = await res.json();
        setContentsData(json.data);
        setContentsTotal(json.total);
        setContentsPage(page);
      }
    } catch { /* ignore */ }
    setWorksLoading(false);
  };

  const handleDeleteWork = async (id: string, type: 'prompt' | 'content') => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      const res = await fetch('/api/dashboard/my-works', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type }),
      });
      if (res.ok) {
        if (type === 'prompt') {
          setPromptsData((prev) => prev.filter((w) => w.id !== id));
          setPromptsTotal((prev) => prev - 1);
        } else {
          setContentsData((prev) => prev.filter((w) => w.id !== id));
          setContentsTotal((prev) => prev - 1);
        }
      }
    } catch { /* ignore */ }
    setDeletingId(null);
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
  const promptsTotalPages = Math.ceil(promptsTotal / 10);
  const contentsTotalPages = Math.ceil(contentsTotal / 10);

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
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5" title="Total credits">
                  <Coins className="size-4" />
                  <span className="font-medium">{credits.balance + credits.purchased_credits}</span>
                </div>
                <Badge variant="outline" className="ml-1 text-xs capitalize">
                  {credits.plan}
                </Badge>
              </div>
            )}
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="User avatar"
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
                      {usageData.map((record) => {
                      const isCredit = record.action === 'daily-refresh' || record.action === 'purchase-credits';
                      return (
                        <div
                          key={record.id}
                          className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-md ${isCredit ? 'bg-emerald-500/10' : 'bg-primary/10'}`}>
                              {isCredit ? (
                                <Coins className="size-3.5 text-emerald-500" />
                              ) : (
                                <Zap className="size-3.5 text-primary" />
                              )}
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
                          <Badge
                            variant="outline"
                            className={`text-xs ${isCredit ? 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400' : ''}`}
                          >
                            {isCredit ? '+' : '-'}{record.credits_used} credits
                          </Badge>
                        </div>
                      );
                    })}
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
                {promptsTotal} prompts / {contentsTotal} contents
              </span>
            </div>

            {/* Sub tabs: Prompt / Content */}
            <div className="flex gap-2">
              <Button
                variant={worksSubTab === 'prompt' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setWorksSubTab('prompt'); setExpandedWorkId(null); }}
              >
                <Sparkles className="size-3.5 mr-1.5" />
                Prompts
                <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">{promptsTotal}</Badge>
              </Button>
              <Button
                variant={worksSubTab === 'content' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setWorksSubTab('content'); setExpandedWorkId(null); }}
              >
                <FileText className="size-3.5 mr-1.5" />
                Contents
                <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">{contentsTotal}</Badge>
              </Button>
            </div>

            {worksLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : worksSubTab === 'prompt' ? (
              /* ---- Prompts Sub Tab ---- */
              promptsData.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Sparkles className="size-10 mb-3 opacity-50" />
                    <p>No saved prompts yet</p>
                    <p className="text-sm">Generate prompts and they will appear here.</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="space-y-3">
                    {promptsData.map((p) => (
                      <Card key={p.id} className="overflow-hidden cursor-pointer" onClick={() => setExpandedWorkId(expandedWorkId === p.id ? null : p.id)}>
                        <CardHeader className="pb-2 overflow-hidden">
                          <div className="flex items-start justify-between overflow-hidden">
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs shrink-0 font-mono">{p.seq}#</Badge>
                                {p.input_text && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {p.input_text}
                                  </p>
                                )}
                              </div>
                              <div className={`text-sm leading-relaxed overflow-hidden ${expandedWorkId === p.id ? '' : 'max-h-24'}`}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {expandedWorkId === p.id
                                    ? p.prompt
                                    : p.prompt.length > 200
                                      ? p.prompt.slice(0, 200) + '...'
                                      : p.prompt}
                                </ReactMarkdown>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 ml-2 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={(e) => { e.stopPropagation(); handleCopy(p.prompt, p.id); }}
                              >
                                {copiedId === p.id ? (
                                  <Check className="size-3.5 text-green-500" />
                                ) : (
                                  <Copy className="size-3.5" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                disabled={deletingId === p.id}
                                onClick={(e) => { e.stopPropagation(); handleDeleteWork(p.id, 'prompt'); }}
                              >
                                {deletingId === p.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <div className="px-6 pb-3 flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="size-3" />
                          {formatDate(p.created_at)}
                          {p.prompt.length > 200 && (
                            <span className="text-primary/70">
                              {expandedWorkId === p.id ? '▲ Collapse' : '▼ Expand'}
                            </span>
                          )}
                          <Badge variant="secondary" className="text-xs ml-auto">{p.category}</Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                  {promptsTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="outline" size="sm" disabled={promptsPage <= 1} onClick={() => fetchPrompts(promptsPage - 1)}>
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {promptsPage} of {promptsTotalPages}
                      </span>
                      <Button variant="outline" size="sm" disabled={promptsPage >= promptsTotalPages} onClick={() => fetchPrompts(promptsPage + 1)}>
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )
            ) : (
              /* ---- Contents Sub Tab ---- */
              contentsData.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <FileText className="size-10 mb-3 opacity-50" />
                    <p>No saved contents yet</p>
                    <p className="text-sm">Generate content from prompts and they will appear here.</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="space-y-3">
                    {contentsData.map((c) => (
                      <Card key={c.id} className="overflow-hidden cursor-pointer" onClick={() => setExpandedWorkId(expandedWorkId === c.id ? null : c.id)}>
                        <CardHeader className="pb-2 overflow-hidden">
                          <div className="flex items-start justify-between overflow-hidden">
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs shrink-0 font-mono">
                                  {c.prompt_seq ? `${c.prompt_seq}-${c.sub_seq}#` : `?-${c.sub_seq}#`}
                                </Badge>
                                {c.input_prompt && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {c.input_prompt}
                                  </p>
                                )}
                              </div>
                              <div className={`text-sm leading-relaxed overflow-hidden ${expandedWorkId === c.id ? '' : 'max-h-32'}`}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {expandedWorkId === c.id
                                    ? c.content
                                    : c.content.length > 300
                                      ? c.content.slice(0, 300) + '...'
                                      : c.content}
                                </ReactMarkdown>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 ml-2 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={(e) => { e.stopPropagation(); handleCopy(c.content, c.id); }}
                              >
                                {copiedId === c.id ? (
                                  <Check className="size-3.5 text-green-500" />
                                ) : (
                                  <Copy className="size-3.5" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                disabled={deletingId === c.id}
                                onClick={(e) => { e.stopPropagation(); handleDeleteWork(c.id, 'content'); }}
                              >
                                {deletingId === c.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <div className="px-6 pb-3 flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="size-3" />
                          {formatDate(c.created_at)}
                          {c.content.length > 300 && (
                            <span className="text-primary/70">
                              {expandedWorkId === c.id ? '▲ Collapse' : '▼ Expand'}
                            </span>
                          )}
                          {c.prompt_seq && (
                            <Badge variant="secondary" className="text-xs ml-auto font-mono">
                              from {c.prompt_seq}#
                            </Badge>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                  {contentsTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="outline" size="sm" disabled={contentsPage <= 1} onClick={() => fetchContents(contentsPage - 1)}>
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {contentsPage} of {contentsTotalPages}
                      </span>
                      <Button variant="outline" size="sm" disabled={contentsPage >= contentsTotalPages} onClick={() => fetchContents(contentsPage + 1)}>
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )
            )}
          </TabsContent>

          {/* Upgrade Plan Tab */}
          <TabsContent value="plans" className="space-y-6">
            {/* Subscription Plans Section */}
            <div>
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold mb-1">Subscription Plans</h2>
                <p className="text-sm text-muted-foreground">
                  Upgrade to get more daily credits and unlock premium features.
                </p>
              </div>

              {/* Billing period toggle */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <Button
                  variant={billingPeriod === 'monthly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBillingPeriod('monthly')}
                >
                  Monthly
                </Button>
                <Button
                  variant={billingPeriod === 'yearly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBillingPeriod('yearly')}
                >
                  Yearly
                  <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">Save up to 37%</Badge>
                </Button>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {PLANS.map((plan) => {
                  const isCurrent = credits?.plan === plan.id &&
                    (plan.id === 'free' || credits?.billing_interval === billingPeriod);
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
                          <span className="text-3xl font-bold">{plan.price[billingPeriod]}</span>
                          <span className="text-sm text-muted-foreground">{plan.period[billingPeriod]}</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 mb-4 text-sm">
                          <Coins className="size-4 text-amber-500" />
                          <span className="font-medium">{plan.credits[billingPeriod]} credits / day</span>
                        </div>
                        <ul className="space-y-2 mb-6">
                          {plan.features[billingPeriod].map((feature) => (
                            <li key={feature} className="flex items-center gap-2 text-sm">
                              <Check className="size-4 text-green-500 shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <Button
                          className="w-full"
                          variant={plan.popular ? 'default' : 'outline'}
                          disabled={isCurrent || plan.id === 'free' || subscribing === plan.id}
                          onClick={async () => {
                            if (plan.id === 'free' || isCurrent) return;
                            setSubscribing(plan.id);
                            try {
                              const res = await fetch('/api/stripe/subscribe', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ planId: plan.id, period: billingPeriod }),
                              });
                              const data = await res.json();
                              if (data.url) {
                                window.location.href = data.url;
                              }
                            } catch {
                              // ignore
                            } finally {
                              setSubscribing(null);
                            }
                          }}
                        >
                          {subscribing === plan.id
                            ? 'Processing...'
                            : isCurrent
                              ? 'Current Plan'
                              : plan.id === 'free'
                                ? 'Free Forever'
                                : credits?.plan && credits.plan !== 'free'
                                  ? 'Switch Plan'
                                  : 'Subscribe'}
                        </Button>
                        {isCurrent && credits?.plan !== 'free' && (
                          <div className="mt-3 pt-3 border-t">
                            {credits?.cancel_at_period_end ? (
                              <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                                Will be cancelled on{' '}
                                {new Date(credits.current_period_end!).toLocaleDateString()}.
                                You can continue using until then.
                              </p>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs text-muted-foreground hover:text-destructive"
                                disabled={cancelling}
                                onClick={() => setShowCancelDialog(true)}
                              >
                                {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <p className="text-xs text-center text-muted-foreground mt-4">
                Subscribe to unlock more daily credits and advanced features.
              </p>
            </div>

            {/* Credit Packs Section */}
            <div>
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold mb-1">Credit Packs</h2>
                <p className="text-sm text-muted-foreground">
                  Buy credits that never expire. Used after daily credits run out.
                </p>
              </div>

              {credits && credits.purchased_credits > 0 && (
                <div className="flex items-center justify-center gap-2 mb-4 text-sm">
                  <Package className="size-4 text-emerald-500" />
                  <span>You have <span className="font-semibold text-emerald-600 dark:text-emerald-400">{credits.purchased_credits}</span> purchased credits remaining</span>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {CREDIT_PACKS.map((pack) => (
                  <Card key={pack.id} className="relative overflow-hidden hover:shadow-md transition-shadow">
                    {pack.id === 'pack-500' && (
                      <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-medium">
                        Best Value
                      </div>
                    )}
                    <CardContent className="pt-5 pb-4 text-center">
                      <div className="text-2xl font-bold mb-1">{pack.credits}</div>
                      <div className="text-xs text-muted-foreground mb-3">credits</div>
                      <div className="text-lg font-semibold mb-1">{pack.priceDisplay}</div>
                      <div className="text-[10px] text-muted-foreground mb-3">
                        ${(pack.price / pack.credits / 100).toFixed(4)}/credit
                      </div>
                      <Button
                        size="sm"
                        className="w-full"
                        variant={pack.id === 'pack-500' ? 'default' : 'outline'}
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/stripe/checkout', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ packId: pack.id }),
                            });
                            const data = await res.json();
                            if (data.url) {
                              window.location.href = data.url;
                            } else {
                              alert(data.error || 'Failed to create checkout session');
                            }
                          } catch (err) {
                            alert('Network error, please try again');
                          }
                        }}
                      >
                        Buy
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Cancel Subscription Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You will keep access until the end of your current billing period.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={cancelling}
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              disabled={cancelling}
              onClick={async () => {
                setCancelling(true);
                try {
                  const res = await fetch('/api/stripe/cancel', { method: 'POST' });
                  const data = await res.json();
                  if (data.success) {
                    await fetchCredits();
                    setShowCancelDialog(false);
                  } else {
                    alert(data.error || 'Failed to cancel subscription');
                  }
                } catch {
                  alert('Failed to cancel subscription');
                } finally {
                  setCancelling(false);
                }
              }}
            >
              {cancelling ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  Cancelling...
                </>
              ) : (
                'Yes, Cancel'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
