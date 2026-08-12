export interface Pro {
  id: string;
  title: string;
}

export interface Procedure {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  barColor: string;
  iconBg: string;
  iconColor: string;
  dotColor: string;
  pros: Pro[];
}

export const procedures: Procedure[] = [
  {
    id: "energy",
    title: "Energia",
    shortTitle: "Energia",
    description: "Inspeção e manutenção preventiva dos sistemas de energia, baterias, retificadores e painéis elétricos.",
    barColor: "#0ABB98",
    iconBg: "rgba(10,187,152,0.12)",
    iconColor: "#007E7A",
    dotColor: "#0ABB98",
    pros: [
      { id: "PRO-001107", title: "Manutenção Preventiva de Baterias" },
      { id: "PRO-001116", title: "Inspeção no Sistema de Energia dos Armários" },
      { id: "PRO-001125", title: "Inspeção em Retificadores 48 VCC" },
      { id: "PRO-001126", title: "Inspeção no Painel de Energia do Abrigo de Sinalização" },
    ],
  },
  {
    id: "telecom",
    title: "Telecomunicação",
    shortTitle: "Telecom",
    description: "Manutenção preventiva de equipamentos de telecomunicações, switches e sistemas multiplex.",
    barColor: "#3CB5E5",
    iconBg: "rgba(60,181,229,0.12)",
    iconColor: "#1a7ea8",
    dotColor: "#3CB5E5",
    pros: [
      { id: "PRO-001131", title: "Manutenção Preventiva Switch AFS" },
      { id: "PRO-001132", title: "Manutenção Preventiva Multiplex" },
    ],
  },
];

export function getProcedure(id: string): Procedure | undefined {
  return procedures.find((p) => p.id === id);
}

export function getPro(procedureId: string, proId: string): Pro | undefined {
  return getProcedure(procedureId)?.pros.find((p) => p.id === proId);
}
