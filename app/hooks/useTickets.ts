'use client';

import { useState, useEffect, useCallback } from 'react';
import { ticketsApi } from '@/app/lib/api-client';
import type { TicketsListDTO, TicketStatus } from '@/src/types';

interface UseTicketsOptions {
  status?: TicketStatus;
  assignedToMe?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  autoRefresh?: boolean; // Auto-refresh co X sekund
  refreshInterval?: number; // Domyślnie 30s
}

export function useTickets(options: UseTicketsOptions = {}) {
  const [data, setData] = useState<TicketsListDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await ticketsApi.getTickets(options);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tickets');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    options.status,
    options.assignedToMe,
    options.page,
    options.limit,
    options.sortBy,
    options.sortOrder,
  ]);

  // Initial fetch
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Auto-refresh
  useEffect(() => {
    if (!options.autoRefresh) return;

    const interval = setInterval(
      fetchTickets,
      options.refreshInterval || 30000 // 30s default
    );

    return () => clearInterval(interval);
  }, [options.autoRefresh, options.refreshInterval, fetchTickets]);

  return {
    tickets: data?.tickets || [],
    pagination: data?.pagination,
    isLoading,
    error,
    refetch: fetchTickets,
  };
}

