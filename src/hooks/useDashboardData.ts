// ============================================================================
// useDashboardData.ts
// Hook que carrega todos os dados do Dashboard via DashboardService.
// Gerencia estados de loading, error e refresh.
// ============================================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { DashboardService } from '../services/DashboardService';
import { Location, Battery, Measurement, Activity } from '../models/DashboardModels';
import { LoadingState } from '../types/DashboardTypes';

export interface DashboardData {
  locations: Location[];
  batteries: Battery[];
  measurements: Measurement[];
  activities: Activity[];
}

export interface UseDashboardDataResult {
  data: DashboardData;
  loadingState: LoadingState;
  error: string | undefined;
  refresh: () => Promise<void>;
  lastLoadedAt: Date | undefined;
}

const emptyData: DashboardData = {
  locations: [],
  batteries: [],
  measurements: [],
  activities: [],
};

/**
 * Hook principal para carregamento dos dados do Dashboard.
 * Carrega as 4 listas em paralelo e mantém estado de loading/error.
 *
 * @param autoLoad - Se true, carrega automaticamente no mount (default: true)
 */
export function useDashboardData(autoLoad: boolean = true): UseDashboardDataResult {
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | undefined>(undefined);
  const [lastLoadedAt, setLastLoadedAt] = useState<Date | undefined>(undefined);
  const isMounted = useRef(true);

  const loadData = useCallback(async (forceRefresh: boolean = false) => {
    setLoadingState('loading');
    setError(undefined);

    try {
      const result = await DashboardService.loadAllData(forceRefresh);

      if (isMounted.current) {
        setData(result);
        setLoadingState('success');
        setLastLoadedAt(new Date());
      }
    } catch (err) {
      if (isMounted.current) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar dados do Dashboard';
        setError(message);
        setLoadingState('error');
        console.error('[useDashboardData] Error loading data:', err);
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    DashboardService.clearCache();
    await loadData(true);
  }, [loadData]);

  useEffect(() => {
    isMounted.current = true;
    if (autoLoad) {
      loadData().catch(console.error);
    }
    return () => {
      isMounted.current = false;
    };
  }, [autoLoad, loadData]);

  return { data, loadingState, error, refresh, lastLoadedAt };
}
