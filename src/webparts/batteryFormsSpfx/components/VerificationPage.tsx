import * as React from 'react';
import styles from './BatteryFormsSpfx.module.scss';
import { IWizardFormData } from '../../../models/BatteryInspection';
import {
  LOCATION_RULES,
  STATUS_COLORS,
} from '../../../constants/DashboardConstants';
import { BatteryStatus } from '../../../types/DashboardTypes';

export interface IVerificationPageProps {
  data: IWizardFormData;
  onNext: (data: Partial<IWizardFormData>) => void;
  onPrevious: (data?: Partial<IWizardFormData>) => void;
}

export const VerificationPage: React.FC<IVerificationPageProps> = ({
  data,
  onNext,
  onPrevious,
}) => {
  const [justification, setJustification] = React.useState(
    data.justificationLackOfInfo
  );

  const locationType = data.locationType;
  const rule = LOCATION_RULES[locationType];
  const parsedBatteries = data.parsedBatteries;

  // ── Verificações automáticas ────────────────────────────────────

  const expectedTotal = rule?.total || 0;
  const expectedBanks = rule?.banks || 1;
  const actualTotal = parsedBatteries.length;
  const actualBanks = new Set(
    parsedBatteries.map((b) => b.bankNumber)
  ).size;
  const uploadedFiles = data.uploadedFileNames.length;

  const hasMissingBatteries = actualTotal < expectedTotal;
  const hasMissingFiles =
    expectedBanks > 1 && uploadedFiles < expectedBanks;
  const needsJustification =
    hasMissingBatteries || hasMissingFiles;

  const warnings: string[] = [];
  if (hasMissingFiles) {
    warnings.push(
      `Esperado ${expectedBanks} arquivos para ${locationType} (${expectedBanks} bancos), mas apenas ${uploadedFiles} foi(ram) enviado(s).`
    );
  }
  if (hasMissingBatteries) {
    warnings.push(
      `Esperado ${expectedTotal} baterias para ${locationType}, mas apenas ${actualTotal} foram encontradas nos arquivos.`
    );
  }

  // ── Agrupar por banco ───────────────────────────────────────────

  const batteryByBank = parsedBatteries.reduce<
    Record<number, typeof parsedBatteries>
  >((acc, b) => {
    if (!acc[b.bankNumber]) acc[b.bankNumber] = [];
    acc[b.bankNumber].push(b);
    return acc;
  }, {});

  // ── Navegação ───────────────────────────────────────────────────

  const getPageData = (): Partial<IWizardFormData> => ({
    justificationLackOfInfo: justification,
  });

  const handleNext = (): void => {
    if (needsJustification && !justification.trim()) {
      alert(
        'Justifique as inconsistências encontradas nos dados.'
      );
      return;
    }
    onNext(getPageData());
  };

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Verificação dos Dados</h1>
        <p>
          Confira os dados extraídos dos arquivos de
          medição.
        </p>
      </div>

      {/* Avisos */}
      {warnings.length > 0 && (
        <div className={styles.warningBanner}>
          <span className={styles.warningIcon}>⚠</span>
          <div>
            {warnings.map((w, i) => (
              <p key={i}>{w}</p>
            ))}
          </div>
        </div>
      )}

      {/* Cards de resumo */}
      <div className={styles.verificationSummary}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>
            {actualTotal}
          </span>
          <span className={styles.summaryLabel}>
            Baterias Encontradas
          </span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>
            {expectedTotal}
          </span>
          <span className={styles.summaryLabel}>
            Baterias Esperadas
          </span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>
            {uploadedFiles}
          </span>
          <span className={styles.summaryLabel}>
            Arquivos Enviados
          </span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>
            {actualBanks}
          </span>
          <span className={styles.summaryLabel}>
            Bancos Identificados
          </span>
        </div>
      </div>

      {/* Tabela de dados por banco */}
      {Object.entries(batteryByBank).map(
        ([bank, batteries]) => (
          <div
            key={bank}
            className={styles.formCard}
            style={{ marginTop: '20px' }}
          >
            <h2 className={styles.sectionTitle}>
              Banco {bank}
            </h2>
            <div className={styles.tableContainer}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Nº</th>
                    <th>Tensão (V)</th>
                    <th>Resistência (mΩ)</th>
                    <th>Status Tensão</th>
                    <th>Status Resistência</th>
                    <th>Status Geral</th>
                  </tr>
                </thead>
                <tbody>
                  {batteries.map((b) => (
                    <tr key={`${bank}-${b.no}`}>
                      <td>{b.no}</td>
                      <td>{b.voltage.toFixed(2)}</td>
                      <td>{b.resistance.toFixed(2)}</td>
                      <td>
                        <span
                          className={
                            styles.statusBadge
                          }
                          style={{
                            backgroundColor:
                              STATUS_COLORS[
                                b.voltageStatus as BatteryStatus
                              ],
                          }}
                        >
                          {b.voltageStatus}
                        </span>
                      </td>
                      <td>
                        <span
                          className={
                            styles.statusBadge
                          }
                          style={{
                            backgroundColor:
                              STATUS_COLORS[
                                b.resistanceStatus as BatteryStatus
                              ],
                          }}
                        >
                          {b.resistanceStatus}
                        </span>
                      </td>
                      <td>
                        <span
                          className={
                            styles.statusBadge
                          }
                          style={{
                            backgroundColor:
                              STATUS_COLORS[
                                b.overallStatus as BatteryStatus
                              ],
                          }}
                        >
                          {b.overallStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Justificativa para dados faltantes */}
      {needsJustification && (
        <div
          className={styles.formCard}
          style={{ marginTop: '20px' }}
        >
          <div className={styles.formGroup}>
            <label htmlFor="justification">
              Justificativa para Dados Faltantes *
            </label>
            <textarea
              id="justification"
              value={justification}
              onChange={(e) =>
                setJustification(e.target.value)
              }
              rows={4}
              placeholder="Justifique a falta de informações de baterias..."
            />
          </div>
        </div>
      )}

      {/* Navegação */}
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
