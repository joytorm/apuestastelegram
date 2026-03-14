'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  IconServer,
  IconCircleCheck,
  IconGift,
  IconCurrencyDollar,
  IconBolt
} from '@tabler/icons-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProviderStatus } from './api-data';

interface SummaryCardsProps {
  providers: ProviderStatus[];
  loading: boolean;
}

export function SummaryCards({ providers, loading }: SummaryCardsProps) {
  const total = providers.length;
  const online = providers.filter((p) => p.status === 'online').length;
  const degraded = providers.filter((p) => p.status === 'degraded').length;
  const free = providers.filter((p) => p.tier === 'Free').length;
  const cost = providers.reduce((sum, p) => sum + p.monthlyCost, 0);

  const stats = [
    {
      title: 'Total Providers',
      value: String(total),
      icon: IconServer
    },
    {
      title: 'Online',
      value: `${online + degraded}/${total}`,
      icon: IconCircleCheck,
      dot: online + degraded === total ? 'bg-green-500 dark:bg-green-400 animate-status-pulse' : 'bg-yellow-500 dark:bg-yellow-400'
    },
    {
      title: 'Free Tier',
      value: String(free),
      icon: IconGift
    },
    {
      title: 'Est. Daily Tokens',
      value: '~5M+',
      description: 'Combined all providers',
      icon: IconBolt
    }
  ];

  if (loading) {
    return (
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-4' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-8 w-16' />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              {stat.title}
            </CardTitle>
            <stat.icon className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-2'>
              {stat.dot && (
                <span
                  className={`inline-block h-2 w-2 rounded-full ${stat.dot}`}
                />
              )}
              <div className='text-2xl font-bold'>{stat.value}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
