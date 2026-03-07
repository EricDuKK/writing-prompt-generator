import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured =
  !!supabaseUrl && supabaseUrl.startsWith('http') && !!supabaseKey;

export function createClient() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }
  return createBrowserClient(supabaseUrl!, supabaseKey!);
}
