// ============================================================================
// useDashboardFilters.ts
// Hook que gerencia filtros globais e entrega dados filtrados via useMemo.
// Todos os gráficos e tabelas consomem os dados filtrados deste hook.
// ============================================================================

import { useState, useMemo, useCallback } from 'react';
import { DashboardFilters, Battery, Measurement, Activity, Location } from '../models/DashboardModels';
import { BatteryStatus, LocationType } from '../types/DashboardTypes';
import { filterBatteries, filterMeasurements, filterActivities } from '../utils/dashboardUtils';

export interface UseDashboardFiltersResult {
  filters: DashboardFilters;
  filteredBatteries: Battery[];
  filteredMeasurements: Measurement[];
  filteredActivities: Activity[];
  filteredLocations: Location[];
  setLocationId: (id: number | undefined) => void;
  setLocationType: (type: LocationType | undefined) => void;
  setSupervisao: (value: string | undefined) => void;
  setSede: (value: string | undefined) => void;
  setBankNumber: (value: number | undefined) => void;
  setStatus: (value: BatteryStatus | undefined) => void;
  setStartDate: (value: Date | undefined) => void;
  setEndDate: (value: Date | undefined) => void;
  setSearchText: (value: string) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

const defaultFilters: DashboardFilters = {
  searchText: '',
};

/**
 * Hook de filtros globais do Dashboard.
 * Recebe os dados brutos e retorna dados filtrados via useMemo.
 */
export function useDashboardFilters(
  locations: Location[],
  batteries: Battery[],
  measurements: Measurement[],
  activities: Activity[]
): UseDashboardFiltersResult {
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);

  // ── Handlers individuais com useCallback ──────────────────────────────

  const setLocationId = useCallback((id: number | undefined) => {
    setFilters((prev) => ({ ...prev, locationId: id }));
  }, []);

  const setLocationType = useCallback((type: LocationType | undefined) => {
    setFilters((prev) => ({ ...prev, locationType: type }));
  }, []);

  const setSupervisao = useCallback((value: string | undefined) => {
    setFilters((prev) => ({ ...prev, supervisao: value }));
  }, []);

  const setSede = useCallback((value: string | undefined) => {
    setFilters((prev) => ({ ...prev, sede: value }));
  }, []);

  const setBankNumber = useCallback((value: number | undefined) => {
    setFilters((prev) => ({ ...prev, bankNumber: value }));
  }, []);

  const setStatus = useCallback((value: BatteryStatus | undefined) => {
    setFilters((prev) => ({ ...prev, status: value }));
  }, []);

  const setStartDate = useCallback((value: Date | undefined) => {
    setFilters((prev) => ({ ...prev, startDate: value }));
  }, []);

  const setEndDate = useCallback((value: Date | undefined) => {
    setFilters((prev) => ({ ...prev, endDate: value }));
  }, []);

  const setSearchText = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, searchText: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  // ── Verificação de filtros ativos ─────────────────────────────────────

  const hasActiveFilters = useMemo(() => {
    return (
      filters.locationId !== undefined ||
      filters.locationType !== undefined ||
      filters.supervisao !== undefined ||
      filters.sede !== undefined ||
      filters.bankNumber !== undefined ||
      filters.status !== undefined ||
      filters.startDate !== undefined ||
      filters.endDate !== undefined ||
      filters.searchText.length > 0
    );
  }, [filters]);

  // ── Dados filtrados com useMemo ───────────────────────────────────────

  const filteredLocations = useMemo(() => {
    return locations.filter((l) => {
      if (filters.locationType && l.locationType !== filters.locationType) return false;
      if (filters.supervisao && l.supervisao !== filters.supervisao) return false;
      if (filters.sede && l.sede !== filters.sede) return false;
      if (filters.locationId !== undefined && l.id !== filters.locationId) return false;
      return true;
    });
  }, [locations, filters.locationType, filters.supervisao, filters.sede, filters.locationId]);

  const filteredBatteries = useMemo(() => {
    return filterBatteries(batteries, filters, locations);
  }, [batteries, filters, locations]);

  const filteredBatterySerials = useMemo(() => {
    return new Set(filteredBatteries.map((b) => b.serialNumber));
  }, [filteredBatteries]);

  const filteredMeasurements = useMemo(() => {
    return filterMeasurements(measurements, filters, filteredBatterySerials);
  }, [measurements, filters, filteredBatterySerials]);

  const filteredActivities = useMemo(() => {
    return filterActivities(activities, filters);
  }, [activities, filters]);

  return {
    filters,
    filteredBatteries,
    filteredMeasurements,
    filteredActivities,
    filteredLocations,
    setLocationId,
    setLocationType,
    setSupervisao,
    setSede,
    setBankNumber,
    setStatus,
    setStartDate,
    setEndDate,
    setSearchText,
    clearFilters,
    hasActiveFilters,
  };
}
