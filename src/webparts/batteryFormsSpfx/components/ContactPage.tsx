import * as React from 'react';
import styles from './BatteryFormsSpfx.module.scss';
import { IWizardFormData } from '../../../models/BatteryInspection';

export interface IContactPageProps {
  data: IWizardFormData;
  onNext: (data: Partial<IWizardFormData>) => void;
  onPrevious: (data?: Partial<IWizardFormData>) => void;
}

export const ContactPage: React.FC<IContactPageProps> = ({
  data,
  onNext,
  onPrevious,
}) => {
  const [contactMCM, setContactMCM] = React.useState(
    data.contactMCM
  );
  const [justification, setJustification] = React.useState(
    data.contactJustification
  );

  const getPageData = (): Partial<IWizardFormData> => ({
    contactMCM,
    contactJustification: justification,
  });

  const handleNext = (): void => {
    if (!contactMCM) {
      alert('Informe se houve contato com o MCM.');
      return;
    }
    if (contactMCM === 'não' && !justification.trim()) {
      alert(
        'Justifique o motivo da falta de contato com o MCM.'
      );
      return;
    }
    onNext(getPageData());
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Contato com o Centro de Controle</h1>
        <p>
          Antes de acessar os equipamentos, confirme se
          houve comunicação com o MCM.
        </p>
      </div>

      <div className={styles.formCard}>
        <div className={styles.questionSection}>
          <h2>Houve contato com o MCM?</h2>
          <p className={styles.questionHint}>
            Antes de abrir a gaiola, porta ou qualquer
            acesso aos equipamentos, é necessário confirmar
            com o centro de controle que irá acessar o
            local.
          </p>

          <div className={styles.toggleGroup}>
            <button
              type="button"
              className={`${styles.toggleButton} ${
                contactMCM === 'sim'
                  ? styles.toggleButtonActive
                  : ''
              }`}
              onClick={() => setContactMCM('sim')}
            >
              ✓ Sim
            </button>
            <button
              type="button"
              className={`${styles.toggleButton} ${
                contactMCM === 'não'
                  ? styles.toggleButtonDanger
                  : ''
              }`}
              onClick={() => setContactMCM('não')}
            >
              ✕ Não
            </button>
          </div>
        </div>

        {contactMCM === 'não' && (
          <div
            className={styles.formGroup}
            style={{ marginTop: '24px' }}
          >
            <label htmlFor="contactJustification">
              Justificativa / Observações *
            </label>
            <textarea
              id="contactJustification"
              value={justification}
              onChange={(e) =>
                setJustification(e.target.value)
              }
              rows={4}
              placeholder="Informe o motivo da falta de contato com o MCM..."
            />
          </div>
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