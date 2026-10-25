// ============================================================================
// App.test.tsx
// Testes unitários para o componente raiz App e o roteador de páginas.
// ============================================================================

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { App } from '../App';

describe('App Root Component & Router', () => {
  let container: HTMLDivElement;

  const mockContext: any = {
    pageContext: {
      user: { displayName: 'Eryalef Vieira' },
    },
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    localStorage.clear();
  });

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(container);
    document.body.removeChild(container);
    localStorage.clear();
  });

  it('renderiza o shell completo (Sidebar, Topbar) e a HomePage por padrão', () => {
    act(() => {
      ReactDOM.render(
        <App context={mockContext} userDisplayName="Eryalef Vieira" />,
        container
      );
    });

    expect(container.querySelector('aside')).not.toBeNull();
    expect(container.innerHTML).toContain('Eryalef Vieira');
    expect(container.innerHTML).toContain('ÁREAS DE PROCEDIMENTO');
  });

  it('apresenta a tela inicial com saudação personalizada e áreas operacionais', () => {
    act(() => {
      ReactDOM.render(
        <App context={mockContext} userDisplayName="Eryalef Vieira" />,
        container
      );
    });

    expect(container.innerHTML).toContain('Olá, Eryalef');
    expect(container.innerHTML).toContain('Energia');
    expect(container.innerHTML).toContain('Telecomunicação');
  });
});
