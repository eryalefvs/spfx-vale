// ============================================================================
// DashboardMappers.test.ts
// Testes unitários para mapeamento de dados raw do SharePoint para Models.
// ============================================================================

import {
  mapSPToLocation,
  mapToSede,
  mapToResponsibles,
  mapSPToBattery,
  mapSPToMeasurement,
  mapSPToActivity,
} from '../DashboardMappers';
import { SP_FIELDS } from '../../constants/DashboardConstants';

describe('DashboardMappers', () => {
  describe('mapSPToLocation', () => {
    it('mapeia item raw de local com campos existentes', () => {
      const f = SP_FIELDS.Locations;
      const raw = {
        Id: 42,
        [f.Title]: 'TU-113',
        [f.Local]: 'TU',
        [f.KM]: '113',
        [f.Sede]: 'São Luís',
        [f.Supervisao]: 'Supervisão Norte',
        [f.localKm]: 'TU-KM113',
      };

      const result = mapSPToLocation(raw);

      expect(result.id).toBe(42);
      expect(result.title).toBe('TU-113');
      expect(result.locationType).toBe('TU');
      expect(result.km).toBe('113');
      expect(result.sede).toBe('São Luís');
      expect(result.supervisao).toBe('Supervisão Norte');
      expect(result.localKm).toBe('TU-KM113');
    });

    it('trata fallbacks para campos ausentes', () => {
      const result = mapSPToLocation({});
      expect(result.id).toBe(0);
      expect(result.title).toBe('');
      expect(result.sede).toBe('');
      expect(result.supervisao).toBe('');
    });
  });

  describe('mapToSede e mapToResponsibles', () => {
    it('mapeia item raw para Sedes', () => {
      const f = SP_FIELDS.Sedes;
      const raw = {
        ID: 5,
        [f.Title]: 'Sede Central',
        [f.Supervisao]: 'Supervisão Centro',
      };

      const result = mapToSede(raw);
      expect(result.id).toBe(5);
      expect(result.title).toBe('Sede Central');
      expect(result.supervisao).toBe('Supervisão Centro');
    });

    it('mapeia item raw para Responsibles', () => {
      const f = SP_FIELDS.Responsibles;
      const raw = {
        Id: 7,
        [f.Title]: 'Carlos Silva',
        [f.Supervisao]: 'Supervisão Norte',
        [f.Ativo]: 'Sim',
        [f.Matricula]: '01234567',
      };

      const result = mapToResponsibles(raw);
      expect(result.id).toBe(7);
      expect(result.title).toBe('Carlos Silva');
      expect(result.supervisao).toBe('Supervisão Norte');
      expect(result.ativo).toBe('Sim');
      expect(result.matricula).toBe('01234567');
    });
  });

  describe('mapSPToBattery', () => {
    it('mapeia item raw para Battery convertendo datas e valores numéricos', () => {
      const f = SP_FIELDS.Batteries;
      const raw = {
        Id: 10,
        [f.Title]: 'BAT-TU-01',
        [f.NO]: 1,
        [f.Banco]: 2,
        [f.Modelo]: 'Moura Clean',
        [f.Fabricante]: 'Moura',
        [f.DataDeFabricacao]: '2024-05-15T00:00:00Z',
        [f.Local]: 'TU',
        [f.KM]: '113',
        [f.IDLocalId]: 42,
        [f.Status]: 'Ativa',
      };

      const result = mapSPToBattery(raw);

      expect(result.id).toBe(10);
      expect(result.serialNumber).toBe('BAT-TU-01');
      expect(result.sequenceNumber).toBe(1);
      expect(result.bankNumber).toBe(2);
      expect(result.model).toBe('Moura Clean');
      expect(result.manufacturer).toBe('Moura');
      expect(result.manufactureDate).toBeInstanceOf(Date);
      expect(result.locationType).toBe('TU');
      expect(result.km).toBe('113');
      expect(result.locationId).toBe(42);
      expect(result.status).toBe('Ativa');
    });

    it('aplica defaults (banco 1, status Ativa) quando não especificados', () => {
      const result = mapSPToBattery({});
      expect(result.bankNumber).toBe(1);
      expect(result.status).toBe('Ativa');
      expect(result.manufactureDate).toBeUndefined();
    });
  });

  describe('mapSPToMeasurement', () => {
    it('converte strings de tensão, resistência e corrente com vírgula ou ponto para números', () => {
      const f = SP_FIELDS.Measurements;
      const raw = {
        Id: 101,
        [f.Title]: 'Banco 1-Bat01',
        [f.BateriaId]: 10,
        [f.ID_AtividadeId]: 500,
        [f.Tensao]: '13,85',
        [f.Resistencia]: '2.74',
        [f.Corrente]: '1,20',
        [f.Status_geral]: 'EXCELENTE',
        [f.Status_tensao]: 'EXCELENTE',
        [f.Status_resistencia]: 'EXCELENTE',
        [f.Data]: '2026-03-01T12:00:00Z',
      };

      const result = mapSPToMeasurement(raw);

      expect(result.id).toBe(101);
      expect(result.title).toBe('Banco 1-Bat01');
      expect(result.batteryId).toBe(10);
      expect(result.activityId).toBe(500);
      expect(result.voltage).toBe(13.85);
      expect(result.resistance).toBe(2.74);
      expect(result.current).toBe(1.2);
      expect(result.overallStatus).toBe('EXCELENTE');
      expect(result.date).toBeInstanceOf(Date);
    });

    it('trata valores vazios ou nulos de medição com fallback 0', () => {
      const f = SP_FIELDS.Measurements;
      const raw = {
        [f.Tensao]: '',
        [f.Resistencia]: null,
        [f.Corrente]: undefined,
      };

      const result = mapSPToMeasurement(raw);
      expect(result.voltage).toBe(0);
      expect(result.resistance).toBe(0);
      expect(result.current).toBe(0);
    });
  });

  describe('mapSPToActivity', () => {
    it('mapeia item raw de atividade e campos lookup', () => {
      const f = SP_FIELDS.Activities;
      const raw = {
        Id: 500,
        [f.OM]: 'OM-998877',
        [f.Data_da_Atividade]: '2026-03-01T10:00:00Z',
        [f.Supervisao]: 'Supervisão Norte',
        [f.Sede]: { Title: 'Sede Central' },
        [f.KM]: { Title: 'KM 113' },
        [f.Tipo_de_Atividade]: 'Preventiva',
        [f.Tipo_de_Local]: 'TU',
        [f.Temperatura_da_Sala]: '24,5',
        [f.Tensao_Total]: '126,8',
        [f.Observacoes_Gerais]: 'Atividade concluída com sucesso',
        [f.ResponsaveisId]: [10, 20],
      };

      const result = mapSPToActivity(raw);

      expect(result.id).toBe(500);
      expect(result.maintenanceOrder).toBe('OM-998877');
      expect(result.activityDate).toBeInstanceOf(Date);
      expect(result.supervision).toBe('Supervisão Norte');
      expect(result.sede).toBe('Sede Central');
      expect(result.km).toBe('KM 113');
      expect(result.roomTemperature).toBe(24.5);
      expect(result.totalVoltage).toBe(126.8);
      expect(result.generalObservations).toBe('Atividade concluída com sucesso');
      expect((result as any)._responsaveisId).toEqual([10, 20]);
    });
  });
});
