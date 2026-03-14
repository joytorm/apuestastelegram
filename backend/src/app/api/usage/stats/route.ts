import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createServiceRoleClient();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Fetch all token_usage records from the last 30 days
  const { data: records, error } = await supabase
    .from('token_usage')
    .select('provider, model, prompt_tokens, completion_tokens, total_tokens, recorded_at')
    .gte('recorded_at', thirtyDaysAgo)
    .order('recorded_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Daily totals per provider (last 30 days)
  const dailyMap = new Map<string, Map<string, { tokens: number; requests: number }>>();
  for (const r of records ?? []) {
    const day = r.recorded_at.slice(0, 10); // YYYY-MM-DD
    if (!dailyMap.has(day)) dailyMap.set(day, new Map());
    const dayData = dailyMap.get(day)!;
    if (!dayData.has(r.provider)) dayData.set(r.provider, { tokens: 0, requests: 0 });
    const entry = dayData.get(r.provider)!;
    entry.tokens += r.total_tokens ?? 0;
    entry.requests += 1;
  }

  // Convert to array sorted by date
  const dailyTotals = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, providerMap]) => ({
      date,
      providers: Object.fromEntries(providerMap)
    }));

  // Monthly totals per provider
  const monthlyTotals: Record<string, { tokens: number; requests: number }> = {};
  for (const r of records ?? []) {
    if (r.recorded_at >= monthStart) {
      if (!monthlyTotals[r.provider]) monthlyTotals[r.provider] = { tokens: 0, requests: 0 };
      monthlyTotals[r.provider].tokens += r.total_tokens ?? 0;
      monthlyTotals[r.provider].requests += 1;
    }
  }

  // Total tokens this month
  const totalTokensThisMonth = Object.values(monthlyTotals).reduce((s, v) => s + v.tokens, 0);
  const totalRequestsThisMonth = Object.values(monthlyTotals).reduce((s, v) => s + v.requests, 0);

  return NextResponse.json({
    dailyTotals,
    monthlyTotals,
    totalTokensThisMonth,
    totalRequestsThisMonth
  });
}
