// ============================================================================
// DashboardService.ts
// Serviço responsável por carregar dados das listas SharePoint para o Dashboard.
// Implementa cache em memória com TTL.
// Lookups são resolvidos em memória (sem $expand) para evitar erros de campo.
// ============================================================================

import { SharePointService } from './SharePointService';
import { ListNames } from '../constants/ListNames';
import { CACHE_CONFIG, SP_FIELDS } from '../constants/DashboardConstants';
import { Location, Battery, Measurement, Activity } from '../models/DashboardModels';
import { mapSPToLocation, mapSPToBattery, mapSPToMeasurement, mapSPToActivity } from '../mappers/DashboardMappers';

import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';

// ─── Cache ───────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/** Cache em memória com TTL */
class MemoryCache {
  private _store: Map<string, CacheEntry<unknown>> = new Map();

  public get<T>(key: string): T | undefined {
    const entry = this._store.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.timestamp > CACHE_CONFIG.ttlMs) {
      this._store.delete(key);
      return undefined;
    }
    return entry.data as T;
  }

  public set<T>(key: string, data: T): void {
    this._store.set(key, { data, timestamp: Date.now() });
  }

  public clear(): void {
    this._store.clear();
  }
}

// ─── Serviço ─────────────────────────────────────────────────────────────────

export class DashboardService {
  private static _cache: MemoryCache = new MemoryCache();

  // ── Locais ──────────────────────────────────────────────────────────────

  /** Carrega todos os locais da lista "km das LI" */
  public static async loadLocations(forceRefresh: boolean = false): Promise<Location[]> {
    const cacheKey = 'locations';
    if (!forceRefresh) {
      const cached = this._cache.get<Location[]>(cacheKey);
      if (cached) return cached;
    }

    const sp = SharePointService.sp;
    const items = await sp.web.lists
      .getByTitle(ListNames.Locations)
      .items
      .top(5000)();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const locations = (items as any[]).map(mapSPToLocation);
    this._cache.set(cacheKey, locations);
    return locations;
  }

  // ── Baterias ────────────────────────────────────────────────────────────

  /** Carrega todas as baterias da lista "Baterias_SAT2" (sem expand) */
  public static async loadBatteries(forceRefresh: boolean = false): Promise<Battery[]> {
    const cacheKey = 'batteries';
    if (!forceRefresh) {
      const cached = this._cache.get<Battery[]>(cacheKey);
      if (cached) return cached;
    }

    const sp = SharePointService.sp;
    // Sem expand — lookup IDLocal será resolvido em memória via IDLocalId
    const items = await sp.web.lists
      .getByTitle(ListNames.Batteries)
      .items
      .top(5000)();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const batteries = (items as any[]).map(mapSPToBattery);
    this._cache.set(cacheKey, batteries);
    return batteries;
  }

  // ── Medições ────────────────────────────────────────────────────────────

  /** Carrega medições da lista "RG 1107 - info_medicoes_baterias" (sem expand) */
  public static async loadMeasurements(
    forceRefresh: boolean = false,
    startDate?: Date
  ): Promise<Measurement[]> {
    const cacheKey = startDate ? 'measurements_' + startDate.toISOString() : 'measurements';
    if (!forceRefresh) {
      const cached = this._cache.get<Measurement[]>(cacheKey);
      if (cached) return cached;
    }

    const sp = SharePointService.sp;
    // Sem expand — lookup Bateria será resolvido em memória via BateriaId
    let query = sp.web.lists
      .getByTitle(ListNames.Measurements)
      .items
      .orderBy(SP_FIELDS.Measurements.Data, false);

    if (startDate) {
      query = query.filter(SP_FIELDS.Measurements.Data + " ge datetime'" + startDate.toISOString() + "'");
    }

    const items = await query.top(CACHE_CONFIG.measurementsPageSize)();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const measurements = (items as any[]).map(mapSPToMeasurement);
    this._cache.set(cacheKey, measurements);
    return measurements;
  }

  // ── Atividades ──────────────────────────────────────────────────────────

