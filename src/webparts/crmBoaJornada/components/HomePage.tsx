// ============================================================================
// HomePage.tsx
// Tela inicial — escolha entre nova Boa Jornada ou histórico.
// ============================================================================

import * as React from 'react';
import styles from './CrmBoaJornada.module.scss';

// eslint-disable-next-line @typescript-eslint/no-require-imports 
const imagem1 = require('../../../../images/imagem11.png');

export interface IHomePageProps {
  onNewJornada: () => void;
  onViewHistory: () => void;
  userDisplayName: string;
}

export const HomePage: React.FC<IHomePageProps> = ({
  onNewJornada,
  onViewHistory,
  userDisplayName
}) => {

  const name = userDisplayName;
  return (
    <div className={styles.homePage}>
      <div className={styles.homeContent}>

        {/* Logo */}
        <div className={styles.homeLogoContainer}>
          <img src={imagem1} alt="" />
          <span className={styles.homeLogo}>Boa Jornada</span>
        </div>
        {/* Título */}
        {/* <h1 className={styles.homeTitle}>Boa Jornada</h1> */}
        <span style={{
          marginBottom: '5px',
          marginTop: '5px',
          fontSize: '20px',
          color: '#555555'
        }}>Olá, {name}</span>
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
