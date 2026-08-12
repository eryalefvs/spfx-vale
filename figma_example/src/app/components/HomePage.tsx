import { Zap, Radio, ChevronRight, Activity, ClipboardList, Bell, ShieldCheck, Handshake, Users, Rocket, Leaf } from "lucide-react";
import { procedures } from "../data/procedures";

const procedureIcons: Record<string, React.ComponentType<{ size?: number }>> = {
  energy: Zap,
  telecom: Radio,
};

const procedureStats: Record<string, { total: number; pendentes: number; concluidos: number }> = {
  energy: { total: 42, pendentes: 5, concluidos: 37 },
  telecom: { total: 31, pendentes: 3, concluidos: 28 },
};

const valores = [
  { label: "A vida em primeiro lugar.", icon: ShieldCheck, color: "#007E7A", accent: "#ECB11F" },
  { label: "Agir com integridade.", icon: Handshake, color: "#0ABB98", accent: "#C0305E" },
  { label: "Valorizar quem faz a nossa empresa.", icon: Users, color: "#3CB5E5", accent: "#007E7A" },
  { label: "Fazer acontecer.", icon: Rocket, color: "#C0305E", accent: "#ECB11F" },
  { label: "Respeitar o nosso planeta e as comunidades.", icon: Leaf, color: "#EE6F16", accent: "#0ABB98" },
];

interface HomePageProps {
  onSelect: (id: string) => void;
}

export function HomePage({ onSelect }: HomePageProps) {
  return (
    <div className="flex-1 overflow-auto bg-background">
      {/* ── HERO ── */}
      <div className="relative overflow-hidden" style={{ background: "var(--vale-verde-escuro,#034944)", minHeight: 232 }}>
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1726221062287-fda475b85493?w=1400&h=400&fit=crop&auto=format"
            alt="Técnico operacional em campo"
            className="w-full h-full object-cover"
            style={{ opacity: 0.25 }}
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, #034944 40%, transparent 100%)" }} />
        </div>
        {/* Amarelo stripe */}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: "#ECB11F" }} />

        <div className="relative px-8 py-8 flex items-start justify-between">
          <div>
            <p style={{ color: "#0ABB98", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 600, marginBottom: "0.5rem" }}>
              Plataforma Operacional
            </p>
            <h1 style={{ color: "#ffffff", fontSize: "1.75rem", fontWeight: 700, lineHeight: 1.15, marginBottom: "0.75rem" }}>
              Olá, Técnico.<br />
              <span style={{ color: "#ECB11F" }}>O que vamos fazer hoje?</span>
            </h1>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.875rem", lineHeight: 1.65, maxWidth: 420 }}>
              Selecione o procedimento operacional que deseja registrar, acompanhar ou analisar.
            </p>
          </div>
          <button
            className="shrink-0 relative p-2.5 rounded-xl mt-1"
            style={{ backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.14)" }}
            aria-label="Notificações"
          >
            <Bell size={18} color="white" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ backgroundColor: "#C0305E" }} />
          </button>
        </div>
      </div>

      <div className="px-8 py-7">
        {/* ── SUMMARY STRIP ── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total de Atividades", value: "73", icon: ClipboardList, color: "#007E7A" },
            { label: "Pendentes / Em andamento", value: "8", icon: Activity, color: "#ECB11F" },
            { label: "Concluídas no Mês", value: "65", icon: ClipboardList, color: "#0ABB98" },
          ].map((item) => (
            <div key={item.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
              <div className="p-2.5 rounded-lg" style={{ backgroundColor: `${item.color}18` }}>
                <item.icon size={18} style={{ color: item.color }} />
              </div>
              <div>
                <p className="text-muted-foreground" style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  {item.label}
                </p>
                <p className="text-foreground" style={{ fontSize: "1.5rem", fontWeight: 700, lineHeight: 1 }}>
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── PROCEDURE CARDS ── */}
        <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#747678", marginBottom: "1rem" }}>
          Áreas de Procedimento
        </p>
        <div className="grid grid-cols-2 gap-5 mb-10">
          {procedures.map((proc) => {
            const Icon = procedureIcons[proc.id] ?? Zap;
            const stats = procedureStats[proc.id] ?? { total: 0, pendentes: 0, concluidos: 0 };
            return (
              <button
                key={proc.id}
                onClick={() => onSelect(proc.id)}
                className="group bg-card border border-border rounded-xl text-left hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer overflow-hidden"
                style={{ borderTopColor: proc.barColor, borderTopWidth: 3 }}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 rounded-lg" style={{ backgroundColor: proc.iconBg }}>
                      <Icon size={22} style={{ color: proc.iconColor }} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{ color: proc.iconColor, fontSize: "0.7rem", fontWeight: 600 }}>
                        {proc.pros.length} PROs
                      </span>
                      <ChevronRight
                        size={15}
                        style={{ color: proc.barColor }}
                        className="group-hover:translate-x-0.5 transition-transform duration-200"
                      />
                    </div>
                  </div>

                  <h2 className="text-foreground mb-1.5" style={{ fontSize: "1.0625rem", fontWeight: 600 }}>
                    {proc.title}
                  </h2>
                  <p className="text-muted-foreground mb-4" style={{ fontSize: "0.8rem", lineHeight: 1.65 }}>
                    {proc.description}
                  </p>

                  {/* PRO tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {proc.pros.map((pro) => (
                      <span
                        key={pro.id}
                        className="px-2 py-0.5 rounded"
                        style={{ backgroundColor: `${proc.barColor}18`, color: proc.iconColor, fontSize: "0.6rem", fontWeight: 700, fontFamily: "monospace", letterSpacing: "0.04em" }}
                      >
                        {pro.id}
                      </span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
                    <div className="text-center">
                      <p className="text-foreground" style={{ fontSize: "1.125rem", fontWeight: 700 }}>{stats.total}</p>
                      <p className="text-muted-foreground" style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total</p>
                    </div>
                    <div className="text-center border-x border-border">
                      <p style={{ fontSize: "1.125rem", fontWeight: 700, color: "#ECB11F" }}>{stats.pendentes}</p>
                      <p style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#b8870b" }}>Pendentes</p>
                    </div>
                    <div className="text-center">
                      <p style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0ABB98" }}>{stats.concluidos}</p>
                      <p style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#007E7A" }}>Concluídos</p>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── VALORES ── */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-0.5 w-6 rounded" style={{ backgroundColor: "#ECB11F" }} />
            <p style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#007E7A" }}>
              Nossos Valores
            </p>
            <div className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
          </div>
          <p className="text-muted-foreground mb-5" style={{ fontSize: "0.8125rem" }}>
            As diretrizes que traduzem aquilo em que acreditamos.
          </p>
          <div className="grid grid-cols-5 gap-3">
            {valores.map((v) => {
              const Icon = v.icon;
              return (
                <div
                  key={v.label}
                  className="rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden"
                  style={{ backgroundColor: v.color }}
                >
                  <div className="absolute top-0 right-0 w-1.5 h-8 rounded-bl-lg" style={{ backgroundColor: v.accent }} />
                  <Icon size={18} color="rgba(255,255,255,0.85)" />
                  <p style={{ color: "#ffffff", fontSize: "0.8rem", fontWeight: 600, lineHeight: 1.35 }}>
                    {v.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
