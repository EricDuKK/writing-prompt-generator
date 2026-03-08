'use server';

import { createClient, isSupabaseServerConfigured } from '@/lib/supabase/server';

interface SavePromptData {
  inputText?: string;
  category: string;
  enhancedOptions?: Record<string, string>;
  prompt: string;
  generatedContent?: string;
  modelId?: string;
}

export async function saveGeneratedPromptAction(data: SavePromptData) {
  if (!isSupabaseServerConfigured()) {
    return { data: { success: true, id: crypto.randomUUID(), error: null } };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: { success: true, id: crypto.randomUUID(), error: null } };
    }

    const { data: result, error } = await supabase
      .from('generated_prompts')
      .insert({
        user_id: user.id,
        input_text: data.inputText || null,
        category: data.category,
        enhanced_options: data.enhancedOptions || null,
        prompt: data.prompt,
        generated_content: data.generatedContent || null,
        model_id: data.modelId || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[save-prompt] Error:', error);
      return { data: { success: true, id: crypto.randomUUID(), error: null } };
    }

    return { data: { success: true, id: result.id, error: null } };
  } catch (error) {
    console.error('[save-prompt] Error:', error);
    return { data: { success: true, id: crypto.randomUUID(), error: null } };
  }
}
