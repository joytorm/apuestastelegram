'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface ServerMetrics {
  cpuPercent: number;
  ramPercent: number;
  ramUsed: string;
  ramTotal: string;
  diskPercent: number;
  diskUsed: string;
  diskTotal: string;
  uptime: string;
  loadAvg: [number, number, number];
  dockerContainers?: number;
}

interface Service {
  name: string;
  status: string;
}

export interface ServerInfo {
  name: string;
  host: string;
  specs: { cores: number; ram: string; disk: string; os: string; chip?: string };
  metrics: ServerMetrics;
  services?: Service[];
  status: 'online' | 'offline';
}

interface ServersResponse {
  servers: ServerInfo[];
  timestamp: number;
  cached: boolean;
}

interface UseServersStatusReturn {
  servers: ServerInfo[];
  timestamp: number | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const AUTO_REFRESH_MS = 60_000;

export function useServersStatus(): UseServersStatusReturn {
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [timestamp, setTimestamp] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/servers/status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ServersResponse = await res.json();
      setServers(data.servers);
      setTimestamp(data.timestamp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch server status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, AUTO_REFRESH_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchStatus]);

  return { servers, timestamp, loading, error, refresh: fetchStatus };
}
