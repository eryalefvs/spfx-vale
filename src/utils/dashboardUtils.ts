// ============================================================================
// dashboardUtils.ts
// Funções utilitárias para cálculos e agregações do Dashboard.
// Todas são funções puras — recebem dados e retornam resultados computados.
// Nenhuma acessa SharePoint ou tem side effects.
// ============================================================================

import { BatteryStatus } from '../types/DashboardTypes';
import {
  Battery, Measurement, Location, Activity,
  DashboardSummary, DashboardFilters, TrendPoint,
  StatusDistribution, BankComparison, BatteryLastReading,
  LocationHealthSummary, ActivitySummaryData, DisabledBankInfo,
} from '../models/DashboardModels';
import {
  VOLTAGE_THRESHOLDS, RESISTANCE_THRESHOLDS,
  STATUS_COLORS, STATUS_LABELS, LOCATION_RULES,
} from '../constants/DashboardConstants';

// ─── Status / Saúde ──────────────────────────────────────────────────────────

/** Determina o status de uma bateria com base em tensão e resistência */
export function getHealthStatus(voltage: number, resistance: number): BatteryStatus {
  if (
    voltage >= VOLTAGE_THRESHOLDS.excellentMin &&
    voltage <= VOLTAGE_THRESHOLDS.maxAcceptable &&
    resistance <= RESISTANCE_THRESHOLDS.excellentMax
  ) {
    return 'EXCELENTE';
  }
  if (
    voltage >= VOLTAGE_THRESHOLDS.alertMin &&
    resistance <= RESISTANCE_THRESHOLDS.alertMax
  ) {
    return 'ALERTA';
  }
  return 'CRITICO';
}

/** Converte status string vindo do SharePoint para BatteryStatus tipado */
export function parseStatus(statusStr: string): BatteryStatus {
  const normalized = statusStr.toUpperCase().trim();
  if (normalized === 'EXCELENTE') return 'EXCELENTE';
  if (normalized === 'ALERTA' || normalized === 'ATENCAO' || normalized === 'ATENÇÃO') return 'ALERTA';
  if (normalized === 'CRITICO' || normalized === 'CRÍTICO' || normalized === 'RUIM') return 'CRITICO';
  return 'EXCELENTE';  // fallback
}

/** Retorna cor associada ao status */
export function getStatusColor(status: BatteryStatus): string {
  return STATUS_COLORS[status];
}

/** Retorna label legível do status */
export function getStatusLabel(status: BatteryStatus): string {
  return STATUS_LABELS[status];
}

// ─── Última Medição por Bateria ──────────────────────────────────────────────

/** Monta um Map de NumeroDeSerie → última medição (mais recente por data) */
export function getLastMeasurementMap(measurements: Measurement[]): Map<string, Measurement> {
  const map = new Map<string, Measurement>();

  // Medições já vêm ordenadas por data desc do serviço
  for (const m of measurements) {
    if (m.batterySerialNumber && !map.has(m.batterySerialNumber)) {
      map.set(m.batterySerialNumber, m);
    }
  }
  return map;
}

/** Retorna a última medição de cada bateria com status calculado */
export function getBatteryLastReadings(
  batteries: Battery[],
  measurements: Measurement[]
): BatteryLastReading[] {
  const lastMap = getLastMeasurementMap(measurements);

  return batteries.map((battery) => {
    const m = lastMap.get(battery.serialNumber);
    const status: BatteryStatus = m
      ? parseStatus(m.overallStatus)
      : 'EXCELENTE';

    return {
      battery,
      measurement: m,
      status,
      voltage: m?.voltage ?? 0,
      resistance: m?.resistance ?? 0,
      current: m?.current ?? 0,
      date: m?.date,
    };
  });
}

// ─── KPIs ────────────────────────────────────────────────────────────────────

