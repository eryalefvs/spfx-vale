// ============================================================================
// App.tsx
// Root component da Plataforma Operacional.
// Wrapa NavigationProvider e renderiza Shell + Router de páginas.
// ============================================================================

import * as React from 'react';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import styles from './App.module.scss';
import { NavigationProvider, useNavigation } from '../../../contexts/NavigationContext';
import { ThemeProvider, useTheme } from '../../../contexts/ThemeContext';
import { Sidebar } from './shell/Sidebar';
import { Topbar } from './shell/Topbar';
import { HomePage } from './pages/HomePage';
import { AreaPage } from './pages/AreaPage';
import { ProcedurePage } from './pages/ProcedurePage';
import { PlaceholderPage } from './pages/PlaceholderPage';

// Features existentes (reutilizadas)
import { InspectionWizard } from './features/battery/inspection/InspectionWizard';
import { QuickMeasurementForm } from './features/battery/inspection/QuickMeasurementForm';
import { DashboardProvider } from '../../../contexts/DashboardContext';
import { DashboardPage } from './features/battery/dashboard/DashboardPage';
import InputBatteries from './features/battery/management/InputBatteries';

export interface IAppProps {
  context: WebPartContext;
  userDisplayName: string;
}

export const App: React.FC<IAppProps> = (props) => {
  return (
    <ThemeProvider>
      <NavigationProvider>
        {/* eslint-disable-next-line @typescript-eslint/no-use-before-define */}
        <AppShell {...props} />
      </NavigationProvider>
    </ThemeProvider>
  );
};

// ─── Shell com tema ──────────────────────────────────────────────────────────

const AppShell: React.FC<IAppProps> = (props) => {
  const { isDark } = useTheme();

  return (
    <div className={`${styles.platformRoot} ${isDark ? styles.platformRootDark : ''}`}>
      {/* eslint-disable-next-line @typescript-eslint/no-use-before-define */}
      <AppContent {...props} />
    </div>
  );
};

// ─── Content com Router ──────────────────────────────────────────────────────

const AppContent: React.FC<IAppProps> = ({ context, userDisplayName }) => {
  const { currentRoute } = useNavigation();

  const renderPage = (): React.ReactNode => {
    switch (currentRoute.page) {
      case 'home':
        return <HomePage userDisplayName={userDisplayName} context={context} />;

      case 'area':
        return <AreaPage areaId={currentRoute.areaId} />;

      case 'procedure':
        return <ProcedurePage areaId={currentRoute.areaId} procedureId={currentRoute.procedureId} />;

      case 'action': {
        const { action } = currentRoute;

        if (action === 'new-measurement') {
          return <QuickMeasurementForm />;
        }

        if (action === 'new-activity') {
          return <InspectionWizard context={context} />;
        }

        if (action === 'dashboard') {
          return (
            <DashboardProvider>
              <DashboardPage userDisplayName={userDisplayName} context={context} />
            </DashboardProvider>
          );
        }

        if (action === 'battery-management') {
          return (
            <InputBatteries
              description=""
              isDarkTheme={false}
              userDisplayName={userDisplayName}
              context={context}
            />
          );
        }

        // Ação desconhecida ou "em breve"
        return <PlaceholderPage title={action} />;
      }

      default:
        return <HomePage userDisplayName={userDisplayName} context={context} />;
    }
  };

  return (
    <div className={styles.shellLayout}>
      <Sidebar userDisplayName={userDisplayName} context={context} />
      <div className={styles.mainArea}>
        <Topbar />
        <div className={styles.contentArea}>
          {renderPage()}
        </div>
      </div>
    </div>
  );
};
