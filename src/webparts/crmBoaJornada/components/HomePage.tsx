// ============================================================================
// HomePage.tsx
// Tela inicial — escolha entre nova Boa Jornada ou histórico.
// ============================================================================

import * as React from 'react';
import styles from './CrmBoaJornada.module.scss';

export interface IHomePageProps {
  onNewJornada: () => void;
  onViewHistory: () => void;
}

export const HomePage: React.FC<IHomePageProps> = ({
  onNewJornada,
  onViewHistory,
}) => {
  return (
    <div className={styles.homePage}>
      <div className={styles.homeContent}>

        {/* Logo */}
        <div className={styles.homeLogoContainer}>
          <span className={styles.homeLogo}>CRM</span>
        </div>

        {/* Título */}
        <h1 className={styles.homeTitle}>Boa Jornada</h1>
        <p className={styles.homeSubtitle}>
          Sistema de registro de atividades de campo — Controle de Riscos em Manutenção.
          Registre as atividades, executantes e riscos críticos aplicáveis.
        </p>

        {/* Cards de navegação */}
        <div className={styles.homeCardsGrid}>
          <div
            className={styles.homeCard}
            onClick={onNewJornada}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onNewJornada()}
          >
            <div className={`${styles.homeCardIcon} ${styles.homeCardIconNew}`}>
              ✏️
            </div>
            <h2 className={styles.homeCardTitle}>Nova Boa Jornada</h2>
            <p className={styles.homeCardDescription}>
              Preencher um novo registro de atividades para a jornada de hoje.
            </p>
          </div>

          <div
            className={styles.homeCard}
            onClick={onViewHistory}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onViewHistory()}
          >
            <div className={`${styles.homeCardIcon} ${styles.homeCardIconHistory}`}>
              📋
            </div>
            <h2 className={styles.homeCardTitle}>Histórico</h2>
            <p className={styles.homeCardDescription}>
              Consultar registros anteriores de Boa Jornada.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
