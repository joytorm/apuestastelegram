'use client';

import { useCallback, useEffect, useState } from 'react';

interface UptimeCheck {
  status: string;
  latency_ms: number;
  checked_at: string;
}

interface ProviderHistory {
  checks: UptimeCheck[];
  uptimePercent: number;
}

export type UptimeHistoryMap = Record<string, ProviderHistory>;

interface UseUptimeHistoryReturn {
  history: UptimeHistoryMap;
  loading: boolean;
  refresh: () => void;
}

export function useUptimeHistory(period: '24h' | '7d' = '24h'): UseUptimeHistoryReturn {
  const [history, setHistory] = useState<UptimeHistoryMap>({});
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/providers/history?period=${period}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHistory(data.history ?? {});
    } catch {
      // Silently fail — sparklines just won't show
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, loading, refresh: fetchHistory };
}
