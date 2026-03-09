'use server';

import { createClient, isSupabaseServerConfigured } from '@/lib/supabase/server';

interface SaveContentData {
  promptId?: string;
  inputPrompt?: string;
  content: string;
  modelId?: string;
}

export async function saveGeneratedContentAction(data: SaveContentData) {
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
      .from('generated_contents')
      .insert({
        user_id: user.id,
        prompt_id: data.promptId || null,
        input_prompt: data.inputPrompt || null,
        content: data.content,
        model_id: data.modelId || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[save-content] Error:', error);
      return { data: { success: false, id: null, error: error.message } };
    }

    return { data: { success: true, id: result.id, error: null } };
  } catch (error) {
    console.error('[save-content] Error:', error);
    return { data: { success: false, id: null, error: String(error) } };
  }
}
