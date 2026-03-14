'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProviderStatus } from './api-data';

interface ApiHealthCardProps {
  providers: ProviderStatus[];
  loading: boolean;
}

export function ApiHealthCard({ providers, loading }: ApiHealthCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>API Health</CardTitle>
          <CardDescription>Checking...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className='h-6 w-full' />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // OpenRouter credit info
  const openRouter = providers.find((p) => p.name === 'OpenRouter');

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Health</CardTitle>
        <CardDescription>Live status across all providers</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          <div className='grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2'>
            {providers.map((p) => (
              <div key={p.name} className='flex items-center gap-2 text-sm'>
                <span
                  className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                    p.status === 'online'
                      ? 'bg-green-500 dark:bg-green-400 animate-status-pulse'
                      : p.status === 'degraded'
                        ? 'bg-yellow-500 dark:bg-yellow-400'
                        : 'bg-red-500 dark:bg-red-400'
                  }`}
                />
                <span className='truncate'>{p.name}</span>
                {p.status !== 'offline' && (
                  <span className='text-muted-foreground ml-auto shrink-0 text-xs font-mono'>
                    {p.latency}ms
                  </span>
                )}
              </div>
            ))}
          </div>

          {openRouter && openRouter.creditLimit != null && (
            <div className='border-t pt-3'>
              <p className='text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wider'>
                OpenRouter Credits
              </p>
              <div className='grid grid-cols-3 gap-2 text-center sm:gap-3'>
                <div>
                  <div className='text-lg font-bold'>
                    ${(openRouter.creditUsage ?? 0).toFixed(4)}
                  </div>
                  <div className='text-muted-foreground text-xs'>Used</div>
                </div>
                <div>
                  <div className='text-lg font-bold'>
                    ${(openRouter.creditRemaining ?? 0).toFixed(4)}
                  </div>
                  <div className='text-muted-foreground text-xs'>Remaining</div>
                </div>
                <div>
                  <div className='text-lg font-bold'>
                    ${(openRouter.creditLimit ?? 0).toFixed(2)}
                  </div>
                  <div className='text-muted-foreground text-xs'>Limit</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
