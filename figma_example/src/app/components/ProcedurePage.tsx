import { Zap, Radio, ArrowLeft, ChevronRight, FileText, Activity, ClipboardList } from "lucide-react";
import { getProcedure } from "../data/procedures";

const procedureIcons: Record<string, React.ComponentType<{ size?: number }>> = {
  energy: Zap,
  telecom: Radio,
};

/* Placeholder stats per PRO */
const proStats: Record<string, { total: number; pendentes: number; concluidos: number }> = {
  "PRO-001107": { total: 18, pendentes: 2, concluidos: 16 },
  "PRO-001116": { total: 12, pendentes: 1, concluidos: 11 },
  "PRO-001125": { total: 8, pendentes: 2, concluidos: 6 },
  "PRO-001126": { total: 4, pendentes: 0, concluidos: 4 },
  "PRO-001131": { total: 20, pendentes: 2, concluidos: 18 },
  "PRO-001132": { total: 11, pendentes: 1, concluidos: 10 },
};

interface ProcedurePageProps {
  procedureId: string;
  onBack: () => void;
  onSelectPro: (proId: string) => void;
}

export function ProcedurePage({ procedureId, onBack, onSelectPro }: ProcedurePageProps) {
  const proc = getProcedure(procedureId);
  if (!proc) return null;

  const Icon = procedureIcons[procedureId] ?? Zap;

  return (
    <div className="flex-1 overflow-auto bg-background p-8">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
        <span style={{ fontSize: "0.875rem" }}>Voltar ao Início</span>
      </button>

      {/* Header */}
      <div
        className="bg-card border border-border rounded-xl overflow-hidden mb-8"
        style={{ borderTopColor: proc.barColor, borderTopWidth: 3 }}
      >
        <div className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl" style={{ backgroundColor: proc.iconBg }}>
            <Icon size={26} style={{ color: proc.iconColor }} />
          </div>
          <div>
            <p className="text-muted-foreground" style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.09em" }}>
              Área de Procedimento
            </p>
            <h1 className="text-foreground" style={{ fontSize: "1.375rem", fontWeight: 600, lineHeight: 1.2 }}>
              {proc.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Section label */}
      <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#747678", marginBottom: "1rem" }}>
        Selecione um Procedimento Operacional
      </p>

      {/* PRO list */}
      <div className="space-y-3 max-w-3xl">
        {proc.pros.map((pro, idx) => {
          const stats = proStats[pro.id] ?? { total: 0, pendentes: 0, concluidos: 0 };
          return (
            <button
              key={pro.id}
              onClick={() => onSelectPro(pro.id)}
              className="group w-full bg-card border border-border rounded-xl text-left hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden"
              style={{ borderLeftColor: proc.barColor, borderLeftWidth: 4 }}
            >
              <div className="px-5 py-4 flex items-center gap-5">
                {/* Index */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white"
                  style={{ backgroundColor: proc.barColor }}
                >
                  <span style={{ fontSize: "0.8125rem", fontWeight: 700 }}>{String(idx + 1).padStart(2, "0")}</span>
                </div>

                {/* PRO info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="px-2 py-0.5 rounded"
                      style={{ backgroundColor: `${proc.barColor}20`, color: proc.iconColor, fontSize: "0.65rem", fontWeight: 700, fontFamily: "monospace", letterSpacing: "0.05em" }}
                    >
                      {pro.id}
                    </span>
                  </div>
                  <p className="text-foreground truncate" style={{ fontSize: "0.9375rem", fontWeight: 600 }}>
                    {pro.title}
                  </p>
                </div>

                {/* Stats */}
                <div className="hidden sm:flex items-center gap-6 shrink-0">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <ClipboardList size={11} />
                      <span style={{ fontSize: "0.7rem" }}>Total</span>
                    </div>
                    <p className="text-foreground" style={{ fontSize: "0.9375rem", fontWeight: 700 }}>{stats.total}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1" style={{ color: "#ECB11F" }}>
                      <Activity size={11} />
                      <span style={{ fontSize: "0.7rem" }}>Pendentes</span>
                    </div>
                    <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#ECB11F" }}>{stats.pendentes}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1" style={{ color: "#0ABB98" }}>
                      <FileText size={11} />
                      <span style={{ fontSize: "0.7rem" }}>Concluídos</span>
                    </div>
                    <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0ABB98" }}>{stats.concluidos}</p>
                  </div>
                </div>

                <ChevronRight
                  size={16}
                  className="shrink-0 text-muted-foreground group-hover:translate-x-0.5 transition-transform duration-200"
                  style={{ color: proc.barColor }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
