// ============================================================================
// BatteryInspection.ts
// Modelos do Formulário de Inspeção de Baterias (Wizard).
// IWizardFormData é o estado centralizado gerenciado pelo InspectionWizard.
// ============================================================================

import { BatteryStatus } from '../types/DashboardTypes';

// ─── Estado Central do Wizard ────────────────────────────────────────────────

/** Dados centrais de todas as páginas do wizard */
export interface IWizardFormData {
  // Page 1: Informações da Atividade
  maintenanceOrder: string;
  activityDate: string;
  activityType: string;
  supervision: string;
  responsibles: string[];
  responsibleIds: number[];
  locationType: string;
  sede: string;
  sedeId: number;
  km: string;
  kmId: number;
  generalObservations: string;

  // Page 2: Contato com MCM
  contactMCM: string;             // 'sim' | 'não' | ''
  contactJustification: string;

  // Page 3: Integridade do Local
  hasAnomalies: string;            // 'sim' | 'não' | ''
  anomaliesDescription: string;
  solutionsAdopted: string;

  // Page 5: Informações Operacionais
  parsedBatteries: IParsedBatteryData[];
  uploadedFileNames: string[];
  ambientTemperature: string;
  totalFloatVoltage: string;

  // Page 6: Verificação
  justificationLackOfInfo: string;

  // Page 7: Check de Saída / 5S
  exitObservations: string;
}

// ─── Dados Parseados do Excel ────────────────────────────────────────────────

/** Dados de uma bateria individual extraídos do arquivo Excel */
export interface IParsedBatteryData {
  no: number;                      // Número sequencial (1-10, 1-24, etc.)
  resistance: number;              // Resistência em mΩ
  voltage: number;                 // Tensão em VDC
  bankNumber: number;              // Banco (1 ou 2)
  bankLabel: string;               // "B1" ou "B2"
  fileName: string;                // Nome do arquivo de origem
  voltageStatus: BatteryStatus;
  resistanceStatus: BatteryStatus;
  overallStatus: BatteryStatus;
}

// ─── Wizard Steps ────────────────────────────────────────────────────────────

export interface IWizardStep {
  label: string;
  shortLabel: string;
}

export const WIZARD_STEPS: IWizardStep[] = [
  { label: 'Capa', shortLabel: 'Capa' },
  { label: 'Informações da Atividade', shortLabel: 'Atividade' },
  { label: 'Contato com MCM', shortLabel: 'Contato' },
  { label: 'Integridade do Local', shortLabel: 'Integridade' },
  { label: 'Parâmetros Operacionais', shortLabel: 'Parâmetros' },
  { label: 'Informações Operacionais', shortLabel: 'Operacional' },
  { label: 'Verificação dos Dados', shortLabel: 'Verificação' },
  { label: 'Check de Saída / 5S', shortLabel: '5S' },
  { label: 'Resumo e Salvamento', shortLabel: 'Salvar' },
];

// ─── Constantes do Formulário ────────────────────────────────────────────────

export const ACTIVITY_TYPES: string[] = [
  'Inspeção Detalhada',
  'Manutenção Preventiva',
  'Substituição',
];

export const LOCATION_TYPES: string[] = [
  'TU', 'CV', 'TE', 'CANCELA', 'MO', 'HBD',
];

export const SUPERVISIONS: string[] = [
  'CSATSI', 'CSATSL', 'CSATAC', 'CSATCJ',
];

// ─── Default ─────────────────────────────────────────────────────────────────

export const DEFAULT_WIZARD_DATA: IWizardFormData = {
  maintenanceOrder: '',
  activityDate: '',
  activityType: '',
  supervision: '',
  responsibles: [],
  responsibleIds: [],
  locationType: '',
  sede: '',
  sedeId: 0,
  km: '',
  kmId: 0,
  generalObservations: '',
  contactMCM: '',
  contactJustification: '',
  hasAnomalies: '',
  anomaliesDescription: '',
  solutionsAdopted: '',
  parsedBatteries: [],
  uploadedFileNames: [],
  ambientTemperature: '',
  totalFloatVoltage: '',
  justificationLackOfInfo: '',
  exitObservations: '',
};