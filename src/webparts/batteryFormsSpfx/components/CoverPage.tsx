import * as React from 'react';
import styles from './BatteryFormsSpfx.module.scss';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const batteryImg = require('../../../../images/image-battery2-removebg-preview.png');

export interface ICoverPageProps {
  onNext: () => void;
}

export const CoverPage: React.FC<ICoverPageProps> = ({ onNext }) => {
  return (
    <div className={styles.coverPage}>
      <div className={styles.coverContent}>

        <div className={styles.coverImageContainer}>
          <img
            src={batteryImg}
            alt="Bateria"
            className={styles.coverImage}
          />
        </div>

        <h1 className={styles.coverTitle}>
          Inspeção de Baterias
        </h1>

        <p className={styles.coverSubtitle}>
          Sistema de coleta de dados para inspeção e manutenção
          de baterias dos sistemas ferroviários.
        </p>

        <div className={styles.coverInfoCard}>
          <h2>Sobre esta inspeção</h2>
          <p>
            Este formulário irá guiá-lo pelas etapas de coleta
            e verificação das informações da atividade. Preencha
            todos os campos obrigatórios e faça o upload dos
            arquivos de medição gerados pelo equipamento.
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