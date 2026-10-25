// ============================================================================
// AreaPage.tsx
// Página de uma área de procedimento (ex: Energia).
// Lista os procedimentos operacionais da área com Total, Pendentes, Concluídos.
// ============================================================================

import * as React from 'react';
import { Icon } from '@fluentui/react/lib/Icon';
import styles from './AreaPage.module.scss';
import {
  useNavigation,
  getArea,
} from '../../../../contexts/NavigationContext';
import { DashboardService } from '../../../../services/DashboardService';

export interface IAreaPageProps {
  areaId: string;
}

interface ProcedureStats {
  total: number;
  pending: number;
  completed: number;
}

export const AreaPage: React.FC<IAreaPageProps> = ({ areaId }) => {
  const { navigateTo } = useNavigation();
  const area = getArea(areaId);
  const [stats, setStats] = React.useState<Record<string, ProcedureStats>>({});

  // Carregar stats por procedimento
  React.useEffect(() => {
    const loadStats = async (): Promise<void> => {
      try {
        const data = await DashboardService.loadAllData();
        const total = data.activities.length;
        // const pending = data.activities.filter(
        //   (a) => a.status === 'Em Andamento' || a.status === 'Pendente'
        // ).length;
        // const completed = total - pending;

        // Por agora, associar os stats ao primeiro procedimento (baterias)
        // if (area?.procedures.length) {
        //   const statsMap: Record<string, ProcedureStats> = {};
        //   area.procedures.forEach((proc) => {
        //     statsMap[proc.id] = { total, pending, completed };
        //   });
        //   setStats(statsMap);
        // }
      } catch (err) {
        console.error('[AreaPage] Erro ao carregar stats:', err);
      }
    };

    loadStats().catch(console.error);
  }, [area]);

  if (!area) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>
          <Icon iconName="Error" className={styles.emptyIcon} />
          <h2 className={styles.emptyTitle}>Área não encontrada</h2>
          <p className={styles.emptySubtitle}>A área solicitada não existe no catálogo.</p>
        </div>
      </div>
    );
  }

  // Se não há procedimentos (ex: Telecom)
  if (area.procedures.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.areaHeader}>
          <div className={styles.areaIcon}>
            <Icon iconName={area.icon} />
          </div>
          <div className={styles.areaInfo}>
            <span className={styles.areaLabel}>ÁREA DE PROCEDIMENTO</span>
            <h1 className={styles.areaName}>{area.name}</h1>
          </div>
        </div>

        <div className={styles.emptyState}>
          <Icon iconName="Clock" className={styles.emptyIcon} />
          <h2 className={styles.emptyTitle}>Em breve</h2>
          <p className={styles.emptySubtitle}>
            Os procedimentos de {area.name} serão adicionados em breve.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Area Header */}
      <div className={styles.areaHeader}>
        <div className={styles.areaIcon}>
          <Icon iconName={area.icon} />
        </div>
        <div className={styles.areaInfo}>
          <span className={styles.areaLabel}>ÁREA DE PROCEDIMENTO</span>
          <h1 className={styles.areaName}>{area.name}</h1>
        </div>
      </div>

      {/* Procedure List */}
      <div className={styles.sectionLabel}>SELECIONE UM PROCEDIMENTO OPERACIONAL</div>

      <div className={styles.procedureList}>
        {area.procedures.map((proc, index) => {
          const procStats = stats[proc.id] || { total: 0, pending: 0, completed: 0 };

          return (
            <button
              key={proc.id}
              className={styles.procedureCard}
              onClick={() =>
                navigateTo({
                  page: 'procedure',
                  areaId: area.id,
                  procedureId: proc.id,
                })
              }
            >
              <div className={styles.procedureNumber}>
                {String(index + 1).padStart(2, '0')}
              </div>

              <div className={styles.procedureInfo}>
                <span className={styles.procedureCode}>{proc.code}</span>
                <h3 className={styles.procedureName}>{proc.name}</h3>
              </div>

              <div className={styles.procedureStats}>
                <div className={styles.statGroup}>
                  <Icon iconName="Documentation" className={`${styles.statIcon} ${styles.statIconTotal}`} />
                  <span className={styles.statLabel}>Total</span>
                  <span className={`${styles.statValue} ${styles.statValueTotal}`}>
                    {procStats.total}
                  </span>
                </div>
                <div className={styles.statGroup}>
                  <Icon iconName="Clock" className={`${styles.statIcon} ${styles.statIconPending}`} />
                  <span className={styles.statLabel}>Pendentes</span>
                  <span className={`${styles.statValue} ${styles.statValuePending}`}>
                    {procStats.pending}
                  </span>
                </div>
                <div className={styles.statGroup}>
                  <Icon iconName="CheckboxComposite" className={`${styles.statIcon} ${styles.statIconDone}`} />
                  <span className={styles.statLabel}>Concluídos</span>
                  <span className={`${styles.statValue} ${styles.statValueDone}`}>
                    {procStats.completed}
                  </span>
                </div>
              </div>

              <Icon iconName="ChevronRight" className={styles.procedureChevron} />
            </button>
          );
        })}
      </div>
    </div>
  );
};
