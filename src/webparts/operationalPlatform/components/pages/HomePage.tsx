// ============================================================================
// HomePage.tsx
// Página inicial da Plataforma Operacional.
// Saudação ao usuário, KPIs globais e cards das áreas de procedimento.
// ============================================================================

import * as React from 'react';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { Icon } from '@fluentui/react/lib/Icon';
import styles from './HomePage.module.scss';
import {
  useNavigation,
  AREAS_CATALOG,
} from '../../../../contexts/NavigationContext';
import { DashboardService } from '../../../../services/DashboardService';

export interface IHomePageProps {
  userDisplayName: string;
  context: WebPartContext;
}

interface HomeKPIs {
  totalActivities: number;
  //pendingActivities: number;
  //completedThisMonth: number;
}

export const HomePage: React.FC<IHomePageProps> = ({ userDisplayName }) => {
  const { navigateTo } = useNavigation();
  const [kpis, setKpis] = React.useState<HomeKPIs>({
    totalActivities: 0,
    //pendingActivities: 0,
    //completedThisMonth: 0,
  });

  // Carregar KPIs globais
  React.useEffect(() => {
    const loadKPIs = async (): Promise<void> => {
      try {
        const data = await DashboardService.loadAllData();
        const total = data.activities.length;
        // const pending = data.activities.filter(
        //   (a) => a.status === 'Em Andamento' || a.status === 'Pendente'
        // ).length;

        // Atividades concluídas no mês atual
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        // const completed = data.activities.filter((a) => {
        //   if (a.status !== 'Concluído' && a.status !== 'Concluida') return false;
        //   const actDate = a.date ? new Date(a.date) : null;
        //   return actDate && actDate >= startOfMonth;
        // }).length;

        setKpis({
          totalActivities: total,
          //pendingActivities: pending,
          //completedThisMonth: completed,
        });
      } catch (err) {
        console.error('[HomePage] Erro ao carregar KPIs:', err);
      }
    };

    loadKPIs().catch(console.error);
  }, []);

  const firstName = userDisplayName.split(' ')[0];

  return (
    <div>
      {/* Hero Section */}
      <div className={styles.heroSection}>
        <div className={styles.heroLabel}>PLATAFORMA OPERACIONAL GERÊNCIA DE SINALIZAÇÃO E TELECOMUNICAÇÕES</div>
        <h1 className={styles.heroTitle}>
          Olá, {firstName}.
          <br />
          <span className={styles.heroHighlight}>O que vamos fazer hoje?</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Selecione o procedimento operacional que deseja registrar, acompanhar ou analisar.
        </p>
      </div>

      {/* Content */}
      <div className={styles.contentSection}>
        {/* KPIs */}
        <div className={styles.kpiRow}>
          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIcon} ${styles.kpiIconBlue}`}>
              <Icon iconName="DocumentSet" />
            </div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>TOTAL DE ATIVIDADES</span>
              <span className={styles.kpiValue}>{kpis.totalActivities}</span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIcon} ${styles.kpiIconYellow}`}>
              <Icon iconName="Clock" />
            </div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>PENDENTES / EM ANDAMENTO</span>
              {/* <span className={styles.kpiValue}>{kpis.pendingActivities}</span> */}
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIcon} ${styles.kpiIconGreen}`}>
              <Icon iconName="CheckboxComposite" />
            </div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>CONCLUÍDAS NO MÊS</span>
              {/* <span className={styles.kpiValue}>{kpis.completedThisMonth}</span> */}
            </div>
          </div>
        </div>

        {/* Áreas de Procedimento */}
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>ÁREAS DE PROCEDIMENTO</span>
        </div>

        <div className={styles.areasGrid}>
          {AREAS_CATALOG.map(area => (
            <button
              key={area.id}
              className={styles.areaCard}
              onClick={() => navigateTo({ page: 'area', areaId: area.id })}
            >
              <div className={styles.areaCardHeader}>
                <div className={styles.areaIcon}>
                  <Icon iconName={area.icon} />
                </div>
                <span className={styles.areaProCount}>
                  {area.procedures.length} PROs{' '}
                  <Icon iconName="ChevronRight" />
                </span>
              </div>

              <h3 className={styles.areaName}>{area.name}</h3>
              <p className={styles.areaDescription}>{area.description}</p>

              {area.procedures.length > 0 && (
                <div className={styles.proTags}>
                  {area.procedures.map((proc) => (
                    <span key={proc.id} className={styles.proTag}>
                      {proc.code}
                    </span>
                  ))}
                </div>
              )}

              <div className={styles.areaStats}>
                <div className={styles.statItem}>
                  {area.name === "Energia" && (
                    <>
                      <div className={`${styles.statValue} ${styles.statValueTotal}`}>
                        {kpis.totalActivities}
                      </div>
                      <div className={styles.statLabel}>TOTAL</div>
                    </>
                  )}
                </div>
                {/* <div className={styles.statItem}>
                  <div className={`${styles.statValue} ${styles.statValuePending}`}>
                    {kpis.pendingActivities}
                  </div>
                  <div className={styles.statLabel}>PENDENTES</div>
                </div>
                <div className={styles.statItem}>
                  <div className={`${styles.statValue} ${styles.statValueDone}`}>
                    {kpis.completedThisMonth}
                  </div>
                  <div className={styles.statLabel}>CONCLUÍDOS</div>
                </div> */}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
