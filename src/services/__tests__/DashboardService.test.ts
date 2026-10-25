// ============================================================================
// DashboardService.test.ts
// Testes unitários para cache em memória, carregamento paralelo e resolução
// de lookups de dados do DashboardService.
// ============================================================================

import { DashboardService } from '../DashboardService';
import { SharePointService } from '../SharePointService';
import { SP_FIELDS } from '../../constants/DashboardConstants';

describe('DashboardService - Cache em Memória e Resolução de Lookups', () => {
  let mockGetItems: jest.Mock;
  let mockListByTitle: jest.Mock;

  beforeEach(() => {
    DashboardService.clearCache();

    mockGetItems = jest.fn();
    mockListByTitle = jest.fn().mockReturnValue({
      items: {
        top: jest.fn().mockReturnValue(mockGetItems),
        orderBy: jest.fn().mockReturnValue({
          top: jest.fn().mockReturnValue(mockGetItems),
          filter: jest.fn().mockReturnValue({
            top: jest.fn().mockReturnValue(mockGetItems),
          }),
        }),
        select: jest.fn().mockReturnValue({
          top: jest.fn().mockReturnValue(mockGetItems),
        }),
      },
    });

    Object.defineProperty(SharePointService, 'sp', {
      get: () => ({ web: { lists: { getByTitle: mockListByTitle } } } as any),
      configurable: true,
    });
  });

  afterEach(() => {
    DashboardService.clearCache();
  });

  it('armazena dados em cache e não repete a chamada ao SharePoint sem forceRefresh', async () => {
    const rawLocations = [
      { Id: 1, [SP_FIELDS.Locations.Title]: 'TU-01', [SP_FIELDS.Locations.Local]: 'TU' },
    ];
    mockGetItems.mockResolvedValueOnce(rawLocations);

    // 1ª chamada: busca do SharePoint
    const locs1 = await DashboardService.loadLocations(false);
    expect(locs1.length).toBe(1);
    expect(locs1[0].title).toBe('TU-01');
    expect(mockListByTitle).toHaveBeenCalledTimes(1);

    // 2ª chamada: deve vir do cache (não chama SharePoint novamente)
    const locs2 = await DashboardService.loadLocations(false);
    expect(locs2.length).toBe(1);
    expect(mockListByTitle).toHaveBeenCalledTimes(1);

    // 3ª chamada com forceRefresh: deve buscar do SharePoint novamente
    mockGetItems.mockResolvedValueOnce(rawLocations);
    const locs3 = await DashboardService.loadLocations(true);
    expect(locs3.length).toBe(1);
    expect(mockListByTitle).toHaveBeenCalledTimes(2);
  });

  it('clearCache limpa os dados armazenados', async () => {
    const rawBatteries = [
      { Id: 10, Title: 'BAT-10', [SP_FIELDS.Batteries.NO]: 1 },
    ];
    mockGetItems.mockResolvedValue(rawBatteries);

    await DashboardService.loadBatteries();
    expect(mockListByTitle).toHaveBeenCalledTimes(1);

    DashboardService.clearCache();

    await DashboardService.loadBatteries();
    expect(mockListByTitle).toHaveBeenCalledTimes(2);
  });

  it('loadAllData resolve lookups em memória corretamente (Bateria -> Local, Medição -> Bateria, Atividade -> Responsáveis)', async () => {
    const rawLocations = [
      { Id: 100, [SP_FIELDS.Locations.Title]: 'TU-100', [SP_FIELDS.Locations.Local]: 'TU', [SP_FIELDS.Locations.KM]: '100' },
    ];

    const rawBatteries = [
      {
        Id: 200,
        [SP_FIELDS.Batteries.Title]: 'BAT-ABC-1',
        [SP_FIELDS.Batteries.NO]: 1,
        [SP_FIELDS.Batteries.Banco]: 1,
        [SP_FIELDS.Batteries.IDLocalId]: 100, // Aponta para Local 100
      },
    ];

    const rawMeasurements = [
      {
        Id: 300,
        [SP_FIELDS.Measurements.BateriaId]: 200, // Aponta para Bateria 200
        [SP_FIELDS.Measurements.Tensao]: '13.8',
        [SP_FIELDS.Measurements.Resistencia]: '2.5',
        [SP_FIELDS.Measurements.Status_geral]: 'EXCELENTE',
        [SP_FIELDS.Measurements.Data]: '2026-03-01T10:00:00Z',
      },
    ];

    const rawActivities = [
      {
        Id: 400,
        [SP_FIELDS.Activities.OM]: 'OM-001',
        [SP_FIELDS.Activities.Data_da_Atividade]: '2026-03-01T10:00:00Z',
        [SP_FIELDS.Activities.ResponsaveisId]: [1], // Aponta para Responsável 1
      },
    ];

    const rawResponsibles = [
      { Id: 1, Title: 'João Técnico' },
    ];

    const rawSedes = [
      { Id: 1, [SP_FIELDS.Sedes.Title]: 'Sede Central', [SP_FIELDS.Sedes.Supervisao]: 'Norte' },
    ];

    // Mockar retornos ordenados do Promise.all
    jest.spyOn(DashboardService, 'loadLocations').mockResolvedValueOnce([
      { id: 100, title: 'TU-100', km: 100, sede: 'Sede A', supervisao: 'Norte', locationType: 'TU', localKm: 'TU-100' },
    ]);
    jest.spyOn(DashboardService, 'loadBatteries').mockResolvedValueOnce([
      { id: 200, serialNumber: 'BAT-ABC-1', sequenceNumber: 1, bankNumber: 1, model: '', manufacturer: '', locationType: 'TU', km: 100, locationId: 100, locationTitle: '', status: 'Ativa' },
    ]);
    jest.spyOn(DashboardService, 'loadMeasurements').mockResolvedValueOnce([
      { id: 300, title: '', batteryId: 200, batterySerialNumber: '', voltage: 13.8, resistance: 2.5, current: 0, overallStatus: 'EXCELENTE', voltageStatus: 'EXCELENTE', resistanceStatus: 'EXCELENTE', date: new Date('2026-03-01') },
    ]);
    jest.spyOn(DashboardService, 'loadActivities').mockResolvedValueOnce([
      { id: 400, title: '', maintenanceOrder: 'OM-001', activityDate: new Date('2026-03-01'), activityType: '', supervision: '', sede: '', locationType: '', km: '', responsibles: [], _responsaveisId: [1] } as any,
    ]);
    jest.spyOn(DashboardService, 'loadResponsibles').mockResolvedValueOnce([
      { id: 1, title: 'João Técnico' },
    ]);
    jest.spyOn(DashboardService, 'loadSedes').mockResolvedValueOnce([
      { id: 1, title: 'Sede Central', supervisao: 'Norte' },
    ]);

    const result = await DashboardService.loadAllData(true);

    // Verifica resolução do locationTitle na Bateria
    expect(result.batteries[0].locationTitle).toBe('TU-100');

    // Verifica resolução do batterySerialNumber na Medição
    expect(result.measurements[0].batterySerialNumber).toBe('BAT-ABC-1');

    // Verifica resolução do nome do responsável na Atividade
    expect(result.activities[0].responsibles).toEqual(['João Técnico']);
  });
});
