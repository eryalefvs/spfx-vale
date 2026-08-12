import { Zap, Radio, Home, Settings, User, ChevronRight, ChevronDown } from "lucide-react";
import { procedures } from "../data/procedures";
import { useState } from "react";

const procedureIcons: Record<string, React.ComponentType<{ size?: number }>> = {
  energy: Zap,
  telecom: Radio,
};

interface SidebarProps {
  activeProcedure: string | null;
  activePro: string | null;
  onNavigateHome: () => void;
  onNavigateProcedure: (id: string) => void;
  onNavigatePro: (proId: string) => void;
}

export function Sidebar({ activeProcedure, activePro, onNavigateHome, onNavigateProcedure, onNavigatePro }: SidebarProps) {
  const [expandedProcedure, setExpandedProcedure] = useState<string | null>(activeProcedure);

  function handleProcedureClick(id: string) {
    if (expandedProcedure === id) {
      setExpandedProcedure(null);
    } else {
      setExpandedProcedure(id);
      onNavigateProcedure(id);
    }
  }

  return (
    <aside
      className="w-[240px] shrink-0 flex flex-col"
      style={{ backgroundColor: "#034944", borderRight: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-3">
          {/* V mark */}
          <svg width="30" height="26" viewBox="0 0 30 26" fill="none" aria-label="Vale logo mark">
            <path d="M0 0 L9 26 L15 13 L21 26 L30 0 L24.5 0 L21 10.5 L15 0 L9 10.5 L5.5 0 Z" fill="#ECB11F" />
          </svg>
          <div>
            <p style={{ color: "#ECB11F", fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1 }}>VALE</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.14em", lineHeight: 1.5 }}>
              Operações
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {/* Home */}
        <button
          onClick={onNavigateHome}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
          style={{
            fontSize: "0.8125rem",
            backgroundColor: activeProcedure === null ? "#ECB11F" : "transparent",
            color: activeProcedure === null ? "#1a1a1a" : "rgba(255,255,255,0.65)",
            fontWeight: activeProcedure === null ? 600 : 400,
          }}
          onMouseEnter={(e) => { if (activeProcedure !== null) (e.currentTarget as HTMLElement).style.backgroundColor = "#005954"; }}
          onMouseLeave={(e) => { if (activeProcedure !== null) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
        >
          <Home size={15} />
          <span>Início</span>
        </button>

        {/* Section label */}
        <div className="pt-5 pb-2 px-3">
          <p style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
            Procedimentos
          </p>
        </div>

        {/* Procedures + PROs */}
        {procedures.map((proc) => {
          const Icon = procedureIcons[proc.id] ?? Zap;
          const isActiveProcedure = activeProcedure === proc.id;
          const isExpanded = expandedProcedure === proc.id;

          return (
            <div key={proc.id}>
              {/* Procedure button */}
              <button
                onClick={() => handleProcedureClick(proc.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
                style={{
                  fontSize: "0.8125rem",
                  backgroundColor: isActiveProcedure && !activePro ? "#005954" : "transparent",
                  color: isActiveProcedure ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.6)",
                  fontWeight: isActiveProcedure ? 500 : 400,
                }}
                onMouseEnter={(e) => { if (!(isActiveProcedure && !activePro)) (e.currentTarget as HTMLElement).style.backgroundColor = "#005954"; }}
                onMouseLeave={(e) => { if (!(isActiveProcedure && !activePro)) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: proc.dotColor, opacity: isActiveProcedure ? 1 : 0.55 }} />
                <span className="flex-1 text-left" style={{ fontSize: "0.8rem" }}>{proc.shortTitle}</span>
                {isExpanded ? <ChevronDown size={12} style={{ opacity: 0.5 }} /> : <ChevronRight size={12} style={{ opacity: 0.4 }} />}
              </button>

              {/* PRO sub-items */}
              {isExpanded && (
                <div className="mt-0.5 mb-1 ml-4 space-y-0.5">
                  {proc.pros.map((pro) => {
                    const isActivePro = activePro === pro.id && isActiveProcedure;
                    return (
                      <button
                        key={pro.id}
                        onClick={() => { onNavigateProcedure(proc.id); onNavigatePro(pro.id); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all"
                        style={{
                          fontSize: "0.75rem",
                          backgroundColor: isActivePro ? `${proc.barColor}30` : "transparent",
                          color: isActivePro ? "#ffffff" : "rgba(255,255,255,0.5)",
                          fontWeight: isActivePro ? 500 : 400,
                          borderLeft: isActivePro ? `2px solid ${proc.barColor}` : "2px solid transparent",
                        }}
                        onMouseEnter={(e) => { if (!isActivePro) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.06)"; }}
                        onMouseLeave={(e) => { if (!isActivePro) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
                      >
                        <span style={{ fontFamily: "monospace", fontSize: "0.65rem", color: proc.barColor, fontWeight: 700 }}>
                          {pro.id}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all mb-0.5"
          style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.55)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#005954"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.9)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)"; }}
        >
          <Settings size={14} style={{ opacity: 0.65 }} />
          Configurações
        </button>
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#007E7A", border: "2px solid #0ABB98" }}>
            <User size={13} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.75rem", fontWeight: 600, lineHeight: 1.2 }}>
              Técnico Operacional
            </p>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.6rem" }}>
              turno@vale.com
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
