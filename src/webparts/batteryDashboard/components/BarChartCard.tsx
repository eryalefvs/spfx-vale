// BarChartCard.tsx
import * as React from 'react';
import styles from './BatteryDashboard.module.scss';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell,
} from 'recharts';

export interface IBarChartCardProps {
  title: string;
  subtitle?: string;
  data: Array<{ label: string;[key: string]: string | number }>;
  dataKey: string;
  nameKey: string;
  unit?: string;
  layout?: 'horizontal' | 'vertical';
  height?: number;
  color?: string;
}

export const BarChartCard: React.FC<IBarChartCardProps> = ({
  title, subtitle, data, dataKey, nameKey, unit = '', layout = 'horizontal', height = 220, color = '#2563EB',
}) => {
  const tickStyle = { fontSize: 10, fill: '#94A3B8' };
  const isVertical = layout === 'vertical';

  const margin = isVertical
    ? { top: 0, right: 16, left: 10, bottom: 0 }
    : { top: 4, right: 4, left: -20, bottom: 0 };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <p className={styles.cardTitle}>{title}</p>
        {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
      </div>
      <div style={{ padding: '0 16px 16px' }}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            layout={isVertical ? 'vertical' : 'horizontal'}
            margin={margin}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#F1F5F9"
              horizontal={!isVertical}
              vertical={isVertical}
            />
            {isVertical ? (
              <>
                <XAxis type="number" tick={tickStyle} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey={nameKey} tick={tickStyle} tickLine={false} axisLine={false} width={130} />
              </>
            ) : (
              <>
                <XAxis dataKey={nameKey} tick={tickStyle} tickLine={false} axisLine={false} />
                <YAxis tick={tickStyle} tickLine={false} axisLine={false} />
              </>
            )}
            <Tooltip
              formatter={(value: number) => [value.toFixed(2) + (unit || ''), dataKey]}
              contentStyle={{
                fontSize: '0.75rem', borderRadius: 8, border: 'none',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              }}
              labelStyle={{
                color: '#000000ff', // Força o número de série (ESB-WI ...) a ficar visível/cinza escuro
                fontWeight: 600,
                marginBottom: '4px',
              }}
              itemStyle={{
                color: '#0f172a', // Força o texto 'voltage : 13.85V' a ficar preto/escuro
                padding: 0,
              }}
            />
            <Bar dataKey={dataKey} radius={isVertical ? [0, 4, 4, 0] : [4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={'cell-' + index} fill={(entry as Record<string, string>).fill || color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
