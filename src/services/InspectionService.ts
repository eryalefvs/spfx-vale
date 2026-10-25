// ============================================================================
// InspectionService.ts
// Serviço do formulário de inspeção: carregamento de dados, parsing de Excel,
// cálculo de status e salvamento nas listas do SharePoint.
// ============================================================================

import { InspectionMapper } from '../mappers/InspectionMapper';
import { IWizardFormData, IParsedBatteryData, IQuickMeasurementData } from '../models/BatteryInspection';
import { SharePointService } from './SharePointService';
import { BatteryService } from './BatteryService';
import { ListNames } from '../constants/ListNames';
import { mapSPToLocation, mapToSede, mapToResponsibles } from '../mappers/DashboardMappers';
import { Location, Sedes, Responsibles } from '../models/DashboardModels';
import {
  SP_FIELDS,
  VOLTAGE_THRESHOLDS,
  RESISTANCE_THRESHOLDS,
} from '../constants/DashboardConstants';
import { BatteryStatus } from '../types/DashboardTypes';
import * as XLSX from 'xlsx';

export class InspectionService {

  // ── Carregamento de Dados ─────────────────────────────────────────────

  public async loadLocations(): Promise<Location[]> {
    const sp = SharePointService.sp;
    const f = SP_FIELDS.Locations;

    const items = await sp.web.lists
      .getByTitle(ListNames.Locations)
      .items.select(
        'Id', f.Title, f.Local, f.KM, f.Sede, f.Supervisao, f.localKm
      )
      .top(5000)();

    return items.map(mapSPToLocation);
  }

  public async loadSedes(): Promise<Sedes[]> {
    const f = SP_FIELDS.Sedes;

    const items = await SharePointService.sp.web.lists
      .getByTitle(ListNames.Sedes)
      .items.select('Id', f.Title, f.Supervisao)();

    return items.map(mapToSede);
  }

  public async loadResponsaveis(): Promise<Responsibles[]> {
    const f = SP_FIELDS.Responsibles;

    const items = await SharePointService.sp.web.lists
      .getByTitle(ListNames.Responsibles)
      .items.select('Id', f.Title, f.Supervisao, f.Ativo, f.Matricula)();

    return items.map(mapToResponsibles);
  }

  // ── Parsing de Excel ──────────────────────────────────────────────────

  /**
   * Parseia um arquivo Excel gerado pelo analisador de baterias.
   *
   * Estrutura esperada do arquivo:
   * - Row 0: Location: "TU-113-120V-B1"  (identifica banco via "B1"/"B2")
   * - Row 4: Battery Num: 10
   * - Row 11: Headers: [NO, mΩ, VDC, Temp(℃), Time]
   * - Row 12+: Dados: [1, 2.71, 13.72, "--", timestamp]
   *
   * Os dados param na primeira linha vazia ou com valor não-numérico no NO.
   */
  public static parseExcelFile(
    data: ArrayBuffer,
    fileName: string
  ): IParsedBatteryData[] {
    const isCsv = fileName.toLowerCase().endsWith('.csv');

    let workbook;
    if (isCsv) {
      // CSV do analisador pode ser UTF-16LE (BOM) ou UTF-8
      const bytes = new Uint8Array(data);
      const isUtf16 = bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE;
      const csvText = isUtf16
        ? new TextDecoder('utf-16le').decode(data)
        : new TextDecoder('utf-8').decode(data);
      workbook = XLSX.read(csvText, { type: 'string', FS: '\t' });
    } else {
      workbook = XLSX.read(data, { type: 'array' });
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // ─── Extrair número do banco do campo "Location:" ──────────────────
    // No Excel: row 0, col 1.  No CSV: pode estar em row 1 ou outra.
    // Busca genérica pela primeira row que contenha "Location" na col 0.
    let bankNumber = 1;
    for (const row of rows) {
      if (row && typeof row[0] === 'string' && row[0].toLowerCase().includes('location')) {
        const locationStr = String(row[1] || '');
        const bankMatch = locationStr.match(/B(\d+)/i);
        if (bankMatch) {
          bankNumber = parseInt(bankMatch[1], 10);
        }
        break;
      }
    }
    const bankLabel = `B${bankNumber}`;

    // ─── Encontrar header "NO", "mΩ"/"mO", "VDC" ──────────────────────
    // Excel usa "mΩ" (com símbolo Omega), CSV pode usar "mO" (letra O).
    const headerIdx = rows.findIndex(
      (row) =>
        row &&
        String(row[0]).trim() === 'NO' &&
        typeof row[1] === 'string' &&
        (row[1].includes('Ω') || row[1].toLowerCase().includes('mo'))
    );

    if (headerIdx === -1) {
      console.warn(
        `[parseExcelFile] Header "NO, mΩ/mO, VDC" não encontrado em "${fileName}".`
      );
      return [];
    }

    // ─── Extrair dados das baterias ────────────────────────────────────
    const batteries: IParsedBatteryData[] = [];

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row) break;

      // NO pode ser number (Excel) ou string "01" (CSV)
      const rawNo = row[0];
      const no = typeof rawNo === 'number' ? rawNo : parseInt(String(rawNo), 10);
      if (isNaN(no)) break;

      const resistance = parseFloat(String(row[1]));
      const voltage = parseFloat(String(row[2]));

      if (isNaN(resistance) || isNaN(voltage)) continue;

      const voltageStatus = InspectionService.calculateVoltageStatus(voltage);
      const resistanceStatus =
        InspectionService.calculateResistanceStatus(resistance);
      const overallStatus = InspectionService.calculateOverallStatus(
        voltageStatus,
        resistanceStatus
      );

      batteries.push({
        no,
        resistance,
        voltage,
        bankNumber,
        bankLabel,
        fileName,
        voltageStatus,
        resistanceStatus,
        overallStatus,
      });
    }

