export type BatteryStatus = "excellent" | "attention" | "critical";

export interface Location {
  id: string;
  name: string;
  km: string;
  supervision: string;
  bankCount: number;
}

export interface Bank {
  id: string;
  locationId: string;
  name: string;
  manufacturer: string;
  model: string;
  batteryCount: number;
}

export interface Battery {
  id: string;
  bankId: string;
  locationId: string;
  serialNumber: string;
  model: string;
  manufacturer: string;
  sequence: number;
  manufactureDate: string;
  status: BatteryStatus;
  lastVoltage: number;
  lastResistance: number;
  lastCurrent: number;
  lastInspection: string;
}

export interface Inspection {
  id: string;
  date: string;
  locationId: string;
  bankId: string;
  batteryId: string;
  serialNumber: string;
  voltage: number;
  resistance: number;
  current: number;
  status: BatteryStatus;
  supervisor: string;
}

export interface HistoryPoint {
  date: string;
  voltage: number;
  resistance: number;
  current: number;
}

// ─── LOCATIONS ─────────────────────────────────────────────────────────────

export const locations: Location[] = [
  { id: "LOC-001", name: "Pátio Jabaquara",    km: "KM 0+000",  supervision: "Norte", bankCount: 3 },
  { id: "LOC-002", name: "Estação Conceição",  km: "KM 8+500",  supervision: "Norte", bankCount: 2 },
  { id: "LOC-003", name: "Estação Jabaquara",  km: "KM 15+200", supervision: "Sul",   bankCount: 2 },
  { id: "LOC-004", name: "Pátio Santos",       km: "KM 28+600", supervision: "Sul",   bankCount: 3 },
  { id: "LOC-005", name: "Estação Guarujá",    km: "KM 42+800", supervision: "Sul",   bankCount: 2 },
];

// ─── BANKS ──────────────────────────────────────────────────────────────────

export const banks: Bank[] = [
  { id: "BANK-001A", locationId: "LOC-001", name: "Banco A", manufacturer: "Fiamm",   model: "FG21202",  batteryCount: 12 },
  { id: "BANK-001B", locationId: "LOC-001", name: "Banco B", manufacturer: "Fiamm",   model: "FG21202",  batteryCount: 12 },
  { id: "BANK-001C", locationId: "LOC-001", name: "Banco C", manufacturer: "Yuasa",   model: "NP17-12I", batteryCount: 12 },
  { id: "BANK-002A", locationId: "LOC-002", name: "Banco A", manufacturer: "Yuasa",   model: "NP17-12I", batteryCount: 12 },
  { id: "BANK-002B", locationId: "LOC-002", name: "Banco B", manufacturer: "Moura",   model: "12MF105",  batteryCount: 12 },
  { id: "BANK-003A", locationId: "LOC-003", name: "Banco A", manufacturer: "Moura",   model: "12MF105",  batteryCount: 12 },
  { id: "BANK-003B", locationId: "LOC-003", name: "Banco B", manufacturer: "Fiamm",   model: "FG21202",  batteryCount: 12 },
  { id: "BANK-004A", locationId: "LOC-004", name: "Banco A", manufacturer: "CSB",     model: "GP12170",  batteryCount: 12 },
  { id: "BANK-004B", locationId: "LOC-004", name: "Banco B", manufacturer: "CSB",     model: "GP12170",  batteryCount: 12 },
  { id: "BANK-004C", locationId: "LOC-004", name: "Banco C", manufacturer: "Yuasa",   model: "NP17-12I", batteryCount: 12 },
  { id: "BANK-005A", locationId: "LOC-005", name: "Banco A", manufacturer: "Fiamm",   model: "FG21202",  batteryCount: 12 },
  { id: "BANK-005B", locationId: "LOC-005", name: "Banco B", manufacturer: "Moura",   model: "12MF105",  batteryCount: 12 },
];

// ─── BATTERY GENERATOR ──────────────────────────────────────────────────────

