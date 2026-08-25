import * as React from 'react';
import styles from './BatteryFormsSpfx.module.scss';
import { IWizardFormData } from '../../../models/BatteryInspection';

export interface IIntegrityPageProps {
  data: IWizardFormData;
  onNext: (data: Partial<IWizardFormData>) => void;
  onPrevious: (data?: Partial<IWizardFormData>) => void;
}

export const IntegrityPage: React.FC<IIntegrityPageProps> = ({
  data,
  onNext,
  onPrevious,
}) => {
  const [hasAnomalies, setHasAnomalies] = React.useState(
    data.hasAnomalies
  );
  const [anomalies, setAnomalies] = React.useState(
    data.anomaliesDescription
  );
  const [solutions, setSolutions] = React.useState(
    data.solutionsAdopted
  );

  const getPageData = (): Partial<IWizardFormData> => ({
    hasAnomalies,
    anomaliesDescription: anomalies,
    solutionsAdopted: solutions,
  });

  const handleNext = (): void => {
    if (!hasAnomalies) {
      alert('Informe se encontrou anomalias no local.');
      return;
    }
    if (hasAnomalies === 'sim') {
      if (!anomalies.trim()) {
        alert('Descreva as anomalias encontradas.');
        return;
      }
      if (!solutions.trim()) {
        alert('Informe as soluções adotadas.');
        return;
      }
    }
    onNext(getPageData());
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Integridade e Condições do Local</h1>
        <p>
          Registre anomalias encontradas no local e as
          soluções adotadas.
        </p>
      </div>

      <div className={styles.formCard}>
        <div className={styles.questionSection}>
          <h2>Encontrou anomalias no local?</h2>
          <p className={styles.questionHint}>
            Informe se há alguma irregularidade, dano ou
            condição inadequada no local de instalação das
            baterias.
          </p>

          <div className={styles.toggleGroup}>
            <button
              type="button"
              className={`${styles.toggleButton} ${
                hasAnomalies === 'sim'
                  ? styles.toggleButtonDanger
                  : ''
              }`}
              onClick={() => setHasAnomalies('sim')}
            >
              ⚠ Sim
            </button>
            <button
              type="button"
              className={`${styles.toggleButton} ${
                hasAnomalies === 'não'
                  ? styles.toggleButtonActive
                  : ''
              }`}
              onClick={() => setHasAnomalies('não')}
            >
              ✓ Não
            </button>
          </div>
        </div>

        {hasAnomalies === 'sim' && (
          <>
            <div
              className={styles.formGroup}
              style={{ marginTop: '24px' }}
            >
              <label htmlFor="anomalies">
                Anomalias Encontradas *
              </label>
              <textarea
                id="anomalies"
                value={anomalies}
                onChange={(e) =>
                  setAnomalies(e.target.value)
                }
                rows={4}
                placeholder="Descreva as anomalias encontradas no local..."
              />
            </div>

            <div
              className={styles.formGroup}
              style={{ marginTop: '16px' }}
            >
              <label htmlFor="solutions">
                Soluções Adotadas *
              </label>
              <textarea
                id="solutions"
                value={solutions}
                onChange={(e) =>
                  setSolutions(e.target.value)
                }
                rows={4}
                placeholder="Descreva as soluções que foram adotadas..."
              />
            </div>
          </>
        )}
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
          onClick={handleNext}
        >
          Avançar →
        </button>
      </div>
    </div>
  );
};
