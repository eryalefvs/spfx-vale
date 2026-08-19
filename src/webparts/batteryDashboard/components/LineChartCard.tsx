// LineChartCard.tsx
import * as React from 'react';
import styles from './BatteryDashboard.module.scss';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';

export interface ILineChartCardProps {
  title: string;
  subtitle?: string;
  data: Array<{ date: string; value: number }>;
  dataKey: string;
  color: string;
  unit?: string;
  referenceValue?: number;
  height?: number;
}

export const LineChartCard: React.FC<ILineChartCardProps> = ({
  title, subtitle, data, dataKey, color, unit = '', referenceValue, height = 200,
}) => {
  const tickStyle = { fontSize: 11, fill: '#94A3B8' };
  const interval = data.length <= 8 ? 0 : Math.ceil(data.length / 8) - 1;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <p className={styles.cardTitle}>{title}</p>
        {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
      </div>
      <div style={{ padding: '0 8px 16px' }}>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="date"
              tick={tickStyle}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: string) => v.slice(5)}
              interval={interval}
            />
            <YAxis
              tick={tickStyle}
              tickLine={false}
              axisLine={false}
              domain={['dataMin - 0.1', 'dataMax + 0.1']}
            />
            <Tooltip
              formatter={(value: number) => [value.toFixed(2) + (unit || ''), title]}
              contentStyle={{
                fontSize: '0.75rem', borderRadius: 8, border: 'none',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              }}
              labelStyle={{
                color: '#000000ff', // Força a data a ficar visível
                fontWeight: 600,
                marginBottom: '4px',
              }}
              itemStyle={{
                color: '#0f172a', // Força o texto de tensão total a ficar visível
                padding: 0,
              }}
            />
            {referenceValue !== undefined ? (
              <ReferenceLine y={referenceValue} stroke={color} strokeDasharray="4 4" strokeOpacity={0.5} />
            ) : null}
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
              name={title}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
