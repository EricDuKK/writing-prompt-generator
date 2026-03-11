import { type NextRequest, NextResponse } from 'next/server';
import { useCredits } from '@/lib/credits';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const FREE_MODEL = 'google/gemini-2.5-flash';
const FREE_MODEL_FALLBACK1 = 'qwen/qwen3-vl-235b-a22b-thinking';
const FREE_MODEL_FALLBACK2 = 'deepseek/deepseek-r1-0528:free';

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

export async function POST(req: NextRequest) {
  try {
    // Credit check
    const creditResult = await useCredits('generate-text', req);
    if (!creditResult.ok) {
      return NextResponse.json({ error: creditResult.error }, { status: creditResult.anonymous ? 429 : 402 });
    }

    const body = await req.json();
    const { prompt, model: requestedModel } = body;

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'OpenRouter API key is not configured' }, { status: 500 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const siteName = 'Writing Prompt Generator';

    const systemPrompt = "You are a helpful assistant. Generate detailed, comprehensive text content based on the user's prompt. Provide well-structured, informative, and engaging content. Do not generate prompts, but actual content.";

    const commonHeaders = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': siteUrl,
      'X-Title': siteName,
    };
    const requestBody = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      stream: true,
    };

    // Use requested model or fallback chain
    const selectedModel = requestedModel || FREE_MODEL;

    let response = await fetchWithTimeout(
      OPENROUTER_API_URL,
      {
        method: 'POST',
        headers: commonHeaders,
        body: JSON.stringify({ ...requestBody, model: selectedModel }),
      },
      60_000
    );

    if (!response.ok && selectedModel === FREE_MODEL) {
      response = await fetchWithTimeout(
        OPENROUTER_API_URL,
        {
          method: 'POST',
          headers: commonHeaders,
          body: JSON.stringify({ ...requestBody, model: FREE_MODEL_FALLBACK1 }),
        },
        60_000
      );
    }

    if (!response.ok) {
      response = await fetchWithTimeout(
        OPENROUTER_API_URL,
        {
          method: 'POST',
          headers: commonHeaders,
          body: JSON.stringify({ ...requestBody, model: FREE_MODEL_FALLBACK2 }),
        },
        60_000
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: (errorData as any).error?.message || 'Failed to generate text' },
        { status: response.status }
      );
    }

    // Stream response, filter out reasoning_content
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const reader = response.body?.getReader();
          if (!reader) { controller.close(); return; }

          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta;
                  if (delta) {
                    if (delta.reasoning_content) continue;
                    if (delta.content) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify(parsed)}\n\n`));
                    }
                  }
                } catch {
                  // Skip invalid JSON
                }
              }
            }
          }

          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
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
    console.error('Error generating text:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
