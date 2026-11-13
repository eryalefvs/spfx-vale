// ============================================================================
// activityPdfGenerator.ts
// Gerador nativo de relatórios PDF (PDF 1.4 com WinAnsiEncoding) para
// atividades de manutenção/medição de baterias.
// Não requer dependências externas e realiza o download direto do arquivo .pdf.
// ============================================================================

import { Activity, Battery } from '../models/DashboardModels';
import { BatteryStatus } from '../types/DashboardTypes';
import { formatDate, parseStatus } from './dashboardUtils';

export interface Measurement {
  id: number;
  title: string;
  batteryId?: number;          // ID da bateria (via Lookup)
  batterySerialNumber: string; // Número de série resolvido
  activityId?: number;         // ID da atividade (via Lookup)
  voltage: number;             // Tensão (V)
  resistance: number;          // Resistência (Ω)
  current: number;             // Corrente (A)
  overallStatus: string;       // Status_geral — "EXCELENTE", etc.
  voltageStatus: string;       // Status_tensao
  resistanceStatus: string;    // Status_resistencia
  date: Date;                  // Data da medição
}

export interface IActivityPdfData extends Activity {
  measurements: Array<Measurement & { battery?: Battery }>;
  locationBatteries?: Battery[];
  locationId?: number;
  resolvedSede: string;
  resolvedKm: string;
  resolvedLocationType: string;
  localKm: string;
}

const PAGE_WIDTH = 595.28;  // A4 width in pt
const PAGE_HEIGHT = 841.89; // A4 height in pt
const MARGIN_X = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

/**
 * Converte caractere Unicode para código de byte Windows-1252 (WinAnsiEncoding).
 */
function charToWinAnsiByte(code: number): number {
  // Substituições especiais fora do WinAnsi
  if (code === 0x03a9 || code === 0x2126) return 0x4f; // Ω -> O (tratado antes em sanitize)
  // Mapa de caracteres 0x80..0x9F do Windows-1252
  switch (code) {
    case 0x20ac: return 0x80; // €
    case 0x201a: return 0x82; // ‚
    case 0x0192: return 0x83; // ƒ
    case 0x201e: return 0x84; // „
    case 0x2026: return 0x85; // …
    case 0x2020: return 0x86; // †
    case 0x2021: return 0x87; // ‡
    case 0x02c6: return 0x88; // ˆ
    case 0x2030: return 0x89; // ‰
    case 0x0160: return 0x8a; // Š
    case 0x2039: return 0x8b; // ‹
    case 0x0152: return 0x8c; // Œ
    case 0x017d: return 0x8e; // Ž
    case 0x2018: return 0x91; // ‘
    case 0x2019: return 0x92; // ’
    case 0x201c: return 0x93; // “
    case 0x201d: return 0x94; // ”
    case 0x2022: return 0x95; // •
    case 0x2013: return 0x96; // –
    case 0x2014: return 0x97; // —
    case 0x02dc: return 0x98; // ˜
    case 0x2122: return 0x99; // ™
    case 0x0161: return 0x9a; // š
    case 0x203a: return 0x9b; // ›
    case 0x0153: return 0x9c; // œ
    case 0x017e: return 0x9e; // ž
    case 0x0178: return 0x9f; // Ÿ
    default:
      if (code >= 0x20 && code <= 0x7e) return code;
      if (code >= 0xa0 && code <= 0xff) return code;
      return 0x3f; // '?'
  }
}

/**
 * Converte string JS em literal de string PDF (...) usando escapes octais \ddd
 * para garantir que o arquivo final seja 100% ASCII de 7 bits com WinAnsiEncoding.
 */
function toPdfString(input: string): string {
  const normalized = (input || '')
    .replace(/Ω/g, 'Ohm')
    .replace(/\r?\n/g, ' ');

  let out = '(';
  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i);
    const byte = charToWinAnsiByte(code);
    if (byte === 0x28) {
      out += '\\(';
    } else if (byte === 0x29) {
      out += '\\)';
    } else if (byte === 0x5c) {
      out += '\\\\';
    } else if (byte >= 0x20 && byte <= 0x7e) {
      out += String.fromCharCode(byte);
    } else {
      const octal = ('000' + byte.toString(8)).slice(-3);
      out += '\\' + octal;
    }
  }
  out += ')';
  return out;
}

/** Trunca texto caso ultrapasse o tamanho máximo de caracteres */
function truncateText(text: string, maxChars: number): string {
  const clean = (text || '').trim();
  if (clean.length <= maxChars) return clean;
  return clean.slice(0, maxChars - 3) + '...';
}

