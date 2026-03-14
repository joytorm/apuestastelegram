import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export const dynamic = 'force-dynamic';

interface ProviderCheckResult {
  name: string;
  status: 'online' | 'degraded' | 'offline';
  latency: number;
  modelsCount?: number;
  endpoint: string;
  tier: 'Free' | 'Paid';
  limit: string;
  monthlyCost: number;
  // Token/request limits
  dailyTokens?: string;
  monthlyTokens?: string;
  rateLimit?: string;
  topModels?: string[];
  // OpenRouter-specific credit info
  creditUsage?: number;
  creditLimit?: number;
  creditRemaining?: number;
}

interface ProviderConfig {
  name: string;
  endpoint: string;
  tier: 'Free' | 'Paid';
  limit: string;
  monthlyCost: number;
  dailyTokens?: string;
  monthlyTokens?: string;
  rateLimit?: string;
  topModels?: string[];
  check: () => Promise<{ modelsCount?: number; creditUsage?: number; creditLimit?: number; creditRemaining?: number }>;
}

const TIMEOUT_MS = 5000;

let cachedResult: { data: ProviderCheckResult[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 60_000;

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

function getProviders(): ProviderConfig[] {
  const providers: ProviderConfig[] = [];

  // Google AI Studio
  if (process.env.PROVIDER_GOOGLE_AI_KEY) {
    providers.push({
      name: 'Google AI Studio (Gemini)',
      endpoint: 'generativelanguage.googleapis.com',
      tier: 'Free',
      limit: '1500 RPD, 1M TPM',
      dailyTokens: '~1.4B tokens/día',
      monthlyTokens: '~43B tokens/mes',
      rateLimit: '15 RPM, 1500 RPD',
      topModels: ['Gemini 2.0 Flash', 'Gemini 1.5 Pro', 'Gemini 1.5 Flash'],
      monthlyCost: 0,
      check: async () => {
        const res = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.PROVIDER_GOOGLE_AI_KEY}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return { modelsCount: data.models?.length };
      }
    });
  }

  // Groq
  if (process.env.PROVIDER_GROQ_KEY) {
    providers.push({
      name: 'Groq',
      endpoint: 'api.groq.com',
      tier: 'Free',
      limit: '1K RPD (70B), 14.4K RPD (8B)',
      dailyTokens: '500K tokens/día (8B), 100K tokens/día (70B)',
      monthlyTokens: '~15M tokens/mes',
      rateLimit: '30 RPM, 1K-14.4K RPD',
      topModels: ['Llama 3.3 70B', 'Llama 4 Scout', 'Qwen 3 32B', 'Kimi K2'],
      monthlyCost: 0,
      check: async () => {
        const res = await fetchWithTimeout('https://api.groq.com/openai/v1/models', {
          headers: { Authorization: `Bearer ${process.env.PROVIDER_GROQ_KEY}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return { modelsCount: data.data?.length };
      }
    });
  }

  // Cerebras
  if (process.env.PROVIDER_CEREBRAS_KEY) {
    providers.push({
      name: 'Cerebras',
      endpoint: 'api.cerebras.ai',
      tier: 'Free',
      limit: '1M tokens/day',
      dailyTokens: '1M tokens/día',
      monthlyTokens: '~30M tokens/mes',
      rateLimit: 'Sin límite RPM publicado',
      topModels: ['Llama 3.3 70B', 'Llama 3.1 8B', 'GPT OSS 120B'],
      monthlyCost: 0,
      check: async () => {
        const res = await fetchWithTimeout('https://api.cerebras.ai/v1/models', {
          headers: { Authorization: `Bearer ${process.env.PROVIDER_CEREBRAS_KEY}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return { modelsCount: data.data?.length };
      }
    });
  }

  // SambaNova
  if (process.env.PROVIDER_SAMBANOVA_KEY) {
    providers.push({
      name: 'SambaNova',
      endpoint: 'api.sambanova.ai',
      tier: 'Free',
      limit: 'Generous (no explicit limit)',
      dailyTokens: '~500 req/día (ilimitado tokens)',
      monthlyTokens: '~15K req/mes',
      rateLimit: 'Sin límite publicado',
      topModels: ['DeepSeek-R1', 'DeepSeek-V3.2', 'Llama 3.3 70B', 'Qwen3-235B'],
      monthlyCost: 0,
      check: async () => {
        const res = await fetchWithTimeout('https://api.sambanova.ai/v1/models', {
          headers: { Authorization: `Bearer ${process.env.PROVIDER_SAMBANOVA_KEY}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return { modelsCount: data.data?.length };
      }
    });
  }

  // OpenRouter (special: returns credit info)
  if (process.env.PROVIDER_OPENROUTER_KEY) {
    providers.push({
      name: 'OpenRouter',
      endpoint: 'openrouter.ai',
      tier: 'Free',
      limit: '1000 req/day, $10 credit',
      dailyTokens: '1000 req/día',
      monthlyTokens: '$10 crédito total',
      rateLimit: '1000 RPD',
      topModels: ['GPT-4o', 'Claude', 'Llama', 'Mistral'],
      monthlyCost: 0,
      check: async () => {
        const res = await fetchWithTimeout('https://openrouter.ai/api/v1/auth/key', {
          headers: { Authorization: `Bearer ${process.env.PROVIDER_OPENROUTER_KEY}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const d = data.data;
        return {
          creditUsage: d?.usage,
          creditLimit: d?.limit,
          creditRemaining: d?.limit_remaining
        };
      }
    });
  }

  // Mistral
  if (process.env.PROVIDER_MISTRAL_KEY) {
    providers.push({
      name: 'Mistral',
      endpoint: 'api.mistral.ai',
      tier: 'Free',
      limit: '1B tokens/month per model',
      dailyTokens: '~33M tokens/día por modelo',
      monthlyTokens: '1B tokens/mes × 20+ modelos',
      rateLimit: '1 RPS, 500K TPM',
      topModels: ['Mistral Large', 'Codestral', 'Pixtral', 'Ministral 8B'],
      monthlyCost: 0,
      check: async () => {
        const res = await fetchWithTimeout('https://api.mistral.ai/v1/models', {
          headers: { Authorization: `Bearer ${process.env.PROVIDER_MISTRAL_KEY}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return { modelsCount: data.data?.length };
      }
    });
  }

  // NVIDIA NIM
  if (process.env.PROVIDER_NVIDIA_KEY) {
    providers.push({
      name: 'NVIDIA NIM',
      endpoint: 'integrate.api.nvidia.com',
      tier: 'Free',
      limit: 'No daily limit',
      dailyTokens: 'Sin límite diario',
      monthlyTokens: 'Sin límite mensual',
      rateLimit: 'Sin límite publicado',
      topModels: ['Llama 3.1 405B', 'DeepSeek', 'Kimi K2.5', 'Nemotron'],
      monthlyCost: 0,
      check: async () => {
        const res = await fetchWithTimeout('https://integrate.api.nvidia.com/v1/models', {
          headers: { Authorization: `Bearer ${process.env.PROVIDER_NVIDIA_KEY}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return { modelsCount: data.data?.length };
      }
    });
  }

  // Cohere
  if (process.env.PROVIDER_COHERE_KEY) {
    providers.push({
      name: 'Cohere',
      endpoint: 'api.cohere.com',
      tier: 'Free',
      limit: '1000 calls/month',
      dailyTokens: '~33 calls/día',
      monthlyTokens: '1000 calls/mes',
      rateLimit: '20 RPM',
      topModels: ['Command A', 'Command R+', 'Embed v3', 'Rerank v3'],
      monthlyCost: 0,
      check: async () => {
        const res = await fetchWithTimeout('https://api.cohere.com/v2/models', {
          headers: { Authorization: `Bearer ${process.env.PROVIDER_COHERE_KEY}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return { modelsCount: data.models?.length };
      }
    });
  }

  // GitHub Models
  if (process.env.PROVIDER_GITHUB_MODELS_KEY) {
    providers.push({
      name: 'GitHub Models',
      endpoint: 'models.inference.ai.azure.com',
      tier: 'Free',
      limit: '150K TPM, 10 RPM (GPT-4o)',
      dailyTokens: '~216M tokens/día (150K TPM)',
      monthlyTokens: '~6.5B tokens/mes',
      rateLimit: '15 RPM, 10 RPM (GPT-4o)',
      topModels: ['GPT-4o', 'Llama 3.1 405B', 'Mistral Large', 'Phi-3'],
      monthlyCost: 0,
      check: async () => {
        const res = await fetchWithTimeout('https://models.inference.ai.azure.com/models', {
          headers: { Authorization: `Bearer ${process.env.PROVIDER_GITHUB_MODELS_KEY}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return { modelsCount: Array.isArray(data) ? data.length : data.data?.length };
      }
    });
  }

  // Cloudflare Workers AI
  if (process.env.PROVIDER_CLOUDFLARE_KEY && process.env.PROVIDER_CLOUDFLARE_ACCOUNT_ID) {
    providers.push({
      name: 'Cloudflare Workers AI',
      endpoint: 'api.cloudflare.com',
      tier: 'Free',
      limit: '10K neurons/day',
      dailyTokens: '~10K-30K tokens/día',
      monthlyTokens: '~300K-900K tokens/mes',
      rateLimit: '10K neurons/día',
      topModels: ['Llama 3.1 8B', 'Mistral 7B', 'Phi-2'],
      monthlyCost: 0,
      check: async () => {
        const accountId = process.env.PROVIDER_CLOUDFLARE_ACCOUNT_ID;
        const res = await fetchWithTimeout(
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/models/search`,
          {
            headers: {
              'X-Auth-Email': process.env.PROVIDER_CLOUDFLARE_EMAIL || '',
              'X-Auth-Key': process.env.PROVIDER_CLOUDFLARE_KEY || ''
            }
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return { modelsCount: data.result?.length };
      }
    });
  }

  // HuggingFace
  if (process.env.PROVIDER_HUGGINGFACE_KEY) {
    providers.push({
      name: 'HuggingFace',
      endpoint: 'huggingface.co',
      tier: 'Free',
      limit: 'Credits included',
      dailyTokens: '~100 req/día',
      monthlyTokens: '~3000 req/mes',
      rateLimit: '15+ inference providers',
      topModels: ['Kimi K2', 'Llama', 'Mistral', 'FLUX.1'],
      monthlyCost: 0,
      check: async () => {
        const res = await fetchWithTimeout('https://huggingface.co/api/whoami-v2', {
          headers: { Authorization: `Bearer ${process.env.PROVIDER_HUGGINGFACE_KEY}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return {};
      }
    });
  }

  // OpenAI
  if (process.env.PROVIDER_OPENAI_KEY) {
    providers.push({
      name: 'OpenAI',
      endpoint: 'api.openai.com',
      tier: 'Paid',
      limit: 'Pay per use',
      monthlyCost: 12.5,
      check: async () => {
        const res = await fetchWithTimeout('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${process.env.PROVIDER_OPENAI_KEY}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return { modelsCount: data.data?.length };
      }
    });
  }

  // Anthropic
  if (process.env.ANTHROPIC_API_KEY) {
    providers.push({
      name: 'Anthropic',
      endpoint: 'api.anthropic.com',
      tier: 'Paid',
      limit: 'Pay per use',
      monthlyCost: 45.0,
      check: async () => {
        const res = await fetchWithTimeout('https://api.anthropic.com/v1/models', {
          headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY || '',
            'anthropic-version': '2023-06-01'
          }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return { modelsCount: data.data?.length };
      }
    });
  }

  return providers;
}

export async function GET() {
  // Return cached result if fresh
  if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      providers: cachedResult.data,
      timestamp: cachedResult.timestamp,
      cached: true
    });
  }

  const providers = getProviders();

  const results = await Promise.allSettled(
    providers.map(async (provider): Promise<ProviderCheckResult> => {
      const start = Date.now();
      try {
        const extra = await provider.check();
        const latency = Date.now() - start;
        return {
          name: provider.name,
          status: latency > 3000 ? 'degraded' : 'online',
          latency,
          endpoint: provider.endpoint,
          tier: provider.tier,
          limit: provider.limit,
          dailyTokens: provider.dailyTokens,
          monthlyTokens: provider.monthlyTokens,
          rateLimit: provider.rateLimit,
          topModels: provider.topModels,
          monthlyCost: provider.monthlyCost,
          ...extra
        };
      } catch {
        const latency = Date.now() - start;
        return {
          name: provider.name,
          status: 'offline',
          latency,
          endpoint: provider.endpoint,
          tier: provider.tier,
          limit: provider.limit,
          monthlyCost: provider.monthlyCost
        };
      }
    })
  );

  const data = results.map((r) =>
    r.status === 'fulfilled'
      ? r.value
      : {
          name: 'Unknown',
          status: 'offline' as const,
          latency: TIMEOUT_MS,
          endpoint: '',
          tier: 'Free' as const,
          limit: '',
          monthlyCost: 0
        }
  );

  const timestamp = Date.now();
  cachedResult = { data, timestamp };

  // Store results in uptime_checks (fire-and-forget)
  try {
    const supabase = createServiceRoleClient();
    const rows = data.map((p) => ({
      provider: p.name,
      status: p.status,
      latency_ms: p.latency,
      models_count: p.modelsCount ?? null,
      checked_at: new Date(timestamp).toISOString()
    }));
    await supabase.from('uptime_checks').insert(rows);
  } catch {
    // Don't fail the response if DB insert fails
  }

  return NextResponse.json({
    providers: data,
    timestamp,
    cached: false
  });
}
