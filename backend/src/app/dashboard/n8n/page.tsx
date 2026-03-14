'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { IconRefresh, IconPlayerPlay, IconPlayerStop, IconClock, IconCheck, IconX, IconExternalLink } from '@tabler/icons-react';
import PageContainer from '@/components/layout/page-container';

interface WorkflowStats {
  id: string;
  name: string;
  active: boolean;
  nodeCount: number;
  nodes: { type: string; name: string }[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  stats: {
    totalExecutions: number;
    successful: number;
    failed: number;
    successRate: number;
    avgDurationSec: number;
    currentStreak: number;
    lastExecution: {
      id: string;
      status: string;
      startedAt: string;
      stoppedAt: string;
      durationSec: number | null;
    } | null;
  };
}

interface TimelineEntry {
  id: string;
  workflowId: string;
  workflowName: string;
  status: string;
  startedAt: string;
  stoppedAt: string;
  durationSec: number | null;
}

interface N8NData {
  summary: {
    totalWorkflows: number;
    activeWorkflows: number;
    inactiveWorkflows: number;
    recentErrors: number;
    overallSuccessRate: number;
    totalExecutions: number;
  };
  workflows: WorkflowStats[];
  timeline: TimelineEntry[];
  timestamp: number;
}

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const s = sec % 60;
  return `${min}m ${s}s`;
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function SummaryCards({ summary }: { summary: N8NData['summary'] }) {
  const cards = [
    { label: 'Workflows', value: summary.totalWorkflows, sub: `${summary.activeWorkflows} active`, color: 'text-foreground' },
    { label: 'Success Rate', value: `${summary.overallSuccessRate}%`, sub: `${summary.totalExecutions} total`, color: summary.overallSuccessRate === 100 ? 'text-green-600 dark:text-green-400' : summary.overallSuccessRate >= 80 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400' },
    { label: 'Errors', value: summary.recentErrors, sub: 'last 10 runs', color: summary.recentErrors === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' },
    { label: 'Inactive', value: summary.inactiveWorkflows, sub: 'workflows paused', color: summary.inactiveWorkflows === 0 ? 'text-muted-foreground' : 'text-yellow-600 dark:text-yellow-400' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map(c => (
        <Card key={c.label}>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-muted-foreground text-xs font-medium">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-muted-foreground text-[10px]">{c.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function WorkflowCard({ wf }: { wf: WorkflowStats }) {
  const last = wf.stats.lastExecution;
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {wf.active ? (
            <IconPlayerPlay className="h-4 w-4 text-green-500 dark:text-green-400" />
          ) : (
            <IconPlayerStop className="h-4 w-4 text-muted-foreground" />
          )}
          <CardTitle className="text-base truncate">{wf.name}</CardTitle>
          <Badge variant={wf.active ? 'secondary' : 'outline'} className="ml-auto text-[10px]">
            {wf.active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          {wf.nodeCount} nodes · Created {new Date(wf.createdAt).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted/50 rounded-md px-2 py-1.5 text-center">
            <p className="text-lg font-bold">{wf.stats.successRate}%</p>
            <p className="text-muted-foreground text-[10px]">Success</p>
          </div>
          <div className="bg-muted/50 rounded-md px-2 py-1.5 text-center">
            <p className="text-lg font-bold">{formatDuration(wf.stats.avgDurationSec)}</p>
            <p className="text-muted-foreground text-[10px]">Avg time</p>
          </div>
          <div className="bg-muted/50 rounded-md px-2 py-1.5 text-center">
            <p className="text-lg font-bold text-green-600 dark:text-green-400">{wf.stats.currentStreak}🔥</p>
            <p className="text-muted-foreground text-[10px]">Streak</p>
          </div>
        </div>

        {/* Last execution */}
        {last && (
          <div className="flex items-center gap-2 text-xs">
            {last.status === 'success' ? (
              <IconCheck className="h-3.5 w-3.5 text-green-500 dark:text-green-400" />
            ) : (
              <IconX className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
            )}
            <span className="text-muted-foreground">Last run:</span>
            <span className="font-medium">{formatTimeAgo(last.startedAt)}</span>
            {last.durationSec !== null && (
              <span className="text-muted-foreground">({formatDuration(last.durationSec)})</span>
            )}
          </div>
        )}

        {/* Nodes */}
        <div className="flex flex-wrap gap-1">
          {wf.nodes.slice(0, 6).map((n, i) => (
            <Badge key={i} variant="outline" className="text-[9px] px-1.5 py-0">
              {n.name.length > 20 ? n.name.slice(0, 20) + '…' : n.name}
            </Badge>
          ))}
          {wf.nodes.length > 6 && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0">+{wf.nodes.length - 6}</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ExecutionTimeline({ timeline }: { timeline: TimelineEntry[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Recent Executions</CardTitle>
        <CardDescription className="text-xs">Last 30 workflow runs</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Dot grid: quick visual */}
        <div className="flex flex-wrap gap-1 mb-4">
          {timeline.map(e => (
            <div
              key={e.id}
              title={`${e.workflowName} — ${e.status} — ${e.startedAt?.slice(0, 16)}`}
              className={`h-4 w-4 rounded-sm transition-colors ${
                e.status === 'success'
                  ? 'bg-green-500 dark:bg-green-400'
                  : e.status === 'error'
                  ? 'bg-red-500 dark:bg-red-400'
                  : e.status === 'running'
                  ? 'bg-blue-500 dark:bg-blue-400 animate-pulse'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b">
                <th className="text-left py-1 font-medium">Workflow</th>
                <th className="text-left py-1 font-medium">Status</th>
                <th className="text-left py-1 font-medium hidden sm:table-cell">Duration</th>
                <th className="text-right py-1 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {timeline.slice(0, 15).map(e => (
                <tr key={e.id} className="border-b border-border/50">
                  <td className="py-1.5 truncate max-w-[150px] sm:max-w-[250px]">{e.workflowName}</td>
                  <td className="py-1.5">
                    <span className={`inline-flex items-center gap-1 ${
                      e.status === 'success' ? 'text-green-600 dark:text-green-400' :
                      e.status === 'error' ? 'text-red-600 dark:text-red-400' :
                      'text-muted-foreground'
                    }`}>
                      {e.status === 'success' ? <IconCheck className="h-3 w-3" /> : e.status === 'error' ? <IconX className="h-3 w-3" /> : null}
                      {e.status}
                    </span>
                  </td>
                  <td className="py-1.5 text-muted-foreground hidden sm:table-cell">
                    {e.durationSec !== null ? formatDuration(e.durationSec) : '—'}
                  </td>
                  <td className="py-1.5 text-right text-muted-foreground">{formatTimeAgo(e.startedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function N8NPage() {
  const [data, setData] = React.useState<N8NData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      const res = await fetch('/api/n8n/status');
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        setData(json);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <PageContainer pageTitle="N8N Workflows" pageDescription="Automation workflows, executions & health">
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div></div>
        <div className="flex items-center gap-2">
          {data && (
            <span className="text-muted-foreground text-xs">
              Last checked: {new Date(data.timestamp).toLocaleTimeString()}
            </span>
          )}
          <a
            href="https://n8n.optihost.pro"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Open N8N <IconExternalLink className="h-3 w-3" />
          </a>
          <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchData(); }}>
            <IconRefresh className="mr-1 h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-red-600 dark:text-red-400 text-sm">⚠️ {error}</p>
          </CardContent>
        </Card>
      )}

      {loading && !data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}><CardContent className="pt-4 pb-3"><Skeleton className="h-12 w-full" /></CardContent></Card>
            ))}
          </div>
          <Skeleton className="h-48 w-full" />
        </div>
      ) : data ? (
        <>
          <SummaryCards summary={data.summary} />

          <div className="grid gap-4 lg:grid-cols-2">
            {data.workflows.map(wf => (
              <WorkflowCard key={wf.id} wf={wf} />
            ))}
          </div>

          <ExecutionTimeline timeline={data.timeline} />
        </>
      ) : null}
    </div>
    </PageContainer>
  );
}
