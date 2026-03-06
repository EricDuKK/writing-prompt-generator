'use client';

import { getDailyUsageAction } from '@/actions/get-daily-usage';
import { saveDescribeImageAction } from '@/actions/save-describe-image';
import { saveGeneratedPromptAction } from '@/actions/save-generated-prompt';
import { saveImageToPromptAction } from '@/actions/save-image-to-prompt';
import {
  saveVideoToPromptAction,
  updateVideoToPromptAction,
} from '@/actions/save-video-to-prompt';
import { updateGeneratedImageAction } from '@/actions/update-generated-image';
import { LoginForm } from '@/components/auth/login-form';
import { LoginWrapper } from '@/components/auth/login-wrapper';
import { DailyUsageBadge } from '@/components/daily-usage-badge';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { MODEL_CREDIT_COSTS } from '@/config/model-pricing';
import { presetOptionOverrides } from '@/components/prompt-generator/model-config';
import { useCreditBalance, useInvalidateCredits } from '@/hooks/use-credits';
import { authClient } from '@/lib/auth-client';
import type { Paragraph as ParagraphType, TextRun as TextRunType } from 'docx';
import {
  ArrowLeft,
  BookOpen,
  Briefcase,
  Check,
  ChevronDown,
  Copy,
  Edit2,
  FileText,
  Globe,
  GraduationCap,
  Heart,
  ImageIcon,
  Info,
  LayoutTemplate,
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
  VideoIcon,
  Wand2,
  X,
  Zap,
} from 'lucide-react';
import { Download } from 'lucide-react';
import { useLocale, useMessages, useTranslations } from '@/i18n/next-intl-shim';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type PromptCategory =
  | 'general'
  | 'image'
  | 'video'
  | 'code'
  | 'writing'
  | 'marketing'
  | 'image-to-prompt'
  | 'video-to-prompt'
  | 'image-edit'
  | 'describe-image';

// 图像生成模型定义
type ImageGenerationModel =
  | 'flux-schnell'
  | 'nano-banana'
  | 'grok-imagine'
  | 'flux2-pro-1k'
  | 'nano-banana-pro-2k'
  | 'flux2-pro-2k'
  | 'nano-banana-pro-4k';

// Image generation models (sorted by price ascending)
const IMAGE_GENERATION_MODELS: {
  id: ImageGenerationModel;
  label: string;
  credits: number;
}[] = [
  {
    id: 'flux-schnell',
    label: 'Flux.1 Schnell',
    credits: MODEL_CREDIT_COSTS['flux-schnell'],
  },
  {
    id: 'nano-banana',
    label: 'Nano Banana',
    credits: MODEL_CREDIT_COSTS['nano-banana'],
  },
  {
    id: 'grok-imagine',
    label: 'Grok Imagine',
    credits: MODEL_CREDIT_COSTS['grok-imagine'],
  },
  {
    id: 'flux2-pro-1k',
    label: 'Flux.2 Pro 1K',
    credits: MODEL_CREDIT_COSTS['flux2-pro-1k'],
  },
  {
    id: 'nano-banana-pro-2k',
    label: 'Nano Banana Pro 2K',
    credits: MODEL_CREDIT_COSTS['nano-banana-pro-2k'],
  },
  {
    id: 'flux2-pro-2k',
    label: 'Flux.2 Pro 2K',
    credits: MODEL_CREDIT_COSTS['flux2-pro-2k'],
  },
  {
    id: 'nano-banana-pro-4k',
    label: 'Nano Banana Pro 4K',
    credits: MODEL_CREDIT_COSTS['nano-banana-pro-4k'],
  },
];

// 图片生成设置选项
type AspectRatio =
  | '1:1'
  | '16:9'
  | '9:16'
  | '4:3'
  | '3:4'
  | '3:2'
  | '2:3'
  | '4:5'
  | '5:4'
  | '21:9'
  | 'auto';
type OutputFormat = 'png' | 'jpeg';

const ASPECT_RATIO_OPTIONS: { id: AspectRatio; label: string }[] = [
  { id: '1:1', label: '1:1 (Square)' },
  { id: '16:9', label: '16:9 (Landscape)' },
  { id: '9:16', label: '9:16 (Portrait)' },
  { id: '4:3', label: '4:3 (Traditional)' },
  { id: '3:4', label: '3:4 (Portrait Traditional)' },
  { id: '3:2', label: '3:2 (Landscape)' },
  { id: '2:3', label: '2:3 (Portrait)' },
  { id: '4:5', label: '4:5 (Portrait)' },
  { id: '5:4', label: '5:4 (Landscape)' },
  { id: '21:9', label: '21:9 (Ultra Wide)' },
  { id: 'auto', label: 'Auto' },
];

// 定义每个模型支持的宽高比
const MODEL_SUPPORTED_ASPECT_RATIOS: Record<
  ImageGenerationModel,
  AspectRatio[]
> = {
  'nano-banana': [
    '1:1',
    '16:9',
    '9:16',
    '4:3',
    '3:4',
    '3:2',
    '2:3',
    '4:5',
    '5:4',
    '21:9',
    'auto',
  ],
  'nano-banana-pro-2k': [
    '1:1',
    '16:9',
    '9:16',
    '4:3',
    '3:4',
    '3:2',
    '2:3',
    '4:5',
    '5:4',
    '21:9',
    'auto',
  ],
  'nano-banana-pro-4k': [
    '1:1',
    '16:9',
    '9:16',
    '4:3',
    '3:4',
    '3:2',
    '2:3',
    '4:5',
    '5:4',
    '21:9',
    'auto',
  ],
  'flux2-pro-1k': ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', 'auto'],
  'flux2-pro-2k': ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', 'auto'],
  'flux-schnell': ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '21:9'],
  'grok-imagine': ['1:1', '2:3', '3:2'],
};

const OUTPUT_FORMAT_OPTIONS: { id: OutputFormat; label: string }[] = [
  { id: 'png', label: 'PNG' },
  { id: 'jpeg', label: 'JPEG' },
];

// 视频生成模型定义
type VideoGenerationModel =
  | 'veo3'
  | 'veo3_fast'
  | 'sora2-10s'
  | 'sora2-15s'
  | 'sora2-pro-10s'
  | 'sora2-pro-15s';

// 视频宽高比选项
type VideoAspectRatio = '16:9' | '9:16' | 'portrait' | 'landscape';

// Video generation models (sorted by price ascending)
const VIDEO_GENERATION_MODELS: {
  id: VideoGenerationModel;
  label: string;
  credits: number;
}[] = [
  {
    id: 'sora2-10s',
    label: 'Sora 2 (10s)',
    credits: MODEL_CREDIT_COSTS['sora2-10s'],
  },
  {
    id: 'sora2-15s',
    label: 'Sora 2 (15s)',
    credits: MODEL_CREDIT_COSTS['sora2-15s'],
  },
  {
    id: 'veo3_fast',
    label: 'Veo 3.1 fast',
    credits: MODEL_CREDIT_COSTS['veo3_fast'],
  },
  {
    id: 'sora2-pro-10s',
    label: 'Sora 2 Pro (10s)',
    credits: MODEL_CREDIT_COSTS['sora2-pro-10s'],
  },
  {
    id: 'sora2-pro-15s',
    label: 'Sora 2 Pro (15s)',
    credits: MODEL_CREDIT_COSTS['sora2-pro-15s'],
  },
  {
    id: 'veo3',
    label: 'Veo 3.1 quality',
    credits: MODEL_CREDIT_COSTS['veo3'],
  },
];

const VIDEO_ASPECT_RATIO_OPTIONS: { id: VideoAspectRatio; label: string }[] = [
  { id: '16:9', label: '16:9 (Landscape)' },
  { id: '9:16', label: '9:16 (Portrait)' },
];

// Image-to-prompt AI 模型类型定义
type ImageToPromptModel =
  | 'general'
  | 'structured'
  | 'graphic-design'
  | 'flux'
  | 'nano-banana'
  | 'midjourney';

// Video-to-prompt 选项类型定义
type VideoToPromptModel =
  | 'general-video'
  | 'structured-video'
  | 'sora-luma'
  | 'social-viral'
  | 'physical-dynamics'
  | 'veo3-cinematic';

const VIDEO_TO_PROMPT_MODELS: {
  id: VideoToPromptModel;
  labelKey: string;
  descriptionKey: string;
}[] = [
  {
    id: 'general-video',
    labelKey: 'generalVideoPrompt',
    descriptionKey: 'generalVideoPromptDesc',
  },
  {
    id: 'structured-video',
    labelKey: 'structuredVideoPrompt',
    descriptionKey: 'structuredVideoPromptDesc',
  },
  {
    id: 'sora-luma',
    labelKey: 'soraLumaStyle',
    descriptionKey: 'soraLumaStyleDesc',
  },
  {
    id: 'social-viral',
    labelKey: 'socialViral',
    descriptionKey: 'socialViralDesc',
  },
  {
    id: 'physical-dynamics',
    labelKey: 'physicalDynamics',
    descriptionKey: 'physicalDynamicsDesc',
  },
  {
    id: 'veo3-cinematic',
    labelKey: 'veo3Cinematic',
    descriptionKey: 'veo3CinematicDesc',
  },
];

const IMAGE_TO_PROMPT_MODELS: {
  id: ImageToPromptModel;
  labelKey: string;
  descriptionKey: string;
}[] = [
  {
    id: 'general',
    labelKey: 'generalImagePrompt',
    descriptionKey: 'generalImagePromptDesc',
  },
  {
    id: 'structured',
    labelKey: 'structuredPrompt',
    descriptionKey: 'structuredPromptDesc',
  },
  {
    id: 'graphic-design',
    labelKey: 'graphicDesign',
    descriptionKey: 'graphicDesignDesc',
  },
  {
    id: 'flux',
    labelKey: 'flux',
    descriptionKey: 'fluxDesc',
  },
  {
    id: 'nano-banana',
    labelKey: 'nanoBanana',
    descriptionKey: 'nanoBananaDesc',
  },
  {
    id: 'midjourney',
    labelKey: 'midjourney',
    descriptionKey: 'midjourneyDesc',
  },
];

// Describe-image 选项类型定义
type DescribeImageOption =
  | 'describe-detail'
  | 'describe-brief'
  | 'describe-person'
  | 'recognize-objects'
  | 'analyze-art-style'
  | 'extract-text';

type DescribeImageCategory = 'description' | 'analysis';

const DESCRIBE_IMAGE_OPTIONS: {
  id: DescribeImageOption;
  labelKey: string;
  descriptionKey: string;
  category: DescribeImageCategory;
}[] = [
  // Description category
  {
    id: 'describe-detail',
    labelKey: 'describeImageInDetail',
    descriptionKey: 'describeImageInDetailDesc',
    category: 'description',
  },
  {
    id: 'describe-brief',
    labelKey: 'describeImageBriefly',
    descriptionKey: 'describeImageBrieflyDesc',
    category: 'description',
  },
  {
    id: 'describe-person',
    labelKey: 'describeThePerson',
    descriptionKey: 'describeThePersonDesc',
    category: 'description',
  },
  // Analysis category
  {
    id: 'recognize-objects',
    labelKey: 'recognizeObjects',
    descriptionKey: 'recognizeObjectsDesc',
    category: 'analysis',
  },
  {
    id: 'analyze-art-style',
    labelKey: 'analyzeArtStyle',
    descriptionKey: 'analyzeArtStyleDesc',
    category: 'analysis',
  },
  {
    id: 'extract-text',
    labelKey: 'extractTextFromImage',
    descriptionKey: 'extractTextFromImageDesc',
    category: 'analysis',
  },
];

const DESCRIBE_IMAGE_CATEGORIES: {
  id: DescribeImageCategory;
  labelKey: string;
}[] = [
  { id: 'description', labelKey: 'descriptionCategory' },
  { id: 'analysis', labelKey: 'analysisCategory' },
];

// AI 生成模型类型定义（用于生成提示词）
type AIGenerationModel =
  | 'gpt-4o-mini'
  | 'gpt-5-mini'
  | 'gemini-2.5-flash-lite'
  | 'deepseek-v3.2';

const AI_GENERATION_MODELS: {
  id: AIGenerationModel;
  label: string;
  modelId: string;
}[] = [
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', modelId: 'openai/gpt-4o-mini' },
  { id: 'gpt-5-mini', label: 'GPT-5 Mini', modelId: 'openai/gpt-5-mini' },
  {
    id: 'gemini-2.5-flash-lite',
    label: 'Gemini 2.5 Flash Lite',
    modelId: 'google/gemini-2.5-flash-lite',
  },
  {
    id: 'deepseek-v3.2',
    label: 'DeepSeek V3.2',
    modelId: 'deepseek/deepseek-v3.2',
  },
];

// 文本生成模型类型定义（用于根据提示词生成文本内容）
type TextGenerationModel =
  | 'gpt-5.2-chat'
  | 'gpt-4o-mini'
  | 'gemini-2.5-flash'
  | 'deepseek-v3.2'
  | 'claude-sonnet-4';

const TEXT_GENERATION_MODELS: {
  id: TextGenerationModel;
  label: string;
  modelId: string;
  credits: number;
}[] = [
  {
    id: 'gpt-5.2-chat',
    label: 'GPT-5.2 Chat',
    modelId: 'openai/gpt-5.2-chat',
    credits: MODEL_CREDIT_COSTS['gpt-5.2-chat'],
  },
  {
    id: 'gpt-4o-mini',
    label: 'GPT-4o Mini',
    modelId: 'openai/gpt-4o-mini',
    credits: MODEL_CREDIT_COSTS['gpt-4o-mini'],
  },
  {
    id: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    modelId: 'google/gemini-2.5-flash',
    credits: MODEL_CREDIT_COSTS['gemini-2.5-flash'],
  },
  {
    id: 'deepseek-v3.2',
    label: 'DeepSeek V3.2',
    modelId: 'deepseek/deepseek-v3.2',
    credits: MODEL_CREDIT_COSTS['deepseek-v3.2'],
  },
  {
    id: 'claude-sonnet-4',
    label: 'Claude Sonnet 4',
    modelId: 'anthropic/claude-sonnet-4',
    credits: MODEL_CREDIT_COSTS['claude-sonnet-4'],
  },
];

// 输出语言选项类型
type OutputLanguage =
  | 'en'
  | 'zh-CN'
  | 'zh-TW'
  | 'fr'
  | 'de'
  | 'it'
  | 'es'
  | 'pt'
  | 'ru'
  | 'ja'
  | 'ko'
  | 'ar';

const OUTPUT_LANGUAGE_OPTIONS: {
  id: OutputLanguage;
  labelKey: string;
  nativeLabel: string;
}[] = [
  { id: 'en', labelKey: 'english', nativeLabel: 'English' },
  { id: 'ja', labelKey: 'japanese', nativeLabel: '日本語' },
  { id: 'ko', labelKey: 'korean', nativeLabel: '한국어' },
  { id: 'zh-CN', labelKey: 'chineseSimplified', nativeLabel: '简体中文' },
  { id: 'zh-TW', labelKey: 'chineseTraditional', nativeLabel: '繁體中文' },
  { id: 'fr', labelKey: 'french', nativeLabel: 'Français' },
  { id: 'de', labelKey: 'german', nativeLabel: 'Deutsch' },
  { id: 'it', labelKey: 'italian', nativeLabel: 'Italiano' },
  { id: 'es', labelKey: 'spanish', nativeLabel: 'Español' },
  { id: 'pt', labelKey: 'portuguese', nativeLabel: 'Português' },
  { id: 'ru', labelKey: 'russian', nativeLabel: 'Русский' },
  { id: 'ar', labelKey: 'arabic', nativeLabel: 'العربية' },
];

// 类别选项的键（用于翻译映射）
const categoryOptionKeys: Record<PromptCategory, string[]> = {
  general: ['创意', '分析', '解释', '总结', '复杂度'],
  image: ['风格', '色彩', '构图', '细节', '氛围'],
  video: ['镜头运动', '视觉风格', '画面比例', '氛围基调', '音效'],
  code: ['语言', '框架', '功能', '优化', '测试'],
  writing: ['文体', '语气', '长度', '受众', '目的'],
  marketing: ['平台', '目标', 'CTA', '情感', '价值'],
  'image-to-prompt': [], // 图片转prompt不需要enhancement options
  'video-to-prompt': [], // 视频转prompt不需要enhancement options
  'image-edit': [], // 图片编辑不需要enhancement options
  'describe-image': [], // 图片描述不需要enhancement options
};

// 每个选项的预设值（用于下拉框）
const categoryOptionValues: Record<PromptCategory, Record<string, string[]>> = {
  general: {
    创意: ['创新', '传统', '现代', '未来主义', '复古'],
    分析: ['深度分析', '简要分析', '对比分析', '趋势分析', '数据驱动分析'],
    解释: ['简单解释', '详细解释', '技术解释', '通俗解释', '专业解释'],
    总结: ['要点总结', '详细总结', '执行摘要', '关键洞察', '行动建议'],
    复杂度: ['简单', '中等', '详细', '专业', '学术'],
  },
  image: {
    风格: [
      '写实',
      '抽象',
      '卡通',
      '水彩',
      '油画',
      '数字艺术',
      '极简主义',
      '吉普力',
    ],
    色彩: ['鲜艳', '柔和', '黑白', '暖色调', '冷色调', '单色', '渐变'],
    构图: ['居中', '三分法', '对称', '对角线', '框架式', '引导线'],
    细节: ['高细节', '中等细节', '低细节', '超写实', '风格化'],
    氛围: ['明亮', '阴暗', '神秘', '温馨', '冷酷', '梦幻', '科幻'],
  },
  video: {
    镜头运动: [
      '静止镜头',
      '缓慢平移',
      '跟踪镜头',
      '环绕镜头',
      '推拉镜头',
      '航拍视角',
      '手持抖动',
    ],
    视觉风格: [
      '电影级',
      '纪录片',
      '动画风格',
      '复古胶片',
      '赛博朋克',
      '自然写实',
      '梦幻柔焦',
    ],
    画面比例: ['16:9横屏', '9:16竖屏'],
    氛围基调: [
      '欢快活力',
      '紧张悬疑',
      '神秘奇幻',
      '温馨治愈',
      '史诗壮阔',
      '忧郁沉静',
      '激昂热血',
    ],
    音效: ['环境音效', '背景音乐', '角色对话', '无声画面'],
  },
  code: {
    语言: ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust'],
    框架: ['React', 'Vue', 'Angular', 'NextJS', 'Express', 'Django', 'Flask'],
    功能: ['CRUD操作', 'API集成', '用户认证', '数据处理', '文件操作'],
    优化: ['性能优化', '代码重构', '内存优化', '速度优化', '可维护性'],
    测试: ['单元测试', '集成测试', '端到端测试', '性能测试', '无测试'],
  },
  writing: {
    文体: ['正式', '非正式', '学术', '商业', '创意', '技术', '新闻'],
    语气: ['专业', '友好', '严肃', '幽默', '鼓励', '客观', '主观'],
    长度: ['简短', '中等', '详细', '超详细', '根据内容'],
    受众: ['普通读者', '专业人士', '学生', '企业', '技术人员', '消费者'],
    目的: ['告知', '说服', '娱乐', '教育', '销售', '建立关系'],
  },
  marketing: {
    平台: ['社交媒体', '网站', '邮件', '博客', '视频平台', '搜索引擎'],
    目标: ['品牌认知', '销售转化', '用户获取', '用户留存', '参与度'],
    CTA: ['立即购买', '免费试用', '了解更多', '立即注册', '联系我们'],
    情感: ['兴奋', '信任', '紧迫感', '归属感', '成就感', '安全感'],
    价值: ['节省时间', '节省成本', '提高效率', '创新', '质量', '便利'],
  },
  'image-to-prompt': {},
  'video-to-prompt': {},
  'image-edit': {},
  'describe-image': {},
};

