import { MODEL_CREDIT_COSTS } from '@/config/model-pricing';
import type {
  AIGenerationModel,
  AspectRatio,
  DescribeImageOption,
  ImageGenerationModel,
  ImageToPromptModel,
  OutputFormat,
  OutputLanguage,
  PromptCategory,
  TextGenerationModel,
  VideoAspectRatio,
  VideoGenerationModel,
  VideoToPromptModel,
} from './types';

// Image generation models with credit costs (sorted by price ascending)
export const IMAGE_GENERATION_MODELS: {
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

// Aspect ratio options
export const ASPECT_RATIO_OPTIONS: { id: AspectRatio; label: string }[] = [
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

// Model supported aspect ratios
export const MODEL_SUPPORTED_ASPECT_RATIOS: Record<
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

// Output format options
export const OUTPUT_FORMAT_OPTIONS: { id: OutputFormat; label: string }[] = [
  { id: 'png', label: 'PNG' },
  { id: 'jpeg', label: 'JPEG' },
];

// Video generation models with credit costs (sorted by price ascending)
export const VIDEO_GENERATION_MODELS: {
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

// Video aspect ratio options
export const VIDEO_ASPECT_RATIO_OPTIONS: {
  id: VideoAspectRatio;
  label: string;
}[] = [
  { id: '16:9', label: '16:9 (Landscape)' },
  { id: '9:16', label: '9:16 (Portrait)' },
];

// Model supported video aspect ratios
export const MODEL_SUPPORTED_VIDEO_ASPECT_RATIOS: Record<
  VideoGenerationModel,
  VideoAspectRatio[]
> = {
  veo3: ['16:9', '9:16'],
  veo3_fast: ['16:9', '9:16'],
  'sora2-10s': ['landscape', 'portrait'],
  'sora2-15s': ['landscape', 'portrait'],
  'sora2-pro-10s': ['landscape', 'portrait'],
  'sora2-pro-15s': ['landscape', 'portrait'],
};

// Video-to-prompt models
export const VIDEO_TO_PROMPT_MODELS: {
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

// Image-to-prompt models
export const IMAGE_TO_PROMPT_MODELS: {
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
    id: 'midjourney',
    labelKey: 'midjourney',
    descriptionKey: 'midjourneyDesc',
  },
];

// Describe-image options with categories
export const DESCRIBE_IMAGE_OPTIONS: {
  id: DescribeImageOption;
  labelKey: string;
  category: 'description' | 'analysis' | 'prompt';
}[] = [
  // Description category
  {
    id: 'describe-detail',
    labelKey: 'describeImageInDetail',
    category: 'description',
  },
  {
    id: 'describe-brief',
    labelKey: 'describeImageBriefly',
    category: 'description',
  },
  {
    id: 'describe-person',
    labelKey: 'describeThePerson',
    category: 'description',
  },
  // Analysis category
  {
    id: 'recognize-objects',
    labelKey: 'recognizeObjects',
    category: 'analysis',
  },
  {
    id: 'analyze-art-style',
    labelKey: 'analyzeArtStyle',
    category: 'analysis',
  },
  {
    id: 'extract-text',
    labelKey: 'extractTextFromImage',
    category: 'analysis',
  },
  // Prompt category
  { id: 'general-prompt', labelKey: 'generalImagePrompt', category: 'prompt' },
  { id: 'flux-prompt', labelKey: 'fluxPrompt', category: 'prompt' },
  { id: 'midjourney-prompt', labelKey: 'midjourneyPrompt', category: 'prompt' },
  {
    id: 'nano-banana-prompt',
    labelKey: 'nanoBananaPrompt',
    category: 'prompt',
  },
];

// Describe-image category labels
export const DESCRIBE_IMAGE_CATEGORIES: {
  id: 'description' | 'analysis' | 'prompt';
  labelKey: string;
}[] = [
  { id: 'description', labelKey: 'descriptionCategory' },
  { id: 'analysis', labelKey: 'analysisCategory' },
  { id: 'prompt', labelKey: 'promptCategory' },
];

// AI generation models (for generating prompts)
export const AI_GENERATION_MODELS: {
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

// Text generation models (for generating text content from prompts)
export const TEXT_GENERATION_MODELS: {
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
    credits: 0,
  },
  {
    id: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    modelId: 'google/gemini-2.5-flash',
    credits: 0,
  },
  {
    id: 'deepseek-v3.2',
    label: 'DeepSeek V3.2',
    modelId: 'deepseek/deepseek-v3.2',
    credits: 0,
  },
  {
    id: 'claude-sonnet-4',
    label: 'Claude Sonnet 4',
    modelId: 'anthropic/claude-sonnet-4',
    credits: MODEL_CREDIT_COSTS['claude-sonnet-4'],
  },
];

// Output language options
export const OUTPUT_LANGUAGE_OPTIONS: {
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

// Category option keys (for translation mapping)
export const categoryOptionKeys: Record<PromptCategory, string[]> = {
  general: ['创意', '分析', '解释', '总结', '复杂度'],
  image: ['风格', '色彩', '构图', '细节', '氛围'],
  video: ['镜头运动', '视觉风格', '画面比例', '氛围基调', '音效'],
  code: ['语言', '框架', '功能', '优化', '测试'],
  writing: ['文体', '语气', '长度', '受众', '目的'],
  marketing: ['平台', '目标', 'CTA', '情感', '价值'],
  'image-to-prompt': [], // Image-to-prompt doesn't need enhancement options
  'video-to-prompt': [], // Video-to-prompt doesn't need enhancement options
  'image-edit': [], // Image edit doesn't need enhancement options
  'describe-image': [], // Describe image doesn't need enhancement options
};

// Preset values for each option (for dropdowns)
export const categoryOptionValues: Record<
  PromptCategory,
  Record<string, string[]>
> = {
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

// Preset-specific option overrides for writing presets
// Each preset defines its own option keys, values (5 per key), and defaults
export const presetOptionOverrides: Record<
  string,
  Record<
    string,
    {
      keys: string[];
      values: Record<string, string[]>;
      defaults: Record<string, string>;
    }
  >
> = {
  writing: {
    c1: {
      // Epic Fantasy Quest
      keys: ['子类型', '世界观', '叙事视角', '魔法体系', '篇幅'],
      values: {
        子类型: ['史诗奇幻', '都市奇幻', '剑与魔法', '神话重述', '黑暗奇幻'],
        世界观: ['中世纪', '东方仙侠', '蒸汽朋克', '远古神话', '异世界'],
        叙事视角: ['第一人称', '第三人称全知', '第三人称限制', '多视角', '书信体'],
        魔法体系: ['硬魔法', '软魔法', '元素系', '符文系', '血脉系'],
        篇幅: ['短篇', '中篇', '长篇', '系列', '章节'],
      },
      defaults: {
        子类型: '史诗奇幻',
        世界观: '中世纪',
        叙事视角: '第三人称全知',
        魔法体系: '硬魔法',
        篇幅: '长篇',
      },
    },
    c2: {
      // Sci-Fi Adventure
      keys: ['子类型', '科技水平', '时间设定', '冲突类型', '篇幅'],
      values: {
        子类型: ['硬科幻', '太空歌剧', '赛博朋克', '反乌托邦', '时间旅行'],
        科技水平: ['近未来', '星际文明', '后奇点', '末日残存', '平行宇宙'],
        时间设定: ['近未来', '远未来', '平行现在', '时间循环', '跨时代'],
        冲突类型: [
          '人类vs AI',
          '星际战争',
          '生存危机',
          '身份认同',
          '文明碰撞',
        ],
        篇幅: ['短篇', '中篇', '长篇', '系列', '章节'],
      },
      defaults: {
        子类型: '硬科幻',
        科技水平: '星际文明',
        时间设定: '远未来',
        冲突类型: '人类vs AI',
        篇幅: '长篇',
      },
    },
    c3: {
      // Thriller & Mystery
      keys: ['子类型', '悬念手法', '节奏', '视角', '篇幅'],
      values: {
        子类型: ['心理惊悚', '犯罪推理', '间谍悬疑', '法庭推理', '密室悬疑'],
        悬念手法: ['不可靠叙述', '倒叙揭秘', '红鲱鱼', '倒计时', '多线交织'],
        节奏: ['快节奏', '慢燃型', '层层递进', '高开低走', '反转密集'],
        视角: ['侦探视角', '凶手视角', '受害者视角', '旁观者视角', '多重视角'],
        篇幅: ['短篇', '中篇', '长篇', '系列', '章节'],
      },
      defaults: {
        子类型: '心理惊悚',
        悬念手法: '不可靠叙述',
        节奏: '层层递进',
        视角: '侦探视角',
        篇幅: '中篇',
      },
    },
    c4: {
      // Romance & Drama
      keys: ['子类型', '情感基调', '关系类型', '场景设定', '篇幅'],
      values: {
        子类型: ['甜宠', '虐恋', '破镜重圆', '暗恋成真', '跨时空恋'],
        情感基调: ['温馨治愈', '虐心催泪', '欢快甜蜜', '含蓄深沉', '热烈奔放'],
        关系类型: ['青梅竹马', '欢喜冤家', '禁忌之恋', '异地恋', '职场恋情'],
        场景设定: ['校园', '都市', '古代', '异国', '小镇'],
        篇幅: ['短篇', '中篇', '长篇', '系列', '章节'],
      },
      defaults: {
        子类型: '甜宠',
        情感基调: '温馨治愈',
        关系类型: '青梅竹马',
        场景设定: '都市',
        篇幅: '长篇',
      },
    },
    c5: {
      // Horror & Dark Fiction
      keys: ['子类型', '恐怖元素', '氛围', '威胁来源', '篇幅'],
      values: {
        子类型: ['哥特恐怖', '宇宙恐怖', '民俗怪谈', '心理恐怖', '生存恐怖'],
        恐怖元素: ['超自然', '人性之恶', '未知恐惧', '身体变异', '精神崩溃'],
        氛围: ['阴森压抑', '诡异荒诞', '末日寂静', '幽闭恐惧', '暗流涌动'],
        威胁来源: ['鬼魅', '邪教', '怪物', '自身心魔', '诅咒'],
        篇幅: ['短篇', '中篇', '长篇', '系列', '章节'],
      },
      defaults: {
        子类型: '心理恐怖',
        恐怖元素: '未知恐惧',
        氛围: '阴森压抑',
        威胁来源: '自身心魔',
        篇幅: '中篇',
      },
    },
    c6: {
      // Business Email
      keys: ['邮件类型', '正式程度', '语气', '收件人', '长度'],
      values: {
        邮件类型: ['工作汇报', '会议邀请', '项目跟进', '商务洽谈', '致歉声明'],
        正式程度: ['极正式', '正式', '半正式', '友好职业', '简洁直接'],
        语气: ['礼貌尊重', '自信果断', '委婉温和', '紧迫急切', '感恩致谢'],
        收件人: ['上级领导', '客户', '同事', '合作伙伴', '下属'],
        长度: ['简短', '中等', '详细', '一句话', '要点列表'],
      },
      defaults: {
        邮件类型: '工作汇报',
        正式程度: '正式',
        语气: '礼貌尊重',
        收件人: '上级领导',
        长度: '中等',
      },
    },
    c7: {
      // Academic Paper
      keys: ['论文类型', '学科领域', '论证方式', '引用风格', '篇幅'],
      values: {
        论文类型: ['研究论文', '文献综述', '实验报告', '案例分析', '学位论文'],
        学科领域: ['自然科学', '社会科学', '工程技术', '人文艺术', '交叉学科'],
        论证方式: ['演绎推理', '归纳推理', '对比分析', '实证研究', '定性分析'],
        引用风格: ['APA', 'MLA', 'Chicago', 'IEEE', 'Harvard'],
        篇幅: ['短篇', '中篇', '长篇', '系列', '章节'],
      },
      defaults: {
        论文类型: '研究论文',
        学科领域: '社会科学',
        论证方式: '实证研究',
        引用风格: 'APA',
        篇幅: '长篇',
      },
    },
    c8: {
      // Product Documentation
      keys: ['文档类型', '技术深度', '受众水平', '结构', '篇幅'],
      values: {
        文档类型: ['用户手册', '快速入门', 'API文档', '发版说明', '故障排除'],
        技术深度: ['入门级', '中级', '高级', '专家级', '概览'],
        受众水平: ['新手用户', '普通用户', '开发者', '系统管理员', '产品经理'],
        结构: ['步骤式', '问答式', '参考手册', '教程式', '概念解释'],
        篇幅: ['短篇', '中篇', '长篇', '系列', '章节'],
      },
      defaults: {
        文档类型: '用户手册',
        技术深度: '中级',
        受众水平: '普通用户',
        结构: '步骤式',
        篇幅: '中篇',
      },
    },
    c9: {
      // Sales Copy
      keys: ['文案类型', '说服策略', '情感诉求', '目标行动', '篇幅'],
      values: {
        文案类型: ['产品详情页', '广告标题', '促销邮件', '落地页', '品牌故事'],
        说服策略: ['稀缺紧迫', '社会证明', '权威背书', '利益驱动', '痛点挖掘'],
        情感诉求: ['焦虑解决', '梦想激发', '归属认同', '恐惧规避', '愉悦享受'],
        目标行动: ['立即购买', '免费试用', '预约咨询', '加入等待', '分享转发'],
        篇幅: ['短篇', '中篇', '长篇', '系列', '章节'],
      },
      defaults: {
        文案类型: '落地页',
        说服策略: '利益驱动',
        情感诉求: '梦想激发',
        目标行动: '立即购买',
        篇幅: '中篇',
      },
    },
    c10: {
      // Social Media Post
      keys: ['平台', '内容形式', '风格', '互动目标', '长度'],
      values: {
        平台: ['Twitter/X', 'Instagram', 'LinkedIn', 'TikTok', 'Reddit'],
        内容形式: ['图文帖', '短视频脚本', '话题讨论', '投票互动', '故事连载'],
        风格: ['幽默搞笑', '专业干货', '情感共鸣', '热点追踪', '个人故事'],
        互动目标: ['涨粉', '点赞收藏', '评论讨论', '转发传播', '引流转化'],
        长度: ['简短', '中等', '详细', '一句话', '要点列表'],
      },
      defaults: {
        平台: 'Twitter/X',
        内容形式: '图文帖',
        风格: '幽默搞笑',
        互动目标: '点赞收藏',
        长度: '简短',
      },
    },
  },
};
