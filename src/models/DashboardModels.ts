// ============================================================================
// DashboardModels.ts
// Modelos de domínio para o Dashboard de Baterias.
// Estes são os modelos "limpos", já mapeados a partir dos dados raw do SP.
// São usados por componentes, hooks e utils — nunca acessam o SharePoint.
// ============================================================================

import { BatteryStatus, LocationType } from '../types/DashboardTypes';

// ─── Modelos de Domínio Principais ───────────────────────────────────────────

/** Local de instalação (km das LI) */
export interface Location {
  id: number;
  title: string;            // Nome completo do local — ex: "EFCJ-LPR-085-SINAL_INT_ECJABRTUK085"
  locationType: LocationType; // Tipo — "TU", "ARM", "MO", "PN", "TE", "HBD"
  km: number;
  sede: string;             // "VTM" ou "SIS"
  supervisao: string;       // "CSATSI", etc.
  localKm: string
}

/** Bateria (Baterias_SAT2) */
export interface Battery {
  id: number;
  serialNumber: string;     // NumeroDeSerie (Title) — ex: "ESB-WI 20062"
  sequenceNumber: number;   // NO — posição no banco
  bankNumber: number;       // Banco — 1 ou 2
  model: string;            // Modelo — ex: "SBS-170F"
  manufacturer: string;     // Fabricante — ex: "EnerSys"
  manufactureDate?: Date;
  locationType: string;     // Tipo do local — "TU", "ARM", etc.
  km: number;
  locationId?: number;      // ID do local resolvido (via Lookup IDLocal)
  locationTitle: string;    // Title do local resolvido
  status: string;           // "Ativa" | "Inativa"
}

/** Medição individual de uma bateria (RG 1107 - info_medicoes_baterias) */
export interface Measurement {
  id: number;
  title: string;
  batteryId?: number;          // ID da bateria (via Lookup)
  batterySerialNumber: string; // Número de série resolvido
  activityId?: number;         // ID da atividade (via Lookup)
  voltage: number;             // Tensão (V)
  resistance: number;          // Resistência (Ω)
  current: number;             // Corrente (A)
  overallStatus: string;       // Status_geral — "EXCELENTE", etc.
  voltageStatus: string;       // Status_tensao
  resistanceStatus: string;    // Status_resistencia
  date: Date;                  // Data da medição
}

/** Atividade / Inspeção (RG 1107 - info_atividades) */
export interface Activity {
  id: number;
  maintenanceOrder: string;    // OM
  activityDate: Date;          // Data_da_Atividade
  responsibles: string[];      // Responsáveis (nomes)
  supervision: string;
  sede: string;
  activityType: string;        // Tipo_de_Atividade
  locationType: string;        // Tipo_de_Local
  km: string;
  roomTemperature?: number;
  totalVoltage?: number;       // Tensão_Total
  generalObservations: string;
  integrityAnomalies: string;
  integritySolutions: string;
  justificationLackOfInfo: string;
  justificationNoContactMCM: string;
}

export interface Sedes {
  id: number;
  title: string;
  supervisao: string;
}

export interface Responsibles {
  id: number;
  title: string;
  supervisao: string;
  ativo: string;
  matricula: string;
}

// ─── Modelos Derivados / Computados ──────────────────────────────────────────

/** Filtros globais do Dashboard */
export interface DashboardFilters {
  locationId?: number;           // Filtrar por local específico
  locationType?: LocationType;   // Filtrar por tipo de local
  supervisao?: string;
  sede?: string;
  bankNumber?: number;           // 1 ou 2
  status?: BatteryStatus;
  startDate?: Date;
  endDate?: Date;
  searchText: string;            // Busca livre
}

/** Resumo / KPIs do Dashboard */
export interface DashboardSummary {
  totalLocations: number;
  totalBatteries: number;
  totalMeasurements: number;
  totalActivities: number;
  alertBatteries: number;         // Baterias em ALERTA
  criticalBatteries: number;      // Baterias em CRITICO
  healthPercentage: number;       // % de baterias "EXCELENTE"
  avgVoltage: number;             // Tensão média da última medição
  avgResistance: number;          // Resistência média da última medição
}

/** Dados de um KPI individual para exibição em card */
export interface KPIData {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: string;                   // Nome do ícone Fluent UI
  color: string;                  // Cor do destaque
}

/** Ponto de tendência para gráficos de linha */
export interface TrendPoint {
  date: string;                   // Data formatada para eixo X
  value: number;                  // Valor (tensão, resistência, etc.)
  label?: string;                 // Label opcional
}

/** Distribuição de status para gráfico de pizza/donut */
export interface StatusDistribution {
  status: BatteryStatus;
  label: string;                  // "Excelente", "Alerta", "Crítico"
  count: number;
  percentage: number;
  color: string;
}

/** Comparação entre bancos de um local */
export interface BankComparison {
  bankNumber: number;
  bankLabel: string;              // "Banco 1", "Banco 2"
  avgVoltage: number;
  avgResistance: number;
  batteryCount: number;
  healthPercentage: number;
}

/** Histórico completo de uma bateria para o panel de detalhes */
export interface BatteryHistory {
  battery: Battery;
  location?: Location;
  measurements: Measurement[];
  activities: Activity[];
  voltageTrend: TrendPoint[];
  resistanceTrend: TrendPoint[];
  currentTrend: TrendPoint[];
  lastMeasurement?: Measurement;
  currentStatus: BatteryStatus;
}

/** Resumo de saúde de um local */
export interface LocationHealthSummary {
  location: Location;
  totalBatteries: number;
  excellentCount: number;
  alertCount: number;
  criticalCount: number;
  healthPercentage: number;
  avgVoltage: number;
  avgResistance: number;
  banks: BankComparison[];
}

/** Dados da última medição de cada bateria (para heatmap e comparativos) */
export interface BatteryLastReading {
  battery: Battery;
  measurement?: Measurement;
  status: BatteryStatus;
  voltage: number;
  resistance: number;
  current: number;
  date?: Date;
}

/** Resumo de atividades para gráficos */
export interface ActivitySummaryData {
  month: string;                  // "Jan/2026", etc.
  count: number;
}

/** Atividade com dados resolvidos para exibição */
export interface ActivityDetail {
  activity: Activity;
  location?: Location;
  measurements: Measurement[];
  batteriesInspected: number;
}
