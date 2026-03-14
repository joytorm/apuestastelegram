import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { sendTelegramAlert } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

const TIMEOUT_MS = 5000;

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

interface ProviderCheck {
  name: string;
  check: () => Promise<void>;
}

function getProviderChecks(): ProviderCheck[] {
  const checks: ProviderCheck[] = [];

  if (process.env.PROVIDER_GOOGLE_AI_KEY) {
    checks.push({
      name: 'Google AI Studio (Gemini)',
      check: async () => {
        const res = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.PROVIDER_GOOGLE_AI_KEY}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }
    });
  }
  if (process.env.PROVIDER_GROQ_KEY) {
    checks.push({
      name: 'Groq',
      check: async () => {
        const res = await fetchWithTimeout('https://api.groq.com/openai/v1/models', {
          headers: { Authorization: `Bearer ${process.env.PROVIDER_GROQ_KEY}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }
    });
  }
  if (process.env.PROVIDER_CEREBRAS_KEY) {
    checks.push({
      name: 'Cerebras',
      check: async () => {
        const res = await fetchWithTimeout('https://api.cerebras.ai/v1/models', {
          headers: { Authorization: `Bearer ${process.env.PROVIDER_CEREBRAS_KEY}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }
    });
  }
  if (process.env.PROVIDER_SAMBANOVA_KEY) {
    checks.push({
      name: 'SambaNova',
      check: async () => {
        const res = await fetchWithTimeout('https://api.sambanova.ai/v1/models', {
          headers: { Authorization: `Bearer ${process.env.PROVIDER_SAMBANOVA_KEY}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }
    });
  }
  if (process.env.PROVIDER_OPENROUTER_KEY) {
    checks.push({
      name: 'OpenRouter',
      check: async () => {
        const res = await fetchWithTimeout('https://openrouter.ai/api/v1/auth/key', {
          headers: { Authorization: `Bearer ${process.env.PROVIDER_OPENROUTER_KEY}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }
    });
  }
  if (process.env.PROVIDER_MISTRAL_KEY) {
    checks.push({
      name: 'Mistral',
      check: async () => {
        const res = await fetchWithTimeout('https://api.mistral.ai/v1/models', {
          headers: { Authorization: `Bearer ${process.env.PROVIDER_MISTRAL_KEY}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }
    });
  }
  if (process.env.PROVIDER_NVIDIA_KEY) {
    checks.push({
      name: 'NVIDIA NIM',
      check: async () => {
        const res = await fetchWithTimeout('https://integrate.api.nvidia.com/v1/models', {
          headers: { Authorization: `Bearer ${process.env.PROVIDER_NVIDIA_KEY}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }
    });
  }
  if (process.env.PROVIDER_COHERE_KEY) {
    checks.push({
      name: 'Cohere',
      check: async () => {
        const res = await fetchWithTimeout('https://api.cohere.com/v2/models', {
          headers: { Authorization: `Bearer ${process.env.PROVIDER_COHERE_KEY}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }
    });
  }
  if (process.env.PROVIDER_HUGGINGFACE_KEY) {
    checks.push({
      name: 'HuggingFace',
      check: async () => {
        const res = await fetchWithTimeout('https://huggingface.co/api/whoami-v2', {
          headers: { Authorization: `Bearer ${process.env.PROVIDER_HUGGINGFACE_KEY}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }
    });
  }

  return checks;
}

export async function GET() {
  const supabase = createServiceRoleClient();
  const providerChecks = getProviderChecks();
  const timestamp = new Date().toISOString();

  // Get the most recent status for each provider (to detect transitions)
  const { data: previousChecks } = await supabase
    .from('uptime_checks')
    .select('provider, status')
    .order('checked_at', { ascending: false })
    .limit(providerChecks.length * 2);

  const previousStatusMap = new Map<string, string>();
  for (const row of previousChecks ?? []) {
    if (!previousStatusMap.has(row.provider)) {
      previousStatusMap.set(row.provider, row.status);
    }
  }

  // Run all checks
  const results = await Promise.allSettled(
    providerChecks.map(async (p) => {
      const start = Date.now();
      try {
        await p.check();
        const latency = Date.now() - start;
        return {
          name: p.name,
          status: (latency > 3000 ? 'degraded' : 'online') as string,
          latency
        };
      } catch {
        return {
          name: p.name,
          status: 'offline' as string,
          latency: Date.now() - start
        };
      }
    })
  );

  const providers = results.map((r) =>
    r.status === 'fulfilled'
      ? r.value
      : { name: 'Unknown', status: 'offline', latency: TIMEOUT_MS }
  );

  // Store in uptime_checks
  const rows = providers.map((p) => ({
    provider: p.name,
    status: p.status,
    latency_ms: p.latency,
    checked_at: timestamp
  }));
  await supabase.from('uptime_checks').insert(rows);

  // Detect alerts: providers that just went offline
  const alerts: { provider: string; status: string; previousStatus: string }[] = [];
  for (const p of providers) {
    const prev = previousStatusMap.get(p.name);
    if (p.status === 'offline' && prev && prev !== 'offline') {
      alerts.push({
        provider: p.name,
        status: p.status,
        previousStatus: prev
      });
    }
  }

  // Also check server staleness (no metrics in last 5 min = offline)
  const serverAlerts: string[] = [];
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: recentMetrics } = await supabase
    .from('server_metrics')
    .select('name, checked_at')
    .order('checked_at', { ascending: false })
    .limit(20);

  const latestPerServer = new Map<string, string>();
  for (const row of recentMetrics ?? []) {
    if (!latestPerServer.has(row.name)) latestPerServer.set(row.name, row.checked_at);
  }
  for (const [name, checkedAt] of Array.from(latestPerServer.entries())) {
    if (checkedAt < fiveMinAgo) {
      serverAlerts.push(name);
    }
  }

  // Send Telegram alerts if any issues
  if (alerts.length > 0 || serverAlerts.length > 0) {
    const lines: string[] = ['🚨 <b>Panel Entrelanzados — Alerta</b>\n'];
    for (const a of alerts) {
      lines.push(`❌ <b>${a.provider}</b> caído (era: ${a.previousStatus})`);
    }
    for (const name of serverAlerts) {
      lines.push(`🖥️ <b>${name}</b> sin métricas hace +5 min`);
    }
    lines.push(`\n🕐 ${new Date().toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid' })}`);
    await sendTelegramAlert(lines.join('\n'));
  }

  // Also send recovery notifications
  const recoveries: string[] = [];
  for (const p of providers) {
    const prev = previousStatusMap.get(p.name);
    if (p.status === 'online' && prev === 'offline') {
      recoveries.push(p.name);
    }
  }
  if (recoveries.length > 0) {
    await sendTelegramAlert(
      `✅ <b>Recuperado</b>\n${recoveries.map(r => `• ${r}`).join('\n')}\n\n🕐 ${new Date().toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid' })}`
    );
  }

  return NextResponse.json({ providers, alerts, serverAlerts, timestamp });
}