  /** Carrega todas as atividades da lista "RG 1107 - info_atividades" (sem expand) */
  public static async loadActivities(forceRefresh: boolean = false): Promise<Activity[]> {
    const cacheKey = 'activities';
    if (!forceRefresh) {
      const cached = this._cache.get<Activity[]>(cacheKey);
      if (cached) return cached;
    }

    const sp = SharePointService.sp;
    // Sem expand — lookups serão resolvidos em memória
    const items = await sp.web.lists
      .getByTitle(ListNames.Activities)
      .items
      .orderBy(SP_FIELDS.Activities.Data_da_Atividade, false)
      .top(5000)();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activities = (items as any[]).map(mapSPToActivity);
    this._cache.set(cacheKey, activities);
    return activities;
  }

  // ── Responsáveis ────────────────────────────────────────────────────────

  /** Carrega lista auxiliar "Baterias - Responsaveis" para resolver lookup */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static async loadResponsibles(forceRefresh: boolean = false): Promise<Array<{ id: number; title: string }>> {
    const cacheKey = 'responsibles';
    if (!forceRefresh) {
      const cached = this._cache.get<Array<{ id: number; title: string }>>(cacheKey);
      if (cached) return cached;
    }

    const sp = SharePointService.sp;
    const items = await sp.web.lists
      .getByTitle(ListNames.Responsibles)
      .items
      .top(500)();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responsibles = (items as any[]).map((item) => ({
      id: item.Id || item.ID || 0,
      title: item.Title || '',
    }));
    this._cache.set(cacheKey, responsibles);
    return responsibles;
  }

  // ── Carregamento Orquestrado ────────────────────────────────────────────

  /** Carrega todos os dados do dashboard em paralelo e resolve lookups em memória */
  public static async loadAllData(forceRefresh: boolean = false): Promise<{
    locations: Location[];
    batteries: Battery[];
    measurements: Measurement[];
    activities: Activity[];
  }> {
    const [locations, batteries, measurements, activities, responsibles] = await Promise.all([
      this.loadLocations(forceRefresh),
      this.loadBatteries(forceRefresh),
      this.loadMeasurements(forceRefresh),
      this.loadActivities(forceRefresh),
      this.loadResponsibles(forceRefresh),
    ]);

    // ── Resolução de lookups em memória ────────────────────────────────

    // Mapa de Locais: ID → Location
    const locationMap: Record<number, Location> = {};
    locations.forEach((loc) => { locationMap[loc.id] = loc; });

    // Mapa de Baterias: ID → Battery
    const batteryMap: Record<number, Battery> = {};
    batteries.forEach((bat) => { batteryMap[bat.id] = bat; });

    // Mapa de Responsáveis: ID → nome
    const responsibleMap: Record<number, string> = {};
    responsibles.forEach((r) => { responsibleMap[r.id] = r.title; });

    // Resolver locationTitle nas baterias via IDLocalId → locationMap
    batteries.forEach((bat) => {
      if (bat.locationId && locationMap[bat.locationId]) {
        bat.locationTitle = locationMap[bat.locationId].title;
      }
    });

    // Resolver batterySerialNumber nas medições via BateriaId → batteryMap
    measurements.forEach((m) => {
      if (m.batteryId && batteryMap[m.batteryId]) {
        m.batterySerialNumber = batteryMap[m.batteryId].serialNumber;
      }
    });

    // Resolver responsibles nas atividades via ResponsaveisId → responsibleMap
    activities.forEach((a) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawActivity = a as any;
      // ResponsaveisId pode ser um número único ou array de números
      const respIds = rawActivity._responsaveisId;
      if (respIds !== undefined && respIds !== null) {
        if (Array.isArray(respIds)) {
          a.responsibles = respIds
            .map((id: number) => responsibleMap[id])
            .filter((name: string | undefined) => !!name) as string[];
        } else if (typeof respIds === 'number' && responsibleMap[respIds]) {
          a.responsibles = [responsibleMap[respIds]];
        }
      }
    });

    return { locations, batteries, measurements, activities };
  }

  // ── Cache Control ───────────────────────────────────────────────────────

  /** Limpa todo o cache em memória */
  public static clearCache(): void {
    this._cache.clear();
  }
}
