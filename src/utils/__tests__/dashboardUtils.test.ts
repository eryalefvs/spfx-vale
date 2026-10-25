// ============================================================================
// dashboardUtils.test.ts
// Testes unitários para funções puras de dashboardUtils.ts.
// Cobre cálculo de indicadores, classificação de estado, particionamento
// de equivalência, análise de valores-limite, filtros, tendências e evolução.
// ============================================================================

import {
  getHealthStatus,
  parseStatus,
  getStatusColor,
  getStatusLabel,
  getLastMeasurementMap,
  getBatteryLastReadings,
  calculateKPIs,
  getVoltageTrend,
  getResistanceTrend,
  getBankVoltageTrend,
  getBatteryTrend,
  getTotalVoltageTrend,
  getBatteryVoltages,
  getBatteryResistances,
  getUniqueBankNumbers,
  getBatteryVoltagesByBank,
  getBatteryResistancesByBank,
  getResistanceTrendByBank,
  getBatteryEvolution,
  getTopByResistance,
  getStatusDistribution,
  getBankComparisons,
  getLocationHealthSummaries,
  getActivitiesPerMonth,
  filterBatteries,
  filterMeasurements,
  filterActivities,
  formatDate,
  formatDateISO,
  formatDateShort,
  formatNumber,
  getUniqueSupervisoes,
  getUniqueSedes,
  getUniqueLocationTypes,
  getUniqueManufacturers,
  getUniqueModels,
  getDisabledBanks,
} from '../dashboardUtils';
import { Battery, Measurement, Location, Activity, DashboardFilters } from '../../models/DashboardModels';
import { STATUS_COLORS, STATUS_LABELS } from '../../constants/DashboardConstants';

describe('dashboardUtils - Funções de Classificação e Limiares', () => {
  describe('getHealthStatus - Particionamento de Equivalência e Análise de Valor-Limite', () => {
    // Limiares:
    // Tensão: alertMin = 12.8, excellentMin = 13.4, maxAcceptable = 14.5
    // Resistência: excellentMax = 3.7, alertMax = 4.0

    it('classifica como EXCELENTE nos limites e interior da faixa ideal', () => {
      // Limites exatos
      expect(getHealthStatus(13.4, 3.7)).toBe('EXCELENTE');
      expect(getHealthStatus(14.5, 3.7)).toBe('EXCELENTE');
      // Interior da faixa ideal
      expect(getHealthStatus(13.8, 2.5)).toBe('EXCELENTE');
      expect(getHealthStatus(13.5, 1.0)).toBe('EXCELENTE');
    });

    it('classifica como ALERTA nos valores-limite e classes de equivalência de alerta', () => {
      // Tensão em 12.8 (limite inferior de alerta) com resistência excelente
      expect(getHealthStatus(12.8, 3.5)).toBe('ALERTA');
      // Tensão logo abaixo de 13.4 (13.39 V) com resistência excelente
      expect(getHealthStatus(13.39, 3.5)).toBe('ALERTA');
      // Tensão excelente (13.8 V), mas resistência em alerta (3.71 Ω a 4.0 Ω)
      expect(getHealthStatus(13.8, 3.71)).toBe('ALERTA');
      expect(getHealthStatus(13.8, 4.0)).toBe('ALERTA');
      // Ambos em alerta (12.8 V e 4.0 Ω)
      expect(getHealthStatus(12.8, 4.0)).toBe('ALERTA');
    });

    it('classifica como CRITICO para subtensão, sobretensão ou alta resistência', () => {
      // Subtensão: logo abaixo do limite de alerta (12.79 V)
      expect(getHealthStatus(12.79, 2.5)).toBe('CRITICO');
      expect(getHealthStatus(11.5, 2.5)).toBe('CRITICO');

      // Sobretensão e alta resistência
      expect(getHealthStatus(14.51, 4.01)).toBe('CRITICO');

      // Alta resistência: logo acima de alertMax (4.01 Ω)
      expect(getHealthStatus(13.8, 4.01)).toBe('CRITICO');
      expect(getHealthStatus(12.8, 4.01)).toBe('CRITICO');
      expect(getHealthStatus(10.0, 5.0)).toBe('CRITICO');
    });
  });

  describe('parseStatus', () => {
    it('faz parse correto de strings válidas com maiúsculas, minúsculas e espaços', () => {
      expect(parseStatus('EXCELENTE')).toBe('EXCELENTE');
      expect(parseStatus('excelente')).toBe('EXCELENTE');
      expect(parseStatus('  EXCELENTE  ')).toBe('EXCELENTE');

      expect(parseStatus('ALERTA')).toBe('ALERTA');
      expect(parseStatus('alerta')).toBe('ALERTA');
      expect(parseStatus('ATENCAO')).toBe('ALERTA');
      expect(parseStatus('ATENÇÃO')).toBe('ALERTA');

      expect(parseStatus('CRITICO')).toBe('CRITICO');
      expect(parseStatus('CRÍTICO')).toBe('CRITICO');
      expect(parseStatus('RUIM')).toBe('CRITICO');
    });

    it('retorna fallback EXCELENTE para strings não mapeadas', () => {
      expect(parseStatus('DESCONHECIDO')).toBe('EXCELENTE');
      expect(parseStatus('')).toBe('EXCELENTE');
    });
  });

  describe('getStatusColor e getStatusLabel', () => {
    it('retorna as cores e rótulos constantes para cada status', () => {
      expect(getStatusColor('EXCELENTE')).toBe(STATUS_COLORS.EXCELENTE);
      expect(getStatusColor('ALERTA')).toBe(STATUS_COLORS.ALERTA);
      expect(getStatusColor('CRITICO')).toBe(STATUS_COLORS.CRITICO);

      expect(getStatusLabel('EXCELENTE')).toBe(STATUS_LABELS.EXCELENTE);
      expect(getStatusLabel('ALERTA')).toBe(STATUS_LABELS.ALERTA);
      expect(getStatusLabel('CRITICO')).toBe(STATUS_LABELS.CRITICO);
    });
  });
});

