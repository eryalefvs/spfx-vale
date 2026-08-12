import { ArrowLeft, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getProcedure, getPro } from "../data/procedures";

const monthlyData = [
  { mes: "Jan", realizadas: 6, pendentes: 2 },
  { mes: "Fev", realizadas: 8, pendentes: 1 },
  { mes: "Mar", realizadas: 7, pendentes: 2 },
  { mes: "Abr", realizadas: 10, pendentes: 1 },
  { mes: "Mai", realizadas: 9, pendentes: 3 },
  { mes: "Jun", realizadas: 11, pendentes: 1 },
];

const statusData = [
  { name: "Concluídas", value: 51, color: "#0ABB98" },
  { name: "Pendentes", value: 5, color: "#ECB11F" },
  { name: "Em andamento", value: 2, color: "#007E7A" },
];

const proKpis: Record<string, { label: string; value: string; trend: "up" | "down" | "flat"; change: string }[]> = {
  "PRO-001107": [
    { label: "Tensão Média", value: "12.8 V", trend: "up", change: "+0.3V" },
    { label: "Baterias OK", value: "94%", trend: "flat", change: "Estável" },
    { label: "Substituições", value: "4", trend: "down", change: "-2 este mês" },
    { label: "Próx. Manutenções", value: "7", trend: "up", change: "Esta semana" },
  ],
  "PRO-001116": [
    { label: "Tensão Entrada Média", value: "219 V", trend: "flat", change: "Estável" },
    { label: "Corrente Média", value: "12.4 A", trend: "up", change: "+1.2A" },
    { label: "Armários Conformes", value: "95%", trend: "up", change: "+3%" },
    { label: "Não-Conformidades", value: "2", trend: "down", change: "-1 vs mês ant." },
  ],
  "PRO-001125": [
    { label: "Tensão Saída Média", value: "48.3 V", trend: "up", change: "+0.2V" },
    { label: "Corrente de Carga", value: "18.6 A", trend: "up", change: "+2A" },
    { label: "Retificadores OK", value: "12/13", trend: "flat", change: "1 em revisão" },
    { label: "Alarmes Ativos", value: "1", trend: "down", change: "-3 vs semana ant." },
  ],
  "PRO-001126": [
    { label: "Tensão Bus Média", value: "48.1 V", trend: "flat", change: "Estável" },
    { label: "Painéis Conformes", value: "100%", trend: "flat", change: "Todos OK" },
    { label: "Disjuntores OK", value: "98%", trend: "up", change: "+2%" },
    { label: "Inspeções no Mês", value: "4", trend: "up", change: "+1" },
  ],
  "PRO-001131": [
    { label: "Links Ativos", value: "14/16", trend: "up", change: "+1 link" },
    { label: "Latência Média", value: "4.2 ms", trend: "up", change: "-0.8ms" },
    { label: "Switches Conformes", value: "90%", trend: "flat", change: "Estável" },
    { label: "Alarmes Ativos", value: "2", trend: "down", change: "-1 vs ontem" },
  ],
  "PRO-001132": [
    { label: "Tributários Ativos", value: "31/32", trend: "flat", change: "1 em manutenção" },
    { label: "Alarmes Ativos", value: "0", trend: "down", change: "Nenhum" },
    { label: "Sincronismo", value: "OK", trend: "flat", change: "Todos sincronizados" },
    { label: "Inspeções no Mês", value: "3", trend: "up", change: "+1" },
  ],
};

const proAlertas: Record<string, { text: string; level: "warning" | "critical" }[]> = {
  "PRO-001107": [
    { text: "Banco de baterias Site B — tensão abaixo de 12V", level: "critical" },
    { text: "Manutenção preventiva vence em 3 dias — Abrigo KM 42", level: "warning" },
  ],
  "PRO-001116": [
    { text: "Armário AR-07 com temperatura interna elevada (52°C)", level: "warning" },
  ],
  "PRO-001125": [
    { text: "Retificador Site Norte — alarme maior ativo", level: "critical" },
  ],
  "PRO-001126": [],
  "PRO-001131": [
    { text: "Switch AFS — Porta 12 com perda de link", level: "critical" },
  ],
  "PRO-001132": [],
};

