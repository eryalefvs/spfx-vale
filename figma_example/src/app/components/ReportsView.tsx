import { ArrowLeft, Download, FileText, Calendar, TrendingUp } from "lucide-react";
import { getProcedure, getPro } from "../data/procedures";

const reports = [
  { id: "R001", title: "Relatório Mensal — Junho 2026", type: "Mensal", gerado: "11/06/2026", size: "248 KB" },
  { id: "R002", title: "Relatório Mensal — Maio 2026", type: "Mensal", gerado: "01/06/2026", size: "312 KB" },
  { id: "R003", title: "Relatório Trimestral — T1 2026", type: "Trimestral", gerado: "02/04/2026", size: "875 KB" },
  { id: "R004", title: "Relatório Anual — 2025", type: "Anual", gerado: "05/01/2026", size: "1.4 MB" },
];

const typeColors: Record<string, { bg: string; color: string; border: string }> = {
  Mensal:      { bg: "#f0fdfb", color: "#007E7A", border: "#a7f3e0" },
  Trimestral:  { bg: "#fffbea", color: "#b8870b", border: "#fde68a" },
  Anual:       { bg: "#f0f5ff", color: "#1a7ea8", border: "#bfdbfe" },
};

interface ReportsViewProps {
  procedureId: string;
  proId: string;
  onBack: () => void;
}

export function ReportsView({ procedureId, proId, onBack }: ReportsViewProps) {
  const proc = getProcedure(procedureId);
  const pro = getPro(procedureId, proId);
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

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-2 py-0.5 rounded"
              style={{ backgroundColor: `${barColor}20`, color: proc?.iconColor, fontSize: "0.65rem", fontWeight: 700, fontFamily: "monospace" }}
            >
              {proId}
            </span>
          </div>
          <h1 className="text-foreground mb-1" style={{ fontSize: "1.25rem", fontWeight: 600 }}>Relatórios</h1>
          <p className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>{pro?.title}</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2.5 text-white rounded-lg hover:opacity-90 transition-opacity"
          style={{ fontSize: "0.875rem", fontWeight: 500, backgroundColor: barColor }}
        >
          <TrendingUp size={15} />
          Gerar Relatório
        </button>
      </div>

      {/* Quick generate */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Relatório do Mês Atual", desc: "Junho 2026", icon: Calendar },
          { label: "Relatório Trimestral", desc: "T2 2026 (Abr–Jun)", icon: TrendingUp },
          { label: "Relatório Personalizado", desc: "Defina período e filtros", icon: FileText },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className="group bg-card border border-border rounded-xl p-5 text-left hover:shadow-sm transition-all"
              style={{ borderTopColor: barColor, borderTopWidth: 2 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg transition-colors" style={{ backgroundColor: `${barColor}15` }}>
                  <Icon size={15} style={{ color: barColor }} />
                </div>
                <Download size={13} className="text-muted-foreground" />
              </div>
              <p className="text-foreground" style={{ fontSize: "0.875rem", fontWeight: 600 }}>{item.label}</p>
              <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{item.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Report list */}
      <p className="text-foreground mb-3" style={{ fontSize: "0.875rem", fontWeight: 600 }}>Relatórios Gerados</p>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {reports.map((report, i) => {
          const tc = typeColors[report.type] ?? typeColors["Mensal"];
          return (
            <div
              key={report.id}
              className="flex items-center justify-between px-5 py-4 hover:bg-secondary/20 transition-colors"
              style={{ borderBottom: i < reports.length - 1 ? "1px solid var(--border)" : undefined }}
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-secondary text-muted-foreground">
                  <FileText size={16} />
                </div>
                <div>
                  <p className="text-foreground" style={{ fontSize: "0.875rem", fontWeight: 500 }}>{report.title}</p>
                  <p className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>
                    Gerado em {report.gerado} · {report.size}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="px-2.5 py-0.5 rounded-full border"
                  style={{ fontSize: "0.6875rem", fontWeight: 600, backgroundColor: tc.bg, color: tc.color, borderColor: tc.border }}
                >
                  {report.type}
                </span>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  style={{ fontSize: "0.75rem", fontWeight: 500 }}
                >
                  <Download size={13} />
                  Baixar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
