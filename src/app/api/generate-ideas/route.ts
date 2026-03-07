import { type NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'qwen/qwen3-vl-235b-a22b-thinking';
const MODEL_FALLBACK = 'google/gemini-2.5-flash-lite';

async function fetchWithTimeout(
  url: string | URL,
  options: RequestInit = {},
  timeoutMs = 30_000
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { category, preset, enhancementOptions, locale } = await request.json();

    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    let context = `Category: ${category}`;
    if (preset) {
      context += `\nPreset/Style: ${preset}`;
    }
    if (enhancementOptions && Object.keys(enhancementOptions).length > 0) {
      context += '\nSelected options:';
      for (const [key, value] of Object.entries(enhancementOptions)) {
        if (value) {
          context += `\n  - ${key}: ${value}`;
        }
      }
    }

    const outputLang = locale === 'zh' ? 'Chinese (Simplified)' : 'English';

    const systemPrompt = `/no_think
You are a creative idea generator. Based on the given context, generate exactly 10 creative and diverse ideas/topics that the user could use as input for prompt generation.

IMPORTANT: You must tailor your ideas specifically based on ALL the selected options provided. Do NOT generate generic ideas for the broad category alone. Each selected option should influence and shape the ideas you generate. For example, if the user selected "Sci-Fi Adventure" with sub-genre "Cyberpunk", tech level "Post-Singularity", time setting "Near Future", conflict type "Human vs AI", and length "Novel" — then ALL 10 ideas should be cyberpunk stories set in the near future involving human-AI conflicts suitable for novel-length works.

Rules:
- Each idea should be a short phrase (5-15 words)
- Ideas should be diverse but ALL must fit within the specific combination of selected options
- Ideas should be practical and specific, not vague
- Output in ${outputLang}
- Return ONLY a JSON array of 10 strings, no other text
- Example format: ["idea 1", "idea 2", ...]`;

    const userPrompt = `Generate 10 creative ideas that precisely match ALL of the following specifications:\n${context}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    };

    const body = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1000,
      temperature: 0.9,
    };

    let response = await fetchWithTimeout(
      OPENROUTER_API_URL,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...body, model: MODEL }),
      },
      30000
    );

    if (!response.ok) {
      response = await fetchWithTimeout(
        OPENROUTER_API_URL,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ ...body, model: MODEL_FALLBACK }),
        },
        30000
      );
    }

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to generate ideas' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse ideas' }, { status: 500 });
    }

    const ideas = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ ideas });
  } catch (error) {
    console.error('[generate-ideas] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
