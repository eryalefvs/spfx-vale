// BatteryEvolutionTable.tsx — Tabela pivoteada de evolução de tensão/resistência por bateria
import * as React from 'react';
import styles from './BatteryDashboard.module.scss';
import { Battery, Measurement } from '../../../models/DashboardModels';
import { getBatteryEvolution, BatteryEvolutionRow, getUniqueBankNumbers } from '../../../utils/dashboardUtils';
import { Icon } from '@fluentui/react/lib/Icon';
import { RESISTANCE_THRESHOLDS, VOLTAGE_THRESHOLDS } from '../../../constants/DashboardConstants';

export interface IBatteryEvolutionTableProps {
  batteries: Battery[];
  measurements: Measurement[];
  onSelectBattery: (serialNumber: string) => void;
}

type MetricType = 'resistance' | 'voltage';

/** Formata ISO date string para DD/MM */
function shortDate(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length === 3) return parts[2] + '/' + parts[1];
  return isoDate;
}

/** Retorna indicador visual de delta */
function getDeltaIndicator(current: number, previous: number, metric: MetricType): { arrow: string; color: string } {
  const diff = current - previous;
  if (Math.abs(diff) < 0.1) return { arrow: '', color: 'var(--text-muted)' };

  if (metric === 'resistance') {
    // Resistência subindo = ruim
    if (diff > 0.5) return { arrow: ' ↑↑', color: 'var(--danger)' };
    if (diff > 0) return { arrow: ' ↑', color: 'var(--warning)' };
    return { arrow: ' ↓', color: 'var(--success)' };
  } else {
    // Tensão caindo = ruim
    if (diff < -0.5) return { arrow: ' ↓↓', color: 'var(--danger)' };
    if (diff < 0) return { arrow: ' ↓', color: 'var(--warning)' };
    return { arrow: ' ↑', color: 'var(--success)' };
  }
}

/** Retorna cor de fundo baseada no valor e limites */
function getCellBgColor(value: number, metric: MetricType): string {
  if (metric === 'resistance') {
    if (value <= RESISTANCE_THRESHOLDS.excellentMax) return 'var(--success-light)';
    if (value <= RESISTANCE_THRESHOLDS.alertMax) return 'var(--warning-light)';
    return 'var(--danger-light)';
  } else {
    if (value >= VOLTAGE_THRESHOLDS.excellentMin && value <= VOLTAGE_THRESHOLDS.maxAcceptable) return 'var(--success-light)';
    if (value >= VOLTAGE_THRESHOLDS.alertMin) return 'var(--warning-light)';
    return 'var(--danger-light)';
  }
}

/** Retorna badge de tendência */
function getTrendBadge(trend: BatteryEvolutionRow['trend'], delta: number, metric: MetricType): { label: string; icon: string; color: string; bg: string } {
  if (trend === 'stable') {
    return { label: 'Estável', icon: '✅', color: 'var(--success)', bg: 'var(--success-light)' };
  }
  if (trend === 'rising') {
    const sign = delta > 0 ? '+' : '';
    return {
      label: metric === 'resistance' ? 'Subindo (' + sign + delta + ')' : 'Caindo (' + sign + delta + ')',
      icon: '⚠️',
      color: 'var(--warning)',
      bg: 'var(--warning-light)',
    };
  }
  // critical
  const sign = delta > 0 ? '+' : '';
  return {
    label: metric === 'resistance' ? 'Crítico (' + sign + delta + ')' : 'Crítico (' + sign + delta + ')',
    icon: '🔴',
    color: 'var(--danger)',
    bg: 'var(--danger-light)',
  };
}

