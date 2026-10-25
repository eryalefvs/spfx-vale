// ============================================================================
// Pages.test.tsx
// Testes unitários para as páginas da Plataforma Operacional:
// HomePage, AreaPage, ProcedurePage e PlaceholderPage.
// ============================================================================

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { HomePage } from '../HomePage';
import { AreaPage } from '../AreaPage';
import { ProcedurePage } from '../ProcedurePage';
import { PlaceholderPage } from '../PlaceholderPage';
import { NavigationProvider, useNavigation } from '../../../../../contexts/NavigationContext';
import { DashboardService } from '../../../../../services/DashboardService';

describe('Páginas da Plataforma Operacional', () => {
  let container: HTMLDivElement;

  const mockContext: any = {
    pageContext: {
      user: { displayName: 'Eryalef Vieira' },
    },
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    jest.spyOn(DashboardService, 'loadAllData').mockResolvedValue({
      locations: [],
      batteries: [],
      measurements: [],
      activities: [
        { id: 1 } as any,
        { id: 2 } as any,
      ],
      sedes: [],
    });
  });

  afterEach(() => {
    document.body.removeChild(container);
    jest.restoreAllMocks();
  });

  describe('HomePage', () => {
    it('renderiza saudação com primeiro nome e cards de áreas do catálogo', async () => {
      await act(async () => {
        ReactDOM.render(
          <NavigationProvider>
            <HomePage userDisplayName="Eryalef Vieira" context={mockContext} />
          </NavigationProvider>,
          container
        );
      });

      expect(container.textContent).toContain('Olá, Eryalef.');
      expect(container.textContent).toContain('O que vamos fazer hoje?');
      expect(container.textContent).toContain('TOTAL DE ATIVIDADES');
      expect(container.textContent).toContain('Energia');
      expect(container.textContent).toContain('Telecomunicação');
    });

    it('ao clicar em um card de área, navega para a página da área', async () => {
      let nav: ReturnType<typeof useNavigation> | undefined;

      const Harness: React.FC = () => {
        nav = useNavigation();
        return <HomePage userDisplayName="Eryalef Vieira" context={mockContext} />;
      };

      await act(async () => {
        ReactDOM.render(
          <NavigationProvider>
            <Harness />
          </NavigationProvider>,
          container
        );
      });

      const areaCards = container.querySelectorAll('button');
      // Encontrar card de Energia
      let energiaBtn: HTMLButtonElement | undefined;
      areaCards.forEach((btn) => {
        if (btn.textContent?.includes('Energia')) energiaBtn = btn;
      });

      expect(energiaBtn).toBeDefined();

      act(() => {
        energiaBtn?.click();
      });

      expect(nav?.currentRoute).toEqual({ page: 'area', areaId: 'energia' });
    });
  });

  describe('AreaPage', () => {
    it('renderiza os procedimentos da área de Energia', () => {
      act(() => {
        ReactDOM.render(
          <NavigationProvider>
            <AreaPage areaId="energia" />
          </NavigationProvider>,
          container
        );
      });

      expect(container.textContent).toContain('Energia');
      expect(container.textContent).toContain('PRO-001107');
      expect(container.textContent).toContain('Manutenção Preventiva de Baterias');
    });

    it('exibe estado de erro amigável se a área não existir', () => {
      act(() => {
        ReactDOM.render(
          <NavigationProvider>
            <AreaPage areaId="area_invalida" />
          </NavigationProvider>,
          container
        );
      });

      expect(container.textContent).toContain('Área não encontrada');
    });
  });

  describe('ProcedurePage', () => {
    it('renderiza código, título e ações disponíveis do procedimento', () => {
      act(() => {
        ReactDOM.render(
          <NavigationProvider>
            <ProcedurePage areaId="energia" procedureId="manutencao-baterias" />
          </NavigationProvider>,
          container
        );
      });

      expect(container.textContent).toContain('PRO-001107');
      expect(container.textContent).toContain('Manutenção Preventiva de Baterias');
      expect(container.textContent).toContain('Nova Medição Avulsa');
      expect(container.textContent).toContain('RG PRO 001107');
      expect(container.textContent).toContain('Dashboard');
      expect(container.textContent).toContain('Cadastro de Baterias');
      expect(container.textContent).toContain('Em breve'); // Ação "Registros" desabilitada
    });

    it('ao clicar em ação habilitada, navega para a rota de ação', () => {
      let nav: ReturnType<typeof useNavigation> | undefined;

      const Harness: React.FC = () => {
        nav = useNavigation();
        return <ProcedurePage areaId="energia" procedureId="manutencao-baterias" />;
      };

      act(() => {
        ReactDOM.render(
          <NavigationProvider>
            <Harness />
          </NavigationProvider>,
          container
        );
      });

      const buttons = container.querySelectorAll('button');
      let dashBtn: HTMLButtonElement | undefined;
      buttons.forEach((btn) => {
        if (btn.textContent?.includes('Dashboard')) dashBtn = btn;
      });

      expect(dashBtn).toBeDefined();

      act(() => {
        dashBtn?.click();
      });

      expect(nav?.currentRoute).toEqual({
        page: 'action',
        areaId: 'energia',
        procedureId: 'manutencao-baterias',
        action: 'dashboard',
      });
    });

    it('não navega ao clicar em ação desabilitada (Em breve)', () => {
      let nav: ReturnType<typeof useNavigation> | undefined;

      const Harness: React.FC = () => {
        nav = useNavigation();
        return <ProcedurePage areaId="energia" procedureId="manutencao-baterias" />;
      };

      act(() => {
        ReactDOM.render(
          <NavigationProvider>
            <Harness />
          </NavigationProvider>,
          container
        );
      });

      const initialRoute = nav?.currentRoute;

      const buttons = container.querySelectorAll('button');
      let recordsBtn: HTMLButtonElement | undefined;
      buttons.forEach((btn) => {
        if (btn.textContent?.includes('Registros')) recordsBtn = btn;
      });

      expect(recordsBtn).toBeDefined();

      act(() => {
        recordsBtn?.click();
      });

      // Permanece na mesma rota
      expect(nav?.currentRoute).toEqual(initialRoute);
    });
  });

  describe('PlaceholderPage', () => {
    it('renderiza título personalizado e botão de voltar', () => {
      let nav: ReturnType<typeof useNavigation> | undefined;

      const Harness: React.FC = () => {
        nav = useNavigation();
        return <PlaceholderPage title="Funcionalidade X" />;
      };

      act(() => {
        ReactDOM.render(
          <NavigationProvider>
            <Harness />
          </NavigationProvider>,
          container
        );
      });

      // Simula histórico prévio
      act(() => {
        nav?.navigateTo({ page: 'area', areaId: 'energia' });
      });

      expect(container.textContent).toContain('Em breve');
      expect(container.textContent).toContain('Funcionalidade X');

      const backBtn = container.querySelector('button') as HTMLButtonElement;
      expect(backBtn).toBeDefined();

      act(() => {
        backBtn.click();
      });

      expect(nav?.currentRoute).toEqual({ page: 'home' });
    });
  });
});
