// ============================================================================
// DashboardPage.tsx
// Layout principal do Dashboard. Compõe Header, Filters e Content Area.
// ============================================================================

import * as React from 'react';
import styles from './BatteryDashboard.module.scss';
import { useDashboard } from '../../../contexts/DashboardContext';
import { DashboardHeader } from './DashboardHeader';
//import { DashboardFilters } from './DashboardFilters';
import { KPICards } from './KPICards';
import { LineChartCard } from './LineChartCard';
import { BarChartCard } from './BarChartCard';
import { HeatMapBattery } from './HeatMapBattery';
import { InspectionHistoryTable } from './InspectionHistoryTable';
import { LoadingOverlay } from './LoadingOverlay';
import { ErrorState } from './ErrorState';
import { BatteryDetailsPanel } from './BatteryDetailsPanel';
import {
  getTotalVoltageTrend, getResistanceTrend,
  getBatteryVoltages, getBatteryResistances,
} from '../../../utils/dashboardUtils';

export interface IDashboardPageProps {
  userDisplayName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any;
}

export const DashboardPage: React.FC<IDashboardPageProps> = ({ userDisplayName, context }) => {
  const ctx = useDashboard();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [selectedBatteryNS, setSelectedBatteryNS] = React.useState<string | undefined>(undefined);

  // ── Tema Dark / Light ─────────────────────────────────────────────────
  const [isDark, setIsDark] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem('dashboard-theme') === 'dark';
    } catch { return false; }
  });

  const handleToggleTheme = React.useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      try { localStorage.setItem('dashboard-theme', next ? 'dark' : 'light'); } catch { /* noop */ }
      return next;
    });
  }, []);

  // ── Dados computados para gráficos (via useMemo) ──────────────────────

  // Tensão Total — derivada das medições filtradas → atividades correspondentes
  const totalVoltageTrend = React.useMemo(
    () => getTotalVoltageTrend(ctx.filteredMeasurements, ctx.rawData.activities),
    [ctx.filteredMeasurements, ctx.rawData.activities]
  );

  // Resistência Média ao longo do tempo (das medições individuais)
  const resistanceTrend = React.useMemo(
    () => getResistanceTrend(ctx.filteredMeasurements),
    [ctx.filteredMeasurements]
  );

  // Tensão por bateria (barras)
  const batteryVoltages = React.useMemo(
    () => getBatteryVoltages(ctx.filteredBatteries, ctx.filteredMeasurements),
    [ctx.filteredBatteries, ctx.filteredMeasurements]
  );

  // Resistência por bateria (barras)
  const batteryResistances = React.useMemo(
    () => getBatteryResistances(ctx.filteredBatteries, ctx.filteredMeasurements),
    [ctx.filteredBatteries, ctx.filteredMeasurements]
  );



  // ── Handlers ──────────────────────────────────────────────────────────

  const handleSelectBattery = React.useCallback((serialNumber: string) => {
    setSelectedBatteryNS(serialNumber);
  }, []);

  const handleClosePanel = React.useCallback(() => {
    setSelectedBatteryNS(undefined);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────

  if (ctx.loadingState === 'loading') {
    return <LoadingOverlay />;
  }

  if (ctx.loadingState === 'error') {
    return <ErrorState message={ctx.error || 'Erro desconhecido'} onRetry={ctx.refresh} />;
  }

  return (
    <div className={`${styles.dashboardRoot} ${isDark ? styles.dashboardRootDark : ''}`}>
      <DashboardHeader
        userDisplayName={userDisplayName}
        context={context}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        onRefresh={ctx.refresh}
        lastLoadedAt={ctx.lastLoadedAt}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
      />

      <div className={styles.body}>
        {/* <DashboardFilters
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        /> */}

        <div className={styles.contentArea}>
          {/* Row 1: KPI Cards */}
          <KPICards kpis={ctx.kpis} />

          {/* Row 2: Tensão Total (atividades) + Resistência Média (medições) */}
          <div className={styles.chartRow2}>
            <LineChartCard
              title="Evolução da Tensão Total"
              subtitle="Tensão total registrada por atividade"
              data={totalVoltageTrend}
              dataKey="value"
              color="#2563EB"
              unit=" V"
            />
            <LineChartCard
              title="Evolução da Resistência Média"
              subtitle="Média de todas as baterias filtradas"
              data={resistanceTrend}
              dataKey="value"
              color="#F97316"
              unit=" Ω"
            />
          </div>

          {/* Row 3: Tensão por Bateria + Resistência por Bateria */}
          <div className={styles.chartRow2}>
            <BarChartCard
              title="Tensão por Bateria"
              subtitle="Última leitura individual de cada bateria"
              data={batteryVoltages}
              dataKey="voltage"
              nameKey="label"
              unit=" V"
              layout="horizontal"
              height={260}
            />
            <BarChartCard
              title="Resistência por Bateria"
              subtitle="Última leitura individual de cada bateria"
              data={batteryResistances}
              dataKey="resistance"
              nameKey="label"
              unit=" Ω"
              layout="horizontal"
              height={260}
            />
          </div>


          {/* Row 5: Heatmap do Banco */}
          <HeatMapBattery
            batteries={ctx.filteredBatteries}
            measurements={ctx.filteredMeasurements}
            locations={ctx.filteredLocations}
            onSelectBattery={handleSelectBattery}
          />

          {/* Row 6: Tabela de Medições */}
          <InspectionHistoryTable
            measurements={ctx.filteredMeasurements}
            batteries={ctx.filteredBatteries}
            locations={ctx.rawData.locations}
            activities={ctx.filteredActivities}
            onSelectBattery={handleSelectBattery}
          />
        </div>
      </div>

      {/* Panel de detalhes da bateria */}
      {selectedBatteryNS && (
        <BatteryDetailsPanel
          serialNumber={selectedBatteryNS}
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
