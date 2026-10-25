// MultiLineChartCard.tsx — Gráfico de linha com múltiplas séries (um por banco)
import * as React from 'react';
import styles from './BatteryDashboard.module.scss';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';

export interface IMultiLineChartCardProps {
  title: string;
  subtitle?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  lines: Array<{ dataKey: string; label: string; color: string }>;
  unit?: string;
  height?: number;
}

const BANK_COLORS = ['#2563EB', '#F97316', '#10B981', '#8B5CF6'];

export const MultiLineChartCard: React.FC<IMultiLineChartCardProps> = ({
  title, subtitle, data, lines, unit = '', height = 200,
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
              formatter={(value: number, name: string) => {
                const line = lines.find((l) => l.dataKey === name);
                return [value.toFixed(2) + (unit || ''), line ? line.label : name];
              }}
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
            <Legend
              formatter={(value) => {
                const line = lines.find((l) => l.dataKey === value);
                return line ? line.label : value;
              }}
              wrapperStyle={{ fontSize: '0.72rem' }}
            />
            {lines.map((line, idx) => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.color || BANK_COLORS[idx % BANK_COLORS.length]}
                strokeWidth={2}
                dot={false}
                name={line.dataKey}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
