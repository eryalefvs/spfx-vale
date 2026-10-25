// PieChartCard.tsx
import * as React from 'react';
import styles from './BatteryDashboard.module.scss';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
} from 'recharts';

export interface IPieChartCardProps {
  title: string;
  subtitle?: string;
  data: Array<{ name: string; value: number; color: string }>;
  height?: number;
}

export const PieChartCard: React.FC<IPieChartCardProps> = ({
  title, subtitle, data, height = 180,
}) => {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <p className={styles.cardTitle}>{title}</p>
        {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
      </div>
      <div style={{ padding: '0 16px' }}>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={76}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                fontSize: '0.75rem', borderRadius: 8, border: 'none',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 16 }}>
          {data.map((s) => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: s.color }} />
                <span style={{ fontSize: '0.8rem', color: '#475569' }}>{s.name}</span>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0F172A' }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
