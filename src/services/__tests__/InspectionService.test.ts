// ============================================================================
// InspectionService.test.ts
// Testes unitários para regras de cálculo, limiares de tensão/resistência,
// parsing de arquivos de baterias (CSV/XLSX) e persistência de dados.
// ============================================================================

import { InspectionService } from '../InspectionService';
import { SharePointService } from '../SharePointService';
import { BatteryService } from '../BatteryService';
import { DEFAULT_WIZARD_DATA, IParsedBatteryData } from '../../models/BatteryInspection';
import * as XLSX from 'xlsx';

describe('InspectionService - Limiares e Status', () => {
  describe('calculateVoltageStatus - Valores Limite', () => {
    it('classifica 12.29V como CRITICO e 12.30V como ALERTA (limiar alertMin)', () => {
      expect(InspectionService.calculateVoltageStatus(12.29)).toBe('CRITICO');
      expect(InspectionService.calculateVoltageStatus(12.3)).toBe('ALERTA');
    });

    it('classifica 12.49V como ALERTA e 12.50V como EXCELENTE (limiar excellentMin)', () => {
      expect(InspectionService.calculateVoltageStatus(12.49)).toBe('ALERTA');
      expect(InspectionService.calculateVoltageStatus(12.5)).toBe('EXCELENTE');
    });

    it('classifica valor ideal (13.8V) e limite superior (14.90V) como EXCELENTE', () => {
      expect(InspectionService.calculateVoltageStatus(13.8)).toBe('EXCELENTE');
      expect(InspectionService.calculateVoltageStatus(14.9)).toBe('EXCELENTE');
    });

    it('classifica 14.91V como CRITICO (sobretensão além de maxAcceptable)', () => {
      expect(InspectionService.calculateVoltageStatus(14.91)).toBe('CRITICO');
      expect(InspectionService.calculateVoltageStatus(16.0)).toBe('CRITICO');
    });

    it('classifica tensão para local MO (ideal 2V: excelente >= 1.95, alerta >= 1.90, crítico < 1.90 ou > 2.30)', () => {
      expect(InspectionService.calculateVoltageStatus(2.0, 'MO')).toBe('EXCELENTE');
      expect(InspectionService.calculateVoltageStatus(1.95, 'MO')).toBe('EXCELENTE');
      expect(InspectionService.calculateVoltageStatus(1.92, 'MO')).toBe('ALERTA');
      expect(InspectionService.calculateVoltageStatus(1.90, 'MO')).toBe('ALERTA');
      expect(InspectionService.calculateVoltageStatus(1.89, 'MO')).toBe('CRITICO');
      expect(InspectionService.calculateVoltageStatus(2.31, 'MO')).toBe('CRITICO');
    });
  });

  describe('calculateResistanceStatus - Valores Limite', () => {
    it('classifica 3.70Ω como EXCELENTE e 3.71Ω como ALERTA (limiar excellentMax)', () => {
      expect(InspectionService.calculateResistanceStatus(3.7)).toBe('EXCELENTE');
      expect(InspectionService.calculateResistanceStatus(3.71)).toBe('ALERTA');
    });

    it('classifica 4.00Ω como ALERTA e 4.01Ω como CRITICO (limiar alertMax)', () => {
      expect(InspectionService.calculateResistanceStatus(4.0)).toBe('ALERTA');
      expect(InspectionService.calculateResistanceStatus(4.01)).toBe('CRITICO');
      expect(InspectionService.calculateResistanceStatus(5.5)).toBe('CRITICO');
    });

    it('classifica resistência para local MO (ideal 0.66Ω: excelente <= 0.66, alerta <= 0.72, crítico > 0.72)', () => {
      expect(InspectionService.calculateResistanceStatus(0.66, 'MO')).toBe('EXCELENTE');
      expect(InspectionService.calculateResistanceStatus(0.60, 'MO')).toBe('EXCELENTE');
      expect(InspectionService.calculateResistanceStatus(0.70, 'MO')).toBe('ALERTA');
      expect(InspectionService.calculateResistanceStatus(0.72, 'MO')).toBe('ALERTA');
      expect(InspectionService.calculateResistanceStatus(0.73, 'MO')).toBe('CRITICO');
      expect(InspectionService.calculateResistanceStatus(1.0, 'MO')).toBe('CRITICO');
    });
  });

  describe('calculateOverallStatus - Prevalência do Pior Caso', () => {
    it('retorna EXCELENTE apenas se ambos forem excelentes', () => {
      expect(InspectionService.calculateOverallStatus('EXCELENTE', 'EXCELENTE')).toBe('EXCELENTE');
    });

    it('retorna ALERTA se um dos status for alerta e nenhum for crítico', () => {
      expect(InspectionService.calculateOverallStatus('EXCELENTE', 'ALERTA')).toBe('ALERTA');
      expect(InspectionService.calculateOverallStatus('ALERTA', 'EXCELENTE')).toBe('ALERTA');
      expect(InspectionService.calculateOverallStatus('ALERTA', 'ALERTA')).toBe('ALERTA');
    });

    it('retorna CRITICO se qualquer um dos status for crítico', () => {
      expect(InspectionService.calculateOverallStatus('CRITICO', 'EXCELENTE')).toBe('CRITICO');
      expect(InspectionService.calculateOverallStatus('EXCELENTE', 'CRITICO')).toBe('CRITICO');
      expect(InspectionService.calculateOverallStatus('CRITICO', 'ALERTA')).toBe('CRITICO');
      expect(InspectionService.calculateOverallStatus('ALERTA', 'CRITICO')).toBe('CRITICO');
      expect(InspectionService.calculateOverallStatus('CRITICO', 'CRITICO')).toBe('CRITICO');
    });
  });
});

