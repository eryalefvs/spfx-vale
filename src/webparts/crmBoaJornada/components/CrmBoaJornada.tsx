// ============================================================================
// CrmBoaJornada.tsx
// Componente raiz — gerencia navegação entre as views.
// ============================================================================

import * as React from 'react';
import styles from './CrmBoaJornada.module.scss';
import type { ICrmBoaJornadaProps } from './ICrmBoaJornadaProps';
import { HomePage } from './HomePage';
import { BoaJornadaForm } from './BoaJornadaForm';
import { HistoryList } from './HistoryList';
import { HistoryDetail } from './HistoryDetail';

type AppView = 'home' | 'form' | 'history' | 'detail';

interface IAppState {
  currentView: AppView;
  selectedJornadaId: number | undefined;
  userDisplayName: string;
}

const CrmBoaJornada: React.FC<ICrmBoaJornadaProps> = ({ userDisplayName }) => {
  const [state, setState] = React.useState<IAppState>({
    currentView: 'home',
    selectedJornadaId: undefined,
    userDisplayName: userDisplayName
  });

  const navigateTo = (view: AppView, jornadaId?: number): void => {
    setState({
      currentView: view,
      selectedJornadaId: jornadaId || undefined,
      userDisplayName: userDisplayName
    });
  };

  const renderView = (): React.ReactNode => {
    switch (state.currentView) {
      case 'home':
        return (
          <HomePage
            onNewJornada={() => navigateTo('form')}
            onViewHistory={() => navigateTo('history')}
            userDisplayName={userDisplayName}
          />
        );
      case 'form':
        return (
          <BoaJornadaForm
            onBack={() => navigateTo('home')}
            onSaved={() => navigateTo('home')}
          />
        );
      case 'history':
        return (
          <HistoryList
            onBack={() => navigateTo('home')}
            onSelectJornada={(id) => navigateTo('detail', id)}
          />
        );
      case 'detail':
        return (
          <HistoryDetail
            jornadaId={state.selectedJornadaId!}
            onBack={() => navigateTo('history')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.appContainer}>
      {renderView()}
    </div>
  );
};

export default CrmBoaJornada;
