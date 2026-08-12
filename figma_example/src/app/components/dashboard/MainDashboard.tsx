import { useState, useMemo } from "react";
import {
  RefreshCw, Search, MapPin, Battery, ClipboardList,
  AlertTriangle, AlertCircle, Activity, ChevronLeft, ChevronRight,
  ChevronsUpDown, ArrowUp, ArrowDown, SlidersHorizontal, X
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  batteries, inspections, locations, banks,
  getKPIs, getVoltageTrend, getResistanceTrend, getTop10ByResistance,
  getStatusDistribution, getBatteriesForBank,
  statusLabel, statusColor, statusBg, formatDate,
  manufacturers, models, BatteryStatus
} from "../../data/batteryData";

/* ── Shared card shell ─────────────────────────────────────────────────── */
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: "#fff",
        borderRadius: 12,
        border: "1px solid #E2E8F0",
        boxShadow: "0 1px 4px rgba(15,23,42,0.06)",
      }}
    >
      {children}
    </div>
  );
}

/* ── KPI card ──────────────────────────────────────────────────────────── */
function KPICard({ icon: Icon, label, value, sub, color }: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <Card>
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}14` }}>
            <Icon size={18} color={color} />
          </div>
          {sub && <span style={{ fontSize: "0.7rem", color: "#64748B" }}>{sub}</span>}
        </div>
        <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "#0F172A", lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: "0.75rem", color: "#64748B", marginTop: 6 }}>{label}</p>
      </div>
    </Card>
  );
}

/* ── Battery Heatmap cell ──────────────────────────────────────────────── */
function HeatmapCell({ bat, onSelect }: { bat: ReturnType<typeof getBatteriesForBank>[0]; onSelect: (id: string) => void }) {
  const [hovered, setHovered] = useState(false);
  const color = statusColor(bat.status);
  const bank = banks.find((b) => b.id === bat.bankId);
  const loc = locations.find((l) => l.id === bat.locationId);

  return (
    <div className="relative" style={{ display: "inline-block" }}>
      <div
        onClick={() => onSelect(bat.id)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: 36, height: 36, borderRadius: 6,
          backgroundColor: color,
          cursor: "pointer",
          opacity: hovered ? 0.85 : 1,
          transition: "opacity 0.15s, transform 0.15s",
          transform: hovered ? "scale(1.12)" : "scale(1)",
          boxShadow: hovered ? `0 4px 12px ${color}55` : "none",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#fff" }}>{bat.sequence}</span>
      </div>
      {hovered && (
        <div
          style={{
            position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
            transform: "translateX(-50%)", zIndex: 50,
            backgroundColor: "#1E293B", color: "#fff",
            borderRadius: 8, padding: "10px 12px",
            minWidth: 180, pointerEvents: "none",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            fontSize: "0.72rem", lineHeight: 1.6,
          }}
        >
          <p style={{ fontWeight: 700, marginBottom: 4, color: color }}>Bateria {bat.sequence.toString().padStart(2, "0")}</p>
          <p><span style={{ color: "#94A3B8" }}>NS:</span> {bat.serialNumber}</p>
          <p><span style={{ color: "#94A3B8" }}>Local:</span> {loc?.name}</p>
          <p><span style={{ color: "#94A3B8" }}>Banco:</span> {bank?.name}</p>
          <p><span style={{ color: "#94A3B8" }}>Tensão:</span> {bat.lastVoltage} V</p>
          <p><span style={{ color: "#94A3B8" }}>Resist.:</span> {bat.lastResistance} mΩ</p>
          <p><span style={{ color: "#94A3B8" }}>Inspeção:</span> {formatDate(bat.lastInspection)}</p>
          <div style={{ position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "6px solid #1E293B" }} />
        </div>
      )}
    </div>
  );
}

/* ── Inspection table ──────────────────────────────────────────────────── */
type SortKey = "date" | "location" | "bank" | "voltage" | "resistance" | "status";

function InspectionTable({ onSelectBattery }: { onSelectBattery: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return inspections.filter((i) => {
      const loc = locations.find((l) => l.id === i.locationId)?.name ?? "";
      const bk = banks.find((b) => b.id === i.bankId)?.name ?? "";
      return (
        i.serialNumber.toLowerCase().includes(q) ||
        loc.toLowerCase().includes(q) ||
        bk.toLowerCase().includes(q) ||
        i.supervisor.toLowerCase().includes(q) ||
        statusLabel(i.status).toLowerCase().includes(q)
      );
    });
  }, [search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      const locA = locations.find((l) => l.id === a.locationId)?.name ?? "";
      const locB = locations.find((l) => l.id === b.locationId)?.name ?? "";
      const bkA = banks.find((bk) => bk.id === a.bankId)?.name ?? "";
      const bkB = banks.find((bk) => bk.id === b.bankId)?.name ?? "";
      if (sortKey === "date") { av = a.date; bv = b.date; }
      else if (sortKey === "location") { av = locA; bv = locB; }
      else if (sortKey === "bank") { av = bkA; bv = bkB; }
      else if (sortKey === "voltage") { av = a.voltage; bv = b.voltage; }
      else if (sortKey === "resistance") { av = a.resistance; bv = b.resistance; }
      else if (sortKey === "status") { av = a.status; bv = b.status; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / PER_PAGE);
  const pageData = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
    setPage(1);
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronsUpDown size={12} style={{ opacity: 0.35, marginLeft: 4 }} />;
    return sortDir === "asc"
      ? <ArrowUp size={12} style={{ color: "#2563EB", marginLeft: 4 }} />
      : <ArrowDown size={12} style={{ color: "#2563EB", marginLeft: 4 }} />;
  }

  const thStyle: React.CSSProperties = {
    padding: "10px 14px", textAlign: "left",
    fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase",
    letterSpacing: "0.06em", color: "#64748B",
    cursor: "pointer", userSelect: "none", whiteSpace: "nowrap",
    borderBottom: "1px solid #E2E8F0",
  };

  return (
    <Card>
      <div className="p-5 pb-4 flex items-center justify-between gap-4" style={{ borderBottom: "1px solid #E2E8F0" }}>
        <div>
          <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "#0F172A" }}>Histórico de Inspeções</p>
          <p style={{ fontSize: "0.75rem", color: "#64748B", marginTop: 2 }}>{filtered.length} registros encontrados</p>
        </div>
        <div className="relative" style={{ maxWidth: 280, flex: 1 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por local, banco, série, supervisor..."
            style={{
              width: "100%", paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
              border: "1px solid #E2E8F0", borderRadius: 8,
              fontSize: "0.8125rem", color: "#0F172A", backgroundColor: "#F8FAFC",
              outline: "none",
            }}
          />
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#F8FAFC" }}>
              {[
                { key: "date" as SortKey, label: "Data" },
                { key: "location" as SortKey, label: "Local" },
                { key: "bank" as SortKey, label: "Banco" },
                { key: null, label: "Bateria" },
                { key: null, label: "Nº Série" },
                { key: "voltage" as SortKey, label: "Tensão (V)" },
                { key: "resistance" as SortKey, label: "Resistência (mΩ)" },
                { key: "status" as SortKey, label: "Status" },
                { key: null, label: "Supervisor" },
              ].map(({ key, label }) => (
                <th
                  key={label}
                  style={thStyle}
                  onClick={() => key && handleSort(key)}
                >
                  <span className="flex items-center">
                    {label}
                    {key && <SortIcon col={key} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((ins, i) => {
              const loc = locations.find((l) => l.id === ins.locationId);
              const bk = banks.find((b) => b.id === ins.bankId);
              const bat = batteries.find((b) => b.id === ins.batteryId);
              return (
                <tr
                  key={ins.id}
                  style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.1s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <td style={{ padding: "11px 14px", fontSize: "0.8125rem", color: "#475569", whiteSpace: "nowrap" }}>
                    {formatDate(ins.date)}
                  </td>
                  <td style={{ padding: "11px 14px", fontSize: "0.8125rem", color: "#0F172A", whiteSpace: "nowrap" }}>
                    {loc?.name}
                  </td>
                  <td style={{ padding: "11px 14px", fontSize: "0.8125rem", color: "#475569" }}>{bk?.name}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <button
                      onClick={() => onSelectBattery(ins.batteryId)}
                      style={{ fontSize: "0.8125rem", color: "#2563EB", fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      BAT-{bat?.sequence.toString().padStart(2, "0")}
                    </button>
                  </td>
                  <td style={{ padding: "11px 14px", fontSize: "0.75rem", color: "#64748B", fontFamily: "monospace" }}>{ins.serialNumber}</td>
                  <td style={{ padding: "11px 14px", fontSize: "0.8125rem", fontWeight: 600, color: "#0F172A" }}>{ins.voltage} V</td>
                  <td style={{ padding: "11px 14px", fontSize: "0.8125rem", fontWeight: 600, color: "#0F172A" }}>{ins.resistance} mΩ</td>
                  <td style={{ padding: "11px 14px" }}>
                    <span
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "3px 10px", borderRadius: 20,
                        fontSize: "0.7rem", fontWeight: 600,
                        backgroundColor: statusBg(ins.status),
                        color: statusColor(ins.status),
                      }}
                    >
                      <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: statusColor(ins.status), flexShrink: 0 }} />
                      {statusLabel(ins.status)}
                    </span>
                  </td>
                  <td style={{ padding: "11px 14px", fontSize: "0.8125rem", color: "#475569", whiteSpace: "nowrap" }}>{ins.supervisor}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between p-4" style={{ borderTop: "1px solid #F1F5F9" }}>
        <p style={{ fontSize: "0.75rem", color: "#64748B" }}>
          Página {page} de {totalPages} · {sorted.length} registros
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            style={{
              padding: "5px 8px", borderRadius: 6, border: "1px solid #E2E8F0",
              backgroundColor: page === 1 ? "#F8FAFC" : "#fff",
              color: page === 1 ? "#CBD5E1" : "#0F172A",
              cursor: page === 1 ? "not-allowed" : "pointer", fontSize: "0.8125rem",
              display: "flex", alignItems: "center", gap: 4,
            }}
          >
            <ChevronLeft size={14} /> Anterior
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pg = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
            return (
              <button
                key={pg}
                onClick={() => setPage(pg)}
                style={{
                  width: 32, height: 32, borderRadius: 6, border: "1px solid #E2E8F0",
                  backgroundColor: pg === page ? "#2563EB" : "#fff",
                  color: pg === page ? "#fff" : "#0F172A",
                  cursor: "pointer", fontSize: "0.8125rem", fontWeight: pg === page ? 600 : 400,
                }}
              >
                {pg}
              </button>
            );
          })}
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            style={{
              padding: "5px 8px", borderRadius: 6, border: "1px solid #E2E8F0",
              backgroundColor: page === totalPages ? "#F8FAFC" : "#fff",
              color: page === totalPages ? "#CBD5E1" : "#0F172A",
              cursor: page === totalPages ? "not-allowed" : "pointer", fontSize: "0.8125rem",
              display: "flex", alignItems: "center", gap: 4,
            }}
          >
            Próxima <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </Card>
  );
}

/* ── Filter sidebar ────────────────────────────────────────────────────── */
function FilterSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "7px 10px", borderRadius: 8,
    border: "1px solid #E2E8F0", fontSize: "0.8125rem",
    color: "#0F172A", backgroundColor: "#F8FAFC", outline: "none",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.7rem", fontWeight: 600,
    color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em",
    marginBottom: 6,
  };

  return (
    <div
      style={{
        width: open ? 240 : 0,
        minWidth: open ? 240 : 0,
        overflow: "hidden",
        transition: "width 0.25s ease, min-width 0.25s ease",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 240, height: "100%",
          backgroundColor: "#fff", borderRight: "1px solid #E2E8F0",
          overflowY: "auto", padding: open ? "20px 16px" : 0,
          opacity: open ? 1 : 0, transition: "opacity 0.2s",
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "#0F172A" }}>Filtros</p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Local</label>
            <select style={inputStyle}>
              <option value="">Todos</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>KM</label>
            <input style={inputStyle} placeholder="Ex: 8+500" />
          </div>
          <div>
            <label style={labelStyle}>Supervisão</label>
            <select style={inputStyle}>
              <option value="">Todas</option>
              <option>Norte</option>
              <option>Sul</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Banco</label>
            <select style={inputStyle}>
              <option value="">Todos</option>
              <option>Banco A</option>
              <option>Banco B</option>
              <option>Banco C</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Fabricante</label>
            <select style={inputStyle}>
              <option value="">Todos</option>
              {manufacturers.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Modelo</label>
            <select style={inputStyle}>
              <option value="">Todos</option>
              {models.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { val: "excellent", label: "Excelente", color: "#22C55E" },
                { val: "attention", label: "Atenção",   color: "#F97316" },
                { val: "critical",  label: "Crítico",   color: "#DC2626" },
              ].map((s) => (
                <label key={s.val} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="checkbox" defaultChecked style={{ accentColor: s.color, width: 14, height: 14 }} />
                  <span style={{ fontSize: "0.8125rem", color: "#0F172A" }}>{s.label}</span>
                  <span style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", backgroundColor: s.color }} />
                </label>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Data Inicial</label>
            <input type="date" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Data Final</label>
            <input type="date" style={inputStyle} defaultValue="2026-07-16" />
          </div>
          <button
            style={{
              width: "100%", padding: "9px 0",
              backgroundColor: "#2563EB", color: "#fff",
              border: "none", borderRadius: 8,
              fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
            }}
          >
            Aplicar Filtros
          </button>
          <button
            style={{
              width: "100%", padding: "9px 0",
              backgroundColor: "#F1F5F9", color: "#64748B",
              border: "none", borderRadius: 8,
              fontSize: "0.875rem", fontWeight: 500, cursor: "pointer",
            }}
          >
            Limpar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Custom chart tooltip ──────────────────────────────────────────────── */
function ChartTip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor: "#1E293B", border: "none", borderRadius: 8, padding: "8px 12px", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
      <p style={{ fontSize: "0.7rem", color: "#94A3B8", marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ fontSize: "0.8125rem", fontWeight: 600, color: p.color ?? "#fff" }}>
          {p.value}{unit}
        </p>
      ))}
    </div>
  );
}

/* ── Main Dashboard ────────────────────────────────────────────────────── */
export function MainDashboard({
  onSelectBattery,
  onSelectLocation,
}: {
  onSelectBattery: (id: string) => void;
  onSelectLocation: (id: string) => void;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedBankId, setSelectedBankId] = useState(banks[0].id);

  const kpi = getKPIs();
  const voltageTrend = getVoltageTrend();
  const resistanceTrend = getResistanceTrend();
  const top10 = getTop10ByResistance();
  const statusDist = getStatusDistribution();
  const heatBatteries = getBatteriesForBank(selectedBankId);
  const selectedBank = banks.find((b) => b.id === selectedBankId)!;
  const selectedBankLoc = locations.find((l) => l.id === selectedBank.locationId)!;

  const tickStyle = { fontSize: 11, fill: "#94A3B8" };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "#F8FAFC", fontFamily: "'Inter', sans-serif" }}>
      {/* ── Header ── */}
      <header style={{ backgroundColor: "#fff", borderBottom: "1px solid #E2E8F0", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, zIndex: 10 }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid #E2E8F0", backgroundColor: sidebarOpen ? "#EFF6FF" : "#fff", color: sidebarOpen ? "#2563EB" : "#64748B", cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            <SlidersHorizontal size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: "1rem", fontWeight: 700, color: "#0F172A", lineHeight: 1.2 }}>Dashboard de Saúde das Baterias</h1>
            <p style={{ fontSize: "0.7rem", color: "#94A3B8" }}>PRO-001107 · Manutenção Preventiva de Baterias</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>Última sincronização: <strong style={{ color: "#64748B" }}>16/07/2026 às 09:42</strong></span>
          <div className="relative" style={{ maxWidth: 220 }}>
            <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
            <input
              placeholder="Pesquisar local, banco..."
              style={{ paddingLeft: 28, paddingRight: 10, paddingTop: 7, paddingBottom: 7, border: "1px solid #E2E8F0", borderRadius: 8, fontSize: "0.8rem", color: "#0F172A", backgroundColor: "#F8FAFC", outline: "none", width: "100%" }}
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: "#F1F5F9", border: "1px solid #E2E8F0" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#fff" }}>MS</span>
            </div>
            <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "#0F172A" }}>Marcos S.</span>
          </div>
          <button
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", backgroundColor: "#2563EB", color: "#fff", border: "none", borderRadius: 8, fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}
          >
            <RefreshCw size={13} /> Atualizar
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <FilterSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main scroll area */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {/* ── Row 1: KPI Cards ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16, marginBottom: 20 }}>
            <KPICard icon={MapPin}       label="Locais"              value={kpi.totalLocations}    color="#2563EB" />
            <KPICard icon={Battery}      label="Baterias"            value={kpi.totalBatteries}    color="#2563EB" />
            <KPICard icon={ClipboardList} label="Inspeções"          value={kpi.totalInspections}  color="#8B5CF6" />
            <KPICard icon={AlertTriangle} label="Em Alerta"          value={kpi.alertBatteries}    color="#F97316" sub="baterias" />
            <KPICard icon={AlertCircle}  label="Críticas"            value={kpi.criticalBatteries} color="#DC2626" sub="baterias" />
            <KPICard icon={Activity}     label="Saúde Média da Rede" value={`${kpi.avgHealth}%`}   color="#22C55E" />
          </div>

          {/* ── Row 2: Trend Charts ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <Card>
              <div className="p-5 pb-3">
                <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "#0F172A" }}>Evolução da Tensão Média</p>
                <p style={{ fontSize: "0.75rem", color: "#64748B", marginTop: 2 }}>Média de todas as baterias · últimos 30 dias</p>
              </div>
              <div style={{ padding: "0 8px 16px" }}>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={voltageTrend} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="date" tick={tickStyle} tickLine={false} axisLine={false} tickFormatter={(v) => v.slice(5)} interval={4} />
                    <YAxis tick={tickStyle} tickLine={false} axisLine={false} domain={["auto", "auto"]} unit="V" />
                    <Tooltip content={<ChartTip unit=" V" />} />
                    <Line type="monotone" dataKey="voltage" stroke="#2563EB" strokeWidth={2} dot={false} name="Tensão" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card>
              <div className="p-5 pb-3">
                <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "#0F172A" }}>Evolução da Resistência Média</p>
                <p style={{ fontSize: "0.75rem", color: "#64748B", marginTop: 2 }}>Média de todas as baterias · últimos 30 dias</p>
              </div>
              <div style={{ padding: "0 8px 16px" }}>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={resistanceTrend} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="date" tick={tickStyle} tickLine={false} axisLine={false} tickFormatter={(v) => v.slice(5)} interval={4} />
                    <YAxis tick={tickStyle} tickLine={false} axisLine={false} domain={["auto", "auto"]} unit=" mΩ" />
                    <Tooltip content={<ChartTip unit=" mΩ" />} />
                    <Line type="monotone" dataKey="resistance" stroke="#F97316" strokeWidth={2} dot={false} name="Resistência" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* ── Row 3: Bar + Pie ── */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 20 }}>
            <Card>
              <div className="p-5 pb-3">
                <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "#0F172A" }}>Top 10 — Maior Resistência</p>
                <p style={{ fontSize: "0.75rem", color: "#64748B", marginTop: 2 }}>Baterias com maior degradação detectada</p>
              </div>
              <div style={{ padding: "0 16px 16px" }}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={top10} layout="vertical" margin={{ top: 0, right: 16, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                    <XAxis type="number" tick={tickStyle} tickLine={false} axisLine={false} unit=" mΩ" />
                    <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: "#94A3B8" }} tickLine={false} axisLine={false} width={130} />
                    <Tooltip content={<ChartTip unit=" mΩ" />} />
                    <Bar dataKey="resistance" name="Resistência" radius={[0, 4, 4, 0]}>
                      {top10.map((entry) => (
                        <Cell key={entry.id} fill={statusColor(entry.status)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card>
              <div className="p-5 pb-3">
                <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "#0F172A" }}>Distribuição por Status</p>
                <p style={{ fontSize: "0.75rem", color: "#64748B", marginTop: 2 }}>{batteries.length} baterias no total</p>
              </div>
              <div style={{ padding: "0 16px" }}>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={statusDist} cx="50%" cy="50%" innerRadius={52} outerRadius={76} paddingAngle={3} dataKey="value">
                      {statusDist.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: "0.75rem", borderRadius: 8, border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 16 }}>
                  {statusDist.map((s) => (
                    <div key={s.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: s.color }} />
                        <span style={{ fontSize: "0.8rem", color: "#475569" }}>{s.name}</span>
                      </div>
                      <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#0F172A" }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* ── Row 4: Heatmap ── */}
          <Card className="mb-5">
            <div className="p-5" style={{ borderBottom: "1px solid #F1F5F9" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "#0F172A" }}>Heatmap do Banco de Baterias</p>
                  <p style={{ fontSize: "0.75rem", color: "#64748B", marginTop: 2 }}>
                    {selectedBankLoc.name} · {selectedBank.name} · {selectedBank.manufacturer} {selectedBank.model}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap" style={{ justifyContent: "flex-end" }}>
                  {banks.map((b) => {
                    const l = locations.find((loc) => loc.id === b.locationId)!;
                    return (
                      <button
                        key={b.id}
                        onClick={() => setSelectedBankId(b.id)}
                        style={{
                          padding: "4px 10px", borderRadius: 6,
                          border: "1px solid",
                          borderColor: b.id === selectedBankId ? "#2563EB" : "#E2E8F0",
                          backgroundColor: b.id === selectedBankId ? "#EFF6FF" : "#fff",
                          color: b.id === selectedBankId ? "#2563EB" : "#64748B",
                          fontSize: "0.72rem", fontWeight: 500, cursor: "pointer",
                        }}
                      >
                        {l.km.replace("KM ", "")} · {b.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="p-6">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {heatBatteries.map((bat) => (
                  <HeatmapCell key={bat.id} bat={bat} onSelect={onSelectBattery} />
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 20 }}>
                {[{ color: "#22C55E", label: "Excelente (≥ 12.4V, ≤ 7 mΩ)" }, { color: "#F97316", label: "Atenção (11.8–12.4V, 8–15 mΩ)" }, { color: "#DC2626", label: "Crítico (< 11.8V, > 15 mΩ)" }].map((s) => (
                  <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: s.color }} />
                    <span style={{ fontSize: "0.72rem", color: "#64748B" }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* ── Row 5: Table ── */}
          <InspectionTable onSelectBattery={onSelectBattery} />
        </div>
      </div>
    </div>
  );
}
