// ============================================================================
// LocationHealthMap.tsx
// Mapa visual horizontal dos locais, ordenados por KM crescente.
// Cor degradê verde→vermelho proporcional a baterias em Alerta/Crítico.
// ============================================================================

import * as React from 'react';
import styles from './BatteryDashboard.module.scss';
import { Battery, Measurement, Location } from '../../../../../../models/DashboardModels';
import { getBatteryLastReadings, getDisabledBanks } from '../../../../../../utils/dashboardUtils';
import { TooltipHost } from '@fluentui/react/lib/Tooltip';

export interface ILocationHealthMapProps {
  locations: Location[];
  batteries: Battery[];
  measurements: Measurement[];
  onSelectLocation?: (locationId: number) => void;
  selectedLocationId?: number;
}

interface LocationHealthData {
  location: Location;
  totalBatteries: number;
  alertCount: number;
  criticalCount: number;
  excellentCount: number;
  problemRatio: number;   // (alert + critical) / total  → 0..1
  hasDisabledBank: boolean;
  hasMeasurements: boolean; // false quando nenhuma bateria do local possui medição
  disabledBankNumbers: number[];
}

/**
 * Retorna uma cor interpolada entre verde (#22C55E) e vermelho (#DC2626)
 * baseada em um ratio de 0 (100% saudável) a 1 (100% problemático).
 */
function getGradientColor(ratio: number): string {
  // Clamp entre 0 e 1
  const r = Math.max(0, Math.min(1, ratio));

  // Verde:  #22C55E → rgb(34, 197, 94)
  // Amarelo (meio): #F59E0B → rgb(245, 158, 11)
  // Vermelho: #DC2626 → rgb(220, 38, 38)

  let red: number;
  let green: number;
  let blue: number;

  if (r <= 0.3) {
    // Verde → Amarelo (0..0.5)
    const t = r / 0.3;
    red = Math.round(34 + (245 - 34) * t);
    green = Math.round(197 + (158 - 197) * t);
    blue = Math.round(94 + (11 - 94) * t);
  } else {
    // Amarelo → Vermelho (0.5..1)
    const t = (r - 0.3) / 0.7;
    red = Math.round(245 + (220 - 245) * t);
    green = Math.round(158 + (38 - 158) * t);
    blue = Math.round(11 + (38 - 11) * t);
  }

  return `rgb(${red}, ${green}, ${blue})`;
}

/**
 * Retorna a cor do texto (claro/escuro) com base no brilho da cor de fundo.
 */
function getContrastTextColor(ratio: number): string {
  return ratio > 0.6 ? '#FFFFFF' : '#0F172A';
}

