'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis
} from 'recharts';
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
import type { ProviderStatus } from './api-data';

const chartConfig = {
  latency: {
    label: 'Latency (ms)',
    color: 'var(--primary)'
  }
} satisfies ChartConfig;

interface UsageBarChartProps {
  providers: ProviderStatus[];
  loading: boolean;
}

export function UsageBarChart({ providers, loading }: UsageBarChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Response Time by Provider</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className='h-[350px] w-full' />
        </CardContent>
      </Card>
    );
  }

  const chartData = providers
    .filter((p) => p.status !== 'offline')
    .map((p) => ({
      name: p.name.length > 16 ? p.name.slice(0, 14) + '...' : p.name,
      fullName: p.name,
      latency: p.latency
    }))
    .sort((a, b) => a.latency - b.latency);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Response Time by Provider</CardTitle>
        <CardDescription>
          Live latency in milliseconds
        </CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[350px] w-full'
        >
          <BarChart
            data={chartData}
            layout='vertical'
            margin={{ left: 0, right: 24, top: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id='fillLatency' x1='0' y1='0' x2='1' y2='0'>
                <stop
                  offset='0%'
                  stopColor='var(--primary)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='100%'
                  stopColor='var(--primary)'
                  stopOpacity={0.3}
                />
              </linearGradient>
            </defs>
            <CartesianGrid horizontal={false} />
            <XAxis
              type='number'
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}ms`}
            />
            <YAxis
              dataKey='name'
              type='category'
              tickLine={false}
              axisLine={false}
              width={120}
              tickMargin={8}
              className='text-xs'
            />
            <ChartTooltip
              cursor={{ fill: 'var(--primary)', opacity: 0.05 }}
              content={
                <ChartTooltipContent
                  className='w-[180px]'
                  labelFormatter={(_value, payload) => {
                    const item = payload?.[0]?.payload;
                    return item?.fullName ?? _value;
                  }}
                  formatter={(value) => [`${value}ms`, 'Latency']}
                />
              }
            />
            <Bar
              dataKey='latency'
              fill='url(#fillLatency)'
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
