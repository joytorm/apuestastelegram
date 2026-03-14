'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { IconRefresh, IconServer, IconBrandDocker } from '@tabler/icons-react';
import PageContainer from '@/components/layout/page-container';

interface ServerMetrics {
  name: string;
  host: string;
  specs: { cores: number; ramGB: number; diskGB: number; os: string };
  metrics: {
    cpuPercent: number;
    ramPercent: number;
    ramUsed: string;
    ramTotal: string;
    diskPercent: number;
    diskUsed: string;
    diskTotal: string;
    uptime: string;
    loadAvg: string;
  };
  services?: { name: string; status: string }[];
  status: 'online' | 'offline';
}

interface HistoryPoint {
  cpu: number;
  ram: number;
  disk: number;
  t: string;
}

const RANGES = [
  { label: '1h', value: '1h' },
  { label: '6h', value: '6h' },
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
] as const;

/* ── Sparkline SVG ── */
function Sparkline({ data, color, height = 40, width = 200 }: { data: number[]; color: string; height?: number; width?: number }) {
  if (data.length < 2) return <div className="text-muted-foreground text-[10px] italic">accumulating data…</div>;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`);
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p}`).join(' ');
  // Area fill
  const areaD = `${pathD} L${(data.length - 1) * step},${height} L0,${height} Z`;
  const current = data[data.length - 1];

  return (
    <div className="flex items-end gap-2">
      <svg width={width} height={height} className="shrink-0">
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#grad-${color})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
        <circle cx={(data.length - 1) * step} cy={height - ((current - min) / range) * (height - 4) - 2} r={2.5} fill={color} />
      </svg>
      <span className="text-xs font-mono font-medium" style={{ color }}>{current}%</span>
    </div>
  );
}

/* ── Gauge Ring ── */
function GaugeRing({ value, label, detail, size = 90 }: { value: number; label: string; detail?: string; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const color = value < 50 ? 'text-green-500 dark:text-green-400' : value < 80 ? 'text-yellow-500 dark:text-yellow-400' : 'text-red-500 dark:text-red-400';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="stroke-muted" strokeWidth={5} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            className={`${color} transition-all duration-700`}
            stroke="currentColor" strokeWidth={5} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-bold">{value}%</span>
        </div>
      </div>
      <span className="text-xs font-medium">{label}</span>
      {detail && <span className="text-muted-foreground text-[10px]">{detail}</span>}
    </div>
  );
}

/* ── Server Card ── */
function ServerCard({ server, history, loading }: { server?: ServerMetrics; history?: HistoryPoint[]; loading: boolean }) {
  if (loading || !server) {
    return (
      <Card className="flex-1 min-w-[300px]">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center gap-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-24 rounded-full" />)}
          </div>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const isOnline = server.status === 'online';
  const cpuData = history?.map(h => h.cpu) ?? [];
  const ramData = history?.map(h => h.ram) ?? [];

  return (
    <Card className="flex-1 min-w-[300px]">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <IconServer className="h-5 w-5" />
          <CardTitle className="text-lg">{server.name}</CardTitle>
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-green-500 dark:bg-green-400 animate-status-pulse' : 'bg-red-500 dark:bg-red-400'}`} />
          <Badge variant={isOnline ? 'secondary' : 'destructive'} className="text-xs ml-auto">
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
        <CardDescription>
          {server.specs.os} · {server.specs.cores} cores · {server.specs.ramGB}GB RAM · {server.specs.diskGB}GB disk
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gauges */}
        <div className="flex justify-center gap-4 sm:gap-6">
          <GaugeRing value={server.metrics.cpuPercent} label="CPU" />
          <GaugeRing
            value={server.metrics.ramPercent} label="RAM"
            detail={`${server.metrics.ramUsed} / ${server.metrics.ramTotal}`}
          />
          <GaugeRing
            value={server.metrics.diskPercent} label="Disk"
            detail={`${server.metrics.diskUsed} / ${server.metrics.diskTotal}`}
          />
        </div>

        {/* Sparklines */}
        <div className="space-y-2">
          <div className="bg-muted/30 rounded-md px-3 py-2">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">CPU trend</span>
            <Sparkline data={cpuData} color="#22c55e" />
          </div>
          <div className="bg-muted/30 rounded-md px-3 py-2">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">RAM trend</span>
            <Sparkline data={ramData} color="#3b82f6" />
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-muted/50 rounded-md px-3 py-2">
            <span className="text-muted-foreground text-xs">Uptime</span>
            <p className="font-medium truncate">{server.metrics.uptime || '—'}</p>
          </div>
          <div className="bg-muted/50 rounded-md px-3 py-2">
            <span className="text-muted-foreground text-xs">Load Avg</span>
            <p className="font-mono font-medium text-xs">{server.metrics.loadAvg || '—'}</p>
          </div>
        </div>

        {/* Services */}
        {server.services && server.services.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <IconBrandDocker className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Services ({server.services.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {server.services.map(s => (
                <Badge key={s.name} variant="outline" className="text-[10px] px-2 py-0.5">
                  <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1 ${s.status.includes('healthy') || s.status === 'running' || s.status.startsWith('Up') ? 'bg-green-500 dark:bg-green-400' : 'bg-yellow-500 dark:bg-yellow-400'}`} />
                  {s.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Main Page ── */
export default function ServersPage() {
  const [data, setData] = React.useState<{
    servers: ServerMetrics[];
    history: Record<string, HistoryPoint[]>;
    timestamp: number;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [range, setRange] = React.useState<string>('1h');

  const fetchData = React.useCallback(async (r?: string) => {
    try {
      const res = await fetch(`/api/servers/status?range=${r || range}`);
      const json = await res.json();
      setData(json);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [range]);

  React.useEffect(() => {
    setLoading(true);
    fetchData(range);
    const interval = setInterval(() => fetchData(range), 60_000);
    return () => clearInterval(interval);
  }, [range, fetchData]);

  return (
    <PageContainer pageTitle="Servers" pageDescription="Real-time system metrics from all servers">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {/* Timerange selector */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            {RANGES.map(r => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  range === r.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {data && (
              <span className="text-muted-foreground text-xs">
                Last checked: {new Date(data.timestamp).toLocaleTimeString()}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchData(); }}>
              <IconRefresh className="mr-1 h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row">
          {loading && !data ? (
            <>
              <ServerCard loading={true} />
              <ServerCard loading={true} />
              <ServerCard loading={true} />
            </>
          ) : (
            data?.servers.map(s => (
              <ServerCard
                key={s.name}
                server={s}
                history={data?.history?.[s.name]}
                loading={false}
              />
            ))
          )}
        </div>
      </div>
    </PageContainer>
  );
}
