// ============================================================================
// DashboardConstants.ts
// Constantes e configurações do Dashboard de Baterias.
// Thresholds de saúde, paleta de cores, regras de banco e cache.
// ============================================================================

import { BatteryStatus, LocationType } from '../types/DashboardTypes';

// ─── Thresholds de Saúde das Baterias ────────────────────────────────────────
// Valores provisórios — ajustar com dados reais quando disponíveis.

/** Limites de tensão individual (V) — Ideal: 13.8V */
export const VOLTAGE_THRESHOLDS = {
  ideal: 13.8,
  /** Acima deste valor = EXCELENTE */
  excellentMin: 13.4,
  /** Entre alertMin e excellentMin = ALERTA */
  alertMin: 12.8,
  /** Abaixo de alertMin = CRITICO */

  /** Limite máximo aceitável (sobretensão) */
  maxAcceptable: 14.5,
} as const;

/** Limites de resistência individual (Ω) — Ideal: 2.5Ω */
export const RESISTANCE_THRESHOLDS = {
  ideal: 2.5,
  /** Abaixo deste valor = EXCELENTE */
  excellentMax: 4.0,
  /** Entre excellentMax e alertMax = ALERTA */
  alertMax: 6.5,
  /** Acima de alertMax = CRITICO */
} as const;

/** Limites de corrente (A) — valores provisórios */
export const CURRENT_THRESHOLDS = {
  ideal: 1.5,
  minAcceptable: 0.5,
  maxAcceptable: 3.0,
} as const;

// ─── Regras de Banco por Tipo de Local ───────────────────────────────────────

export interface BankRule {
  totalBatteries: number;
  numberOfBanks: number;
  batteriesPerBank: number[];  // Array com quantidade por banco [banco1, banco2]
  description: string;
}

export type Locations = ['TU', 'CV', 'MO', 'CANCELA', 'TE', 'HBD', 'AMV']

export const BANK_RULES: Record<LocationType, BankRule> = {
  TU: {
    totalBatteries: 20,
    numberOfBanks: 2,
    batteriesPerBank: [10, 10],
    description: 'Túnel — 2 bancos de 10 baterias',
  },
  CV: {
    totalBatteries: 2,
    numberOfBanks: 1,
    batteriesPerBank: [2],
    description: 'Armário — 1 banco de 2 baterias',
  },
  MO: {
    totalBatteries: 48,
    numberOfBanks: 2,
    batteriesPerBank: [24, 24],
    description: 'Microondas — 2 bancos de 24 baterias',
  },
  CANCELA: {
    totalBatteries: 6,
    numberOfBanks: 1,
    batteriesPerBank: [6],
    description: '1 banco de 6 baterias',
  },
  TE: {
    totalBatteries: 2,
    numberOfBanks: 1,
    batteriesPerBank: [2],
    description: 'Travador Elétrico — 1 banco de 2 baterias',
  },
  HBD: {
    totalBatteries: 6,
    numberOfBanks: 1,
    batteriesPerBank: [6],
    description: 'HotBox — 1 banco de 6 baterias',
  },
  AMV: {
    totalBatteries: 2,
    numberOfBanks: 1,
    batteriesPerBank: [2],
    description: '1 banco de 2 baterias',
  },
};

// ─── Paleta de Cores por Status ──────────────────────────────────────────────

export const STATUS_COLORS: Record<BatteryStatus, string> = {
  EXCELENTE: '#22C55E',   // Verde
  ALERTA: '#F97316',      // Laranja
  CRITICO: '#DC2626',     // Vermelho
};

export const STATUS_BG_COLORS: Record<BatteryStatus, string> = {
  EXCELENTE: '#F0FDF4',
  ALERTA: '#FFF7ED',
  CRITICO: '#FEF2F2',
};

export const STATUS_LABELS: Record<BatteryStatus, string> = {
  EXCELENTE: 'Excelente',
  ALERTA: 'Alerta',
  CRITICO: 'Crítico',
};

// ─── Cores do Dashboard ──────────────────────────────────────────────────────

export const CHART_COLORS = {
  primary: '#2563EB',       // Azul — tensão, principal
  secondary: '#F97316',     // Laranja — resistência
  tertiary: '#8B5CF6',      // Roxo — corrente, inspeções
  success: '#22C55E',       // Verde — saúde, excelente
  warning: '#F97316',       // Laranja — alerta
  danger: '#DC2626',        // Vermelho — crítico
  muted: '#64748B',         // Cinza — texto secundário
  background: '#F8FAFC',    // Fundo principal
  card: '#FFFFFF',          // Fundo dos cards
  border: '#E2E8F0',        // Bordas
  text: '#0F172A',          // Texto principal
  textSecondary: '#64748B', // Texto secundário
  textMuted: '#94A3B8',     // Texto discreto
} as const;

// ─── Regras de Capacidade por Local ───────────────────────────────────────────

export interface LocationRule {
  banks: number;
  batteriesPerBank: number;
  total: number;
}