describe('dashboardUtils - Leitura de Medições e KPIs', () => {
  const mockBatteries: Battery[] = [
    {
      id: 1,
      serialNumber: 'BAT-001',
      sequenceNumber: 1,
      bankNumber: 1,
      model: 'M1',
      manufacturer: 'Moura',
      locationId: 10,
      locationTitle: 'TU-100',
      locationType: 'TU',
      km: 100,
      status: 'Ativa',
    },
    {
      id: 2,
      serialNumber: 'BAT-002',
      sequenceNumber: 2,
      bankNumber: 1,
      model: 'M1',
      manufacturer: 'Moura',
      locationId: 10,
      locationTitle: 'TU-100',
      locationType: 'TU',
      km: 100,
      status: 'Ativa',
    },
    {
      id: 3,
      serialNumber: 'BAT-003',
      sequenceNumber: 1,
      bankNumber: 2,
      model: 'M2',
      manufacturer: 'Hoppecke',
      locationId: 10,
      locationTitle: 'TU-100',
      locationType: 'TU',
      km: 100,
      status: 'Ativa',
    },
  ];

  const mockMeasurements: Measurement[] = [
    // Mais recente para BAT-001
    {
      id: 101,
      title: 'M101',
      batterySerialNumber: 'BAT-001',
      batteryId: 1,
      voltage: 13.8,
      resistance: 2.5,
      current: 1.0,
      overallStatus: 'EXCELENTE',
      voltageStatus: 'EXCELENTE',
      resistanceStatus: 'EXCELENTE',
      date: new Date('2026-03-01T10:00:00Z'),
      activityId: 1001,
    },
    // Antiga para BAT-001 (deve ser ignorada em getLastMeasurementMap)
    {
      id: 100,
      title: 'M100',
      batterySerialNumber: 'BAT-001',
      batteryId: 1,
      voltage: 12.0,
      resistance: 4.5,
      current: 1.0,
      overallStatus: 'CRITICO',
      voltageStatus: 'CRITICO',
      resistanceStatus: 'CRITICO',
      date: new Date('2026-01-01T10:00:00Z'),
      activityId: 1000,
    },
    // Mais recente para BAT-002
    {
      id: 102,
      title: 'M102',
      batterySerialNumber: 'BAT-002',
      batteryId: 2,
      voltage: 13.0,
      resistance: 3.8,
      current: 1.0,
      overallStatus: 'ALERTA',
      voltageStatus: 'ALERTA',
      resistanceStatus: 'ALERTA',
      date: new Date('2026-03-01T10:00:00Z'),
      activityId: 1001,
    },
  ];

  const mockLocations: Location[] = [
    {
      id: 10,
      title: 'TU-100',
      km: 100,
      sede: 'Sede A',
      supervisao: 'Supervisão Norte',
      locationType: 'TU',
      localKm: 'TU-100',
    },
    {
      id: 20,
      title: 'TU-200',
      km: 200,
      sede: 'Sede B',
      supervisao: 'Supervisão Sul',
      locationType: 'TU',
      localKm: 'TU-200',
    },
  ];

  const mockActivities: Activity[] = [
    {
      id: 1001,
      maintenanceOrder: 'OM-1234',
      activityDate: new Date('2026-03-01T10:00:00Z'),
      activityType: 'Preventiva',
      supervision: 'Supervisão Norte',
      sede: 'Sede A',
      locationType: 'TU',
      km: '100',
      responsibles: ['Tecnico 1'],
      totalVoltage: 125.5,
      generalObservations: '',
      integrityAnomalies: '',
      integritySolutions: '',
      justificationLackOfInfo: '',
      justificationNoContactMCM: '',
    },
  ];

  describe('getLastMeasurementMap', () => {
    it('retorna a primeira medição encontrada para cada número de série', () => {
      const map = getLastMeasurementMap(mockMeasurements);
      expect(map.size).toBe(2);
      expect(map.get('BAT-001')?.id).toBe(101);
      expect(map.get('BAT-002')?.id).toBe(102);
      expect(map.has('BAT-003')).toBe(false);
    });

    it('retorna mapa vazio para array vazio', () => {
      const map = getLastMeasurementMap([]);
      expect(map.size).toBe(0);
    });
  });

  describe('getBatteryLastReadings', () => {
    it('combina dados da bateria com a medição mais recente', () => {
      const readings = getBatteryLastReadings(mockBatteries, mockMeasurements);
      expect(readings.length).toBe(3);

      const r1 = readings.find((r) => r.battery.serialNumber === 'BAT-001');
      expect(r1?.measurement?.id).toBe(101);
      expect(r1?.voltage).toBe(13.8);
      expect(r1?.status).toBe('EXCELENTE');

      const r2 = readings.find((r) => r.battery.serialNumber === 'BAT-002');
      expect(r2?.measurement?.id).toBe(102);
      expect(r2?.voltage).toBe(13.0);
      expect(r2?.status).toBe('ALERTA');

      const r3 = readings.find((r) => r.battery.serialNumber === 'BAT-003');
      expect(r3?.measurement).toBeUndefined();
      expect(r3?.voltage).toBe(0);
      expect(r3?.status).toBe('EXCELENTE'); // Fallback padrão
    });
  });

  describe('calculateKPIs', () => {
    it('calcula indicadores totais, médias e porcentagem de saúde corretamente', () => {
      const kpis = calculateKPIs(mockLocations, mockBatteries, mockMeasurements, mockActivities);

      expect(kpis.totalLocations).toBe(2);
      expect(kpis.totalBatteries).toBe(3);
      expect(kpis.totalMeasurements).toBe(3);
      expect(kpis.totalActivities).toBe(1);

      expect(kpis.alertBatteries).toBe(1);
      expect(kpis.criticalBatteries).toBe(0);
      expect(kpis.healthPercentage).toBe(67);

      expect(kpis.avgVoltage).toBe(13.4);
      expect(kpis.avgResistance).toBe(3.15);
    });

    it('retorna 100% de saúde e médias 0 quando não há baterias ou medições', () => {
      const kpis = calculateKPIs([], [], [], []);
      expect(kpis.healthPercentage).toBe(100);
      expect(kpis.avgVoltage).toBe(0);
      expect(kpis.avgResistance).toBe(0);
    });
  });
});

