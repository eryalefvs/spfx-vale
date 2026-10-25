// ============================================================================
// NavigationContext.tsx
// Roteamento baseado em state para a Plataforma Operacional.
// Gerencia a rota atual e funções de navegação (navigateTo, goBack).
// ============================================================================

import * as React from 'react';

// ─── Tipos de Rota ───────────────────────────────────────────────────────────

export type Route =
  | { page: 'home' }
  | { page: 'area'; areaId: string }
  | { page: 'procedure'; areaId: string; procedureId: string }
  | { page: 'action'; areaId: string; procedureId: string; action: string };

// ─── Definição de Área ───────────────────────────────────────────────────────

export interface AreaDefinition {
  id: string;
  name: string;
  description: string;
  icon: string; // Fluent UI icon name
  procedures: ProcedureDefinition[];
}

export interface ProcedureDefinition {
  id: string;
  code: string; // ex: PRO-001107
  name: string;
  actions: ActionDefinition[];
}

export interface ActionDefinition {
  id: string;
  label: string;
  description: string;
  icon: string; // Fluent UI icon name
  enabled: boolean;
}

// ─── Catálogo de Áreas & Procedimentos ───────────────────────────────────────

export const AREAS_CATALOG: AreaDefinition[] = [
  {
    id: 'energia',
    name: 'Energia',
    description: 'Inspeção e manutenção preventiva dos sistemas de energia, baterias, retificadores e painéis elétricos.',
    icon: 'LightningBolt',
    procedures: [
      {
        id: 'manutencao-baterias',
        code: 'PRO-001107',
        name: 'Manutenção Preventiva de Baterias',
        actions: [
          {
            id: 'new-measurement',
            label: 'Nova Medição Avulsa',
            description: 'Registrar uma medição avulsa de baterias em campo.',
            icon: 'Add',
            enabled: true,
          },
          {
            id: 'new-activity',
            label: 'RG PRO 001107',
            description: 'Iniciar e registrar RG de Manutenção de Baterias',
            icon: 'Add',
            enabled: true,
          },
          {
            id: 'dashboard',
            label: 'Dashboard',
            description: 'Métricas, gráficos e indicadores de desempenho',
            icon: 'BarChartVertical',
            enabled: true,
          },
          {
            id: 'battery-management',
            label: 'Cadastro de Baterias',
            description: 'Inserir e gerenciar baterias nos locais',
            icon: 'EntitlementRedemption',
            enabled: true,
          },
          {
            id: 'records',
            label: 'Registros',
            description: 'Histórico completo de atividades realizadas',
            icon: 'DocumentSet',
            enabled: false, // Em breve
          },
        ],
      },

      {
        id: 'manutencao-energia-armarios',
        code: 'PRO-001116',
        name: 'Inspeção nos Sistemas de Energia dos Armários',
        actions: [],
      },

      {
        id: 'inspecao-retificadores',
        code: 'PRO-001125',
        name: 'Inspeção em Retificadores 48 VCC',
        actions: [],
      },

      {
        id: 'plano-periodico-spda',
        code: 'PRO-018910',
        name: 'Plano Periódico do SPDA',
        actions: [],
      },
    ],
  },
  {
    id: 'telecom',
    name: 'Telecomunicação',
    description: 'Manutenção preventiva de equipamentos de telecomunicações, switches e sistemas multiplex.',
    icon: 'WifiEthernet',
    procedures: [
      {
        id: 'manutencao-preventiva-switch-afs',
        code: 'PRO-001131',
        name: 'Manutenção Preventiva de Switch AFS',
        actions: [],
      },
      {
        id: 'manutencao-preventiva-multiplex',
        code: 'PRO-001131',
        name: 'Manutenção Preventiva de Multiplex',
        actions: [],
      },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getArea(areaId: string): AreaDefinition | undefined {
  return AREAS_CATALOG.find((a) => a.id === areaId);
}

export function getProcedure(areaId: string, procedureId: string): ProcedureDefinition | undefined {
  const area = getArea(areaId);
  return area?.procedures.find((p) => p.id === procedureId);
}

// ─── Interface do Context ────────────────────────────────────────────────────

export interface INavigationContext {
  currentRoute: Route;
  navigateTo: (route: Route) => void;
  goBack: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NavigationContext = React.createContext<INavigationContext>(undefined as any);

export function useNavigation(): INavigationContext {
  const context = React.useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export interface NavigationProviderProps {
  children: React.ReactNode;
}

export function NavigationProvider(props: NavigationProviderProps): React.ReactElement {
  const { children } = props;
  const [history, setHistory] = React.useState<Route[]>([{ page: 'home' }]);

  const currentRoute = history[history.length - 1];

  const navigateTo = React.useCallback((route: Route) => {
    setHistory((prev) => [...prev, route]);
  }, []);

  const goBack = React.useCallback(() => {
    setHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const value = React.useMemo<INavigationContext>(
    () => ({ currentRoute, navigateTo, goBack }),
    [currentRoute, navigateTo, goBack]
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}
