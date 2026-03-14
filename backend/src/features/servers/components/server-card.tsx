'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  IconServer,
  IconBrandDocker,
  IconActivity,
} from '@tabler/icons-react';
import { MetricGauge } from './metric-gauge';
import type { ServerInfo } from '../hooks/use-servers-status';

interface ServerCardProps {
  server: ServerInfo;
  loading?: boolean;
}

export function ServerCard({ server, loading }: ServerCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="ml-auto h-5 w-16" />
          </div>
          <Skeleton className="mt-1 h-3 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-around">
            <Skeleton className="h-[100px] w-[100px] rounded-full" />
            <Skeleton className="h-[100px] w-[100px] rounded-full" />
            <Skeleton className="h-[100px] w-[100px] rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  const { name, specs, metrics, services, status } = server;
  const isOnline = status === 'online';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <IconServer className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">{name}</CardTitle>
          <span
            className={`ml-auto inline-block h-2.5 w-2.5 rounded-full ${
              isOnline ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <Badge variant={isOnline ? 'default' : 'destructive'} className="text-xs">
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {specs.chip ? `${specs.chip} · ` : ''}
          {specs.cores} cores · {specs.ram} RAM · {specs.disk} disk · {specs.os}
        </p>
        {isOnline && (
          <p className="text-xs text-muted-foreground">
            Uptime: {metrics.uptime}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gauges */}
        <div className="flex items-center justify-around">
          <MetricGauge
            label="CPU"
            percent={metrics.cpuPercent}
            subtitle={`${specs.cores} cores`}
          />
          <MetricGauge
            label="RAM"
            percent={metrics.ramPercent}
            subtitle={`${metrics.ramUsed} / ${metrics.ramTotal}`}
          />
          <MetricGauge
            label="Disk"
            percent={metrics.diskPercent}
            subtitle={`${metrics.diskUsed} / ${metrics.diskTotal}`}
            thresholds={{ warn: 70, critical: 90 }}
          />
        </div>

        {/* Load Average */}
        <div className="flex items-center gap-2 rounded-md border px-3 py-2">
          <IconActivity className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Load avg:</span>
          <div className="flex gap-2">
            {['1m', '5m', '15m'].map((label, i) => (
              <span key={label} className="text-xs font-mono">
                {metrics.loadAvg[i].toFixed(2)}
                <span className="ml-0.5 text-muted-foreground/60">{label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Docker services (Hetzner only) */}
        {services && services.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <IconBrandDocker className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Docker ({metrics.dockerContainers} containers)
              </span>
            </div>
            <div className="space-y-1">
              {services.map((svc) => {
                const isUp =
                  svc.status.toLowerCase().includes('up') ||
                  svc.status.toLowerCase().includes('running');
                return (
                  <div
                    key={svc.name}
                    className="flex items-center justify-between rounded-md border px-3 py-1.5"
                  >
                    <span className="text-xs font-mono">{svc.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-block h-1.5 w-1.5 rounded-full ${
                          isUp ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {svc.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