export const LOCATION_RULES: Record<string, LocationRule> = {
  TU: { banks: 2, batteriesPerBank: 10, total: 20 },
  HBD: { banks: 1, batteriesPerBank: 6, total: 6 },
  CANCELA: { banks: 1, batteriesPerBank: 6, total: 6 },
  CV: { banks: 1, batteriesPerBank: 2, total: 2 },
  TE: { banks: 1, batteriesPerBank: 2, total: 2 },
  MO: { banks: 2, batteriesPerBank: 24, total: 48 },
  AMV: { banks: 1, batteriesPerBank: 2, total: 2 },
} as const;

// ─── Cores da Vale ───────────────────────────────────────────────────────────

export const VALE_COLORS = {
  green: '#007E7A',
  greenLight: '#0ABB98',
  yellow: '#ECB11F',
  dark: '#1E293B',
} as const;

// ─── Configurações de Cache ──────────────────────────────────────────────────

export const CACHE_CONFIG = {
  /** Tempo de vida do cache em milissegundos (5 minutos) */
  ttlMs: 5 * 60 * 1000,
  /** Tamanho de página para busca de medições no SharePoint */
  measurementsPageSize: 5000,
} as const;

// ─── Configurações de Paginação da Tabela ────────────────────────────────────

export const TABLE_CONFIG = {
  defaultPageSize: 15,
  pageSizeOptions: [10, 15, 25, 50],
} as const;

// ─── Nomes internos das colunas SharePoint ───────────────────────────────────
// Centralizado para facilitar manutenção caso os nomes internos mudem.

export const SP_FIELDS = {
  Locations: {
    Title: 'Title',
    Local: 'field_1',
    KM: 'field_2',               // lowercase conforme debug
    Sede: 'field_3',
    Supervisao: 'field_4',
    localKm: 'local_x002d_km',       // "local-km" com hífen codificado
  },
  Batteries: {
    Title: 'Title',          // NumeroDeSerie é o Title da lista
    NO: 'field_0',           // Posição no banco (nome interno genérico)
    Banco: 'field_2',        // Número do banco (1 ou 2)
    Modelo: 'field_3',
    Fabricante: 'field_4',
    DataDeFabricacao: 'field_5',
    Local: 'field_6',        // Tipo de local (TU, ARM, etc.)
    KM: 'field_7',           // KM como texto
    IDLocal: 'IDLocal',      // Consulta (lookup para 'km das LI')
    IDLocalId: 'IDLocalId',  // ID do lookup
    Status: 'Status',        // Ativa / Inativa
  },
  Measurements: {
    Title: 'Title',
    Bateria: 'Bateria',                          // Consulta (lookup)
    BateriaId: 'BateriaId',                      // ID do lookup
    ID_Atividade: 'ID_Atividade',                // Consulta (lookup)
    ID_AtividadeId: 'ID_AtividadeId',
    Tensao: 'Tens_x00e3_o',                     // "Tensão" com ã codificado
    Resistencia: 'Resist_x00ea_ncia',            // "Resistência" com ê codificado
    Corrente: 'Corrente',
    Status_geral: 'Status_geral',
    Status_tensao: 'Status_tens_x00e3_o',        // "Status_tensão"
    Status_resistencia: 'Status_resist_x00ea_ncia', // "Status_resistência"
    Data: 'Data',
  },
  Activities: {
    OM: 'OM',
    Data_da_Atividade: 'Data_da_Atividade',
    Responsaveis: 'Respons_x00e1_veis',              // "Responsáveis" (á encoded) — lookup field
    ResponsaveisId: 'Respons_x00e1_veisId',           // ID do lookup
    Supervisao: 'Supervis_x00e3_o',                   // "Supervisão" (ã encoded)
    Sede: 'Sede',                                     // Consulta (lookup) — sem expand retorna SedeId
    SedeId: 'SedeId',
    Tipo_de_Atividade: 'Tipo_de_Atividade',           // Opção (Choice) — sem acento
    Tipo_de_Local: 'Tipo_de_Local',                   // Opção (Choice) — sem acento
    KM: 'KM',                                        // Consulta (lookup) — sem expand retorna KMId
    KMId: 'KMId',
    Temperatura_da_Sala: 'Temperatura_da_Sala',
    Tensao_Total: 'Tens_x00e3_o_Total',               // "Tensão_Total" (ã encoded)
    Observacoes_Gerais: 'Observa_x00e7__x00f5_esGerais', // "Observações_Gerais" (ç e õ encoded)
    Integridade_Anomalias: 'Integridade_x002d_Anomalias', // "Integridade-Anomalias" (- encoded)
    Integridade_Solucoes: 'Integridade_x002d_Solu_x00e7__x0', // "Integridade-Soluções" (- e ç encoded, truncado)
    Justificativa_Falta_Info: 'Justificativa_x002d_FaltadeInfor', // truncado pelo SP
    Justificativa_Sem_Contato: 'Justificativa_x002d_SemContatoMC', // truncado pelo SP
  },
  Responsibles: {
    Title: 'Title',  // Nome
    Supervisao: 'Supervis_x00e3_o',
    Ativo: 'Ativo',
    Matricula: 'Matr_x00ed_cula'
  },
  Sedes: {
    Title: 'Title',  // 'Sedes' é o Title
    Supervisao: 'Supervis_x00e3_o'
  }
} as const;
