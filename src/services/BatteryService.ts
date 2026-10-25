// ============================================================================
// BatteryService.ts
// Serviço para operações CRUD de baterias na lista Baterias_SAT2.
// Inserção em lote, substituição (desativação + inserção) e consultas.
// ============================================================================

import { SharePointService } from './SharePointService';
import { ListNames } from '../constants/ListNames';
import { SP_FIELDS } from '../constants/DashboardConstants';
import { Battery, Location } from '../models/DashboardModels';
import { mapSPToBattery, mapSPToLocation } from '../mappers/DashboardMappers';

import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/batching';

/** Dados para criação de uma nova bateria */
export interface NewBatteryData {
  serialNumber: string;   // Title (NumeroDeSerie)
  sequenceNumber: number; // NO
  bankNumber: number;     // Banco
  model: string;
  manufacturer: string;
  manufactureDate?: string; // ISO date string
  locationType: string;   // TU, ARM, etc.
  km: string;
  locationId: number;     // IDLocalId (lookup)
  status: string;         // 'Ativa' | 'Inativa'
  supervisao?: string;    // Supervisão do local
}

/** Dados para atualização de uma bateria existente */
export interface UpdateBatteryData {
  serialNumber: string;
  model: string;
  manufacturer: string;
  manufactureDate?: string;
}

export class BatteryService {

  // ── Consultas ────────────────────────────────────────────────────────────

  /** Carrega todas as localizações da lista 'km das LI' */
  public static async loadLocations(): Promise<Location[]> {
    const sp = SharePointService.sp;
    const items = await sp.web.lists
      .getByTitle(ListNames.Locations)
      .items
      .top(5000)();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (items as any[]).map(mapSPToLocation);
  }

  /** Carrega baterias ativas de um local específico */
  public static async loadActiveBatteriesByLocation(locationId: number): Promise<Battery[]> {
    const sp = SharePointService.sp;
    const f = SP_FIELDS.Batteries;

    const items = await sp.web.lists
      .getByTitle(ListNames.Batteries)
      .items
      .filter(`${f.IDLocalId} eq ${locationId} and ${f.Status} eq 'Ativa'`)
      .orderBy(f.Banco, true)
      .orderBy(f.NO, true)
      .top(5000)();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (items as any[]).map(mapSPToBattery);
  }

  /** Carrega TODAS as baterias de um local (ativas e inativas) */
  public static async loadAllBatteriesByLocation(locationId: number): Promise<Battery[]> {
    const sp = SharePointService.sp;
    const f = SP_FIELDS.Batteries;

    const items = await sp.web.lists
      .getByTitle(ListNames.Batteries)
      .items
      .filter(`${f.IDLocalId} eq ${locationId}`)
      .orderBy(f.Banco, true)
      .orderBy(f.NO, true)
      .top(5000)();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (items as any[]).map(mapSPToBattery);
  }

  // ── Inserção individual ────────────────────────────────────────────────

  /** Insere uma bateria na lista SP */
  public static async addBatterySingle(bat: NewBatteryData): Promise<void> {
    const sp = SharePointService.sp;
    const f = SP_FIELDS.Batteries;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itemData: Record<string, any> = {
      [f.Title]: bat.serialNumber,
      [f.NO]: bat.sequenceNumber,
      [f.Banco]: bat.bankNumber,
      [f.Modelo]: bat.model,
      [f.Fabricante]: bat.manufacturer,
      [f.Local]: bat.locationType,
      [f.KM]: bat.km,
      [f.IDLocalId]: bat.locationId,
      [f.Status]: bat.status || 'Ativa',
    };

    if (bat.manufactureDate) {
      itemData[f.DataDeFabricacao] = bat.manufactureDate;
    }

    if (bat.supervisao) {
      itemData[f.Supervisao] = bat.supervisao;
    }

    await sp.web.lists.getByTitle(ListNames.Batteries).items.add(itemData);
  }

  // ── Inserção em lote ───────────────────────────────────────────────────

  /** Insere várias baterias sequencialmente */
  public static async addBatteries(batteries: NewBatteryData[]): Promise<void> {
    for (const bat of batteries) {
      await this.addBatterySingle(bat);
    }
  }

  // ── Atualização (edição in-place) ────────────────────────────────────

  /** Atualiza os campos editáveis de uma bateria existente */
  public static async updateBattery(batteryId: number, data: UpdateBatteryData): Promise<void> {
    const sp = SharePointService.sp;
    const f = SP_FIELDS.Batteries;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itemData: Record<string, any> = {
      [f.Title]: data.serialNumber,
      [f.Modelo]: data.model,
      [f.Fabricante]: data.manufacturer,
    };

    if (data.manufactureDate) {
      itemData[f.DataDeFabricacao] = data.manufactureDate;
    }

    await sp.web.lists.getByTitle(ListNames.Batteries)
      .items.getById(batteryId).update(itemData);
  }

  /** Atualiza várias baterias sequencialmente */
  public static async updateBatteries(updates: Array<{ id: number; data: UpdateBatteryData }>): Promise<void> {
    for (const { id, data } of updates) {
      await this.updateBattery(id, data);
    }
  }

  // ── Desativação ────────────────────────────────────────────────────────

  /** Marca baterias como 'Inativa' (não exclui da lista) */
  public static async deactivateBatteries(batteryIds: number[]): Promise<void> {
    const sp = SharePointService.sp;
    const f = SP_FIELDS.Batteries;

    for (const id of batteryIds) {
      await sp.web.lists.getByTitle(ListNames.Batteries)
        .items.getById(id).update({
          [f.Status]: 'Inativa',
        });
    }
  }

  // ── Substituição (desativar + inserir) ─────────────────────────────────

  /** Substitui baterias: desativa as antigas e insere as novas */
  public static async replaceBatteries(
    oldBatteryIds: number[],
    newBatteries: NewBatteryData[]
  ): Promise<void> {
    // 1. Desativar as baterias antigas
    if (oldBatteryIds.length > 0) {
      await this.deactivateBatteries(oldBatteryIds);
    }

    // 2. Inserir as novas
    if (newBatteries.length > 0) {
      await this.addBatteries(newBatteries);
    }
  }
}