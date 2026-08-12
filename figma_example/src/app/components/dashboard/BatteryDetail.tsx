import { ArrowLeft, Battery, MapPin, Calendar, Hash, Cpu, Zap, Activity, Clock } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import {
  getBattery, getBatteryHistory, getBatteryInspections,
  banks, locations, statusColor, statusBg, statusLabel, formatDate,
  BatteryStatus
} from "../../data/batteryData";

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      backgroundColor: "#fff", borderRadius: 12,
      border: "1px solid #E2E8F0",
      boxShadow: "0 1px 4px rgba(15,23,42,0.06)",
      ...style
    }}>
      {children}
    </div>
  );
}

function StatCard({ label, value, unit, icon: Icon, color }: {
  label: string; value: string | number; unit?: string;
  icon: React.ComponentType<{ size?: number; color?: string }>; color: string;
}) {
  return (
    <Card>
      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
          <div style={{ padding: 8, borderRadius: 8, backgroundColor: `${color}14` }}>
            <Icon size={16} color={color} />
          </div>
        </div>
        <p style={{ fontSize: "1.625rem", fontWeight: 700, color: "#0F172A", lineHeight: 1 }}>
          {value}<span style={{ fontSize: "0.875rem", color: "#94A3B8", fontWeight: 400, marginLeft: 3 }}>{unit}</span>
        </p>
      </div>
    </Card>
  );
}

function ChartTip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor: "#1E293B", borderRadius: 8, padding: "8px 12px", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
      <p style={{ fontSize: "0.7rem", color: "#94A3B8", marginBottom: 4 }}>{formatDate(label)}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ fontSize: "0.8125rem", fontWeight: 600, color: p.color ?? "#fff" }}>
          {p.value} {unit}
        </p>
      ))}
    </div>
  );
}

