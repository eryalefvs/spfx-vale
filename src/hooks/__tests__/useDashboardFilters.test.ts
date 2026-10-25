// ============================================================================
// useDashboardFilters.test.ts
// Testes unitários para o hook useDashboardFilters.
// ============================================================================

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { useDashboardFilters, UseDashboardFiltersResult } from '../useDashboardFilters';
import { Battery, Measurement, Location, Activity } from '../../models/DashboardModels';

describe('useDashboardFilters', () => {
  let container: HTMLDivElement;

  const mockLocations: Location[] = [
    { id: 1, title: 'TU-01', km: 10, sede: 'Sede Norte', supervisao: 'Supervisão A', locationType: 'TU', localKm: 'TU-10' },
    { id: 2, title: 'CV-02', km: 20, sede: 'Sede Sul', supervisao: 'Supervisão B', locationType: 'CV', localKm: 'CV-20' },
  ];

  const mockBatteries: Battery[] = [
    { id: 10, serialNumber: 'B1', sequenceNumber: 1, bankNumber: 1, model: 'Moura', manufacturer: 'Moura', locationId: 1, locationTitle: 'TU-01', locationType: 'TU', km: 10, status: 'Ativa' },
    { id: 20, serialNumber: 'B2', sequenceNumber: 2, bankNumber: 2, model: 'Tudor', manufacturer: 'Tudor', locationId: 2, locationTitle: 'CV-02', locationType: 'CV', km: 20, status: 'Ativa' },
  ];

  const mockMeasurements: Measurement[] = [
    { id: 100, title: 'M1', batteryId: 10, batterySerialNumber: 'B1', voltage: 13.8, resistance: 2.5, current: 0, overallStatus: 'EXCELENTE', voltageStatus: 'EXCELENTE', resistanceStatus: 'EXCELENTE', date: new Date('2026-03-01') },
    { id: 200, title: 'M2', batteryId: 20, batterySerialNumber: 'B2', voltage: 12.0, resistance: 4.5, current: 0, overallStatus: 'CRITICO', voltageStatus: 'CRITICO', resistanceStatus: 'CRITICO', date: new Date('2026-03-02') },
  ];

  const mockActivities: Activity[] = [
    { id: 1000, maintenanceOrder: 'OM1', activityDate: new Date('2026-03-01'), activityType: 'Prev', supervision: 'Supervisão A', sede: 'Sede Norte', locationType: 'TU', km: '10', responsibles: [], generalObservations: '', integrityAnomalies: '', integritySolutions: '', justificationLackOfInfo: '', justificationNoContactMCM: '' },
    { id: 2000, maintenanceOrder: 'OM2', activityDate: new Date('2026-03-02'), activityType: 'Prev', supervision: 'Supervisão B', sede: 'Sede Sul', locationType: 'CV', km: '20', responsibles: [], generalObservations: '', integrityAnomalies: '', integritySolutions: '', justificationLackOfInfo: '', justificationNoContactMCM: '' },
  ];

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('gerencia estado de filtros, flags e limpeza', () => {
    let hookResult: UseDashboardFiltersResult | undefined;

    const TestComponent: React.FC = () => {
      hookResult = useDashboardFilters(
        mockLocations,
        mockBatteries,
        mockMeasurements,
        mockActivities
      );
      return null;
    };

    act(() => {
      ReactDOM.render(React.createElement(TestComponent), container);
    });

    expect(hookResult?.hasActiveFilters).toBe(false);
    expect(hookResult?.filteredBatteries.length).toBe(2);
    expect(hookResult?.filteredMeasurements.length).toBe(2);

    // 1. Aplicar filtro por locationId
    act(() => {
      hookResult?.setLocationId(1);
    });

    expect(hookResult?.hasActiveFilters).toBe(true);
    expect(hookResult?.filters.locationId).toBe(1);
    expect(hookResult?.filteredBatteries.length).toBe(1);
    expect(hookResult?.filteredBatteries[0].serialNumber).toBe('B1');
    expect(hookResult?.filteredMeasurements.length).toBe(1);
    expect(hookResult?.filteredMeasurements[0].batterySerialNumber).toBe('B1');

    // 2. Aplicar filtro por texto de busca
    act(() => {
      hookResult?.setSearchText('moura');
    });
    expect(hookResult?.filteredBatteries.length).toBe(1);

    act(() => {
      hookResult?.setSearchText('inexistente');
    });
    expect(hookResult?.filteredBatteries.length).toBe(0);

    // 3. Limpar filtros
    act(() => {
      hookResult?.clearFilters();
    });

    expect(hookResult?.hasActiveFilters).toBe(false);
    expect(hookResult?.filteredBatteries.length).toBe(2);
    expect(hookResult?.filters.locationId).toBeUndefined();
    expect(hookResult?.filters.searchText).toBe('');
  });
});