/** Quebra texto longo em múltiplas linhas por limite de caracteres */
function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = (text || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    if ((current + ' ' + word).length <= maxCharsPerLine) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Retorna tupla RGB (0..1) correspondente ao BatteryStatus */
function getStatusRgb(status: BatteryStatus): [number, number, number] {
  switch (status) {
    case 'EXCELENTE':
      return [0.086, 0.639, 0.290]; // #16A34A
    case 'ALERTA':
      return [0.918, 0.345, 0.047]; // #EA580C
    case 'CRITICO':
      return [0.863, 0.149, 0.149]; // #DC2626
    default:
      return [0.278, 0.333, 0.412];
  }
}

/** Auxiliar para desenhar comandos em uma página PDF usando coordenadas de topo (top-down) */
class PdfPageCanvas {
  private ops: string[] = [];

  public fillColor(r: number, g: number, b: number): void {
    this.ops.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
  }

  public strokeColor(r: number, g: number, b: number): void {
    this.ops.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`);
  }

  public lineWidth(w: number): void {
    this.ops.push(`${w.toFixed(2)} w`);
  }

  /** Desenha retângulo a partir do topo (top-left x, topY, width, height) */
  public rect(x: number, topY: number, w: number, h: number, mode: 'f' | 'S' | 'B' = 'f'): void {
    const pdfY = PAGE_HEIGHT - topY - h;
    this.ops.push(`${x.toFixed(2)} ${pdfY.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re ${mode}`);
  }

  /** Desenha linha horizontal/geral em coordenadas de topo */
  public line(x1: number, topY1: number, x2: number, topY2: number): void {
    const y1 = PAGE_HEIGHT - topY1;
    const y2 = PAGE_HEIGHT - topY2;
    this.ops.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  }

  /** Escreve texto na posição (x, topY da linha de base) */
  public text(
    str: string,
    x: number,
    topBaselineY: number,
    font: 'F1' | 'F2' = 'F1',
    size: number = 10
  ): void {
    const pdfY = PAGE_HEIGHT - topBaselineY;
    this.ops.push(`BT /${font} ${size} Tf ${x.toFixed(2)} ${pdfY.toFixed(2)} Td ${toPdfString(str)} Tj ET`);
  }

  public toStreamContent(): string {
    return this.ops.join('\n');
  }
}

/**
 * Gera os bytes de um documento PDF válido contendo o relatório da atividade.
 */
export function generateActivityPdfBytes(act: IActivityPdfData): Uint8Array {
  const pages: PdfPageCanvas[] = [];
  let page = new PdfPageCanvas();
  pages.push(page);

  const drawMainHeader = (p: PdfPageCanvas): void => {
    // Faixa superior Verde Vale (#007E7A -> 0, 0.494, 0.478)
    p.fillColor(0.0, 0.494, 0.478);
    p.rect(MARGIN_X, 32, CONTENT_WIDTH, 50, 'f');

    // Detalhe amarelo Vale na base do cabeçalho (#ECB11F -> 0.925, 0.694, 0.122)
    p.fillColor(0.925, 0.694, 0.122);
    p.rect(MARGIN_X, 82, CONTENT_WIDTH, 3, 'f');

    // Título e subtítulo
    p.fillColor(1, 1, 1);
    p.text('RELATÓRIO DE MANUTENÇÃO E MEDIÇÃO DE BATERIAS', MARGIN_X + 14, 53, 'F2', 13);
    p.text(
      `PRO-001107 (RG 1107)  |  Emitido em ${formatDate(new Date())}`,
      MARGIN_X + 14,
      70,
      'F1',
      9
    );
  };

  drawMainHeader(page);

  // ── Seção 1: Dados Gerais da Atividade ──────────────────────────────────
  let curY = 105;
  page.fillColor(0.0, 0.494, 0.478);
  page.text('1. INFORMAÇÕES DA ATIVIDADE', MARGIN_X, curY, 'F2', 10.5);
  curY += 8;

  const infoBoxHeight = 96;
  page.fillColor(0.973, 0.980, 0.988); // #F8FAFC
  page.strokeColor(0.886, 0.910, 0.941); // #E2E8F0
  page.lineWidth(0.8);
  page.rect(MARGIN_X, curY, CONTENT_WIDTH, infoBoxHeight, 'B');

  const col1X = MARGIN_X + 12;
  const col2X = MARGIN_X + CONTENT_WIDTH / 2 + 10;

  const drawField = (label: string, value: string, x: number, y: number, maxValChars: number = 34): void => {
    page.fillColor(0.392, 0.455, 0.545); // #64748B
    page.text(label, x, y, 'F2', 8.5);
    page.fillColor(0.059, 0.090, 0.165); // #0F172A
    page.text(truncateText(value || '-', maxValChars), x + 95, y, 'F1', 9);
  };

  const localDisplay = act.localKm || act.resolvedLocationType || '-';
  const sedeSupDisplay = [act.supervision, act.resolvedSede].filter(Boolean).join(' / ') || '-';
  const respDisplay = act.responsibles && act.responsibles.length > 0
    ? act.responsibles.join(', ')
    : '-';

  drawField('Data da Atividade:', formatDate(act.activityDate), col1X, curY + 18);
  drawField('Ordem (OM):', act.maintenanceOrder || '-', col2X, curY + 18);

  drawField('Tipo de Atividade:', act.activityType || '-', col1X, curY + 36);
  drawField('Supervisão / Sede:', sedeSupDisplay, col2X, curY + 36);

  drawField('Local Instalação:', localDisplay, col1X, curY + 54);
  drawField('KM / Tipo Local:', `KM ${act.resolvedKm || '-'} (${act.resolvedLocationType || '-'})`, col2X, curY + 54);

  drawField('Tensão Total:', act.totalVoltage ? `${act.totalVoltage} V` : '-', col1X, curY + 72);
  drawField('Temp. Ambiente:', act.roomTemperature ? `${act.roomTemperature} °C` : '-', col2X, curY + 72);

  drawField('Responsáveis:', respDisplay, col1X, curY + 90, 75);

  curY += infoBoxHeight + 18;

  // ── Seção 2: Resumo de Saúde das Baterias ───────────────────────────────
  let excellentCount = 0;
  let alertCount = 0;
  let criticalCount = 0;

  for (const m of act.measurements) {
    const st = parseStatus(m.overallStatus);
    if (st === 'EXCELENTE') excellentCount++;
    else if (st === 'ALERTA') alertCount++;
    else if (st === 'CRITICO') criticalCount++;
  }

  const cardGap = 10;
  const cardWidth = (CONTENT_WIDTH - cardGap * 3) / 4;
  const cardHeight = 38;

  const summaryCards: Array<{ label: string; value: string; rgb: [number, number, number] }> = [
    { label: 'BATERIAS MEDIDAS', value: String(act.measurements.length), rgb: [0.145, 0.388, 0.922] },
    { label: 'EXCELENTE', value: String(excellentCount), rgb: [0.086, 0.639, 0.290] },
    { label: 'EM ALERTA', value: String(alertCount), rgb: [0.918, 0.345, 0.047] },
    { label: 'CRÍTICO', value: String(criticalCount), rgb: [0.863, 0.149, 0.149] },
  ];

  summaryCards.forEach((c, idx) => {
    const cx = MARGIN_X + idx * (cardWidth + cardGap);
    page.fillColor(1, 1, 1);
    page.strokeColor(0.886, 0.910, 0.941);
    page.lineWidth(0.8);
    page.rect(cx, curY, cardWidth, cardHeight, 'B');

    // Barra lateral colorida
    page.fillColor(c.rgb[0], c.rgb[1], c.rgb[2]);
    page.rect(cx, curY, 4, cardHeight, 'f');

    page.fillColor(0.392, 0.455, 0.545);
    page.text(c.label, cx + 10, curY + 14, 'F2', 7.5);

    page.fillColor(c.rgb[0], c.rgb[1], c.rgb[2]);
    page.text(c.value, cx + 10, curY + 30, 'F2', 13);
  });

  curY += cardHeight + 20;

  // ── Seção 3: Tabela de Medições Individuais ─────────────────────────────
  page.fillColor(0.0, 0.494, 0.478);
  page.text('2. MEDIÇÕES INDIVIDUAIS DAS BATERIAS', MARGIN_X, curY, 'F2', 10.5);
  curY += 8;

  const drawTableHeader = (p: PdfPageCanvas, topY: number): number => {
    const headerH = 20;
    p.fillColor(0.0, 0.494, 0.478);
    p.rect(MARGIN_X, topY, CONTENT_WIDTH, headerH, 'f');

    p.fillColor(1, 1, 1);
    p.text('NO', MARGIN_X + 8, topY + 13, 'F2', 8.5);
    p.text('Banco', MARGIN_X + 42, topY + 13, 'F2', 8.5);
    p.text('Nº de Série', MARGIN_X + 95, topY + 13, 'F2', 8.5);
    p.text('Tensão (V)', MARGIN_X + 205, topY + 13, 'F2', 8.5);
    p.text('Status Tensão', MARGIN_X + 270, topY + 13, 'F2', 8.5);
    p.text('Resist. (mOhm)', MARGIN_X + 350, topY + 13, 'F2', 8.5);
    p.text('Status Resist.', MARGIN_X + 425, topY + 13, 'F2', 8.5);
    p.text('Status Geral', MARGIN_X + 495, topY + 13, 'F2', 8.5);
    return topY + headerH;
  };

  curY = drawTableHeader(page, curY);

  const rowH = 18;
  const maxPageBottom = PAGE_HEIGHT - 55;

  act.measurements.forEach((m, idx) => {
    if (curY + rowH > maxPageBottom) {
      page = new PdfPageCanvas();
      pages.push(page);
      drawMainHeader(page);
      curY = 100;
      page.fillColor(0.0, 0.494, 0.478);
      page.text('2. MEDIÇÕES INDIVIDUAIS DAS BATERIAS (CONTINUAÇÃO)', MARGIN_X, curY, 'F2', 10);
      curY += 8;
      curY = drawTableHeader(page, curY);
    }

    // Fundo zebrado
    if (idx % 2 === 1) {
      page.fillColor(0.973, 0.980, 0.988);
    } else {
      page.fillColor(1, 1, 1);
    }
    page.rect(MARGIN_X, curY, CONTENT_WIDTH, rowH, 'f');

    // Linha divisória inferior
    page.strokeColor(0.925, 0.941, 0.961);
    page.lineWidth(0.5);
    page.line(MARGIN_X, curY + rowH, MARGIN_X + CONTENT_WIDTH, curY + rowH);

    const noStr = m.battery ? String(m.battery.sequenceNumber) : '-';
    const bankStr = m.battery ? `Banco ${m.battery.bankNumber}` : '-';
    const serialStr = truncateText(
      m.batterySerialNumber || (m.battery ? m.battery.serialNumber : '-') || '-',
      18
    );

    const overallSt = parseStatus(m.overallStatus);
    const voltSt = m.voltageStatus ? parseStatus(m.voltageStatus) : overallSt;
    const resSt = m.resistanceStatus ? parseStatus(m.resistanceStatus) : overallSt;

    const textY = curY + 12.5;
    page.fillColor(0.059, 0.090, 0.165);
    page.text(noStr, MARGIN_X + 8, textY, 'F2', 8.5);
    page.text(bankStr, MARGIN_X + 42, textY, 'F1', 8.5);
    page.text(serialStr, MARGIN_X + 95, textY, 'F1', 8.5);
    page.text(`${m.voltage.toFixed(2)} V`, MARGIN_X + 205, textY, 'F1', 8.5);

    const vRgb = getStatusRgb(voltSt);
    page.fillColor(vRgb[0], vRgb[1], vRgb[2]);
    page.text(voltSt, MARGIN_X + 270, textY, 'F2', 8);

    page.fillColor(0.059, 0.090, 0.165);
    page.text(m.resistance.toFixed(2), MARGIN_X + 350, textY, 'F1', 8.5);

    const rRgb = getStatusRgb(resSt);
    page.fillColor(rRgb[0], rRgb[1], rRgb[2]);
    page.text(resSt, MARGIN_X + 425, textY, 'F2', 8);

    const oRgb = getStatusRgb(overallSt);
    page.fillColor(oRgb[0], oRgb[1], oRgb[2]);
    page.text(overallSt, MARGIN_X + 495, textY, 'F2', 8);

    curY += rowH;
  });

  // ── Seção 3: Dados das Baterias do Local (Baterias_CSAT) ────────────────
  const localBatteries: Battery[] =
    act.locationBatteries && act.locationBatteries.length > 0
      ? act.locationBatteries
      : act.measurements
        .map((m) => m.battery)
        .filter((b): b is Battery => b !== undefined);

  if (localBatteries.length > 0) {
    if (curY + 55 > maxPageBottom) {
      page = new PdfPageCanvas();
      pages.push(page);
      drawMainHeader(page);
      curY = 100;
    } else {
      curY += 18;
    }

    page.fillColor(0.0, 0.494, 0.478);
    page.text('3. DADOS DAS BATERIAS DO LOCAL', MARGIN_X, curY, 'F2', 10.5);
    curY += 8;

    const drawBatteriesTableHeader = (p: PdfPageCanvas, topY: number): number => {
      const headerH = 20;
      p.fillColor(0.0, 0.494, 0.478);
      p.rect(MARGIN_X, topY, CONTENT_WIDTH, headerH, 'f');

      p.fillColor(1, 1, 1);
      p.text('NO', MARGIN_X + 8, topY + 13, 'F2', 8.5);
      p.text('Banco', MARGIN_X + 42, topY + 13, 'F2', 8.5);
      p.text('Nº de Série', MARGIN_X + 95, topY + 13, 'F2', 8.5);
      p.text('Fabricante', MARGIN_X + 215, topY + 13, 'F2', 8.5);
      p.text('Modelo', MARGIN_X + 315, topY + 13, 'F2', 8.5);
      p.text('Data Fabricação', MARGIN_X + 405, topY + 13, 'F2', 8.5);
      p.text('Status', MARGIN_X + 490, topY + 13, 'F2', 8.5);
      return topY + headerH;
    };

    curY = drawBatteriesTableHeader(page, curY);

    localBatteries.forEach((bat, idx) => {
      if (curY + rowH > maxPageBottom) {
        page = new PdfPageCanvas();
        pages.push(page);
        drawMainHeader(page);
        curY = 100;
        page.fillColor(0.0, 0.494, 0.478);
        page.text(
          '3. DADOS DAS BATERIAS DO LOCAL — CONTINUAÇÃO',
          MARGIN_X,
          curY,
          'F2',
          10
        );
        curY += 8;
        curY = drawBatteriesTableHeader(page, curY);
      }

      if (idx % 2 === 1) {
        page.fillColor(0.973, 0.980, 0.988);
      } else {
        page.fillColor(1, 1, 1);
      }
      page.rect(MARGIN_X, curY, CONTENT_WIDTH, rowH, 'f');

      page.strokeColor(0.925, 0.941, 0.961);
      page.lineWidth(0.5);
      page.line(MARGIN_X, curY + rowH, MARGIN_X + CONTENT_WIDTH, curY + rowH);

      const textY = curY + 12.5;
      page.fillColor(0.059, 0.090, 0.165);
      page.text(String(bat.sequenceNumber), MARGIN_X + 8, textY, 'F2', 8.5);
      page.text(`Banco ${bat.bankNumber}`, MARGIN_X + 42, textY, 'F1', 8.5);
      page.text(truncateText(bat.serialNumber || '-', 20), MARGIN_X + 95, textY, 'F1', 8.5);
      page.text(truncateText(bat.manufacturer || '-', 16), MARGIN_X + 215, textY, 'F1', 8.5);
      page.text(truncateText(bat.model || '-', 14), MARGIN_X + 315, textY, 'F1', 8.5);
      page.text(
        bat.manufactureDate ? formatDate(bat.manufactureDate) : '-',
        MARGIN_X + 405,
        textY,
        'F1',
        8.5
      );

      const isActive = (bat.status || 'Ativa').toLowerCase() === 'ativa';
      if (isActive) {
        page.fillColor(0.086, 0.639, 0.290);
      } else {
        page.fillColor(0.392, 0.455, 0.545);
      }
      page.text(bat.status || 'Ativa', MARGIN_X + 490, textY, 'F2', 8);

      curY += rowH;
    });
  }

  // ── Seção 4: Observações e Integridade (se houver) ──────────────────────
  const notes: Array<{ label: string; text: string }> = [];
  if (act.generalObservations) {
    notes.push({ label: 'Observações Gerais:', text: act.generalObservations });
  }
  if (act.integrityAnomalies) {
    notes.push({ label: 'Anomalias de Integridade:', text: act.integrityAnomalies });
  }
  if (act.integritySolutions) {
    notes.push({ label: 'Soluções Adotadas:', text: act.integritySolutions });
  }
  if (act.justificationLackOfInfo) {
    notes.push({ label: 'Justificativa (Falta de Info):', text: act.justificationLackOfInfo });
  }
  if (act.justificationNoContactMCM) {
    notes.push({ label: 'Justificativa (Sem Contato MCM):', text: act.justificationNoContactMCM });
  }

  if (notes.length > 0) {
    if (curY + 60 > maxPageBottom) {
      page = new PdfPageCanvas();
      pages.push(page);
      drawMainHeader(page);
      curY = 100;
    } else {
      curY += 18;
    }

    const obsSectionNum = localBatteries.length > 0 ? 4 : 3;
    page.fillColor(0.0, 0.494, 0.478);
    page.text(`${obsSectionNum}. OBSERVAÇÕES E OCORRÊNCIAS`, MARGIN_X, curY, 'F2', 10.5);
    curY += 14;

    for (const note of notes) {
      if (curY + 28 > maxPageBottom) {
        page = new PdfPageCanvas();
        pages.push(page);
        drawMainHeader(page);
        curY = 100;
      }
      page.fillColor(0.392, 0.455, 0.545);
      page.text(note.label, MARGIN_X, curY, 'F2', 8.5);
      curY += 12;

      const wrapped = wrapText(note.text, 92);
      page.fillColor(0.059, 0.090, 0.165);
      for (const line of wrapped) {
        if (curY + 14 > maxPageBottom) {
          page = new PdfPageCanvas();
          pages.push(page);
          drawMainHeader(page);
          curY = 100;
        }
        page.text(line, MARGIN_X + 8, curY, 'F1', 8.5);
        curY += 12;
      }
      curY += 4;
    }
  }

  // ── Rodapé em todas as páginas ──────────────────────────────────────────
  const totalPages = pages.length;
  pages.forEach((p, idx) => {
    const footerY = PAGE_HEIGHT - 28;
    p.strokeColor(0.886, 0.910, 0.941);
    p.lineWidth(0.6);
    p.line(MARGIN_X, footerY - 10, MARGIN_X + CONTENT_WIDTH, footerY - 10);

    p.fillColor(0.580, 0.639, 0.722);
    p.text(
      'Plataforma Operacional — Manutenção Preventiva de Baterias (PRO-001107)',
      MARGIN_X,
      footerY,
      'F1',
      8
    );
    p.text(`Página ${idx + 1} de ${totalPages}`, PAGE_WIDTH - MARGIN_X - 55, footerY, 'F1', 8);
  });

  // ── Montagem da estrutura de objetos PDF 1.4 ────────────────────────────
  // Obj 1: Catalog
  // Obj 2: Pages
  // Obj 3: Font F1 (Helvetica)
  // Obj 4: Font F2 (Helvetica-Bold)
  // Obj 5..(4 + 2*N): Para cada página: Page object + Content stream object
  const objects: string[] = [];

  const pageObjIds: number[] = [];
  for (let i = 0; i < pages.length; i++) {
    pageObjIds.push(5 + i * 2);
  }

  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  objects.push(
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>\nendobj`
  );
  objects.push(
    '3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj'
  );
  objects.push(
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj'
  );

  for (let i = 0; i < pages.length; i++) {
    const pageObjId = 5 + i * 2;
    const contentObjId = pageObjId + 1;
    const streamData = pages[i].toStreamContent();

    objects.push(
      `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj`
    );
    objects.push(
      `${contentObjId} 0 obj\n<< /Length ${streamData.length} >>\nstream\n${streamData}\nendstream\nendobj`
    );
  }

  // Serializar com cálculo exato de offsets
  let pdfText = '%PDF-1.4\n';
  const offsets: number[] = [0]; // índice 0 é o objeto livre 0

  for (const objStr of objects) {
    offsets.push(pdfText.length);
    pdfText += objStr + '\n';
  }

  const xrefStart = pdfText.length;
  const totalObjs = objects.length + 1;
  pdfText += `xref\n0 ${totalObjs}\n`;
  pdfText += '0000000000 65535 f \n';

  for (let i = 1; i < totalObjs; i++) {
    const offStr = ('0000000000' + offsets[i]).slice(-10);
    pdfText += `${offStr} 00000 n \n`;
  }

  pdfText += `trailer\n<< /Size ${totalObjs} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  const bytes = new Uint8Array(pdfText.length);
  for (let i = 0; i < pdfText.length; i++) {
    bytes[i] = pdfText.charCodeAt(i) & 0xff;
  }
  return bytes;
}

/**
 * Gera e dispara o download imediato do arquivo PDF da atividade no navegador.
 */
export function downloadActivityPdf(act: IActivityPdfData): void {
  const bytes = generateActivityPdfBytes(act);
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const safeLocal = (act.localKm || act.resolvedLocationType || 'Local')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeDate = formatDate(act.activityDate).replace(/\//g, '-');
  const fileName = `Relatorio_Baterias_${safeLocal}_${safeDate}.pdf`;

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

