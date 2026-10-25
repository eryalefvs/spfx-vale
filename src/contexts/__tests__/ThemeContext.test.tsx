// ============================================================================
// ThemeContext.test.tsx
// Testes unitários para ThemeContext e persistência de preferência via localStorage.
// ============================================================================

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { ThemeProvider, useTheme } from '../ThemeContext';

describe('ThemeContext', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    localStorage.clear();
  });

  afterEach(() => {
    document.body.removeChild(container);
    localStorage.clear();
  });

  it('inicia no modo claro por padrão e alterna para escuro persistindo no localStorage', () => {
    let currentTheme: ReturnType<typeof useTheme> | undefined;

    const TestConsumer: React.FC = () => {
      currentTheme = useTheme();
      return <div>Tema: {currentTheme.isDark ? 'escuro' : 'claro'}</div>;
    };

    act(() => {
      ReactDOM.render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
        container
      );
    });

    expect(currentTheme?.isDark).toBe(false);

    // Alternar tema
    act(() => {
      currentTheme?.toggleTheme();
    });

    expect(currentTheme?.isDark).toBe(true);
    expect(localStorage.getItem('platform-theme')).toBe('dark');

    // Alternar novamente
    act(() => {
      currentTheme?.toggleTheme();
    });

    expect(currentTheme?.isDark).toBe(false);
    expect(localStorage.getItem('platform-theme')).toBe('light');
  });

  it('carrega preferência salva previamente no localStorage', () => {
    localStorage.setItem('platform-theme', 'dark');

    let currentTheme: ReturnType<typeof useTheme> | undefined;

    const TestConsumer: React.FC = () => {
      currentTheme = useTheme();
      return null;
    };

    act(() => {
      ReactDOM.render(
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>,
        container
      );
    });

    expect(currentTheme?.isDark).toBe(true);
  });
});