describe('dashboardUtils - Tendências e Agregações', () => {
  const activities: Activity[] = [
    {
      id: 1,
      maintenanceOrder: 'OM1',
      activityDate: new Date('2026-01-10T10:00:00Z'),
      activityType: 'Prev',
      supervision: 'Sup',
      sede: 'Sede',
      locationType: 'TU',
      km: '10',
      responsibles: [],
      totalVoltage: 120.0,
      generalObservations: '',
      integrityAnomalies: '',
      integritySolutions: '',
      justificationLackOfInfo: '',
      justificationNoContactMCM: '',
    },
    {
      id: 2,
      maintenanceOrder: 'OM2',
      activityDate: new Date('2026-02-15T10:00:00Z'),
      activityType: 'Prev',
      supervision: 'Sup',
      sede: 'Sede',
      locationType: 'TU',
      km: '10',
      responsibles: [],
      totalVoltage: 125.0,
      generalObservations: '',
      integrityAnomalies: '',
      integritySolutions: '',
      justificationLackOfInfo: '',
      justificationNoContactMCM: '',
    },
  ];

  const measurements: Measurement[] = [
    {
      id: 1,
      title: 'M1',
      activityId: 1,
      batteryId: 10,
      batterySerialNumber: 'S1',
      voltage: 13.5,
      resistance: 2.0,
      current: 1.0,
      overallStatus: 'EXCELENTE',
      voltageStatus: 'EXCELENTE',
      resistanceStatus: 'EXCELENTE',
      date: new Date('2026-01-10T10:00:00Z'),
    },
    {
      id: 2,
      title: 'M2',
      activityId: 1,
      batteryId: 20,
      batterySerialNumber: 'S2',
      voltage: 13.7,
      resistance: 2.4,
      current: 1.0,
      overallStatus: 'EXCELENTE',
      voltageStatus: 'EXCELENTE',
      resistanceStatus: 'EXCELENTE',
      date: new Date('2026-01-10T10:00:00Z'),
    },
    {
      id: 3,
      title: 'M3',
      activityId: 2,
      batteryId: 10,
      batterySerialNumber: 'S1',
      voltage: 13.8,
      resistance: 2.2,
      current: 1.0,
      overallStatus: 'EXCELENTE',
      voltageStatus: 'EXCELENTE',
      resistanceStatus: 'EXCELENTE',
      date: new Date('2026-02-15T10:00:00Z'),
    },
  ];

  const batteries: Battery[] = [
    {
      id: 10,
      serialNumber: 'S1',
      sequenceNumber: 1,
      bankNumber: 1,
      model: 'M',
      manufacturer: 'F',
      locationId: 100,
      locationTitle: 'TU-1',
      locationType: 'TU',
      km: 10,
      status: 'Ativa',
    },
    {
      id: 20,
      serialNumber: 'S2',
      sequenceNumber: 2,
      bankNumber: 1,
      model: 'M',
      manufacturer: 'F',
      locationId: 100,
      locationTitle: 'TU-1',
      locationType: 'TU',
      km: 10,
      status: 'Ativa',
    },
  ];

  it('calcula getVoltageTrend e getResistanceTrend ordenados por data', () => {
    const vTrend = getVoltageTrend(measurements, activities);
    expect(vTrend.length).toBe(2);
    expect(vTrend[0].date).toBe('2026-01-10');
    expect(vTrend[0].value).toBe(13.6);
    expect(vTrend[1].date).toBe('2026-02-15');
    expect(vTrend[1].value).toBe(13.8);

    const rTrend = getResistanceTrend(measurements, activities);
    expect(rTrend.length).toBe(2);
    expect(rTrend[0].value).toBe(2.2);
    expect(rTrend[1].value).toBe(2.2);
  });

  it('calcula getBankVoltageTrend filtrando pelo número do banco', () => {
    const bankTrend = getBankVoltageTrend(measurements, batteries, activities, 1, 100);
    expect(bankTrend.length).toBe(2);
    expect(bankTrend[0].value).toBe(13.6);
  });

  it('calcula getBatteryTrend para uma bateria individual', () => {
    const bTrend = getBatteryTrend(measurements, 10, activities);
    expect(bTrend.length).toBe(2);
    expect(bTrend[0].value).toBe(13.5);
    expect(bTrend[1].value).toBe(13.8);
  });

  it('calcula getTotalVoltageTrend derivado das atividades', () => {
    const totalTrend = getTotalVoltageTrend(measurements, activities);
    expect(totalTrend.length).toBe(2);
    expect(totalTrend[0].value).toBe(120.0);
    expect(totalTrend[1].value).toBe(125.0);
  });

  it('calcula getResistanceTrendByBank em formato pivot multi-linha', () => {
    const trendByBank = getResistanceTrendByBank(batteries, measurements, activities);
    expect(trendByBank.length).toBe(2);
    expect(trendByBank[0].date).toBe('2026-01-10');
    expect(trendByBank[0].banco1).toBe(2.2);
  });
});

