// LoadingOverlay.tsx
import * as React from 'react';
import styles from './BatteryDashboard.module.scss';
import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner';

export const LoadingOverlay: React.FC = () => (
  <div className={styles.dashboardRoot}>
    <div className={styles.loadingOverlay}>
      <Spinner size={SpinnerSize.large} label="Carregando dados do Dashboard..." />
    </div>
  </div>
);