describe('InspectionService - Parsing de Arquivo (CSV e Excel)', () => {
  it('faz parse de arquivo com identificação de Banco 1 e extração de medições', () => {
    // Monta dados em formato de planilha
    const sheetData = [
      ['Location:', 'TU-113-120V-B1'],
      ['Operator:', 'Tecnico Teste'],
      ['DateTime:', '2026-03-01 10:00'],
      ['Device:', 'IBEX-1000'],
      ['Battery Num:', 3],
      [],
      [],
      [],
      [],
      [],
      [],
      ['NO', 'mΩ', 'VDC', 'Temp(℃)', 'Time'],
      [1, 2.71, 13.72, '--', '10:01:00'],
      [2, 3.85, 13.05, '--', '10:02:00'],
      [3, 4.5, 12.0, '--', '10:03:00'],
      ['', '', '', '', ''], // linha vazia para parar o parser
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const result = InspectionService.parseExcelFile(buffer, 'medicao_banco1.xlsx');

    expect(result.length).toBe(3);
    // Bateria 1: 13.72V e 2.71mΩ => EXCELENTE
    expect(result[0].no).toBe(1);
    expect(result[0].voltage).toBe(13.72);
    expect(result[0].resistance).toBe(2.71);
    expect(result[0].bankNumber).toBe(1);
    expect(result[0].bankLabel).toBe('B1');
    expect(result[0].overallStatus).toBe('EXCELENTE');

    // Bateria 2: 13.05V (Alerta) e 3.85mΩ (Alerta) => ALERTA
    expect(result[1].no).toBe(2);
    expect(result[1].voltage).toBe(13.05);
    expect(result[1].resistance).toBe(3.85);
    expect(result[1].overallStatus).toBe('ALERTA');

    // Bateria 3: 12.0V (Crítico) e 4.5mΩ (Crítico) => CRITICO
    expect(result[2].no).toBe(3);
    expect(result[2].voltage).toBe(12.0);
    expect(result[2].resistance).toBe(4.5);
    expect(result[2].overallStatus).toBe('CRITICO');
  });

  it('identifica Banco 2 a partir do cabeçalho B2 no nome do local', () => {
    const sheetData = [
      ['Location:', 'TU-113-120V-B2'],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      ['NO', 'mΩ', 'VDC', 'Temp(℃)', 'Time'],
      [1, 2.5, 13.8, '--', '10:00:00'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const result = InspectionService.parseExcelFile(buffer, 'banco2.xlsx');
    expect(result.length).toBe(1);
    expect(result[0].bankNumber).toBe(2);
    expect(result[0].bankLabel).toBe('B2');
  });

  it('faz parse de arquivo CSV formatado com tabulação', () => {
    const csvContent =
      'Location:\tTU-113-120V-B1\n' +
      '\n\n\n\n\n\n\n\n\n\n' +
      'NO\tmO\tVDC\tTemp(C)\tTime\n' +
      '01\t2.60\t13.80\t--\t10:00:00\n';

    const arrayBuffer = new ArrayBuffer(csvContent.length);
    const view = new Uint8Array(arrayBuffer);
    for (let i = 0; i < csvContent.length; i++) {
      view[i] = csvContent.charCodeAt(i);
    }

    const result = InspectionService.parseExcelFile(arrayBuffer, 'medicao.csv');
    expect(result.length).toBe(1);
    expect(result[0].no).toBe(1);
    expect(result[0].voltage).toBe(13.8);
    expect(result[0].resistance).toBe(2.6);
  });
});

describe('InspectionService - Operações SharePoint com Mocks', () => {
  let mockAddActivity: jest.Mock;
  let mockAddMeasurement: jest.Mock;
  let mockLoadActiveBatteries: jest.SpyInstance;

  beforeEach(() => {
    mockAddActivity = jest.fn().mockResolvedValue({ Id: 1234 });
    mockAddMeasurement = jest.fn().mockResolvedValue({ Id: 5678 });

    // Mock da estrutura SharePointService.sp.web.lists.getByTitle
    const mockLists = {
      getByTitle: jest.fn().mockImplementation((listTitle: string) => ({
        items: {
          add: listTitle.includes('atividades') ? mockAddActivity : mockAddMeasurement,
          select: jest.fn().mockReturnValue(jest.fn().mockResolvedValue([])),
        },
      })),
    };

    // Sobrescrever getter SharePointService.sp
    Object.defineProperty(SharePointService, 'sp', {
      get: () => ({ web: { lists: mockLists } } as any),
      configurable: true,
    });
  });

  it('saveActivity salva o payload mapeado e retorna o ID criado', async () => {
    const service = new InspectionService();
    const id = await service.saveActivity({
      ...DEFAULT_WIZARD_DATA,
      maintenanceOrder: 'OM-100',
      activityDate: '2026-03-01',
      activityType: 'Preventiva',
      supervision: 'Norte',
      responsibleIds: [1],
      sedeId: 10,
      kmId: 100,
      locationType: 'TU',
      km: '100',
      ambientTemperature: '25',
      totalFloatVoltage: '125',
      contactMCM: 'sim',
    });

    expect(id).toBe(1234);
    expect(mockAddActivity).toHaveBeenCalledTimes(1);
  });

  it('saveMeasurements vincula medições com baterias ativas correspondentes pelo (banco, NO)', async () => {
    // Mock de baterias ativas no local
    mockLoadActiveBatteries = jest.spyOn(BatteryService, 'loadActiveBatteriesByLocation').mockResolvedValue([
      {
        id: 77,
        serialNumber: 'BAT-ACT-01',
        sequenceNumber: 1,
        bankNumber: 1,
        model: 'M',
        manufacturer: 'F',
        locationId: 50,
        locationTitle: 'TU-100',
        locationType: 'TU',
        km: 100,
        status: 'Ativa',
      },
    ]);

    const service = new InspectionService();
    const parsedBatteries: IParsedBatteryData[] = [
      {
        no: 1,
        resistance: 2.5,
        voltage: 13.8,
        bankNumber: 1,
        bankLabel: 'Banco 1',
        fileName: 'teste.xlsx',
        voltageStatus: 'EXCELENTE',
        resistanceStatus: 'EXCELENTE',
        overallStatus: 'EXCELENTE',
      },
    ];

    await service.saveMeasurements(1234, parsedBatteries, '2026-03-01', 50);

    expect(mockLoadActiveBatteries).toHaveBeenCalledWith(50);
    expect(parsedBatteries[0].matchedBatteryId).toBe(77);
    expect(mockAddMeasurement).toHaveBeenCalledTimes(1);

    mockLoadActiveBatteries.mockRestore();
  });
});
