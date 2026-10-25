// ============================================================================
// BatteryService.test.ts
// Testes unitários para operações CRUD, substituição lógica e consultas de baterias.
// ============================================================================

import { BatteryService, NewBatteryData, UpdateBatteryData } from '../BatteryService';
import { SharePointService } from '../SharePointService';
import { SP_FIELDS } from '../../constants/DashboardConstants';

describe('BatteryService - Operações de Baterias', () => {
  let mockAdd: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockGetById: jest.Mock;
  let mockFilter: jest.Mock;
  let mockTop: jest.Mock;

  beforeEach(() => {
    mockAdd = jest.fn().mockResolvedValue({ Id: 1 });
    mockUpdate = jest.fn().mockResolvedValue({});
    mockGetById = jest.fn().mockReturnValue({ update: mockUpdate });
    mockTop = jest.fn().mockReturnValue(jest.fn().mockResolvedValue([]));

    mockFilter = jest.fn().mockReturnValue({
      orderBy: jest.fn().mockReturnValue({
        orderBy: jest.fn().mockReturnValue({
          top: mockTop,
        }),
      }),
    });

    const mockLists = {
      getByTitle: jest.fn().mockReturnValue({
        items: {
          add: mockAdd,
          filter: mockFilter,
          getById: mockGetById,
          top: mockTop,
        },
      }),
    };

    Object.defineProperty(SharePointService, 'sp', {
      get: () => ({ web: { lists: mockLists } } as any),
      configurable: true,
    });
  });

  describe('loadActiveBatteriesByLocation', () => {
    it('aplica filtro de IDLocalId e Status Ativa', async () => {
      mockTop.mockReturnValueOnce(
        jest.fn().mockResolvedValueOnce([
          { Id: 1, [SP_FIELDS.Batteries.Title]: 'BAT-01', [SP_FIELDS.Batteries.Status]: 'Ativa' },
        ])
      );

      const result = await BatteryService.loadActiveBatteriesByLocation(42);

      expect(mockFilter).toHaveBeenCalledWith(
        expect.stringContaining("IDLocalId eq 42 and Status eq 'Ativa'")
      );
      expect(result.length).toBe(1);
      expect(result[0].serialNumber).toBe('BAT-01');
    });
  });

  describe('addBatterySingle e addBatteries', () => {
    it('insere bateria com os campos mapeados corretamente', async () => {
      const batData: NewBatteryData = {
        serialNumber: 'BAT-NEW-01',
        sequenceNumber: 1,
        bankNumber: 1,
        model: 'Moura Clean',
        manufacturer: 'Moura',
        manufactureDate: '2025-01-01',
        locationType: 'TU',
        km: '100',
        locationId: 42,
        status: 'Ativa',
        supervisao: 'Supervisão Norte',
      };

      await BatteryService.addBatterySingle(batData);

      expect(mockAdd).toHaveBeenCalledTimes(1);
      const payload = mockAdd.mock.calls[0][0];
      expect(payload[SP_FIELDS.Batteries.Title]).toBe('BAT-NEW-01');
      expect(payload[SP_FIELDS.Batteries.NO]).toBe(1);
      expect(payload[SP_FIELDS.Batteries.Banco]).toBe(1);
      expect(payload[SP_FIELDS.Batteries.IDLocalId]).toBe(42);
      expect(payload[SP_FIELDS.Batteries.Status]).toBe('Ativa');
      expect(payload[SP_FIELDS.Batteries.Supervisao]).toBe('Supervisão Norte');
    });

    it('addBatteries itera e insere cada elemento do lote', async () => {
      const bats: NewBatteryData[] = [
        { serialNumber: 'B1', sequenceNumber: 1, bankNumber: 1, model: 'M', manufacturer: 'F', locationType: 'TU', km: '1', locationId: 1, status: 'Ativa' },
        { serialNumber: 'B2', sequenceNumber: 2, bankNumber: 1, model: 'M', manufacturer: 'F', locationType: 'TU', km: '1', locationId: 1, status: 'Ativa' },
      ];

      await BatteryService.addBatteries(bats);
      expect(mockAdd).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateBattery e updateBatteries', () => {
    it('chama getById e update com os campos editáveis', async () => {
      const updateData: UpdateBatteryData = {
        serialNumber: 'BAT-EDIT-01',
        model: 'Novo Modelo',
        manufacturer: 'Novo Fabricante',
        manufactureDate: '2025-06-01',
      };

      await BatteryService.updateBattery(99, updateData);

      expect(mockGetById).toHaveBeenCalledWith(99);
      expect(mockUpdate).toHaveBeenCalledTimes(1);
      const payload = mockUpdate.mock.calls[0][0];
      expect(payload[SP_FIELDS.Batteries.Title]).toBe('BAT-EDIT-01');
      expect(payload[SP_FIELDS.Batteries.Modelo]).toBe('Novo Modelo');
    });
  });

  describe('deactivateBatteries e replaceBatteries', () => {
    it('deactivateBatteries marca status como Inativa para cada ID informado', async () => {
      await BatteryService.deactivateBatteries([10, 20]);

      expect(mockGetById).toHaveBeenCalledWith(10);
      expect(mockGetById).toHaveBeenCalledWith(20);
      expect(mockUpdate).toHaveBeenCalledWith({ [SP_FIELDS.Batteries.Status]: 'Inativa' });
    });

    it('replaceBatteries desativa as baterias antigas e adiciona as novas', async () => {
      const newBats: NewBatteryData[] = [
        { serialNumber: 'B-REPLACE', sequenceNumber: 1, bankNumber: 1, model: 'M', manufacturer: 'F', locationType: 'TU', km: '1', locationId: 1, status: 'Ativa' },
      ];

      await BatteryService.replaceBatteries([10], newBats);

      expect(mockGetById).toHaveBeenCalledWith(10);
      expect(mockUpdate).toHaveBeenCalledWith({ [SP_FIELDS.Batteries.Status]: 'Inativa' });
      expect(mockAdd).toHaveBeenCalledTimes(1);
    });
  });
});
