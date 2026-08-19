// ============================================================================
// DashboardPage.tsx
// Layout principal do Dashboard. Compõe Header, Filters e Content Area.
// ============================================================================

import * as React from 'react';
import styles from './BatteryDashboard.module.scss';
import { useDashboard } from '../../../contexts/DashboardContext';
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
import {
  getTotalVoltageTrend,
  getUniqueBankNumbers,
  getBatteryVoltagesByBank,
  getBatteryResistancesByBank,
  getResistanceTrendByBank,
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
    () => getResistanceTrendByBank(ctx.filteredBatteries, ctx.filteredMeasurements),
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
        <div className={styles.contentArea}>
          {/* Row 1: KPI Cards */}
          <KPICards kpis={ctx.kpis} />

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
