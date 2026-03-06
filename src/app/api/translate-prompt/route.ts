import { type NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const TRANSLATION_MODEL = 'qwen/qwen3-vl-235b-a22b-thinking';
const TRANSLATION_MODEL_FALLBACK1 = 'deepseek/deepseek-r1-0528:free';
const TRANSLATION_MODEL_FALLBACK2 = 'google/gemini-2.5-flash-lite';

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
    const body = await req.json();
    const { text, targetLanguage = 'English' } = body;

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'OpenRouter API key is not configured' }, { status: 500 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const requestMessages = [
      {
        role: 'system',
        content: `You are a professional translator specializing in AI prompts.
Translate the given text to ${targetLanguage} while:
1. Preserving all technical terms and style descriptions
2. Keeping the prompt structure and format
3. Maintaining the same level of detail and specificity
4. Output ONLY the translated text, no explanations or additional text`,
      },
      {
        role: 'user',
        content: `Translate this prompt to ${targetLanguage}:\n\n${text}`,
      },
    ];

    const commonHeaders = {
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': siteUrl,
      'X-Title': 'Writing Prompt Generator',
      'Content-Type': 'application/json',
    };

    const requestBody = { messages: requestMessages, temperature: 0.3, stream: true };

    let response = await fetchWithTimeout(OPENROUTER_API_URL, {
      method: 'POST', headers: commonHeaders,
      body: JSON.stringify({ ...requestBody, model: TRANSLATION_MODEL }),
    }, 30_000);

    if (!response.ok) {
      response = await fetchWithTimeout(OPENROUTER_API_URL, {
        method: 'POST', headers: commonHeaders,
        body: JSON.stringify({ ...requestBody, model: TRANSLATION_MODEL_FALLBACK1 }),
      }, 30_000);
    }

    if (!response.ok) {
      response = await fetchWithTimeout(OPENROUTER_API_URL, {
        method: 'POST', headers: commonHeaders,
        body: JSON.stringify({ ...requestBody, model: TRANSLATION_MODEL_FALLBACK2 }),
      }, 30_000);
    }

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to translate text' }, { status: response.status });
    }

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
                if (data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta;
                  if (delta) {
                    if (delta.reasoning_content) continue;
                    if (delta.content) {
                      controller.enqueue(encoder.encode(`data: ${delta.content}\n\n`));
                    }
                  }
                } catch { /* ignore */ }
              }
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    });
  } catch (error) {
    console.error('Error translating text:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
