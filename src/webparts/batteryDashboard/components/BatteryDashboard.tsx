// ============================================================================
// BatteryDashboard.tsx
// Componente root do Dashboard. Wrapa o DashboardProvider e renderiza a page.
// ============================================================================

import * as React from 'react';
import { IBatteryDashboardProps } from './IBatteryDashboardProps';
import { DashboardProvider } from '../../../contexts/DashboardContext';
import { DashboardPage } from './DashboardPage';

const BatteryDashboard: React.FC<IBatteryDashboardProps> = (props) => {
  return (
    <DashboardProvider>
      <DashboardPage
        userDisplayName={props.userDisplayName}
        context={props.context}
      />
    </DashboardProvider>
  );
};

export default BatteryDashboard;