    return batteries;
  }

  // ── Cálculo de Status ─────────────────────────────────────────────────

  /** Calcula o status de tensão com base nos thresholds */
  public static calculateVoltageStatus(voltage: number): BatteryStatus {
    if (voltage > VOLTAGE_THRESHOLDS.maxAcceptable) return 'CRITICO';
    if (voltage >= VOLTAGE_THRESHOLDS.excellentMin) return 'EXCELENTE';
    if (voltage >= VOLTAGE_THRESHOLDS.alertMin) return 'ALERTA';
    return 'CRITICO';
  }

  /** Calcula o status de resistência com base nos thresholds */
  public static calculateResistanceStatus(
    resistance: number
  ): BatteryStatus {
    if (resistance <= RESISTANCE_THRESHOLDS.excellentMax) return 'EXCELENTE';
    if (resistance <= RESISTANCE_THRESHOLDS.alertMax) return 'ALERTA';
    return 'CRITICO';
  }

  /** Status geral = o PIOR entre tensão e resistência */
  public static calculateOverallStatus(
    voltageStatus: BatteryStatus,
    resistanceStatus: BatteryStatus
  ): BatteryStatus {
    const priority: Record<BatteryStatus, number> = {
      CRITICO: 0,
      ALERTA: 1,
      EXCELENTE: 2,
    };
    return priority[voltageStatus] <= priority[resistanceStatus]
      ? voltageStatus
      : resistanceStatus;
  }

  // ── Salvamento ────────────────────────────────────────────────────────

  /** Salva a atividade na lista do SharePoint e retorna o ID criado */
  public async saveActivity(data: IWizardFormData): Promise<number> {
    const item = InspectionMapper.activityToSharePoint(data);


    // console.log(
    //   '[InspectionService] Dados enviados para Activity:',
    //   JSON.stringify(item, null, 2)
    // );

    const result = await SharePointService.sp.web.lists
      .getByTitle(ListNames.Activities)
      .items.add(item);

    // console.log('[InspectionService] Resultado do add:', result);

    return result.Id;
  }

  /** Salva uma atividade avulsa (tipo "Outros") e retorna o ID criado */
  public async saveQuickActivity(data: IQuickMeasurementData): Promise<number> {
    const item = InspectionMapper.quickActivityToSharePoint(data);

    const result = await SharePointService.sp.web.lists
      .getByTitle(ListNames.Activities)
      .items.add(item);

    return result.Id;
  }

  /** Salva todas as medições em batch, vinculadas à atividade */
  public async saveMeasurements(
    activityId: number,
    batteries: IParsedBatteryData[],
    date: string,
    locationId: number
  ): Promise<void> {

    // console.log(
    //   '[saveMeasurements] Activity ID:',
    //   activityId,
    //   '| Location ID:',
    //   locationId
    // );

    // Carregar baterias ativas do local para fazer match por (banco, NO)
    const activeBatteries = await BatteryService.loadActiveBatteriesByLocation(locationId);
    // console.log(
    //   '[saveMeasurements] Baterias ativas no local:',
    //   activeBatteries.length
    // );

    const list = SharePointService.sp.web.lists
      .getByTitle(ListNames.Measurements);

    for (const battery of batteries) {

      // Match: encontrar bateria pelo banco + número sequencial (NO)
      const matched = activeBatteries.find(
        (b) => b.bankNumber === battery.bankNumber && b.sequenceNumber === battery.no
      );

      if (matched) {
        battery.matchedBatteryId = matched.id;
        // console.log(
        //   `[saveMeasurements] Match: B${battery.bankNumber}-Bat${battery.no} → ID ${matched.id} (${matched.serialNumber})`
        // );
      } else {
        console.warn(
          `[saveMeasurements] Sem match para B${battery.bankNumber}-Bat${battery.no} no local ${locationId}`
        );
      }

      const item = InspectionMapper.measurementToSharePoint(
        activityId,
        battery,
        date
      );

      // console.log(
      //   '[saveMeasurements] Item:',
      //   JSON.stringify(item, null, 2)
      // );

      const result = await list.items.add(item);

      // console.log(
      //   '[saveMeasurements] Medição salva:',
      //   result.Id
      // );
    }

    // console.log(
    //   '[saveMeasurements] Todas as medições foram salvas.'
    // );
  }
}