describe('dashboardUtils - Evolução de Baterias e Tabela Pivoteada', () => {
  const activities: Activity[] = [
    {
      id: 1,
      maintenanceOrder: 'OM1',
      activityDate: new Date('2026-01-10T10:00:00Z'),
      activityType: 'Prev',
      supervision: 'Sup',
      sede: 'Sede',
      locationType: 'TU',
      km: '10',
      responsibles: [],
      totalVoltage: 120,
      generalObservations: '',
      integrityAnomalies: '',
      integritySolutions: '',
      justificationLackOfInfo: '',
      justificationNoContactMCM: '',
    },
    {
      id: 2,
      maintenanceOrder: 'OM2',
      activityDate: new Date('2026-02-15T10:00:00Z'),
      activityType: 'Prev',
      supervision: 'Sup',
      sede: 'Sede',
      locationType: 'TU',
      km: '10',
      responsibles: [],
      totalVoltage: 120,
      generalObservations: '',
      integrityAnomalies: '',
      integritySolutions: '',
      justificationLackOfInfo: '',
      justificationNoContactMCM: '',
    },
  ];

  const batteries: Battery[] = [
    {
      id: 1,
      serialNumber: 'S-STABLE',
      sequenceNumber: 1,
      bankNumber: 1,
      model: 'M',
      manufacturer: 'F',
      locationId: 1,
      locationTitle: 'TU-1',
      locationType: 'TU',
      km: 10,
      status: 'Ativa',
    },
    {
      id: 2,
      serialNumber: 'S-RISING',
      sequenceNumber: 2,
      bankNumber: 1,
      model: 'M',
      manufacturer: 'F',
      locationId: 1,
      locationTitle: 'TU-1',
      locationType: 'TU',
      km: 10,
      status: 'Ativa',
    },
    {
      id: 3,
      serialNumber: 'S-CRITICAL',
      sequenceNumber: 3,
      bankNumber: 1,
      model: 'M',
      manufacturer: 'F',
      locationId: 1,
      locationTitle: 'TU-1',
      locationType: 'TU',
      km: 10,
      status: 'Ativa',
    },
  ];

  const measurements: Measurement[] = [
    // Bateria Estável (delta <= 0.5)
    { id: 1, title: 'M1', activityId: 1, batteryId: 1, batterySerialNumber: 'S-STABLE', voltage: 13.5, resistance: 2.0, current: 1, overallStatus: 'EXCELENTE', voltageStatus: 'EXCELENTE', resistanceStatus: 'EXCELENTE', date: new Date('2026-01-10T10:00:00Z') },
    { id: 2, title: 'M2', activityId: 2, batteryId: 1, batterySerialNumber: 'S-STABLE', voltage: 13.6, resistance: 2.2, current: 1, overallStatus: 'EXCELENTE', voltageStatus: 'EXCELENTE', resistanceStatus: 'EXCELENTE', date: new Date('2026-02-15T10:00:00Z') },

    // Bateria Rising (0.5 < delta <= 1.5)
    { id: 3, title: 'M3', activityId: 1, batteryId: 2, batterySerialNumber: 'S-RISING', voltage: 13.5, resistance: 2.0, current: 1, overallStatus: 'EXCELENTE', voltageStatus: 'EXCELENTE', resistanceStatus: 'EXCELENTE', date: new Date('2026-01-10T10:00:00Z') },
    { id: 4, title: 'M4', activityId: 2, batteryId: 2, batterySerialNumber: 'S-RISING', voltage: 13.2, resistance: 3.0, current: 1, overallStatus: 'ALERTA', voltageStatus: 'ALERTA', resistanceStatus: 'ALERTA', date: new Date('2026-02-15T10:00:00Z') },

    // Bateria Critical (delta > 1.5)
    { id: 5, title: 'M5', activityId: 1, batteryId: 3, batterySerialNumber: 'S-CRITICAL', voltage: 13.5, resistance: 2.0, current: 1, overallStatus: 'EXCELENTE', voltageStatus: 'EXCELENTE', resistanceStatus: 'EXCELENTE', date: new Date('2026-01-10T10:00:00Z') },
    { id: 6, title: 'M6', activityId: 2, batteryId: 3, batterySerialNumber: 'S-CRITICAL', voltage: 12.0, resistance: 4.5, current: 1, overallStatus: 'CRITICO', voltageStatus: 'CRITICO', resistanceStatus: 'CRITICO', date: new Date('2026-02-15T10:00:00Z') },
  ];

  it('determina corretamente deltas e tendências (stable, rising, critical)', () => {
    const evolution = getBatteryEvolution(batteries, measurements, activities);
    expect(evolution.dates).toEqual(['2026-01-10', '2026-02-15']);
    expect(evolution.rows.length).toBe(3);

    const stableRow = evolution.rows.find((r) => r.serialNumber === 'S-STABLE');
    expect(stableRow?.trend).toBe('stable');
    expect(stableRow?.resistanceDelta).toBe(0.2);

    const risingRow = evolution.rows.find((r) => r.serialNumber === 'S-RISING');
    expect(risingRow?.trend).toBe('rising');
    expect(risingRow?.resistanceDelta).toBe(1.0);

    const criticalRow = evolution.rows.find((r) => r.serialNumber === 'S-CRITICAL');
    expect(criticalRow?.trend).toBe('critical');
    expect(criticalRow?.resistanceDelta).toBe(2.5);
  });
});