const trendIcons = { up: TrendingUp, down: TrendingDown, flat: Minus };

interface DashboardViewProps {
  procedureId: string;
  proId: string;
  onBack: () => void;
}

export function DashboardView({ procedureId, proId, onBack }: DashboardViewProps) {
  const proc = getProcedure(procedureId);
  const pro = getPro(procedureId, proId);

  const kpis = proKpis[proId] ?? proKpis["PRO-001107"];
  const alertas = proAlertas[proId] ?? [];
  const barColor = proc?.barColor ?? "#007E7A";

  return (
    <div className="flex-1 overflow-auto bg-background p-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        <span style={{ fontSize: "0.875rem" }}>Voltar</span>
      </button>

      <div className="flex items-center gap-2 mb-1">
        <span
          className="px-2 py-0.5 rounded"
          style={{ backgroundColor: `${barColor}20`, color: proc?.iconColor, fontSize: "0.65rem", fontWeight: 700, fontFamily: "monospace" }}
        >
          {proId}
        </span>
      </div>
      <h1 className="text-foreground mb-1" style={{ fontSize: "1.25rem", fontWeight: 600 }}>Dashboard</h1>
      <p className="text-muted-foreground mb-6" style={{ fontSize: "0.875rem" }}>{pro?.title}</p>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="mb-6 space-y-2">
          {alertas.map((alerta, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border"
              style={alerta.level === "critical"
                ? { backgroundColor: "#fff0f3", borderColor: "#f8c0cb", color: "#C0305E" }
                : { backgroundColor: "#fffbea", borderColor: "#fde68a", color: "#b8870b" }}
            >
              <AlertTriangle size={16} className="shrink-0" />
              <span style={{ fontSize: "0.8125rem", fontWeight: 500 }}>{alerta.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => {
          const TrendIcon = trendIcons[kpi.trend];
          const trendColor = kpi.trend === "up" ? "#0ABB98" : kpi.trend === "down" ? "#C0305E" : "#747678";
          return (
            <div key={kpi.label} className="bg-card border border-border rounded-xl p-4" style={{ borderTopColor: barColor, borderTopWidth: 2 }}>
              <p className="text-muted-foreground mb-2" style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {kpi.label}
              </p>
              <p className="text-foreground mb-1" style={{ fontSize: "1.5rem", fontWeight: 700, lineHeight: 1 }}>
                {kpi.value}
              </p>
              <div className="flex items-center gap-1" style={{ color: trendColor }}>
                <TrendIcon size={13} />
                <span style={{ fontSize: "0.75rem" }}>{kpi.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-card border border-border rounded-xl p-5">
          <p className="text-foreground mb-4" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Atividades por Mês</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={barColor} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={barColor} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ECB11F" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ECB11F" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#747678" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#747678" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: "0.75rem", borderRadius: "0.5rem", border: "1px solid rgba(0,0,0,0.1)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
              <Area type="monotone" dataKey="realizadas" name="Realizadas" stroke={barColor} fill="url(#gradR)" strokeWidth={2} />
              <Area type="monotone" dataKey="pendentes" name="Pendentes" stroke="#ECB11F" fill="url(#gradP)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-foreground mb-4" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Status Geral</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: "0.75rem", borderRadius: "0.5rem", border: "1px solid rgba(0,0,0,0.1)" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{item.name}</span>
                </div>
                <span className="text-foreground" style={{ fontSize: "0.75rem", fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-3 bg-card border border-border rounded-xl p-5">
          <p className="text-foreground mb-4" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Comparativo Semestral</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#747678" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#747678" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: "0.75rem", borderRadius: "0.5rem", border: "1px solid rgba(0,0,0,0.1)" }} />
              <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
              <Bar dataKey="realizadas" name="Realizadas" fill={barColor} radius={[3, 3, 0, 0]} />
              <Bar dataKey="pendentes" name="Pendentes" fill="#ECB11F" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
