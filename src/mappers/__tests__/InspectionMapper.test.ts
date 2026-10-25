// ============================================================================
// InspectionMapper.test.ts
// Testes unitários para conversão de modelos de inspeção para SharePoint.
// ============================================================================

import { InspectionMapper } from '../InspectionMapper';
import { IWizardFormData, IQuickMeasurementData, IParsedBatteryData, DEFAULT_WIZARD_DATA } from '../../models/BatteryInspection';
import { SP_FIELDS } from '../../constants/DashboardConstants';

describe('InspectionMapper', () => {
  describe('activityToSharePoint', () => {
    it('mapeia corretamente os dados completos do formulário wizard para o SharePoint', () => {
      const formData: IWizardFormData = {
        ...DEFAULT_WIZARD_DATA,
        maintenanceOrder: '12345678',
        activityDate: '2026-03-10',
        activityType: 'Preventiva',
        supervision: 'Supervisão Norte',
        responsibleIds: [1, 2],
        sedeId: 10,
        kmId: 100,
        locationType: 'TU',
        km: '150',
        ambientTemperature: '25.5',
        totalFloatVoltage: '128.4',
        generalObservations: 'Tudo operacional',
        hasAnomalies: 'sim',
        anomaliesDescription: 'Oxidação leve no polo',
        solutionsAdopted: 'Limpeza e aplicação de vaselina',
        justificationLackOfInfo: 'Nenhuma',
        contactMCM: 'não',
        contactJustification: 'Sem sinal de celular',
      };

      const result = InspectionMapper.activityToSharePoint(formData);

      expect(result.Title).toBe('INS-12345678-TU-KM150');
      expect(result[SP_FIELDS.Activities.OM]).toBe('12345678');
      expect(result[SP_FIELDS.Activities.Data_da_Atividade]).toBe('2026-03-10');
      expect(result[SP_FIELDS.Activities.Tipo_de_Atividade]).toBe('Preventiva');
      expect(result[SP_FIELDS.Activities.Supervisao]).toBe('Supervisão Norte');
      expect(result[SP_FIELDS.Activities.ResponsaveisId]).toEqual([1, 2]);
      expect(result[SP_FIELDS.Activities.SedeId]).toBe(10);
      expect(result[SP_FIELDS.Activities.KMId]).toBe(100);
      expect(result[SP_FIELDS.Activities.Temperatura_da_Sala]).toBe(25.5);
      expect(result[SP_FIELDS.Activities.Tensao_Total]).toBe(128.4);
      expect(result[SP_FIELDS.Activities.Observacoes_Gerais]).toBe('Tudo operacional');
      expect(result[SP_FIELDS.Activities.Integridade_Anomalias]).toBe('Oxidação leve no polo');
      expect(result[SP_FIELDS.Activities.Integridade_Solucoes]).toBe('Limpeza e aplicação de vaselina');
      expect(result[SP_FIELDS.Activities.Justificativa_Sem_Contato]).toBe('Sem sinal de celular');
    });

    it('trata valores opcionais, ausência de anomalias e contato realizado', () => {
      const formData: IWizardFormData = {
        ...DEFAULT_WIZARD_DATA,
        maintenanceOrder: '87654321',
        activityDate: '2026-03-11',
        activityType: 'Corretiva',
        supervision: 'Supervisão Sul',
        responsibleIds: [3],
        sedeId: 20,
        kmId: 200,
        locationType: 'CV',
        km: '220',
        ambientTemperature: '',
        totalFloatVoltage: '',
        generalObservations: '',
        hasAnomalies: 'não',
        anomaliesDescription: '',
        solutionsAdopted: '',
        justificationLackOfInfo: '',
        contactMCM: 'sim',
        contactJustification: '',
      };

      const result = InspectionMapper.activityToSharePoint(formData);

      expect(result.Title).toBe('INS-87654321-CV-KM220');
      expect(result[SP_FIELDS.Activities.Temperatura_da_Sala]).toBeNull();
      expect(result[SP_FIELDS.Activities.Tensao_Total]).toBeNull();
      expect(result[SP_FIELDS.Activities.Integridade_Anomalias]).toBe('Nenhuma anomalia encontrada');
      expect(result[SP_FIELDS.Activities.Integridade_Solucoes]).toBe('');
      expect(result[SP_FIELDS.Activities.Justificativa_Sem_Contato]).toBe('');
    });
  });

  describe('measurementToSharePoint', () => {
    it('formata o item de medição com título padronizado de dois dígitos para NO', () => {
      const battery: IParsedBatteryData = {
        no: 3,
        resistance: 2.75,
        voltage: 13.8,
        bankNumber: 1,
        bankLabel: 'Banco 1',
        fileName: 'teste.xlsx',
        voltageStatus: 'EXCELENTE',
        resistanceStatus: 'EXCELENTE',
        overallStatus: 'EXCELENTE',
        matchedBatteryId: 99,
      };

      const item = InspectionMapper.measurementToSharePoint(500, battery, '2026-03-10');

      expect(item[SP_FIELDS.Measurements.Title]).toBe('Banco 1-Bat03');
      expect(item[SP_FIELDS.Measurements.ID_AtividadeId]).toBe(500);
      expect(item[SP_FIELDS.Measurements.Tensao]).toBe('13.8');
      expect(item[SP_FIELDS.Measurements.Resistencia]).toBe('2.75');
      expect(item[SP_FIELDS.Measurements.Corrente]).toBe('0');
      expect(item[SP_FIELDS.Measurements.Status_geral]).toBe('EXCELENTE');
      expect(item[SP_FIELDS.Measurements.Status_tensao]).toBe('EXCELENTE');
      expect(item[SP_FIELDS.Measurements.Status_resistencia]).toBe('EXCELENTE');
      expect(item[SP_FIELDS.Measurements.Data]).toBe('2026-03-10');
      expect(item[SP_FIELDS.Measurements.BateriaId]).toBe(99);
    });

    it('formata sem prefixo zero quando NO tem 2 ou mais dígitos e sem BateriaId quando não há match', () => {
      const battery: IParsedBatteryData = {
        no: 12,
        resistance: 3.9,
        voltage: 12.5,
        bankNumber: 2,
        bankLabel: 'Banco 2',
        fileName: 'teste.xlsx',
        voltageStatus: 'CRITICO',
        resistanceStatus: 'ALERTA',
        overallStatus: 'CRITICO',
      };

      const item = InspectionMapper.measurementToSharePoint(500, battery, '2026-03-10');

      expect(item[SP_FIELDS.Measurements.Title]).toBe('Banco 2-Bat12');
      expect(item[SP_FIELDS.Measurements.BateriaId]).toBeUndefined();
    });
  });

  describe('quickActivityToSharePoint', () => {
    it('mapeia corretamente uma medição avulsa definindo OM AVULSA e Tipo de Atividade Outros', () => {
      const quickData: IQuickMeasurementData = {
        supervision: 'Supervisão Norte',
        locationType: 'TU',
        sede: 'Sede A',
        sedeId: 5,
        km: '100',
        kmId: 100,
        locationId: 10,
        measurementDate: '2026-03-15',
        ambientTemperature: '26.0',
        totalFloatVoltage: '130.0',
        parsedBatteries: [],
        uploadedFileNames: [],
      };

      const result = InspectionMapper.quickActivityToSharePoint(quickData);

      expect(result.Title).toBe('AVULSA-TU-KM100-2026-03-15');
      expect(result[SP_FIELDS.Activities.OM]).toBe('AVULSA');
      expect(result[SP_FIELDS.Activities.Tipo_de_Atividade]).toBe('Outros');
      expect(result[SP_FIELDS.Activities.Temperatura_da_Sala]).toBe(26.0);
      expect(result[SP_FIELDS.Activities.Tensao_Total]).toBe(130.0);
      expect(result[SP_FIELDS.Activities.Observacoes_Gerais]).toBe('Medição avulsa');
    });
  });
});