describe('dashboardUtils - Filtros Globais', () => {
  const locations: Location[] = [
    { id: 1, title: 'TU-01', km: 10, sede: 'Sede Norte', supervisao: 'Sup 1', locationType: 'TU', localKm: 'TU-01' },
    { id: 2, title: 'CV-02', km: 20, sede: 'Sede Sul', supervisao: 'Sup 2', locationType: 'CV', localKm: 'CV-02' },
  ];

  const batteries: Battery[] = [
    { id: 1, serialNumber: 'B1', sequenceNumber: 1, bankNumber: 1, model: 'Moura 100', manufacturer: 'Moura', locationId: 1, locationTitle: 'TU-01', locationType: 'TU', km: 10, status: 'Ativa' },
    { id: 2, serialNumber: 'B2', sequenceNumber: 2, bankNumber: 2, model: 'Hoppecke 200', manufacturer: 'Hoppecke', locationId: 1, locationTitle: 'TU-01', locationType: 'TU', km: 10, status: 'Ativa' },
    { id: 3, serialNumber: 'B3', sequenceNumber: 1, bankNumber: 1, model: 'Tudor 300', manufacturer: 'Tudor', locationId: 2, locationTitle: 'CV-02', locationType: 'CV', km: 20, status: 'Ativa' },
  ];

  it('filtra baterias por locationId, locationType e bankNumber', () => {
    expect(filterBatteries(batteries, { searchText: '', locationId: 1 }, locations).length).toBe(2);
    expect(filterBatteries(batteries, { searchText: '', locationType: 'CV' }, locations).length).toBe(1);
    expect(filterBatteries(batteries, { searchText: '', bankNumber: 2 }, locations).length).toBe(1);
  });

  it('filtra baterias por supervisao e sede através dos locais', () => {
    expect(filterBatteries(batteries, { searchText: '', supervisao: 'Sup 1' }, locations).length).toBe(2);
    expect(filterBatteries(batteries, { searchText: '', sede: 'Sede Sul' }, locations).length).toBe(1);
  });

  it('filtra baterias por texto de busca (case insensitive)', () => {
    expect(filterBatteries(batteries, { searchText: 'moura' }, locations).length).toBe(1);
    expect(filterBatteries(batteries, { searchText: 'TU-01' }, locations).length).toBe(2);
    expect(filterBatteries(batteries, { searchText: 'inexistente' }, locations).length).toBe(0);
  });

  it('filtra medições por status e intervalo de datas', () => {
    const measurements: Measurement[] = [
      { id: 1, title: 'M1', batteryId: 1, batterySerialNumber: 'B1', voltage: 13.8, resistance: 2.0, current: 1, overallStatus: 'EXCELENTE', voltageStatus: 'EXCELENTE', resistanceStatus: 'EXCELENTE', date: new Date('2026-02-01') },
      { id: 2, title: 'M2', batteryId: 2, batterySerialNumber: 'B2', voltage: 12.0, resistance: 4.5, current: 1, overallStatus: 'CRITICO', voltageStatus: 'CRITICO', resistanceStatus: 'CRITICO', date: new Date('2026-03-01') },
    ];

    const batteryIds = new Set<number | undefined>([1, 2]);

    expect(filterMeasurements(measurements, { searchText: '', status: 'EXCELENTE' }, batteryIds).length).toBe(1);
    expect(filterMeasurements(measurements, { searchText: '', status: 'CRITICO' }, batteryIds).length).toBe(1);

    expect(filterMeasurements(measurements, { searchText: '', startDate: new Date('2026-02-15') }, batteryIds).length).toBe(1);
    expect(filterMeasurements(measurements, { searchText: '', endDate: new Date('2026-02-15') }, batteryIds).length).toBe(1);
  });

  it('filtra atividades por supervisao, sede, locationType e datas', () => {
    const activities: Activity[] = [
      { id: 1, maintenanceOrder: 'OM1', activityDate: new Date('2026-01-01'), activityType: 'P', supervision: 'S1', sede: 'Sed1', locationType: 'TU', km: '10', responsibles: [], generalObservations: '', integrityAnomalies: '', integritySolutions: '', justificationLackOfInfo: '', justificationNoContactMCM: '' },
      { id: 2, maintenanceOrder: 'OM2', activityDate: new Date('2026-03-01'), activityType: 'P', supervision: 'S2', sede: 'Sed2', locationType: 'CV', km: '20', responsibles: [], generalObservations: '', integrityAnomalies: '', integritySolutions: '', justificationLackOfInfo: '', justificationNoContactMCM: '' },
    ];

    expect(filterActivities(activities, { searchText: '', supervisao: 'S1' }).length).toBe(1);
    expect(filterActivities(activities, { searchText: '', sede: 'Sed2' }).length).toBe(1);
    expect(filterActivities(activities, { searchText: '', locationType: 'TU' }).length).toBe(1);
    expect(filterActivities(activities, { searchText: '', startDate: new Date('2026-02-01') }).length).toBe(1);
  });
});

