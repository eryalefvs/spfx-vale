// ============================================================================
// HistoryDetail.tsx
// Visualização detalhada de uma Boa Jornada — leitura com edição de atividades.
// ============================================================================

import * as React from 'react';
import styles from './CrmBoaJornada.module.scss';
import {
  BoaJornadaInfoGerais,
  BoaJornadaAtividade,
  RiscoCriticoIcone,
  AtividadeFormRow,
  createEmptyAtividade
} from '../../../models/BoajornadaModels';
import { BoaJornadaService } from '../../../services/BoaJornadaService';
import { RiscosIconPicker } from './RiscosIconPicker';

export interface IHistoryDetailProps {
  jornadaId: number;
  onBack: () => void;
}

export const HistoryDetail: React.FC<IHistoryDetailProps> = ({
  jornadaId,
  onBack,
}) => {
  const service = React.useMemo(() => new BoaJornadaService(), []);

  // ── State ───────────────────────────────────────────────────────────
  const [infoGerais, setInfoGerais] = React.useState<BoaJornadaInfoGerais | null>(null);
  const [atividades, setAtividades] = React.useState<BoaJornadaAtividade[]>([]);
  const [riscos, setRiscos] = React.useState<RiscoCriticoIcone[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState(false);
  const [editRows, setEditRows] = React.useState<(AtividadeFormRow & { spId?: number })[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [toast, setToast] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Picker state
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [pickerRowIndex, setPickerRowIndex] = React.useState<number>(0);

  // ── Load data ───────────────────────────────────────────────────────
  const loadData = async (): Promise<void> => {
    try {
      setLoading(true);
      const [info, ativs, riscosData] = await Promise.all([
        service.loadBoaJornadaById(jornadaId),
        service.loadAtividades(jornadaId),
        service.loadRiscosCriticos(),
      ]);
      setInfoGerais(info);
      setAtividades(ativs);
      setRiscos(riscosData);
    } catch (err) {
      console.error('[HistoryDetail] Erro ao carregar:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData().catch(() => { /* handled above */ });
  }, [jornadaId]);

  // ── Auto-hide toast ─────────────────────────────────────────────────
  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
    return;
  }, [toast]);

  // ── Edit mode ───────────────────────────────────────────────────────

  const startEditing = (): void => {
    const rows = atividades.map((a) => ({
      tempId: `existing_${a.id}`,
      spId: a.id,
      atividade: a.atividade,
      executantes: a.executantes,
      oQuePodeMatar: a.oQuePodeMatar,
      riscosCriticosIds: [...a.riscosCriticosIds],
    }));
    setEditRows(rows);
    setEditing(true);
  };

  const cancelEditing = (): void => {
    setEditing(false);
    setEditRows([]);
  };

  const updateEditRow = (
    index: number,
    field: keyof AtividadeFormRow,
    value: string
  ): void => {
    setEditRows((prev) => {
      const rows = [...prev];
      rows[index] = { ...rows[index], [field]: value };
      return rows;
    });
  };

  const addEditRow = (): void => {
    setEditRows((prev) => [...prev, { ...createEmptyAtividade(), spId: undefined }]);
  };

  const removeEditRow = (index: number): void => {
    if (editRows.length <= 1) return;
    setEditRows((prev) => prev.filter((_, i) => i !== index));
  };

  const openPicker = (rowIndex: number): void => {
    setPickerRowIndex(rowIndex);
    setPickerOpen(true);
  };

  const handlePickerConfirm = (selectedIds: number[]): void => {
    setEditRows((prev) => {
      const rows = [...prev];
      rows[pickerRowIndex] = { ...rows[pickerRowIndex], riscosCriticosIds: selectedIds };
      return rows;
    });
    setPickerOpen(false);
  };

  const saveEdits = async (): Promise<void> => {
    try {
      setSaving(true);

      // Identificar atividades existentes que foram removidas
      const existingIds = atividades.map((a) => a.id);
      const keptIds = editRows.filter((r) => r.spId).map((r) => r.spId!);
      const deletedIds = existingIds.filter((id) => keptIds.indexOf(id) < 0);

      // Deletar removidas
      for (const id of deletedIds) {
        await service.deleteAtividade(id);
      }

      // Atualizar existentes e criar novas
      for (const row of editRows) {
        if (!row.atividade.trim()) continue;

        if (row.spId) {
          await service.updateAtividade(row.spId, row);
        } else {
          await service.saveAtividades(jornadaId, [row]);
        }
      }

      setToast({ type: 'success', message: 'Atividades atualizadas com sucesso!' });
      setEditing(false);
      await loadData();
    } catch (err) {
      console.error('[HistoryDetail] Erro ao salvar edições:', err);
      setToast({ type: 'error', message: 'Erro ao salvar. Tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────

  const getRiscoById = (id: number): RiscoCriticoIcone | undefined =>
    riscos.find((r) => r.id === id);

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={styles.detailContainer}>
        <div className={styles.detailHeader}>
          <div className={styles.detailHeaderLeft}>
            <button className={styles.formBackButton} onClick={onBack} title="Voltar">
              ←
            </button>
            <h1 className={styles.detailTitle}>Boa Jornada</h1>
          </div>
        </div>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <span className={styles.loadingText}>Carregando...</span>
        </div>
      </div>
    );
  }

  if (!infoGerais) return null;

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className={styles.detailContainer}>
      {/* Toast */}
      {toast && (
        <div className={toast.type === 'success' ? styles.successToast : styles.errorToast}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.message}
        </div>
      )}

      {/* Header */}
      <div className={styles.detailHeader}>
        <div className={styles.detailHeaderLeft}>
          <button className={styles.formBackButton} onClick={onBack} title="Voltar">
            ←
          </button>
          <h1 className={styles.detailTitle}>Boa Jornada</h1>
        </div>
        <div className={styles.formHeaderRight}>
          <span className={styles.formHeaderLogo}>CRM</span>
          <span className={styles.formHeaderLogoCheck}>✓</span>
        </div>
      </div>

      {/* Campos (somente leitura) */}
      <div className={styles.detailFieldsRow}>
        <div className={styles.detailFieldGroup}>
          <span className={styles.detailFieldLabel}>Supervisão:</span>
          <div className={styles.detailFieldValue}>{infoGerais.supervisao || '—'}</div>
        </div>
        <div className={styles.detailFieldGroup}>
          <span className={styles.detailFieldLabel}>Área:</span>
          <div className={styles.detailFieldValue}>{infoGerais.area || '—'}</div>
        </div>
        <div className={styles.detailFieldGroup}>
          <span className={styles.detailFieldLabel}>Data:</span>
          <div className={styles.detailFieldValue}>{formatDate(infoGerais.data)}</div>
        </div>
      </div>

      {/* Tabela de Atividades */}
      <div className={styles.detailTableSection}>
        {!editing ? (
          // ── Modo leitura ─────────────────────────────────────────────
          <>
            <table className={styles.detailTable}>
              <thead>
                <tr>
                  <th style={{ width: '28%' }}>Atividades</th>
                  <th style={{ width: '20%' }}>Executantes</th>
                  <th style={{ width: '28%' }}>O que pode matar?</th>
                  <th style={{ width: '24%' }}>Riscos Críticos aplicáveis?</th>
                </tr>
              </thead>
              <tbody>
                {atividades.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#999' }}>
                      Nenhuma atividade registrada.
                    </td>
                  </tr>
                ) : (
                  atividades.map((ativ) => (
                    <tr key={ativ.id}>
                      <td>{ativ.atividade}</td>
                      <td>{ativ.executantes}</td>
                      <td>{ativ.oQuePodeMatar}</td>
                      <td>
                        <div className={styles.detailRiscosCell}>
                          {ativ.riscosCriticosIds.map((rId) => {
                            const risco = getRiscoById(rId);
                            return risco?.iconeUrl ? (
                              <img
                                key={rId}
                                src={risco.iconeUrl}
                                alt={risco.title}
                                className={styles.detailRiscoIcon}
                                title={risco.title}
                              />
                            ) : null;
                          })}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Botão editar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button className={styles.btnEdit} onClick={startEditing}>
                ✏️ Editar Atividades
              </button>
            </div>
          </>
        ) : (
          // ── Modo edição ──────────────────────────────────────────────
          <>
            <table className={styles.activityTable}>
              <thead className={styles.tableHeader}>
                <tr>
                  <th style={{ width: '28%' }}>
                    <span className={styles.tableHeaderTitle}>Atividades</span>
                  </th>
                  <th style={{ width: '20%' }}>
                    <span className={styles.tableHeaderTitle}>Executantes</span>
                  </th>
                  <th style={{ width: '28%' }}>
                    <span className={styles.tableHeaderTitle}>O que pode matar?</span>
                  </th>
                  <th style={{ width: '20%' }}>
                    <span className={styles.tableHeaderTitle}>Riscos Críticos</span>
                  </th>
                  <th style={{ width: '4%' }}>{/* Ações */}</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {editRows.map((row, index) => (
                  <tr key={row.tempId}>
                    <td>
                      <textarea
                        className={styles.tableCellInput}
                        value={row.atividade}
                        onChange={(e) => updateEditRow(index, 'atividade', e.target.value)}
                      />
                    </td>
                    <td>
                      <textarea
                        className={styles.tableCellInput}
                        value={row.executantes}
                        onChange={(e) => updateEditRow(index, 'executantes', e.target.value)}
                      />
                    </td>
                    <td>
                      <textarea
                        className={styles.tableCellInput}
                        value={row.oQuePodeMatar}
                        onChange={(e) => updateEditRow(index, 'oQuePodeMatar', e.target.value)}
                      />
                    </td>
                    <td>
                      <div className={styles.tableCellRiscos}>
                        {row.riscosCriticosIds.map((rId) => {
                          const risco = getRiscoById(rId);
                          return risco?.iconeUrl ? (
                            <img
                              key={rId}
                              src={risco.iconeUrl}
                              alt={risco.title}
                              className={styles.riscoIconSelected}
                              title={risco.title}
                            />
                          ) : null;
                        })}
                        <button
                          className={styles.addRiscoButton}
                          onClick={() => openPicker(index)}
                          title="Selecionar riscos"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>
                      {editRows.length > 1 && (
                        <button
                          className={styles.removeRowButton}
                          onClick={() => removeEditRow(index)}
                          title="Remover"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button className={styles.addRowButton} onClick={addEditRow}>
              + Adicionar Atividade
            </button>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <button className={styles.btnCancel} onClick={cancelEditing}>
                Cancelar
              </button>
              <button
                className={styles.btnSave}
                onClick={saveEdits}
                disabled={saving}
              >
                {saving ? 'Salvando...' : '💾 Salvar Alterações'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Seção Inferior (somente leitura) */}
      <div className={styles.detailBottomSection}>
        <div className={styles.detailBottomCell}>
          <span className={styles.detailBottomLabel}>
            Riscos Críticos com maior índice de desvios:
          </span>
          <span className={styles.detailBottomValue}>
            {infoGerais.riscosMaiorIndice || '—'}
          </span>
        </div>
        <div className={styles.detailBottomCell}>
          <span className={styles.detailBottomLabel}>Coordenação</span>
          <span className={styles.detailBottomValue}>
            {infoGerais.coordenacao || '—'}
          </span>
        </div>
        <div className={styles.detailBottomCell}>
          <span className={styles.detailBottomLabel}>Gerência</span>
          <span className={styles.detailBottomValue}>
            {infoGerais.gerencia || '—'}
          </span>
        </div>
        <div className={styles.detailBottomCell}>
          <span className={styles.detailBottomLabel}>Detalhamento dos desvios:</span>
          <span className={styles.detailBottomValue}>
            {infoGerais.detalhamento || '—'}
          </span>
        </div>
      </div>

      {/* Picker Modal */}
      {pickerOpen && (
        <RiscosIconPicker
          riscos={riscos}
          selectedIds={editRows[pickerRowIndex]?.riscosCriticosIds || []}
          onConfirm={handlePickerConfirm}
          onCancel={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
};
