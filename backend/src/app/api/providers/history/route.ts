import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') ?? '24h';

  const hoursMap: Record<string, number> = { '24h': 24, '7d': 168 };
  const hours = hoursMap[period] ?? 24;

  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('uptime_checks')
    .select('provider, status, latency_ms, checked_at')
    .gte('checked_at', since)
    .order('checked_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group by provider
  const grouped: Record<string, { status: string; latency_ms: number; checked_at: string }[]> = {};
  for (const row of data ?? []) {
    if (!grouped[row.provider]) grouped[row.provider] = [];
    grouped[row.provider].push({
      status: row.status,
      latency_ms: row.latency_ms,
      checked_at: row.checked_at
    });
  }

  // For each provider, keep the last 50 checks and compute uptime %
  const history: Record<string, { checks: { status: string; latency_ms: number; checked_at: string }[]; uptimePercent: number }> = {};

  for (const [provider, checks] of Object.entries(grouped)) {
    const last50 = checks.slice(-50);
    const onlineCount = last50.filter((c) => c.status === 'online' || c.status === 'degraded').length;
    const uptimePercent = last50.length > 0 ? Math.round((onlineCount / last50.length) * 100) : 0;
    history[provider] = { checks: last50, uptimePercent };
  }

  return NextResponse.json({ history, period });
}