/** Calcula todos os KPIs do dashboard */
export function calculateKPIs(
  locations: Location[],
  batteries: Battery[],
  measurements: Measurement[],
  activities: Activity[]
): DashboardSummary {
  const lastReadings = getBatteryLastReadings(batteries, measurements);
  const withMeasurements = lastReadings.filter((r) => r.measurement !== undefined);

  const alertCount = lastReadings.filter((r) => r.status === 'ALERTA').length;
  const criticalCount = lastReadings.filter((r) => r.status === 'CRITICO').length;
  const excellentCount = lastReadings.filter((r) => r.status === 'EXCELENTE').length;

  const totalWithStatus = alertCount + criticalCount + excellentCount;
  const healthPct = totalWithStatus > 0
    ? Math.round((excellentCount / totalWithStatus) * 100)
    : 100;

  const avgVoltage = withMeasurements.length > 0
    ? withMeasurements.reduce((sum, r) => sum + r.voltage, 0) / withMeasurements.length
    : 0;

  const avgResistance = withMeasurements.length > 0
    ? withMeasurements.reduce((sum, r) => sum + r.resistance, 0) / withMeasurements.length
    : 0;

  return {
    totalLocations: locations.length,
    totalBatteries: batteries.length,
    totalMeasurements: measurements.length,
    totalActivities: activities.length,
    alertBatteries: alertCount,
    criticalBatteries: criticalCount,
    healthPercentage: healthPct,
    avgVoltage: +avgVoltage.toFixed(2),
    avgResistance: +avgResistance.toFixed(2),
  };
}

// ─── Tendências (Gráficos de Linha) ──────────────────────────────────────────

