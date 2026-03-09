import { createClient, isSupabaseServerConfigured } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  if (!isSupabaseServerConfigured()) {
    return NextResponse.json({ prompts: [], contents: [], promptsTotal: 0, contentsTotal: 0 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const type = searchParams.get('type') || 'prompt';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    if (type === 'prompt') {
      // Fetch all prompts (for numbering) then paginate
      const { data: allPrompts, error, count } = await supabase
        .from('generated_prompts')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[my-works] Prompts error:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
      }

      // Assign sequential numbers (1#, 2#, ...) based on creation order
      const numbered = (allPrompts || []).map((p, idx) => ({
        id: p.id,
        seq: idx + 1,
        input_text: p.input_text,
        category: p.category,
        prompt: p.prompt,
        generated_content: p.generated_content,
        created_at: p.created_at,
      }));

      // Reverse for display (newest first) then paginate
      const reversed = [...numbered].reverse();
      const total = count || reversed.length;
      const paged = reversed.slice(offset, offset + limit);

      return NextResponse.json({ data: paged, total });
    } else {
      // Fetch all prompts first (for numbering map)
      const { data: allPrompts } = await supabase
        .from('generated_prompts')
        .select('id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      // Build prompt_id -> seq number map
      const promptSeqMap: Record<string, number> = {};
      (allPrompts || []).forEach((p, idx) => {
        promptSeqMap[p.id] = idx + 1;
      });

      // Fetch all contents
      const { data: allContents, error, count } = await supabase
        .from('generated_contents')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[my-works] Contents error:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
      }

      // Group contents by prompt_id to assign sub-numbers
      const promptContentCounters: Record<string, number> = {};
      const numbered = (allContents || []).map((c) => {
        const promptSeq = c.prompt_id ? promptSeqMap[c.prompt_id] : null;
        let subSeq = 0;
        if (c.prompt_id) {
          promptContentCounters[c.prompt_id] = (promptContentCounters[c.prompt_id] || 0) + 1;
          subSeq = promptContentCounters[c.prompt_id];
        }

        return {
          id: c.id,
          prompt_id: c.prompt_id,
          prompt_seq: promptSeq,
          sub_seq: subSeq,
          input_prompt: c.input_prompt,
          content: c.content,
          created_at: c.created_at,
        };
      });

      // Reverse for display (newest first) then paginate
      const reversed = [...numbered].reverse();
      const total = count || reversed.length;
      const paged = reversed.slice(offset, offset + limit);

      return NextResponse.json({ data: paged, total });
    }
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isSupabaseServerConfigured()) {
    return NextResponse.json({ success: true });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, type } = await request.json();
    const table = type === 'content' ? 'generated_contents' : 'generated_prompts';

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[my-works] Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
