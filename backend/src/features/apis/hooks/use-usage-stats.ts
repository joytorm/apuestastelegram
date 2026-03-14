'use client';

import { useCallback, useEffect, useState } from 'react';

interface DailyTotal {
  date: string;
  providers: Record<string, { tokens: number; requests: number }>;
}

interface UsageStatsData {
  dailyTotals: DailyTotal[];
  monthlyTotals: Record<string, { tokens: number; requests: number }>;
  totalTokensThisMonth: number;
  totalRequestsThisMonth: number;
}

interface UseUsageStatsReturn extends UsageStatsData {
  loading: boolean;
  refresh: () => void;
}

export function useUsageStats(): UseUsageStatsReturn {
  const [data, setData] = useState<UsageStatsData>({
    dailyTotals: [],
    monthlyTotals: {},
    totalTokensThisMonth: 0,
    totalRequestsThisMonth: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/usage/stats');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { ...data, loading, refresh: fetchStats };
}