/** Agrupa medições por data e calcula média de um campo numérico */
function aggregateTrend(
  measurements: Measurement[],
  getValue: (m: Measurement) => number,
  activities: Activity[]
): TrendPoint[] {
  const activityMap: Record<number, Activity> = {};

  for (const activity of activities) {
    activityMap[activity.id] = activity;
  }

  // Agrupa as medições pela data da atividade
  const groups: Record<
    string,
    { sum: number; count: number }
  > = {};

  for (const measurement of measurements) {

    if (!measurement.activityId) {
      continue;
    }

    const activity = activityMap[measurement.activityId];

    if (!activity) {
      continue;
    }

    const activityDate = new Date(activity.activityDate);

    if (isNaN(activityDate.getTime())) {
      continue;
    }

    const dateKey = formatDateISO(activityDate);
    const value = getValue(measurement);

    if (!Number.isFinite(value)) {
      continue;
    }

    if (!groups[dateKey]) {
      groups[dateKey] = {
        sum: 0,
        count: 0
      };
    }

    groups[dateKey].sum += value;
    groups[dateKey].count += 1;
  }

  return Object.keys(groups)
    .map((date): TrendPoint => {

      const group = groups[date];

      return {
        date,
        value: +(group.sum / group.count).toFixed(2)
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  // const activityMap: Record<number, Activity> = {};
  // for (const activity of activities) {
  //   activityMap[activity.id] = activity;
  // }

  // const groups: Record<string, { sum: number; count: number }> = {};
  // const activityDateMap: Record<number, Date> = {};
  // for (const a of activities) {
  //   activityDateMap[a.id] = new Date(a.activityDate);
  // }

  // const dateSet = new Set<string>();
  // for (const m of measurements) {
  //   const dateKey = m.activityId ? activityDateMap[m.activityId] : undefined;
  //   if (dateKey) dateSet.add(formatDateISO(dateKey));
  // }

  // const dates = Array.from(dateSet).sort();


  // return Object.keys(groups)
  //   .map(function (date: string): TrendPoint {
  //     const g = groups[date];
  //     return { date: date, value: +(g.sum / g.count).toFixed(2) };
  //   })
  //   .sort(function (a: TrendPoint, b: TrendPoint): number { return a.date.localeCompare(b.date); });
}

/** Tendência da tensão média ao longo do tempo */
export function getVoltageTrend(measurements: Measurement[], activities: Activity[]): TrendPoint[] {
  return aggregateTrend(measurements, (m) => m.voltage, activities);
}

/** Tendência da resistência média ao longo do tempo */
export function getResistanceTrend(measurements: Measurement[], activities: Activity[]): TrendPoint[] {
  return aggregateTrend(measurements, (m) => m.resistance, activities);
}

/** Tendência de tensão de um banco específico de um local */
export function getBankVoltageTrend(
  measurements: Measurement[],
  batteries: Battery[],
  activities: Activity[],
  bankNumber: number,
  locationId?: number
): TrendPoint[] {
  const bankSerials = new Set(
    batteries
      .filter((b) =>
        b.bankNumber === bankNumber &&
        (locationId === undefined || b.locationId === locationId)
      )
      .map((b) => b.serialNumber)
  );

  const bankMeasurements = measurements.filter((m) =>
    bankSerials.has(m.batterySerialNumber)
  );

  return aggregateTrend(bankMeasurements, (m) => m.voltage, activities);
}

/** Tendência de uma bateria individual */
export function getBatteryTrend(
  measurements: Measurement[],
  id: number,
  activities: Activity[],
  getValue: (m: Measurement) => number = (m) => m.voltage
): TrendPoint[] {
  // Mapa: Activity.id -> Activity
  const activityMap: Record<number, Activity> = {};

  for (const activity of activities) {
    activityMap[activity.id] = activity;
  }

  const batteryMeasurements = measurements
    .filter((m) => m.batteryId === id)
    .map((m) => {
      // A medição aponta para a atividade através do ID_Atividade
      const activity = m.activityId
        ? activityMap[m.activityId]
        : undefined;

      if (!activity) {
        return undefined;
      }

      const activityDate = new Date(activity.activityDate);

      if (isNaN(activityDate.getTime())) {
        return undefined;
      }

      return {
        measurement: m,
        date: activityDate
      };
    })
    .filter(
      (
        item
      ): item is {
        measurement: Measurement;
        date: Date;
      } => item !== undefined
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return batteryMeasurements.map(({ measurement, date }) => ({
    date: formatDateISO(date),
    value: +getValue(measurement).toFixed(2),
  }));
}

// ─── Tensão Total (Atividades) ───────────────────────────────────────────────

/**
 * Tendência de Tensão Total ao longo do tempo.
 * Deriva a tensão total das atividades referenciadas pelas medições filtradas.
 * Fluxo: medições filtradas → activityId → atividade → totalVoltage
 */
export function getTotalVoltageTrend(
  filteredMeasurements: Measurement[],
  allActivities: Activity[]
): TrendPoint[] {
  // Mapa de atividades por ID para lookup rápido
  const activityMap: Record<number, Activity> = {};
  for (const a of allActivities) {
    activityMap[a.id] = a;
  }

  // Coletar IDs únicos de atividades das medições filtradas
  const activityIds = new Set<number>();
  for (const m of filteredMeasurements) {
    if (m.activityId) activityIds.add(m.activityId);
  }

  // Filtrar atividades que têm totalVoltage > 0
  const relevantActivities = Array.from(activityIds)
    .map((id) => activityMap[id])
    .filter((a) => a && (a.totalVoltage || 0) > 0);

  // Agrupar por data
  const groups: Record<string, { sum: number; count: number }> = {};
  for (const a of relevantActivities) {
    const dateKey = formatDateISO(a.activityDate);
    if (!groups[dateKey]) groups[dateKey] = { sum: 0, count: 0 };
    groups[dateKey].sum += (a.totalVoltage || 0);
    groups[dateKey].count += 1;
  }

  return Object.keys(groups)
    .map(function (date: string): TrendPoint {
      const g = groups[date];
      return { date: date, value: +(g.sum / g.count).toFixed(2) };
    })
    .sort(function (a: TrendPoint, b: TrendPoint): number { return a.date.localeCompare(b.date); });
}

// ─── Gráficos de Barras por Bateria ──────────────────────────────────────────

/** Dados de tensão (última leitura) por bateria para gráfico de barras */
export function getBatteryVoltages(
  batteries: Battery[],
  measurements: Measurement[]
): Array<{ label: number; voltage: number; fill: string }> {
  return getBatteryLastReadings(batteries, measurements)
    .filter((r) => r.measurement !== undefined)
    //.sort((a, b) => a.voltage - b.voltage)
    .map((r) => ({
      label: r.battery.sequenceNumber,
      voltage: r.voltage,
      fill: getStatusColor(r.status),
    }));
}

/** Dados de resistência (última leitura) por bateria para gráfico de barras */
export function getBatteryResistances(
  batteries: Battery[],
  measurements: Measurement[]
): Array<{ label: number; resistance: number; fill: string }> {
  return getBatteryLastReadings(batteries, measurements)
    .filter((r) => r.measurement !== undefined)
    //.sort((a, b) => b.resistance - a.resistance)
    .map((r) => ({
      label: r.battery.sequenceNumber,
      resistance: r.resistance,
      fill: getStatusColor(r.status),
    }));
}

// ─── Gráficos por Banco ──────────────────────────────────────────────────────

/** Retorna números de bancos únicos das baterias filtradas */
export function getUniqueBankNumbers(batteries: Battery[]): number[] {
  const banks = new Set<number>();
  for (const b of batteries) banks.add(b.bankNumber);
  return Array.from(banks).sort();
}

/** Tensão por bateria filtrada por banco */
export function getBatteryVoltagesByBank(
  batteries: Battery[],
  measurements: Measurement[],
  bankNumber: number
): Array<{ label: number; voltage: number; fill: string }> {
  const bankBatteries = batteries.filter((b) => b.bankNumber === bankNumber);
  return getBatteryVoltages(bankBatteries, measurements);
}

/** Resistência por bateria filtrada por banco */
export function getBatteryResistancesByBank(
  batteries: Battery[],
  measurements: Measurement[],
  bankNumber: number
): Array<{ label: number; resistance: number; fill: string }> {
  const bankBatteries = batteries.filter((b) => b.bankNumber === bankNumber);
  return getBatteryResistances(bankBatteries, measurements);
}

/** Tendência da resistência média por banco (retorna dados para gráfico multi-linha) */
export interface MultiTrendPoint {
  date: string;
  [key: string]: number | string; // banco1, banco2, etc.
}

export function getResistanceTrendByBank(
  batteries: Battery[],
  measurements: Measurement[],
  activities: Activity[]
): MultiTrendPoint[] {

  const activityMap: Record<number, Activity> = {};

  for (const activity of activities) {
    activityMap[activity.id] = activity;
  }

  const banks = getUniqueBankNumbers(batteries);

  // Mapa de serial → banco
  const serialToBank: Record<string, number> = {};
  for (const b of batteries) serialToBank[b.serialNumber] = b.bankNumber;

  // Agrupar por data e banco
  const groups: Record<string, Record<number, { sum: number; count: number }>> = {};
  for (const m of measurements) {
    const bank = serialToBank[m.batterySerialNumber];
    if (bank === undefined) continue;
    if (!m.activityId) continue;
    const activity = activityMap[m.activityId];
    if (!activity) continue;
    const dateKey = formatDateISO(activity.activityDate);
    if (!groups[dateKey]) groups[dateKey] = {};
    if (!groups[dateKey][bank]) groups[dateKey][bank] = { sum: 0, count: 0 };
    groups[dateKey][bank].sum += m.resistance;
    groups[dateKey][bank].count += 1;
  }

  return Object.keys(groups)
    .sort()
    .map((date) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const point: any = { date };
      for (const bank of banks) {
        const g = groups[date][bank];
        point['banco' + bank] = g ? +(g.sum / g.count).toFixed(2) : 0;
      }
      return point as MultiTrendPoint;
    });
}

// ─── Evolução de Baterias (Tabela Pivoteada) ─────────────────────────────────

export interface BatteryEvolutionRow {
  batteryId: number;
  serialNumber: string;
  bankNumber: number;
  sequenceNumber: number;
  values: Array<{ date: string; voltage: number; resistance: number }>;
  voltageDelta: number;     // diferença entre primeira e última leitura
  resistanceDelta: number;
  trend: 'stable' | 'rising' | 'critical'; // tendência da resistência
}

/** Gera dados de evolução para a tabela pivoteada */
export function getBatteryEvolution(
  batteries: Battery[],
  measurements: Measurement[],
  activities: Activity[]
): { dates: string[]; rows: BatteryEvolutionRow[] } {
  // Mapa activityId → activityDate para derivar datas das atividades
  const activityDateMap: Record<number, Date> = {};
  for (const a of activities) {
    activityDateMap[a.id] = a.activityDate;
  }

  // Todas as datas únicas ordenadas (derivadas das atividades)
  const dateSet = new Set<string>();
  for (const m of measurements) {
    const actDate = m.activityId ? activityDateMap[m.activityId] : undefined;
    if (actDate) dateSet.add(formatDateISO(actDate));
  }
  const dates = Array.from(dateSet).sort();

  // Agrupar medições por bateria e data (usando data da atividade)
  const measurementMap: Record<string, Record<string, { voltage: number; resistance: number; count: number }>> = {};
  for (const m of measurements) {
    const serial = m.batterySerialNumber;
    const actDate = m.activityId ? activityDateMap[m.activityId] : undefined;
    if (!actDate) continue; // Ignorar medições sem atividade válida
    if (!measurementMap[serial]) measurementMap[serial] = {};
    const dateKey = formatDateISO(actDate);
    if (!measurementMap[serial][dateKey]) {
      measurementMap[serial][dateKey] = { voltage: 0, resistance: 0, count: 0 };
    }
    const entry = measurementMap[serial][dateKey];
    entry.voltage += m.voltage;
    entry.resistance += m.resistance;
    entry.count += 1;
  }

  const rows: BatteryEvolutionRow[] = batteries
    .sort((a, b) => a.bankNumber - b.bankNumber || a.sequenceNumber - b.sequenceNumber)
    .map((bat) => {
      const batData = measurementMap[bat.serialNumber] || {};
      const values = dates
        .filter((d) => batData[d])
        .map((d) => {
          const entry = batData[d];
          return {
            date: d,
            voltage: +(entry.voltage / entry.count).toFixed(2),
            resistance: +(entry.resistance / entry.count).toFixed(2),
          };
        });

      // Calcular deltas
      let voltageDelta = 0;
      let resistanceDelta = 0;
      let trend: 'stable' | 'rising' | 'critical' = 'stable';

      if (values.length >= 2) {
        const first = values[0];
        const last = values[values.length - 1];
        voltageDelta = +(last.voltage - first.voltage).toFixed(2);
        resistanceDelta = +(last.resistance - first.resistance).toFixed(2);

        // Classificar tendência da resistência
        if (Math.abs(resistanceDelta) <= 0.5) {
          trend = 'stable';
        } else if (resistanceDelta > 0.5 && resistanceDelta <= 1.5) {
          trend = 'rising';
        } else if (resistanceDelta > 1.5) {
          trend = 'critical';
        }
      }

      return {
        batteryId: bat.id,
        serialNumber: bat.serialNumber,
        bankNumber: bat.bankNumber,
        sequenceNumber: bat.sequenceNumber,
        values,
        voltageDelta,
        resistanceDelta,
        trend,
      };
    });

  return { dates, rows };
}

// ─── Top 10 / Rankings ───────────────────────────────────────────────────────

/** Top N baterias com maior resistência (último registro) */
export function getTopByResistance(
  batteries: Battery[],
  measurements: Measurement[],
  top: number = 10
): BatteryLastReading[] {
  return getBatteryLastReadings(batteries, measurements)
    .filter((r) => r.measurement !== undefined)
    .sort((a, b) => b.resistance - a.resistance)
    .slice(0, top);
}

// ─── Distribuição por Status ─────────────────────────────────────────────────

/** Distribuição de baterias por status (para gráfico de pizza/donut) */
export function getStatusDistribution(
  batteries: Battery[],
  measurements: Measurement[]
): StatusDistribution[] {
  const lastReadings = getBatteryLastReadings(batteries, measurements);
  const total = lastReadings.length;

  const counts: Record<BatteryStatus, number> = {
    EXCELENTE: 0,
    ALERTA: 0,
    CRITICO: 0,
  };

  for (const r of lastReadings) {
    counts[r.status]++;
  }

  return (['EXCELENTE', 'ALERTA', 'CRITICO'] as BatteryStatus[]).map((status) => ({
    status,
    label: getStatusLabel(status),
    count: counts[status],
    percentage: total > 0 ? Math.round((counts[status] / total) * 100) : 0,
    color: getStatusColor(status),
  }));
}

// ─── Comparação de Bancos ────────────────────────────────────────────────────

/** Comparação entre bancos de um local */
export function getBankComparisons(
  batteries: Battery[],
  measurements: Measurement[],
  locationId?: number
): BankComparison[] {
  const locBatteries = locationId !== undefined
    ? batteries.filter((b) => b.locationId === locationId)
    : batteries;

  const bankNumbers = Array.from(new Set(locBatteries.map((b) => b.bankNumber))).sort();
  const lastReadings = getBatteryLastReadings(locBatteries, measurements);

  return bankNumbers.map((bankNum) => {
    const bankReadings = lastReadings.filter((r) => r.battery.bankNumber === bankNum);
    const withValues = bankReadings.filter((r) => r.measurement !== undefined);
    const excellentCount = bankReadings.filter((r) => r.status === 'EXCELENTE').length;

    return {
      bankNumber: bankNum,
      bankLabel: `Banco ${bankNum}`,
      avgVoltage: withValues.length > 0
        ? +(withValues.reduce((s, r) => s + r.voltage, 0) / withValues.length).toFixed(2)
        : 0,
      avgResistance: withValues.length > 0
        ? +(withValues.reduce((s, r) => s + r.resistance, 0) / withValues.length).toFixed(2)
        : 0,
      batteryCount: bankReadings.length,
      healthPercentage: bankReadings.length > 0
        ? Math.round((excellentCount / bankReadings.length) * 100)
        : 100,
    };
  });
}

// ─── Saúde por Local ─────────────────────────────────────────────────────────

/** Resumo de saúde de cada local */
export function getLocationHealthSummaries(
  locations: Location[],
  batteries: Battery[],
  measurements: Measurement[]
): LocationHealthSummary[] {
  return locations
    .map((location) => {
      const locBatteries = batteries.filter((b) => b.locationId === location.id);
      if (locBatteries.length === 0) return undefined;

      const lastReadings = getBatteryLastReadings(locBatteries, measurements);
      const withValues = lastReadings.filter((r) => r.measurement !== undefined);

      return {
        location,
        totalBatteries: locBatteries.length,
        excellentCount: lastReadings.filter((r) => r.status === 'EXCELENTE').length,
        alertCount: lastReadings.filter((r) => r.status === 'ALERTA').length,
        criticalCount: lastReadings.filter((r) => r.status === 'CRITICO').length,
        healthPercentage: lastReadings.length > 0
          ? Math.round(
            (lastReadings.filter((r) => r.status === 'EXCELENTE').length / lastReadings.length) * 100
          )
          : 100,
        avgVoltage: withValues.length > 0
          ? +(withValues.reduce((s, r) => s + r.voltage, 0) / withValues.length).toFixed(2)
          : 0,
        avgResistance: withValues.length > 0
          ? +(withValues.reduce((s, r) => s + r.resistance, 0) / withValues.length).toFixed(2)
          : 0,
        banks: getBankComparisons(locBatteries, measurements, location.id),
      };
    })
    .filter((summary): summary is LocationHealthSummary => summary !== undefined);
}

// ─── Atividades ──────────────────────────────────────────────────────────────

/** Atividades agrupadas por mês para gráfico de barras */
export function getActivitiesPerMonth(activities: Activity[]): ActivitySummaryData[] {
  const months: Record<string, number> = {};
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  for (const a of activities) {
    const d = a.activityDate;
    const key = `${monthNames[d.getMonth()]}/${d.getFullYear()}`;
    months[key] = (months[key] || 0) + 1;
  }

  return Object.keys(months)
    .map(function (month: string): ActivitySummaryData { return { month: month, count: months[month] }; })
    .sort(function (a: ActivitySummaryData, b: ActivitySummaryData): number {
      // Ordena cronologicamente
      const parseKey = (k: string): number => {
        const parts = k.split('/');
        return parseInt(parts[1], 10) * 12 + monthNames.indexOf(parts[0]);
      };
      return parseKey(a.month) - parseKey(b.month);
    });
}

// ─── Filtros ─────────────────────────────────────────────────────────────────

/** Aplica filtros globais sobre as baterias */
export function filterBatteries(
  batteries: Battery[],
  filters: DashboardFilters,
  locations: Location[]
): Battery[] {
  return batteries.filter((b) => {
    // Filtro por local
    if (filters.locationId !== undefined && b.locationId !== filters.locationId) return false;

    // Filtro por tipo de local
    if (filters.locationType && b.locationType !== filters.locationType) return false;

    // Filtro por banco
    if (filters.bankNumber !== undefined && b.bankNumber !== filters.bankNumber) return false;

    // Filtro por supervisão (precisa resolver via locations)
    if (filters.supervisao) {
      const loc = locations.find((l) => l.id === b.locationId);
      if (!loc || loc.supervisao !== filters.supervisao) return false;
    }

    // Filtro por sede
    if (filters.sede) {
      const loc = locations.find((l) => l.id === b.locationId);
      if (!loc || loc.sede !== filters.sede) return false;
    }

    // Busca textual
    if (filters.searchText) {
      const q = filters.searchText.toLowerCase();
      const match =
        b.serialNumber.toLowerCase().includes(q) ||
        b.model.toLowerCase().includes(q) ||
        b.manufacturer.toLowerCase().includes(q) ||
        b.locationTitle.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });
}

/** Aplica filtros globais sobre as medições */
export function filterMeasurements(
  measurements: Measurement[],
  filters: DashboardFilters,
  batteryIds: Set<number | undefined>
): Measurement[] {
  return measurements.filter((m) => {
    // Filtro por baterias já filtradas
    if (batteryIds.size > 0 && !batteryIds.has(m.batteryId)) {
      return false;
    }

    // Filtro por status
    if (filters.status && parseStatus(m.overallStatus) !== filters.status) return false;

    // Filtro por período
    if (filters.startDate && m.date < filters.startDate) return false;
    if (filters.endDate && m.date > filters.endDate) return false;

    return true;
  });
}

/** Aplica filtros sobre atividades */
export function filterActivities(
  activities: Activity[],
  filters: DashboardFilters
): Activity[] {
  return activities.filter((a) => {
    if (filters.locationType && a.locationType !== filters.locationType) return false;
    if (filters.supervisao && a.supervision !== filters.supervisao) return false;
    if (filters.sede && a.sede !== filters.sede) return false;
    if (filters.startDate && a.activityDate < filters.startDate) return false;
    if (filters.endDate && a.activityDate > filters.endDate) return false;
    return true;
  });
}

// ─── Formatação ──────────────────────────────────────────────────────────────

/** Pad number com zero à esquerda (compatível ES5, sem padStart) */
function pad2(n: number): string {
  return n < 10 ? '0' + n : String(n);
}

/** Formata Date para "dd/mm/yyyy" */
export function formatDate(d: Date): string {
  return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear();
}

/** Formata Date para "yyyy-mm-dd" (para ordenação/eixo X) */
export function formatDateISO(d: Date): string {
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

/** Formata Date para "dd/mm" (formato curto para gráficos) */
export function formatDateShort(d: Date): string {
  return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1);
}

/** Formata número com N casas decimais */
export function formatNumber(n: number, decimals: number = 2): string {
  return n.toFixed(decimals);
}

// ─── Extração de opções únicas para filtros ──────────────────────────────────

/** Extrai valores únicos de supervisão */
export function getUniqueSupervisoes(locations: Location[]): string[] {
  return Array.from(new Set(locations.map((l) => l.supervisao).filter(Boolean))).sort();
}

/** Extrai valores únicos de sede */
export function getUniqueSedes(locations: Location[]): string[] {
  return Array.from(new Set(locations.map((l) => l.sede).filter(Boolean))).sort();
}

/** Extrai tipos de local únicos */
export function getUniqueLocationTypes(locations: Location[]): string[] {
  return Array.from(new Set(locations.map((l) => l.locationType).filter(Boolean))).sort();
}

/** Extrai fabricantes únicos */
export function getUniqueManufacturers(batteries: Battery[]): string[] {
  return Array.from(new Set(batteries.map((b) => b.manufacturer).filter(Boolean))).sort();
}

/** Extrai modelos únicos */
export function getUniqueModels(batteries: Battery[]): string[] {
  return Array.from(new Set(batteries.map((b) => b.model).filter(Boolean))).sort();
}

// ─── Bancos Desabilitados ────────────────────────────────────────────────────

/**
 * Detecta locais com bancos desabilitados (sem baterias ativas).
 * Para locais com múltiplos bancos esperados (ex: TU = 2 bancos),
 * verifica quais bancos realmente possuem baterias ativas.
 * Bancos sem baterias ativas são considerados "desabilitados".
 */
export function getDisabledBanks(
  batteries: Battery[],
  locations: Location[]
): DisabledBankInfo[] {
  const result: DisabledBankInfo[] = [];

  // Agrupar baterias ativas por locationId
  const activeBatteriesByLocation: Record<number, Battery[]> = {};
  for (const bat of batteries) {
    if (bat.locationId && bat.status === 'Ativa') {
      if (!activeBatteriesByLocation[bat.locationId]) {
        activeBatteriesByLocation[bat.locationId] = [];
      }
      activeBatteriesByLocation[bat.locationId].push(bat);
    }
  }

  for (const location of locations) {
    const rule = LOCATION_RULES[location.locationType];
    if (!rule || rule.banks <= 1) continue; // Só interessa locais com múltiplos bancos

    const locationBatteries = activeBatteriesByLocation[location.id] || [];
    if (locationBatteries.length === 0) continue; // Local sem nenhuma bateria ativa — outra situação

    // Verificar quais bancos possuem baterias ativas
    const activeBanksSet = new Set<number>();
    for (const bat of locationBatteries) {
      activeBanksSet.add(bat.bankNumber);
    }
    const activeBanks = Array.from(activeBanksSet).sort();

    // Bancos esperados (1..N) que não possuem baterias ativas
    const disabledBanks: number[] = [];
    for (let bank = 1; bank <= rule.banks; bank++) {
      if (!activeBanksSet.has(bank)) {
        disabledBanks.push(bank);
      }
    }

    if (disabledBanks.length > 0) {
      result.push({
        location,
        expectedBanks: rule.banks,
        activeBanks,
        disabledBanks,
      });
    }
  }

  return result;
}
