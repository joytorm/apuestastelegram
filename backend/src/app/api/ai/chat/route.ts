import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export const dynamic = 'force-dynamic';

interface ChatRequest {
  model?: string;
  messages: { role: string; content: string }[];
  provider?: string;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

interface ProviderRoute {
  name: string;
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
  headers: (key: string) => Record<string, string>;
}

function getProviderRoutes(): ProviderRoute[] {
  const routes: ProviderRoute[] = [];

  if (process.env.PROVIDER_SAMBANOVA_KEY) {
    routes.push({
      name: 'SambaNova',
      baseUrl: 'https://api.sambanova.ai/v1',
      apiKey: process.env.PROVIDER_SAMBANOVA_KEY,
      defaultModel: 'Meta-Llama-3.3-70B-Instruct',
      headers: (key) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' })
    });
  }
  if (process.env.PROVIDER_GROQ_KEY) {
    routes.push({
      name: 'Groq',
      baseUrl: 'https://api.groq.com/openai/v1',
      apiKey: process.env.PROVIDER_GROQ_KEY,
      defaultModel: 'llama-3.3-70b-versatile',
      headers: (key) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' })
    });
  }
  if (process.env.PROVIDER_CEREBRAS_KEY) {
    routes.push({
      name: 'Cerebras',
      baseUrl: 'https://api.cerebras.ai/v1',
      apiKey: process.env.PROVIDER_CEREBRAS_KEY,
      defaultModel: 'llama-3.3-70b',
      headers: (key) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' })
    });
  }
  if (process.env.PROVIDER_GOOGLE_AI_KEY) {
    routes.push({
      name: 'Google AI Studio (Gemini)',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
      apiKey: process.env.PROVIDER_GOOGLE_AI_KEY,
      defaultModel: 'gemini-2.0-flash',
      headers: (key) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' })
    });
  }
  if (process.env.PROVIDER_MISTRAL_KEY) {
    routes.push({
      name: 'Mistral',
      baseUrl: 'https://api.mistral.ai/v1',
      apiKey: process.env.PROVIDER_MISTRAL_KEY,
      defaultModel: 'mistral-small-latest',
      headers: (key) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' })
    });
  }
  if (process.env.PROVIDER_NVIDIA_KEY) {
    routes.push({
      name: 'NVIDIA NIM',
      baseUrl: 'https://integrate.api.nvidia.com/v1',
      apiKey: process.env.PROVIDER_NVIDIA_KEY,
      defaultModel: 'meta/llama-3.3-70b-instruct',
      headers: (key) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' })
    });
  }

  return routes;
}

async function tryProvider(
  route: ProviderRoute,
  body: ChatRequest
): Promise<{ response: Response; provider: string; model: string }> {
  const model = body.model || route.defaultModel;
  const payload = {
    model,
    messages: body.messages,
    stream: body.stream ?? false,
    ...(body.temperature != null && { temperature: body.temperature }),
    ...(body.max_tokens != null && { max_tokens: body.max_tokens })
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${route.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: route.headers(route.apiKey),
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`${route.name} returned ${res.status}: ${errText}`);
    }

    return { response: res, provider: route.name, model };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  let body: ChatRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: 'messages is required' }, { status: 400 });
  }

  const allRoutes = getProviderRoutes();
  if (allRoutes.length === 0) {
    return NextResponse.json({ error: 'No provider API keys configured' }, { status: 500 });
  }

  // If a specific provider is requested, try only that one
  let routesToTry: ProviderRoute[];
  if (body.provider) {
    const match = allRoutes.find(
      (r) => r.name.toLowerCase().includes(body.provider!.toLowerCase())
    );
    if (!match) {
      return NextResponse.json(
        { error: `Provider "${body.provider}" not found. Available: ${allRoutes.map((r) => r.name).join(', ')}` },
        { status: 400 }
      );
    }
    routesToTry = [match];
  } else {
    routesToTry = allRoutes;
  }

  // Try providers in order with fallback
  let lastError = '';
  for (const route of routesToTry) {
    try {
      const { response, provider, model } = await tryProvider(route, body);

      if (body.stream) {
        // Stream the response through
        const headers = new Headers();
        headers.set('Content-Type', 'text/event-stream');
        headers.set('Cache-Control', 'no-cache');
        headers.set('Connection', 'keep-alive');
        headers.set('X-Provider', provider);
        headers.set('X-Model', model);

        return new Response(response.body, { headers });
      }

      // Non-streaming: parse and log usage
      const data = await response.json();

      // Log token usage (fire-and-forget)
      const usage = data.usage;
      if (usage) {
        try {
          const supabase = createServiceRoleClient();
          await supabase.from('token_usage').insert({
            provider,
            model,
            prompt_tokens: usage.prompt_tokens ?? 0,
            completion_tokens: usage.completion_tokens ?? 0,
            total_tokens: usage.total_tokens ?? 0,
            recorded_at: new Date().toISOString()
          });
        } catch {
          // Don't fail if logging fails
        }
      }

      // Return OpenAI-compatible response with extra metadata
      return NextResponse.json({
        ...data,
        _meta: { provider, model, fallback: routesToTry.indexOf(route) > 0 }
      });
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      continue; // Try next provider
    }
  }

  return NextResponse.json(
    { error: `All providers failed. Last error: ${lastError}` },
    { status: 502 }
  );
}
