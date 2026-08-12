import { ArrowLeft, Battery, ClipboardList, Layers, Activity, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  locations, banks,
  getLocationBatteries, getLocationInspections, getLocationVoltageTrend,
  statusColor, statusBg, statusLabel, formatDate, BatteryStatus
} from "../../data/batteryData";

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(15,23,42,0.06)", ...style }}>
      {children}
    </div>
  );
}

function KPI({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ComponentType<{ size?: number; color?: string }>; color: string }) {
  return (
    <Card style={{ flex: 1 }}>
      <div style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
          <div style={{ padding: 7, borderRadius: 8, backgroundColor: `${color}14` }}>
            <Icon size={15} color={color} />
          </div>
        </div>
        <p style={{ fontSize: "1.625rem", fontWeight: 700, color: "#0F172A", lineHeight: 1 }}>{value}</p>
      </div>
    </Card>
  );
}

function ChartTip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor: "#1E293B", borderRadius: 8, padding: "8px 12px", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
      <p style={{ fontSize: "0.7rem", color: "#94A3B8", marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ fontSize: "0.8125rem", fontWeight: 600, color: p.color ?? "#fff" }}>{p.value}{unit}</p>
      ))}
    </div>
  );
}

export function LocationDashboard({ locationId, onBack, onSelectBattery }: {
  locationId: string; onBack: () => void; onSelectBattery: (id: string) => void;
}) {
  const loc = locations.find((l) => l.id === locationId);
  if (!loc) return null;

  const locBanks = banks.filter((b) => b.locationId === locationId);
  const locBatteries = getLocationBatteries(locationId);
  const locInspections = getLocationInspections(locationId).slice(0, 20);
  const voltageTrend = getLocationVoltageTrend(locationId);

  const criticalBats = locBatteries.filter((b) => b.status === "critical");
  const attentionBats = locBatteries.filter((b) => b.status === "attention");
  const excellentCount = locBatteries.filter((b) => b.status === "excellent").length;
  const avgHealth = Math.round((excellentCount / locBatteries.length) * 100);

  const tickStyle = { fontSize: 11, fill: "#94A3B8" };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#F8FAFC", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header style={{ backgroundColor: "#fff", borderBottom: "1px solid #E2E8F0", padding: "0 24px", height: 60, display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
        <button
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", border: "1px solid #E2E8F0", borderRadius: 8, backgroundColor: "#fff", color: "#475569", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 500 }}
        >
          <ArrowLeft size={15} /> Voltar
        </button>
        <div style={{ width: 1, height: 24, backgroundColor: "#E2E8F0" }} />
        <div>
          <h1 style={{ fontSize: "1rem", fontWeight: 700, color: "#0F172A", lineHeight: 1.2 }}>Dashboard do Local</h1>
          <p style={{ fontSize: "0.7rem", color: "#94A3B8" }}>{loc.name} · {loc.km} · Supervisão {loc.supervision}</p>
        </div>
      </header>

      <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
        {/* Map placeholder */}
        <Card style={{ marginBottom: 20, overflow: "hidden" }}>
          <div style={{ height: 180, background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, opacity: 0.06 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ position: "absolute", left: `${(i * 14) % 100}%`, top: 0, bottom: 0, width: 1, backgroundColor: "#2563EB" }} />
              ))}
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ position: "absolute", top: `${i * 20}%`, left: 0, right: 0, height: 1, backgroundColor: "#2563EB" }} />
              ))}
            </div>
            {/* Track line */}
            <div style={{ position: "absolute", top: "50%", left: 48, right: 48, height: 4, backgroundColor: "#2563EB", borderRadius: 2, transform: "translateY(-50%)" }} />
            {/* Station marker */}
            <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "#2563EB", border: "4px solid #fff", boxShadow: "0 4px 16px rgba(37,99,235,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "1rem" }}>🏭</span>
              </div>
              <div style={{ backgroundColor: "#1E293B", color: "#fff", padding: "4px 12px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 600, whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
                {loc.name} · {loc.km}
              </div>
            </div>
            <div style={{ position: "absolute", bottom: 12, right: 16, fontSize: "0.68rem", color: "#94A3B8" }}>Mapa de instalação (placeholder)</div>
          </div>
        </Card>

        {/* KPIs */}
        <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
          <KPI label="Bancos"          value={locBanks.length}           icon={Layers}      color="#2563EB" />
          <KPI label="Baterias"        value={locBatteries.length}        icon={Battery}     color="#2563EB" />
          <KPI label="Inspeções"       value={getLocationInspections(locationId).length} icon={ClipboardList} color="#8B5CF6" />
          <KPI label="Saúde Média"     value={`${avgHealth}%`}           icon={Activity}    color="#22C55E" />
          <KPI label="Em Atenção"      value={attentionBats.length}       icon={AlertCircle} color="#F97316" />
          <KPI label="Críticas"        value={criticalBats.length}        icon={AlertCircle} color="#DC2626" />
        </div>

        {/* Charts */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <Card>
            <div style={{ padding: "18px 20px 12px" }}>
              <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "#0F172A" }}>Linha Temporal — Tensão</p>
              <p style={{ fontSize: "0.72rem", color: "#94A3B8", marginTop: 2 }}>Tensão média das baterias do local</p>
            </div>
            <div style={{ padding: "0 12px 16px" }}>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={voltageTrend} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="date" tick={tickStyle} tickLine={false} axisLine={false} tickFormatter={(v) => v.slice(5)} interval={3} />
                  <YAxis tick={tickStyle} tickLine={false} axisLine={false} domain={["auto", "auto"]} unit="V" />
                  <Tooltip content={<ChartTip unit=" V" />} />
                  <Line type="monotone" dataKey="voltage" stroke="#2563EB" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card>
            <div style={{ padding: "18px 20px 12px" }}>
              <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "#0F172A" }}>Baterias por Status</p>
              <p style={{ fontSize: "0.72rem", color: "#94A3B8", marginTop: 2 }}>Distribuição de saúde por banco</p>
            </div>
            <div style={{ padding: "16px 20px" }}>
              {locBanks.map((bk) => {
                const bkBats = locBatteries.filter((b) => b.bankId === bk.id);
                const okPct = Math.round((bkBats.filter((b) => b.status === "excellent").length / bkBats.length) * 100);
                const warnPct = Math.round((bkBats.filter((b) => b.status === "attention").length / bkBats.length) * 100);
                const critPct = 100 - okPct - warnPct;
                return (
                  <div key={bk.id} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#0F172A" }}>{bk.name}</p>
                      <p style={{ fontSize: "0.72rem", color: "#94A3B8" }}>{bkBats.length} baterias</p>
                    </div>
                    <div style={{ display: "flex", height: 10, borderRadius: 6, overflow: "hidden", gap: 2 }}>
                      <div style={{ width: `${okPct}%`, backgroundColor: "#22C55E", transition: "width 0.4s" }} />
                      <div style={{ width: `${warnPct}%`, backgroundColor: "#F97316", transition: "width 0.4s" }} />
                      <div style={{ width: `${critPct}%`, backgroundColor: "#DC2626", transition: "width 0.4s" }} />
                    </div>
                    <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                      <span style={{ fontSize: "0.65rem", color: "#22C55E" }}>●&nbsp;{okPct}% OK</span>
                      <span style={{ fontSize: "0.65rem", color: "#F97316" }}>●&nbsp;{warnPct}% Atenção</span>
                      {critPct > 0 && <span style={{ fontSize: "0.65rem", color: "#DC2626" }}>●&nbsp;{critPct}% Crítico</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Bottom: Critical batteries + Last inspections */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
          {/* Critical list */}
          <Card>
            <div style={{ padding: "18px 20px 12px", borderBottom: "1px solid #F1F5F9" }}>
              <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "#0F172A" }}>Baterias Críticas</p>
              <p style={{ fontSize: "0.72rem", color: "#94A3B8", marginTop: 2 }}>{criticalBats.length + attentionBats.length} precisam de atenção</p>
            </div>
            <div style={{ padding: "12px 0", maxHeight: 340, overflowY: "auto" }}>
              {[...criticalBats, ...attentionBats].map((bat) => {
                const sc = statusColor(bat.status);
                const sb = statusBg(bat.status);
                const bk = banks.find((b) => b.id === bat.bankId);
                return (
                  <div
                    key={bat.id}
                    onClick={() => onSelectBattery(bat.id)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", cursor: "pointer", transition: "background 0.1s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: sb, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: sc }}>
                        {bat.sequence.toString().padStart(2, "0")}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#0F172A" }}>{bk?.name} · Bat {bat.sequence.toString().padStart(2, "0")}</p>
                      <p style={{ fontSize: "0.72rem", color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bat.serialNumber}</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: sc }}>{bat.lastVoltage}V</p>
                      <p style={{ fontSize: "0.68rem", color: "#94A3B8" }}>{bat.lastResistance}mΩ</p>
                    </div>
                  </div>
                );
              })}
              {criticalBats.length + attentionBats.length === 0 && (
                <div style={{ padding: "32px 20px", textAlign: "center" }}>
                  <p style={{ fontSize: "0.875rem", color: "#22C55E", fontWeight: 600 }}>✓ Todas as baterias estão OK</p>
                </div>
              )}
            </div>
          </Card>

          {/* Last inspections table */}
          <Card>
            <div style={{ padding: "18px 20px 12px", borderBottom: "1px solid #F1F5F9" }}>
              <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "#0F172A" }}>Últimas Inspeções</p>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#F8FAFC" }}>
                    {["Data", "Banco", "Bateria", "Tensão", "Resist.", "Status", "Supervisor"].map((h) => (
                      <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748B", borderBottom: "1px solid #E2E8F0" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {locInspections.map((ins) => {
                    const bk = banks.find((b) => b.id === ins.bankId);
                    const bat = getLocationBatteries(locationId).find((b) => b.id === ins.batteryId);
                    const sc = statusColor(ins.status);
                    const sb = statusBg(ins.status);
                    return (
                      <tr key={ins.id} style={{ borderBottom: "1px solid #F8FAFC" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <td style={{ padding: "10px 14px", fontSize: "0.8rem", color: "#475569", whiteSpace: "nowrap" }}>{formatDate(ins.date)}</td>
                        <td style={{ padding: "10px 14px", fontSize: "0.8rem", color: "#475569" }}>{bk?.name}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <button
                            onClick={() => onSelectBattery(ins.batteryId)}
                            style={{ fontSize: "0.8rem", color: "#2563EB", fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                          >
                            BAT-{bat?.sequence.toString().padStart(2, "0")}
                          </button>
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: "0.8rem", fontWeight: 600, color: "#0F172A" }}>{ins.voltage}V</td>
                        <td style={{ padding: "10px 14px", fontSize: "0.8rem", fontWeight: 600, color: "#0F172A" }}>{ins.resistance}mΩ</td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 12, fontSize: "0.68rem", fontWeight: 600, backgroundColor: sb, color: sc }}>
                            <span style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: sc }} />
                            {statusLabel(ins.status)}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: "0.78rem", color: "#64748B", whiteSpace: "nowrap" }}>
                          {ins.supervisor.replace("Eng. ", "")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