export const BatteryEvolutionTable: React.FC<IBatteryEvolutionTableProps> = ({
  batteries, measurements, onSelectBattery,
}) => {
  const [metric, setMetric] = React.useState<MetricType>('resistance');
  const [selectedBank, setSelectedBank] = React.useState<number | undefined>();

  const banks = React.useMemo(() => getUniqueBankNumbers(batteries), [batteries]);

  // Filtrar baterias por banco
  const filteredBatteries = React.useMemo(() => {
    if (selectedBank === undefined) return batteries;
    return batteries.filter((b) => b.bankNumber === selectedBank);
  }, [batteries, selectedBank]);

  // Dados de evolução
  const evolution = React.useMemo(
    () => getBatteryEvolution(filteredBatteries, measurements),
    [filteredBatteries, measurements]
  );

  if (evolution.rows.length === 0) return null;

  return (
    <div className={styles.chartCard} style={{ gridColumn: '1 / -1', marginBottom: "1rem" }}>
      {/* Header */}
      <div className={styles.chartCardHeader}>
        <div>
          <p className={styles.chartCardTitle}>
            <Icon iconName="LineChart" styles={{ root: { marginRight: 8 } }} />
            Evolução por Bateria
          </p>
          <p className={styles.chartCardSubtitle}>
            {metric === 'resistance' ? 'Resistência (Ω)' : 'Tensão (V)'} · {evolution.dates.length} medições · {evolution.rows.length} baterias
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Bank filter */}
          {banks.length > 1 && (
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                className={styles.toggleBtn}
                style={selectedBank === undefined ? { backgroundColor: 'var(--accent-light)', borderColor: 'var(--accent)', color: 'var(--accent)' } : {}}
                onClick={() => setSelectedBank(undefined)}
              >
                Todos
              </button>
              {banks.map((b) => (
                <button
                  key={b}
                  className={styles.toggleBtn}
                  style={selectedBank === b ? { backgroundColor: 'var(--accent-light)', borderColor: 'var(--accent)', color: 'var(--accent)' } : {}}
                  onClick={() => setSelectedBank(b)}
                >
                  Banco {b}
                </button>
              ))}
            </div>
          )}

          {/* Metric toggle */}
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className={styles.toggleBtn}
              style={metric === 'resistance' ? { backgroundColor: '#FFF7ED', borderColor: '#F97316', color: '#F97316' } : {}}
              onClick={() => setMetric('resistance')}
            >
              Resistência
            </button>
            <button
              className={styles.toggleBtn}
              style={metric === 'voltage' ? { backgroundColor: '#EFF6FF', borderColor: '#2563EB', color: '#2563EB' } : {}}
              onClick={() => setMetric('voltage')}
            >
              Tensão
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Bateria</th>
              <th>Banco</th>
              {evolution.dates.map((d) => (
                <th key={d} style={{ textAlign: 'center', minWidth: 70 }}>{shortDate(d)}</th>
              ))}
              <th style={{ minWidth: 130 }}>Tendência</th>
            </tr>
          </thead>
          <tbody>
            {evolution.rows.map((row) => {
              const delta = metric === 'resistance' ? row.resistanceDelta : row.voltageDelta;
              const trendBadge = getTrendBadge(row.trend, delta, metric);

              return (
                <tr
                  key={row.batteryId}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelectBattery(row.serialNumber)}
                >
                  <td style={{ fontWeight: 600, fontSize: '0.75rem' }}>{row.serialNumber}</td>
                  <td style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>B{row.bankNumber}</td>
                  {evolution.dates.map((date, colIdx) => {
                    const entry = row.values.find((v) => v.date === date);
                    if (!entry) {
                      return <td key={date} style={{ textAlign: 'center', color: 'var(--text-subtle)' }}>-</td>;
                    }

                    const value = metric === 'resistance' ? entry.resistance : entry.voltage;
                    const bgColor = getCellBgColor(value, metric);

                    // Calcular delta visual vs anterior
                    let indicator = { arrow: '', color: 'var(--text-muted)' };
                    if (colIdx > 0) {
                      const prevEntry = row.values.find((v) => v.date === evolution.dates[colIdx - 1]);
                      if (prevEntry) {
                        const prevVal = metric === 'resistance' ? prevEntry.resistance : prevEntry.voltage;
                        indicator = getDeltaIndicator(value, prevVal, metric);
                      }
                    }

                    return (
                      <td
                        key={date}
                        style={{
                          textAlign: 'center',
                          backgroundColor: bgColor,
                          fontWeight: 600,
                          fontSize: '0.78rem',
                        }}
                      >
                        {value.toFixed(1)}
                        {indicator.arrow && (
                          <span style={{ color: indicator.color, fontSize: '0.7rem' }}>{indicator.arrow}</span>
                        )}
                      </td>
                    );
                  })}
                  <td>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: 6,
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        backgroundColor: trendBadge.bg,
                        color: trendBadge.color,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {trendBadge.icon} {trendBadge.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
