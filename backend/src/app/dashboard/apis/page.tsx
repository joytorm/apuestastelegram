'use client';

import PageContainer from '@/components/layout/page-container';
import { SummaryCards } from '@/features/apis/components/summary-cards';
import { UsageBarChart } from '@/features/apis/components/usage-bar-chart';
import { TokenUsageChart } from '@/features/apis/components/token-usage-chart';
import { ProvidersTable } from '@/features/apis/components/providers-table';
import { ApiHealthCard } from '@/features/apis/components/api-health-card';
import { useProvidersStatus } from '@/features/apis/hooks/use-providers-status';
import { useUptimeHistory } from '@/features/apis/hooks/use-uptime-history';
import { useUsageStats } from '@/features/apis/hooks/use-usage-stats';
import { Button } from '@/components/ui/button';
import { IconRefresh } from '@tabler/icons-react';

export default function ApisPage() {
  const { providers, timestamp, loading, refresh } = useProvidersStatus();
  const { history: uptimeHistory } = useUptimeHistory('24h');
  const { dailyTotals, totalTokensThisMonth, loading: usageLoading } = useUsageStats();

  const lastChecked = timestamp
    ? new Date(timestamp).toLocaleTimeString()
    : null;

  return (
    <PageContainer
      pageTitle='API Monitoring'
      pageDescription='Monitor usage, limits, and status of all AI API providers.'
    >
      <div className='flex flex-col gap-6'>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <div className='text-muted-foreground text-sm'>
            {lastChecked && <>Last checked: {lastChecked}</>}
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={refresh}
            disabled={loading}
            className='w-fit'
          >
            <IconRefresh
              className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            {loading ? 'Checking...' : 'Refresh'}
          </Button>
        </div>

        <SummaryCards providers={providers} loading={loading} />

        <div className='grid gap-6 lg:grid-cols-2'>
          <UsageBarChart providers={providers} loading={loading} />
          <div className='flex flex-col gap-6'>
            <ApiHealthCard providers={providers} loading={loading} />
            <TokenUsageChart
              dailyTotals={dailyTotals}
              totalTokensThisMonth={totalTokensThisMonth}
              loading={usageLoading}
            />
          </div>
        </div>

        <ProvidersTable
          providers={providers}
          loading={loading}
          uptimeHistory={uptimeHistory}
        />
      </div>
    </PageContainer>
  );
}
