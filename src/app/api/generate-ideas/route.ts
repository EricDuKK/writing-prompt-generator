import { type NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.5-flash';
const MODEL_FALLBACK1 = 'qwen/qwen3-vl-235b-a22b-thinking';
const MODEL_FALLBACK2 = 'deepseek/deepseek-r1-0528:free';

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
      stream: true,
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
          body: JSON.stringify({ ...body, model: MODEL_FALLBACK1 }),
        },
        30000
      );
    }

    if (!response.ok) {
      response = await fetchWithTimeout(
        OPENROUTER_API_URL,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ ...body, model: MODEL_FALLBACK2 }),
        },
        30000
      );
    }

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to generate ideas' }, { status: 500 });
    }

    // Stream: accumulate text chunks and emit each idea as it's parsed
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) { controller.close(); return; }

        const decoder = new TextDecoder();
        let accumulated = '';
        let emittedCount = 0;

        try {
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
                  const json = JSON.parse(data);
                  const delta = json.choices?.[0]?.delta;
                  if (delta?.reasoning_content) continue;
                  const content = delta?.content;
                  if (content) {
                    accumulated += content;

                    // Try to extract complete ideas from accumulated JSON array
                    // Match each complete string in the array: "..."
                    const ideaRegex = /"([^"\\]*(?:\\.[^"\\]*)*)"/g;
                    let match: RegExpExecArray | null;
                    let count = 0;
                    while ((match = ideaRegex.exec(accumulated)) !== null) {
                      count++;
                      if (count > emittedCount) {
                        const idea = match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                        controller.enqueue(
                          encoder.encode(`data: ${JSON.stringify({ idea })}\n\n`)
                        );
                        emittedCount = count;
                      }
                    }
                  }
                } catch {
                  // ignore parse errors
                }
              }
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (error) {
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[generate-ideas] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
