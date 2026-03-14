'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  IconArrowsSort,
  IconSortAscending,
  IconSortDescending
} from '@tabler/icons-react';
import { UptimeSparkline } from './uptime-sparkline';
import type { UptimeHistoryMap } from '../hooks/use-uptime-history';
import type { ProviderStatus } from './api-data';

type SortKey = 'name' | 'tier' | 'latency' | 'monthlyCost' | 'status' | 'dailyTokens';
type SortDir = 'asc' | 'desc';

function StatusDot({ status }: { status: ProviderStatus['status'] }) {
  const config = {
    online: 'bg-green-500 dark:bg-green-400 animate-status-pulse',
    degraded: 'bg-yellow-500 dark:bg-yellow-400',
    offline: 'bg-red-500 dark:bg-red-400'
  };
  return <span className={`inline-block h-2 w-2 rounded-full ${config[status]}`} />;
}

function LatencyBadge({ latency, status }: { latency: number; status: ProviderStatus['status'] }) {
  if (status === 'offline') {
    return <span className='text-muted-foreground text-xs'>--</span>;
  }
  const color =
    latency < 1000
      ? 'text-green-600 dark:text-green-400'
      : latency < 3000
        ? 'text-yellow-600 dark:text-yellow-400'
        : 'text-red-600 dark:text-red-400';
  return <span className={`text-xs font-mono ${color}`}>{latency}ms</span>;
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <IconArrowsSort className='h-3.5 w-3.5 opacity-50' />;
  return dir === 'asc' ? (
    <IconSortAscending className='h-3.5 w-3.5' />
  ) : (
    <IconSortDescending className='h-3.5 w-3.5' />
  );
}

interface ProvidersTableProps {
  providers: ProviderStatus[];
  loading: boolean;
  uptimeHistory?: UptimeHistoryMap;
}

export function ProvidersTable({ providers, loading, uptimeHistory }: ProvidersTableProps) {
  const [sortKey, setSortKey] = React.useState<SortKey>('name');
  const [sortDir, setSortDir] = React.useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = React.useMemo(() => {
    const items = [...providers];
    items.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'tier':
          cmp = a.tier.localeCompare(b.tier);
          break;
        case 'latency':
          cmp = a.latency - b.latency;
          break;
        case 'monthlyCost':
          cmp = a.monthlyCost - b.monthlyCost;
          break;
        case 'status': {
          const order = { online: 0, degraded: 1, offline: 2 };
          cmp = order[a.status] - order[b.status];
          break;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return items;
  }, [providers, sortKey, sortDir]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Providers</CardTitle>
          <CardDescription>Checking provider status...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className='h-10 w-full' />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Providers</CardTitle>
        <CardDescription>
          Live status of all API providers with response times
        </CardDescription>
      </CardHeader>
      <CardContent className='px-2 sm:px-6'>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    className='flex items-center gap-1'
                    onClick={() => handleSort('name')}
                  >
                    Provider
                    <SortIcon active={sortKey === 'name'} dir={sortDir} />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className='flex items-center gap-1'
                    onClick={() => handleSort('status')}
                  >
                    Status
                    <SortIcon active={sortKey === 'status'} dir={sortDir} />
                  </button>
                </TableHead>
                <TableHead>Uptime</TableHead>
                <TableHead>
                  <button
                    className='flex items-center gap-1'
                    onClick={() => handleSort('latency')}
                  >
                    Latency
                    <SortIcon active={sortKey === 'latency'} dir={sortDir} />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className='flex items-center gap-1'
                    onClick={() => handleSort('tier')}
                  >
                    Tier
                    <SortIcon active={sortKey === 'tier'} dir={sortDir} />
                  </button>
                </TableHead>
                <TableHead>Models</TableHead>
                <TableHead>Daily Limit</TableHead>
                <TableHead className='hidden md:table-cell'>Monthly Limit</TableHead>
                <TableHead className='hidden md:table-cell'>Rate Limit</TableHead>
                <TableHead className='hidden md:table-cell'>Top Models</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((provider) => (
                <TableRow key={provider.name}>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <StatusDot status={provider.status} />
                      <span className='font-medium'>{provider.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        provider.status === 'online'
                          ? 'secondary'
                          : provider.status === 'degraded'
                            ? 'outline'
                            : 'destructive'
                      }
                      className='text-xs'
                    >
                      {provider.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {uptimeHistory?.[provider.name] ? (
                      <UptimeSparkline
                        checks={uptimeHistory[provider.name].checks}
                        uptimePercent={uptimeHistory[provider.name].uptimePercent}
                      />
                    ) : (
                      <span className='text-muted-foreground text-xs'>--</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <LatencyBadge latency={provider.latency} status={provider.status} />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        provider.tier === 'Free' ? 'secondary' : 'outline'
                      }
                    >
                      {provider.tier}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className='text-muted-foreground text-sm'>
                      {provider.modelsCount ?? '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className='text-sm font-medium'>
                      {provider.dailyTokens ?? '-'}
                    </span>
                  </TableCell>
                  <TableCell className='hidden md:table-cell'>
                    <span className='text-sm'>
                      {provider.monthlyTokens ?? '-'}
                    </span>
                  </TableCell>
                  <TableCell className='hidden md:table-cell'>
                    <span className='text-muted-foreground text-xs'>
                      {provider.rateLimit ?? '-'}
                    </span>
                  </TableCell>
                  <TableCell className='hidden md:table-cell'>
                    <div className='flex flex-wrap gap-1'>
                      {(provider.topModels ?? []).slice(0, 3).map((m) => (
                        <Badge key={m} variant='outline' className='text-[10px] px-1.5 py-0'>
                          {m}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
