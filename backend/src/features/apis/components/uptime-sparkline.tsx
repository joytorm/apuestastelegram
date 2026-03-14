'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface UptimeCheck {
  status: string;
  latency_ms: number;
  checked_at: string;
}

interface UptimeSparklineProps {
  checks: UptimeCheck[];
  uptimePercent: number;
}

export function UptimeSparkline({ checks, uptimePercent }: UptimeSparklineProps) {
  if (checks.length === 0) {
    return <span className='text-muted-foreground text-xs'>No data</span>;
  }

  const statusColor: Record<string, string> = {
    online: 'bg-green-500 dark:bg-green-400',
    degraded: 'bg-yellow-500 dark:bg-yellow-400',
    offline: 'bg-red-500 dark:bg-red-400'
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className='flex items-center gap-px'>
            {checks.map((check, i) => (
              <div
                key={i}
                className={`h-4 w-[3px] rounded-sm ${statusColor[check.status] ?? 'bg-gray-400 dark:bg-gray-600'}`}
              />
            ))}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className='text-xs font-medium'>
            Uptime: {uptimePercent}% ({checks.length} checks)
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
