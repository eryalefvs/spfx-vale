// ============================================================================
// DashboardContext.tsx
// Context que combina dados + filtros + KPIs computados.
// Todos os componentes do Dashboard consomem dados a partir deste Context.
// ============================================================================

import * as React from 'react';
import { useDashboardData, DashboardData } from '../hooks/useDashboardData';
import { useDashboardFilters, UseDashboardFiltersResult } from '../hooks/useDashboardFilters';
import { DashboardSummary } from '../models/DashboardModels';
import { LoadingState } from '../types/DashboardTypes';
import { calculateKPIs } from '../utils/dashboardUtils';

// ─── Interface do Context ────────────────────────────────────────────────────

export interface IDashboardContext extends UseDashboardFiltersResult {
  // Dados brutos
  rawData: DashboardData;
  // Estado
  loadingState: LoadingState;
  error: string | undefined;
  lastLoadedAt: Date | undefined;
  // Actions
  refresh: () => Promise<void>;
  // Computados
  kpis: DashboardSummary;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const defaultKPIs: DashboardSummary = {
  totalLocations: 0,
  totalBatteries: 0,
  totalMeasurements: 0,
  totalActivities: 0,
  alertBatteries: 0,
  criticalBatteries: 0,
  healthPercentage: 100,
  avgVoltage: 0,
  avgResistance: 0,
};

// ─── Context ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DashboardContext = React.createContext<IDashboardContext>(undefined as any);

/** Hook para consumir o DashboardContext */
export function useDashboard(): IDashboardContext {
  const context = React.useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export interface DashboardProviderProps {
  children: React.ReactNode;
}

export function DashboardProvider(props: DashboardProviderProps): React.ReactElement {
  const { children } = props;

  // Hook de dados
  const { data, loadingState, error, refresh, lastLoadedAt } = useDashboardData();

  // Hook de filtros (recebe dados brutos, entrega filtrados)
  const filtersResult = useDashboardFilters(
    data.locations,
    data.batteries,
    data.measurements,
    data.activities
  );

  // KPIs computados sobre os dados FILTRADOS
  const kpis = React.useMemo<DashboardSummary>(() => {
    if (loadingState !== 'success') return defaultKPIs;
    return calculateKPIs(
      filtersResult.filteredLocations,
      filtersResult.filteredBatteries,
      filtersResult.filteredMeasurements,
      filtersResult.filteredActivities
    );
  }, [
    loadingState,
    filtersResult.filteredLocations,
    filtersResult.filteredBatteries,
    filtersResult.filteredMeasurements,
    filtersResult.filteredActivities,
  ]);

  // Valor do context memoizado
  const contextValue = React.useMemo<IDashboardContext>(() => ({
    rawData: data,
    loadingState,
    error,
    lastLoadedAt,
    refresh,
    kpis,
    ...filtersResult,
  }), [data, loadingState, error, lastLoadedAt, refresh, kpis, filtersResult]);

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
}
