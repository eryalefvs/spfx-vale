// ============================================================================
// DashboardPage.tsx
// Layout principal do Dashboard. Compõe Header, Filters e Content Area.
// Herda o tema global via CSS custom properties (sem controle local).
// ============================================================================

import * as React from 'react';
import styles from './BatteryDashboard.module.scss';
import { useDashboard } from '../../../../../../contexts/DashboardContext';
import { DashboardHeader } from './DashboardHeader';
import { KPICards } from './KPICards';
import { LineChartCard } from './LineChartCard';
import { MultiLineChartCard } from './MultiLineChartCard';
import { BarChartCard } from './BarChartCard';
import { HeatMapBattery } from './HeatMapBattery';
import { ActivityHistoryTable } from './ActivityHistoryTable';
import { BatteryEvolutionTable } from './BatteryEvolutionTable';
import { LoadingOverlay } from './LoadingOverlay';
import { ErrorState } from './ErrorState';
import { BatteryDetailsPanel } from './BatteryDetailsPanel';
import { LocationHealthMap } from './LocationHealthMap';
import {
  getTotalVoltageTrend,
  getUniqueBankNumbers,
  getBatteryVoltagesByBank,
  getBatteryResistancesByBank,
  getResistanceTrendByBank,
  getDisabledBanks,
} from '../../../../../../utils/dashboardUtils';
import { DisabledBankInfo } from '../../../../../../models/DashboardModels';

export interface IDashboardPageProps {
  userDisplayName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any;
}