export interface GeneratedImageData {
  id: string;
  inputText?: string | null;
  enhancedOptions?: Record<string, string> | null;
  prompt: string;
  generatedContent?: string | null; // Generated text content for text-based categories
  sourceImageUrl?: string | null; // For image-to-prompt: the original uploaded image URL; For video-to-prompt: the uploaded video URL
  imageUrl?: string | null; // Generated image URL
  category: string;
  modelId?: string | null;
  model?: string | null;
  aspectRatio?: string | null;
  format?: string | null;
  createdAt?: Date | null; // Creation timestamp for expiration calculation
}

export interface PromptGeneratorProps {
  defaultCategory?: PromptCategory;
  hideCategorySelector?: boolean;
  hideHeader?: boolean;
  initialData?: GeneratedImageData | null;
  showModeSwitcher?: boolean;
  onModeChange?: (mode: 'image-to-prompt' | 'text-to-prompt') => void;
  defaultDescribeImageOption?: DescribeImageOption;
}

export function PromptGenerator({
  defaultCategory = 'general',
  hideCategorySelector = false,
  hideHeader = false,
  initialData,
  showModeSwitcher = false,
  onModeChange,
  defaultDescribeImageOption,
}: PromptGeneratorProps) {
  const t = useTranslations('HomePage.promptGenerator');
  const locale = useLocale();
  const messages = useMessages();
  const { data: session } = authClient.useSession();
  const isLoggedIn = !!session?.user;

  // Login dialog state - shown when unauthenticated users try to interact
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  // Track if component is mounted to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);

  // Credits hooks - used only for displaying balance in UI
  // Credit deduction is handled by backend APIs
  const { data: creditBalance } = useCreditBalance();
  const invalidateCredits = useInvalidateCredits();
  const [input, setInput] = useState(initialData?.inputText || '');
  const [category, setCategory] = useState<PromptCategory>(
    (initialData?.category as PromptCategory) || defaultCategory
  );

  // Session storage key for persisting state across login redirects
  const SESSION_STORAGE_KEY = `prompt-generator-draft-${defaultCategory}`;

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
      if (data.imagePreview) {
        setImagePreview(data.imagePreview);
        setIsLoadedSourceImage(true);
        // Recreate uploadedImage File from data: URL so handleGenerate can use it
        if (data.imagePreview.startsWith('data:')) {
          fetch(data.imagePreview)
            .then((res) => res.blob())
            .then((blob) => {
              const file = new File([blob], 'restored-image.jpg', {
                type: blob.type || 'image/jpeg',
              });
              setUploadedImage(file);
            })
            .catch(() => {});
          // Only scroll to image if there's no enhancedResult (otherwise scroll to result)
          if (!data.enhancedResult) {
            shouldScrollToImage.current = true;
          }
        }
      }
      if (data.enhancedOptions) setEnhancedOptions(data.enhancedOptions);
      if (data.outputLanguage)
        setOutputLanguage(data.outputLanguage as OutputLanguage);
      if (data.enhancedResult) {
        setEnhancedResult(data.enhancedResult);
        shouldScrollToResult.current = true;
      }
    } catch (e) {
      console.error('Failed to restore prompt-generator draft:', e);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync category with defaultCategory when it changes (for mode switcher)
  useEffect(() => {
    if (!initialData?.category) {
      setCategory(defaultCategory);
    }
  }, [defaultCategory, initialData?.category]);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    // For image-to-prompt or describe-image category, load the source image URL from initialData
    (initialData?.category === 'image-to-prompt' ||
      initialData?.category === 'describe-image') &&
      initialData?.sourceImageUrl
      ? initialData.sourceImageUrl
      : null
  );
  // Track if the current image preview is a loaded URL (not a local file)
  const [isLoadedSourceImage, setIsLoadedSourceImage] = useState<boolean>(
    (initialData?.category === 'image-to-prompt' ||
      initialData?.category === 'describe-image') &&
      !!initialData?.sourceImageUrl
  );
  // Create uploadedImage File from initialData sourceImageUrl so the generate button is enabled
  useEffect(() => {
    if (
      (initialData?.category === 'image-to-prompt' ||
        initialData?.category === 'describe-image') &&
      initialData?.sourceImageUrl &&
      !uploadedImage
    ) {
      fetch(initialData.sourceImageUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], 'source-image.jpg', {
            type: blob.type || 'image/jpeg',
          });
          setUploadedImage(file);
        })
        .catch(() => {
          // If fetch fails (e.g. CORS), create a placeholder file
          const placeholderFile = new File([], 'source-image.jpg', {
            type: 'image/jpeg',
          });
          setUploadedImage(placeholderFile);
        });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Image URL input for image-to-prompt
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [isLoadingImageUrl, setIsLoadingImageUrl] = useState(false);
  // Image input mode: 'upload' or 'url'
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>(
    'upload'
  );
  // Selected AI model for image-to-prompt
  const [selectedImageToPromptModel, setSelectedImageToPromptModel] =
    useState<ImageToPromptModel>('general');
  // Selected AI model for video-to-prompt
  const [selectedVideoToPromptModel, setSelectedVideoToPromptModel] =
    useState<VideoToPromptModel>('veo3-cinematic');
  // Selected option for describe-image
  const [selectedDescribeImageOption, setSelectedDescribeImageOption] =
    useState<DescribeImageOption>(
      defaultDescribeImageOption || 'describe-detail'
    );
  // Output language for describe-image and image-to-prompt
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>('en');
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  // Video preview is not loaded from initialData - uploaded videos are deleted after prompt generation
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
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

  // Scroll to image upload area after it's restored from sessionStorage
  useEffect(() => {
    if (shouldScrollToImage.current && imagePreview) {
      shouldScrollToImage.current = false;
      setTimeout(() => {
        fileInputRef.current?.closest('.space-y-4')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [imagePreview]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState<
    'analyzing' | 'generating'
  >('generating');
  const [isCopied, setIsCopied] = useState(false);
  const [isDailyLimitReached, setIsDailyLimitReached] = useState(false);
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
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    initialData?.imageUrl || null
  );
  // 存储初始图片 URL（用于加载已保存的图片）
  const [loadedImageUrl, setLoadedImageUrl] = useState<string | null>(
    initialData?.imageUrl || null
  );
  // 存储当前记录的 ID（用于更新而不是创建新记录）
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(
    initialData?.id || null
  );
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [isEditingImageOpen, setIsEditingImageOpen] = useState(false);
  const [editImagePrompt, setEditImagePrompt] = useState('');
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  // 图像生成模型选择
  const [selectedImageModel, setSelectedImageModel] =
    useState<ImageGenerationModel>(
      (initialData?.model as ImageGenerationModel) || 'flux-schnell'
    );
  // 图片生成设置选项
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>(
    (initialData?.aspectRatio as AspectRatio) || '1:1'
  );
  const [selectedOutputFormat, setSelectedOutputFormat] =
    useState<OutputFormat>((initialData?.format as OutputFormat) || 'png');
  // 保存当前生成的图片格式（用于显示和下载）
  const [currentImageFormat, setCurrentImageFormat] = useState<OutputFormat>(
    (initialData?.format as OutputFormat) || 'png'
  );
  const generatedTextRef = useRef<HTMLDivElement>(null);
  const generatedImageRef = useRef<HTMLDivElement>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [analyzingProgress, setAnalyzingProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('explanations');
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
  // AI 生成模型选择（用于生成提示词）- null 表示使用后端默认模型（带 fallback 链）
  const [selectedAIModel, setSelectedAIModel] =
    useState<AIGenerationModel | null>(null);
  // 文本生成模型选择（用于根据提示词生成文本内容）
  const [selectedTextModel, setSelectedTextModel] =
    useState<TextGenerationModel>('gpt-5.2-chat');
  // 推荐组合弹窗状态
  const [isCombinationsDialogOpen, setIsCombinationsDialogOpen] =
    useState(false);
  // AI 灵感生成状态
  const [generatedIdeas, setGeneratedIdeas] = useState<string[]>([]);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const resultTextareaRef = useRef<HTMLTextAreaElement>(null);
  const shouldScrollToResult = useRef(false);
  const shouldScrollToImage = useRef(false);
  const generatedVideoRef = useRef<HTMLDivElement>(null);

  // 视频生成相关状态
  const [selectedVideoModel, setSelectedVideoModel] =
    useState<VideoGenerationModel>('sora2-10s');
  const [selectedVideoAspectRatio, setSelectedVideoAspectRatio] =
    useState<VideoAspectRatio>('16:9');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(
    (initialData?.category === 'video-to-prompt' ||
      initialData?.category === 'video') &&
      initialData?.imageUrl
      ? initialData.imageUrl
      : null
  );
  const [generatedVideoCreatedAt, setGeneratedVideoCreatedAt] =
    useState<Date | null>(
      (initialData?.category === 'video-to-prompt' ||
        initialData?.category === 'video') &&
        initialData?.createdAt
        ? new Date(initialData.createdAt)
        : null
    );
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoGenerationProgress, setVideoGenerationProgress] = useState(0);

  // Save current state to sessionStorage so it persists across login redirects
  useEffect(() => {
    if (!mounted) return;

    const data: Record<string, unknown> = {};
    if (input) data.input = input;
    if (category !== defaultCategory) data.category = category;
    if (imagePreview) data.imagePreview = imagePreview;
    if (Object.keys(enhancedOptions).length > 0)
      data.enhancedOptions = enhancedOptions;
    if (outputLanguage !== 'en') data.outputLanguage = outputLanguage;
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
    imagePreview,
    enhancedOptions,
    outputLanguage,
    enhancedResult,
    defaultCategory,
    SESSION_STORAGE_KEY,
  ]);

  // 当选择 flux2 或 grok-imagine 模型时，自动将输出格式设置为 PNG
  // 当选择 flux-schnell 时，自动将输出格式设置为 JPEG
  useEffect(() => {
    if (
      selectedImageModel === 'flux2-pro-1k' ||
      selectedImageModel === 'flux2-pro-2k' ||
      selectedImageModel === 'grok-imagine'
    ) {
      setSelectedOutputFormat('png');
    } else if (selectedImageModel === 'flux-schnell') {
      setSelectedOutputFormat('jpeg');
    }
  }, [selectedImageModel]);

  // 当切换模型时，如果当前选择的宽高比不被新模型支持，自动切换到第一个支持的宽高比
  useEffect(() => {
    const supportedRatios =
      MODEL_SUPPORTED_ASPECT_RATIOS[selectedImageModel] || [];
    if (!supportedRatios.includes(selectedAspectRatio)) {
      setSelectedAspectRatio(supportedRatios[0] || '1:1');
    }
  }, [selectedImageModel, selectedAspectRatio]);

  // Function to check daily limit
  const checkDailyLimit = useCallback(async () => {
    if (!session?.user) {
      setIsDailyLimitReached(false);
      return;
    }

    setIsDailyLimitReached(false);
  }, [session, category]);

  // Check daily limit for image-to-prompt and video-to-prompt
  useEffect(() => {
    checkDailyLimit();
  }, [checkDailyLimit]);

  // 模拟分析阶段的进度（用于 image-to-prompt 和 video-to-prompt）
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (
      isGenerating &&
      generationStage === 'analyzing' &&
      (category === 'image-to-prompt' ||
        category === 'video-to-prompt' ||
        category === 'describe-image')
    ) {
      setAnalyzingProgress(0);
      interval = setInterval(() => {
        setAnalyzingProgress((prev) => {
          if (prev >= 90) return prev; // 分析阶段最多到 90%，然后等待实际生成
          // 越接近 90% 增加越慢
          const increment = Math.max(1, (90 - prev) / 10);
          return prev + increment;
        });
      }, 300);
    } else if (generationStage !== 'analyzing') {
      setAnalyzingProgress(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating, generationStage, category]);

  // 模拟图片生成进度
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (
      isGeneratingText &&
      (category === 'image' ||
        category === 'image-to-prompt' ||
        category === 'describe-image')
    ) {
      interval = setInterval(() => {
        setGenerationProgress((prev) => {
          if (prev >= 95) return prev;
          // 越接近 100% 增加越慢
          const increment = Math.max(1, (95 - prev) / 10);
          return prev + increment;
        });
      }, 500);
    } else if (!isGeneratingText) {
      setGenerationProgress(0);
    }
    return () => clearInterval(interval);
  }, [isGeneratingText, category]);

  // Reset video progress when not generating
  useEffect(() => {
    if (!isGeneratingVideo) {
      setVideoGenerationProgress(0);
    }
  }, [isGeneratingVideo]);

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

  // 压缩图片函数
  // Check login and show dialog if not authenticated
  const requireLogin = (): boolean => {
    if (!isLoggedIn) {
      setShowLoginDialog(true);
      return true; // blocked
    }
    return false; // allowed
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type - only allow specific types (like image-editor)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert(
          t('inputSection.invalidImageType', {
            defaultValue: 'Please upload an image file (JPEG, PNG, or WebP)',
          })
        );
        return;
      }

      // 最大原始文件大小限制（50MB）
      const maxOriginalSize = 50 * 1024 * 1024;
      if (file.size > maxOriginalSize) {
        alert(
          t('inputSection.imageTooLarge', {
            defaultValue: 'Image size must be less than 50MB',
          })
        );
        return;
      }

      // Revoke old blob URL if replacing an image
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      // Use URL.createObjectURL for instant preview (no memory overhead, works on mobile)
      const preview = URL.createObjectURL(file);
      setUploadedImage(file);
      setImagePreview(preview);
    }
  };

  // Handle image URL input
  const handleImageUrlSubmit = async () => {
    let trimmedUrl = imageUrlInput.trim();
    if (!trimmedUrl) return;

    setIsLoadingImageUrl(true);
    try {
      // Handle different URL formats
      // 1. data: URLs (base64 images)
      if (trimmedUrl.startsWith('data:image/')) {
        // Create a file from data URL
        const response = await fetch(trimmedUrl);
        const blob = await response.blob();
        const file = new File([blob], 'image-from-data-url.jpg', {
          type: blob.type || 'image/jpeg',
        });
        setUploadedImage(file);
        setImagePreview(trimmedUrl);
        setIsLoadedSourceImage(true);
        setImageUrlInput('');
        setIsLoadingImageUrl(false);
        return;
      }

      // 2. Protocol-relative URLs (//example.com/image.jpg)
      if (trimmedUrl.startsWith('//')) {
        trimmedUrl = 'https:' + trimmedUrl;
      }

      // 3. URLs without protocol (example.com/image.jpg)
      if (
        !trimmedUrl.startsWith('http://') &&
        !trimmedUrl.startsWith('https://')
      ) {
        trimmedUrl = 'https://' + trimmedUrl;
      }

      // Validate URL format
      let url: URL;
      try {
        url = new URL(trimmedUrl);
      } catch {
        alert(
          t('inputSection.invalidUrlFormat', {
            defaultValue:
              'Please enter a valid URL (e.g., https://example.com/image.jpg)',
          })
        );
        setIsLoadingImageUrl(false);
        return;
      }

      // Try to load the image to verify it's valid
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image from URL'));
        img.src = trimmedUrl;
      });

      // Try to fetch the image blob, but if CORS fails, still use the URL
      try {
        const response = await fetch(trimmedUrl);
        const blob = await response.blob();
        const file = new File([blob], 'image-from-url.jpg', {
          type: blob.type || 'image/jpeg',
        });
        setUploadedImage(file);
      } catch {
        // CORS might block fetch, create a placeholder file
        // The actual image will be fetched server-side using the URL
        const placeholderFile = new File([], 'image-from-url.jpg', {
          type: 'image/jpeg',
        });
        setUploadedImage(placeholderFile);
      }

      setImagePreview(trimmedUrl);
      setIsLoadedSourceImage(true);
      setImageUrlInput('');
    } catch (error) {
      console.error('Image URL error:', error);
      alert(
        t('inputSection.invalidImageUrl', {
          defaultValue: 'Failed to load image from URL. Please check the URL.',
        })
      );
    } finally {
      setIsLoadingImageUrl(false);
    }
  };

  const handleRemoveImage = () => {
    // Clean up blob URL to prevent memory leaks
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setUploadedImage(null);
    setImagePreview(null);
    setIsLoadedSourceImage(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 根据视频时长自动计算需要提取的关键帧数量
  const calculateFrameCount = (duration: number): number => {
    // 短视频（< 10秒）：5帧
    if (duration < 10) {
      return 5;
    }
    // 中等视频（10-30秒）：6帧
    if (duration < 30) {
      return 6;
    }
    // 长视频（30-60秒）：7帧
    if (duration < 60) {
      return 7;
    }
    // 超长视频（60-120秒）：8帧
    if (duration < 120) {
      return 8;
    }
    // 极长视频（>= 120秒）：9帧
    return 9;
  };

  // 从视频中提取关键帧（根据视频长度自动选择帧数）
  const extractVideoFrames = async (videoFile: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const videoUrl = URL.createObjectURL(videoFile);

      if (!ctx) {
        URL.revokeObjectURL(videoUrl);
        reject(new Error('Canvas context not available'));
        return;
      }

      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      const cleanup = () => {
        URL.revokeObjectURL(videoUrl);
      };

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const duration = video.duration;
        if (duration === 0 || isNaN(duration)) {
          cleanup();
          reject(new Error('Invalid video duration'));
          return;
        }

        // 根据视频时长自动计算帧数
        const frameCount = calculateFrameCount(duration);
        const interval = duration / (frameCount + 1); // 均匀分布帧
        const frames: string[] = [];
        let loadedFrames = 0;

        const captureFrame = (time: number) => {
          video.currentTime = Math.min(time, duration - 0.1); // 确保不超过视频长度
        };

        video.onseeked = () => {
          try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
            frames.push(base64);
            loadedFrames++;

            if (loadedFrames < frameCount) {
              captureFrame((loadedFrames + 1) * interval);
            } else {
              cleanup();
              resolve(frames);
            }
          } catch (error) {
            cleanup();
            reject(
              error instanceof Error
                ? error
                : new Error('Failed to extract frame')
            );
          }
        };

        video.onerror = () => {
          cleanup();
          reject(new Error('Failed to load video'));
        };

        // 开始提取第一帧
        captureFrame(interval);
      };

      video.onerror = () => {
        cleanup();
        reject(new Error('Failed to load video'));
      };

      video.src = videoUrl;
    });
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('video/')) {
        alert(
          t('inputSection.invalidVideoType', {
            defaultValue: 'Please upload a video file',
          })
        );
        return;
      }

      // 验证文件大小（5MB）
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert(
          t('inputSection.videoTooLarge', {
            defaultValue: 'Video size must be less than 5MB',
          })
        );
        return;
      }

      setUploadedVideo(file);
      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);

      // 上传视频到 R2
      setIsUploadingVideo(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/storage/upload-video', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to upload video');
        }

        const result = await response.json();
        setUploadedVideoUrl(result.url);
        console.log('Video uploaded to R2:', result.url);
      } catch (error) {
        console.error('Error uploading video to R2:', error);
        alert(
          (t as any)('inputSection.videoUploadError', {
            defaultValue: 'Failed to upload video. Please try again.',
          })
        );
        setUploadedVideo(null);
        setVideoPreview(null);
      } finally {
        setIsUploadingVideo(false);
      }
    }
  };

  // 压缩图片函数 - 将大图片压缩到合适的尺寸
  const compressImage = async (
    file: File,
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.8
  ): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const objectUrl = URL.createObjectURL(file);

      const cleanup = () => {
        URL.revokeObjectURL(objectUrl);
      };

      img.onload = () => {
        try {
          let { width, height } = img;

          // 计算缩放比例
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;

          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            const base64 = dataUrl.split(',')[1];
            cleanup();
            resolve({ base64, mimeType: 'image/jpeg' });
          } else {
            cleanup();
            reject(new Error('Failed to get canvas context'));
          }
        } catch (error) {
          cleanup();
          reject(error);
        }
      };

      img.onerror = () => {
        cleanup();
        reject(new Error('Failed to load image'));
      };

      img.src = objectUrl;
    });
  };

  const handleRemoveVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setUploadedVideo(null);
    setVideoPreview(null);
    setUploadedVideoUrl(null);
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
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
          category,
          preset: appliedCombination || undefined,
          enhancementOptions: translatedOptions,
          locale,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate ideas');
      }

      const data = await response.json();
      if (data.ideas && Array.isArray(data.ideas)) {
        setGeneratedIdeas(data.ideas);
      }
    } catch (error) {
      console.error('Failed to generate ideas:', error);
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  const handleGenerate = async () => {
    // 对于图片转prompt或描述图片，需要上传图片
    if (
      (category === 'image-to-prompt' || category === 'describe-image') &&
      !uploadedImage
    ) {
      alert(
        t('inputSection.imageRequired', {
          defaultValue: 'Please upload an image',
        })
      );
      return;
    }

    // 对于视频转prompt，需要上传视频
    if (category === 'video-to-prompt' && !uploadedVideo) {
      alert(
        t('inputSection.videoRequired', {
          defaultValue: 'Please upload a video',
        })
      );
      return;
    }

    // 对于其他类别，需要输入文本
    if (
      category !== 'image-to-prompt' &&
      category !== 'video-to-prompt' &&
      category !== 'describe-image' &&
      !input.trim()
    ) {
      return;
    }

    // 【改进】立即设置加载状态，给用户即时反馈
    setIsGenerating(true);
    setGenerationStage('analyzing');
    // 清空之前的结果，显示结果框以便聚焦
    setEnhancedResult('');
    // 重置 AI Edit 相关状态
    setIsAiEditedResult(false);
    setPreviousResult('');

    // 使用 setTimeout 确保 DOM 更新后再聚焦和滚动
    setTimeout(() => {
      if (resultTextareaRef.current) {
        resultTextareaRef.current.focus();
        resultTextareaRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }, 100);

    // Prompt generation is free - no credit check needed
    // Uses free models: gpt-4o-mini, gemini-2.5-flash-lite

    try {
      // 如果是图片转prompt，需要将图片转换为base64（压缩后）
      let imageBase64: string | undefined;
      let compressedMimeType: string | undefined;
      if (
        (category === 'image-to-prompt' || category === 'describe-image') &&
        uploadedImage
      ) {
        // 压缩图片到最大 1024x1024，质量 0.8
        const compressed = await compressImage(uploadedImage, 1024, 1024, 0.8);
        imageBase64 = compressed.base64;
        compressedMimeType = compressed.mimeType;
      }

      // 视频转prompt：始终提取关键帧供 Qwen3 VL 使用（仅支持图片格式）
      // videoUrl（R2）作为备用传给 Gemini（支持直接处理视频 URL）
      let videoFrames: string[] | undefined;
      if (category === 'video-to-prompt' && uploadedVideo) {
        videoFrames = await extractVideoFrames(uploadedVideo);
      }

      // 将 enhancementOptions 中的中文键值翻译成英文（根据当前语言环境）
      let translatedEnhancementOptions: Record<string, string> | undefined;
      if (
        category !== 'image-to-prompt' &&
        category !== 'video-to-prompt' &&
        category !== 'describe-image' &&
        Object.keys(enhancedOptions).length > 0
      ) {
        translatedEnhancementOptions = {};
        for (const [key, value] of Object.entries(enhancedOptions)) {
          if (value) {
            // 翻译键名
            const translatedKey = getCategoryOptionLabel(category, key);
            // 翻译值
            const translatedValue = getOptionValueLabel(category, key, value);
            translatedEnhancementOptions[translatedKey] = translatedValue;
          }
        }
      }

      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input:
            category === 'image-to-prompt' ||
            category === 'video-to-prompt' ||
            category === 'describe-image'
              ? ''
              : input,
          category,
          imageBase64: imageBase64,
          imageMimeType: compressedMimeType || uploadedImage?.type,
          videoFrames: videoFrames,
          videoMimeType: uploadedVideo?.type,
          videoUrl: uploadedVideoUrl, // Pass R2 video URL to API
          enhancementOptions: translatedEnhancementOptions,
          customEnhancement:
            category !== 'image-to-prompt' &&
            category !== 'video-to-prompt' &&
            category !== 'describe-image'
              ? customEnhancement.trim() || undefined
              : undefined,
          locale,
          // Pass selected AI model for image-to-prompt
          imageToPromptModel:
            category === 'image-to-prompt'
              ? selectedImageToPromptModel
              : undefined,
          // Pass selected AI model for video-to-prompt
          videoToPromptModel:
            category === 'video-to-prompt'
              ? selectedVideoToPromptModel
              : undefined,
          // Pass selected option for describe-image
          describeImageOption:
            category === 'describe-image'
              ? selectedDescribeImageOption
              : undefined,
          // Pass output language for describe-image and image-to-prompt
          outputLanguage:
            category === 'describe-image' || category === 'image-to-prompt'
              ? outputLanguage
              : undefined,
          // Pass selected AI model for general category
          aiModel:
            category !== 'image-to-prompt' &&
            category !== 'video-to-prompt' &&
            category !== 'describe-image'
              ? AI_GENERATION_MODELS.find((m) => m.id === selectedAIModel)
                  ?.modelId
              : undefined,
        }),
      });

      if (!response.ok) {
        // 尝试解析错误响应
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate prompt');
        } catch (e) {
          if (e instanceof Error) {
            throw e;
          }
          throw new Error('Failed to generate prompt');
        }
      }

      // 检查是否是流式响应
      const contentType = response.headers.get('content-type');
      const isStreaming =
        contentType?.includes('text/event-stream') || response.body !== null;

      // Declare finalPrompt outside the if/else blocks so it's accessible later
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

          // 流式输出完成后，提取 Prompt 部分（仅对非 image-to-prompt, video-to-prompt 和 describe-image 类别）
          finalPrompt = accumulatedText;
          if (
            category !== 'image-to-prompt' &&
            category !== 'video-to-prompt' &&
            category !== 'describe-image'
          ) {
            finalPrompt = extractPromptContent(accumulatedText);
            setEnhancedResult(finalPrompt);
          }

          // 保存生成的提示词到数据库（如果还没有记录）
          // 注意：此时不保存 model/aspectRatio/format，因为用户可能还没选择
          // 这些参数会在生成图片时更新
          if (
            isLoggedIn &&
            !currentRecordId &&
            (category === 'image' ||
              category === 'general' ||
              category === 'writing' ||
              category === 'marketing' ||
              category === 'code')
          ) {
            const saveResult = await saveGeneratedPromptAction({
              inputText: input,
              enhancedOptions:
                Object.keys(enhancedOptions).length > 0
                  ? JSON.stringify(enhancedOptions)
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
                saveResult?.data?.error || saveResult?.serverError
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
          !currentRecordId &&
          (category === 'image' ||
            category === 'general' ||
            category === 'writing' ||
            category === 'marketing' ||
            category === 'code')
        ) {
          const saveResult = await saveGeneratedPromptAction({
            inputText: input,
            enhancedOptions:
              Object.keys(enhancedOptions).length > 0
                ? JSON.stringify(enhancedOptions)
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
              saveResult?.data?.error || saveResult?.serverError
            );
          }
        }
      }

      // 保存 video-to-prompt 记录到数据库
      if (isLoggedIn && category === 'video-to-prompt') {
        // 只有在 finalPrompt 有内容时才保存
        if (finalPrompt.trim()) {
          const saveResult = await saveVideoToPromptAction({
            prompt: finalPrompt,
          });
          console.log('saveVideoToPromptAction result:', saveResult);
          if (saveResult?.data?.success && saveResult.data.id) {
            setCurrentRecordId(saveResult.data.id);
            console.log('Saved video-to-prompt with id:', saveResult.data.id);
            // Refresh daily limit status
            checkDailyLimit();
          } else {
            // 处理验证错误
            const validationError = saveResult?.validationErrors;
            const errorMsg =
              saveResult?.data?.error ||
              saveResult?.serverError ||
              'Unknown error';
            console.error(
              'Failed to save video-to-prompt:',
              errorMsg,
              validationError
                ? `(Validation: ${JSON.stringify(validationError)})`
                : ''
            );
          }
        } else {
          console.warn('Skipping save video-to-prompt: finalPrompt is empty');
        }

        // Delete the uploaded video from R2 after prompt generation
        if (uploadedVideoUrl) {
          try {
            const deleteResponse = await fetch('/api/storage/delete-video', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ url: uploadedVideoUrl }),
            });
            if (deleteResponse.ok) {
              console.log('Deleted uploaded video from R2:', uploadedVideoUrl);
            } else {
              console.error(
                'Failed to delete uploaded video:',
                await deleteResponse.text()
              );
            }
          } catch (deleteError) {
            console.error('Error deleting uploaded video:', deleteError);
          }
        }
      }

      // 保存 image-to-prompt 记录到数据库（需要登录）
      if (isLoggedIn && category === 'image-to-prompt') {
        // 只有在 finalPrompt 有内容时才保存
        if (finalPrompt.trim() && imageBase64) {
          const saveResult = await saveImageToPromptAction({
            imageBase64: imageBase64,
            imageMimeType: compressedMimeType || uploadedImage?.type,
            prompt: finalPrompt,
          });
          console.log('saveImageToPromptAction result:', saveResult);
          if (saveResult?.data?.success && saveResult.data.id) {
            setCurrentRecordId(saveResult.data.id);
            console.log('Saved image-to-prompt with id:', saveResult.data.id);
            // Refresh daily limit status
            checkDailyLimit();
          } else {
            // 处理验证错误
            const validationError = saveResult?.validationErrors;
            const errorMsg =
              saveResult?.data?.error ||
              saveResult?.serverError ||
              'Unknown error';
            console.error(
              'Failed to save image-to-prompt:',
              errorMsg,
              validationError
                ? `(Validation: ${JSON.stringify(validationError)})`
                : ''
            );
          }
        } else {
          console.warn(
            'Skipping save image-to-prompt: finalPrompt or imageBase64 is empty'
          );
        }
      }

      // 保存 describe-image 记录到数据库（需要登录）
      if (isLoggedIn && category === 'describe-image') {
        // 只有在 finalPrompt 有内容时才保存
        if (finalPrompt.trim() && imageBase64) {
          const saveResult = await saveDescribeImageAction({
            imageBase64: imageBase64,
            imageMimeType: compressedMimeType || uploadedImage?.type,
            prompt: finalPrompt,
          });
          console.log('saveDescribeImageAction result:', saveResult);
          if (saveResult?.data?.success && saveResult.data.id) {
            setCurrentRecordId(saveResult.data.id);
            console.log('Saved describe-image with id:', saveResult.data.id);
            // Refresh daily limit status
            checkDailyLimit();
          } else {
            // 处理验证错误
            const validationError = saveResult?.validationErrors;
            const errorMsg =
              saveResult?.data?.error ||
              saveResult?.serverError ||
              'Unknown error';
            console.error(
              'Failed to save describe-image:',
              errorMsg,
              validationError
                ? `(Validation: ${JSON.stringify(validationError)})`
                : ''
            );
          }
        } else {
          console.warn(
            'Skipping save describe-image: finalPrompt or imageBase64 is empty'
          );
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
        throw new Error('Continue conversation failed');
      }

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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to translate prompt');
      }

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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to translate text');
      }

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
    if (!enhancedResult.trim()) {
      return;
    }

    // Check credits before starting generation for image category
    if (
      category === 'image' ||
      category === 'image-to-prompt' ||
      category === 'describe-image'
    ) {
      const imageModelConfig = IMAGE_GENERATION_MODELS.find(
        (m) => m.id === selectedImageModel
      );
      const requiredCredits = imageModelConfig?.credits || 0;

      if (creditBalance !== undefined && creditBalance < requiredCredits) {
        alert(
          t('errors.insufficientCredits', {
            required: requiredCredits,
            current: creditBalance,
            defaultValue: `Insufficient credits. Required: ${requiredCredits} credits, Current balance: ${creditBalance} credits. Please purchase more credits to continue.`,
          })
        );
        return;
      }
    }

    // 立即进入加载状态并滚动，提供即时反馈
    setIsGeneratingText(true);

    if (
      category === 'image' ||
      category === 'image-to-prompt' ||
      category === 'describe-image'
    ) {
      setGenerationProgress(10);
      setGeneratedImage(null);
      setGeneratedImageUrl(null);
      // 不立即滚动，让用户可以继续查看提示词
      // 图片生成完成后再自动滚动到图片区域
    } else {
      setGeneratedText('');
      setTimeout(() => {
        if (generatedTextRef.current) {
          generatedTextRef.current.focus();
          generatedTextRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }, 50);
    }

    // 如果是 image 或 image-to-prompt category，调用相应 API 生成图片
    if (category === 'image' || category === 'image-to-prompt') {
      try {
        // 根据选择的模型决定使用哪个 API
        const isFluxSchnell = selectedImageModel === 'flux-schnell';
        const apiEndpoint = isFluxSchnell
          ? '/api/generate-flux-schnell'
          : '/api/generate-nano-banana-image';

        const requestBody = isFluxSchnell
          ? {
              prompt: enhancedResult,
              output_format: selectedOutputFormat,
              aspect_ratio: selectedAspectRatio,
              num_outputs: 1,
              num_inference_steps: 4,
              go_fast: true,
              output_quality: 80,
            }
          : {
              prompt: enhancedResult,
              output_format: selectedOutputFormat,
              image_size: selectedAspectRatio,
              model: selectedImageModel,
            };

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to generate image');
        }

        const data = await response.json();
        if (data.image) {
          // Credits are deducted by the backend API - no frontend deduction needed
          // Invalidate credits cache to update UI
          invalidateCredits();

          setGeneratedImage(data.image);
          setGeneratedImageUrl(data.imageUrl || null);
          // 保存当前生成的图片格式
          setCurrentImageFormat(selectedOutputFormat);

          // 图片生成完成后，自动滚动到图片区域
          setTimeout(() => {
            if (generatedImageRef.current) {
              generatedImageRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              });
            }
          }, 100);

          // Update the existing record with the generated image
          if (currentRecordId) {
            console.log('Updating record with image:', currentRecordId);
            const updateResult = await updateGeneratedImageAction({
              id: currentRecordId,
              imageBase64: data.image,
              imageUrl: data.imageUrl,
              model: selectedImageModel,
              aspectRatio: selectedAspectRatio,
              format: selectedOutputFormat,
            });

            if (updateResult?.data?.success) {
              console.log('Image updated successfully!');
              // Clear the loaded image URL since we now have a new generated image
              setLoadedImageUrl(null);
            } else {
              console.error(
                'Failed to update image:',
                updateResult?.data?.error || updateResult?.serverError
              );
            }
          } else {
            // Fallback: save prompt first then update (shouldn't happen normally)
            console.log('No currentRecordId, saving prompt first...');
            const saveResult = await saveGeneratedPromptAction({
              inputText: input,
              enhancedOptions:
                Object.keys(enhancedOptions).length > 0
                  ? JSON.stringify(enhancedOptions)
                  : undefined,
              prompt: enhancedResult,
              category: 'image',
            });

            if (saveResult?.data?.success && saveResult.data.id) {
              setCurrentRecordId(saveResult.data.id);
              // Now update with image and generation parameters
              const updateResult = await updateGeneratedImageAction({
                id: saveResult.data.id,
                imageBase64: data.image,
                imageUrl: data.imageUrl,
                model: selectedImageModel,
                aspectRatio: selectedAspectRatio,
                format: selectedOutputFormat,
              });
              if (!updateResult?.data?.success) {
                console.error(
                  'Failed to update image:',
                  updateResult?.data?.error || updateResult?.serverError
                );
              }
            }
          }
        } else {
          throw new Error('No image in response');
        }
      } catch (error) {
        console.error('Error generating image:', error);
        // Credits are handled by backend - no need to record failed transaction here
        alert(
          error instanceof Error
            ? `Error: ${error.message}`
            : 'Failed to generate image. Please try again.'
        );
      } finally {
        setIsGeneratingText(false);
      }
      return;
    }

    // 免费内容生成类别（marketing, writing, general）使用免费模型，不需要 credits
    const useFreeModel =
      category === 'marketing' ||
      category === 'writing' ||
      category === 'general';

    if (!useFreeModel) {
      // Check credits before starting text generation
      const textModelConfig = TEXT_GENERATION_MODELS.find(
        (m) => m.id === selectedTextModel
      );
      const requiredCredits = textModelConfig?.credits || 0;

      if (creditBalance !== undefined && creditBalance < requiredCredits) {
        alert(
          t('errors.insufficientCredits', {
            required: requiredCredits,
            current: creditBalance,
            defaultValue: `Insufficient credits. Required: ${requiredCredits} credits, Current balance: ${creditBalance} credits. Please purchase more credits to continue.`,
          })
        );
        setIsGeneratingText(false);
        return;
      }
    }

    try {
      const selectedTextModelId = useFreeModel
        ? undefined
        : TEXT_GENERATION_MODELS.find((m) => m.id === selectedTextModel)
            ?.modelId;
      const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: enhancedResult,
          locale,
          ...(useFreeModel
            ? { useFreeModel: true }
            : { model: selectedTextModelId }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || errorData.message || 'Failed to generate text';
        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let hasContent = false;

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
              // OpenRouter API 格式: choices[0].delta.content
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                accumulatedText += content;
                setGeneratedText(accumulatedText);
                hasContent = true;
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }

      // 文本生成成功后才扣除积分
      if (hasContent) {
        // Credits are deducted by the backend API - no frontend deduction needed
        // Invalidate credits cache to update UI
        invalidateCredits();

        // 保存生成的文案内容到数据库（对于 general, writing, marketing, code 类别）
        console.log('Checking save conditions:', {
          currentRecordId,
          category,
          accumulatedTextLength: accumulatedText.length,
        });
        if (
          currentRecordId &&
          (category === 'general' ||
            category === 'writing' ||
            category === 'marketing' ||
            category === 'code')
        ) {
          // Update the existing record with generated content
          console.log('Updating record with generated content:', {
            id: currentRecordId,
            contentLength: accumulatedText.length,
          });
          const updateResult = await updateGeneratedImageAction({
            id: currentRecordId,
            generatedContent: accumulatedText,
          });

          console.log('Update result:', updateResult);
          if (!updateResult?.data?.success) {
            console.error(
              'Failed to update generated content:',
              updateResult?.data?.error || updateResult?.serverError
            );
          } else {
            console.log(
              'Updated generated content for record:',
              currentRecordId
            );
          }
        } else {
          console.log('Skipping save: conditions not met', {
            hasCurrentRecordId: !!currentRecordId,
            category,
            isTextCategory:
              category === 'general' ||
              category === 'writing' ||
              category === 'marketing' ||
              category === 'code',
          });
        }
      }
    } catch (error) {
      console.error('Error generating text:', error);
      // Credits are handled by backend - no need to record failed transaction here
      setGeneratedText(
        error instanceof Error
          ? `Error: ${error.message}`
          : 'Failed to generate text. Please try again.'
      );
    } finally {
      setIsGeneratingText(false);
    }
  };

  // Helper to save generated video URL to database
  const saveVideoToDatabase = async (videoUrl: string) => {
    if (currentRecordId && category === 'video-to-prompt') {
      try {
        const updateResult = await updateVideoToPromptAction({
          id: currentRecordId,
          generatedVideoUrl: videoUrl,
          model: selectedVideoModel,
          aspectRatio: selectedVideoAspectRatio,
        });
        if (updateResult?.data?.success) {
          console.log(
            'Updated video-to-prompt with generated video:',
            currentRecordId
          );
        } else {
          console.error(
            'Failed to update video-to-prompt:',
            updateResult?.data?.error
          );
        }
      } catch (updateError) {
        console.error('Error updating video-to-prompt:', updateError);
      }
    }

    if (category === 'video') {
      try {
        if (currentRecordId) {
          const updateResult = await updateGeneratedImageAction({
            id: currentRecordId,
            imageUrl: videoUrl,
            model: selectedVideoModel,
            aspectRatio: selectedVideoAspectRatio,
          });
          if (updateResult?.data?.success) {
            console.log(
              'Updated video record with generated video:',
              currentRecordId
            );
          } else {
            console.error(
              'Failed to update video record:',
              updateResult?.data?.error
            );
          }
        } else {
          const saveResult = await saveGeneratedPromptAction({
            inputText: input,
            enhancedOptions: JSON.stringify(enhancedOptions),
            prompt: enhancedResult,
            category: 'video',
            model: selectedVideoModel,
            aspectRatio: selectedVideoAspectRatio,
          });
          if (saveResult?.data?.success && saveResult.data.id) {
            setCurrentRecordId(saveResult.data.id);
            const updateResult = await updateGeneratedImageAction({
              id: saveResult.data.id,
              imageUrl: videoUrl,
              model: selectedVideoModel,
              aspectRatio: selectedVideoAspectRatio,
            });
            if (updateResult?.data?.success) {
              console.log(
                'Created and updated video record:',
                saveResult.data.id
              );
            }
          }
        }
      } catch (saveError) {
        console.error('Failed to save video record:', saveError);
      }
    }
  };

  // 视频生成处理函数
  const handleGenerateVideo = async () => {
    if (!enhancedResult.trim()) {
      return;
    }

    // Check credits before starting video generation
    const videoModelConfig = VIDEO_GENERATION_MODELS.find(
      (m) => m.id === selectedVideoModel
    );
    const requiredCredits = videoModelConfig?.credits || 0;

    if (creditBalance !== undefined && creditBalance < requiredCredits) {
      alert(
        t('errors.insufficientCredits', {
          required: requiredCredits,
          current: creditBalance,
          defaultValue: `Insufficient credits. Required: ${requiredCredits} credits, Current balance: ${creditBalance} credits. Please purchase more credits to continue.`,
        })
      );
      return;
    }

    // 立即进入加载状态
    setIsGeneratingVideo(true);
    setVideoGenerationProgress(5);
    setGeneratedVideoUrl(null);

    try {
      // 根据选择的模型确定使用哪个 API
      const isSora2Model =
        selectedVideoModel === 'sora2-10s' ||
        selectedVideoModel === 'sora2-15s';
      const isSora2ProModel =
        selectedVideoModel === 'sora2-pro-10s' ||
        selectedVideoModel === 'sora2-pro-15s';
      const isSoraModel = isSora2Model || isSora2ProModel;

      // 根据模型选择正确的 API 端点
      let apiEndpoint: string;
      if (isSora2ProModel) {
        apiEndpoint = '/api/generate-sora-pro-video';
      } else if (isSora2Model) {
        apiEndpoint = '/api/generate-sora-video';
      } else {
        apiEndpoint = '/api/generate-veo-video';
      }

      // Sora 系列使用 portrait/landscape，Veo 使用 16:9/9:16
      const aspectRatioParam = isSoraModel
        ? selectedVideoAspectRatio === '9:16'
          ? 'portrait'
          : 'landscape'
        : selectedVideoAspectRatio;

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: enhancedResult,
          model: selectedVideoModel,
          aspect_ratio: aspectRatioParam,
          enableTranslation: !isSoraModel, // Sora 系列不需要翻译参数
          remove_watermark: isSoraModel ? true : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate video');
      }

      const data = await response.json();

      // All models use client-side polling (submit+poll pattern for Vercel compatibility)
      if (data.taskId && data.status === 'processing') {
        const taskId = data.taskId;
        const taskModel = data.model || selectedVideoModel;
        // Choose the correct status endpoint based on model type
        const statusEndpoint = isSoraModel
          ? '/api/generate-sora-video/status'
          : '/api/generate-veo-video/status';
        const maxPollAttempts = 180; // ~9 minutes at 3s intervals
        let pollAttempts = 0;

        await new Promise<void>((resolve, reject) => {
          const intervalId = setInterval(async () => {
            pollAttempts++;

            // Update progress (5% to 95% during polling)
            const progress = Math.min(
              5 + Math.floor((pollAttempts / maxPollAttempts) * 90),
              95
            );
            setVideoGenerationProgress(progress);

            if (pollAttempts >= maxPollAttempts) {
              clearInterval(intervalId);
              reject(
                new Error(
                  'Video generation is taking longer than expected. Please check back later.'
                )
              );
              return;
            }

            try {
              const statusRes = await fetch(
                `${statusEndpoint}?taskId=${taskId}&model=${taskModel}`
              );
              const statusData = await statusRes.json();

              if (statusData.status === 'completed' && statusData.videoUrl) {
                clearInterval(intervalId);

                // Credits are deducted by the status API
                invalidateCredits();

                setGeneratedVideoUrl(statusData.videoUrl);
                setVideoGenerationProgress(100);
                setGeneratedVideoCreatedAt(new Date());

                // Save the generated video URL to the database
                await saveVideoToDatabase(statusData.videoUrl);

                // 自动滚动到视频区域
                setTimeout(() => {
                  if (generatedVideoRef.current) {
                    generatedVideoRef.current.scrollIntoView({
                      behavior: 'smooth',
                      block: 'center',
                    });
                  }
                }, 100);

                resolve();
              } else if (statusData.status === 'failed') {
                clearInterval(intervalId);
                reject(
                  new Error(statusData.error || 'Video generation failed')
                );
              }
              // status === 'processing' → continue polling
            } catch (pollError) {
              // Network error during polling - continue trying
              console.error('Poll error:', pollError);
            }
          }, 3000);
        });

        return;
      }

      throw new Error('No taskId in response');
    } catch (error) {
      console.error('Error generating video:', error);
      // Credits are handled by backend - no need to record failed transaction here
      alert(
        error instanceof Error
          ? `Error: ${error.message}`
          : 'Failed to generate video. Please try again.'
      );
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleEditImage = async () => {
    if (!editImagePrompt.trim() || !generatedImageUrl) {
      if (!generatedImageUrl) {
        alert(
          t('editImage.noImageUrl', {
            defaultValue:
              'Image URL is required for editing. Please regenerate the image.',
          })
        );
      }
      return;
    }

    setIsEditingImage(true);
    setIsEditingImageOpen(false);
    const originalPrompt = editImagePrompt;
    setEditImagePrompt('');

    try {
      const response = await fetch('/api/generate-nano-banana-edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: originalPrompt,
          image_urls: [generatedImageUrl],
          output_format: 'png',
          image_size: '1:1',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to edit image');
      }

      const data = await response.json();
      if (data.image) {
        // Invalidate credits cache to update UI
        invalidateCredits();

        setGeneratedImage(data.image);
        setGeneratedImageUrl(data.imageUrl || generatedImageUrl);

        // Update the existing record with the edited image
        if (currentRecordId) {
          const updateResult = await updateGeneratedImageAction({
            id: currentRecordId,
            imageBase64: data.image,
            imageUrl: data.imageUrl,
            prompt: originalPrompt,
            modelId: data.taskId,
          });

          if (!updateResult?.data?.success) {
            console.error(
              'Failed to update edited image:',
              updateResult?.data?.error || updateResult?.serverError
            );
          }
        }
      } else {
        throw new Error('No image in response');
      }
    } catch (error) {
      console.error('Error editing image:', error);
      alert(
        error instanceof Error
          ? `Error: ${error.message}`
          : 'Failed to edit image. Please try again.'
      );
    } finally {
      setIsEditingImage(false);
    }
  };

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
      // 对于不同类别，使用不同的编辑提示模板
      const isImageCategory =
        category === 'image' ||
        category === 'image-to-prompt' ||
        category === 'describe-image';
      const isVideoCategory = category === 'video';
      const isVideoToPromptCategory = category === 'video-to-prompt';

      let editInput: string;

      if (isImageCategory) {
        // 图片类别：精简输出
        editInput = `Original prompt:\n${originalPrompt}\n\nModification instruction: ${instruction}\n\nIMPORTANT: Generate a CONCISE, single-paragraph image prompt (100-300 words maximum). Output ONLY the modified prompt text, no explanations, headers, or bullet points.`;
      } else if (isVideoCategory || isVideoToPromptCategory) {
        // 视频类别和视频转提示词类别：强调保留核心内容，只输出纯提示词
        editInput = `Original video prompt:\n${originalPrompt}\n\nModification instruction: ${instruction}\n\nCRITICAL REQUIREMENTS:
1. PRESERVE the original core elements: main subject/character descriptions, key actions, scene setting, and original camera movements (unless specifically asked to change them).
2. Apply the modification while keeping the essence of the original prompt intact.
3. Output ONLY the modified prompt in a single, flowing paragraph format.
4. Do NOT add ANY explanations, introductions, headers, bullet points, meta-commentary, or phrases like "Here is the modified prompt:" or "Modified version:".
5. Start directly with the prompt content itself.
6. The output should be a complete, ready-to-use video generation prompt that can be immediately used in video generation APIs.`;
      } else {
        // 通用类别
        editInput = `${originalPrompt}\n\nPlease modify the above prompt according to the following instruction: ${instruction}`;
      }

      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: editInput,
          // 根据类别选择合适的 API 类别
          category: isImageCategory
            ? 'image'
            : isVideoCategory || isVideoToPromptCategory
              ? 'video'
              : 'general',
          locale,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to edit prompt');
      }

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
      <div className="space-y-8">
        {/* Header */}
        {!hideHeader && (
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">{t('title')}</h2>
            <p className="text-muted-foreground text-lg">{t('subtitle')}</p>
          </div>
        )}

        {/* Input Section with Mode Switcher - 仅图片/视频相关类别显示 */}
        {(category === 'image-to-prompt' || category === 'video-to-prompt' || category === 'describe-image' || showModeSwitcher) && (
        <div className="space-y-2">
          {/* Mode Switcher for Image-to-Prompt / Text-to-Prompt */}
          {showModeSwitcher && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setCategory('image-to-prompt');
                  // 清空选项和结果
                  setEnhancedOptions({});
                  setCustomEnhancement('');
                  setEnhancedResult('');
                  setUploadedImage(null);
                  setImagePreview(null);
                  setGeneratedImage(null);
                  setGeneratedImageUrl(null);
                  setGeneratedText('');
                  setInput('');
                  onModeChange?.('image-to-prompt');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  category === 'image-to-prompt'
                    ? 'bg-primary/20 text-primary border-2 border-primary'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <ImageIcon className="size-4" />
                {t('modeSwitcher.imageToPrompt', {
                  defaultValue: 'Image to Prompt',
                })}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCategory('image');
                  // 清空选项和结果
                  setEnhancedOptions({});
                  setCustomEnhancement('');
                  setEnhancedResult('');
                  setUploadedImage(null);
                  setImagePreview(null);
                  setGeneratedImage(null);
                  setGeneratedImageUrl(null);
                  setGeneratedText('');
                  setInput('');
                  onModeChange?.('text-to-prompt');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  category === 'image'
                    ? 'bg-primary/20 text-primary border-2 border-primary'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <LayoutTemplate className="size-4" />
                {t('modeSwitcher.textToPrompt', {
                  defaultValue: 'Text to Prompt',
                })}
              </button>
            </div>
          )}

          <Card>
            <CardContent className="space-y-4 pt-6">
              {!hideCategorySelector && (
                <div className="space-y-2">
                  <Label htmlFor="category-select">
                    {t('inputSection.categoryLabel')}
                  </Label>
                  <Select
                    value={category}
                    onValueChange={(value) => {
                      setCategory(value as PromptCategory);
                      // 清空选项和结果当类别改变时
                      setEnhancedOptions({});
                      setAppliedCombination(null);
                      setAppliedCombinationKey(null);
                      setCustomEnhancement('');
                      setEnhancedResult('');
                      setGeneratedIdeas([]);
                      setUploadedImage(null);
                      setImagePreview(null);
                      setUploadedVideo(null);
                      setGeneratedImage(null);
                      setGeneratedImageUrl(null);
                      setGeneratedText('');
                      if (videoPreview) {
                        URL.revokeObjectURL(videoPreview);
                      }
                      setVideoPreview(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                      if (videoInputRef.current) {
                        videoInputRef.current.value = '';
                      }
                    }}
                  >
                    <SelectTrigger id="category-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        [
                          'general',
                          'image',
                          'video',
                          'code',
                          'writing',
                          'marketing',
                          'image-to-prompt',
                          'video-to-prompt',
                        ] as PromptCategory[]
                      ).map((key) => (
                        <SelectItem key={key} value={key}>
                          {getCategoryLabel(key)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* 图片上传 - 当是图片转prompt时显示 */}
              {category === 'image-to-prompt' && (
                <div className="space-y-4">
                  {/* Tab switcher for Upload Image / Input Image URL */}
                  <div className="space-y-4">
                    {/* Tab buttons */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setImageInputMode('upload')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          imageInputMode === 'upload'
                            ? 'bg-primary/20 text-primary border-2 border-primary'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {t('inputSection.imageUploadLabel', {
                          defaultValue: 'Upload Image',
                        })}
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageInputMode('url')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          imageInputMode === 'url'
                            ? 'bg-primary/20 text-primary border-2 border-primary'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {t('inputSection.imageUrlLabel', {
                          defaultValue: 'Input Image URL',
                        })}
                      </button>
                    </div>

                    {/* Tab content */}
                    <div className="space-y-4">
                      {/* Show image preview if available (for both modes) */}
                      {imagePreview ? (
                        <div className="relative group/upload">
                          <div className="relative w-full min-h-[200px] max-h-[300px] rounded-lg border overflow-hidden bg-muted flex items-center justify-center">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="max-w-full max-h-[300px] object-contain"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 shadow-lg opacity-0 group-hover/upload:opacity-100 transition-opacity"
                            onClick={handleRemoveImage}
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          {/* Upload mode content */}
                          {imageInputMode === 'upload' && (
                            <div
                              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-accent transition-colors min-h-[150px] flex flex-col items-center justify-center"
                              onClick={() => {
                                fileInputRef.current?.click();
                              }}
                            >
                              <ImageIcon className="mx-auto size-10 text-muted-foreground mb-3" />
                              <p className="text-sm text-muted-foreground mb-1">
                                {t('inputSection.imageUploadPlaceholder', {
                                  defaultValue: 'Click to upload an image',
                                })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {t('inputSection.imageUploadHint', {
                                  defaultValue:
                                    'PNG, JPG, WEBP (auto-compressed)',
                                })}
                              </p>
                            </div>
                          )}

                          {/* URL mode content */}
                          {imageInputMode === 'url' && (
                            <div className="space-y-3">
                              <Input
                                placeholder={t(
                                  'inputSection.imageUrlInputPlaceholder',
                                  {
                                    defaultValue: 'Paste your image link here',
                                  }
                                )}
                                value={imageUrlInput}
                                onChange={(e) => {
                                  setImageUrlInput(e.target.value);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleImageUrlSubmit();
                                  }
                                }}
                                disabled={isLoadingImageUrl}
                                className="w-full"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleImageUrlSubmit}
                                disabled={
                                  !imageUrlInput.trim() || isLoadingImageUrl
                                }
                                className="w-auto"
                              >
                                {isLoadingImageUrl ? (
                                  <Loader2 className="size-4 animate-spin mr-2" />
                                ) : null}
                                {t('inputSection.loadImageUrl', {
                                  defaultValue: 'Load Image URL',
                                })}
                              </Button>
                            </div>
                          )}
                        </>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* AI Model Selection */}
                  <div className="space-y-3">
                    <Label>
                      {t('inputSection.selectAIModel', {
                        defaultValue: 'Select AI Model',
                      })}
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {IMAGE_TO_PROMPT_MODELS.map((model) => (
                        <div
                          key={model.id}
                          className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                            selectedImageToPromptModel === model.id
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() =>
                            setSelectedImageToPromptModel(model.id)
                          }
                        >
                          {selectedImageToPromptModel === model.id && (
                            <div className="absolute top-3 right-3">
                              <Check className="size-5 text-primary" />
                            </div>
                          )}
                          <h4 className="font-medium text-sm mb-1 pr-6">
                            {(t as any)(
                              `inputSection.aiModels.${model.labelKey}`,
                              {
                                defaultValue: model.labelKey,
                              }
                            )}
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {(t as any)(
                              `inputSection.aiModels.${model.descriptionKey}`,
                              {
                                defaultValue: model.descriptionKey,
                              }
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Output Language Selection */}
                  <div className="space-y-3">
                    <Label>
                      {t('inputSection.outputLanguage', {
                        defaultValue: 'Output Language',
                      })}
                    </Label>
                    <Select
                      value={outputLanguage}
                      onValueChange={(value: OutputLanguage) =>
                        setOutputLanguage(value)
                      }
                    >
                      <SelectTrigger className="w-full sm:w-64">
                        <Globe className="size-4 mr-2 text-muted-foreground" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OUTPUT_LANGUAGE_OPTIONS.map((lang) => (
                          <SelectItem key={lang.id} value={lang.id}>
                            {lang.nativeLabel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* 描述图片 - 当是 describe-image 时显示 */}
              {category === 'describe-image' && (
                <div className="space-y-4">
                  {/* Tab switcher for Upload Image / Input Image URL */}
                  <div className="space-y-4">
                    {/* Tab buttons */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setImageInputMode('upload')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          imageInputMode === 'upload'
                            ? 'bg-primary/20 text-primary border-2 border-primary'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {t('inputSection.imageUploadLabel', {
                          defaultValue: 'Upload Image',
                        })}
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageInputMode('url')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          imageInputMode === 'url'
                            ? 'bg-primary/20 text-primary border-2 border-primary'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {t('inputSection.imageUrlLabel', {
                          defaultValue: 'Input Image URL',
                        })}
                      </button>
                    </div>

                    {/* Tab content */}
                    <div className="space-y-4">
                      {/* Show image preview if available (for both modes) */}
                      {imagePreview ? (
                        <div className="relative group/upload">
                          <div className="relative w-full min-h-[200px] max-h-[300px] rounded-lg border overflow-hidden bg-muted flex items-center justify-center">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="max-w-full max-h-[300px] object-contain"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 shadow-lg opacity-0 group-hover/upload:opacity-100 transition-opacity"
                            onClick={handleRemoveImage}
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          {/* Upload mode content */}
                          {imageInputMode === 'upload' && (
                            <div
                              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-accent transition-colors min-h-[150px] flex flex-col items-center justify-center"
                              onClick={() => {
                                fileInputRef.current?.click();
                              }}
                            >
                              <ImageIcon className="mx-auto size-10 text-muted-foreground mb-3" />
                              <p className="text-sm text-muted-foreground mb-1">
                                {t('inputSection.imageUploadPlaceholder', {
                                  defaultValue: 'Click to upload an image',
                                })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {t('inputSection.imageUploadHint', {
                                  defaultValue:
                                    'PNG, JPG, WEBP (auto-compressed)',
                                })}
                              </p>
                            </div>
                          )}

                          {/* URL mode content */}
                          {imageInputMode === 'url' && (
                            <div className="space-y-3">
                              <Input
                                placeholder={t(
                                  'inputSection.imageUrlInputPlaceholder',
                                  {
                                    defaultValue: 'Paste your image link here',
                                  }
                                )}
                                value={imageUrlInput}
                                onChange={(e) => {
                                  setImageUrlInput(e.target.value);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleImageUrlSubmit();
                                  }
                                }}
                                disabled={isLoadingImageUrl}
                                className="w-full"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleImageUrlSubmit}
                                disabled={
                                  !imageUrlInput.trim() || isLoadingImageUrl
                                }
                                className="w-auto"
                              >
                                {isLoadingImageUrl ? (
                                  <Loader2 className="size-4 animate-spin mr-2" />
                                ) : null}
                                {t('inputSection.loadImageUrl', {
                                  defaultValue: 'Load Image URL',
                                })}
                              </Button>
                            </div>
                          )}
                        </>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Image Description Options - Card Grid */}
                  <div className="space-y-4">
                    <Label>
                      {t('inputSection.imageDescriptionOptions', {
                        defaultValue: 'Image Description Options',
                      })}
                    </Label>
                    <div className="space-y-5">
                      {DESCRIBE_IMAGE_CATEGORIES.map((category) => (
                        <div key={category.id} className="space-y-2.5">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {(t as any)(
                              `inputSection.describeImageCategories.${category.labelKey}`,
                              { defaultValue: category.labelKey }
                            )}
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {DESCRIBE_IMAGE_OPTIONS.filter(
                              (option) => option.category === category.id
                            ).map((option) => {
                              const isSelected =
                                selectedDescribeImageOption === option.id;
                              return (
                                <button
                                  key={option.id}
                                  type="button"
                                  onClick={() =>
                                    setSelectedDescribeImageOption(option.id)
                                  }
                                  className={`relative text-left rounded-xl border-2 p-4 transition-all ${
                                    isSelected
                                      ? 'border-primary bg-primary/5'
                                      : 'border-border bg-background hover:border-muted-foreground/30'
                                  }`}
                                >
                                  {isSelected && (
                                    <div className="absolute top-3 right-3 size-5 rounded-full bg-primary flex items-center justify-center">
                                      <Check className="size-3 text-primary-foreground" />
                                    </div>
                                  )}
                                  <div className="space-y-1 pr-6">
                                    <div
                                      className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}
                                    >
                                      {(t as any)(
                                        `inputSection.describeImageOptions.${option.labelKey}`,
                                        { defaultValue: option.labelKey }
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground leading-relaxed">
                                      {(t as any)(
                                        `inputSection.describeImageOptions.${option.descriptionKey}`,
                                        { defaultValue: '' }
                                      )}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Output Language Selection */}
                  <div className="space-y-3">
                    <Label>
                      {t('inputSection.outputLanguage', {
                        defaultValue: 'Output Language',
                      })}
                    </Label>
                    <Select
                      value={outputLanguage}
                      onValueChange={(value: OutputLanguage) =>
                        setOutputLanguage(value)
                      }
                    >
                      <SelectTrigger className="w-full sm:w-64">
                        <Globe className="size-4 mr-2 text-muted-foreground" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OUTPUT_LANGUAGE_OPTIONS.map((lang) => (
                          <SelectItem key={lang.id} value={lang.id}>
                            {lang.nativeLabel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* 视频上传 - 当是视频转prompt时显示 */}
              {category === 'video-to-prompt' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>
                      {t('inputSection.videoUploadLabel', {
                        defaultValue: 'Upload Video',
                      })}
                    </Label>
                    <div className="space-y-4">
                      {videoPreview ? (
                        <div className="relative">
                          <div className="relative w-full h-64 rounded-lg border overflow-hidden bg-muted">
                            <video
                              src={videoPreview}
                              controls
                              className="w-full h-full object-contain"
                            />
                            {/* 视频上传进度覆盖层 */}
                            {isUploadingVideo && (
                              <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
                                <Loader2 className="size-8 animate-spin text-primary mb-2" />
                                <p className="text-sm text-muted-foreground">
                                  {t('inputSection.uploadingVideo', {
                                    defaultValue: 'Uploading video...',
                                  })}
                                </p>
                              </div>
                            )}
                            {/* 上传完成指示 */}
                            {!isUploadingVideo && uploadedVideoUrl && (
                              <div className="absolute top-2 left-2 bg-green-500/90 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                <Check className="size-3" />
                                {t('inputSection.videoReady', {
                                  defaultValue: 'Ready',
                                })}
                              </div>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={handleRemoveVideo}
                            disabled={isUploadingVideo}
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-accent transition-colors"
                          onClick={() => {
                            videoInputRef.current?.click();
                          }}
                        >
                          <VideoIcon className="mx-auto size-12 text-muted-foreground mb-4" />
                          <p className="text-sm text-muted-foreground mb-2">
                            {t('inputSection.videoUploadPlaceholder', {
                              defaultValue: 'Click to upload a video',
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t('inputSection.videoUploadHint', {
                              defaultValue: 'MP4, WEBM, MOV up to 5MB',
                            })}
                          </p>
                        </div>
                      )}
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        onChange={handleVideoUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Video Prompt Model Selection */}
                  <div className="space-y-3">
                    <Label>
                      {t('inputSection.selectVideoPromptModel', {
                        defaultValue: 'Select Video Prompt Model',
                      })}
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {VIDEO_TO_PROMPT_MODELS.map((model) => (
                        <div
                          key={model.id}
                          className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                            selectedVideoToPromptModel === model.id
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() =>
                            setSelectedVideoToPromptModel(model.id)
                          }
                        >
                          {selectedVideoToPromptModel === model.id && (
                            <div className="absolute top-3 right-3">
                              <Check className="size-5 text-primary" />
                            </div>
                          )}
                          <h4 className="font-medium text-sm mb-1 pr-6">
                            {(t as any)(
                              `inputSection.videoModels.${model.labelKey}`,
                              {
                                defaultValue: model.labelKey,
                              }
                            )}
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {(t as any)(
                              `inputSection.videoModels.${model.descriptionKey}`,
                              {
                                defaultValue: model.descriptionKey,
                              }
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 生成按钮 - 对于图片转prompt、视频转prompt或描述图片，直接显示在这里 */}
              {/* Generate Prompt button for image-to-prompt and describe-image (no login required) */}
              {(category === 'image-to-prompt' ||
                category === 'describe-image') && (
                <Button
                  onClick={handleGenerate}
                  disabled={!uploadedImage || isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="mr-2 size-4 animate-spin" />
                      {generationStage === 'analyzing'
                        ? t('inputSection.analyzing')
                        : t('inputSection.generating')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 size-4" />
                      {t('inputSection.generateButton')}
                    </>
                  )}
                </Button>
              )}

              {/* Generate Prompt button for video-to-prompt (no login required) */}
              {category === 'video-to-prompt' && (
                <Button
                  onClick={handleGenerate}
                  disabled={
                    !uploadedVideo ||
                    isUploadingVideo ||
                    !uploadedVideoUrl ||
                    isGenerating
                  }
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="mr-2 size-4 animate-spin" />
                      {generationStage === 'analyzing'
                        ? t('inputSection.analyzing')
                        : t('inputSection.generating')}
                    </>
                  ) : isUploadingVideo ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      {(t as any)('inputSection.uploadingVideo', {
                        defaultValue: 'Uploading video...',
                      })}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 size-4" />
                      {t('inputSection.generateButton')}
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
        )}

        {/* Enhanced Options Section - 图片转prompt、视频转prompt和描述图片不需要enhancement options */}
        {category &&
          category !== 'image-to-prompt' &&
          category !== 'video-to-prompt' &&
          category !== 'describe-image' &&
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
                  {!hideCategorySelector && (
                    <div className="space-y-1.5 sm:min-w-[180px]">
                      <Label htmlFor="category-select-enhanced">
                        {t('inputSection.categoryLabel')}
                      </Label>
                      <Select
                        value={category}
                        onValueChange={(value) => {
                          setCategory(value as PromptCategory);
                          setEnhancedOptions({});
                          setAppliedCombination(null);
                          setAppliedCombinationKey(null);
                          setCustomEnhancement('');
                          setEnhancedResult('');
                          setGeneratedIdeas([]);
                          setUploadedImage(null);
                          setImagePreview(null);
                          setUploadedVideo(null);
                          setGeneratedImage(null);
                          setGeneratedImageUrl(null);
                          setGeneratedText('');
                          if (videoPreview) {
                            URL.revokeObjectURL(videoPreview);
                          }
                          setVideoPreview(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                          if (videoInputRef.current) {
                            videoInputRef.current.value = '';
                          }
                        }}
                      >
                        <SelectTrigger id="category-select-enhanced">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            [
                              'general',
                              'image',
                              'video',
                              'code',
                              'writing',
                              'marketing',
                              'image-to-prompt',
                              'video-to-prompt',
                            ] as PromptCategory[]
                          ).map((key) => (
                            <SelectItem key={key} value={key}>
                              {getCategoryLabel(key)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Inline Presets */}
                <div className="space-y-3">
                  <Label className="inline-flex items-center gap-1 shrink-0 text-muted-foreground">
                    <span className="bg-yellow-200 dark:bg-yellow-500/30 px-1.5 py-0.5 rounded text-yellow-800 dark:text-yellow-300 text-xs font-medium">
                      ★
                    </span>
                    {t('enhancedOptions.recommendedCombinations', {
                      defaultValue: 'Recommended Presets',
                    })}
                  </Label>
                  {category === 'writing' ? (
                    <Tabs defaultValue="creative" className="w-full">
                      <TabsList className="w-full">
                        <TabsTrigger value="creative" className="flex-1">
                          {t('enhancedOptions.creativeWritingPresets', {
                            defaultValue: 'Creative Writing',
                          })}
                        </TabsTrigger>
                        <TabsTrigger value="business" className="flex-1">
                          {t('enhancedOptions.businessWritingPresets', {
                            defaultValue: 'Business Writing',
                          })}
                        </TabsTrigger>
                      </TabsList>
                      {(['creative', 'business'] as const).map((tab) => (
                        <TabsContent key={tab} value={tab} className="grid grid-cols-2 gap-2 mt-2">
                          {Object.entries(
                            (messages as any)?.HomePage?.promptGenerator
                              ?.enhancedOptions?.combinations?.[category] || {}
                          )
                            .filter(([key]) =>
                              tab === 'creative'
                                ? ['c1', 'c2', 'c3', 'c4', 'c5'].includes(key)
                                : ['c6', 'c7', 'c8', 'c9', 'c10'].includes(key)
                            )
                            .map(([key, combo]: [string, any]) => (
                              <div
                                key={key}
                                className={`relative rounded-lg border p-3 transition-all hover:border-primary/50 cursor-pointer ${appliedCombination === combo.name ? 'bg-primary/5 border-primary/30' : 'bg-muted/20'}`}
                                onClick={() => {
                                  if (appliedCombination === combo.name) {
                                    setAppliedCombination(null);
                                    setAppliedCombinationKey(null);
                                    setEnhancedOptions({});
                                  } else {
                                    applyCombination(key, combo.name, combo.options);
                                  }
                                }}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2">
                                    {(() => {
                                      const iconMap: Record<string, { icon: React.ElementType; color: string }> = {
                                        c1: { icon: Sword, color: 'text-purple-500' },
                                        c2: { icon: Rocket, color: 'text-blue-500' },
                                        c3: { icon: Shield, color: 'text-amber-500' },
                                        c4: { icon: Heart, color: 'text-rose-500' },
                                        c5: { icon: Skull, color: 'text-slate-500' },
                                        c6: { icon: Briefcase, color: 'text-sky-500' },
                                        c7: { icon: GraduationCap, color: 'text-indigo-500' },
                                        c8: { icon: FileText, color: 'text-teal-500' },
                                        c9: { icon: Megaphone, color: 'text-orange-500' },
                                        c10: { icon: Share2, color: 'text-pink-500' },
                                      };
                                      const entry = iconMap[key];
                                      if (entry) {
                                        const Icon = entry.icon;
                                        return <Icon className={`size-4 shrink-0 ${entry.color}`} />;
                                      }
                                      return <Sparkles className="size-4 shrink-0 text-muted-foreground" />;
                                    })()}
                                    <span className="text-sm font-medium">
                                      {combo.name}
                                    </span>
                                  </div>
                                  {appliedCombination === combo.name && (
                                    <Check className="size-4 text-primary shrink-0" />
                                  )}
                                </div>
                              </div>
                            ))}
                        </TabsContent>
                      ))}
                    </Tabs>
                  ) : (
                    <div className="space-y-2">
                      {(() => {
                        const presetImages: Record<string, string> = {
                          c1: '/images/presets/cinematic.png',
                          c2: '/images/presets/aesthetic.png',
                          c3: '/images/presets/minimalist.png',
                          c4: '/images/presets/vintage.png',
                          c5: '/images/presets/cyberpunk.png',
                          c6: '/images/presets/ghibli.png',
                        };
                        return Object.entries(
                          (messages as any)?.HomePage?.promptGenerator
                            ?.enhancedOptions?.combinations?.[category] || {}
                        ).map(([key, combo]: [string, any]) => (
                          <div
                            key={key}
                            className={`relative rounded-lg border p-3 transition-all hover:border-primary/50 cursor-pointer ${appliedCombination === combo.name ? 'bg-primary/5 border-primary/30' : 'bg-muted/20'}`}
                            onClick={() => {
                              if (appliedCombination === combo.name) {
                                setAppliedCombination(null);
                                setAppliedCombinationKey(null);
                                setEnhancedOptions({});
                              } else {
                                applyCombination(key, combo.name, combo.options);
                              }
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className="space-y-1.5 flex-1 min-w-0 text-left">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium">
                                    {combo.name}
                                  </span>
                                  {appliedCombination === combo.name && (
                                    <Badge
                                      variant="secondary"
                                      className="h-5 px-1.5 text-[10px] gap-1 text-primary"
                                    >
                                      <Check className="size-3" />
                                      {t('enhancedOptions.guideTabs.applied', {
                                        defaultValue: 'Applied',
                                      })}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground text-left break-words">
                                  {combo.desc}
                                </p>
                                <div className="flex flex-wrap gap-1.5 pt-0.5">
                                  {Object.entries(combo.options || {}).map(
                                    ([optKey, optVal]: [string, any]) => (
                                      <Badge
                                        key={optKey}
                                        variant="outline"
                                        className="text-[10px] bg-background/50 px-1.5 py-0 h-5 font-normal text-muted-foreground"
                                      >
                                        {getCategoryOptionLabel(category, optKey)}:{' '}
                                        {getOptionValueLabel(
                                          category,
                                          optKey,
                                          optVal as string
                                        )}
                                      </Badge>
                                    )
                                  )}
                                </div>
                              </div>
                              {category === 'image' && presetImages[key] ? (
                                <div className="shrink-0 w-[100px] h-[80px] rounded-lg overflow-hidden border bg-muted">
                                  <img
                                    src={presetImages[key]}
                                    alt={combo.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : appliedCombination === combo.name ? (
                                <Check className="size-5 text-primary shrink-0" />
                              ) : (
                                <Sparkles className="size-5 text-muted-foreground shrink-0" />
                              )}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>

                {/* 选项网格 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      <div key={option} className="space-y-1.5">
                        <Label className="text-sm">{optionLabel}</Label>
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
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={t('enhancedOptions.placeholder', {
                                option: optionLabel,
                              })}
                            >
                              {enhancedOptions[option]
                                ? getOptionValueLabel(
                                    category,
                                    option,
                                    enhancedOptions[option]
                                  )
                                : null}
                            </SelectValue>
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

                {/* 分隔线 */}
                <div className="border-t pt-4 space-y-3">
                  {/* 输入内容 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Label htmlFor="prompt-input">
                        {t('inputSection.inputLabel')}
                      </Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateIdeas}
                        disabled={isGeneratingIdeas}
                        className="h-6 px-2.5 text-xs rounded-full bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400 dark:hover:bg-amber-500/20"
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
                    <Input
                      id="prompt-input"
                      placeholder={
                        t(`inputSection.placeholders.${category}` as any) ||
                        t('inputSection.inputPlaceholder')
                      }
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleGenerate();
                        }
                      }}
                    />
                  </div>

                  {/* AI 生成的灵感列表 */}
                  {(generatedIdeas.length > 0 || isGeneratingIdeas) && (
                    <div className="space-y-2">
                      {isGeneratingIdeas ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                          <Loader2 className="size-4 animate-spin" />
                          {(t as any)('enhancedOptions.generatingIdeas', {
                            defaultValue: 'Generating ideas...',
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {generatedIdeas.map((idea, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => {
                                setInput(idea);
                                setGeneratedIdeas([]);
                              }}
                              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs bg-muted hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 transition-all cursor-pointer text-left"
                            >
                              <Lightbulb className="mr-1.5 size-3 shrink-0 text-amber-500" />
                              {idea}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Custom Enhancement Input */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
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
                      className="min-h-[80px]"
                    />
                  </div>
                </div>

                {/* 生成按钮 */}
                <div className="flex gap-3 items-center">
                  <Button
                    onClick={handleGenerate}
                    disabled={!input.trim() || isGenerating}
                    className="flex-1"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Sparkles className="mr-2 size-4 animate-spin" />
                        {generationStage === 'analyzing'
                          ? t('inputSection.analyzing')
                          : t('inputSection.generating')}
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
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle>{t('enhancedResult.title')}</CardTitle>
                  <CardDescription>
                    {t('enhancedResult.description')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Textarea
                  ref={resultTextareaRef}
                  readOnly={!isEditing}
                  value={enhancedResult}
                  onChange={(e) => setEnhancedResult(e.target.value)}
                  className={`min-h-[120px] ${isEditing ? 'ring-2 ring-primary bg-primary/5' : ''} ${isGenerating ? 'ring-2 ring-primary/50' : ''}`}
                />
                {isGenerating && !enhancedResult && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-background/80 rounded-md p-4">
                    {generationStage === 'analyzing' &&
                    (category === 'image-to-prompt' ||
                      category === 'video-to-prompt') ? (
                      <div className="w-full max-w-md space-y-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-primary font-medium flex items-center gap-2">
                            <Loader2 className="size-4 animate-spin" />
                            {isAiEditing
                              ? t('aiEdit.editing', {
                                  defaultValue: 'AI Editing...',
                                })
                              : t('inputSection.analyzing', {
                                  defaultValue: 'Analyzing...',
                                })}
                          </span>
                          <span className="text-muted-foreground font-medium">
                            {Math.round(analyzingProgress)}%
                          </span>
                        </div>
                        <Progress value={analyzingProgress} className="h-2" />
                        <p className="text-xs text-muted-foreground animate-pulse text-center">
                          {category === 'image-to-prompt'
                            ? t('inputSection.analyzingImage', {
                                defaultValue: 'Analyzing image details...',
                              })
                            : t('inputSection.analyzingVideo', {
                                defaultValue: 'Analyzing video frames...',
                              })}
                        </p>
                      </div>
                    ) : (
                      <span className="text-primary font-semibold text-lg animate-pulse">
                        {isAiEditing
                          ? t('aiEdit.editing', {
                              defaultValue: 'AI Editing...',
                            })
                          : generationStage === 'analyzing'
                            ? t('inputSection.analyzing', {
                                defaultValue: 'Analyzing...',
                              })
                            : t('inputSection.generating', {
                                defaultValue: 'Generating...',
                              })}
                      </span>
                    )}
                  </div>
                )}
                {/* 返回按钮 - 仅在 AI Edit 生成的结果时显示 */}
                {isAiEditedResult &&
                  !isGenerating &&
                  enhancedResult &&
                  previousResult && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRevertToPrevious}
                      className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-background"
                      title={t('aiEdit.revert', {
                        defaultValue: 'Revert to previous result',
                      })}
                    >
                      <ArrowLeft className="size-4 text-foreground" />
                    </Button>
                  )}
              </div>
              {/* English Prompt Tip */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
                <Info className="size-3.5 flex-shrink-0" />
                <span>
                  {t('enhancedResult.englishTip', {
                    defaultValue: 'Tip: English prompts produce best results',
                  })}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:flex sm:items-center sm:justify-end gap-2">
                {/* Translate 下拉菜单 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        !enhancedResult.trim() || isGenerating || isTranslating
                      }
                      className={`h-9 px-2 sm:px-3 w-full sm:w-auto ${
                        isTranslating
                          ? 'text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100'
                          : ''
                      } disabled:opacity-50`}
                    >
                      {isTranslating ? (
                        <>
                          <Loader2 className="size-4 text-blue-600 animate-spin" />
                          <span className="text-sm text-blue-600 hidden sm:inline ml-2">
                            {t('enhancedResult.translating', {
                              defaultValue: 'Translating...',
                            })}
                          </span>
                        </>
                      ) : (
                        <>
                          <Globe className="size-4 shrink-0" />
                          <span className="text-sm truncate ml-1 sm:ml-2">
                            {t('enhancedResult.translate', {
                              defaultValue: 'Translate',
                            })}
                          </span>
                          <ChevronDown className="size-3 ml-0.5 sm:ml-1 shrink-0" />
                        </>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    {translateLanguages.map((lang) => (
                      <DropdownMenuItem
                        key={lang.value}
                        onClick={() => handleTranslate(lang.value)}
                        className="cursor-pointer"
                      >
                        {lang.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* AI Editing 按钮 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAiEditingOpen(true)}
                  disabled={
                    !enhancedResult.trim() || isGenerating || isAiEditing
                  }
                  className={`h-9 px-2 sm:px-3 w-full sm:w-auto ${
                    isAiEditing
                      ? 'text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100'
                      : ''
                  } disabled:opacity-50`}
                >
                  {isAiEditing ? (
                    <>
                      <Loader2 className="size-4 text-green-600 animate-spin" />
                      <span className="text-sm text-green-600 hidden sm:inline ml-2">
                        {t('aiEdit.editing', { defaultValue: 'AI Editing...' })}
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4 shrink-0" />
                      <span className="text-sm truncate ml-1 sm:ml-2">
                        {t('aiEdit.button', { defaultValue: 'AI Edit' })}
                      </span>
                    </>
                  )}
                </Button>

                {/* Edit 按钮 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className={`h-9 px-2 sm:px-3 w-full sm:w-auto ${isEditing ? 'text-primary hover:text-primary/90' : ''}`}
                >
                  <Edit2
                    className={`size-4 shrink-0 ${isEditing ? 'text-primary' : ''}`}
                  />
                  <span className="text-sm truncate ml-1 sm:ml-2">
                    {isEditing
                      ? t('imageSettings.editing', { defaultValue: 'Editing' })
                      : t('imageSettings.edit', { defaultValue: 'Edit' })}
                  </span>
                </Button>

                {/* Copy 按钮 */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-2 sm:px-3 w-full sm:w-auto"
                  onClick={() => handleCopy(enhancedResult)}
                >
                  {isCopied ? (
                    <span className="text-sm font-medium text-green-600">
                      {t('imageSettings.copied', { defaultValue: 'Copied' })}
                    </span>
                  ) : (
                    <>
                      <Copy className="size-4 shrink-0" />
                      <span className="text-sm truncate ml-1 sm:ml-2">
                        {t('imageSettings.copy', { defaultValue: 'Copy' })}
                      </span>
                    </>
                  )}
                </Button>
              </div>

              {/* 图片生成设置 - 对 image 和 image-to-prompt 类别显示 */}
              {(category === 'image' || category === 'image-to-prompt') && (
                <div className="pt-4 border-t mt-4">
                  <div className="grid grid-cols-1 sm:flex sm:flex-wrap sm:items-center gap-3">
                    {/* 模型选择下拉框 */}
                    <div className="flex items-center gap-2 min-w-0">
                      <Label className="text-sm text-muted-foreground whitespace-nowrap">
                        {t('imageSettings.model', { defaultValue: 'Model' })}:
                      </Label>
                      <Select
                        value={selectedImageModel}
                        onValueChange={(value) =>
                          setSelectedImageModel(value as ImageGenerationModel)
                        }
                        disabled={
                          isGenerating || isAiEditing || isGeneratingText
                        }
                      >
                        <SelectTrigger className="h-9 w-full sm:w-[280px]">
                          <SelectValue placeholder="Select Model" />
                        </SelectTrigger>
                        <SelectContent>
                          {IMAGE_GENERATION_MODELS.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.label} ({model.credits} credits)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 宽高比下拉框 */}
                    <div className="flex items-center gap-2 min-w-0">
                      <Label className="text-sm text-muted-foreground whitespace-nowrap">
                        {t('imageSettings.aspectRatio', {
                          defaultValue: 'Aspect Ratio',
                        })}
                        :
                      </Label>
                      <Select
                        value={selectedAspectRatio}
                        onValueChange={(value) =>
                          setSelectedAspectRatio(value as AspectRatio)
                        }
                        disabled={
                          isGenerating || isAiEditing || isGeneratingText
                        }
                      >
                        <SelectTrigger className="h-9 w-full sm:w-[150px]">
                          <SelectValue placeholder="Aspect Ratio" />
                        </SelectTrigger>
                        <SelectContent>
                          {ASPECT_RATIO_OPTIONS.map((option) => {
                            const supportedRatios =
                              MODEL_SUPPORTED_ASPECT_RATIOS[
                                selectedImageModel
                              ] || [];
                            const isSupported = supportedRatios.includes(
                              option.id
                            );
                            return (
                              <SelectItem
                                key={option.id}
                                value={option.id}
                                disabled={!isSupported}
                                className={
                                  !isSupported
                                    ? 'opacity-50 cursor-not-allowed'
                                    : ''
                                }
                              >
                                {option.label}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 输出格式下拉框 - flux2 模型固定为 PNG */}
                    <div className="flex items-center gap-2 min-w-0">
                      <Label className="text-sm text-muted-foreground whitespace-nowrap">
                        {t('imageSettings.format', { defaultValue: 'Format' })}:
                      </Label>
                      <Select
                        value={selectedOutputFormat}
                        onValueChange={(value) =>
                          setSelectedOutputFormat(value as OutputFormat)
                        }
                        disabled={
                          isGenerating ||
                          isAiEditing ||
                          isGeneratingText ||
                          selectedImageModel === 'flux2-pro-1k' ||
                          selectedImageModel === 'flux2-pro-2k' ||
                          selectedImageModel === 'grok-imagine'
                        }
                      >
                        <SelectTrigger className="h-9 w-full sm:w-[100px]">
                          <SelectValue placeholder="Format" />
                        </SelectTrigger>
                        <SelectContent>
                          {OUTPUT_FORMAT_OPTIONS.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Generate Image 按钮 */}
                    {mounted && isLoggedIn ? (
                      <Button
                        size="sm"
                        onClick={handleGenerateText}
                        disabled={
                          !enhancedResult.trim() ||
                          isGenerating ||
                          isAiEditing ||
                          isGeneratingText
                        }
                        className={`h-9 px-4 ml-auto ${
                          isGeneratingText
                            ? 'text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100'
                            : ''
                        } disabled:opacity-50`}
                      >
                        {isGeneratingText ? (
                          <>
                            <Loader2 className="size-4 mr-2 text-green-600 animate-spin" />
                            <span className="text-sm text-green-600">
                              {t('generateText.generating', {
                                defaultValue: 'Generating...',
                              })}
                            </span>
                          </>
                        ) : (
                          <>
                            <Zap className="size-4 mr-2" />
                            <span className="text-sm">
                              {t('generateText.buttonImage', {
                                defaultValue: 'Generate Image',
                              })}
                            </span>
                          </>
                        )}
                      </Button>
                    ) : (
                      <LoginWrapper mode="modal" asChild>
                        <Button
                          size="sm"
                          disabled={!enhancedResult.trim()}
                          className="h-9 px-4 ml-auto disabled:opacity-50"
                        >
                          <Zap className="size-4 mr-2" />
                          <span className="text-sm">
                            {t('generateText.buttonImage', {
                              defaultValue: 'Generate Image',
                            })}
                          </span>
                        </Button>
                      </LoginWrapper>
                    )}
                  </div>

                  {/* 图片生成进度条 - 显示在按钮下方 */}
                  {isGeneratingText && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-primary font-medium flex items-center gap-2">
                          <Loader2 className="size-4 animate-spin" />
                          {t('generateText.generatingImage', {
                            defaultValue: 'Generating image...',
                          })}
                        </span>
                        <span className="text-muted-foreground font-medium">
                          {Math.round(generationProgress)}%
                        </span>
                      </div>
                      <Progress value={generationProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground animate-pulse">
                        {t('generateText.pleaseWait', {
                          defaultValue:
                            'Please wait a moment, the high-quality image is being created...',
                        })}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 非 image、非 image-to-prompt 和非 describe-image 类别的模型选择和 Generate 按钮 */}
              {category !== 'image' &&
                category !== 'image-to-prompt' &&
                category !== 'describe-image' && (
                  <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t mt-4">
                    {/* video 和 video-to-prompt 类别显示视频模型选择和宽高比选择 */}
                    {category === 'video' || category === 'video-to-prompt' ? (
                      <>
                        {/* 视频模型选择 */}
                        <div className="flex items-center gap-2">
                          <Label className="text-sm text-muted-foreground whitespace-nowrap">
                            {t('videoSettings.model', {
                              defaultValue: 'Model',
                            })}
                            :
                          </Label>
                          <Select
                            value={selectedVideoModel}
                            onValueChange={(value: VideoGenerationModel) =>
                              setSelectedVideoModel(value)
                            }
                            disabled={
                              isGenerating || isAiEditing || isGeneratingVideo
                            }
                          >
                            <SelectTrigger className="h-9 w-[200px] sm:w-auto sm:min-w-[280px]">
                              <VideoIcon className="size-4 mr-2 flex-shrink-0 text-muted-foreground" />
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {VIDEO_GENERATION_MODELS.map((model) => (
                                <SelectItem key={model.id} value={model.id}>
                                  {model.label} ({model.credits} credits)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* 视频宽高比选择 */}
                        <div className="flex items-center gap-2">
                          <Label className="text-sm text-muted-foreground whitespace-nowrap">
                            {t('videoSettings.aspectRatio', {
                              defaultValue: 'Aspect Ratio',
                            })}
                            :
                          </Label>
                          <Select
                            value={selectedVideoAspectRatio}
                            onValueChange={(value: VideoAspectRatio) =>
                              setSelectedVideoAspectRatio(value)
                            }
                            disabled={
                              isGenerating || isAiEditing || isGeneratingVideo
                            }
                          >
                            <SelectTrigger className="h-9 w-[150px]">
                              <SelectValue placeholder="Aspect Ratio" />
                            </SelectTrigger>
                            <SelectContent>
                              {VIDEO_ASPECT_RATIO_OPTIONS.map((option) => (
                                <SelectItem key={option.id} value={option.id}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Generate Video 按钮 */}
                        {mounted && isLoggedIn ? (
                          <Button
                            size="sm"
                            onClick={handleGenerateVideo}
                            disabled={
                              !enhancedResult.trim() ||
                              isGenerating ||
                              isAiEditing ||
                              isGeneratingVideo
                            }
                            className={`h-9 px-4 ${
                              isGeneratingVideo
                                ? 'text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100'
                                : ''
                            } disabled:opacity-50`}
                          >
                            {isGeneratingVideo ? (
                              <>
                                <Loader2 className="size-4 mr-2 text-purple-600 animate-spin" />
                                <span className="text-sm text-purple-600">
                                  {t('generateVideo.generating', {
                                    defaultValue: 'Generating...',
                                  })}
                                </span>
                              </>
                            ) : (
                              <>
                                <VideoIcon className="size-4 mr-2" />
                                <span className="text-sm">
                                  {t('generateVideo.button', {
                                    defaultValue: 'Generate Video',
                                  })}
                                </span>
                              </>
                            )}
                          </Button>
                        ) : (
                          <LoginWrapper mode="modal" asChild>
                            <Button
                              size="sm"
                              disabled={!enhancedResult.trim()}
                              className="h-9 px-4 disabled:opacity-50"
                            >
                              <VideoIcon className="size-4 mr-2" />
                              <span className="text-sm">
                                {t('generateVideo.button', {
                                  defaultValue: 'Generate Video',
                                })}
                              </span>
                            </Button>
                          </LoginWrapper>
                        )}
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateText}
                          disabled={
                            !enhancedResult.trim() ||
                            isGenerating ||
                            isAiEditing ||
                            isGeneratingText
                          }
                          className={`h-9 px-3 ${
                            isGeneratingText
                              ? 'text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100'
                              : ''
                          } disabled:opacity-50`}
                        >
                          {isGeneratingText ? (
                            <>
                              <Loader2 className="size-4 mr-2 text-green-600 animate-spin" />
                              <span className="text-sm text-green-600">
                                {t('generateText.generating', {
                                  defaultValue: 'Generating...',
                                })}
                              </span>
                            </>
                          ) : (
                            <>
                              <Zap className="size-4 mr-2" />
                              <span className="text-sm">
                                {t('generateText.buttonContent', {
                                  defaultValue: 'Generate Content',
                                })}
                              </span>
                              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold leading-none rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 uppercase">
                                Free
                              </span>
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                )}

              {/* 视频生成进度条 - video 和 video-to-prompt 类别显示 */}
              {(category === 'video' || category === 'video-to-prompt') &&
                isGeneratingVideo && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-purple-600 font-medium flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        {t('generateVideo.generatingVideo', {
                          defaultValue: 'Generating video...',
                        })}
                      </span>
                      <span className="text-muted-foreground font-medium">
                        {Math.round(videoGenerationProgress)}%
                      </span>
                    </div>
                    <Progress value={videoGenerationProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground animate-pulse">
                      {t('generateVideo.pleaseWait', {
                        defaultValue:
                          'Please wait, video generation may take 2-3 minutes...',
                      })}
                    </p>
                  </div>
                )}
            </CardContent>
          </Card>
        )}

        {/* Generated Image Result Section - for image and image-to-prompt category */}
        {(category === 'image' || category === 'image-to-prompt') &&
          (generatedImage || loadedImageUrl || isGeneratingText) && (
            <Card ref={generatedImageRef}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle>
                      {t('generateImage.title', {
                        defaultValue: 'Generated Image',
                      })}
                    </CardTitle>
                    <CardDescription>
                      {t('generateImage.description', {
                        defaultValue:
                          'Image generated based on the prompt above',
                      })}
                    </CardDescription>
                  </div>
                </div>
                {(generatedImage || loadedImageUrl) && (
                  <div className="mt-3 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      {t('generateImage.deleteWarning', {
                        defaultValue:
                          '⚠️ Please download your image soon. Generated images will be automatically deleted after 7 days.',
                      })}
                    </p>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative w-full aspect-square rounded-lg border overflow-hidden bg-muted">
                  {isGeneratingText && !generatedImage && !loadedImageUrl ? (
                    <div className="absolute inset-0 flex items-center justify-center p-8">
                      <div className="w-full max-w-md space-y-4 text-center">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-primary font-medium">
                            {t('generateText.generating', {
                              defaultValue: 'Generating image...',
                            })}
                          </span>
                          <span className="text-muted-foreground">
                            {Math.round(generationProgress)}%
                          </span>
                        </div>
                        <Progress value={generationProgress} className="h-2" />
                        <p className="text-xs text-muted-foreground animate-pulse">
                          {t('generateText.pleaseWait', {
                            defaultValue:
                              'Please wait a moment, the high-quality image is being created...',
                          })}
                        </p>
                      </div>
                    </div>
                  ) : generatedImage ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`data:image/${
                          currentImageFormat === 'jpeg' ? 'jpeg' : 'png'
                        };base64,${generatedImage}`}
                        alt="Generated image"
                        className="w-full h-full object-contain"
                      />
                    </>
                  ) : loadedImageUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={loadedImageUrl}
                        alt="Generated image"
                        className="w-full h-full object-contain"
                      />
                    </>
                  ) : null}
                </div>
                {(generatedImage || loadedImageUrl) && (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-3"
                      onClick={() => setIsEditingImageOpen(true)}
                      disabled={isEditingImage || !generatedImageUrl}
                    >
                      {isEditingImage ? (
                        <>
                          <Loader2 className="size-4 mr-2 animate-spin" />
                          <span className="text-sm">
                            {t('generateImage.editing', {
                              defaultValue: 'Editing...',
                            })}
                          </span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="size-4 mr-2" />
                          <span className="text-sm">
                            {t('generateImage.edit', { defaultValue: 'Edit' })}
                          </span>
                        </>
                      )}
                    </Button>
                    {(generatedImage || loadedImageUrl) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3"
                        onClick={() => setIsImageViewerOpen(true)}
                      >
                        <ImageIcon className="size-4 mr-2" />
                        <span className="text-sm">
                          {t('generateImage.view', { defaultValue: 'View' })}
                        </span>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-3"
                      onClick={() => {
                        if (generatedImage) {
                          const link = document.createElement('a');
                          const mimeType =
                            currentImageFormat === 'jpeg'
                              ? 'image/jpeg'
                              : 'image/png';
                          const extension =
                            currentImageFormat === 'jpeg' ? 'jpg' : 'png';
                          link.href = `data:${mimeType};base64,${generatedImage}`;
                          link.download = `generated-image.${extension}`;
                          link.click();
                        } else if (loadedImageUrl) {
                          const link = document.createElement('a');
                          link.href = loadedImageUrl;
                          // 从 URL 推断文件扩展名，如果没有则使用当前格式
                          const urlExtension =
                            loadedImageUrl.split('.').pop()?.split('?')[0] ||
                            currentImageFormat;
                          link.download = `generated-image.${urlExtension}`;
                          link.target = '_blank';
                          link.click();
                        }
                      }}
                    >
                      <Copy className="size-4 mr-2" />
                      <span className="text-sm">
                        {t('generateImage.download', {
                          defaultValue: 'Download',
                        })}
                      </span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        {/* Generated Video Result Section - for video and video-to-prompt category */}
        {(category === 'video' || category === 'video-to-prompt') &&
          (generatedVideoUrl || isGeneratingVideo) && (
            <Card ref={generatedVideoRef}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle>
                      {t('generateVideo.title', {
                        defaultValue: 'Generated Video',
                      })}
                    </CardTitle>
                    <CardDescription>
                      {t('generateVideo.description', {
                        defaultValue:
                          'Video generated based on the prompt above',
                      })}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative w-full aspect-video rounded-lg border overflow-hidden bg-muted">
                  {isGeneratingVideo && !generatedVideoUrl ? (
                    <div className="absolute inset-0 flex items-center justify-center p-8">
                      <div className="w-full max-w-md space-y-4 text-center">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-purple-600 font-medium">
                            {t('generateVideo.generating', {
                              defaultValue: 'Generating video...',
                            })}
                          </span>
                          <span className="text-muted-foreground">
                            {Math.round(videoGenerationProgress)}%
                          </span>
                        </div>
                        <Progress
                          value={videoGenerationProgress}
                          className="h-2"
                        />
                        <p className="text-xs text-muted-foreground animate-pulse">
                          {t('generateVideo.pleaseWait', {
                            defaultValue:
                              'Please wait, video generation may take 2-3 minutes...',
                          })}
                        </p>
                      </div>
                    </div>
                  ) : generatedVideoUrl ? (
                    <video
                      src={generatedVideoUrl}
                      controls
                      className="w-full h-full object-contain"
                    >
                      <track kind="captions" />
                      Your browser does not support the video tag.
                    </video>
                  ) : null}
                </div>
                {generatedVideoUrl && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3"
                        onClick={() => {
                          if (generatedVideoUrl) {
                            const link = document.createElement('a');
                            link.href = generatedVideoUrl;
                            link.download = `generated-video-${Date.now()}.mp4`;
                            link.target = '_blank';
                            link.click();
                          }
                        }}
                      >
                        <Download className="size-4 mr-2" />
                        <span className="text-sm">
                          {t('generateVideo.download', {
                            defaultValue: 'Download',
                          })}
                        </span>
                      </Button>
                    </div>
                    {/* Video expiration warning */}
                    {generatedVideoCreatedAt && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Info className="size-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                          <div className="text-sm">
                            <p className="font-medium text-amber-800 dark:text-amber-300">
                              {t('generateVideo.expirationWarning', {
                                defaultValue: 'Video Storage Notice',
                              })}
                            </p>
                            <p className="text-amber-700 dark:text-amber-400 mt-1">
                              {(() => {
                                const expirationDate = new Date(
                                  generatedVideoCreatedAt
                                );
                                expirationDate.setDate(
                                  expirationDate.getDate() + 7
                                );
                                const now = new Date();
                                const remainingMs =
                                  expirationDate.getTime() - now.getTime();
                                const remainingDays = Math.max(
                                  0,
                                  Math.ceil(remainingMs / (1000 * 60 * 60 * 24))
                                );

                                if (remainingDays <= 0) {
                                  return t('generateVideo.expired', {
                                    defaultValue:
                                      'This video may have expired. Please download it if still available.',
                                  });
                                }
                                return t('generateVideo.expirationMessage', {
                                  days: remainingDays,
                                  defaultValue: `Video will be stored for ${remainingDays} more day(s). Please download and save it promptly.`,
                                });
                              })()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        {/* Generated Text History Section - 显示之前生成的文本历史记录 */}
        {category !== 'image' &&
          category !== 'image-to-prompt' &&
          generatedTextHistory.length > 0 &&
          generatedTextHistory.map((historyText, index) => (
            <Card key={`history-${index}`} className="opacity-75 border-dashed">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-muted-foreground">
                    {t('generateText.historyTitle', {
                      defaultValue: 'Previous Result',
                    })}{' '}
                    #{index + 1}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => handleCopyGeneratedText(historyText)}
                  >
                    <Copy className="size-3.5 mr-1" />
                    <span className="text-xs">
                      {t('generateText.copy', { defaultValue: 'Copy' })}
                    </span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-[300px] overflow-y-auto p-4 border rounded-lg bg-muted/30">
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

        {/* Generated Text Result Section - for other categories (excluding image and image-to-prompt) */}
        {category !== 'image' &&
          category !== 'image-to-prompt' &&
          (generatedText || isGeneratingText || isContinuing) && (
            <Card
              className={
                generatedTextHistory.length > 0 ? 'ring-2 ring-primary/30' : ''
              }
            >
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle>
                        {t('generateText.title', {
                          defaultValue: 'Generated Content',
                        })}
                      </CardTitle>
                      {generatedTextHistory.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {t('generateText.latest', { defaultValue: 'Latest' })}
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      {t('generateText.description', {
                        defaultValue:
                          'Content generated based on the prompt above',
                      })}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <div
                    ref={generatedTextRef}
                    className={`min-h-[120px] max-h-[600px] overflow-y-auto p-6 border rounded-lg bg-background ${isGeneratingText ? 'ring-2 ring-primary/50' : ''}`}
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
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-background/80 rounded-md">
                      <span className="text-primary font-semibold text-lg animate-pulse">
                        {t('generateText.generating', {
                          defaultValue: 'Generating...',
                        })}
                      </span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:flex sm:flex-wrap sm:items-center sm:justify-end gap-2">
                  {/* 翻译按钮 */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          !generatedText.trim() ||
                          isGeneratingText ||
                          isTranslatingGeneratedText
                        }
                        className={`h-9 px-3 ${
                          isTranslatingGeneratedText
                            ? 'text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100'
                            : ''
                        } disabled:opacity-50`}
                      >
                        {isTranslatingGeneratedText ? (
                          <>
                            <Loader2 className="size-4 mr-2 text-blue-600 animate-spin" />
                            <span className="text-sm text-blue-600">
                              {t('generateText.translating', {
                                defaultValue: 'Translating...',
                              })}
                            </span>
                          </>
                        ) : (
                          <>
                            <Globe className="size-4 mr-2" />
                            <span className="text-sm">
                              {t('generateText.translate', {
                                defaultValue: 'Translate',
                              })}
                            </span>
                            <ChevronDown className="size-4 ml-1" />
                          </>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      {translateLanguages.map((lang) => (
                        <DropdownMenuItem
                          key={lang.value}
                          onClick={() =>
                            handleTranslateGeneratedText(lang.value)
                          }
                          className="cursor-pointer"
                        >
                          {lang.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3"
                    onClick={() => handleCopyGeneratedText(generatedText)}
                  >
                    {isGeneratedTextCopied ? (
                      <span className="text-sm font-medium text-green-600">
                        Copied
                      </span>
                    ) : (
                      <>
                        <Copy className="size-4 mr-2" />
                        <span className="text-sm">Copy</span>
                      </>
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9 px-3">
                        <Download className="size-4 mr-2" />
                        <span className="text-sm">
                          {t('generateText.download', {
                            defaultValue: 'Download',
                          })}
                        </span>
                        <ChevronDown className="size-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleDownloadMD(generatedText)}
                      >
                        <span className="flex items-center gap-2">
                          📝 Markdown (.md)
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDownloadDOCX(generatedText)}
                      >
                        <span className="flex items-center gap-2">
                          📃 Word (.docx)
                        </span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3"
                    onClick={() => setIsContinueDialogOpen(true)}
                    disabled={isContinuing}
                  >
                    {isContinuing ? (
                      <Loader2 className="size-4 mr-2 animate-spin" />
                    ) : (
                      <MessageSquare className="size-4 mr-2" />
                    )}
                    <span className="text-sm">
                      {t('continueConversation.button', {
                        defaultValue: 'Continue',
                      })}
                    </span>
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
              {/* Quick Edit Buttons - for image-to-prompt category */}
              {(category === 'image-to-prompt' || category === 'image') && (
                <div className="space-y-2">
                  <Label>
                    {t('aiEdit.quickEditLabel', {
                      defaultValue: 'Quick Edit',
                    })}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAiEditInstruction(
                          t('aiEdit.quickOptions.addDetail', {
                            defaultValue:
                              'Add more visual details and descriptions',
                          })
                        )
                      }
                      disabled={isAiEditing}
                      className="text-xs"
                    >
                      ✨{' '}
                      {t('aiEdit.quickOptions.addDetailLabel', {
                        defaultValue: 'Add Detail',
                      })}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAiEditInstruction(
                          t('aiEdit.quickOptions.simplify', {
                            defaultValue:
                              'Simplify and make the prompt more concise',
                          })
                        )
                      }
                      disabled={isAiEditing}
                      className="text-xs"
                    >
                      📝{' '}
                      {t('aiEdit.quickOptions.simplifyLabel', {
                        defaultValue: 'Simplify',
                      })}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAiEditInstruction(
                          t('aiEdit.quickOptions.moreArtistic', {
                            defaultValue:
                              'Make it more artistic and creative with unique visual style',
                          })
                        )
                      }
                      disabled={isAiEditing}
                      className="text-xs"
                    >
                      🎨{' '}
                      {t('aiEdit.quickOptions.moreArtisticLabel', {
                        defaultValue: 'More Artistic',
                      })}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAiEditInstruction(
                          t('aiEdit.quickOptions.moreRealistic', {
                            defaultValue:
                              'Make it more realistic and photographic',
                          })
                        )
                      }
                      disabled={isAiEditing}
                      className="text-xs"
                    >
                      📷{' '}
                      {t('aiEdit.quickOptions.moreRealisticLabel', {
                        defaultValue: 'More Realistic',
                      })}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAiEditInstruction(
                          t('aiEdit.quickOptions.changeLighting', {
                            defaultValue:
                              'Enhance the lighting description with dramatic or cinematic lighting',
                          })
                        )
                      }
                      disabled={isAiEditing}
                      className="text-xs"
                    >
                      💡{' '}
                      {t('aiEdit.quickOptions.changeLightingLabel', {
                        defaultValue: 'Better Lighting',
                      })}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAiEditInstruction(
                          t('aiEdit.quickOptions.focusSubject', {
                            defaultValue:
                              'Focus more on the main subject and reduce background details',
                          })
                        )
                      }
                      disabled={isAiEditing}
                      className="text-xs"
                    >
                      🎯{' '}
                      {t('aiEdit.quickOptions.focusSubjectLabel', {
                        defaultValue: 'Focus Subject',
                      })}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAiEditInstruction(
                          t('aiEdit.quickOptions.changeComposition', {
                            defaultValue:
                              'Improve the composition with better framing and perspective',
                          })
                        )
                      }
                      disabled={isAiEditing}
                      className="text-xs"
                    >
                      🖼️{' '}
                      {t('aiEdit.quickOptions.changeCompositionLabel', {
                        defaultValue: 'Better Composition',
                      })}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAiEditInstruction(
                          t('aiEdit.quickOptions.addMood', {
                            defaultValue:
                              'Add emotional mood and atmosphere to the scene',
                          })
                        )
                      }
                      disabled={isAiEditing}
                      className="text-xs"
                    >
                      🌈{' '}
                      {t('aiEdit.quickOptions.addMoodLabel', {
                        defaultValue: 'Add Mood',
                      })}
                    </Button>
                  </div>
                </div>
              )}

              {/* Quick Edit Buttons - for video-to-prompt category */}
              {category === 'video-to-prompt' && (
                <div className="space-y-3">
                  <Label>
                    {t('aiEdit.quickEditLabel', {
                      defaultValue: 'Quick Edit',
                    })}
                  </Label>

                  {/* Category 1: Camera & Movement */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-medium text-muted-foreground px-1">
                      {t('aiEdit.videoQuickOptions.categoryCamera', {
                        defaultValue: '📹 Camera & Movement',
                      })}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setAiEditInstruction(
                            t('aiEdit.videoQuickOptions.improveCamera', {
                              defaultValue:
                                'Improve camera descriptions: add angles, movements (pan, tilt, dolly, zoom), and shot types',
                            })
                          )
                        }
                        disabled={isAiEditing}
                        className="text-xs"
                      >
                        📹{' '}
                        {t('aiEdit.videoQuickOptions.improveCameraLabel', {
                          defaultValue: 'Better Camera Work',
                        })}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setAiEditInstruction(
                            t('aiEdit.videoQuickOptions.addMotion', {
                              defaultValue:
                                'Add more motion and movement details, describe camera movements and subject actions',
                            })
                          )
                        }
                        disabled={isAiEditing}
                        className="text-xs"
                      >
                        🎬{' '}
                        {t('aiEdit.videoQuickOptions.addMotionLabel', {
                          defaultValue: 'Add Motion',
                        })}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setAiEditInstruction(
                            t('aiEdit.videoQuickOptions.addTransition', {
                              defaultValue:
                                'Add smooth transitions and pacing descriptions between scenes',
                            })
                          )
                        }
                        disabled={isAiEditing}
                        className="text-xs"
                      >
                        ✂️{' '}
                        {t('aiEdit.videoQuickOptions.addTransitionLabel', {
                          defaultValue: 'Add Transitions',
                        })}
                      </Button>
                    </div>
                  </div>

                  {/* Category 2: Visual Style */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-medium text-muted-foreground px-1">
                      {t('aiEdit.videoQuickOptions.categoryVisual', {
                        defaultValue: '🎨 Visual Style',
                      })}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setAiEditInstruction(
                            t('aiEdit.videoQuickOptions.cinematic', {
                              defaultValue:
                                'Make it more cinematic with professional camera work, dramatic lighting, and film-like quality',
                            })
                          )
                        }
                        disabled={isAiEditing}
                        className="text-xs"
                      >
                        🎥{' '}
                        {t('aiEdit.videoQuickOptions.cinematicLabel', {
                          defaultValue: 'More Cinematic',
                        })}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setAiEditInstruction(
                            t('aiEdit.videoQuickOptions.enhanceAtmosphere', {
                              defaultValue:
                                'Enhance the atmosphere and mood with emotional tone and ambient details',
                            })
                          )
                        }
                        disabled={isAiEditing}
                        className="text-xs"
                      >
                        🌈{' '}
                        {t('aiEdit.videoQuickOptions.enhanceAtmosphereLabel', {
                          defaultValue: 'Enhance Atmosphere',
                        })}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setAiEditInstruction(
                            t('aiEdit.videoQuickOptions.addDetail', {
                              defaultValue:
                                'Add more visual details: colors, textures, lighting, environment, and subject descriptions',
                            })
                          )
                        }
                        disabled={isAiEditing}
                        className="text-xs"
                      >
                        ✨{' '}
                        {t('aiEdit.videoQuickOptions.addDetailLabel', {
                          defaultValue: 'Add Detail',
                        })}
                      </Button>
                    </div>
                  </div>

                  {/* Category 3: Timing & Content */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-medium text-muted-foreground px-1">
                      {t('aiEdit.videoQuickOptions.categoryTiming', {
                        defaultValue: '⏱️ Timing & Content',
                      })}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setAiEditInstruction(
                            t('aiEdit.videoQuickOptions.addTiming', {
                              defaultValue:
                                'Add timing and pacing elements, describe duration, speed changes, and rhythm',
                            })
                          )
                        }
                        disabled={isAiEditing}
                        className="text-xs"
                      >
                        ⏱️{' '}
                        {t('aiEdit.videoQuickOptions.addTimingLabel', {
                          defaultValue: 'Add Timing',
                        })}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setAiEditInstruction(
                            t('aiEdit.videoQuickOptions.simplify', {
                              defaultValue:
                                'Simplify and make the video prompt more concise while keeping key elements',
                            })
                          )
                        }
                        disabled={isAiEditing}
                        className="text-xs"
                      >
                        📝{' '}
                        {t('aiEdit.videoQuickOptions.simplifyLabel', {
                          defaultValue: 'Simplify',
                        })}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Edit Buttons - for video category (video-prompts page) */}
              {category === 'video' && (
                <div className="space-y-2">
                  <Label>
                    {t('aiEdit.quickEditLabel', {
                      defaultValue: 'Quick Edit',
                    })}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAiEditInstruction(
                          t('aiEdit.videoPromptQuickOptions.improveCamera', {
                            defaultValue:
                              'Improve camera movement descriptions: add specific movements like tracking shot, 180-degree arc, slow pan, dolly zoom, or aerial view',
                          })
                        )
                      }
                      disabled={isAiEditing}
                      className="text-xs"
                    >
                      📹{' '}
                      {t('aiEdit.videoPromptQuickOptions.improveCameraLabel', {
                        defaultValue: 'Better Camera',
                      })}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAiEditInstruction(
                          t('aiEdit.videoPromptQuickOptions.cinematic', {
                            defaultValue:
                              'Make it more cinematic with professional film quality, dramatic lighting, and epic atmosphere',
                          })
                        )
                      }
                      disabled={isAiEditing}
                      className="text-xs"
                    >
                      🎬{' '}
                      {t('aiEdit.videoPromptQuickOptions.cinematicLabel', {
                        defaultValue: 'Cinematic',
                      })}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAiEditInstruction(
                          t('aiEdit.videoPromptQuickOptions.addAudio', {
                            defaultValue:
                              'Add audio description: ambient sounds, background music style, or character dialogue',
                          })
                        )
                      }
                      disabled={isAiEditing}
                      className="text-xs"
                    >
                      🔊{' '}
                      {t('aiEdit.videoPromptQuickOptions.addAudioLabel', {
                        defaultValue: 'Add Audio',
                      })}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAiEditInstruction(
                          t('aiEdit.videoPromptQuickOptions.enhanceMood', {
                            defaultValue:
                              'Enhance the mood and atmosphere: add emotional tone, lighting mood, and visual atmosphere',
                          })
                        )
                      }
                      disabled={isAiEditing}
                      className="text-xs"
                    >
                      🌈{' '}
                      {t('aiEdit.videoPromptQuickOptions.enhanceMoodLabel', {
                        defaultValue: 'Enhance Mood',
                      })}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAiEditInstruction(
                          t('aiEdit.videoPromptQuickOptions.addMotion', {
                            defaultValue:
                              'Add more motion and action details: describe subject movements, gestures, and dynamic elements',
                          })
                        )
                      }
                      disabled={isAiEditing}
                      className="text-xs"
                    >
                      🏃{' '}
                      {t('aiEdit.videoPromptQuickOptions.addMotionLabel', {
                        defaultValue: 'Add Motion',
                      })}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAiEditInstruction(
                          t('aiEdit.videoPromptQuickOptions.changeStyle', {
                            defaultValue:
                              'Change visual style: make it more stylized (cyberpunk, vintage film, animation, documentary, etc.)',
                          })
                        )
                      }
                      disabled={isAiEditing}
                      className="text-xs"
                    >
                      🎨{' '}
                      {t('aiEdit.videoPromptQuickOptions.changeStyleLabel', {
                        defaultValue: 'Change Style',
                      })}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAiEditInstruction(
                          t('aiEdit.videoPromptQuickOptions.simplify', {
                            defaultValue:
                              'Simplify and make the prompt more concise while keeping the core visual elements',
                          })
                        )
                      }
                      disabled={isAiEditing}
                      className="text-xs"
                    >
                      📝{' '}
                      {t('aiEdit.videoPromptQuickOptions.simplifyLabel', {
                        defaultValue: 'Simplify',
                      })}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAiEditInstruction(
                          t('aiEdit.videoPromptQuickOptions.moreDetail', {
                            defaultValue:
                              'Add more visual details: colors, textures, environment details, and character descriptions',
                          })
                        )
                      }
                      disabled={isAiEditing}
                      className="text-xs"
                    >
                      ✨{' '}
                      {t('aiEdit.videoPromptQuickOptions.moreDetailLabel', {
                        defaultValue: 'More Detail',
                      })}
                    </Button>
                  </div>
                </div>
              )}

              {/* Quick Edit Buttons - for general category */}
              {category === 'general' && (
                <div className="space-y-2">
                  <Label>
                    {t('aiEdit.quickEditLabel', {
                      defaultValue: 'Quick Edit',
                    })}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAiEditInstruction(
                          t('aiEdit.generalQuickOptions.expandDetail', {
                            defaultValue:
                              'Expand and add more details, examples, and explanations to make the content more comprehensive',
                          })
                        )
                      }
                      disabled={isAiEditing}
                      className="text-xs"
                    >
                      ✨{' '}
                      {t('aiEdit.generalQuickOptions.expandDetailLabel', {
                        defaultValue: 'Expand Detail',
                      })}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAiEditInstruction(
                          t('aiEdit.generalQuickOptions.simplify', {
                            defaultValue:
                              'Simplify the content, use clearer and more concise language',
                          })
                        )
                      }
                      disabled={isAiEditing}
                      className="text-xs"
                    >
                      📝{' '}
                      {t('aiEdit.generalQuickOptions.simplifyLabel', {
                        defaultValue: 'Simplify',
                      })}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAiEditInstruction(
                          t('aiEdit.generalQuickOptions.moreProfessional', {
                            defaultValue:
                              'Make the tone more professional and formal, suitable for business or academic contexts',
                          })
                        )
                      }
                      disabled={isAiEditing}
                      className="text-xs"
                    >
                      💼{' '}
                      {t('aiEdit.generalQuickOptions.moreProfessionalLabel', {
                        defaultValue: 'More Professional',
                      })}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAiEditInstruction(
                          t('aiEdit.generalQuickOptions.moreCasual', {
                            defaultValue:
                              'Make the tone more casual and friendly, easier to understand',
                          })
                        )
                      }
                      disabled={isAiEditing}
                      className="text-xs"
                    >
                      😊{' '}
                      {t('aiEdit.generalQuickOptions.moreCasualLabel', {
                        defaultValue: 'More Casual',
                      })}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAiEditInstruction(
                          t('aiEdit.generalQuickOptions.addExamples', {
                            defaultValue:
                              'Add practical examples and use cases to illustrate the points',
                          })
                        )
                      }
                      disabled={isAiEditing}
                      className="text-xs"
                    >
                      📚{' '}
                      {t('aiEdit.generalQuickOptions.addExamplesLabel', {
                        defaultValue: 'Add Examples',
                      })}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAiEditInstruction(
                          t('aiEdit.generalQuickOptions.improveStructure', {
                            defaultValue:
                              'Improve the structure and organization, add clear headings and sections',
                          })
                        )
                      }
                      disabled={isAiEditing}
                      className="text-xs"
                    >
                      🗂️{' '}
                      {t('aiEdit.generalQuickOptions.improveStructureLabel', {
                        defaultValue: 'Improve Structure',
                      })}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAiEditInstruction(
                          t('aiEdit.generalQuickOptions.addSummary', {
                            defaultValue:
                              'Add a summary or key takeaways at the beginning or end',
                          })
                        )
                      }
                      disabled={isAiEditing}
                      className="text-xs"
                    >
                      📋{' '}
                      {t('aiEdit.generalQuickOptions.addSummaryLabel', {
                        defaultValue: 'Add Summary',
                      })}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAiEditInstruction(
                          t('aiEdit.generalQuickOptions.moreCreative', {
                            defaultValue:
                              'Make it more creative and engaging, add unique perspectives or ideas',
                          })
                        )
                      }
                      disabled={isAiEditing}
                      className="text-xs"
                    >
                      🎨{' '}
                      {t('aiEdit.generalQuickOptions.moreCreativeLabel', {
                        defaultValue: 'More Creative',
                      })}
                    </Button>
                  </div>
                </div>
              )}

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

              {/* Quick Edit Buttons - for marketing category */}
              {category === 'marketing' && (
                <div className="space-y-2">
                  <Label>
                    {t('aiEdit.quickEditLabel', {
                      defaultValue: 'Quick Edit',
                    })}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAiEditInstruction(
                          t('aiEdit.marketingQuickOptions.morePersuasive', {
                            defaultValue:
                              'Make the copy more persuasive with stronger calls-to-action and compelling benefits',
                          })
                        )
                      }
                      disabled={isAiEditing}
                      className="text-xs"
                    >
                      🎯{' '}
                      {t('aiEdit.marketingQuickOptions.morePersuasiveLabel', {
                        defaultValue: 'More Persuasive',
                      })}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAiEditInstruction(
                          t('aiEdit.marketingQuickOptions.addEmotional', {
                            defaultValue:
                              'Add emotional appeal and storytelling elements to connect with the audience',
                          })
                        )
                      }
                      disabled={isAiEditing}
                      className="text-xs"
                    >
                      ❤️{' '}
                      {t('aiEdit.marketingQuickOptions.addEmotionalLabel', {
                        defaultValue: 'Add Emotion',
                      })}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAiEditInstruction(
                          t('aiEdit.marketingQuickOptions.addUrgency', {
                            defaultValue:
                              'Add urgency and scarcity elements to drive immediate action',
                          })
                        )
                      }
                      disabled={isAiEditing}
                      className="text-xs"
                    >
                      ⚡{' '}
                      {t('aiEdit.marketingQuickOptions.addUrgencyLabel', {
                        defaultValue: 'Add Urgency',
                      })}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAiEditInstruction(
                          t('aiEdit.marketingQuickOptions.focusBenefits', {
                            defaultValue:
                              'Focus more on benefits rather than features, emphasize value proposition',
                          })
                        )
                      }
                      disabled={isAiEditing}
                      className="text-xs"
                    >
                      ✨{' '}
                      {t('aiEdit.marketingQuickOptions.focusBenefitsLabel', {
                        defaultValue: 'Focus Benefits',
                      })}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAiEditInstruction(
                          t('aiEdit.marketingQuickOptions.addSocial', {
                            defaultValue:
                              'Add social proof elements like testimonials, statistics, or case studies',
                          })
                        )
                      }
                      disabled={isAiEditing}
                      className="text-xs"
                    >
                      👥{' '}
                      {t('aiEdit.marketingQuickOptions.addSocialLabel', {
                        defaultValue: 'Add Social Proof',
                      })}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAiEditInstruction(
                          t('aiEdit.marketingQuickOptions.makeConcise', {
                            defaultValue:
                              'Make it more concise and punchy for better engagement',
                          })
                        )
                      }
                      disabled={isAiEditing}
                      className="text-xs"
                    >
                      📝{' '}
                      {t('aiEdit.marketingQuickOptions.makeConciseLabel', {
                        defaultValue: 'Make Concise',
                      })}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAiEditInstruction(
                          t('aiEdit.marketingQuickOptions.addCTA', {
                            defaultValue:
                              'Strengthen the call-to-action with clear and compelling next steps',
                          })
                        )
                      }
                      disabled={isAiEditing}
                      className="text-xs"
                    >
                      🚀{' '}
                      {t('aiEdit.marketingQuickOptions.addCTALabel', {
                        defaultValue: 'Stronger CTA',
                      })}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAiEditInstruction(
                          t('aiEdit.marketingQuickOptions.optimizeSEO', {
                            defaultValue:
                              'Optimize for SEO with relevant keywords while maintaining natural flow',
                          })
                        )
                      }
                      disabled={isAiEditing}
                      className="text-xs"
                    >
                      🔍{' '}
                      {t('aiEdit.marketingQuickOptions.optimizeSEOLabel', {
                        defaultValue: 'Optimize SEO',
                      })}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="ai-edit-instruction">
                  {t('aiEdit.instructionLabel', {
                    defaultValue: 'Modification Instruction',
                  })}
                </Label>
                <Textarea
                  id="ai-edit-instruction"
                  value={aiEditInstruction}
                  onChange={(e) => setAiEditInstruction(e.target.value)}
                  placeholder={t('aiEdit.placeholder', {
                    defaultValue:
                      'e.g., Make it more detailed, add more creative elements, simplify the language...',
                  })}
                  className="min-h-[120px]"
                  disabled={isAiEditing}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAiEditingOpen(false);
                  setAiEditInstruction('');
                }}
                disabled={isAiEditing}
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
                  <>
                    <Sparkles className="mr-2 size-4" />
                    {t('aiEdit.apply', { defaultValue: 'Apply AI Edit' })}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Image Dialog */}
        <Dialog open={isEditingImageOpen} onOpenChange={setIsEditingImageOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {t('editImage.title', { defaultValue: 'Edit Image' })}
              </DialogTitle>
              <DialogDescription>
                {t('editImage.description', {
                  defaultValue: 'Describe how you want to edit the image',
                })}
              </DialogDescription>
            </DialogHeader>

            {/* Model and Credits Info */}
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground border-l-2 border-primary/30 bg-primary/5 rounded">
              <Sparkles className="size-4 text-primary flex-shrink-0" />
              <span>
                Using{' '}
                <strong className="text-foreground">Nano Banana Edit</strong>{' '}
                model (
                <strong className="text-primary">
                  {MODEL_CREDIT_COSTS['nano-banana-edit']} credits
                </strong>
                )
              </span>
            </div>

            <div className="space-y-4 py-4">
              {/* Display generated image */}
              {generatedImage && (
                <div className="w-full rounded-lg border overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`data:image/${
                      currentImageFormat === 'jpeg' ? 'jpeg' : 'png'
                    };base64,${generatedImage}`}
                    alt="Image to edit"
                    className="w-full h-auto max-h-[300px] object-contain"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="edit-image-prompt">
                  {t('editImage.promptLabel', {
                    defaultValue: 'Edit Instruction',
                  })}
                </Label>
                <Textarea
                  id="edit-image-prompt"
                  value={editImagePrompt}
                  onChange={(e) => setEditImagePrompt(e.target.value)}
                  placeholder={t('editImage.placeholder', {
                    defaultValue:
                      'e.g., Add a sunset background, change the color to blue, add more details...',
                  })}
                  className="min-h-[120px]"
                  disabled={isEditingImage}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditingImageOpen(false);
                  setEditImagePrompt('');
                }}
                disabled={isEditingImage}
              >
                {t('editImage.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button
                onClick={handleEditImage}
                disabled={
                  !editImagePrompt.trim() ||
                  isEditingImage ||
                  !generatedImageUrl
                }
              >
                {isEditingImage ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {t('editImage.editing', { defaultValue: 'Editing...' })}
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 size-4" />
                    {t('editImage.apply', { defaultValue: 'Apply Edit' })}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Image Viewer Modal */}
        {isImageViewerOpen &&
          (generatedImage || loadedImageUrl) &&
          typeof window !== 'undefined' &&
          createPortal(
            <div
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center cursor-pointer min-h-[100dvh] w-screen"
              onClick={() => setIsImageViewerOpen(false)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  generatedImage
                    ? `data:image/${
                        currentImageFormat === 'jpeg' ? 'jpeg' : 'png'
                      };base64,${generatedImage}`
                    : loadedImageUrl!
                }
                alt="Generated image"
                className="max-h-[90dvh] max-w-[90vw] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>,
            document.body
          )}

        {/* Login Required Dialog */}
        <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
          <DialogContent className="sm:max-w-[400px] p-0">
            <DialogHeader className="hidden">
              <DialogTitle />
            </DialogHeader>
            <LoginForm
              callbackUrl={
                typeof window !== 'undefined' ? window.location.pathname : '/'
              }
              className="border-none"
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
