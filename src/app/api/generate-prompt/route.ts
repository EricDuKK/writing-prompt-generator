import { type NextRequest, NextResponse } from 'next/server';
import { useCredits } from '@/lib/credits';

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

async function fetchOpenRouterWithFallback(
  primaryModel: string,
  fallbackModel: string,
  options: {
    headers: Record<string, string>;
    body: Record<string, unknown>;
    timeoutMs?: number;
    fallbackModel2?: string;
  }
): Promise<Response> {
  const { headers, body, timeoutMs = 60_000, fallbackModel2 } = options;

  const primaryResponse = await fetchWithTimeout(
    OPENROUTER_API_URL,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...body, model: primaryModel }),
    },
    timeoutMs
  );

  if (primaryResponse.ok) return primaryResponse;

  const fallbackResponse = await fetchWithTimeout(
    OPENROUTER_API_URL,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...body, model: fallbackModel }),
    },
    timeoutMs
  );

  if (fallbackResponse.ok) return fallbackResponse;
  if (!fallbackModel2) return fallbackResponse;

  return fetchWithTimeout(
    OPENROUTER_API_URL,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...body, model: fallbackModel2 }),
    },
    timeoutMs
  );
}

function getSystemPrompt(category: string): string {
  const prompts: Record<string, string> = {
    general: 'You are a professional deep research prompt engineer. Generate high-quality, detailed, and comprehensive research prompts based on user input. The prompts should be clear, specific, actionable, and designed to facilitate deep analysis and thorough investigation. Generate the prompt in English.',
    image: 'You are a professional image generation prompt engineer. Generate DETAILED and RICH prompts for AI image generation tools. Generate the prompt in English.',
    video: 'You are a professional AI video generation prompt engineer. Generate the prompt in English.',
    code: 'You are a professional coding assistant prompt engineer. Generate detailed prompts for code generation tasks. Generate the prompt in English.',
    writing: 'You are a professional writing prompt engineer. Generate detailed prompts for various writing tasks. Include writing style, tone, length, target audience, and purpose. Generate the prompt in English.',
    marketing: 'You are a professional marketing copy prompt engineer. Generate detailed prompts for marketing content creation. Generate the prompt in English.',
  };
  return prompts[category] || prompts.general;
}

function createStreamResponse(response: Response): Response {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) { controller.close(); return; }

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') { controller.close(); return; }

              try {
                const json = JSON.parse(data);
                const content = json.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                  );
                }
              } catch {
                // ignore parse errors
              }
            }
          }
        }
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
}

export async function POST(req: NextRequest) {
  try {
    // Credit check
    const creditResult = await useCredits('generate-prompt', req);
    if (!creditResult.ok) {
      return NextResponse.json({ error: creditResult.error }, { status: creditResult.anonymous ? 429 : 402 });
    }

    const body = await req.json();
    const {
      input,
      prompt,
      category,
      enhancementOptions,
      customEnhancement,
      previousContext,
      isContinueConversation,
      aiModel,
    } = body;

    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'OpenRouter API key is not configured' }, { status: 500 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const siteName = 'Writing Prompt Generator';

    // Handle continue conversation
    if (isContinueConversation && previousContext && prompt) {
      const systemPrompt = `You are a professional AI assistant. You have previously generated the following content for the user. Now continue the conversation based on the user's new request. Maintain consistency with the previous content while fulfilling the new request.

Previous content:
---
${previousContext}
---

Important instructions:
1. Understand and build upon the previous content
2. Follow the user's new request precisely
3. Maintain a consistent style and quality
4. Output only the result, no explanations or meta-commentary`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ];

      const response = await fetchOpenRouterWithFallback(MODEL, MODEL_FALLBACK1, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': siteUrl,
          'X-Title': siteName,
          'Content-Type': 'application/json',
        },
        body: { messages, stream: true },
        fallbackModel2: MODEL_FALLBACK2,
      });

      if (!response.ok) {
        const errorData = await response.text();
        return NextResponse.json(
          { error: 'Failed to continue conversation', details: errorData },
          { status: response.status }
        );
      }

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          if (!reader) { controller.close(); return; }
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') { controller.close(); return; }
                  try {
                    const json = JSON.parse(data);
                    const content = json.choices?.[0]?.delta?.content;
                    if (content) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: content })}\n\n`));
                    }
                  } catch { /* ignore */ }
                }
              }
            }
          } catch (error) {
            controller.error(error);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
      });
    }

    if (!input?.trim()) {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 });
    }

    const systemPrompt = getSystemPrompt(category);
    let textContent = `Generate a professional ${category} prompt based on this input: "${input}"`;

    if (enhancementOptions && Object.keys(enhancementOptions).length > 0) {
      const enhancementDetails = Object.entries(enhancementOptions)
        .filter(([_, value]) => value)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      textContent += `\n\nEnhancement options:\n${enhancementDetails}`;
    }

    if (customEnhancement) {
      textContent += `\n\nAdditional custom requirements:\n${customEnhancement}`;
    }

    textContent += '\n\nGenerate a detailed, professional prompt that incorporates all the provided information. IMPORTANT: The entire output must be written in English only.';

    const messages = [{ role: 'user', content: textContent }];

    const selectedModel = aiModel || MODEL;
    const useDefaultFallback = !aiModel;

    const commonHeaders = {
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': siteUrl,
      'X-Title': siteName,
      'Content-Type': 'application/json',
    };
    const requestBody = {
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: true,
    };

    let response: Response;
    if (useDefaultFallback) {
      response = await fetchOpenRouterWithFallback(selectedModel, MODEL_FALLBACK1, {
        headers: commonHeaders,
        body: requestBody as Record<string, unknown>,
        fallbackModel2: MODEL_FALLBACK2,
      });
    } else {
      response = await fetchWithTimeout(
        OPENROUTER_API_URL,
        {
          method: 'POST',
          headers: commonHeaders,
          body: JSON.stringify({ ...requestBody, model: selectedModel }),
        },
        60_000
      );
    }

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: 'Failed to generate prompt', details: errorData },
        { status: response.status }
      );
    }

    return createStreamResponse(response);
  } catch (error) {
    console.error('Error generating prompt:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
