import * as React from 'react';
import styles from './BatteryFormsSpfx.module.scss';

export interface IParametersPageProps {
  onNext: () => void;
  onPrevious: () => void;
}

const PARAMETER_CARDS = [
  {
    icon: '🧰',
    title: 'Medição de Tensão dos Monoblocos',
    text: 'Para baterias PowerSafe SBS, OPZV, a tensão de flutuação deve ser de 2,27Vpe a uma temperatura de 25 °C, com compensação de 4mv/°C/Elemento.',
  },
  {
    icon: '📏',
    title: 'Medição de Tensão de Flutuação Total',
    text: 'Tensão da bateria conforme o sistema aplicado - 50,82 a 54,00 – Telecomunicações; 135 a 137,4 - Sinalização. (Sala de baterias entre 20 e 30°C); -  13,26 a 13,62 – Sinalização Armários;'
  },
  {
    icon: '⚡️',
    title: 'Medição de Corrente da Bateria',
    text: '~ 0A em flutuação carregada; ~ 3A em descarga TU, AMV, TS; ~ 6A em descarga em Armários; Para os demais locais acompanhar histórico.'
  },
  {
    icon: '🌡️',
    title: 'Medição da Temperatura do ambiente',
    text: 'Temperatura ambiente das salas de baterias entre 22 e 27°C. Em armários conferir ajuste do exaustor em 35°C.'
  },
  {
    icon: '📏',
    title: 'Medição da Temperatura dos monoblocos',
    text: 'Temperatura dos monoblocos em salas de baterias que estiverem com controle de temperatura funcionando, deve estar entre 19 e 27C°, e não mais que 3°C de diferença monobloco a monobloco. E de forma geral, as baterias não devem ultrapassar os 37°C.'
  },
  {
    icon: '🔋',
    title: 'Medição da Tensão e Corrente de Ripple',
    text: 'A ondulação (ripple) aplicada aos acumuladores não deve ser superior em tensão a 1% (RMS) da tensão de flutuação e em corrente a 5 A (RMS) para cada 100 Ah da capacidade nominal (C10).'
  },
  {
    icon: '⚡',
    title: 'Medição de Resistência interna dos Monoblocos',
    text: 'Resistência interna obedecer à referência no anexo 03.',
  },
];

export const ParametersPage: React.FC<IParametersPageProps> = ({
  onNext,
  onPrevious,
}) => {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Parâmetros Operacionais</h1>
        <p>
          Passos para realizar as medições das baterias.
          Siga as orientações abaixo antes de prosseguir.
        </p>
      </div>

      <div className={styles.cardsGrid}>
        {PARAMETER_CARDS.map((card, index) => (
          <div key={index} className={styles.infoCard}>
            <div className={styles.infoCardIcon}>
              {card.icon}
            </div>
            <div className={styles.infoCardContent}>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.navigation}>
        <button
          type="button"
          className={styles.btnSecondary}
          onClick={onPrevious}
        >
          ← Voltar
        </button>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={onNext}
        >
          Avançar →
        </button>
      </div>
    </div>
  );
};
