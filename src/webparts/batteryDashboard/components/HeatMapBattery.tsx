// HeatMapBattery.tsx
import * as React from 'react';
import styles from './BatteryDashboard.module.scss';
import { Battery, Measurement, Location, BatteryLastReading } from '../../../models/DashboardModels';
import { getBatteryLastReadings, getStatusColor, getStatusLabel, formatDate } from '../../../utils/dashboardUtils';
import { STATUS_COLORS } from '../../../constants/DashboardConstants';
import { TooltipHost } from '@fluentui/react/lib/Tooltip';

export interface IHeatMapBatteryProps {
  batteries: Battery[];
  measurements: Measurement[];
  locations: Location[];
  onSelectBattery: (serialNumber: string) => void;
}

export const HeatMapBattery: React.FC<IHeatMapBatteryProps> = ({
  batteries, measurements, locations, onSelectBattery,
}) => {
  const lastReadings = React.useMemo(
    () => getBatteryLastReadings(batteries, measurements),
    [batteries, measurements]
  );

  // Agrupar por banco (compatível com ES5 — sem Map iterator)
  const bankGroups = React.useMemo(() => {
    const groups: Record<number, BatteryLastReading[]> = {};
    lastReadings.forEach((r) => {
      const bank = r.battery.bankNumber;
      if (!groups[bank]) groups[bank] = [];
      groups[bank].push(r);
    });
    const bankNumbers = Object.keys(groups).map(Number).sort();
    return bankNumbers.map((bankNum) => ({
      bankNumber: bankNum,
      readings: groups[bankNum],
    }));
  }, [lastReadings]);

  // Detectar o local (pegar do primeiro battery filtrado)
  const locationInfo = React.useMemo(() => {
    if (batteries.length === 0) return '';
    const first = batteries[0];
    const loc = locations.find((l) => l.id === first.locationId);
    if (loc) return loc.locationType + ' - KM ' + loc.km;
    return first.locationType + ' - KM ' + first.km;
  }, [batteries, locations]);

  if (batteries.length === 0) return null;

  return (
    <div className={styles.card} style={{ marginBottom: 20 }}>
      <div className={styles.cardHeader}>
        <p className={styles.cardTitle}>Heatmap do Banco de Baterias</p>
        <p className={styles.cardSubtitle}>{locationInfo}</p>
      </div>

      <div className={styles.cardBody}>
        {bankGroups.map((group) => (
          <div key={group.bankNumber} style={{ marginBottom: 20 }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, /*color: '#0F172A',*/ marginBottom: 8 }}>
              Banco {group.bankNumber} ({group.readings.length} baterias)
            </p>
            <div className={styles.heatmapGrid}>
              {group.readings
                .sort((a: BatteryLastReading, b: BatteryLastReading) => a.battery.sequenceNumber - b.battery.sequenceNumber)
                .map((r: BatteryLastReading) => {
                  const color = getStatusColor(r.status);
                  return (
                    <TooltipHost
                      key={r.battery.id}
                      content={
                        <div style={{ padding: 4 }}>
                          <p style={{ fontWeight: 700, color }}>{r.battery.serialNumber}</p>
                          <p>Tensão: {r.voltage} V</p>
                          <p>Resistência: {r.resistance} Ω</p>
                          <p>Status: {getStatusLabel(r.status)}</p>
                          {r.date && <p>Data: {formatDate(r.date)}</p>}
                        </div>
                      }
                    >
                      <div
                        className={styles.heatmapCell}
                        style={{ backgroundColor: color }}
                        onClick={() => onSelectBattery(r.battery.serialNumber)}
                      >
                        <span className={styles.heatmapCellLabel}>
                          {r.battery.sequenceNumber}
                        </span>
                      </div>
                    </TooltipHost>
                  );
                })}
            </div>
          </div>
        ))}

        {/* Legend */}
        <div className={styles.heatmapLegend}>
          {[
            { color: STATUS_COLORS.EXCELENTE, label: 'Excelente' },
            { color: STATUS_COLORS.ALERTA, label: 'Alerta' },
            { color: STATUS_COLORS.CRITICO, label: 'Crítico' },
          ].map((s) => (
            <div key={s.label} className={styles.heatmapLegendItem}>
              <div className={styles.heatmapLegendColor} style={{ backgroundColor: s.color }} />
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
