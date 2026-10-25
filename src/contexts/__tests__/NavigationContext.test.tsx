// ============================================================================
// NavigationContext.test.tsx
// Testes unitários para NavigationContext, histórico de rotas e catálogo.
// ============================================================================

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import {
  NavigationProvider,
  useNavigation,
  getArea,
  getProcedure,
  AREAS_CATALOG,
  Route,
} from '../NavigationContext';

describe('NavigationContext & Catálogo de Procedimentos', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('getArea e getProcedure localizam definições no catálogo', () => {
    const area = getArea('energia');
    expect(area).toBeDefined();
    expect(area?.name).toBe('Energia');

    const proc = getProcedure('energia', 'manutencao-baterias');
    expect(proc).toBeDefined();
    expect(proc?.code).toBe('PRO-001107');

    expect(getArea('inexistente')).toBeUndefined();
    expect(getProcedure('energia', 'inexistente')).toBeUndefined();
  });

  it('inicia na rota home, navega para novas rotas e retrocede com goBack', () => {
    let currentNav: ReturnType<typeof useNavigation> | undefined;

    const TestConsumer: React.FC = () => {
      currentNav = useNavigation();
      return <div>Rota atual: {currentNav.currentRoute.page}</div>;
    };

    act(() => {
      ReactDOM.render(
        <NavigationProvider>
          <TestConsumer />
        </NavigationProvider>,
        container
      );
    });

    // 1. Estado inicial
    expect(currentNav?.currentRoute).toEqual({ page: 'home' });

    // 2. Navegar para uma área
    act(() => {
      currentNav?.navigateTo({ page: 'area', areaId: 'energia' });
    });
    expect(currentNav?.currentRoute).toEqual({ page: 'area', areaId: 'energia' });

    // 3. Navegar para um procedimento
    act(() => {
      currentNav?.navigateTo({
        page: 'procedure',
        areaId: 'energia',
        procedureId: 'manutencao-baterias',
      });
    });
    expect(currentNav?.currentRoute).toEqual({
      page: 'procedure',
      areaId: 'energia',
      procedureId: 'manutencao-baterias',
    });

    // 4. Retroceder com goBack para a área
    act(() => {
      currentNav?.goBack();
    });
    expect(currentNav?.currentRoute).toEqual({ page: 'area', areaId: 'energia' });

    // 5. Retroceder com goBack para home
    act(() => {
      currentNav?.goBack();
    });
    expect(currentNav?.currentRoute).toEqual({ page: 'home' });

    // 6. goBack no topo do histórico não causa efeito colateral
    act(() => {
      currentNav?.goBack();
    });
    expect(currentNav?.currentRoute).toEqual({ page: 'home' });
  });

  it('lança erro ao consumir useNavigation fora do Provider', () => {
    // Silencia o console.error do React para este teste esperado
    const originalError = console.error;
    console.error = jest.fn();

    const InvalidConsumer: React.FC = () => {
      useNavigation();
      return null;
    };

    expect(() => {
      ReactDOM.render(<InvalidConsumer />, container);
    }).toThrow('useNavigation must be used within a NavigationProvider');

    console.error = originalError;
  });
});
