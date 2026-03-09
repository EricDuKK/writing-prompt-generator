'use server';

import { createClient, isSupabaseServerConfigured } from '@/lib/supabase/server';

interface UpdateData {
  id: string;
  generatedContent?: string;
  modelId?: string;
}

export async function updateGeneratedImageAction(data: UpdateData) {
  if (!isSupabaseServerConfigured()) {
    return { data: { success: true, error: null } };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: { success: true, error: null } };
    }

    const updateFields: Record<string, any> = {};
    if (data.generatedContent !== undefined) {
      updateFields.generated_content = data.generatedContent;
    }
    if (data.modelId !== undefined) {
      updateFields.model_id = data.modelId;
    }

    if (Object.keys(updateFields).length === 0) {
      return { data: { success: true, error: null } };
    }

    const { error } = await supabase
      .from('generated_prompts')
      .update(updateFields)
      .eq('id', data.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[update-generated] Error:', error);
      return { data: { success: false, error: error.message } };
    }

    return { data: { success: true, error: null } };
  } catch (error) {
    console.error('[update-generated] Error:', error);
    return { data: { success: true, error: null } };
  }
}
