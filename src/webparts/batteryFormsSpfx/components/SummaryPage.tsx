import * as React from 'react';
import styles from './BatteryFormsSpfx.module.scss';
import { IWizardFormData } from '../../../models/BatteryInspection';
import { InspectionService } from '../../../services/InspectionService';
import { STATUS_COLORS } from '../../../constants/DashboardConstants';
import { BatteryStatus } from '../../../types/DashboardTypes';

export interface ISummaryPageProps {
  data: IWizardFormData;
  onPrevious: (data?: Partial<IWizardFormData>) => void;
}

export const SummaryPage: React.FC<ISummaryPageProps> = ({
  data,
  onPrevious,
}) => {
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [saveError, setSaveError] = React.useState<
    string | null
  >(null);

  const service = React.useMemo(
    () => new InspectionService(),
    []
  );

  // ── Salvar inspeção ─────────────────────────────────────────────

  const saveInspection = async (): Promise<void> => {
    try {
      setIsSaving(true);
      setSaveError(null);

      // 1. Salvar atividade
      const activityId = await service.saveActivity(data);
      console.log(
        '[SummaryPage] Atividade salva com ID:',
        activityId
      );

      // 2. Salvar medições (vinculadas à atividade)
      if (data.parsedBatteries.length > 0) {
        await service.saveMeasurements(
          activityId,
          data.parsedBatteries,
          data.activityDate
        );
        console.log(
          '[SummaryPage] Medições salvas:',
          data.parsedBatteries.length
        );
      }

      setSaveSuccess(true);
    } catch (err) {
      console.error('Erro ao salvar inspeção:', err);
      setSaveError(
        'Ocorreu um erro ao salvar a inspeção. Tente novamente.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (): Promise<void> => {
    await saveInspection();
  };

  // ── Tela de sucesso ─────────────────────────────────────────────

  if (saveSuccess) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.successMessage}>
          <div className={styles.successIcon}>✓</div>
          <h1>Inspeção Salva com Sucesso!</h1>
          <p>
            Todos os dados foram registrados nas listas do
            SharePoint.
          </p>
          <div className={styles.successDetails}>
            <p>
              <strong>OM:</strong>{' '}
              {data.maintenanceOrder}
            </p>
            <p>
              <strong>Local:</strong>{' '}
              {data.locationType} — KM {data.km}
            </p>
            <p>
              <strong>Baterias registradas:</strong>{' '}
              {data.parsedBatteries.length}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Contagem de status ──────────────────────────────────────────

  const statusCount = data.parsedBatteries.reduce<
    Record<string, number>
  >((acc, b) => {
    acc[b.overallStatus] = (acc[b.overallStatus] || 0) + 1;
    return acc;
  }, {});

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Resumo da Inspeção</h1>
        <p>
          Confira todos os dados antes de salvar.
        </p>
      </div>

      {/* Informações da Atividade */}
      <div className={styles.formCard}>
        <h2 className={styles.sectionTitle}>
          Informações da Atividade
        </h2>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryItemLabel}>
              OM
            </span>
            <span className={styles.summaryItemValue}>
              {data.maintenanceOrder}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryItemLabel}>
              Data
            </span>
            <span className={styles.summaryItemValue}>
              {data.activityDate}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryItemLabel}>
              Tipo
            </span>
            <span className={styles.summaryItemValue}>
              {data.activityType}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryItemLabel}>
              Supervisão
            </span>
            <span className={styles.summaryItemValue}>
              {data.supervision}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryItemLabel}>
              Responsáveis
            </span>
            <span className={styles.summaryItemValue}>
              {data.responsibles.join(', ')}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryItemLabel}>
              Local
            </span>
            <span className={styles.summaryItemValue}>
              {data.locationType} — KM {data.km}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryItemLabel}>
              Sede
            </span>
            <span className={styles.summaryItemValue}>
              {data.sede}
            </span>
          </div>
          {data.generalObservations && (
            <div
              className={`${styles.summaryItem} ${styles.fullWidth}`}
            >
              <span className={styles.summaryItemLabel}>
                Observações Gerais
              </span>
              <span className={styles.summaryItemValue}>
                {data.generalObservations}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Contato e Integridade */}
      <div
        className={styles.formCard}
        style={{ marginTop: '16px' }}
      >
        <h2 className={styles.sectionTitle}>
          Contato e Integridade
        </h2>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryItemLabel}>
              Contato MCM
            </span>
            <span className={styles.summaryItemValue}>
              {data.contactMCM === 'sim'
                ? '✓ Sim'
                : '✕ Não'}
            </span>
          </div>
          {data.contactJustification && (
            <div className={styles.summaryItem}>
              <span className={styles.summaryItemLabel}>
                Justificativa MCM
              </span>
              <span className={styles.summaryItemValue}>
                {data.contactJustification}
              </span>
            </div>
          )}
          <div className={styles.summaryItem}>
            <span className={styles.summaryItemLabel}>
              Anomalias
            </span>
            <span className={styles.summaryItemValue}>
              {data.hasAnomalies === 'sim'
                ? '⚠ Sim'
                : '✓ Não'}
            </span>
          </div>
          {data.anomaliesDescription && (
            <div
              className={`${styles.summaryItem} ${styles.fullWidth}`}
            >
              <span className={styles.summaryItemLabel}>
                Descrição Anomalias
              </span>
              <span className={styles.summaryItemValue}>
                {data.anomaliesDescription}
              </span>
            </div>
          )}
          {data.solutionsAdopted && (
            <div
              className={`${styles.summaryItem} ${styles.fullWidth}`}
            >
              <span className={styles.summaryItemLabel}>
                Soluções Adotadas
              </span>
              <span className={styles.summaryItemValue}>
                {data.solutionsAdopted}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Dados Operacionais */}
      <div
        className={styles.formCard}
        style={{ marginTop: '16px' }}
      >
        <h2 className={styles.sectionTitle}>
          Dados Operacionais
        </h2>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryItemLabel}>
              Temperatura
            </span>
            <span className={styles.summaryItemValue}>
              {data.ambientTemperature} °C
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryItemLabel}>
              Tensão Total
            </span>
            <span className={styles.summaryItemValue}>
              {data.totalFloatVoltage} V
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryItemLabel}>
              Total de Baterias
            </span>
            <span className={styles.summaryItemValue}>
              {data.parsedBatteries.length}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryItemLabel}>
              Arquivos
            </span>
            <span className={styles.summaryItemValue}>
              {data.uploadedFileNames.join(', ')}
            </span>
          </div>
        </div>

        {/* Resumo de status */}
        {Object.keys(statusCount).length > 0 && (
          <div className={styles.statusSummary}>
            {Object.entries(statusCount).map(
              ([status, count]) => (
                <div
                  key={status}
                  className={styles.statusSummaryItem}
                >
                  <span
                    className={styles.statusBadge}
                    style={{
                      backgroundColor:
                        STATUS_COLORS[
                          status as BatteryStatus
                        ] || '#666',
                    }}
                  >
                    {status}
                  </span>
                  <span>{count} bateria(s)</span>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Observações de Saída */}
      {data.exitObservations && (
        <div
          className={styles.formCard}
          style={{ marginTop: '16px' }}
        >
          <h2 className={styles.sectionTitle}>
            Observações de Saída / 5S
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '15px',
              lineHeight: 1.6,
              color: '#475569',
            }}
          >
            {data.exitObservations}
          </p>
        </div>
      )}

      {/* Erro */}
      {saveError && (
        <div
          className={styles.errorMessage}
          style={{ marginTop: '16px' }}
        >
          {saveError}
        </div>
      )}

      {/* Navegação */}
      <div className={styles.navigation}>
        <button
          type="button"
          className={styles.btnSecondary}
          onClick={() => onPrevious()}
        >
          ← Voltar
        </button>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Salvando...' : '💾 Salvar Inspeção'}
        </button>
      </div>
    </div>
  );
};