export const LocationHealthMap: React.FC<ILocationHealthMapProps> = ({
  locations, batteries, measurements, onSelectLocation, selectedLocationId,
}) => {
  // Calcular o status de cada bateria
  const lastReadings = React.useMemo(
    () => getBatteryLastReadings(batteries, measurements),
    [batteries, measurements]
  );

  // Detectar bancos desabilitados
  const disabledBanksData = React.useMemo(
    () => getDisabledBanks(batteries, locations),
    [batteries, locations]
  );

  // Mapa locationId → bancos desabilitados para lookup rápido
  const disabledBanksMap = React.useMemo(() => {
    const map: Record<number, number[]> = {};
    for (const info of disabledBanksData) {
      map[info.location.id] = info.disabledBanks;
    }
    return map;
  }, [disabledBanksData]);

  // Agrupar por locationId e calcular saúde
  const locationHealthData = React.useMemo<LocationHealthData[]>(() => {
    // Criar mapa locationId → readings
    const readingsByLocation: Record<number, typeof lastReadings> = {};
    lastReadings.forEach((r) => {
      const locId = r.battery.locationId;
      if (locId === undefined) return;
      if (!readingsByLocation[locId]) readingsByLocation[locId] = [];
      readingsByLocation[locId].push(r);
    });

    return locations
      .filter((loc) => readingsByLocation[loc.id] && readingsByLocation[loc.id].length > 0)
      .map((loc) => {
        const readings = readingsByLocation[loc.id] || [];
        const total = readings.length;
        const alertCount = readings.filter((r) => r.status === 'ALERTA').length;
        const criticalCount = readings.filter((r) => r.status === 'CRITICO').length;
        const excellentCount = readings.filter((r) => r.status === 'EXCELENTE').length;
        const problemRatio = total > 0 ? (alertCount + criticalCount) / total : 0;

        return {
          location: loc,
          totalBatteries: total,
          alertCount,
          criticalCount,
          excellentCount,
          problemRatio,
          hasMeasurements: readings.some((r) => !!r.measurement),
          hasDisabledBank: !!disabledBanksMap[loc.id],
          disabledBankNumbers: disabledBanksMap[loc.id] || [],
        };
      })
      .sort((a, b) => a.location.km - b.location.km);
  }, [locations, lastReadings, disabledBanksMap]);

  const handleCardClick = React.useCallback((locationId: number) => {
    if (onSelectLocation) {
      onSelectLocation(locationId);
    }
  }, [onSelectLocation]);

  if (locationHealthData.length === 0) return null;

  return (
    <div className={styles.card} style={{ marginBottom: 20 }}>
      <div className={styles.cardHeader}>
        <p className={styles.cardTitle}>Mapa de Saúde dos Locais</p>
        <p className={styles.cardSubtitle}>
          Locais ordenados por KM — clique para filtrar o dashboard
        </p>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.locationHealthMap}>
          {locationHealthData.map((data, index) => {
            const bgColor = data.hasMeasurements ? getGradientColor(data.problemRatio) : '#E2E8F0';
            const textColor = data.hasMeasurements ? getContrastTextColor(data.problemRatio) : '#94A3B8';
            const isLast = index === locationHealthData.length - 1;
            const isSelected = selectedLocationId === data.location.id;

            return (
              <React.Fragment key={data.location.id}>
                <TooltipHost
                  content={
                    <div style={{ padding: 6 }}>
                      <p style={{ fontWeight: 700, marginBottom: 4, fontSize: '0.875rem' }}>
                        {data.location.localKm}
                      </p>
                      <p style={{ margin: 0 }}>
                        Tipo: <strong>{data.location.locationType}</strong>
                      </p>
                      <p style={{ margin: 0 }}>
                        KM: <strong>{data.location.km}</strong>
                      </p>
                      <p style={{ margin: 0 }}>
                        Sede: <strong>{data.location.sede}</strong> | Supervisão: <strong>{data.location.supervisao}</strong>
                      </p>
                      <hr style={{ margin: '6px 0', borderColor: '#E2E8F0' }} />
                      <p style={{ margin: 0 }}>
                        Total: <strong>{data.totalBatteries}</strong> baterias
                      </p>
                      {!data.hasMeasurements && (
                        <p style={{ margin: 0, color: '#64748B', fontStyle: 'italic' }}>
                          Sem medições registradas
                        </p>
                      )}
                      <p style={{ margin: 0, color: '#22C55E' }}>
                        Excelente: <strong>{data.excellentCount}</strong>
                      </p>
                      <p style={{ margin: 0, color: '#F97316' }}>
                        Alerta: <strong>{data.alertCount}</strong>
                      </p>
                      <p style={{ margin: 0, color: '#DC2626' }}>
                        Crítico: <strong>{data.criticalCount}</strong>
                      </p>
                      {data.hasDisabledBank && (
                        <>
                          <hr style={{ margin: '6px 0', borderColor: '#E2E8F0' }} />
                          <p style={{ margin: 0, color: '#F59E0B', fontWeight: 600 }}>
                            ⚠ Banco {data.disabledBankNumbers.join(', ')} desabilitado
                          </p>
                          <p style={{ margin: 0, fontSize: '0.72rem', color: '#92400E' }}>
                            Sem baterias ativas neste banco
                          </p>
                        </>
                      )}
                      <hr style={{ margin: '6px 0', borderColor: '#E2E8F0' }} />
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
                        Clique para filtrar por este local
                      </p>
                    </div>
                  }
                >
                  <div
                    className={`${styles.locationHealthCard} ${isSelected ? styles['locationHealthCardSelected'] : ''}`}
                    style={{
                      backgroundColor: bgColor,
                      color: textColor,
                      cursor: onSelectLocation ? 'pointer' : 'default',
                      ...(!data.hasMeasurements ? { opacity: 0.75 } : {}),
                      ...(data.hasDisabledBank ? {
                        border: '2px dashed #F59E0B',
                        boxShadow: '0 0 0 1px rgba(245, 158, 11, 0.3)',
                      } : {}),
                    }}
                    onClick={() => handleCardClick(data.location.id)}
                  >
                    {data.hasDisabledBank && (
                      <span style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        fontSize: '0.7rem',
                        lineHeight: 1,
                        zIndex: 1,
                      }}>⚠️</span>
                    )}
                    <span className={styles.locationHealthKm}>
                      KM {data.location.km}
                    </span>
                    <span className={styles.locationHealthType}>
                      {data.location.locationType}
                    </span>
                    {(data.alertCount + data.criticalCount) > 0 && (
                      <span className={styles.locationHealthBadge}>
                        {data.alertCount + data.criticalCount}
                      </span>
                    )}
                  </div>
                </TooltipHost>
                {!isLast && (
                  <div className={styles.locationHealthConnector} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Legenda */}
        <div className={styles.locationHealthLegend}>
          <div className={styles.locationHealthGradientBar} />
          <div className={styles.locationHealthLegendLabels}>
            <span>Saudável</span>
            <span>Atenção</span>
            <span>Crítico</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: '0.75rem', color: '#64748B' }}>
            <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: 3, backgroundColor: '#E2E8F0', border: '1px solid #CBD5E1' }} />
            <span>Sem medições</span>
          </div>
        </div>
      </div>
    </div>
  );
};

