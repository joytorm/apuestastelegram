'use client';

import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';

interface DailyTotal {
  date: string;
  providers: Record<string, { tokens: number; requests: number }>;
}

interface TokenUsageChartProps {
  dailyTotals: DailyTotal[];
  totalTokensThisMonth: number;
  loading: boolean;
}

// Use CSS custom properties so colors adapt to light/dark mode
const COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)'
];

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function TokenUsageChart({ dailyTotals, totalTokensThisMonth, loading }: TokenUsageChartProps) {
  const { chartData, providerNames, chartConfig } = useMemo(() => {
    const allProviders = new Set<string>();
    for (const day of dailyTotals) {
      for (const p of Object.keys(day.providers)) {
        allProviders.add(p);
      }
    }
    const names = Array.from(allProviders);

    const data = dailyTotals.map((day) => {
      const entry: Record<string, string | number> = {
        date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
      for (const p of names) {
        entry[p] = day.providers[p]?.tokens ?? 0;
      }
      return entry;
    });

    const config: ChartConfig = {};
    names.forEach((name, i) => {
      config[name] = { label: name, color: COLORS[i % COLORS.length] };
    });

    return { chartData: data, providerNames: names, chartConfig: config };
  }, [dailyTotals]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Token Usage</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className='h-[250px] w-full' />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Token Usage</CardTitle>
          <CardDescription>Last 30 days across all providers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex h-[250px] items-center justify-center'>
            <p className='text-muted-foreground text-sm'>
              No usage data yet. Send requests through /api/ai/chat to start tracking.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Usage</CardTitle>
        <CardDescription>
          Last 30 days — {formatTokens(totalTokensThisMonth)} tokens this month
        </CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[250px] w-full'
        >
          <AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='date'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={formatTokens}
              width={50}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator='dot' />}
            />
            {providerNames.map((name, i) => (
              <Area
                key={name}
                dataKey={name}
                type='monotone'
                fill={COLORS[i % COLORS.length]}
                fillOpacity={0.1}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={1.5}
                stackId='tokens'
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
