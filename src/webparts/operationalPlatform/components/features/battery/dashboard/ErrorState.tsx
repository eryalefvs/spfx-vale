// ErrorState.tsx
import * as React from 'react';
import styles from './BatteryDashboard.module.scss';
import { PrimaryButton } from '@fluentui/react/lib/Button';
import { Icon } from '@fluentui/react/lib/Icon';

export interface IErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<IErrorStateProps> = ({ message, onRetry }) => (
  <div className={styles.dashboardRoot}>
    <div className={styles.errorState}>
      <Icon iconName="ErrorBadge" styles={{ root: { fontSize: 48, color: '#DC2626', marginBottom: 16 } }} />
      <p className={styles.emptyTitle} style={{ color: '#DC2626' }}>Erro ao carregar Dashboard</p>
      <p className={styles.emptySubtitle}>{message}</p>
      {onRetry && (
        <PrimaryButton
          text="Tentar Novamente"
          onClick={onRetry}
          styles={{ root: { marginTop: 16, borderRadius: 8, backgroundColor: '#2563EB', borderColor: '#2563EB' } }}
        />
      )}
    </div>
  </div>
);
