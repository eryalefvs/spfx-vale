import * as React from 'react';
import styles from './BatteryFormsSpfx.module.scss';

export interface IParametersPageProps {
  onNext: () => void;
  onPrevious: () => void;
}

const PARAMETER_CARDS = [
  {
    icon: '📋',
    title: 'Preparação',
    text: 'Verificar se o equipamento de medição (analisador de baterias) está calibrado e em condições de uso. Conferir as conexões e cabos antes de iniciar as medições.',
  },
  {
    icon: '🔌',
    title: 'Conexão',
    text: 'Conectar o equipamento de medição aos terminais da bateria observando a polaridade correta. Garantir que as garras estejam firmes e com bom contato elétrico.',
  },
  {
    icon: '📊',
    title: 'Medição de Tensão',
    text: 'Medir a tensão individual de cada elemento/bateria (VDC) e registrar os valores. A tensão de flutuação ideal é de aproximadamente 13.8V por elemento.',
  },
  {
    icon: '⚡',
    title: 'Medição de Resistência',
    text: 'Medir a resistência interna (mΩ) de cada elemento utilizando o equipamento adequado. Valores de referência: até 4.0mΩ (Excelente), até 6.5mΩ (Alerta), acima (Crítico).',
  },
  {
    icon: '📝',
    title: 'Registro',
    text: 'Registrar todos os valores obtidos no arquivo Excel gerado pelo equipamento de medição. Salvar o arquivo para upload na próxima etapa deste formulário.',
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
