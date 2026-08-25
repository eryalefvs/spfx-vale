// ============================================================================
// InspectionMapper.ts
// Mapeia dados do wizard → formato SharePoint para salvamento.
// Usa SP_FIELDS para garantir que os nomes internos das colunas estão corretos.
// ============================================================================

import { IWizardFormData, IParsedBatteryData } from '../models/BatteryInspection';
import { SP_FIELDS } from '../constants/DashboardConstants';

export class InspectionMapper {

  /**
   * Converte dados do wizard → item da lista de Atividades (RG 1107 - info_atividades).
   * Campos lookup (Responsáveis, Sede, KM) usam o sufixo "Id".
   */
  public static activityToSharePoint(data: IWizardFormData): Record<string, unknown> {
    const f = SP_FIELDS.Activities;

    return {
      'Title': `INS-${data.maintenanceOrder}-${data.locationType}-KM${data.km}`,
      [f.OM]: data.maintenanceOrder,
      [f.Data_da_Atividade]: data.activityDate,
      [f.Tipo_de_Atividade]: data.activityType,
      [f.Supervisao]: data.supervision,
      [f.ResponsaveisId]: data.responsibleIds,
      [f.Tipo_de_Local]: data.locationType,
      [f.SedeId]: data.sedeId,
      [f.KMId]: data.kmId,
      [f.Temperatura_da_Sala]: data.ambientTemperature
        ? parseFloat(data.ambientTemperature)
        : null,
      [f.Tensao_Total]: data.totalFloatVoltage
        ? parseFloat(data.totalFloatVoltage)
        : null,
      [f.Observacoes_Gerais]: data.generalObservations || '',
      [f.Integridade_Anomalias]: data.hasAnomalies === 'sim'
        ? data.anomaliesDescription
        : 'Nenhuma anomalia encontrada',
      [f.Integridade_Solucoes]: data.hasAnomalies === 'sim'
        ? data.solutionsAdopted
        : '',
      [f.Justificativa_Falta_Info]: data.justificationLackOfInfo || '',
      [f.Justificativa_Sem_Contato]: data.contactMCM === 'não'
        ? data.contactJustification
        : '',
    };
  }

  /**
   * Converte dados de uma bateria → item da lista de Medições
   * (RG 1107 - info_medicoes_baterias).
   */
  public static measurementToSharePoint(
    activityId: number,
    battery: IParsedBatteryData,
    date: string
  ): Record<string, unknown> {
    const f = SP_FIELDS.Measurements;

    return {
      [f.Title]: `${battery.bankLabel}-Bat${String(battery.no).length === 1
        ? `0${String(battery.no)}`
        : String(battery.no)}`,
      [f.ID_AtividadeId]: activityId,
      [f.Tensao]: String(battery.voltage),
      [f.Resistencia]: String(battery.resistance),
      [f.Corrente]: '0',
      [f.Status_geral]: battery.overallStatus,
      [f.Status_tensao]: battery.voltageStatus,
      [f.Status_resistencia]: battery.resistanceStatus,
      [f.Data]: date,
    };
  }
}