export const DashboardPage: React.FC<IDashboardPageProps> = ({ userDisplayName, context }) => {
  const ctx = useDashboard();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [selectedBatteryId, setSelectedBatteryId] = React.useState<number | undefined>(undefined);

  // ── Dados computados para gráficos (via useMemo) ──────────────────────

  // Bancos únicos das baterias filtradas
  const bankNumbers = React.useMemo(
    () => getUniqueBankNumbers(ctx.filteredBatteries),
    [ctx.filteredBatteries]
  );

  // Tensão Total — derivada das medições filtradas → atividades correspondentes
  const totalVoltageTrend = React.useMemo(
    () => getTotalVoltageTrend(ctx.filteredMeasurements, ctx.rawData.activities),
    [ctx.filteredMeasurements, ctx.rawData.activities]
  );

  // Resistência Média por Banco (gráfico multi-linha)
  const resistanceTrendByBank = React.useMemo(
    () => getResistanceTrendByBank(ctx.filteredBatteries, ctx.filteredMeasurements, ctx.rawData.activities),
    [ctx.filteredBatteries, ctx.filteredMeasurements]
  );

  const resistanceLines = React.useMemo(() => {
    return bankNumbers.map((bank, idx) => ({
      dataKey: 'banco' + bank,
      label: 'Banco ' + bank,
      color: ['#F97316', '#8B5CF6', '#10B981', '#EC4899'][idx % 4],
    }));
  }, [bankNumbers]);

  // Tensão e Resistência por bateria — POR BANCO
  const voltagesByBank = React.useMemo(() => {
    return bankNumbers.map((bank) => ({
      bank,
      data: getBatteryVoltagesByBank(ctx.filteredBatteries, ctx.filteredMeasurements, bank),
    }));
  }, [bankNumbers, ctx.filteredBatteries, ctx.filteredMeasurements]);

  const resistancesByBank = React.useMemo(() => {
    return bankNumbers.map((bank) => ({
      bank,
      data: getBatteryResistancesByBank(ctx.filteredBatteries, ctx.filteredMeasurements, bank),
    }));
  }, [bankNumbers, ctx.filteredBatteries, ctx.filteredMeasurements]);

  // Bancos desabilitados para locais filtrados
  const disabledBanksInfo = React.useMemo<DisabledBankInfo[]>(
    () => getDisabledBanks(ctx.filteredBatteries, ctx.filteredLocations),
    [ctx.filteredBatteries, ctx.filteredLocations]
  );

  // Set de bancos desabilitados do local selecionado (para os gráficos por banco)
  const disabledBanksForCurrentLocation = React.useMemo(() => {
    if (!ctx.filters.locationId) return new Set<number>();
    const info = disabledBanksInfo.find((d) => d.location.id === ctx.filters.locationId);
    return info ? new Set(info.disabledBanks) : new Set<number>();
  }, [disabledBanksInfo, ctx.filters.locationId]);

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleSelectBattery = React.useCallback((id: number) => {
    setSelectedBatteryId(id);
  }, []);

  const handleClosePanel = React.useCallback(() => {
    setSelectedBatteryId(undefined);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────

  if (ctx.loadingState === 'loading') {
    return <LoadingOverlay />;
  }

  if (ctx.loadingState === 'error') {
    return <ErrorState message={ctx.error || 'Erro desconhecido'} onRetry={ctx.refresh} />;
  }

  return (
    <div className={styles.dashboardRoot}>
      <DashboardHeader
        userDisplayName={userDisplayName}
        context={context}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        onRefresh={ctx.refresh}
        lastLoadedAt={ctx.lastLoadedAt}
      />

      <div className={styles.body}>
        <div className={styles.contentArea}>
          {/* Row 1: KPI Cards */}
          <KPICards kpis={ctx.kpis} />

          {/* Row 1.5: Mapa de Saúde dos Locais */}
          <LocationHealthMap
            locations={ctx.filteredLocations}
            batteries={ctx.filteredBatteries}
            measurements={ctx.filteredMeasurements}
            selectedLocationId={ctx.filters.locationId}
            onSelectLocation={(locationId: number) => {
              // Toggle: se clicar no mesmo local já selecionado, limpa o filtro
              if (ctx.filters.locationId === locationId) {
                ctx.setLocationId(undefined);
              } else {
                ctx.setLocationId(locationId);
              }
            }}
          />

          {/* Row 2: Tensão Total + Resistência Média por Banco */}
          <div className={styles.chartRow2}>
            <LineChartCard
              title="Evolução da Tensão Total"
              subtitle="Tensão total registrada por atividade"
              data={totalVoltageTrend}
              dataKey="value"
              color="#2563EB"
              unit=" V"
            />
            <MultiLineChartCard
              title="Evolução da Resistência Média"
              subtitle={bankNumbers.length > 1 ? 'Separada por banco' : 'Média geral'}
              data={resistanceTrendByBank}
              lines={resistanceLines}
              unit=" Ω"
            />
          </div>

          {/* Row 3: Gráficos por Banco (Tensão + Resistência lado a lado) */}
          {bankNumbers.map((bank) => {
            // Se o banco está desabilitado, mostrar card informativo
            if (disabledBanksForCurrentLocation.has(bank)) {
              return (
                <div key={'bank-disabled-' + bank} style={{
                  gridColumn: '1 / -1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '16px 20px',
                  backgroundColor: '#FFFBEB',
                  border: '2px dashed #F59E0B',
                  borderRadius: 12,
                  marginBottom: 8,
                }}>
                  <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, color: '#92400E', fontSize: '0.875rem' }}>
                      Banco {bank} — Desabilitado
                    </p>
                    <p style={{ margin: '4px 0 0', color: '#A16207', fontSize: '0.78rem' }}>
                      Este banco não possui baterias ativas instaladas. Ponto de atenção nas análises.
                    </p>
                  </div>
                </div>
              );
            }

            const voltData = voltagesByBank.find((v) => v.bank === bank);
            const resData = resistancesByBank.find((r) => r.bank === bank);

            return (
              <div key={'bank-charts-' + bank} className={styles.chartRow2}>
                <BarChartCard
                  title={'Tensão por Bateria — Banco ' + bank}
                  subtitle={'Última leitura individual'}
                  data={voltData ? voltData.data : []}
                  dataKey="voltage"
                  nameKey="label"
                  unit=" V"
                  layout="horizontal"
                  height={260}
                />
                <BarChartCard
                  title={'Resistência por Bateria — Banco ' + bank}
                  subtitle={'Última leitura individual'}
                  data={resData ? resData.data : []}
                  dataKey="resistance"
                  nameKey="label"
                  unit=" Ω"
                  layout="horizontal"
                  height={260}
                />
              </div>
            );
          })}

          {/* Alerta de bancos desabilitados */}
          {disabledBanksInfo.length > 0 && ctx.filters.locationId && (
            <div style={{
              gridColumn: '1 / -1',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: 10,
              marginBottom: 8,
            }}>
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: '#92400E', fontSize: '0.8rem' }}>
                  Local com banco(s) desabilitado(s)
                </p>
                <p style={{ margin: '2px 0 0', color: '#A16207', fontSize: '0.72rem' }}>
                  {disabledBanksInfo
                    .filter((d) => d.location.id === ctx.filters.locationId)
                    .map((d) => `Banco ${d.disabledBanks.join(', ')} sem baterias ativas`)
                    .join(' · ')}
                </p>
              </div>
            </div>
          )}

          {/* Row 4: Heatmap do Banco */}
          <HeatMapBattery
            batteries={ctx.filteredBatteries}
            measurements={ctx.filteredMeasurements}
            locations={ctx.filteredLocations}
            onSelectBattery={handleSelectBattery}
          />

          {/* Row 5: Tabela de Evolução */}
          <BatteryEvolutionTable
            batteries={ctx.filteredBatteries}
            measurements={ctx.filteredMeasurements}
            activities={ctx.rawData.activities}
            onSelectBattery={handleSelectBattery}
          />

          {/* Row 6: Histórico de Atividades */}
          <ActivityHistoryTable
            measurements={ctx.filteredMeasurements}
            batteries={ctx.filteredBatteries}
            activities={ctx.filteredActivities}
            onSelectBattery={handleSelectBattery}
          />
        </div>
      </div>

      {/* Panel de detalhes da bateria */}
      {selectedBatteryId && (
        <BatteryDetailsPanel
          id={selectedBatteryId}
          batteries={ctx.rawData.batteries}
          measurements={ctx.rawData.measurements}
          locations={ctx.rawData.locations}
          activities={ctx.rawData.activities}
          onClose={handleClosePanel}
        />
      )}
    </div>
  );
};