describe('dashboardUtils - Formatação e Extração de Opções Únicas', () => {
  it('formatDate formata para dd/mm/yyyy', () => {
    const d = new Date(2026, 2, 5); // 05/03/2026
    expect(formatDate(d)).toBe('05/03/2026');
  });

  it('formatDateISO formata para yyyy-mm-dd', () => {
    const d = new Date(2026, 2, 5);
    expect(formatDateISO(d)).toBe('2026-03-05');
  });

  it('formatDateShort formata para dd/mm', () => {
    const d = new Date(2026, 2, 5);
    expect(formatDateShort(d)).toBe('05/03');
  });

  it('formatNumber formata com casas decimais especificadas', () => {
    expect(formatNumber(13.8456, 2)).toBe('13.85');
    expect(formatNumber(13.8, 1)).toBe('13.8');
  });

  it('extrai listas únicas ordenadas de metadados', () => {
    const locations: Location[] = [
      { id: 1, title: 'L1', km: 1, sede: 'B', supervisao: 'Y', locationType: 'TU', localKm: 'L1' },
      { id: 2, title: 'L2', km: 2, sede: 'A', supervisao: 'X', locationType: 'CV', localKm: 'L2' },
      { id: 3, title: 'L3', km: 3, sede: 'A', supervisao: 'Y', locationType: 'TU', localKm: 'L3' },
    ];

    expect(getUniqueSupervisoes(locations)).toEqual(['X', 'Y']);
    expect(getUniqueSedes(locations)).toEqual(['A', 'B']);
    expect(getUniqueLocationTypes(locations)).toEqual(['CV', 'TU']);

    const batteries: Battery[] = [
      { id: 1, serialNumber: 'B1', sequenceNumber: 1, bankNumber: 1, model: 'M2', manufacturer: 'F2', locationId: 1, locationTitle: 'L1', locationType: 'TU', km: 1, status: 'Ativa' },
      { id: 2, serialNumber: 'B2', sequenceNumber: 2, bankNumber: 1, model: 'M1', manufacturer: 'F1', locationId: 1, locationTitle: 'L1', locationType: 'TU', km: 1, status: 'Ativa' },
    ];

    expect(getUniqueManufacturers(batteries)).toEqual(['F1', 'F2']);
    expect(getUniqueModels(batteries)).toEqual(['M1', 'M2']);
  });
});

