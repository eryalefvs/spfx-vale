import * as React from 'react';
import styles from './BatteryFormsSpfx.module.scss';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const batteryImg = require('../../../../../../../images/image-battery2-removebg-preview.png');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const img2 = require('../../../../../../../images/imagem13.png');

export interface ICoverPageProps {
  onNext: () => void;
}

export const CoverPage: React.FC<ICoverPageProps> = ({ onNext }) => {
  return (
    <div className={styles.coverPage}>
      <div className={styles.coverContent}>

        <div className={styles.coverImageContainer} style={{
          maxWidth: "100%",
          maxHeight: "100%",
          marginLeft: "-50px",
          objectFit: "contain",
        }}>
          <img
            src={img2}
            alt="Técnicos"
            style={{
              width: '510px',
              height: '310px',
            }}
          />
          <img
            src={batteryImg}
            alt="Bateria"
            className={styles.coverImage}
          />
        </div>

        <h1 className={styles.coverTitle}>
          Web App de Manutenção Preventiva de Baterias
        </h1>

        <p className={styles.coverSubtitle}>
          Sistema de coleta de dados das manutenções e inspeções preventivas
          de baterias, com objetivo de analisar e garantir o suprimento de energia para os
          sistemas alimentados durante a falta de energia CA.
        </p>

        <div className={styles.coverInfoCard}>
          <h2>Sobre esta inspeção ⚠️</h2>
          <p>
            Antes de iniciar, certifique-se de que você está utilizando todos os EPIs
            necessários e que conhece os riscos da atividade. Consulte a APR e o procedimento
            PRO-001107 antes de prosseguir.
          </p>
        </div>

        <button
          type="button"
          className={styles.btnPrimary}
          onClick={onNext}
        >
          Iniciar Inspeção →
        </button>

      </div>
    </div>
  );
};