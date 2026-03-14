import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const range = searchParams.get('range') || '1h'; // 1h, 6h, 24h, 7d

  const rangeMs: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
  };
  const ms = rangeMs[range] || rangeMs['1h'];
  const since = new Date(Date.now() - ms).toISOString();

  // Get latest per server (for current status)
  const { data: latestData, error } = await supabase
    .from('server_metrics')
    .select('*')
    .order('checked_at', { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ servers: [], history: {}, timestamp: Date.now(), error: error.message }, { status: 500 });
  }

  const latest = new Map<string, (typeof latestData)[0]>();
  for (const row of latestData || []) {
    if (!latest.has(row.name)) latest.set(row.name, row);
  }

  const servers = Array.from(latest.values()).map(row => ({
    name: row.name,
    host: row.host,
    specs: row.specs,
    metrics: row.metrics,
    services: row.services || [],
    status: row.status as 'online' | 'offline',
  }));

  // Get history for sparklines
  const { data: historyData } = await supabase
    .from('server_metrics')
    .select('name, metrics, checked_at')
    .gte('checked_at', since)
    .order('checked_at', { ascending: true })
    .limit(2000);

  // Group history by server name
  const history: Record<string, { cpu: number; ram: number; disk: number; t: string }[]> = {};
  for (const row of historyData || []) {
    if (!history[row.name]) history[row.name] = [];
    history[row.name].push({
      cpu: row.metrics?.cpuPercent ?? 0,
      ram: row.metrics?.ramPercent ?? 0,
      disk: row.metrics?.diskPercent ?? 0,
      t: row.checked_at,
    });
  }

  return NextResponse.json({
    servers,
    history,
    range,
    timestamp: latestData?.[0]?.checked_at ? new Date(latestData[0].checked_at).getTime() : Date.now(),
  });
}

// POST endpoint for the local cron to push metrics
export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { servers } = body as { servers: Array<{
    name: string; host: string; specs: object; metrics: object; services?: object[]; status: string;
  }> };

  for (const s of servers) {
    const { error } = await supabase.from('server_metrics').insert({
      name: s.name,
      host: s.host,
      specs: s.specs,
      metrics: s.metrics,
      services: s.services || [],
      status: s.status,
      checked_at: new Date().toISOString(),
    });
    if (error) console.error('Insert error:', error);
  }

  return NextResponse.json({ ok: true, count: servers.length });
}