describe('dashboardUtils - Detecção de Bancos Desabilitados', () => {
  it('detecta quando um local com múltiplos bancos esperados não possui baterias ativas no segundo banco', () => {
    // LOCATION_RULES['TU'] espera 2 bancos (banks: 2)
    const locations: Location[] = [
      { id: 10, title: 'TU-100', km: 100, sede: 'Sede A', supervisao: 'Sup', locationType: 'TU', localKm: 'TU-100' },
    ];

    // Somente banco 1 tem baterias ativas
    const batteries: Battery[] = [
      { id: 1, serialNumber: 'B1', sequenceNumber: 1, bankNumber: 1, model: 'M', manufacturer: 'F', locationId: 10, locationTitle: 'TU-100', locationType: 'TU', km: 100, status: 'Ativa' },
    ];

    const disabled = getDisabledBanks(batteries, locations);
    expect(disabled.length).toBe(1);
    expect(disabled[0].location.title).toBe('TU-100');
    expect(disabled[0].expectedBanks).toBe(2);
    expect(disabled[0].activeBanks).toEqual([1]);
    expect(disabled[0].disabledBanks).toEqual([2]);
  });

  it('não retorna nada se todos os bancos esperados estiverem ativos', () => {
    const locations: Location[] = [
      { id: 10, title: 'TU-100', km: 100, sede: 'Sede A', supervisao: 'Sup', locationType: 'TU', localKm: 'TU-100' },
    ];

    const batteries: Battery[] = [
      { id: 1, serialNumber: 'B1', sequenceNumber: 1, bankNumber: 1, model: 'M', manufacturer: 'F', locationId: 10, locationTitle: 'TU-100', locationType: 'TU', km: 100, status: 'Ativa' },
      { id: 2, serialNumber: 'B2', sequenceNumber: 1, bankNumber: 2, model: 'M', manufacturer: 'F', locationId: 10, locationTitle: 'TU-100', locationType: 'TU', km: 100, status: 'Ativa' },
    ];

    const disabled = getDisabledBanks(batteries, locations);
    expect(disabled.length).toBe(0);
  });
});
