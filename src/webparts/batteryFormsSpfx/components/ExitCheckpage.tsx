import * as React from 'react';
import styles from './BatteryFormsSpfx.module.scss';
import { IWizardFormData } from '../../../models/BatteryInspection';

export interface IExitCheckPageProps {
  data: IWizardFormData;
  onNext: (data: Partial<IWizardFormData>) => void;
  onPrevious: (data?: Partial<IWizardFormData>) => void;
}

const FIVE_S_ITEMS = [
  {
    icon: '🔍',
    title: 'Seiri — Utilização',
    text: 'Verifique se não há materiais desnecessários no local. Remova equipamentos, peças ou resíduos que não pertençam ao ambiente.',
  },
  {
    icon: '📐',
    title: 'Seiton — Organização',
    text: 'Mantenha ferramentas e materiais organizados em seus devidos lugares. Identifique e ordene todos os itens utilizados.',
  },
  {
    icon: '🧹',
    title: 'Seiso — Limpeza',
    text: 'Limpe o local de trabalho após a atividade. Remova poeira, sujeira e resíduos gerados durante a inspeção ou manutenção.',
  },
  {
    icon: '📋',
    title: 'Seiketsu — Padronização',
    text: 'Siga os procedimentos padrão estabelecidos. Garanta que todas as etapas foram realizadas conforme as normas técnicas.',
  },
  {
    icon: '🎯',
    title: 'Shitsuke — Disciplina',
    text: 'Mantenha as boas práticas de forma contínua. Reforce o compromisso com a segurança e a qualidade em todas as atividades.',
  },
];

export const ExitCheckPage: React.FC<IExitCheckPageProps> = ({
  data,
  onNext,
  onPrevious,
}) => {
  const [observations, setObservations] = React.useState(
    data.exitObservations
  );

  const getPageData = (): Partial<IWizardFormData> => ({
    exitObservations: observations,
  });

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Check de Saída e 5S</h1>
        <p>
          Antes de encerrar a atividade, verifique as
          diretrizes do programa 5S.
        </p>
      </div>

      <div className={styles.cardsGrid}>
        {FIVE_S_ITEMS.map((item, index) => (
          <div key={index} className={styles.infoCard}>
            <div className={styles.infoCardIcon}>
              {item.icon}
            </div>
            <div className={styles.infoCardContent}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div
        className={styles.formCard}
        style={{ marginTop: '20px' }}
      >
        <div className={styles.formGroup}>
          <label htmlFor="exitObs">
            Observações de Saída / 5S
          </label>
          <textarea
            id="exitObs"
            value={observations}
            onChange={(e) =>
              setObservations(e.target.value)
            }
            rows={4}
            placeholder="Observações sobre limpeza, organização e condições de saída do local..."
          />
        </div>
      </div>

      <div className={styles.navigation}>
        <button
          type="button"
          className={styles.btnSecondary}
          onClick={() => onPrevious(getPageData())}
        >
          ← Voltar
        </button>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={() => onNext(getPageData())}
        >
          Avançar →
        </button>
      </div>
    </div>
  );
};
