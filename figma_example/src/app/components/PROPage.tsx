import { ArrowLeft, Plus, BarChart2, ClipboardList, FileText, ChevronRight } from "lucide-react";
import { getProcedure, getPro } from "../data/procedures";

const actions = [
  {
    id: "new",
    label: "Nova Atividade",
    description: "Iniciar e registrar um novo procedimento operacional",
    icon: Plus,
  },
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Métricas, gráficos e indicadores de desempenho",
    icon: BarChart2,
  },
  {
    id: "records",
    label: "Registros",
    description: "Histórico completo de atividades realizadas",
    icon: ClipboardList,
  },
  {
    id: "reports",
    label: "Relatórios",
    description: "Gerar e exportar relatórios técnicos",
    icon: FileText,
  },
];

interface PROPageProps {
  procedureId: string;
  proId: string;
  onBack: () => void;
  onSelectAction: (action: string) => void;
}

export function PROPage({ procedureId, proId, onBack, onSelectAction }: PROPageProps) {
  const proc = getProcedure(procedureId);
  const pro = getPro(procedureId, proId);
  if (!proc || !pro) return null;

  return (
    <div className="flex-1 overflow-auto bg-background p-8">
      {/* Breadcrumb back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
        <span style={{ fontSize: "0.875rem" }}>Voltar a {proc.title}</span>
      </button>

      {/* Header card */}
      <div
        className="bg-card border border-border rounded-xl overflow-hidden mb-8 max-w-2xl"
        style={{ borderTopColor: proc.barColor, borderTopWidth: 3 }}
      >
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <span
                className="inline-block px-2 py-0.5 rounded mb-2"
                style={{ backgroundColor: `${proc.barColor}20`, color: proc.iconColor, fontSize: "0.65rem", fontWeight: 700, fontFamily: "monospace", letterSpacing: "0.06em" }}
              >
                {pro.id}
              </span>
              <h1 className="text-foreground" style={{ fontSize: "1.25rem", fontWeight: 600, lineHeight: 1.25 }}>
                {pro.title}
              </h1>
              <p className="text-muted-foreground mt-1" style={{ fontSize: "0.8125rem" }}>
                Área: <span style={{ color: proc.iconColor, fontWeight: 500 }}>{proc.title}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-muted-foreground mb-5" style={{ fontSize: "0.8125rem" }}>
        Selecione a ação que deseja realizar neste procedimento.
      </p>

      {/* Action cards */}
      <div className="grid grid-cols-2 gap-4 max-w-2xl">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onSelectAction(action.id)}
              className="group bg-card border border-border rounded-xl p-6 text-left hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer overflow-hidden"
              style={{ borderTopColor: proc.barColor, borderTopWidth: 2 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-lg" style={{ backgroundColor: proc.iconBg }}>
                  <Icon size={20} style={{ color: proc.iconColor }} />
                </div>
                <ChevronRight
                  size={14}
                  className="text-muted-foreground group-hover:translate-x-0.5 transition-transform duration-200 mt-1"
                  style={{ color: proc.barColor }}
                />
              </div>
              <h3 className="text-foreground mb-1" style={{ fontSize: "0.9375rem", fontWeight: 600 }}>
                {action.label}
              </h3>
              <p className="text-muted-foreground" style={{ fontSize: "0.8rem", lineHeight: 1.55 }}>
                {action.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