function MiniChart({ data, dataKey, color, unit, refValue, label }: {
  data: any[]; dataKey: string; color: string; unit: string; refValue?: number; label: string;
}) {
  const tickStyle = { fontSize: 11, fill: "#94A3B8" };
  return (
    <Card style={{ flex: 1 }}>
      <div style={{ padding: "18px 20px 12px" }}>
        <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0F172A", marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: "0.72rem", color: "#94A3B8" }}>Histórico de inspeções</p>
      </div>
      <div style={{ padding: "0 12px 16px" }}>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="date" tick={tickStyle} tickLine={false} axisLine={false} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={tickStyle} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
            <Tooltip content={<ChartTip unit={unit} />} />
            {refValue && <ReferenceLine y={refValue} stroke={color} strokeDasharray="4 4" strokeOpacity={0.5} />}
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={{ r: 4, fill: color, strokeWidth: 0 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function BatteryDetail({ batteryId, onBack }: { batteryId: string; onBack: () => void }) {
  const bat = getBattery(batteryId);
  if (!bat) return null;

  const bank = banks.find((b) => b.id === bat.bankId)!;
  const loc = locations.find((l) => l.id === bat.locationId)!;
  const history = getBatteryHistory(batteryId);
  const inspections = getBatteryInspections(batteryId);

  const statusC = statusColor(bat.status);
  const statusB = statusBg(bat.status);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#F8FAFC", fontFamily: "'Inter', sans-serif" }}>
      {/* ── Header ── */}
      <header style={{ backgroundColor: "#fff", borderBottom: "1px solid #E2E8F0", padding: "0 24px", height: 60, display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
        <button
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", border: "1px solid #E2E8F0", borderRadius: 8, backgroundColor: "#fff", color: "#475569", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 500 }}
        >
          <ArrowLeft size={15} /> Voltar
        </button>
        <div style={{ width: 1, height: 24, backgroundColor: "#E2E8F0" }} />
        <div>
          <h1 style={{ fontSize: "1rem", fontWeight: 700, color: "#0F172A", lineHeight: 1.2 }}>
            Bateria {bat.sequence.toString().padStart(2, "0")} — {bank.name}
          </h1>
          <p style={{ fontSize: "0.7rem", color: "#94A3B8" }}>{loc.name} · {loc.km}</p>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 14px", borderRadius: 20,
            fontSize: "0.8rem", fontWeight: 600,
            backgroundColor: statusB, color: statusC,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: statusC }} />
            {statusLabel(bat.status)}
          </span>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
          {/* ── Left column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
              <StatCard label="Última Tensão"     value={bat.lastVoltage}    unit="V"    icon={Zap}      color="#2563EB" />
              <StatCard label="Última Resistência" value={bat.lastResistance} unit="mΩ"  icon={Activity} color="#F97316" />
              <StatCard label="Última Corrente"   value={bat.lastCurrent}    unit="A"    icon={Battery}  color="#8B5CF6" />
              <StatCard label="Última Inspeção"   value={formatDate(bat.lastInspection)} icon={Clock} color="#22C55E" />
            </div>

            {/* Charts */}
            <div style={{ display: "flex", gap: 14 }}>
              <MiniChart data={history} dataKey="voltage"    color="#2563EB" unit="V"    label="Evolução da Tensão"      refValue={12.0} />
              <MiniChart data={history} dataKey="resistance" color="#F97316" unit="mΩ"   label="Evolução da Resistência" refValue={15.0} />
              <MiniChart data={history} dataKey="current"    color="#8B5CF6" unit="A"    label="Evolução da Corrente" />
            </div>

            {/* Inspection timeline */}
            <Card>
              <div style={{ padding: "18px 24px 12px", borderBottom: "1px solid #F1F5F9" }}>
                <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "#0F172A" }}>Linha do Tempo de Inspeções</p>
              </div>
              <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 0 }}>
                {inspections.map((ins, i) => {
                  const sc = statusColor(ins.status);
                  const sb = statusBg(ins.status);
                  return (
                    <div key={ins.id} style={{ display: "flex", gap: 16, position: "relative" }}>
                      {/* Timeline line */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                        <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: sc, border: `2px solid ${sb}`, boxShadow: `0 0 0 3px ${sc}22`, marginTop: 14, flexShrink: 0 }} />
                        {i < inspections.length - 1 && (
                          <div style={{ width: 2, flex: 1, backgroundColor: "#E2E8F0", margin: "4px 0" }} />
                        )}
                      </div>
                      {/* Content */}
                      <div style={{ paddingBottom: i < inspections.length - 1 ? 20 : 0, paddingTop: 10, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#0F172A" }}>{formatDate(ins.date)}</span>
                          <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: "0.68rem", fontWeight: 600, backgroundColor: sb, color: sc }}>
                            {statusLabel(ins.status)}
                          </span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, backgroundColor: "#F8FAFC", borderRadius: 8, padding: "10px 14px", border: "1px solid #F1F5F9" }}>
                          <div>
                            <p style={{ fontSize: "0.68rem", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tensão</p>
                            <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0F172A" }}>{ins.voltage} V</p>
                          </div>
                          <div>
                            <p style={{ fontSize: "0.68rem", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Resistência</p>
                            <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0F172A" }}>{ins.resistance} mΩ</p>
                          </div>
                          <div>
                            <p style={{ fontSize: "0.68rem", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Supervisor</p>
                            <p style={{ fontSize: "0.78rem", fontWeight: 500, color: "#475569" }}>{ins.supervisor.replace("Eng. ", "")}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* ── Right column: Cadastral info ── */}
          <div style={{ position: "sticky", top: 0 }}>
            <Card>
              <div style={{ padding: "18px 20px", borderBottom: "1px solid #F1F5F9" }}>
                <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "#0F172A" }}>Informações Cadastrais</p>
              </div>
              <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 0 }}>
                {[
                  { icon: Hash,     label: "Nº de Série",      value: bat.serialNumber },
                  { icon: Cpu,      label: "Modelo",           value: bat.model },
                  { icon: Battery,  label: "Fabricante",       value: bat.manufacturer },
                  { icon: MapPin,   label: "Local",            value: loc.name },
                  { icon: MapPin,   label: "KM",               value: loc.km },
                  { icon: Activity, label: "Supervisão",       value: loc.supervision },
                  { icon: Battery,  label: "Banco",            value: bank.name },
                  { icon: Hash,     label: "Sequência",        value: `Posição ${bat.sequence}` },
                  { icon: Calendar, label: "Fabricado em",     value: formatDate(bat.manufactureDate) },
                  { icon: Clock,    label: "Última Inspeção",  value: formatDate(bat.lastInspection) },
                ].map(({ icon: Icon, label, value }, i) => (
                  <div
                    key={label}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 0",
                      borderBottom: i < 9 ? "1px solid #F8FAFC" : "none",
                    }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={14} color="#64748B" />
                    </div>
                    <div>
                      <p style={{ fontSize: "0.68rem", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
                      <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "#0F172A" }}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
