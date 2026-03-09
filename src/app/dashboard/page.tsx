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
                                onClick={(e) => { e.stopPropagation(); handleDeleteWork(p.id, 'prompt'); }}
                              >
                                <Trash2 className="size-3.5" />
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
                                onClick={(e) => { e.stopPropagation(); handleDeleteWork(c.id, 'content'); }}
                              >
                                <Trash2 className="size-3.5" />
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
