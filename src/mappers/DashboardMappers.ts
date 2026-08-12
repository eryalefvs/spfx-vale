// ============================================================================
// DashboardMappers.ts
// Mappers que convertem dados raw do SharePoint → Modelos de domínio.
// Responsáveis por toda a "tradução" entre o formato SP e o formato da app.
// Todos recebem `any` pois os items vêm sem $select (sem tipo forte).
// ============================================================================

import { Location, Battery, Measurement, Activity } from '../models/DashboardModels';
import { SP_FIELDS } from '../constants/DashboardConstants';

/** Converte valor texto ou número para number, com fallback 0 */
function toNumber(value: unknown): number {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(String(value).replace(',', '.'));
  return isNaN(parsed) ? 0 : parsed;
}

/** Extrai valor de um campo Lookup (pode ser objeto {Title} ou string) */
function lookupValue(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && (value as Record<string, unknown>).Title) {
    return String((value as Record<string, unknown>).Title);
  }
  return '';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Converte string ISO ou formato SP para Date, retornando undefined se inválido */
function parseDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

/** Converte string ISO para Date, retornando a data atual como fallback */
function parseDateRequired(value: string | undefined): Date {
  if (!value) return new Date();
  const d = new Date(value);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Extrai nomes dos responsáveis do campo do SharePoint.
 * Pode vir como string, array de strings, ou array de objetos Person.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseResponsibles(value: any): string[] {
  if (!value) return [];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) {
    return value.map((v) => {
      if (typeof v === 'string') return v;
      if (v && typeof v === 'object' && v.Title) return v.Title as string;
      if (v && typeof v === 'object' && v.EMail) return v.EMail as string;
      return String(v);
    });
  }
  return [];
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

/** Converte item raw da lista "km das LI" → Location */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _locationDebugLogged = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSPToLocation(item: any): Location {
  const f = SP_FIELDS.Locations;

  if (!_locationDebugLogged) {
    _locationDebugLogged = true;
    console.log('[DEBUG] Primeiro item raw de LOCAIS:', JSON.stringify(item, null, 2));
    console.log('[DEBUG] localKm raw:', item[f.localKm], '| local-km raw:', item['local-km'], '| local_x002d_km raw:', item['local_x002d_km']);
  }

  const locationType = item[f.Local];

  if (!locationType) {
    console.warn(
      '[Location] Local sem tipo:',
      item
    );
  }

  return {
    id: item.Id || item.ID || 0,
    title: item[f.Title] || '',
    locationType: item[f.Local] as Location['locationType'],
    km: item[f.KM] || 0,
    sede: item[f.Sede] || '',
    supervisao: item[f.Supervisao] || '',
    localKm: item[f.localKm] || ''
  };
}

let _batteryDebugLogged = false;
let _measurementDebugLogged = false;

/** Converte item raw da lista "Baterias_SAT2" → Battery */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSPToBattery(item: any): Battery {
  const f = SP_FIELDS.Batteries;

  // Debug: logar o primeiro item raw para verificar nomes dos campos
  if (!_batteryDebugLogged) {
    _batteryDebugLogged = true;
    console.log('[DEBUG] Primeiro item raw de BATERIAS:', JSON.stringify(item, null, 2));
    console.log('[DEBUG] NO raw:', item[f.NO], '| Banco raw:', item[f.Banco], '| IDLocalId raw:', item[f.IDLocalId]);
  }
  return {
    id: item.Id || item.ID || 0,
    serialNumber: item[f.Title] || item.Title || '',
    sequenceNumber: item[f.NO] || 0,
    bankNumber: item[f.Banco] || 1,
    model: item[f.Modelo] || '',
    manufacturer: item[f.Fabricante] || '',
    manufactureDate: parseDate(item[f.DataDeFabricacao]),
    locationType: item[f.Local] || '',
    km: item[f.KM] || 0,
    locationId: item[f.IDLocalId],
    locationTitle: '',  // Resolvido em memória no DashboardService.loadAllData()
    status: item[f.Status] || 'Ativa',  // Default 'Ativa' se campo não preenchido
  };
}

/** Converte item raw da lista "RG 1107 - info_medicoes_baterias" → Measurement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSPToMeasurement(item: any): Measurement {
  const f = SP_FIELDS.Measurements;

  // Debug: logar o primeiro item raw para verificar nomes dos campos
  if (!_measurementDebugLogged) {
    _measurementDebugLogged = true;
    console.log('[DEBUG] Primeiro item raw de MEDIÇÕES:', JSON.stringify(item, null, 2));
    console.log('[DEBUG] Campos SP_FIELDS.Measurements:', JSON.stringify(f));
    console.log('[DEBUG] Tensao raw:', item[f.Tensao], '| Resistencia raw:', item[f.Resistencia], '| ID_AtividadeId raw:', item[f.ID_AtividadeId]);
  }
  return {
    id: item.Id || item.ID || 0,
    title: item[f.Title] || item.Title || '',
    batteryId: item[f.BateriaId],
    batterySerialNumber: '',  // Resolvido em memória no DashboardService.loadAllData()
    activityId: item[f.ID_AtividadeId],
    // Tensão, Resistência e Corrente são campos TEXTO na lista — converter para número
    voltage: toNumber(item[f.Tensao]),
    resistance: toNumber(item[f.Resistencia]),
    current: toNumber(item[f.Corrente]),
    overallStatus: item[f.Status_geral] || '',
    voltageStatus: item[f.Status_tensao] || '',
    resistanceStatus: item[f.Status_resistencia] || '',
    date: parseDateRequired(item[f.Data]),
  };
}

/** Converte item raw da lista "RG 1107 - info_atividades" → Activity */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _activityDebugLogged = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSPToActivity(item: any): Activity {
  const f = SP_FIELDS.Activities;

  if (!_activityDebugLogged) {
    _activityDebugLogged = true;
    console.log('[DEBUG] Primeiro item raw de ATIVIDADES:', JSON.stringify(item, null, 2));
    console.log('[DEBUG] Tensao_Total raw:', item[f.Tensao_Total], '| Responsaveis raw:', item[f.Responsaveis], '| Data_da_Atividade raw:', item[f.Data_da_Atividade]);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activity: any = {
    id: item.Id || item.ID || 0,
    maintenanceOrder: item[f.OM] || '',
    activityDate: parseDateRequired(item[f.Data_da_Atividade]),
    // Responsaveis: tenta primeiro via campo expandido, senão vazio (será resolvido em memória)
    responsibles: parseResponsibles(item[f.Responsaveis]),
    supervision: item[f.Supervisao] || '',
    sede: lookupValue(item[f.Sede]),
    activityType: item[f.Tipo_de_Atividade] || '',
    locationType: item[f.Tipo_de_Local] || '',
    km: lookupValue(item[f.KM]),
    roomTemperature: toNumber(item[f.Temperatura_da_Sala]),
    totalVoltage: toNumber(item[f.Tensao_Total]),
    generalObservations: item[f.Observacoes_Gerais] || '',
    integrityAnomalies: item[f.Integridade_Anomalias] || '',
    integritySolutions: item[f.Integridade_Solucoes] || '',
    justificationLackOfInfo: item[f.Justificativa_Falta_Info] || '',
    justificationNoContactMCM: item[f.Justificativa_Sem_Contato] || '',
    // Campo auxiliar para resolução in-memory do lookup de responsáveis
    _responsaveisId: item[f.ResponsaveisId],
  };
  return activity as Activity;
}
