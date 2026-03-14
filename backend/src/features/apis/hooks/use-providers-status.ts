'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ProviderStatus, ProvidersResponse } from '../components/api-data';

interface UseProvidersStatusReturn {
  providers: ProviderStatus[];
  timestamp: number | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useProvidersStatus(): UseProvidersStatusReturn {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [timestamp, setTimestamp] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/providers/status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ProvidersResponse = await res.json();
      setProviders(data.providers);
      setTimestamp(data.timestamp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { providers, timestamp, loading, error, refresh: fetchStatus };
}
