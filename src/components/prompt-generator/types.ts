// Prompt category types
export type PromptCategory =
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

// Image generation model types
export type ImageGenerationModel =
  | 'flux-schnell'
  | 'nano-banana'
  | 'grok-imagine'
  | 'flux2-pro-1k'
  | 'nano-banana-pro-2k'
  | 'flux2-pro-2k'
  | 'nano-banana-pro-4k';

// Image aspect ratio types
export type AspectRatio =
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

export type OutputFormat = 'png' | 'jpeg';

// Video generation model types
export type VideoGenerationModel =
  | 'veo3'
  | 'veo3_fast'
  | 'sora2-10s'
  | 'sora2-15s'
  | 'sora2-pro-10s'
  | 'sora2-pro-15s';

// Video aspect ratio types
export type VideoAspectRatio = '16:9' | '9:16' | 'portrait' | 'landscape';

// Image-to-prompt AI model types
export type ImageToPromptModel =
  | 'general'
  | 'structured'
  | 'graphic-design'
  | 'flux'
  | 'nano-banana'
  | 'midjourney';

// Video-to-prompt model types
export type VideoToPromptModel =
  | 'general-video'
  | 'structured-video'
  | 'sora-luma'
  | 'social-viral'
  | 'physical-dynamics'
  | 'veo3-cinematic';

// Describe-image option types
export type DescribeImageOption =
  | 'describe-detail'
  | 'describe-brief'
  | 'describe-person'
  | 'recognize-objects'
  | 'analyze-art-style'
  | 'extract-text'
  | 'general-prompt'
  | 'flux-prompt'
  | 'midjourney-prompt'
  | 'nano-banana-prompt';

// Describe-image option category types
export type DescribeImageCategory = 'description' | 'analysis' | 'prompt';

// AI generation model types (for generating prompts)
export type AIGenerationModel =
  | 'gpt-4o-mini'
  | 'gpt-5-mini'
  | 'gemini-2.5-flash-lite'
  | 'deepseek-v3.2';

// Text generation model types (for generating text content from prompts)
export type TextGenerationModel =
  | 'gpt-5.2-chat'
  | 'gpt-4o-mini'
  | 'gemini-2.5-flash'
  | 'deepseek-v3.2'
  | 'claude-sonnet-4';

// Output language types
export type OutputLanguage =
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

// Generation stage types
export type GenerationStage = 'analyzing' | 'generating';

// Data interfaces
export interface GeneratedImageData {
  id: string;
  inputText?: string | null;
  enhancedOptions?: Record<string, string> | null;
  prompt: string;
  sourceImageUrl?: string | null; // For image-to-prompt: the original uploaded image URL
  imageUrl?: string | null; // Generated image URL
  category: string;
  modelId?: string | null;
  model?: string | null;
  aspectRatio?: string | null;
  format?: string | null;
}

export interface PromptGeneratorProps {
  defaultCategory?: PromptCategory;
  hideCategorySelector?: boolean;
  initialData?: GeneratedImageData | null;
}
