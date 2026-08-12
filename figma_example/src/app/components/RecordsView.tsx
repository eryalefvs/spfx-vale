import { ArrowLeft, Search, Filter, Eye, Pencil, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useState } from "react";
import { getProcedure, getPro } from "../data/procedures";

const proRecords: Record<string, Array<{
  id: string; data: string; tecnico: string; local: string; status: "Concluído" | "Pendente" | "Em andamento"; obs: string;
}>> = {
  "PRO-001107": [
    { id: "001107-001", data: "2026-06-10", tecnico: "Carlos Souza", local: "Sala UPS — Torre A", status: "Concluído", obs: "Tensão normal, sem substituições." },
    { id: "001107-002", data: "2026-06-08", tecnico: "Ana Lima", local: "Abrigo KM 12", status: "Concluído", obs: "2 baterias substituídas." },
    { id: "001107-003", data: "2026-06-05", tecnico: "Marcos Ferreira", local: "Site Norte — UPS 01", status: "Pendente", obs: "Tensão abaixo do limite. Aguardando reposição." },
    { id: "001107-004", data: "2026-05-28", tecnico: "Carlos Souza", local: "Sala UPS — Torre A", status: "Concluído", obs: "Manutenção preventiva regular." },
  ],
  "PRO-001116": [
    { id: "001116-001", data: "2026-06-09", tecnico: "Roberto Alves", local: "Armário AR-03 — Piso 2", status: "Concluído", obs: "Ventilação OK, tensões normais." },
    { id: "001116-002", data: "2026-06-04", tecnico: "Fernanda Melo", local: "Armário AR-07 — Prédio 1", status: "Pendente", obs: "Temperatura interna elevada (52°C). Aguardando reparo." },
    { id: "001116-003", data: "2026-05-30", tecnico: "Roberto Alves", local: "Armário AR-01 — Centro de Controle", status: "Concluído", obs: "Todos os parâmetros normais." },
  ],
  "PRO-001125": [
    { id: "001125-001", data: "2026-06-11", tecnico: "Pedro Nunes", local: "Site Norte — Retificador 02", status: "Em andamento", obs: "Alarme maior ativo. Em investigação." },
    { id: "001125-002", data: "2026-06-07", tecnico: "Carlos Souza", local: "Abrigo KM 42 — Retificador 01", status: "Concluído", obs: "Limpeza e verificação realizadas. Tensão ajustada." },
    { id: "001125-003", data: "2026-05-25", tecnico: "Ana Lima", local: "Site Sul — Retificador 03", status: "Concluído", obs: "Todos os módulos retificadores em operação normal." },
  ],
  "PRO-001126": [
    { id: "001126-001", data: "2026-06-09", tecnico: "Renata Castro", local: "Abrigo Sinalização KM 22", status: "Concluído", obs: "Painel em conformidade. Aterramento verificado." },
    { id: "001126-002", data: "2026-06-03", tecnico: "Renata Castro", local: "Abrigo Sinalização KM 38", status: "Concluído", obs: "Disjuntores e fiação inspecionados sem anomalias." },
    { id: "001126-003", data: "2026-05-20", tecnico: "Henrique Lima", local: "Abrigo Sinalização KM 55", status: "Concluído", obs: "Manutenção preventiva regular concluída." },
  ],
  "PRO-001131": [
    { id: "001131-001", data: "2026-06-11", tecnico: "Luciana Pires", local: "Rack 02 — Sala TI", status: "Concluído", obs: "Limpeza e verificação de portas realizada." },
    { id: "001131-002", data: "2026-06-07", tecnico: "Diego Santos", local: "Rack 05 — Andar 3", status: "Em andamento", obs: "Porta 12 com link instável. Em investigação." },
    { id: "001131-003", data: "2026-06-01", tecnico: "Luciana Pires", local: "Sala TI — Rack 01", status: "Concluído", obs: "Firmware atualizado. Todos os links UP." },
    { id: "001131-004", data: "2026-05-18", tecnico: "Diego Santos", local: "Rack 03 — Data Center", status: "Concluído", obs: "Inspeção preventiva sem anomalias." },
  ],
  "PRO-001132": [
    { id: "001132-001", data: "2026-06-09", tecnico: "Thiago Mendes", local: "Painel MUX — Sala Telecom", status: "Concluído", obs: "31 tributários ativos. Nenhum alarme." },
    { id: "001132-002", data: "2026-05-25", tecnico: "Thiago Mendes", local: "Painel MUX — Sala Telecom", status: "Concluído", obs: "Backup de configuração realizado." },
    { id: "001132-003", data: "2026-05-10", tecnico: "Luciana Pires", local: "Painel MUX — Sala Telecom", status: "Concluído", obs: "Sincronismo verificado e OK." },
  ],
};

