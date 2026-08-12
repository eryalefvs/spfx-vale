// BatteryDetailsPanel.tsx
import * as React from 'react';
import { Panel, PanelType } from '@fluentui/react/lib/Panel';
import { Battery, Measurement, Location, Activity, TrendPoint } from '../../../models/DashboardModels';
import { getBatteryTrend, formatDate, parseStatus, getStatusColor, getStatusLabel } from '../../../utils/dashboardUtils';
import { VOLTAGE_THRESHOLDS, RESISTANCE_THRESHOLDS } from '../../../constants/DashboardConstants';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from "recharts";

export interface IBatteryDetailsPanelProps {
  serialNumber: string;
  batteries: Battery[];
  measurements: Measurement[];
  locations: Location[];
  activities: Activity[];
  onClose: () => void;
}

export const BatteryDetailsPanel: React.FC<IBatteryDetailsPanelProps> = ({
  serialNumber, batteries, measurements, locations, activities, onClose,
}) => {
  const battery = batteries.find((b) => b.serialNumber === serialNumber);
  if (!battery) return null;

  const location = locations.find((l) => l.id === battery.locationId);

  const batteryMeasurements = React.useMemo(
    () => measurements
      .filter((m) => m.batterySerialNumber === serialNumber)
      .sort((a, b) => a.date.getTime() - b.date.getTime()),
    [measurements, serialNumber]
  );

  const voltageTrend = React.useMemo(
    () => getBatteryTrend(measurements, serialNumber, (m) => m.voltage),
    [measurements, serialNumber]
  );

  const resistanceTrend = React.useMemo(
    () => getBatteryTrend(measurements, serialNumber, (m) => m.resistance),
    [measurements, serialNumber]
  );

  const lastMeasurement = batteryMeasurements.length > 0
    ? batteryMeasurements[batteryMeasurements.length - 1]
    : undefined;

  const currentStatus = lastMeasurement
    ? parseStatus(lastMeasurement.overallStatus)
    : 'EXCELENTE';

  const statusColor = getStatusColor(currentStatus);

  // Atividades relacionadas — sem usar Set iterator
  const relatedActivities = React.useMemo(() => {
    const activityIdMap: Record<number, boolean> = {};
    batteryMeasurements.forEach((m) => {
      if (m.activityId !== undefined) activityIdMap[m.activityId] = true;
    });
    return activities.filter((a) => activityIdMap[a.id] === true);
  }, [batteryMeasurements, activities]);

  const tickStyle = { fontSize: 10, fill: '#94A3B8' };

  // MiniChart usando React.createElement para evitar erros de tipo Recharts + React 17
  const renderMiniChart = (data: TrendPoint[], color: string, refValue?: number): React.ReactElement => {
    const interval = data.length <= 6 ? 0 : Math.ceil(data.length / 6) - 1;
    return <ResponsiveContainer width="100%" height={120}><LineChart
      data={data}
      margin={{ top: 4, right: 8, left: -24, bottom: 0 }}
    >
      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
      <XAxis
        dataKey="date" tick={tickStyle} tickLine={false} axisLine={false}
        tickFormatter={(v: string) => v.slice(5)} interval={interval} />
      <YAxis tick={tickStyle} tickLine={false} axisLine={false} domain={['dataMin - 0.1', 'dataMax + 0.1']} />
      {refValue !== undefined ? (
        <ReferenceLine y={refValue} stroke={color} strokeDasharray="4 4" strokeOpacity={0.4} />
      ) : null}
      <Tooltip
        formatter={(value: number) => value.toFixed(2)}
        contentStyle={{ fontSize: '0.75rem', borderRadius: 6, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
      />
      <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
    </LineChart>
    </ResponsiveContainer>
  };

  const InfoRow: React.FC<{ label: string; value: string | number | undefined }> = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
      <span style={{ fontSize: '0.8rem', color: '#64748B' }}>{label}</span>
      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0F172A' }}>{value !== undefined ? value : '-'}</span>
    </div>
  );

  return (
    <Panel
      isOpen={true}
      onDismiss={onClose}
      type={PanelType.medium}
      headerText={`Bateria ${serialNumber}`}
      isLightDismiss
    >
      <div style={{ padding: '4px 0' }}>
        {/* Status Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 14px', borderRadius: 20,
          backgroundColor: statusColor + '14', color: statusColor,
          fontWeight: 600, fontSize: '0.8125rem', marginBottom: 16,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: statusColor }} />
          {getStatusLabel(currentStatus)}
        </div>

        {/* Info cadastral */}
        <div style={{
          backgroundColor: '#F8FAFC', borderRadius: 10, padding: 16,
          border: '1px solid #E2E8F0', marginBottom: 20,
        }}>
          <p style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: 8, color: '#0F172A' }}>Dados Cadastrais</p>
          <InfoRow label="Número de Série" value={battery.serialNumber} />
          <InfoRow label="Banco" value={'Banco ' + battery.bankNumber} />
          <InfoRow label="Posição (NO)" value={battery.sequenceNumber} />
          <InfoRow label="Modelo" value={battery.model} />
          <InfoRow label="Fabricante" value={battery.manufacturer} />
          <InfoRow label="Local" value={location ? location.locationType + ' - KM ' + location.km : battery.locationType} />
          <InfoRow label="Supervisão" value={location ? location.supervisao : undefined} />
          <InfoRow label="Data Fabricação" value={battery.manufactureDate ? formatDate(battery.manufactureDate) : '-'} />
        </div>

        {/* Última medição */}
        {lastMeasurement && (
          <div style={{
            backgroundColor: '#F8FAFC', borderRadius: 10, padding: 16,
            border: '1px solid #E2E8F0', marginBottom: 20,
          }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: 8, color: '#0F172A' }}>Última Medição</p>
            <InfoRow label="Data" value={formatDate(lastMeasurement.date)} />
            <InfoRow label="Tensão" value={lastMeasurement.voltage + ' V'} />
            <InfoRow label="Resistência" value={lastMeasurement.resistance + ' Ω'} />
            <InfoRow label="Corrente" value={lastMeasurement.current + ' A'} />
            <InfoRow label="Status Tensão" value={lastMeasurement.voltageStatus} />
            <InfoRow label="Status Resistência" value={lastMeasurement.resistanceStatus} />
          </div>
        )}

        {/* Mini-charts */}
        {voltageTrend.length > 1 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>
              Evolução da Tensão
            </p>
            {renderMiniChart(voltageTrend, '#2563EB', VOLTAGE_THRESHOLDS.ideal)}
          </div>
        )}

        {resistanceTrend.length > 1 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>
              Evolução da Resistência
            </p>
            {renderMiniChart(resistanceTrend, '#F97316', RESISTANCE_THRESHOLDS.ideal)}
          </div>
        )}

        {/* Timeline de atividades */}
        {relatedActivities.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0F172A', marginBottom: 12 }}>
              Atividades Relacionadas ({relatedActivities.length})
            </p>
            {relatedActivities.map((a) => (
              <div key={a.id} style={{
                padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0',
                backgroundColor: '#fff', marginBottom: 8,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0F172A' }}>
                    OM: {a.maintenanceOrder}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                    {formatDate(a.activityDate)}
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  {a.responsibles.join(', ')} · {a.activityType}
                </p>
                {a.roomTemperature !== undefined && (
                  <p style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 2 }}>
                    Temp. Sala: {a.roomTemperature}°C {a.totalVoltage ? ' · Tensão Total: ' + a.totalVoltage + 'V' : ''}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Timeline de medições */}
        <div>
          <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0F172A', marginBottom: 12 }}>
            Histórico de Medições ({batteryMeasurements.length})
          </p>
          {batteryMeasurements.slice(-20).reverse().map((m) => {
            const mStatus = parseStatus(m.overallStatus);
            const mColor = getStatusColor(mStatus);
            return (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '8px 0', borderBottom: '1px solid #F8FAFC',
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  backgroundColor: mColor, flexShrink: 0,
                }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.78rem', color: '#0F172A', fontWeight: 600 }}>
                    {m.voltage}V · {m.resistance}Ω · {m.current}A
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8', whiteSpace: 'nowrap' }}>
                  {formatDate(m.date)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
};