function genVoltage(status: BatteryStatus): number {
  if (status === "excellent") return +(12.4 + Math.random() * 0.4).toFixed(2);
  if (status === "attention") return +(11.8 + Math.random() * 0.5).toFixed(2);
  return +(10.5 + Math.random() * 0.8).toFixed(2);
}

function genResistance(status: BatteryStatus): number {
  if (status === "excellent") return +(3 + Math.random() * 4).toFixed(1);
  if (status === "attention") return +(8 + Math.random() * 6).toFixed(1);
  return +(16 + Math.random() * 10).toFixed(1);
}

function pickStatus(idx: number, bankSeed: number): BatteryStatus {
  const roll = (idx * 7 + bankSeed * 13) % 20;
  if (roll <= 1) return "critical";
  if (roll <= 4) return "attention";
  return "excellent";
}

function inspectionDate(daysAgo: number): string {
  const d = new Date("2026-07-16");
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

const supervisors = ["Eng. Marcos Ferreira", "Eng. Ana Lima", "Eng. Carlos Souza", "Eng. Renata Castro", "Eng. Diego Santos"];

const batteries: Battery[] = [];
const inspections: Inspection[] = [];
let inspCounter = 1;

banks.forEach((bank, bankIdx) => {
  const loc = locations.find((l) => l.id === bank.locationId)!;
  for (let seq = 1; seq <= bank.batteryCount; seq++) {
    const status = pickStatus(seq, bankIdx);
    const voltage = genVoltage(status);
    const resistance = genResistance(status);
    const current = +(1.2 + Math.random() * 0.8).toFixed(2);
    const mfYear = 2020 + (bankIdx % 4);
    const mfMonth = String(1 + (seq % 12)).padStart(2, "0");
    const batId = `BAT-${bank.id}-${String(seq).padStart(2, "0")}`;

    batteries.push({
      id: batId,
      bankId: bank.id,
      locationId: bank.locationId,
      serialNumber: `SN${bank.id.replace(/-/g, "")}${String(seq).padStart(3, "0")}`,
      model: bank.model,
      manufacturer: bank.manufacturer,
      sequence: seq,
      manufactureDate: `${mfYear}-${mfMonth}-01`,
      status,
      lastVoltage: voltage,
      lastResistance: resistance,
      lastCurrent: current,
      lastInspection: inspectionDate(seq % 7 + 1),
    });

    // generate 6 inspections per battery
    for (let i = 0; i < 6; i++) {
      const daysAgo = i * 30 + (seq % 7);
      const iStatus: BatteryStatus = i === 0 ? status : pickStatus(seq + i, bankIdx + i);
      inspections.push({
        id: `INS-${String(inspCounter++).padStart(5, "0")}`,
        date: inspectionDate(daysAgo),
        locationId: bank.locationId,
        bankId: bank.id,
        batteryId: batId,
        serialNumber: `SN${bank.id.replace(/-/g, "")}${String(seq).padStart(3, "0")}`,
        voltage: i === 0 ? voltage : genVoltage(iStatus),
        resistance: i === 0 ? resistance : genResistance(iStatus),
        current: i === 0 ? current : +(1.2 + Math.random() * 0.8).toFixed(2),
        status: iStatus,
        supervisor: supervisors[(seq + bankIdx + i) % supervisors.length],
      });
    }
  }
});

// Sort inspections by date desc
inspections.sort((a, b) => b.date.localeCompare(a.date));

export { batteries, inspections };

// ─── DERIVED / AGGREGATED ───────────────────────────────────────────────────

export function getKPIs() {
  const totalLocations = locations.length;
  const totalBatteries = batteries.length;
  const totalInspections = inspections.length;
  const alertBatteries = batteries.filter((b) => b.status === "attention").length;
  const criticalBatteries = batteries.filter((b) => b.status === "critical").length;
  const excellentCount = batteries.filter((b) => b.status === "excellent").length;
  const avgHealth = Math.round((excellentCount / totalBatteries) * 100);
  return { totalLocations, totalBatteries, totalInspections, alertBatteries, criticalBatteries, avgHealth };
}

export function getVoltageTrend(): { date: string; voltage: number }[] {
  const points: Record<string, { sum: number; count: number }> = {};
  inspections.forEach((ins) => {
    if (!points[ins.date]) points[ins.date] = { sum: 0, count: 0 };
    points[ins.date].sum += ins.voltage;
    points[ins.date].count += 1;
  });
  return Object.entries(points)
    .map(([date, { sum, count }]) => ({ date, voltage: +(sum / count).toFixed(2) }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);
}

export function getResistanceTrend(): { date: string; resistance: number }[] {
  const points: Record<string, { sum: number; count: number }> = {};
  inspections.forEach((ins) => {
    if (!points[ins.date]) points[ins.date] = { sum: 0, count: 0 };
    points[ins.date].sum += ins.resistance;
    points[ins.date].count += 1;
  });
  return Object.entries(points)
    .map(([date, { sum, count }]) => ({ date, resistance: +(sum / count).toFixed(1) }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);
}

export function getTop10ByResistance(): { id: string; label: string; resistance: number; status: BatteryStatus }[] {
  return [...batteries]
    .sort((a, b) => b.lastResistance - a.lastResistance)
    .slice(0, 10)
    .map((b) => ({
      id: b.id,
      label: `BAT-${b.sequence.toString().padStart(2, "0")} / ${banks.find((bk) => bk.id === b.bankId)?.name ?? b.bankId}`,
      resistance: b.lastResistance,
      status: b.status,
    }));
}

export function getStatusDistribution() {
  const excellent = batteries.filter((b) => b.status === "excellent").length;
  const attention = batteries.filter((b) => b.status === "attention").length;
  const critical = batteries.filter((b) => b.status === "critical").length;
  return [
    { name: "Excelente", value: excellent, color: "#22C55E" },
    { name: "Atenção",   value: attention, color: "#F97316" },
    { name: "Crítico",   value: critical,  color: "#DC2626" },
  ];
}

export function getBatteriesForBank(bankId: string): Battery[] {
  return batteries.filter((b) => b.bankId === bankId);
}

export function getBattery(batteryId: string): Battery | undefined {
  return batteries.find((b) => b.id === batteryId);
}

export function getBatteryHistory(batteryId: string): HistoryPoint[] {
  return inspections
    .filter((i) => i.batteryId === batteryId)
    .map((i) => ({ date: i.date, voltage: i.voltage, resistance: i.resistance, current: i.current }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getBatteryInspections(batteryId: string): Inspection[] {
  return inspections.filter((i) => i.batteryId === batteryId).sort((a, b) => b.date.localeCompare(a.date));
}

export function getLocationBatteries(locationId: string): Battery[] {
  return batteries.filter((b) => b.locationId === locationId);
}

export function getLocationInspections(locationId: string): Inspection[] {
  return inspections.filter((i) => i.locationId === locationId).sort((a, b) => b.date.localeCompare(a.date));
}

export function getLocationVoltageTrend(locationId: string): { date: string; voltage: number }[] {
  const locInsp = inspections.filter((i) => i.locationId === locationId);
  const points: Record<string, { sum: number; count: number }> = {};
  locInsp.forEach((ins) => {
    if (!points[ins.date]) points[ins.date] = { sum: 0, count: 0 };
    points[ins.date].sum += ins.voltage;
    points[ins.date].count += 1;
  });
  return Object.entries(points)
    .map(([date, { sum, count }]) => ({ date, voltage: +(sum / count).toFixed(2) }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-20);
}

export function statusLabel(s: BatteryStatus): string {
  if (s === "excellent") return "Excelente";
  if (s === "attention") return "Atenção";
  return "Crítico";
}

export function statusColor(s: BatteryStatus): string {
  if (s === "excellent") return "#22C55E";
  if (s === "attention") return "#F97316";
  return "#DC2626";
}

export function statusBg(s: BatteryStatus): string {
  if (s === "excellent") return "#F0FDF4";
  if (s === "attention") return "#FFF7ED";
  return "#FEF2F2";
}

export function formatDate(d: string): string {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

export const manufacturers = [...new Set(banks.map((b) => b.manufacturer))];
export const models = [...new Set(banks.map((b) => b.model))];
