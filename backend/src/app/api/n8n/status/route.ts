import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const N8N_URL = 'https://n8n.optihost.pro';
const N8N_KEY = process.env.N8N_API_KEY || '';

const CACHE_TTL = 30_000;
let cache: { data: unknown; ts: number } | null = null;

interface N8NWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  nodes: { type: string; name: string }[];
  tags: { name: string }[];
}

interface N8NExecution {
  id: string;
  workflowId: string;
  status: string;
  startedAt: string;
  stoppedAt: string;
  workflowData?: { name: string };
}

async function fetchN8N(path: string) {
  const res = await fetch(`${N8N_URL}/api/v1${path}`, {
    headers: { 'X-N8N-API-KEY': N8N_KEY },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`N8N API ${res.status}`);
  return res.json();
}

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    const [workflowsRes, executionsRes, errorsRes] = await Promise.all([
      fetchN8N('/workflows'),
      fetchN8N('/executions?limit=30'),
      fetchN8N('/executions?limit=10&status=error'),
    ]);

    const workflows: N8NWorkflow[] = workflowsRes.data || [];
    const executions: N8NExecution[] = executionsRes.data || [];
    const errors: N8NExecution[] = errorsRes.data || [];

    // Compute stats per workflow
    const workflowStats = workflows.map(wf => {
      const wfExecs = executions.filter(e => e.workflowId === wf.id);
      const successful = wfExecs.filter(e => e.status === 'success');
      const failed = wfExecs.filter(e => e.status === 'error');
      
      // Average duration
      const durations = wfExecs
        .filter(e => e.startedAt && e.stoppedAt)
        .map(e => {
          const start = new Date(e.startedAt).getTime();
          const stop = new Date(e.stoppedAt).getTime();
          return (stop - start) / 1000;
        });
      const avgDuration = durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;

      // Success streak
      let streak = 0;
      for (const e of wfExecs) {
        if (e.status === 'success') streak++;
        else break;
      }

      // Last execution
      const lastExec = wfExecs[0] || null;

      return {
        id: wf.id,
        name: wf.name,
        active: wf.active,
        nodeCount: wf.nodes?.length || 0,
        nodes: (wf.nodes || []).map(n => ({ type: n.type, name: n.name })),
        tags: (wf.tags || []).map(t => t.name),
        createdAt: wf.createdAt,
        updatedAt: wf.updatedAt,
        stats: {
          totalExecutions: wfExecs.length,
          successful: successful.length,
          failed: failed.length,
          successRate: wfExecs.length > 0
            ? Math.round((successful.length / wfExecs.length) * 100)
            : 0,
          avgDurationSec: Math.round(avgDuration),
          currentStreak: streak,
          lastExecution: lastExec ? {
            id: lastExec.id,
            status: lastExec.status,
            startedAt: lastExec.startedAt,
            stoppedAt: lastExec.stoppedAt,
            durationSec: lastExec.startedAt && lastExec.stoppedAt
              ? Math.round((new Date(lastExec.stoppedAt).getTime() - new Date(lastExec.startedAt).getTime()) / 1000)
              : null,
          } : null,
        },
      };
    });

    // Recent executions timeline
    const timeline = executions.map(e => ({
      id: e.id,
      workflowId: e.workflowId,
      workflowName: e.workflowData?.name || workflows.find(w => w.id === e.workflowId)?.name || e.workflowId,
      status: e.status,
      startedAt: e.startedAt,
      stoppedAt: e.stoppedAt,
      durationSec: e.startedAt && e.stoppedAt
        ? Math.round((new Date(e.stoppedAt).getTime() - new Date(e.startedAt).getTime()) / 1000)
        : null,
    }));

    // Global stats
    const totalActive = workflows.filter(w => w.active).length;
    const totalInactive = workflows.filter(w => !w.active).length;
    const recentErrors = errors.length;
    const overallSuccessRate = executions.length > 0
      ? Math.round((executions.filter(e => e.status === 'success').length / executions.length) * 100)
      : 100;

    const data = {
      summary: {
        totalWorkflows: workflows.length,
        activeWorkflows: totalActive,
        inactiveWorkflows: totalInactive,
        recentErrors,
        overallSuccessRate,
        totalExecutions: executions.length,
      },
      workflows: workflowStats,
      timeline,
      timestamp: Date.now(),
    };

    cache = { data, ts: Date.now() };
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'N8N API error', timestamp: Date.now() },
      { status: 500 }
    );
  }
}
