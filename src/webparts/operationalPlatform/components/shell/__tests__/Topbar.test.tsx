// ============================================================================
// Topbar.test.tsx
// Testes unitários para o componente Topbar e breadcrumbs dinâmicos.
// ============================================================================

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { Topbar } from '../Topbar';
import { NavigationProvider, useNavigation } from '../../../../../contexts/NavigationContext';

describe('Topbar Component', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('não renderiza nada na rota home', () => {
    act(() => {
      ReactDOM.render(
        <NavigationProvider>
          <Topbar />
        </NavigationProvider>,
        container
      );
    });

    expect(container.innerHTML).toBe('');
  });

  it('renderiza "Voltar ao Início" na página de área e chama goBack ao clicar', () => {
    let nav: ReturnType<typeof useNavigation> | undefined;

    const TestHarness: React.FC = () => {
      nav = useNavigation();
      return <Topbar />;
    };

    act(() => {
      ReactDOM.render(
        <NavigationProvider>
          <TestHarness />
        </NavigationProvider>,
        container
      );
    });

    // Navega para área
    act(() => {
      nav?.navigateTo({ page: 'area', areaId: 'energia' });
    });

    expect(container.textContent).toContain('Voltar ao Início');

    const backButton = container.querySelector('button') as HTMLButtonElement;
    expect(backButton).toBeDefined();

    act(() => {
      backButton.click();
    });

    expect(nav?.currentRoute).toEqual({ page: 'home' });
  });

  it('renderiza breadcrumb dinâmico com o nome da área na rota de procedimento', () => {
    let nav: ReturnType<typeof useNavigation> | undefined;

    const TestHarness: React.FC = () => {
      nav = useNavigation();
      return <Topbar />;
    };

    act(() => {
      ReactDOM.render(
        <NavigationProvider>
          <TestHarness />
        </NavigationProvider>,
        container
      );
    });

    act(() => {
      nav?.navigateTo({
        page: 'procedure',
        areaId: 'energia',
        procedureId: 'manutencao-baterias',
      });
    });

    expect(container.textContent).toContain('Voltar a Energia');
  });

  it('renderiza breadcrumb dinâmico com o nome do procedimento na rota de ação', () => {
    let nav: ReturnType<typeof useNavigation> | undefined;

    const TestHarness: React.FC = () => {
      nav = useNavigation();
      return <Topbar />;
    };

    act(() => {
      ReactDOM.render(
        <NavigationProvider>
          <TestHarness />
        </NavigationProvider>,
        container
      );
    });

    act(() => {
      nav?.navigateTo({
        page: 'action',
        areaId: 'energia',
        procedureId: 'manutencao-baterias',
        action: 'dashboard',
      });
    });

    expect(container.textContent).toContain('Voltar a Manutenção Preventiva de Baterias');
  });
});
