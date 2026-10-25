// ============================================================================
// Sidebar.test.tsx
// Testes unitários para o componente Sidebar (navegação, toggle e temas).
// ============================================================================

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { Sidebar } from '../Sidebar';
import { NavigationProvider, useNavigation } from '../../../../../contexts/NavigationContext';
import { ThemeProvider, useTheme } from '../../../../../contexts/ThemeContext';

describe('Sidebar Component', () => {
  let container: HTMLDivElement;

  const mockContext: any = {
    pageContext: {
      user: { displayName: 'Eryalef Vieira' },
      web: { absoluteUrl: 'https://tenant.sharepoint.com/sites/vale' },
    },
    msGraphClientFactory: {
      getClient: jest.fn().mockResolvedValue({
        api: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ mail: 'eryalef.vieira@vale.com' }),
          }),
        }),
      }),
    },
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    localStorage.clear();
  });

  afterEach(() => {
    document.body.removeChild(container);
    localStorage.clear();
  });

  it('renderiza o nome do usuário, iniciais e botão de Início', () => {
    act(() => {
      ReactDOM.render(
        <ThemeProvider>
          <NavigationProvider>
            <Sidebar userDisplayName="Eryalef Vieira" context={mockContext} />
          </NavigationProvider>
        </ThemeProvider>,
        container
      );
    });

    expect(container.textContent).toContain('Eryalef Vieira');
    expect(container.textContent).toContain('Início');
    expect(container.textContent).toContain('Energia');
    expect(container.textContent).toContain('Telecomunicação');
  });

  it('alterna o estado recolhido/expandido ao clicar no botão de colapso', () => {
    act(() => {
      ReactDOM.render(
        <ThemeProvider>
          <NavigationProvider>
            <Sidebar userDisplayName="Eryalef Vieira" context={mockContext} />
          </NavigationProvider>
        </ThemeProvider>,
        container
      );
    });

    const collapseBtn = container.querySelector('button[title="Recolher sidebar"]') as HTMLButtonElement;
    expect(collapseBtn).toBeDefined();

    act(() => {
      collapseBtn.click();
    });

    expect(localStorage.getItem('sidebar-collapsed')).toBe('true');
  });

  it('alterna o tema claro/escuro ao clicar no botão de tema', () => {
    act(() => {
      ReactDOM.render(
        <ThemeProvider>
          <NavigationProvider>
            <Sidebar userDisplayName="Eryalef Vieira" context={mockContext} />
          </NavigationProvider>
        </ThemeProvider>,
        container
      );
    });

    const themeBtn = container.querySelector('button[title="Mudar para modo escuro"]') as HTMLButtonElement;
    expect(themeBtn).toBeDefined();

    act(() => {
      themeBtn.click();
    });

    expect(localStorage.getItem('platform-theme')).toBe('dark');
  });
});
