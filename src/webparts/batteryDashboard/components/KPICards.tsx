// KPICards.tsx
import * as React from 'react';
import styles from './BatteryDashboard.module.scss';
import { Icon } from '@fluentui/react/lib/Icon';
import { DashboardSummary } from '../../../models/DashboardModels';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const batteryIcon: string = require('../assets/battery-icon.png');

export interface IKPICardsProps {
  kpis: DashboardSummary;
}

interface KPIItem {
  label: string;
  value: string | number;
  subtitle?: string;
  iconName?: string;
  imageUrl?: string;
  color: string;
}

const KPICard: React.FC<KPIItem> = ({ label, value, subtitle, iconName, imageUrl, color }) => (
  <div className={styles.kpiCard}>
    <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: 12 }}>
      <div className={styles.kpiIconWrapper} style={{ backgroundColor: imageUrl ? 'transparent' : `${color}14` }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={label}
            style={{ width: 32, height: 32, objectFit: 'contain' }}
          />
        ) : (
          <Icon iconName={iconName} styles={{ root: { fontSize: 18, color } }} />
        )}
      </div>
      {subtitle && <span className={styles.kpiSubtitle}>{subtitle}</span>}
    </div>
    <p className={styles.kpiValue}>{value}</p>
    <p className={styles.kpiLabel}>{label}</p>
  </div>
);

export const KPICards: React.FC<IKPICardsProps> = ({ kpis }) => {
  const items: KPIItem[] = [
    { label: 'Locais', value: kpis.totalLocations, iconName: 'MapPin', color: '#2563EB' },
    { label: 'Baterias', value: kpis.totalBatteries, imageUrl: batteryIcon, color: '#2563EB' },
    { label: 'Medições', value: kpis.totalMeasurements, iconName: 'ClipboardList', color: '#8B5CF6' },
    { label: 'Em Alerta', value: kpis.alertBatteries, subtitle: 'baterias', iconName: 'Warning', color: '#F97316' },
    { label: 'Críticas', value: kpis.criticalBatteries, subtitle: 'baterias', iconName: 'ErrorBadge', color: '#DC2626' },
    { label: 'Saúde Média', value: `${kpis.healthPercentage}%`, iconName: 'Heart', color: '#22C55E' },
  ];

  return (
    <div className={styles.kpiGrid}>
      {items.map((item) => (
        <KPICard key={item.label} {...item} />
      ))}
    </div>
  );
};
