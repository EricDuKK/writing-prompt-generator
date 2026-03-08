'use client';

import { saveGeneratedPromptAction } from '@/actions/save-generated-prompt';
import { LoginForm } from '@/components/auth/login-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { presetOptionOverrides } from '@/components/prompt-generator/model-config';
import { authClient } from '@/lib/auth-client';
import type { Paragraph as ParagraphType, TextRun as TextRunType } from 'docx';
import {
  Briefcase,
  Check,
  ChevronDown,
  Copy,
  Edit2,
  FileText,
  Globe,
  GraduationCap,
  Heart,
  Lightbulb,
  Loader2,
  Megaphone,
  MessageSquare,
  Rocket,
  Share2,
  Shield,
  Skull,
  Sparkles,
  Sword,
  Wand2,
  X,
} from 'lucide-react';
import { Download } from 'lucide-react';
import { useLocale, useMessages, useTranslations } from '@/i18n/next-intl-shim';
import { notifyCreditsUpdated } from '@/components/auth/credit-badge';
import { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type PromptCategory = 'writing';


// 类别选项的键（用于翻译映射）
const categoryOptionKeys: Record<PromptCategory, string[]> = {
  writing: ['文体', '语气', '长度', '受众', '目的'],
};

const categoryOptionValues: Record<PromptCategory, Record<string, string[]>> = {
  writing: {
    文体: ['正式', '非正式', '学术', '商业', '创意', '技术', '新闻'],
    语气: ['专业', '友好', '严肃', '幽默', '鼓励', '客观', '主观'],
    长度: ['简短', '中等', '详细', '超详细', '根据内容'],
    受众: ['普通读者', '专业人士', '学生', '企业', '技术人员', '消费者'],
    目的: ['告知', '说服', '娱乐', '教育', '销售', '建立关系'],
  },
};

export interface GeneratedImageData {
  id: string;
  inputText?: string | null;
  enhancedOptions?: Record<string, string> | null;
  prompt: string;
  generatedContent?: string | null;
  category: string;
  modelId?: string | null;
}

export interface PromptGeneratorProps {
  hideHeader?: boolean;
  initialData?: GeneratedImageData | null;
}

export function PromptGenerator({
  hideHeader = false,
  initialData,
}: PromptGeneratorProps) {
  const t = useTranslations('HomePage.promptGenerator');
  const locale = useLocale();
  const messages = useMessages();
  const { data: session } = authClient.useSession();
  const isLoggedIn = !!session?.user;

  // Login dialog state - shown when unauthenticated users try to interact
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginDialogMessage, setLoginDialogMessage] = useState<string>('');

  // Track if component is mounted to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);

  // Credits hooks - used only for displaying balance in UI
  // Credit deduction is handled by backend APIs
  const invalidateCredits = () => {};
  const [input, setInput] = useState(initialData?.inputText || '');
  const [category, setCategory] = useState<PromptCategory>('writing');

  // Session storage key for persisting state across login redirects
  const SESSION_STORAGE_KEY = 'prompt-generator-draft-writing';

  // Set mounted to true after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Restore state from sessionStorage on mount (e.g., after login redirect)
  useEffect(() => {
    if (initialData) return; // Don't restore if we have initial data from server
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!saved) return;

      const data = JSON.parse(saved);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);

      if (data.input) setInput(data.input);
      if (data.category) setCategory(data.category as PromptCategory);
      if (data.enhancedOptions) setEnhancedOptions(data.enhancedOptions);
      if (data.enhancedResult) {
        setEnhancedResult(data.enhancedResult);
        shouldScrollToResult.current = true;
      }
    } catch (e) {
      console.error('Failed to restore prompt-generator draft:', e);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [enhancedOptions, setEnhancedOptions] = useState<
    Record<string, string>
  >(initialData?.enhancedOptions || {});
  const [customEnhancement, setCustomEnhancement] = useState('');
  const [enhancedResult, setEnhancedResult] = useState(
    initialData?.prompt || ''
  );

  // Scroll to enhanced result after it's restored from sessionStorage and rendered
  useEffect(() => {
    if (
      shouldScrollToResult.current &&
      enhancedResult &&
      resultTextareaRef.current
    ) {
      shouldScrollToResult.current = false;
      resultTextareaRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      resultTextareaRef.current.focus();
    }
  }, [enhancedResult]);


  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState<
    'analyzing' | 'generating'
  >('generating');
  const [isCopied, setIsCopied] = useState(false);
  const [isGeneratedTextCopied, setIsGeneratedTextCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAiEditingOpen, setIsAiEditingOpen] = useState(false);
  const [aiEditInstruction, setAiEditInstruction] = useState('');
  const [isAiEditing, setIsAiEditing] = useState(false);
  const [previousResult, setPreviousResult] = useState<string>('');
  const [isAiEditedResult, setIsAiEditedResult] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [generatedText, setGeneratedText] = useState<string>(
    initialData?.generatedContent || ''
  );
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  // 历史生成的文本记录（用于继续对话时保留之前的结果）
  const [generatedTextHistory, setGeneratedTextHistory] = useState<string[]>(
    []
  );
  // 翻译 generatedText 的状态
  const [isTranslatingGeneratedText, setIsTranslatingGeneratedText] =
    useState(false);
  // 存储当前记录的 ID（用于更新而不是创建新记录）
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(
    initialData?.id || null
  );
  // 图像生成模型选择
  // 图片生成设置选项
  const generatedTextRef = useRef<HTMLDivElement>(null);
  // 继续对话状态
  const [isContinueDialogOpen, setIsContinueDialogOpen] = useState(false);
  const [continueInstruction, setContinueInstruction] = useState('');
  const [isContinuing, setIsContinuing] = useState(false);
  const [appliedCombination, setAppliedCombination] = useState<string | null>(
    null
  );
  const [appliedCombinationKey, setAppliedCombinationKey] = useState<
    string | null
  >(null);
  // 推荐组合弹窗状态
  const [isCombinationsDialogOpen, setIsCombinationsDialogOpen] =
    useState(false);
  // AI 灵感生成状态
  const [generatedIdeas, setGeneratedIdeas] = useState<string[]>([]);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const resultTextareaRef = useRef<HTMLTextAreaElement>(null);
  const shouldScrollToResult = useRef(false);


  // Save current state to sessionStorage so it persists across login redirects
  useEffect(() => {
    if (!mounted) return;

    const data: Record<string, unknown> = {};
    if (input) data.input = input;
    if (category !== 'writing') data.category = category;
    if (Object.keys(enhancedOptions).length > 0)
      data.enhancedOptions = enhancedOptions;
    if (enhancedResult) data.enhancedResult = enhancedResult;

    if (Object.keys(data).length > 0) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [
    mounted,
    input,
    category,
    enhancedOptions,
    enhancedResult,
    SESSION_STORAGE_KEY,
  ]);







  const getCategoryLabel = (cat: PromptCategory) => {
    return t(`categories.${cat}` as any);
  };

  const getCategoryOptionLabel = (cat: PromptCategory, key: string) => {
    const optionKey = `categoryOptions.${cat}.${key}`;
    return t(optionKey as any) || key;
  };

  const getOptionValueLabel = (
    cat: PromptCategory,
    optionKey: string,
    value: string
  ) => {
    const translationKey = `optionValues.${cat}.${optionKey}.${value}`;
    const translated = t(translationKey as any);
    // 如果翻译不存在，返回原始值
    return translated !== translationKey ? translated : value;
  };

  // Check login and show dialog if not authenticated
  const requireLogin = (): boolean => {
    if (!isLoggedIn) {
      setLoginDialogMessage('');
      setShowLoginDialog(true);
      return true; // blocked
    }
    return false; // allowed
  };

  // Show login/credit dialog for 402 errors
  const showCreditError = (message: string) => {
    setLoginDialogMessage(message);
    setShowLoginDialog(true);
  };





  // AI 灵感生成 - 根据类别和预设生成10个创意想法
  const handleGenerateIdeas = async () => {
    setIsGeneratingIdeas(true);
    setGeneratedIdeas([]);
    try {
      // Build translated enhancement options for context
      let translatedOptions: Record<string, string> | undefined;
      if (Object.keys(enhancedOptions).length > 0) {
        translatedOptions = {};
        for (const [key, value] of Object.entries(enhancedOptions)) {
          if (value) {
            translatedOptions[getCategoryOptionLabel(category, key)] =
              getOptionValueLabel(category, key, value);
          }
        }
      }

      const response = await fetch('/api/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          category,
          preset: appliedCombination || undefined,
          enhancementOptions: translatedOptions,
          customEnhancement: customEnhancement.trim() || undefined,
          locale,
        }),
      });

      if (!response.ok) {
        if (response.status === 402) {
          const data = await response.json();
          showCreditError(data.error || 'Insufficient credits. Please sign in or upgrade.');
          return;
        }
        throw new Error('Failed to generate ideas');
      }
      notifyCreditsUpdated();

      // Stream ideas one by one
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;
              try {
                const json = JSON.parse(data);
                if (json.idea) {
                  setGeneratedIdeas((prev) => [...prev, json.idea]);
                }
              } catch {
                // ignore parse errors
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating ideas:', error);
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;

    setIsGenerating(true);
    setGenerationStage('analyzing');
    setEnhancedResult('');
    setPreviousResult('');
    setCurrentRecordId(null);

    try {
      // Build translated enhancement options
      let translatedOptions: Record<string, string> | undefined;
      if (Object.keys(enhancedOptions).length > 0) {
        translatedOptions = {};
        for (const [key, value] of Object.entries(enhancedOptions)) {
          if (value) {
            translatedOptions[getCategoryOptionLabel(category, key)] =
              getOptionValueLabel(category, key, value);
          }
        }
      }

      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          category,
          enhancementOptions: translatedOptions,
          customEnhancement: customEnhancement.trim() || undefined,
          locale,
        }),
      });

      if (!response.ok) {
        if (response.status === 402) {
          const data = await response.json();
          showCreditError(data.error || 'Insufficient credits. Please sign in or upgrade.');
          return;
        }
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate prompt');
        } catch (e) {
          if (e instanceof Error) throw e;
          throw new Error('Failed to generate prompt');
        }
      }
      notifyCreditsUpdated();

      const contentType = response.headers.get('content-type');
      const isStreaming =
        contentType?.includes('text/event-stream') || response.body !== null;

      let finalPrompt = '';

      if (isStreaming && response.body) {
        // 所有类别都使用流式输出
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = '';
        let hasReceivedContent = false;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') break;

                try {
                  const json = JSON.parse(data);
                  const content = json.content;
                  if (content) {
                    // 第一次接收到内容时，切换到生成阶段并聚焦结果框
                    if (!hasReceivedContent) {
                      hasReceivedContent = true;
                      setGenerationStage('generating');
                      // 聚焦结果框，让用户看到正在生成
                      setTimeout(() => {
                        if (resultTextareaRef.current) {
                          resultTextareaRef.current.focus();
                          resultTextareaRef.current.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center',
                          });
                        }
                      }, 50);
                    }
                    accumulatedText += content;
                    // 实时更新结果
                    setEnhancedResult(accumulatedText);
                  }
                } catch (e) {
                  // 忽略解析错误
                }
              }
            }
          }

          finalPrompt = extractPromptContent(accumulatedText);
          setEnhancedResult(finalPrompt);

          // 保存生成的提示词到数据库（如果还没有记录）
          // 注意：此时不保存 model/aspectRatio/format，因为用户可能还没选择
          // 这些参数会在生成图片时更新
          if (
            isLoggedIn &&
            !currentRecordId
          ) {
            const saveResult = await saveGeneratedPromptAction({
              inputText: input,
              enhancedOptions:
                Object.keys(enhancedOptions).length > 0
                  ? enhancedOptions
                  : undefined,
              prompt: finalPrompt,
              category: category,
            });
            if (saveResult?.data?.success && saveResult.data.id) {
              setCurrentRecordId(saveResult.data.id);
              console.log('Saved prompt with id:', saveResult.data.id);
            } else {
              console.error(
                'Failed to save prompt:',
                saveResult?.data?.error
              );
            }
          }
        } catch (streamError) {
          console.error('Stream error:', streamError);
          throw streamError;
        }
      } else {
        // 非流式响应（备用方案）
        const data = await response.json();
        // 提取 Prompt 部分的内容
        finalPrompt = extractPromptContent(data.prompt);
        setEnhancedResult(finalPrompt);

        // 保存生成的提示词到数据库（如果还没有记录）
        // 注意：此时不保存 model/aspectRatio/format，因为用户可能还没选择
        // 这些参数会在生成图片时更新
        if (
          !currentRecordId
        ) {
          const saveResult = await saveGeneratedPromptAction({
            inputText: input,
            enhancedOptions:
              Object.keys(enhancedOptions).length > 0
                ? enhancedOptions
                : undefined,
            prompt: finalPrompt,
            category: category,
          });
          if (saveResult?.data?.success && saveResult.data.id) {
            setCurrentRecordId(saveResult.data.id);
            console.log('Saved prompt with id:', saveResult.data.id);
          } else {
            console.error(
              'Failed to save prompt:',
              saveResult?.data?.error
            );
          }
        }
      }

      // Prompt generation is free - no credits to deduct
    } catch (error) {
      console.error('Error generating prompt:', error);
      setEnhancedResult(
        error instanceof Error
          ? `Error: ${error.message}`
          : 'Failed to generate prompt. Please try again.'
      );
    } finally {
      setIsGenerating(false);
      setGenerationStage('generating'); // 重置为默认值
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCopyGeneratedText = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsGeneratedTextCopied(true);
    setTimeout(() => setIsGeneratedTextCopied(false), 2000);
  };

  // 从 enhancedResult 中提取标题作为文件名
  const extractTitleFromEnhancedPrompt = useCallback((): string => {
    if (!enhancedResult.trim()) return 'generated-content';

    const lines = enhancedResult.split('\n').filter((line) => line.trim());

    // 首先查找包含 "主题" 或 "Topic" 的行，提取主题内容
    for (const line of lines) {
      // 匹配格式：**主题**: xxx 或 **Topic**: xxx
      const topicMatch = line.match(/\*\*(?:主题|Topic)\*\*\s*[:：]\s*(.+)/i);
      if (topicMatch && topicMatch[1]) {
        const title = topicMatch[1].trim();
        if (title) {
          return title
            .replace(/\*\*/g, '') // 移除Markdown加粗符号
            .replace(/[<>:"/\\|?*]/g, '') // 移除Windows不允许的字符
            .replace(/\s+/g, '-') // 空格替换为短横线
            .substring(0, 60);
        }
      }
    }

    // 查找 Markdown 标题（#、##、### 开头）
    for (const line of lines) {
      if (line.match(/^#{1,3}\s+/)) {
        let title = line.replace(/^#+\s*/, '').trim();

        // 移除常见的 Prompt 前缀（例如 "Research Prompt:", "Image Prompt:", "Code Prompt:" 等）
        title = title
          .replace(
            /^(Research|Image|Video|Code|Writing|Marketing|General|Deep Research)\s*Prompt\s*[:：]\s*/i,
            ''
          )
          .trim();
        // 移除中文前缀（例如 "写作任务提示:", "研究提示:" 等）
        title = title
          .replace(
            /^(写作任务|研究|图像|视频|代码|营销|通用)?\s*提示\s*[:：]\s*/i,
            ''
          )
          .trim();

        // 如果还有冒号，取冒号后面的部分
        if (title.includes(':') || title.includes('：')) {
          title = title.split(/[:：]/).slice(1).join(':').trim();
        }

        // 移除Markdown加粗符号
        title = title.replace(/\*\*/g, '').trim();

        if (title) {
          // 清理标题，移除不合法的文件名字符
          return title
            .replace(/[<>:"/\\|?*]/g, '') // 移除Windows不允许的字符
            .replace(/\s+/g, '-') // 空格替换为短横线
            .substring(0, 60); // 限制长度
        }
      }
    }

    // 如果没有标题，尝试用第一个非空行的前50个字符
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      if (firstLine) {
        return (
          firstLine
            .replace(/^[#*\->\d.]+\s*/, '')
            .replace(/\*\*/g, '')
            .replace(/[<>:"/\\|?*]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 60) || 'generated-content'
        );
      }
    }

    return 'generated-content';
  }, [enhancedResult]);

  // Download functions for generated text
  const handleDownloadMD = useCallback(
    async (text: string) => {
      const { saveAs } = await import('file-saver');
      const filename = extractTitleFromEnhancedPrompt();
      const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
      saveAs(blob, `${filename}.md`);
    },
    [extractTitleFromEnhancedPrompt]
  );

  const handleDownloadDOCX = useCallback(
    async (text: string) => {
      const { Document, HeadingLevel, Packer, Paragraph, TextRun } =
        await import('docx');
      const { saveAs } = await import('file-saver');
      const lines = text.split('\n');
      const paragraphs: ParagraphType[] = [];

      // Helper function to parse inline formatting
      const parseInlineFormatting = (text: string): TextRunType[] => {
        const children: TextRunType[] = [];
        const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = regex.exec(text)) !== null) {
          if (match.index > lastIndex) {
            children.push(
              new TextRun({
                text: text.substring(lastIndex, match.index),
                size: 24,
              })
            );
          }

          const matchedText = match[0];
          if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
            children.push(
              new TextRun({
                text: matchedText.slice(2, -2),
                bold: true,
                size: 24,
              })
            );
          } else if (matchedText.startsWith('*') && matchedText.endsWith('*')) {
            children.push(
              new TextRun({
                text: matchedText.slice(1, -1),
                italics: true,
                size: 24,
              })
            );
          } else if (matchedText.startsWith('`') && matchedText.endsWith('`')) {
            children.push(
              new TextRun({
                text: matchedText.slice(1, -1),
                font: 'Courier New',
                size: 22,
                shading: { fill: 'F0F0F0' },
              })
            );
          }
          lastIndex = match.index + matchedText.length;
        }

        if (lastIndex < text.length) {
          children.push(
            new TextRun({
              text: text.substring(lastIndex),
              size: 24,
            })
          );
        }

        return children.length > 0
          ? children
          : [new TextRun({ text, size: 24 })];
      };

      for (const line of lines) {
        if (line.startsWith('# ')) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line.replace('# ', ''),
                  bold: true,
                  size: 48,
                  color: '1E1E1E',
                }),
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
              border: {
                bottom: { style: 'single' as const, size: 6, color: 'CCCCCC' },
              },
            })
          );
        } else if (line.startsWith('## ')) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line.replace('## ', ''),
                  bold: true,
                  size: 36,
                  color: '2E2E2E',
                }),
              ],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 320, after: 160 },
            })
          );
        } else if (line.startsWith('### ')) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line.replace('### ', ''),
                  bold: true,
                  size: 30,
                  color: '3E3E3E',
                }),
              ],
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 240, after: 120 },
            })
          );
        } else if (line.startsWith('#### ')) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line.replace('#### ', ''),
                  bold: true,
                  size: 26,
                }),
              ],
              heading: HeadingLevel.HEADING_4,
              spacing: { before: 200, after: 100 },
            })
          );
        } else if (line.startsWith('> ')) {
          // Blockquote
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line.replace('> ', ''),
                  italics: true,
                  color: '666666',
                  size: 24,
                }),
              ],
              indent: { left: 720 },
              border: {
                left: { style: 'single' as const, size: 24, color: 'CCCCCC' },
              },
              shading: { fill: 'F8F8F8' },
              spacing: { before: 120, after: 120 },
            })
          );
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
          paragraphs.push(
            new Paragraph({
              children: parseInlineFormatting(line.substring(2)),
              bullet: { level: 0 },
              spacing: { before: 60, after: 60 },
            })
          );
        } else if (line.match(/^\d+\. /)) {
          const content = line.replace(/^\d+\. /, '');
          paragraphs.push(
            new Paragraph({
              children: parseInlineFormatting(content),
              numbering: { reference: 'default-numbering', level: 0 },
              spacing: { before: 60, after: 60 },
            })
          );
        } else if (line.startsWith('---') || line.startsWith('***')) {
          // Horizontal rule
          paragraphs.push(
            new Paragraph({
              border: {
                bottom: { style: 'single' as const, size: 6, color: 'DDDDDD' },
              },
              spacing: { before: 200, after: 200 },
            })
          );
        } else if (line.trim() === '') {
          paragraphs.push(
            new Paragraph({
              text: '',
              spacing: { before: 100, after: 100 },
            })
          );
        } else {
          // Regular paragraph
          paragraphs.push(
            new Paragraph({
              children: parseInlineFormatting(line),
              spacing: { before: 80, after: 80, line: 360 },
            })
          );
        }
      }

      const doc = new Document({
        numbering: {
          config: [
            {
              reference: 'default-numbering',
              levels: [
                {
                  level: 0,
                  format: 'decimal',
                  text: '%1.',
                  alignment: 'start' as const,
                  style: {
                    paragraph: {
                      indent: { left: 720, hanging: 360 },
                    },
                  },
                },
              ],
            },
          ],
        },
        styles: {
          default: {
            document: {
              run: {
                font: 'Arial',
                size: 24,
              },
              paragraph: {
                spacing: { line: 360 },
              },
            },
          },
        },
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 1440,
                  right: 1440,
                  bottom: 1440,
                  left: 1440,
                },
              },
            },
            children: paragraphs,
          },
        ],
      });

      const filename = extractTitleFromEnhancedPrompt();
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${filename}.docx`);
    },
    [extractTitleFromEnhancedPrompt]
  );

  // 继续对话处理函数
  const handleContinueConversation = async () => {
    if (!continueInstruction.trim() || !generatedText) {
      return;
    }

    setIsContinuing(true);
    setIsContinueDialogOpen(false);

    // 将当前的 generatedText 保存到历史记录中
    const previousText = generatedText;
    setGeneratedTextHistory((prev) => [...prev, previousText]);
    // 清空当前文本，准备显示新内容
    setGeneratedText('');

    try {
      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: continueInstruction,
          category: 'general',
          previousContext: previousText,
          isContinueConversation: true,
        }),
      });

      if (!response.ok) {
        if (response.status === 402) {
          const data = await response.json();
          showCreditError(data.error || 'Insufficient credits.');
          return;
        }
        throw new Error('Continue conversation failed');
      }
      notifyCreditsUpdated();

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let result = '';
      setIsGeneratingText(true);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                result += parsed.text;
                // 新内容显示在新的结果框中
                setGeneratedText(result);
              }
            } catch {
              // ignore parsing errors
            }
          }
        }
      }

      setContinueInstruction('');
    } catch (error) {
      console.error('Continue conversation error:', error);
      alert(
        t('continueConversation.error', {
          defaultValue: 'Failed to continue conversation. Please try again.',
        })
      );
      // 恢复之前的文本，从历史记录中移除
      setGeneratedTextHistory((prev) => prev.slice(0, -1));
      setGeneratedText(previousText);
    } finally {
      setIsContinuing(false);
      setIsGeneratingText(false);
    }
  };

  const handleRevertToPrevious = () => {
    if (previousResult) {
      setEnhancedResult(previousResult);
      setIsAiEditedResult(false);
      setPreviousResult('');
    }
  };

  const handleTranslate = async (targetLanguage: string) => {
    if (!enhancedResult.trim()) {
      return;
    }

    setIsTranslating(true);
    const originalPrompt = enhancedResult;

    try {
      console.log('Translation request:', {
        originalPromptPreview: originalPrompt.substring(0, 100),
        targetLanguage,
      });

      const response = await fetch('/api/translate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: originalPrompt,
          targetLanguage,
        }),
      });

      if (!response.ok) {
        if (response.status === 402) {
          const data = await response.json();
          showCreditError(data.error || 'Insufficient credits.');
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to translate prompt');
      }
      notifyCreditsUpdated();

      // 流式读取翻译结果
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let translatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            translatedText += data;
            setEnhancedResult(translatedText);
          }
        }
      }

      if (!translatedText) {
        throw new Error('No translation received');
      }
    } catch (error) {
      console.error('Translation error:', error);
      alert(
        error instanceof Error
          ? `Translation error: ${error.message}`
          : 'Failed to translate prompt. Please try again.'
      );
    } finally {
      setIsTranslating(false);
    }
  };

  // 翻译语言选项（与 OUTPUT_LANGUAGE_OPTIONS 保持一致）
  const translateLanguages = [
    { value: 'English', label: 'English' },
    { value: 'Japanese', label: '日本語' },
    { value: 'Korean', label: '한국어' },
    { value: 'Chinese (Simplified)', label: '简体中文' },
    { value: 'Chinese (Traditional)', label: '繁體中文' },
    { value: 'French', label: 'Français' },
    { value: 'German', label: 'Deutsch' },
    { value: 'Italian', label: 'Italiano' },
    { value: 'Spanish', label: 'Español' },
    { value: 'Portuguese', label: 'Português' },
    { value: 'Russian', label: 'Русский' },
    { value: 'Arabic', label: 'العربية' },
  ];

  // 翻译 generatedText 的处理函数
  const handleTranslateGeneratedText = async (targetLanguage: string) => {
    if (!generatedText.trim()) {
      return;
    }

    setIsTranslatingGeneratedText(true);
    const originalText = generatedText;

    try {
      const response = await fetch('/api/translate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: originalText,
          targetLanguage,
        }),
      });

      if (!response.ok) {
        if (response.status === 402) {
          const data = await response.json();
          showCreditError(data.error || 'Insufficient credits.');
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to translate text');
      }
      notifyCreditsUpdated();

      // 流式读取翻译结果
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let translatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            translatedText += data;
            setGeneratedText(translatedText);
          }
        }
      }

      if (!translatedText) {
        throw new Error('No translation received');
      }
    } catch (error) {
      console.error('Translation error:', error);
      alert(
        error instanceof Error
          ? `Translation error: ${error.message}`
          : 'Failed to translate text. Please try again.'
      );
    } finally {
      setIsTranslatingGeneratedText(false);
    }
  };

  const handleGenerateText = async () => {
    if (!enhancedResult.trim()) return;

    setIsGeneratingText(true);
    // Save current text to history before generating new text
    if (generatedText.trim()) {
      setGeneratedTextHistory((prev) => [...prev, generatedText]);
    }
    setGeneratedText('');

    try {
      const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: enhancedResult,
          category: 'writing',
          locale,
          previousTexts:
            generatedTextHistory.length > 0 || generatedText.trim()
              ? [...generatedTextHistory, generatedText].filter(Boolean)
              : undefined,
          continueInstruction: continueInstruction.trim() || undefined,
        }),
      });

      if (!response.ok) {
        if (response.status === 402) {
          const data = await response.json();
          showCreditError(data.error || 'Insufficient credits.');
          return;
        }
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate text');
        } catch (e) {
          if (e instanceof Error) throw e;
          throw new Error('Failed to generate text');
        }
      }
      notifyCreditsUpdated();

      // Stream the text response
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;
              try {
                const json = JSON.parse(data);
                const content = json.content || json.choices?.[0]?.delta?.content;
                if (content) {
                  accumulatedText += content;
                  setGeneratedText(accumulatedText);
                }
              } catch {
                // ignore parse errors
              }
            }
          }
        }

        // Save to database
        if (isLoggedIn && currentRecordId) {
          try {
            const { updateGeneratedImageAction } = await import(
              '@/actions/update-generated-image'
            );
            await updateGeneratedImageAction({
              id: currentRecordId,
              generatedContent: accumulatedText,
            });
          } catch (saveError) {
            console.error('Error saving generated text:', saveError);
          }
        }
      }

      invalidateCredits();
    } catch (error) {
      console.error('Error generating text:', error);
      setGeneratedText(
        error instanceof Error
          ? `Error: ${error.message}`
          : 'Failed to generate text. Please try again.'
      );
    } finally {
      setIsGeneratingText(false);
      setContinueInstruction('');
      setIsContinueDialogOpen(false);
    }
  };;

  // Helper to save generated video URL to database

  // 视频生成处理函数

  const handleAiEdit = async () => {
    if (!enhancedResult.trim() || !aiEditInstruction.trim()) {
      return;
    }

    setIsAiEditing(true);
    const originalPrompt = enhancedResult;
    const instruction = aiEditInstruction;

    // 保存当前结果作为之前的版本
    setPreviousResult(originalPrompt);

    // 立即关闭对话框并清空指令
    setIsAiEditingOpen(false);
    setAiEditInstruction('');

    // 清空结果框内容并设置生成状态
    setEnhancedResult('');
    setIsGenerating(true);
    setGenerationStage('analyzing');

    // 聚焦到结果输出框
    setTimeout(() => {
      if (resultTextareaRef.current) {
        resultTextareaRef.current.focus();
        resultTextareaRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }, 100);

    try {
      const editInput = `${originalPrompt}\n\nPlease modify the above prompt according to the following instruction: ${instruction}`;

      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: editInput,
          category: 'writing',
          locale,
        }),
      });

      if (!response.ok) {
        if (response.status === 402) {
          const data = await response.json();
          showCreditError(data.error || 'Insufficient credits.');
          return;
        }
        throw new Error('Failed to edit prompt');
      }
      notifyCreditsUpdated();

      const contentType = response.headers.get('content-type');
      const isStreaming = contentType?.includes('text/event-stream');

      if (isStreaming && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = '';
        let hasReceivedContent = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;

              try {
                const json = JSON.parse(data);
                const content = json.content;
                if (content) {
                  // 第一次接收到内容时，切换到生成阶段
                  if (!hasReceivedContent) {
                    hasReceivedContent = true;
                    setGenerationStage('generating');
                    setIsAiEditedResult(true); // 标记这是 AI Edit 的结果
                  }
                  accumulatedText += content;
                  setEnhancedResult(accumulatedText);
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
      } else {
        const data = await response.json();
        setGenerationStage('generating');
        setIsAiEditedResult(true); // 标记这是 AI Edit 的结果
        setEnhancedResult(data.prompt || data);
      }
    } catch (error) {
      console.error('Error editing prompt:', error);
      alert(
        t('aiEdit.error', {
          defaultValue: 'Failed to edit prompt. Please try again.',
        })
      );
    } finally {
      setIsAiEditing(false);
      setIsGenerating(false);
      setGenerationStage('generating'); // 重置为默认值
    }
  };

  const handleOptionChange = (key: string, value: string) => {
    setEnhancedOptions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const applyCombination = (
    comboKey: string,
    comboName: string,
    options: Record<string, string>
  ) => {
    // Check if preset has custom option overrides
    const override = presetOptionOverrides[category]?.[comboKey];
    if (override) {
      // Use preset-specific defaults instead of the combo options
      setEnhancedOptions(override.defaults);
    } else {
      setEnhancedOptions(options);
    }
    setAppliedCombination(comboName);
    setAppliedCombinationKey(comboKey);
  };

  // 提取 Prompt 部分的内容（去除头尾说明）
  const extractPromptContent = (fullText: string): string => {
    // 方法1: 查找 **Prompt** 标记后的内容，直到下一个 ** 或 --- 或文件结尾
    const promptMatch1 = fullText.match(
      /\*\*Prompt\*\*\s*\n?\s*([\s\S]*?)(?=\n\s*\*\*[^*]|\n\s*---|$)/
    );
    if (promptMatch1 && promptMatch1[1]) {
      let content = promptMatch1[1].trim();
      // 移除可能的引号
      if (
        (content.startsWith('"') && content.endsWith('"')) ||
        (content.startsWith("'") && content.endsWith("'"))
      ) {
        content = content.slice(1, -1).trim();
      }
      return content;
    }

    // 方法2: 查找 "---" 分隔符之间的 **Prompt** 内容
    const separatorMatch = fullText.match(
      /---\s*\n\s*\*\*Prompt\*\*\s*\n\s*([\s\S]*?)\s*\n\s*---/
    );
    if (separatorMatch && separatorMatch[1]) {
      let content = separatorMatch[1].trim();
      // 移除可能的引号
      if (
        (content.startsWith('"') && content.endsWith('"')) ||
        (content.startsWith("'") && content.endsWith("'"))
      ) {
        content = content.slice(1, -1).trim();
      }
      return content;
    }

    // 方法3: 如果都不匹配，返回原始文本（可能是简单格式）
    return fullText.trim();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="space-y-6">
        {/* Header */}
        {!hideHeader && (
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{t('title')}</h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">{t('subtitle')}</p>
          </div>
        )}


        {/* Enhanced Options Section - 图片转prompt、视频转prompt和描述图片不需要enhancement options */}
        {category &&
          categoryOptionKeys[category].length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('enhancedOptions.title')}</CardTitle>
                <CardDescription>
                  {t('enhancedOptions.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* 类别选择 + 预设选择 - 同一行 */}
                <div className="flex flex-col sm:flex-row sm:items-end gap-4">

                </div>

                {/* Inline Presets */}
                <div className="space-y-3">
                  <Label className="inline-flex items-center gap-1.5 shrink-0 text-muted-foreground">
                    <Sparkles className="size-3.5 text-amber-500" />
                    {t('enhancedOptions.recommendedCombinations', {
                      defaultValue: 'Recommended Presets',
                    })}
                  </Label>
                  <Tabs defaultValue="creative" className="w-full">
                    <TabsList className="w-full h-10">
                      <TabsTrigger value="creative" className="flex-1 text-sm">
                        {t('enhancedOptions.creativeWritingPresets', {
                          defaultValue: 'Creative Writing',
                        })}
                      </TabsTrigger>
                      <TabsTrigger value="business" className="flex-1 text-sm">
                        {t('enhancedOptions.businessWritingPresets', {
                          defaultValue: 'Business Writing',
                        })}
                      </TabsTrigger>
                    </TabsList>
                    {(['creative', 'business'] as const).map((tab) => (
                      <TabsContent key={tab} value={tab} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-3">
                        {Object.entries(
                          (messages as any)?.HomePage?.promptGenerator
                            ?.enhancedOptions?.combinations?.[category] || {}
                        )
                          .filter(([key]) =>
                            tab === 'creative'
                              ? ['c1', 'c2', 'c3', 'c4', 'c5'].includes(key)
                              : ['c6', 'c7', 'c8', 'c9', 'c10'].includes(key)
                          )
                          .map(([key, combo]: [string, any]) => {
                            const isSelected = appliedCombination === combo.name;
                            const iconMap: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
                              c1: { icon: Sword, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
                              c2: { icon: Rocket, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                              c3: { icon: Shield, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                              c4: { icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' },
                              c5: { icon: Skull, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-500/10' },
                              c6: { icon: Briefcase, color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-500/10' },
                              c7: { icon: GraduationCap, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
                              c8: { icon: FileText, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10' },
                              c9: { icon: Megaphone, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
                              c10: { icon: Share2, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-500/10' },
                            };
                            const entry = iconMap[key];
                            const Icon = entry?.icon || Sparkles;
                            const iconColor = entry?.color || 'text-muted-foreground';
                            const iconBg = entry?.bg || 'bg-muted/30';

                            return (
                              <div
                                key={key}
                                className={`relative rounded-xl border p-3 transition-all duration-200 cursor-pointer group ${
                                  isSelected
                                    ? 'bg-primary/5 border-primary/40 shadow-sm'
                                    : 'bg-card hover:bg-accent/50 hover:border-border hover:shadow-sm'
                                }`}
                                onClick={() => {
                                  if (isSelected) {
                                    setAppliedCombination(null);
                                    setAppliedCombinationKey(null);
                                    setEnhancedOptions({});
                                  } else {
                                    applyCombination(key, combo.name, combo.options);
                                  }
                                }}
                              >
                                <div className="flex flex-col items-center gap-2 text-center">
                                  <div className={`size-9 rounded-lg ${iconBg} flex items-center justify-center transition-transform duration-200 group-hover:scale-105`}>
                                    <Icon className={`size-4.5 ${iconColor}`} />
                                  </div>
                                  <span className="text-xs font-medium leading-tight line-clamp-2">
                                    {combo.name}
                                  </span>
                                  {isSelected && (
                                    <div className="absolute top-1.5 right-1.5">
                                      <Check className="size-3.5 text-primary" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>

                {/* Options Grid */}
                <div className="flex flex-wrap gap-x-4 gap-y-2.5">
                  {(() => {
                    const override = appliedCombinationKey
                      ? presetOptionOverrides[category]?.[appliedCombinationKey]
                      : null;
                    const optionKeys = override
                      ? override.keys
                      : categoryOptionKeys[category];
                    return optionKeys;
                  })().map((option) => {
                    const override = appliedCombinationKey
                      ? presetOptionOverrides[category]?.[appliedCombinationKey]
                      : null;
                    const optionLabel = getCategoryOptionLabel(
                      category,
                      option
                    );
                    const optionValues = override
                      ? override.values[option] || []
                      : categoryOptionValues[category]?.[option] || [];

                    return (
                      <div key={option} className="flex items-center gap-2">
                        <Label className="text-xs font-medium text-muted-foreground whitespace-nowrap">{optionLabel}</Label>
                        <Select
                          value={enhancedOptions[option] || undefined}
                          onValueChange={(value) => {
                            if (value === '__none__') {
                              handleOptionChange(option, '');
                            } else {
                              handleOptionChange(option, value);
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 text-sm w-auto min-w-[120px]">
                            <SelectValue
                              placeholder={t('enhancedOptions.selectPlaceholder', {
                                defaultValue: 'Select...',
                              })}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">
                              {t('enhancedOptions.none', {
                                defaultValue: 'None',
                              })}
                            </SelectItem>
                            {optionValues.map((value) => (
                              <SelectItem key={value} value={value}>
                                {getOptionValueLabel(category, option, value)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>

                {/* Divider */}
                <div className="border-t pt-4 space-y-4">
                  {/* Input */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="prompt-input" className="text-sm font-medium">
                        {t('inputSection.inputLabel')}
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleGenerateIdeas}
                        disabled={isGeneratingIdeas}
                        className="h-6 px-2 text-xs rounded-full text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10 transition-colors duration-200"
                      >
                        {isGeneratingIdeas ? (
                          <Loader2 className="mr-1 size-3 animate-spin" />
                        ) : (
                          <Lightbulb className="mr-1 size-3" />
                        )}
                        {(t as any)('enhancedOptions.generateIdeas', {
                          defaultValue: 'AI Inspire',
                        })}
                      </Button>
                    </div>
                    <div className="relative">
                      <Input
                        id="prompt-input"
                        placeholder={
                          t(`inputSection.placeholders.${category}` as any) ||
                          t('inputSection.inputPlaceholder')
                        }
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleGenerate();
                          }
                        }}
                        className="h-11 text-sm pr-4"
                      />
                    </div>
                    {/* AI Generated Ideas */}
                    {generatedIdeas.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5 animate-in fade-in-0 duration-300">
                        {generatedIdeas.map((idea, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setInput(idea);
                              setGeneratedIdeas([]);
                            }}
                            className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/80 transition-all duration-200 hover:shadow-sm cursor-pointer dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30 dark:hover:bg-amber-500/20 animate-in slide-in-from-bottom-1 fade-in-0 duration-300"
                            style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                          >
                            {idea}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Custom Enhancement Input */}
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      {t('enhancedOptions.customLabel', {
                        defaultValue: 'Additional Custom Requirements',
                      })}
                      <span className="text-xs font-normal text-muted-foreground">
                        (Optional)
                      </span>
                    </Label>
                    <Textarea
                      placeholder={t('enhancedOptions.customPlaceholder', {
                        defaultValue:
                          'Enter any additional requirements or details you want to include in the enhanced prompt...',
                      })}
                      value={customEnhancement}
                      onChange={(e) => setCustomEnhancement(e.target.value)}
                      className="min-h-[72px] text-sm resize-none"
                    />
                  </div>
                </div>

                {/* Generate Button */}
                <div className="flex gap-3 items-center">
                  <Button
                    onClick={handleGenerate}
                    disabled={
                      !input.trim() || isGenerating || isAiEditing
                    }
                    className="flex-1 sm:flex-none h-10 px-6 text-sm font-medium transition-all duration-200"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        {t('inputSection.generating')}
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 size-4" />
                        {t('inputSection.generateButton')}
                      </>
                    )}
                  </Button>
                </div>

            </CardContent>
          </Card>
        )}



        {/* Result Section */}
        {(enhancedResult || isGenerating) && (
          <Card className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{t('enhancedResult.title')}</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {t('enhancedResult.description')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                {isEditing ? (
                  <Textarea
                    ref={resultTextareaRef}
                    value={enhancedResult}
                    onChange={(e) => setEnhancedResult(e.target.value)}
                    className="min-h-[140px] text-sm leading-relaxed transition-all duration-200 ring-2 ring-primary bg-primary/5"
                  />
                ) : (
                  <div
                    className={`min-h-[140px] p-3 border rounded-md text-sm leading-relaxed transition-all duration-200 overflow-y-auto max-h-[500px] ${isGenerating && enhancedResult ? 'ring-1 ring-primary/30' : ''}`}
                  >
                    <div className="max-w-none prose prose-sm dark:prose-invert">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-xl font-bold text-foreground mb-3 mt-4 first:mt-0 pb-1 border-b">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-lg font-bold text-foreground mb-2 mt-4 first:mt-0">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-base font-semibold text-foreground mb-2 mt-3">
                              {children}
                            </h3>
                          ),
                          p: ({ children }) => (
                            <p className="text-foreground leading-6 mb-3 text-sm">
                              {children}
                            </p>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc list-outside ml-5 mb-3 space-y-1 text-foreground text-sm">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal list-outside ml-5 mb-3 space-y-1 text-foreground text-sm">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="leading-6">{children}</li>
                          ),
                          code: ({ className, children, ...props }) => {
                            const isInline = !className;
                            if (isInline) {
                              return (
                                <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono text-primary">
                                  {children}
                                </code>
                              );
                            }
                            return (
                              <code
                                className={`block bg-muted p-3 rounded-lg text-xs font-mono overflow-x-auto my-3 ${className}`}
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          },
                          strong: ({ children }) => (
                            <strong className="font-semibold text-foreground">{children}</strong>
                          ),
                          em: ({ children }) => (
                            <em className="italic text-foreground">{children}</em>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-2 border-primary/30 pl-4 my-3 text-muted-foreground italic">
                              {children}
                            </blockquote>
                          ),
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              className="text-primary hover:underline"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {enhancedResult}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
                {isGenerating && !enhancedResult && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-background/80 backdrop-blur-[1px] rounded-md p-4">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="size-6 text-primary animate-spin" />
                      <span className="text-sm font-medium text-muted-foreground">
                        {isAiEditing
                          ? t('aiEdit.editing', { defaultValue: 'AI Editing...' })
                          : generationStage === 'analyzing'
                            ? t('inputSection.analyzing', { defaultValue: 'Analyzing...' })
                            : t('inputSection.generating', { defaultValue: 'Generating...' })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                {/* Translate */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!enhancedResult.trim() || isGenerating || isTranslating}
                      className={`h-8 px-2.5 text-xs ${
                        isTranslating ? 'text-blue-600 bg-blue-50 dark:bg-blue-500/10' : ''
                      }`}
                    >
                      {isTranslating ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <>
                          <Globe className="size-3.5" />
                          <span className="ml-1.5 hidden sm:inline">
                            {t('enhancedResult.translate', { defaultValue: 'Translate' })}
                          </span>
                          <ChevronDown className="size-3 ml-0.5" />
                        </>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    {translateLanguages.map((lang) => (
                      <DropdownMenuItem
                        key={lang.value}
                        onClick={() => handleTranslate(lang.value)}
                        className="cursor-pointer text-sm"
                      >
                        {lang.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* AI Edit */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAiEditingOpen(true)}
                  disabled={!enhancedResult.trim() || isGenerating || isAiEditing}
                  className={`h-8 px-2.5 text-xs ${
                    isAiEditing ? 'text-violet-600 bg-violet-50 dark:bg-violet-500/10' : ''
                  }`}
                >
                  {isAiEditing ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="size-3.5" />
                      <span className="ml-1.5 hidden sm:inline">
                        {t('aiEdit.button', { defaultValue: 'AI Edit' })}
                      </span>
                    </>
                  )}
                </Button>

                {/* Edit */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className={`h-8 px-2.5 text-xs ${isEditing ? 'text-primary bg-primary/5' : ''}`}
                >
                  <Edit2 className="size-3.5" />
                  <span className="ml-1.5 hidden sm:inline">
                    {isEditing
                      ? t('imageSettings.editing', { defaultValue: 'Editing' })
                      : t('imageSettings.edit', { defaultValue: 'Edit' })}
                  </span>
                </Button>

                {/* Copy */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2.5 text-xs"
                  onClick={() => handleCopy(enhancedResult)}
                >
                  {isCopied ? (
                    <>
                      <Check className="size-3.5 text-green-600" />
                      <span className="ml-1.5 text-green-600 hidden sm:inline">
                        {t('imageSettings.copied', { defaultValue: 'Copied' })}
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span className="ml-1.5 hidden sm:inline">
                        {t('imageSettings.copy', { defaultValue: 'Copy' })}
                      </span>
                    </>
                  )}
                </Button>

                <div className="w-px h-5 bg-border mx-0.5 hidden sm:block" />

                {/* Generate Content */}
                <Button
                  size="sm"
                  onClick={handleGenerateText}
                  disabled={
                    !enhancedResult.trim() || isGenerating || isAiEditing || isGeneratingText
                  }
                  className="h-8 px-3 text-xs font-medium transition-all duration-200"
                >
                  {isGeneratingText ? (
                    <>
                      <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                      {t('generateText.generating', { defaultValue: 'Generating...' })}
                    </>
                  ) : (
                    <>
                      <Wand2 className="size-3.5 mr-1.5" />
                      {t('generateText.buttonContent', { defaultValue: 'Generate Content' })}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generated Text History Section */}
        {generatedTextHistory.length > 0 &&
          generatedTextHistory.map((historyText, index) => (
            <Card key={`history-${index}`} className="opacity-60 border-dashed hover:opacity-80 transition-opacity duration-200">
              <CardHeader className="pb-2 py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-muted-foreground">
                    {t('generateText.historyTitle', {
                      defaultValue: 'Previous Result',
                    })}{' '}
                    #{index + 1}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => handleCopyGeneratedText(historyText)}
                  >
                    <Copy className="size-3 mr-1" />
                    {t('generateText.copy', { defaultValue: 'Copy' })}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="max-h-[250px] overflow-y-auto p-4 border rounded-lg bg-muted/20">
                  <div className="max-w-none prose prose-sm dark:prose-invert">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => (
                          <h1 className="text-xl font-bold text-foreground mb-3 mt-4 first:mt-0 pb-1 border-b">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-lg font-bold text-foreground mb-2 mt-4 first:mt-0">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-base font-semibold text-foreground mb-2 mt-3">
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p className="text-foreground leading-6 mb-3 text-sm">
                            {children}
                          </p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-outside ml-5 mb-3 space-y-1 text-foreground text-sm">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-outside ml-5 mb-3 space-y-1 text-foreground text-sm">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="leading-6">{children}</li>
                        ),
                        code: ({ className, children, ...props }) => {
                          const isInline = !className;
                          if (isInline) {
                            return (
                              <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono text-primary">
                                {children}
                              </code>
                            );
                          }
                          return (
                            <code
                              className={`block bg-muted p-3 rounded-lg text-xs font-mono overflow-x-auto my-3 ${className}`}
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            className="text-primary hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {historyText}
                    </ReactMarkdown>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

        {/* Generated Text Result Section */}
        {(generatedText || isGeneratingText || isContinuing) && (
            <Card
              className={`animate-in fade-in-0 slide-in-from-bottom-2 duration-300 ${
                generatedTextHistory.length > 0 ? 'ring-1 ring-primary/20' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">
                        {t('generateText.title', {
                          defaultValue: 'Generated Content',
                        })}
                      </CardTitle>
                      {generatedTextHistory.length > 0 && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {t('generateText.latest', { defaultValue: 'Latest' })}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-xs mt-0.5">
                      {t('generateText.description', {
                        defaultValue:
                          'Content generated based on the prompt above',
                      })}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <div
                    ref={generatedTextRef}
                    className={`min-h-[140px] max-h-[600px] overflow-y-auto p-5 border rounded-lg bg-background transition-all duration-200 ${isGeneratingText ? 'ring-1 ring-primary/30' : ''}`}
                  >
                    {generatedText ? (
                      <div className="max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ children }) => (
                              <h1 className="text-2xl font-bold text-foreground mb-4 mt-6 first:mt-0 pb-2 border-b">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-xl font-bold text-foreground mb-3 mt-6 first:mt-0">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-lg font-semibold text-foreground mb-2 mt-4">
                                {children}
                              </h3>
                            ),
                            h4: ({ children }) => (
                              <h4 className="text-base font-semibold text-foreground mb-2 mt-3">
                                {children}
                              </h4>
                            ),
                            p: ({ children }) => (
                              <p className="text-foreground leading-7 mb-4">
                                {children}
                              </p>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc list-outside ml-6 mb-4 space-y-2 text-foreground">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal list-outside ml-6 mb-4 space-y-2 text-foreground">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="leading-7">{children}</li>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-primary/50 pl-4 py-1 my-4 bg-muted/30 rounded-r italic text-muted-foreground">
                                {children}
                              </blockquote>
                            ),
                            code: ({ className, children, ...props }) => {
                              const isInline = !className;
                              if (isInline) {
                                return (
                                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary">
                                    {children}
                                  </code>
                                );
                              }
                              return (
                                <code
                                  className={`block bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto my-4 ${className}`}
                                  {...props}
                                >
                                  {children}
                                </code>
                              );
                            },
                            pre: ({ children }) => (
                              <pre className="bg-muted rounded-lg overflow-hidden my-4">
                                {children}
                              </pre>
                            ),
                            table: ({ children }) => (
                              <div className="overflow-x-auto my-4">
                                <table className="min-w-full border-collapse border border-border rounded-lg overflow-hidden">
                                  {children}
                                </table>
                              </div>
                            ),
                            thead: ({ children }) => (
                              <thead className="bg-muted/50">{children}</thead>
                            ),
                            tbody: ({ children }) => (
                              <tbody className="divide-y divide-border">
                                {children}
                              </tbody>
                            ),
                            tr: ({ children }) => (
                              <tr className="hover:bg-muted/30 transition-colors">
                                {children}
                              </tr>
                            ),
                            th: ({ children }) => (
                              <th className="px-4 py-3 text-left font-semibold text-foreground border-b border-border">
                                {children}
                              </th>
                            ),
                            td: ({ children }) => (
                              <td className="px-4 py-3 text-foreground border-b border-border/50">
                                {children}
                              </td>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold text-foreground">
                                {children}
                              </strong>
                            ),
                            em: ({ children }) => (
                              <em className="italic">{children}</em>
                            ),
                            hr: () => <hr className="my-6 border-border" />,
                            a: ({ href, children }) => (
                              <a
                                href={href}
                                className="text-primary hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {generatedText}
                        </ReactMarkdown>
                      </div>
                    ) : null}
                  </div>
                  {(isGeneratingText || isContinuing) && !generatedText && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-background/80 backdrop-blur-[1px] rounded-md">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="size-6 text-primary animate-spin" />
                        <span className="text-sm font-medium text-muted-foreground">
                          {t('generateText.generating', {
                            defaultValue: 'Generating...',
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  {/* 翻译按钮 */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={
                          !generatedText.trim() ||
                          isGeneratingText ||
                          isTranslatingGeneratedText
                        }
                        className={`h-8 px-2.5 text-xs ${
                          isTranslatingGeneratedText
                            ? 'text-blue-600 bg-blue-50 dark:bg-blue-500/10'
                            : ''
                        }`}
                      >
                        {isTranslatingGeneratedText ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <>
                            <Globe className="size-3.5" />
                            <span className="ml-1.5 hidden sm:inline">
                              {t('generateText.translate', {
                                defaultValue: 'Translate',
                              })}
                            </span>
                            <ChevronDown className="size-3 ml-0.5" />
                          </>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      {translateLanguages.map((lang) => (
                        <DropdownMenuItem
                          key={lang.value}
                          onClick={() =>
                            handleTranslateGeneratedText(lang.value)
                          }
                          className="cursor-pointer text-sm"
                        >
                          {lang.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2.5 text-xs"
                    onClick={() => handleCopyGeneratedText(generatedText)}
                  >
                    {isGeneratedTextCopied ? (
                      <>
                        <Check className="size-3.5 text-green-600" />
                        <span className="ml-1.5 text-green-600 hidden sm:inline">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        <span className="ml-1.5 hidden sm:inline">Copy</span>
                      </>
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs">
                        <Download className="size-3.5" />
                        <span className="ml-1.5 hidden sm:inline">
                          {t('generateText.download', {
                            defaultValue: 'Download',
                          })}
                        </span>
                        <ChevronDown className="size-3 ml-0.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleDownloadMD(generatedText)}
                        className="cursor-pointer text-sm"
                      >
                        <FileText className="size-3.5 mr-2" />
                        Markdown (.md)
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDownloadDOCX(generatedText)}
                        className="cursor-pointer text-sm"
                      >
                        <FileText className="size-3.5 mr-2" />
                        Word (.docx)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="w-px h-5 bg-border mx-0.5 hidden sm:block" />

                  <Button
                    size="sm"
                    className="h-8 px-3 text-xs font-medium"
                    onClick={() => setIsContinueDialogOpen(true)}
                    disabled={isContinuing}
                  >
                    {isContinuing ? (
                      <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <MessageSquare className="size-3.5 mr-1.5" />
                    )}
                    {t('continueConversation.button', {
                      defaultValue: 'Continue',
                    })}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

        {/* Continue Conversation Dialog */}
        <Dialog
          open={isContinueDialogOpen}
          onOpenChange={setIsContinueDialogOpen}
        >
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {t('continueConversation.title', {
                  defaultValue: 'Continue Conversation',
                })}
              </DialogTitle>
              <DialogDescription>
                {t('continueConversation.description', {
                  defaultValue:
                    'Enter your follow-up request to continue the conversation',
                })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>
                  {t('continueConversation.inputLabel', {
                    defaultValue: 'Your Request',
                  })}
                </Label>
                <Textarea
                  value={continueInstruction}
                  onChange={(e) => setContinueInstruction(e.target.value)}
                  placeholder={t('continueConversation.placeholder', {
                    defaultValue:
                      'e.g., Rewrite this as an academic paper format',
                  })}
                  className="min-h-[120px] resize-none"
                />
              </div>

              {/* Quick Options - preset-specific */}
              <div className="space-y-4">
                {(() => {
                  const isZh = locale.startsWith('zh');
                  const lang = isZh ? 'zh' : 'en';

                  type ContinueOptionItem = { icon: string; label: Record<string, string>; instruction: Record<string, string>; className?: string };

                  // Preset-specific continue options for writing presets
                  const writingPresetContinueOptions: Record<string, { storyOptions: ContinueOptionItem[]; writingTools: ContinueOptionItem[] }> = {
                    c1: { // Epic Fantasy Quest
                      storyOptions: [
                        { icon: '📖', label: { en: 'Continue Story', zh: '继续故事' }, instruction: { en: 'Continue the story from where it left off, maintaining the same tone and style', zh: '从上次停下的地方继续故事，保持相同的语气和风格' }, className: 'border-purple-300 bg-purple-50 hover:bg-purple-100 dark:border-purple-700 dark:bg-purple-950 dark:hover:bg-purple-900' },
                        { icon: '🗡️', label: { en: 'Epic Battle', zh: '史诗战斗' }, instruction: { en: 'Add an epic battle or confrontation scene with vivid action descriptions', zh: '添加一场史诗般的战斗或对决场景，配以生动的动作描写' }, className: 'border-rose-300 bg-rose-50 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-950 dark:hover:bg-rose-900' },
                        { icon: '🧙', label: { en: 'Deepen Magic', zh: '深化魔法' }, instruction: { en: 'Deepen the magic system: add rules, limitations, costs, and unique magical elements', zh: '深化魔法体系：添加规则、限制、代价和独特的魔法元素' }, className: 'border-blue-300 bg-blue-50 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950 dark:hover:bg-blue-900' },
                        { icon: '👑', label: { en: 'Hero Journey', zh: '英雄之旅' }, instruction: { en: 'Strengthen the hero\'s journey arc: add a clearer call to adventure, mentor figure, and personal growth', zh: '强化英雄之旅弧线：添加更明确的冒险召唤、导师角色和个人成长' }, className: 'border-green-300 bg-green-50 hover:bg-green-100 dark:border-green-700 dark:bg-green-950 dark:hover:bg-green-900' },
                        { icon: '🐉', label: { en: 'Add Creatures', zh: '添加生物' }, instruction: { en: 'Add mythical creatures or fantastical beings with unique characteristics and roles', zh: '添加具有独特特征和角色的神话生物或奇幻种族' }, className: 'border-orange-300 bg-orange-50 hover:bg-orange-100 dark:border-orange-700 dark:bg-orange-950 dark:hover:bg-orange-900' },
                        { icon: '🏁', label: { en: 'Write Ending', zh: '写结局' }, instruction: { en: 'Write a satisfying conclusion that wraps up the story', zh: '写一个令人满意的结局来完结故事' }, className: 'border-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-950 dark:hover:bg-indigo-900' },
                      ],
                      writingTools: [],
                    },
                    c2: { // Sci-Fi Adventure
                      storyOptions: [
                        { icon: '📖', label: { en: 'Continue Story', zh: '继续故事' }, instruction: { en: 'Continue the story from where it left off, maintaining the same tone and style', zh: '从上次停下的地方继续故事，保持相同的语气和风格' }, className: 'border-purple-300 bg-purple-50 hover:bg-purple-100 dark:border-purple-700 dark:bg-purple-950 dark:hover:bg-purple-900' },
                        { icon: '🚀', label: { en: 'Expand Tech', zh: '扩展科技' }, instruction: { en: 'Expand the technology descriptions: add more details about futuristic gadgets, AI systems, and space travel mechanics', zh: '扩展科技描写：添加更多未来科技设备、AI系统和太空旅行机制的细节' }, className: 'border-rose-300 bg-rose-50 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-950 dark:hover:bg-rose-900' },
                        { icon: '🌌', label: { en: 'Cosmic Scale', zh: '宇宙尺度' }, instruction: { en: 'Expand the scale to cosmic proportions: interstellar civilizations, galactic politics, or universe-level stakes', zh: '将格局扩展到宇宙尺度：星际文明、银河政治或宇宙级别的利害关系' }, className: 'border-blue-300 bg-blue-50 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950 dark:hover:bg-blue-900' },
                        { icon: '🤖', label: { en: 'AI Dilemma', zh: 'AI困境' }, instruction: { en: 'Add an AI ethical dilemma or human-technology conflict that challenges the characters', zh: '添加AI伦理困境或人类与技术的冲突来挑战角色' }, className: 'border-green-300 bg-green-50 hover:bg-green-100 dark:border-green-700 dark:bg-green-950 dark:hover:bg-green-900' },
                        { icon: '⏳', label: { en: 'Time Paradox', zh: '时间悖论' }, instruction: { en: 'Add time-related plot elements: paradoxes, alternate timelines, or temporal mechanics', zh: '添加时间相关的情节元素：悖论、平行时间线或时间机制' }, className: 'border-orange-300 bg-orange-50 hover:bg-orange-100 dark:border-orange-700 dark:bg-orange-950 dark:hover:bg-orange-900' },
                        { icon: '🏁', label: { en: 'Write Ending', zh: '写结局' }, instruction: { en: 'Write a satisfying conclusion that wraps up the story', zh: '写一个令人满意的结局来完结故事' }, className: 'border-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-950 dark:hover:bg-indigo-900' },
                      ],
                      writingTools: [],
                    },
                    c3: { // Thriller & Mystery
                      storyOptions: [
                        { icon: '📖', label: { en: 'Continue Story', zh: '继续故事' }, instruction: { en: 'Continue the story from where it left off, maintaining the same tone and style', zh: '从上次停下的地方继续故事，保持相同的语气和风格' }, className: 'border-purple-300 bg-purple-50 hover:bg-purple-100 dark:border-purple-700 dark:bg-purple-950 dark:hover:bg-purple-900' },
                        { icon: '🔍', label: { en: 'Add Clues', zh: '添加线索' }, instruction: { en: 'Add more clues, red herrings, and evidence that the reader can piece together', zh: '添加更多线索、误导和证据，让读者可以拼凑真相' }, className: 'border-rose-300 bg-rose-50 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-950 dark:hover:bg-rose-900' },
                        { icon: '😰', label: { en: 'Raise Tension', zh: '加强紧张感' }, instruction: { en: 'Raise the tension and suspense: add ticking clocks, dangerous stakes, and psychological pressure', zh: '加强紧张感和悬念：添加倒计时、危险赌注和心理压力' }, className: 'border-blue-300 bg-blue-50 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950 dark:hover:bg-blue-900' },
                        { icon: '🔄', label: { en: 'Plot Twist', zh: '反转' }, instruction: { en: 'Add a surprising plot twist that recontextualizes everything the reader thought they knew', zh: '添加一个出人意料的反转，颠覆读者之前的认知' }, className: 'border-green-300 bg-green-50 hover:bg-green-100 dark:border-green-700 dark:bg-green-950 dark:hover:bg-green-900' },
                        { icon: '🕵️', label: { en: 'Add Suspects', zh: '添加嫌疑人' }, instruction: { en: 'Add more suspects with distinct motives, alibis, and suspicious behaviors', zh: '添加更多具有不同动机、不在场证明和可疑行为的嫌疑人' }, className: 'border-orange-300 bg-orange-50 hover:bg-orange-100 dark:border-orange-700 dark:bg-orange-950 dark:hover:bg-orange-900' },
                        { icon: '🏁', label: { en: 'Write Ending', zh: '写结局' }, instruction: { en: 'Write a satisfying conclusion that reveals the truth', zh: '写一个揭示真相的令人满意的结局' }, className: 'border-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-950 dark:hover:bg-indigo-900' },
                      ],
                      writingTools: [],
                    },
                    c4: { // Romance & Drama
                      storyOptions: [
                        { icon: '📖', label: { en: 'Continue Story', zh: '继续故事' }, instruction: { en: 'Continue the story from where it left off, maintaining the same tone and style', zh: '从上次停下的地方继续故事，保持相同的语气和风格' }, className: 'border-purple-300 bg-purple-50 hover:bg-purple-100 dark:border-purple-700 dark:bg-purple-950 dark:hover:bg-purple-900' },
                        { icon: '💕', label: { en: 'Deepen Chemistry', zh: '深化化学反应' }, instruction: { en: 'Deepen the romantic chemistry: add more tension, longing glances, meaningful gestures, and emotional connection', zh: '深化浪漫化学反应：添加更多张力、渴望的目光、有意义的举动和情感连接' }, className: 'border-rose-300 bg-rose-50 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-950 dark:hover:bg-rose-900' },
                        { icon: '💔', label: { en: 'Love Conflict', zh: '爱情冲突' }, instruction: { en: 'Add romantic conflict or obstacles: misunderstandings, external pressures, or personal fears that keep them apart', zh: '添加恋爱冲突或障碍：误解、外部压力或使两人分开的内心恐惧' }, className: 'border-blue-300 bg-blue-50 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950 dark:hover:bg-blue-900' },
                        { icon: '🌹', label: { en: 'Romantic Scene', zh: '浪漫场景' }, instruction: { en: 'Add a key romantic scene: a first meeting, confession, reunion, or intimate moment', zh: '添加关键的浪漫场景：初遇、告白、重逢或亲密时刻' }, className: 'border-green-300 bg-green-50 hover:bg-green-100 dark:border-green-700 dark:bg-green-950 dark:hover:bg-green-900' },
                        { icon: '😢', label: { en: 'More Emotional', zh: '更感人' }, instruction: { en: 'Add more emotional depth: inner monologue, vulnerability, and heartfelt moments', zh: '添加更多情感深度：内心独白、脆弱时刻和感人瞬间' }, className: 'border-orange-300 bg-orange-50 hover:bg-orange-100 dark:border-orange-700 dark:bg-orange-950 dark:hover:bg-orange-900' },
                        { icon: '🏁', label: { en: 'Write Ending', zh: '写结局' }, instruction: { en: 'Write a satisfying romantic conclusion', zh: '写一个令人满意的浪漫结局' }, className: 'border-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-950 dark:hover:bg-indigo-900' },
                      ],
                      writingTools: [],
                    },
                    c5: { // Horror & Dark Fiction
                      storyOptions: [
                        { icon: '📖', label: { en: 'Continue Story', zh: '继续故事' }, instruction: { en: 'Continue the story from where it left off, maintaining the same tone and style', zh: '从上次停下的地方继续故事，保持相同的语气和风格' }, className: 'border-purple-300 bg-purple-50 hover:bg-purple-100 dark:border-purple-700 dark:bg-purple-950 dark:hover:bg-purple-900' },
                        { icon: '👻', label: { en: 'More Dread', zh: '更多恐惧' }, instruction: { en: 'Increase the sense of dread and unease: add subtle wrongness, oppressive atmosphere, and creeping horror', zh: '增加恐惧和不安感：添加微妙的不对劲、压抑的氛围和蔓延的恐怖' }, className: 'border-rose-300 bg-rose-50 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-950 dark:hover:bg-rose-900' },
                        { icon: '🧠', label: { en: 'Psych Horror', zh: '心理恐怖' }, instruction: { en: 'Deepen the psychological horror: add paranoia, unreliable reality, and mental deterioration', zh: '深化心理恐怖：添加偏执、不可靠的现实和精神崩溃' }, className: 'border-blue-300 bg-blue-50 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950 dark:hover:bg-blue-900' },
                        { icon: '🏚️', label: { en: 'Dread Setting', zh: '恐怖场景' }, instruction: { en: 'Enhance the setting to be more oppressive and threatening: isolated location, decaying environment, or cursed ground', zh: '增强场景的压迫感和威胁性：与世隔绝的地点、腐朽的环境或被诅咒的土地' }, className: 'border-green-300 bg-green-50 hover:bg-green-100 dark:border-green-700 dark:bg-green-950 dark:hover:bg-green-900' },
                        { icon: '😱', label: { en: 'Scare Scene', zh: '惊吓场景' }, instruction: { en: 'Add a terrifying scene or encounter that builds and releases tension effectively', zh: '添加一个能有效构建和释放紧张感的恐怖场景或遭遇' }, className: 'border-orange-300 bg-orange-50 hover:bg-orange-100 dark:border-orange-700 dark:bg-orange-950 dark:hover:bg-orange-900' },
                        { icon: '🏁', label: { en: 'Write Ending', zh: '写结局' }, instruction: { en: 'Write a chilling conclusion that haunts the reader', zh: '写一个令人毛骨悚然的结局' }, className: 'border-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-950 dark:hover:bg-indigo-900' },
                      ],
                      writingTools: [],
                    },
                    c6: { // Business Email
                      storyOptions: [],
                      writingTools: [
                        { icon: '💼', label: { en: 'More Formal', zh: '更正式' }, instruction: { en: 'Make the email more formal and professional with polished business language', zh: '使邮件更正式和专业，使用精炼的商务语言' } },
                        { icon: '📋', label: { en: 'Action Items', zh: '行动项' }, instruction: { en: 'Add clear action items, deadlines, and next steps for the recipient', zh: '添加明确的行动项、截止日期和后续步骤' } },
                        { icon: '✂️', label: { en: 'More Concise', zh: '更简洁' }, instruction: { en: 'Make the email more concise and direct, remove unnecessary pleasantries', zh: '使邮件更简洁直接，去除不必要的客套' } },
                        { icon: '🤝', label: { en: 'Softer Tone', zh: '柔和语气' }, instruction: { en: 'Soften the tone to be more diplomatic, tactful, and relationship-preserving', zh: '柔化语气，使之更外交、委婉且维护关系' } },
                        { icon: '📊', label: { en: 'Add Data', zh: '添加数据' }, instruction: { en: 'Add data points, metrics, or evidence to support the email\'s key messages', zh: '添加数据点、指标或证据来支持邮件的关键信息' } },
                        { icon: '⚡', label: { en: 'Add Urgency', zh: '增加紧迫感' }, instruction: { en: 'Add appropriate urgency while remaining professional and respectful', zh: '在保持专业和尊重的同时增加适当的紧迫感' } },
                      ],
                    },
                    c7: { // Academic Paper
                      storyOptions: [],
                      writingTools: [
                        { icon: '📚', label: { en: 'Add Citations', zh: '添加引用' }, instruction: { en: 'Add more citation placeholders and reference frameworks to strengthen academic rigor', zh: '添加更多引用占位符和参考框架以加强学术严谨性' } },
                        { icon: '🔬', label: { en: 'Methodology', zh: '研究方法' }, instruction: { en: 'Expand the research methodology section with more detailed procedures and justifications', zh: '扩展研究方法部分，添加更详细的程序和论证' } },
                        { icon: '📊', label: { en: 'Data Analysis', zh: '数据分析' }, instruction: { en: 'Add data analysis frameworks, statistical methods, or analytical approaches', zh: '添加数据分析框架、统计方法或分析方法' } },
                        { icon: '🎯', label: { en: 'Sharpen Thesis', zh: '锐化论点' }, instruction: { en: 'Sharpen the thesis statement and research questions to be more specific and arguable', zh: '使论文陈述和研究问题更具体、更具可论证性' } },
                        { icon: '🔄', label: { en: 'Counter Arguments', zh: '反面论证' }, instruction: { en: 'Add counter-arguments and limitations to demonstrate critical thinking', zh: '添加反面论证和局限性以展示批判性思维' } },
                        { icon: '➕', label: { en: 'Expand', zh: '扩展内容' }, instruction: { en: 'Expand and add more details to the current content', zh: '扩展并添加更多细节' } },
                      ],
                    },
                    c8: { // Product Documentation
                      storyOptions: [],
                      writingTools: [
                        { icon: '📖', label: { en: 'Add Examples', zh: '添加示例' }, instruction: { en: 'Add practical code examples, screenshots placeholders, or step-by-step walkthroughs', zh: '添加实用的代码示例、截图占位符或逐步教程' } },
                        { icon: '⚠️', label: { en: 'Add Warnings', zh: '添加警告' }, instruction: { en: 'Add important notes, warnings, tips, and prerequisite information', zh: '添加重要说明、警告、提示和前提条件信息' } },
                        { icon: '🔧', label: { en: 'Troubleshoot', zh: '故障排除' }, instruction: { en: 'Add a troubleshooting section with common issues and their solutions', zh: '添加故障排除部分，包含常见问题及其解决方案' } },
                        { icon: '📋', label: { en: 'Better Structure', zh: '优化结构' }, instruction: { en: 'Improve document structure with clear headings, numbered steps, and logical flow', zh: '优化文档结构，添加清晰的标题、编号步骤和逻辑流程' } },
                        { icon: '👶', label: { en: 'Beginner Friendly', zh: '新手友好' }, instruction: { en: 'Make it more beginner-friendly: simplify jargon, add explanations, and assume less prior knowledge', zh: '使其更对新手友好：简化术语、添加解释、减少前提知识要求' } },
                        { icon: '🔌', label: { en: 'API Details', zh: 'API详情' }, instruction: { en: 'Add API endpoint details, request/response examples, and authentication info', zh: '添加API端点详情、请求/响应示例和认证信息' } },
                      ],
                    },
                    c9: { // Sales Copy
                      storyOptions: [],
                      writingTools: [
                        { icon: '🎯', label: { en: 'Stronger CTA', zh: '更强CTA' }, instruction: { en: 'Strengthen the call-to-action to be more compelling and action-driving', zh: '加强行动号召使之更有说服力和驱动力' } },
                        { icon: '😰', label: { en: 'Pain Points', zh: '痛点挖掘' }, instruction: { en: 'Dig deeper into customer pain points and show how the product solves them', zh: '深挖客户痛点并展示产品如何解决这些问题' } },
                        { icon: '⭐', label: { en: 'Social Proof', zh: '社会证明' }, instruction: { en: 'Add social proof: testimonials, statistics, case studies, or trust badges', zh: '添加社会证明：用户评价、统计数据、案例研究或信任标识' } },
                        { icon: '⏰', label: { en: 'Add Scarcity', zh: '增加稀缺感' }, instruction: { en: 'Add scarcity and urgency elements: limited time, limited quantity, or exclusive access', zh: '增加稀缺和紧迫元素：限时、限量或独家访问' } },
                        { icon: '💎', label: { en: 'Highlight Value', zh: '突出价值' }, instruction: { en: 'Better highlight the value proposition: focus on benefits over features and ROI', zh: '更好地突出价值主张：关注收益而非功能，强调投资回报' } },
                        { icon: '✂️', label: { en: 'More Concise', zh: '更简洁' }, instruction: { en: 'Make the copy more concise and punchy for higher conversion', zh: '使文案更简洁有力以提高转化率' } },
                      ],
                    },
                    c10: { // Social Media Post
                      storyOptions: [],
                      writingTools: [
                        { icon: '🔥', label: { en: 'More Viral', zh: '更易传播' }, instruction: { en: 'Make it more viral-worthy: add hooks, controversial takes, or shareable moments', zh: '使内容更易传播：添加吸引力、争议性观点或可分享的亮点' } },
                        { icon: '#️⃣', label: { en: 'Add Hashtags', zh: '添加标签' }, instruction: { en: 'Add relevant trending hashtags and optimize for platform discoverability', zh: '添加相关热门标签，优化平台可发现性' } },
                        { icon: '💬', label: { en: 'More Engaging', zh: '更多互动' }, instruction: { en: 'Make it more engaging: add questions, polls, CTAs, or conversation starters', zh: '增加互动性：添加问题、投票、行动号召或话题引导' } },
                        { icon: '😂', label: { en: 'Add Humor', zh: '添加幽默' }, instruction: { en: 'Add humor, wit, or relatable memes to make the post more entertaining', zh: '添加幽默、机智或有共鸣的梗使帖子更有趣' } },
                        { icon: '📱', label: { en: 'Platform Optimize', zh: '平台优化' }, instruction: { en: 'Optimize the format and length for the specific social media platform', zh: '针对特定社交媒体平台优化格式和长度' } },
                        { icon: '✂️', label: { en: 'Simplify', zh: '精简' }, instruction: { en: 'Make it shorter and punchier for better social media engagement', zh: '使内容更短更有力以提高社交媒体互动' } },
                      ],
                    },
                  };

                  // Check if we have preset-specific options for writing
                  const presetKey = appliedCombinationKey || '';
                  const presetOptions = category === 'writing' ? writingPresetContinueOptions[presetKey] : null;

                  if (presetOptions && (presetOptions.storyOptions.length > 0 || presetOptions.writingTools.length > 0)) {
                    return (
                      <>
                        {presetOptions.storyOptions.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground">
                              {t('continueConversation.storyOptions', { defaultValue: 'Story Options' })}
                            </Label>
                            <div className="flex flex-wrap gap-2">
                              {presetOptions.storyOptions.map((opt, idx) => (
                                <Button key={idx} variant="outline" size="sm" onClick={() => setContinueInstruction(opt.instruction[lang] || opt.instruction.en)} className={opt.className || ''}>
                                  {opt.icon} {opt.label[lang] || opt.label.en}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                        {presetOptions.writingTools.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-foreground">
                              {t('continueConversation.writingTools', { defaultValue: 'Writing Tools' })}
                            </Label>
                            <div className="flex flex-wrap gap-2">
                              {presetOptions.writingTools.map((opt, idx) => (
                                <Button key={idx} variant="outline" size="sm" onClick={() => setContinueInstruction(opt.instruction[lang] || opt.instruction.en)} className={opt.className || ''}>
                                  {opt.icon} {opt.label[lang] || opt.label.en}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  }

                  // Default: fallback writing options (no preset) or non-writing categories
                  if (category === 'writing') {
                    // Generic writing continue options
                    const defaultStoryOptions: ContinueOptionItem[] = [
                      { icon: '📖', label: { en: 'Continue Story', zh: '继续故事' }, instruction: { en: 'Continue the story from where it left off, maintaining the same tone and style', zh: '从上次停下的地方继续故事，保持相同的语气和风格' }, className: 'border-purple-300 bg-purple-50 hover:bg-purple-100 dark:border-purple-700 dark:bg-purple-950 dark:hover:bg-purple-900' },
                      { icon: '🔄', label: { en: 'Plot Twist', zh: '反转' }, instruction: { en: 'Add an unexpected plot twist that changes the direction of the story', zh: '添加一个出人意料的反转，改变故事方向' }, className: 'border-rose-300 bg-rose-50 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-950 dark:hover:bg-rose-900' },
                      { icon: '👤', label: { en: 'Develop Character', zh: '发展角色' }, instruction: { en: 'Develop the main character with more backstory, personality traits, and motivations', zh: '为主角添加更多背景故事、性格特征和动机' }, className: 'border-blue-300 bg-blue-50 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950 dark:hover:bg-blue-900' },
                      { icon: '💬', label: { en: 'Add Dialogue', zh: '添加对话' }, instruction: { en: 'Add engaging dialogue between characters to bring the scene to life', zh: '添加引人入胜的角色对话使场景更生动' }, className: 'border-green-300 bg-green-50 hover:bg-green-100 dark:border-green-700 dark:bg-green-950 dark:hover:bg-green-900' },
                      { icon: '⚡', label: { en: 'Build Tension', zh: '构建张力' }, instruction: { en: 'Build suspense and tension to create a more gripping narrative', zh: '构建悬念和张力以创造更引人入胜的叙事' }, className: 'border-orange-300 bg-orange-50 hover:bg-orange-100 dark:border-orange-700 dark:bg-orange-950 dark:hover:bg-orange-900' },
                      { icon: '🏁', label: { en: 'Write Ending', zh: '写结局' }, instruction: { en: 'Write a satisfying conclusion that wraps up the story', zh: '写一个令人满意的结局来完结故事' }, className: 'border-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-950 dark:hover:bg-indigo-900' },
                    ];
                    const defaultWritingTools: ContinueOptionItem[] = [
                      { icon: '📄', label: { en: 'Academic Paper', zh: '学术论文' }, instruction: { en: 'Rewrite this as an academic paper format', zh: '将此内容改写为学术论文格式' } },
                      { icon: '➕', label: { en: 'Add Details', zh: '添加细节' }, instruction: { en: 'Expand and add more details', zh: '扩展并添加更多细节' } },
                      { icon: '✨', label: { en: 'Simplify', zh: '简化' }, instruction: { en: 'Simplify the content for beginners', zh: '为初学者简化内容' } },
                      { icon: '💡', label: { en: 'Add Examples', zh: '添加示例' }, instruction: { en: 'Add practical examples', zh: '添加实际示例' } },
                      { icon: '💼', label: { en: 'Professional Tone', zh: '专业语气' }, instruction: { en: 'Rewrite in a more professional and formal tone', zh: '以更专业和正式的语气重写' } },
                      { icon: '🎭', label: { en: 'Humanize Text', zh: '人性化文本' }, instruction: { en: 'Rewrite this text to sound more natural and human-like. Vary sentence structure and length, use more conversational language, add personal touches, avoid repetitive patterns, and make it less formulaic. The goal is to make the text undetectable by AI detection tools while preserving the original meaning and key points.', zh: '重写此文本使其听起来更自然和人性化。变化句子结构和长度，使用更口语化的语言，添加个人化元素，避免重复模式，使其不那么公式化。目标是在保留原始含义和关键点的同时，使文本无法被AI检测工具识别。' }, className: 'border-amber-300 bg-amber-50 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950 dark:hover:bg-amber-900' },
                    ];
                    return (
                      <>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-foreground">
                            {t('continueConversation.storyOptions', { defaultValue: 'Story Options' })}
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {defaultStoryOptions.map((opt, idx) => (
                              <Button key={idx} variant="outline" size="sm" onClick={() => setContinueInstruction(opt.instruction[lang] || opt.instruction.en)} className={opt.className || ''}>
                                {opt.icon} {opt.label[lang] || opt.label.en}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-foreground">
                            {t('continueConversation.writingTools', { defaultValue: 'Writing Tools' })}
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {defaultWritingTools.map((opt, idx) => (
                              <Button key={idx} variant="outline" size="sm" onClick={() => setContinueInstruction(opt.instruction[lang] || opt.instruction.en)} className={opt.className || ''}>
                                {opt.icon} {opt.label[lang] || opt.label.en}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </>
                    );
                  }

                  // Non-writing categories: generic quick options
                  const genericOptions: ContinueOptionItem[] = [
                    { icon: '📄', label: { en: 'Academic Paper', zh: '学术论文' }, instruction: { en: 'Rewrite this as an academic paper format', zh: '将此内容改写为学术论文格式' } },
                    { icon: '➕', label: { en: 'Add Details', zh: '添加细节' }, instruction: { en: 'Expand and add more details', zh: '扩展并添加更多细节' } },
                    { icon: '✨', label: { en: 'Simplify', zh: '简化' }, instruction: { en: 'Simplify the content for beginners', zh: '为初学者简化内容' } },
                    { icon: '💡', label: { en: 'Add Examples', zh: '添加示例' }, instruction: { en: 'Add practical examples', zh: '添加实际示例' } },
                    { icon: '📋', label: { en: 'Create Outline', zh: '创建大纲' }, instruction: { en: 'Create a structured outline', zh: '创建结构化大纲' } },
                    { icon: '💼', label: { en: 'Professional Tone', zh: '专业语气' }, instruction: { en: 'Rewrite in a more professional and formal tone', zh: '以更专业和正式的语气重写' } },
                    { icon: '✅', label: { en: 'Action Items', zh: '行动项' }, instruction: { en: 'Add actionable items and next steps', zh: '添加可操作的项目和后续步骤' } },
                    { icon: '🎭', label: { en: 'Humanize Text', zh: '人性化文本' }, instruction: { en: 'Rewrite this text to sound more natural and human-like. Vary sentence structure and length, use more conversational language, add personal touches, avoid repetitive patterns, and make it less formulaic. The goal is to make the text undetectable by AI detection tools while preserving the original meaning and key points.', zh: '重写此文本使其听起来更自然和人性化。变化句子结构和长度，使用更口语化的语言，添加个人化元素，避免重复模式，使其不那么公式化。目标是在保留原始含义和关键点的同时，使文本无法被AI检测工具识别。' }, className: 'border-amber-300 bg-amber-50 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950 dark:hover:bg-amber-900' },
                  ];
                  return (
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">
                        {t('continueConversation.quickOptions', { defaultValue: 'Quick Options' })}
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {genericOptions.map((opt, idx) => (
                          <Button key={idx} variant="outline" size="sm" onClick={() => setContinueInstruction(opt.instruction[lang] || opt.instruction.en)} className={opt.className || ''}>
                            {opt.icon} {opt.label[lang] || opt.label.en}
                          </Button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsContinueDialogOpen(false)}
              >
                {t('continueConversation.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button
                onClick={handleContinueConversation}
                disabled={!continueInstruction.trim() || isContinuing}
              >
                {isContinuing ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    {t('continueConversation.processing', {
                      defaultValue: 'Processing...',
                    })}
                  </>
                ) : (
                  <>
                    <MessageSquare className="size-4 mr-2" />
                    {t('continueConversation.submit', {
                      defaultValue: 'Continue',
                    })}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        {/* AI Editing Dialog */}
        <Dialog open={isAiEditingOpen} onOpenChange={setIsAiEditingOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {t('aiEdit.title', { defaultValue: 'AI Edit Prompt' })}
              </DialogTitle>
              <DialogDescription>
                {t('aiEdit.description', {
                  defaultValue: 'Describe how you want to modify the prompt',
                })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">

              {/* Quick Edit Buttons - for writing category (preset-specific) */}
              {category === 'writing' && (() => {
                // Preset-specific quick edit options for writing
                type QuickEditItem = { icon: string; label: Record<string, string>; instruction: Record<string, string> };
                const writingPresetQuickEdits: Record<string, QuickEditItem[]> = {
                  c1: [ // Epic Fantasy Quest
                    { icon: '🗡️', label: { en: 'Expand World', zh: '扩展世界观' }, instruction: { en: 'Expand the world-building: add more details about geography, history, cultures, and political systems', zh: '扩展世界观构建：添加更多地理、历史、文化和政治体系的细节' } },
                    { icon: '🧙', label: { en: 'Deepen Magic', zh: '深化魔法' }, instruction: { en: 'Deepen the magic system: add rules, limitations, costs, and unique magical elements', zh: '深化魔法体系：添加规则、限制、代价和独特的魔法元素' } },
                    { icon: '⚔️', label: { en: 'Epic Battle', zh: '史诗战斗' }, instruction: { en: 'Add an epic battle or confrontation scene with vivid action descriptions', zh: '添加一场史诗般的战斗或对决场景，配以生动的动作描写' } },
                    { icon: '👑', label: { en: 'Hero Journey', zh: '英雄之旅' }, instruction: { en: 'Strengthen the hero\'s journey arc: add a clearer call to adventure, mentor figure, and personal growth', zh: '强化英雄之旅弧线：添加更明确的冒险召唤、导师角色和个人成长' } },
                    { icon: '🐉', label: { en: 'Add Creatures', zh: '添加生物' }, instruction: { en: 'Add mythical creatures or fantastical beings with unique characteristics and roles', zh: '添加具有独特特征和角色的神话生物或奇幻种族' } },
                    { icon: '🎯', label: { en: 'Simplify', zh: '精简' }, instruction: { en: 'Simplify the prompt to focus on the core story elements', zh: '精简提示词，聚焦核心故事元素' } },
                  ],
                  c2: [ // Sci-Fi Adventure
                    { icon: '🚀', label: { en: 'Expand Tech', zh: '扩展科技' }, instruction: { en: 'Expand the technology descriptions: add more details about futuristic gadgets, AI systems, and space travel mechanics', zh: '扩展科技描写：添加更多未来科技设备、AI系统和太空旅行机制的细节' } },
                    { icon: '🌌', label: { en: 'Cosmic Scale', zh: '宇宙尺度' }, instruction: { en: 'Expand the scale to cosmic proportions: interstellar civilizations, galactic politics, or universe-level stakes', zh: '将格局扩展到宇宙尺度：星际文明、银河政治或宇宙级别的利害关系' } },
                    { icon: '🤖', label: { en: 'AI Dilemma', zh: 'AI困境' }, instruction: { en: 'Add an AI ethical dilemma or human-technology conflict that challenges the characters', zh: '添加AI伦理困境或人类与技术的冲突来挑战角色' } },
                    { icon: '🧬', label: { en: 'Bio/Evolution', zh: '生物进化' }, instruction: { en: 'Add biological evolution or transhumanism elements: genetic modification, cybernetic enhancement, or alien biology', zh: '添加生物进化或超人类主义元素：基因改造、赛博增强或外星生物学' } },
                    { icon: '⏳', label: { en: 'Time Paradox', zh: '时间悖论' }, instruction: { en: 'Add time-related plot elements: paradoxes, alternate timelines, or temporal mechanics', zh: '添加时间相关的情节元素：悖论、平行时间线或时间机制' } },
                    { icon: '📝', label: { en: 'Simplify', zh: '精简' }, instruction: { en: 'Simplify the prompt to focus on the core sci-fi concept', zh: '精简提示词，聚焦核心科幻概念' } },
                  ],
                  c3: [ // Thriller & Mystery
                    { icon: '🔍', label: { en: 'Add Clues', zh: '添加线索' }, instruction: { en: 'Add more clues, red herrings, and evidence that the reader can piece together', zh: '添加更多线索、误导和证据，让读者可以拼凑真相' } },
                    { icon: '😰', label: { en: 'Raise Tension', zh: '加强紧张感' }, instruction: { en: 'Raise the tension and suspense: add ticking clocks, dangerous stakes, and psychological pressure', zh: '加强紧张感和悬念：添加倒计时、危险赌注和心理压力' } },
                    { icon: '🔄', label: { en: 'Plot Twist', zh: '反转' }, instruction: { en: 'Add a surprising plot twist that recontextualizes everything the reader thought they knew', zh: '添加一个出人意料的反转，颠覆读者之前的认知' } },
                    { icon: '🧠', label: { en: 'Psych Depth', zh: '心理深度' }, instruction: { en: 'Deepen the psychological elements: add character motivations, internal conflicts, and unreliable perspectives', zh: '深化心理元素：添加角色动机、内心冲突和不可靠的叙述视角' } },
                    { icon: '🕵️', label: { en: 'Add Suspects', zh: '添加嫌疑人' }, instruction: { en: 'Add more suspects with distinct motives, alibis, and suspicious behaviors', zh: '添加更多具有不同动机、不在场证明和可疑行为的嫌疑人' } },
                    { icon: '📝', label: { en: 'Simplify', zh: '精简' }, instruction: { en: 'Simplify the mystery structure for clarity and focus', zh: '精简悬疑结构，使之更清晰聚焦' } },
                  ],
                  c4: [ // Romance & Drama
                    { icon: '💕', label: { en: 'Deepen Chemistry', zh: '深化化学反应' }, instruction: { en: 'Deepen the romantic chemistry: add more tension, longing glances, meaningful gestures, and emotional connection', zh: '深化浪漫化学反应：添加更多张力、渴望的目光、有意义的举动和情感连接' } },
                    { icon: '💔', label: { en: 'Love Conflict', zh: '爱情冲突' }, instruction: { en: 'Add romantic conflict or obstacles: misunderstandings, external pressures, or personal fears that keep them apart', zh: '添加恋爱冲突或障碍：误解、外部压力或使两人分开的内心恐惧' } },
                    { icon: '💬', label: { en: 'Better Dialogue', zh: '改善对话' }, instruction: { en: 'Improve dialogue to be more natural, witty, and emotionally revealing between characters', zh: '改善对话使之更自然、机智，更能展现角色间的情感' } },
                    { icon: '🌹', label: { en: 'Romantic Scene', zh: '浪漫场景' }, instruction: { en: 'Add a key romantic scene: a first meeting, confession, reunion, or intimate moment', zh: '添加关键的浪漫场景：初遇、告白、重逢或亲密时刻' } },
                    { icon: '😢', label: { en: 'More Emotional', zh: '更感人' }, instruction: { en: 'Add more emotional depth: inner monologue, vulnerability, and heartfelt moments', zh: '添加更多情感深度：内心独白、脆弱时刻和感人瞬间' } },
                    { icon: '📝', label: { en: 'Simplify', zh: '精简' }, instruction: { en: 'Simplify the romance premise for clarity', zh: '精简浪漫前提，使之更清晰' } },
                  ],
                  c5: [ // Horror & Dark Fiction
                    { icon: '👻', label: { en: 'More Dread', zh: '更多恐惧' }, instruction: { en: 'Increase the sense of dread and unease: add subtle wrongness, oppressive atmosphere, and creeping horror', zh: '增加恐惧和不安感：添加微妙的不对劲、压抑的氛围和蔓延的恐怖' } },
                    { icon: '🩸', label: { en: 'Body Horror', zh: '肉体恐怖' }, instruction: { en: 'Add body horror or physical transformation elements that are disturbing and visceral', zh: '添加令人不安和内脏感的肉体恐怖或身体变异元素' } },
                    { icon: '🧠', label: { en: 'Psych Horror', zh: '心理恐怖' }, instruction: { en: 'Deepen the psychological horror: add paranoia, unreliable reality, and mental deterioration', zh: '深化心理恐怖：添加偏执、不可靠的现实和精神崩溃' } },
                    { icon: '🏚️', label: { en: 'Dread Setting', zh: '恐怖场景' }, instruction: { en: 'Enhance the setting to be more oppressive and threatening: isolated location, decaying environment, or cursed ground', zh: '增强场景的压迫感和威胁性：与世隔绝的地点、腐朽的环境或被诅咒的土地' } },
                    { icon: '😱', label: { en: 'Scare Scene', zh: '惊吓场景' }, instruction: { en: 'Add a terrifying scene or encounter that builds and releases tension effectively', zh: '添加一个能有效构建和释放紧张感的恐怖场景或遭遇' } },
                    { icon: '📝', label: { en: 'Simplify', zh: '精简' }, instruction: { en: 'Simplify the horror premise for focused impact', zh: '精简恐怖前提以获得更集中的冲击力' } },
                  ],
                  c6: [ // Business Email
                    { icon: '💼', label: { en: 'More Formal', zh: '更正式' }, instruction: { en: 'Make the email more formal and professional with polished business language', zh: '使邮件更正式和专业，使用精炼的商务语言' } },
                    { icon: '📋', label: { en: 'Action Items', zh: '行动项' }, instruction: { en: 'Add clear action items, deadlines, and next steps for the recipient', zh: '添加明确的行动项、截止日期和后续步骤' } },
                    { icon: '✂️', label: { en: 'More Concise', zh: '更简洁' }, instruction: { en: 'Make the email more concise and direct, remove unnecessary pleasantries', zh: '使邮件更简洁直接，去除不必要的客套' } },
                    { icon: '🤝', label: { en: 'Softer Tone', zh: '柔和语气' }, instruction: { en: 'Soften the tone to be more diplomatic, tactful, and relationship-preserving', zh: '柔化语气，使之更外交、委婉且维护关系' } },
                    { icon: '📊', label: { en: 'Add Data', zh: '添加数据' }, instruction: { en: 'Add data points, metrics, or evidence to support the email\'s key messages', zh: '添加数据点、指标或证据来支持邮件的关键信息' } },
                    { icon: '⚡', label: { en: 'Add Urgency', zh: '增加紧迫感' }, instruction: { en: 'Add appropriate urgency while remaining professional and respectful', zh: '在保持专业和尊重的同时增加适当的紧迫感' } },
                  ],
                  c7: [ // Academic Paper
                    { icon: '📚', label: { en: 'Add Citations', zh: '添加引用' }, instruction: { en: 'Add more citation placeholders and reference frameworks to strengthen academic rigor', zh: '添加更多引用占位符和参考框架以加强学术严谨性' } },
                    { icon: '🔬', label: { en: 'Methodology', zh: '研究方法' }, instruction: { en: 'Expand the research methodology section with more detailed procedures and justifications', zh: '扩展研究方法部分，添加更详细的程序和论证' } },
                    { icon: '📊', label: { en: 'Data Analysis', zh: '数据分析' }, instruction: { en: 'Add data analysis frameworks, statistical methods, or analytical approaches', zh: '添加数据分析框架、统计方法或分析方法' } },
                    { icon: '🎯', label: { en: 'Sharpen Thesis', zh: '锐化论点' }, instruction: { en: 'Sharpen the thesis statement and research questions to be more specific and arguable', zh: '使论文陈述和研究问题更具体、更具可论证性' } },
                    { icon: '🔄', label: { en: 'Counter Arguments', zh: '反面论证' }, instruction: { en: 'Add counter-arguments and limitations to demonstrate critical thinking', zh: '添加反面论证和局限性以展示批判性思维' } },
                    { icon: '📝', label: { en: 'Simplify', zh: '精简' }, instruction: { en: 'Simplify the academic language for better readability while maintaining rigor', zh: '精简学术语言以提高可读性，同时保持严谨性' } },
                  ],
                  c8: [ // Product Documentation
                    { icon: '📖', label: { en: 'Add Examples', zh: '添加示例' }, instruction: { en: 'Add practical code examples, screenshots placeholders, or step-by-step walkthroughs', zh: '添加实用的代码示例、截图占位符或逐步教程' } },
                    { icon: '⚠️', label: { en: 'Add Warnings', zh: '添加警告' }, instruction: { en: 'Add important notes, warnings, tips, and prerequisite information', zh: '添加重要说明、警告、提示和前提条件信息' } },
                    { icon: '🔧', label: { en: 'Troubleshoot', zh: '故障排除' }, instruction: { en: 'Add a troubleshooting section with common issues and their solutions', zh: '添加故障排除部分，包含常见问题及其解决方案' } },
                    { icon: '📋', label: { en: 'Better Structure', zh: '优化结构' }, instruction: { en: 'Improve document structure with clear headings, numbered steps, and logical flow', zh: '优化文档结构，添加清晰的标题、编号步骤和逻辑流程' } },
                    { icon: '👶', label: { en: 'Beginner Friendly', zh: '新手友好' }, instruction: { en: 'Make it more beginner-friendly: simplify jargon, add explanations, and assume less prior knowledge', zh: '使其更对新手友好：简化术语、添加解释、减少前提知识要求' } },
                    { icon: '🔌', label: { en: 'API Details', zh: 'API详情' }, instruction: { en: 'Add API endpoint details, request/response examples, and authentication info', zh: '添加API端点详情、请求/响应示例和认证信息' } },
                  ],
                  c9: [ // Sales Copy
                    { icon: '🎯', label: { en: 'Stronger CTA', zh: '更强CTA' }, instruction: { en: 'Strengthen the call-to-action to be more compelling and action-driving', zh: '加强行动号召使之更有说服力和驱动力' } },
                    { icon: '😰', label: { en: 'Pain Points', zh: '痛点挖掘' }, instruction: { en: 'Dig deeper into customer pain points and show how the product solves them', zh: '深挖客户痛点并展示产品如何解决这些问题' } },
                    { icon: '⭐', label: { en: 'Social Proof', zh: '社会证明' }, instruction: { en: 'Add social proof: testimonials, statistics, case studies, or trust badges', zh: '添加社会证明：用户评价、统计数据、案例研究或信任标识' } },
                    { icon: '⏰', label: { en: 'Add Scarcity', zh: '增加稀缺感' }, instruction: { en: 'Add scarcity and urgency elements: limited time, limited quantity, or exclusive access', zh: '增加稀缺和紧迫元素：限时、限量或独家访问' } },
                    { icon: '💎', label: { en: 'Highlight Value', zh: '突出价值' }, instruction: { en: 'Better highlight the value proposition: focus on benefits over features and ROI', zh: '更好地突出价值主张：关注收益而非功能，强调投资回报' } },
                    { icon: '📝', label: { en: 'Simplify', zh: '精简' }, instruction: { en: 'Make the copy more concise and punchy for higher conversion', zh: '使文案更简洁有力以提高转化率' } },
                  ],
                  c10: [ // Social Media Post
                    { icon: '🔥', label: { en: 'More Viral', zh: '更易传播' }, instruction: { en: 'Make it more viral-worthy: add hooks, controversial takes, or shareable moments', zh: '使内容更易传播：添加吸引力、争议性观点或可分享的亮点' } },
                    { icon: '#️⃣', label: { en: 'Add Hashtags', zh: '添加标签' }, instruction: { en: 'Add relevant trending hashtags and optimize for platform discoverability', zh: '添加相关热门标签，优化平台可发现性' } },
                    { icon: '💬', label: { en: 'More Engaging', zh: '更多互动' }, instruction: { en: 'Make it more engaging: add questions, polls, CTAs, or conversation starters', zh: '增加互动性：添加问题、投票、行动号召或话题引导' } },
                    { icon: '😂', label: { en: 'Add Humor', zh: '添加幽默' }, instruction: { en: 'Add humor, wit, or relatable memes to make the post more entertaining', zh: '添加幽默、机智或有共鸣的梗使帖子更有趣' } },
                    { icon: '📱', label: { en: 'Platform Optimize', zh: '平台优化' }, instruction: { en: 'Optimize the format and length for the specific social media platform', zh: '针对特定社交媒体平台优化格式和长度' } },
                    { icon: '📝', label: { en: 'Simplify', zh: '精简' }, instruction: { en: 'Make it shorter and punchier for better social media engagement', zh: '使内容更短更有力以提高社交媒体互动' } },
                  ],
                };

                const isZh = locale.startsWith('zh');
                const lang = isZh ? 'zh' : 'en';
                const presetKey = appliedCombinationKey || '';
                const quickEdits = writingPresetQuickEdits[presetKey];

                if (quickEdits) {
                  return (
                    <div className="space-y-2">
                      <Label>
                        {t('aiEdit.quickEditLabel', { defaultValue: 'Quick Edit' })}
                        {appliedCombination && (
                          <span className="ml-2 text-xs text-muted-foreground font-normal">
                            ({appliedCombination})
                          </span>
                        )}
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {quickEdits.map((edit, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            onClick={() => setAiEditInstruction(edit.instruction[lang] || edit.instruction.en)}
                            disabled={isAiEditing}
                            className="text-xs"
                          >
                            {edit.icon}{' '}
                            {edit.label[lang] || edit.label.en}
                          </Button>
                        ))}
                      </div>
                    </div>
                  );
                }

                // Fallback: generic writing quick edits (no preset selected)
                return (
                  <div className="space-y-2">
                    <Label>
                      {t('aiEdit.quickEditLabel', { defaultValue: 'Quick Edit' })}
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => setAiEditInstruction(t('aiEdit.writingQuickOptions.moreCreative', { defaultValue: 'Make the writing prompt more creative and imaginative, add unique storytelling elements' }))} disabled={isAiEditing} className="text-xs">
                        ✨ {t('aiEdit.writingQuickOptions.moreCreativeLabel', { defaultValue: 'More Creative' })}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setAiEditInstruction(t('aiEdit.writingQuickOptions.addDetail', { defaultValue: 'Add more details about characters, settings, and plot points' }))} disabled={isAiEditing} className="text-xs">
                        📝 {t('aiEdit.writingQuickOptions.addDetailLabel', { defaultValue: 'Add Details' })}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setAiEditInstruction(t('aiEdit.writingQuickOptions.enhanceTone', { defaultValue: 'Enhance the writing tone to be more engaging and compelling' }))} disabled={isAiEditing} className="text-xs">
                        🎭 {t('aiEdit.writingQuickOptions.enhanceToneLabel', { defaultValue: 'Enhance Tone' })}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setAiEditInstruction(t('aiEdit.writingQuickOptions.addConflict', { defaultValue: 'Add conflict, tension, or challenges to make the story more dramatic' }))} disabled={isAiEditing} className="text-xs">
                        ⚡ {t('aiEdit.writingQuickOptions.addConflictLabel', { defaultValue: 'Add Conflict' })}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setAiEditInstruction(t('aiEdit.writingQuickOptions.addDialogue', { defaultValue: 'Add dialogue or character interactions to bring the scene to life' }))} disabled={isAiEditing} className="text-xs">
                        💬 {t('aiEdit.writingQuickOptions.addDialogueLabel', { defaultValue: 'Add Dialogue' })}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setAiEditInstruction(t('aiEdit.writingQuickOptions.improveStructure', { defaultValue: 'Improve the narrative structure with better pacing and story arc' }))} disabled={isAiEditing} className="text-xs">
                        🗂️ {t('aiEdit.writingQuickOptions.improveStructureLabel', { defaultValue: 'Better Structure' })}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setAiEditInstruction(t('aiEdit.writingQuickOptions.addEmotion', { defaultValue: 'Add more emotional depth and character feelings to the narrative' }))} disabled={isAiEditing} className="text-xs">
                        ❤️ {t('aiEdit.writingQuickOptions.addEmotionLabel', { defaultValue: 'Add Emotion' })}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setAiEditInstruction(t('aiEdit.writingQuickOptions.simplify', { defaultValue: 'Simplify the prompt to be clearer and more focused' }))} disabled={isAiEditing} className="text-xs">
                        🎯 {t('aiEdit.writingQuickOptions.simplifyLabel', { defaultValue: 'Simplify' })}
                      </Button>
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-2">
                <Label htmlFor="ai-edit-instruction">
                  {t('aiEdit.instructionLabel', {
                    defaultValue: 'Edit Instruction',
                  })}
                </Label>
                <Textarea
                  id="ai-edit-instruction"
                  placeholder={t('aiEdit.instructionPlaceholder', {
                    defaultValue:
                      'Describe how you want to modify the prompt...',
                  })}
                  value={aiEditInstruction}
                  onChange={(e) => setAiEditInstruction(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAiEditingOpen(false)}
              >
                {t('aiEdit.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button
                onClick={handleAiEdit}
                disabled={!aiEditInstruction.trim() || isAiEditing}
              >
                {isAiEditing ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {t('aiEdit.editing', { defaultValue: 'Editing...' })}
                  </>
                ) : (
                  t('aiEdit.apply', { defaultValue: 'Apply Edit' })
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Image Dialog */}

        {/* Image Viewer Modal */}

        {/* Login Required Dialog */}
        <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
          <DialogContent className="sm:max-w-[380px] p-0 overflow-hidden">
            <DialogHeader className="sr-only">
              <DialogTitle>登录</DialogTitle>
            </DialogHeader>
            <LoginForm
              callbackUrl={
                typeof window !== 'undefined' ? window.location.pathname : '/'
              }
              errorMessage={loginDialogMessage}
              className="border-none"
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