const statusConfig = {
  "Concluído":     { icon: CheckCircle2, color: "#0ABB98",  bg: "#f0fdf8", border: "#a7f3e0" },
  "Pendente":      { icon: AlertCircle,  color: "#ECB11F",  bg: "#fffbea", border: "#fde68a" },
  "Em andamento":  { icon: Clock,        color: "#007E7A",  bg: "#f0fdfb", border: "#99e6d8" },
};

interface RecordsViewProps {
  procedureId: string;
  proId: string;
  onBack: () => void;
}

export function RecordsView({ procedureId, proId, onBack }: RecordsViewProps) {
  const proc = getProcedure(procedureId);
  const pro = getPro(procedureId, proId);
  const records = proRecords[proId] ?? [];
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("Todos");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = records.filter((r) => {
    const matchSearch =
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.tecnico.toLowerCase().includes(search.toLowerCase()) ||
      r.local.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "Todos" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

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
      <h1 className="text-foreground mb-1" style={{ fontSize: "1.25rem", fontWeight: 600 }}>Registros de Atividades</h1>
      <p className="text-muted-foreground mb-6" style={{ fontSize: "0.875rem" }}>{pro?.title}</p>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex-1 relative" style={{ maxWidth: 320 }}>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por ID, técnico ou local..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2"
            style={{ fontSize: "0.8125rem" }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={13} className="text-muted-foreground" />
          {["Todos", "Concluído", "Pendente", "Em andamento"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="px-3 py-1.5 rounded-lg border transition-colors"
              style={{
                fontSize: "0.75rem", fontWeight: 500,
                backgroundColor: filterStatus === s ? barColor : "var(--card)",
                color: filterStatus === s ? "#ffffff" : "var(--muted-foreground)",
                borderColor: filterStatus === s ? barColor : "var(--border)",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              {["ID", "Data", "Técnico", "Local", "Status", "Ações"].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-muted-foreground"
                  style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-muted-foreground" style={{ fontSize: "0.875rem" }}>
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((record) => {
                const sConf = statusConfig[record.status];
                const StatusIcon = sConf.icon;
                const isExpanded = expandedId === record.id;
                return (
                  <>
                    <tr
                      key={record.id}
                      className="border-b border-border/50 hover:bg-secondary/20 transition-colors"
                      style={{ backgroundColor: isExpanded ? "var(--secondary)" : undefined }}
                    >
                      <td className="px-4 py-3">
                        <span style={{ color: barColor, fontSize: "0.8125rem", fontWeight: 600, fontFamily: "monospace" }}>
                          {record.id}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-foreground" style={{ fontSize: "0.8125rem" }}>
                          {new Date(record.data + "T12:00:00").toLocaleDateString("pt-BR")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-foreground" style={{ fontSize: "0.8125rem" }}>{record.tecnico}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>{record.local}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
                          style={{ fontSize: "0.6875rem", fontWeight: 600, backgroundColor: sConf.bg, borderColor: sConf.border, color: sConf.color }}
                        >
                          <StatusIcon size={11} />
                          {record.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : record.id)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            title="Ver observações"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${record.id}-detail`} className="border-b border-border/40" style={{ backgroundColor: "var(--secondary)" }}>
                        <td colSpan={6} className="px-4 py-3">
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground shrink-0" style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              Obs:
                            </span>
                            <span className="text-foreground" style={{ fontSize: "0.8125rem" }}>{record.obs}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-muted-foreground mt-3" style={{ fontSize: "0.75rem" }}>
        {filtered.length} registro{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
