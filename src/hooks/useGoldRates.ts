import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiClient } from '../services/apiClient';
import { GoldApiResponse } from '../types/gold';

export function useGoldRates(selectedCity: string) {
  const [data, setData] = useState<GoldApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [lastCheckTime, setLastCheckTime] = useState<number>(0);
  const [priceChangeSignal, setPriceChangeSignal] = useState<number>(0);

  const prev24kRef = useRef<number | null>(null);
  const isFetchingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  const fetchRates = useCallback(
    async (isBackground = false) => {
      // Prevent overlapping requests
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      if (!isBackground) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const response = await ApiClient.getLatestRate(selectedCity);
        const current24k = response?.data?.rates?.['24K']?.pricePerGram;

        if (prev24kRef.current !== null && current24k && prev24kRef.current !== current24k) {
          // Genuine price transition detected!
          setPriceChangeSignal((prev) => prev + 1);
        }
        if (current24k) {
          prev24kRef.current = current24k;
        }

        setData(response);
        setError(null);
        setLastFetchTime(Date.now());
        setLastCheckTime(Date.now());
        retryCountRef.current = 0; // Reset retry count
      } catch (err: any) {
        setLastCheckTime(Date.now());
        setError(err?.message || 'Failed to refresh rates');
        // If we don't have data at all, keep error state. If we already have data, retain it and warn.
        retryCountRef.current += 1;
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        isFetchingRef.current = false;
      }
    },
    [selectedCity]
  );

  // Manual trigger
  const refreshNow = useCallback(() => {
    fetchRates(true);
  }, [fetchRates]);

  useEffect(() => {
    // Immediate initial fetch when city changes
    fetchRates(false);

    // Schedule 10-second polling
    const scheduleNextPoll = () => {
      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        // Only poll if window/tab is visible
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          fetchRates(true);
        }
      }, 10000); // 10-second interval
    };

    scheduleNextPoll();

    // Pause when tab is hidden, resume when visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Tab just became active: check if stale (>10s since last fetch)
        if (Date.now() - lastFetchTime > 10000) {
          fetchRates(true);
        }
        scheduleNextPoll();
      } else {
        // Paused in background
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchRates, selectedCity]);

  // Is data considered stale? (>75s since last successful source update or consecutive errors)
  const isStale =
    Boolean(data?.marketMeta?.isStale) ||
    (lastFetchTime > 0 && Date.now() - lastFetchTime > 75000) ||
    retryCountRef.current >= 3;

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    isStale,
    refreshNow,
    lastCheckTime,
    lastFetchTime,
    priceChangeSignal,
  };
}
