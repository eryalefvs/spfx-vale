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
  Responsavel,
  Sede,
  parseIsoDate
} from '../../../models/BoajornadaModels';
import { STATUS_CORES } from '../../../constants/BoaJornadaConstants';
import { BoaJornadaService } from '../../../services/BoaJornadaService';
import { ActivityTableEditor } from './ActivityTableEditor';
import { filterResponsaveis } from './BoaJornadaForm';

export interface IHistoryDetailProps {
  jornadaId: number;
  onBack: () => void;
}

export const StatusBadge: React.FC<{ status: string }> = ({ status }) =>
  status ? (
    <span style={{
      background: STATUS_CORES[status] || '#999', color: '#fff', borderRadius: 12,
      padding: '2px 10px', fontSize: 13, whiteSpace: 'nowrap'
    }}>{status}</span>
  ) : <span style={{ color: '#999' }}>—</span>;

export const HistoryDetail: React.FC<IHistoryDetailProps> = ({ jornadaId, onBack }) => {
  const service = React.useMemo(() => new BoaJornadaService(), []);

  // ── State ───────────────────────────────────────────────────────────
  const [infoGerais, setInfoGerais] = React.useState<BoaJornadaInfoGerais | null>(null);
  const [atividades, setAtividades] = React.useState<BoaJornadaAtividade[]>([]);
  const [riscos, setRiscos] = React.useState<RiscoCriticoIcone[]>([]);
  const [responsaveis, setResponsaveis] = React.useState<Responsavel[]>([]);
  const [sedes, setSedes] = React.useState<Sede[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState(false);
  const [editRows, setEditRows] = React.useState<AtividadeFormRow[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [toast, setToast] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  React.useEffect(() => {
    service.loadResponsaveis().then(setResponsaveis).catch((e) => console.error(e));
    service.loadSedes().then(setSedes).catch((e) => console.error(e));
  }, []);

  // ── Auto-hide toast ─────────────────────────────────────────────────
  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
    return;
  }, [toast]);

  const respFiltrados = React.useMemo(() => {
    if (!infoGerais) return [];
    const ger = infoGerais.gerencia || sedes.find((s) => s.supervisao === infoGerais.coordenacao)?.gerencia || '';
    return filterResponsaveis(responsaveis, infoGerais.coordenacao, ger);
  }, [responsaveis, sedes, infoGerais]);

  // ── Edit mode ───────────────────────────────────────────────────────

  const startEditing = (): void => {
    setEditRows(atividades.map((a) => ({
      tempId: `existing_${a.id}`,
      spId: a.id,
      atividade: a.atividade,
      executantes: a.executantes,
      tipoAtividade: a.tipoAtividade || 'Planejada',
      status: a.status,
      // registros antigos: traz o "O que pode matar" para os pontos de atenção
      pontosAtencao: a.pontosAtencao || a.oQuePodeMatar,
      riscosCriticosIds: [...a.riscosCriticosIds],
    })));
    setEditing(true);
  };

  const saveEdits = async (): Promise<void> => {
    try {
      setSaving(true);

      const keptIds = editRows.filter((r) => r.spId).map((r) => r.spId!);
      const deletedIds = atividades.map((a) => a.id).filter((id) => keptIds.indexOf(id) < 0);

      for (const id of deletedIds) {
        await service.deleteAtividade(id);
      }

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

  const getRiscoById = (id: number): RiscoCriticoIcone | undefined => riscos.find((r) => r.id === id);

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  const header = (
    <div className={styles.detailHeader}>
      <div className={styles.detailHeaderLeft}>
        <button className={styles.formBackButton} onClick={onBack} title="Voltar">←</button>
        <h1 className={styles.detailTitle}>Boa Jornada</h1>
      </div>
      <div className={styles.formHeaderRight}>
        <span className={styles.formHeaderLogo}>CRM</span>
        <span className={styles.formHeaderLogoCheck}>✓</span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={styles.homePage}>
        <div className={styles.detailContainer}>
          {header}
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <span className={styles.loadingText}>Carregando...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!infoGerais) return null;

  const field = (label: string, value: string): React.ReactNode => (
    <div className={styles.detailFieldGroup}>
      <span className={styles.detailFieldLabel}>{label}</span>
      <div className={styles.detailFieldValue}>{value || '—'}</div>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className={styles.homePage}>
      <div className={styles.detailContainer}>
        {toast && (
          <div className={toast.type === 'success' ? styles.successToast : styles.errorToast}>
            {toast.type === 'success' ? '✓' : '✕'} {toast.message}
          </div>
        )}

        {header}

        <div className={styles.detailFieldsRow}>
          {field('Gerência:', infoGerais.gerencia)}
          {field('Coordenação:', infoGerais.coordenacao)}
          {field('Data:', formatDate(infoGerais.data))}
        </div>
        <div className={styles.detailFieldsRow}>
          {field('Tema:', infoGerais.tema)}
          {infoGerais.semana && field('Semana:', infoGerais.semana)}
        </div>

        <div className={styles.detailTableSection}>
          {!editing ? (
            <>
              <table className={styles.detailTable} style={{ tableLayout: 'fixed', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '22%' }}>Atividades</th>
                    <th style={{ width: '12%' }}>Tipo</th>
                    <th style={{ width: '13%' }}>Status</th>
                    <th style={{ width: '18%' }}>Pontos de atenção / desvios</th>
                    <th style={{ width: '18%' }}>Executantes</th>
                    <th style={{ width: '17%' }}>Riscos Críticos aplicáveis</th>
                  </tr>
                </thead>
                <tbody>
                  {atividades.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#999' }}>
                        Nenhuma atividade registrada.
                      </td>
                    </tr>
                  ) : (
                    atividades.map((ativ) => (
                      <tr key={ativ.id}>
                        <td style={{ fontSize: '16px', wordBreak: 'break-word' }}>{ativ.atividade}</td>
                        <td style={{ fontSize: '15px' }}>{ativ.tipoAtividade || '—'}</td>
                        <td><StatusBadge status={ativ.status} /></td>
                        <td style={{ fontSize: '15px', wordBreak: 'break-word' }}>{ativ.pontosAtencao || ativ.oQuePodeMatar || '—'}</td>
                        <td style={{ fontSize: '15px', wordBreak: 'break-word', whiteSpace: 'normal' }}>{ativ.executantes}</td>
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button className={styles.btnEdit} onClick={startEditing}>
                  ✏️ Editar Atividades / Status
                </button>
              </div>
            </>
          ) : (
            <>
              <ActivityTableEditor
                rows={editRows}
                onChange={setEditRows}
                riscos={riscos}
                responsaveis={respFiltrados}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button className={styles.btnCancel} onClick={() => setEditing(false)}>Cancelar</button>
                <button className={styles.btnSave} onClick={saveEdits} disabled={saving}>
                  {saving ? 'Salvando...' : '💾 Salvar Alterações'}
                </button>
              </div>
            </>
          )}
        </div>

        <div className={styles.detailBottomSection}>
          <div className={styles.detailBottomCell}>
            <span className={styles.detailBottomLabel}>Riscos Críticos com maior índice de desvios:</span>
            <span className={styles.detailBottomValue}>{infoGerais.riscosMaiorIndice || '—'}</span>
          </div>
          <div className={styles.detailBottomCell}>
            <span className={styles.detailBottomLabel}>Detalhamento dos desvios:</span>
            <span className={styles.detailBottomValue}>{infoGerais.detalhamento || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// usado pelo HistoryList para formatar datas YYYY-MM-DD sem erro de fuso
export const formatIsoPtBr = (s: string): string =>
  s ? parseIsoDate(s).toLocaleDateString('pt-BR') : '—';
