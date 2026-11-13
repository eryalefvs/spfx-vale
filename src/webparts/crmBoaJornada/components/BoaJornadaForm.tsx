// ============================================================================
// BoaJornadaForm.tsx
// Formulário de preenchimento da Boa Jornada — layout baseado no PowerApps.
// ============================================================================

import * as React from 'react';
import styles from './CrmBoaJornada.module.scss';
import {
  BoaJornadaFormData,
  createDefaultForm,
  createEmptyAtividade,
  buildWeek,
  parseIsoDate,
  RiscoCriticoIcone,
  AtividadeFormRow,
  Sede,
  Responsavel
} from '../../../models/BoajornadaModels';
import { BoaJornadaService } from '../../../services/BoaJornadaService';
import { ActivityTableEditor } from './ActivityTableEditor';

export interface IBoaJornadaFormProps {
  onBack: () => void;
  onSaved: () => void;
}

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

/** Coordenações = valores distintos de Supervisão na lista Sedes */
export const getCoordenacoes = (sedes: Sede[]): { nome: string; gerencia: string }[] => {
  const map: Record<string, string> = {};
  sedes.forEach((s) => {
    if (s.supervisao && !(s.supervisao in map)) map[s.supervisao] = s.gerencia;
  });
  return Object.keys(map).sort().map((nome) => ({ nome, gerencia: map[nome] }));
};

/** Responsáveis da coordenação (fallback: mesma gerência) */
export const filterResponsaveis = (
  all: Responsavel[], coordenacao: string, gerencia: string
): Responsavel[] => {
  if (!coordenacao) return [];
  const bySup = all.filter((r) => r.supervisao === coordenacao);
  if (bySup.length) return bySup;
  return all.filter((r) => gerencia && r.gerencia === gerencia);
};

export const BoaJornadaForm: React.FC<IBoaJornadaFormProps> = ({ onBack, onSaved }) => {
  const service = React.useMemo(() => new BoaJornadaService(), []);

  // ── State ───────────────────────────────────────────────────────────
  const [formData, setFormData] = React.useState<BoaJornadaFormData>(createDefaultForm);
  const [riscos, setRiscos] = React.useState<RiscoCriticoIcone[]>([]);
  const [sedes, setSedes] = React.useState<Sede[]>([]);
  const [responsaveis, setResponsaveis] = React.useState<Responsavel[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [toast, setToast] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ── Load on mount ───────────────────────────────────────────────────
  React.useEffect(() => {
    service.loadRiscosCriticos().then(setRiscos)
      .catch((err) => console.error('[BoaJornadaForm] Erro ao carregar riscos:', err));
    service.loadSedes().then(setSedes)
      .catch((err) => console.error('[BoaJornadaForm] Erro ao carregar Sedes:', err));
    service.loadResponsaveis().then(setResponsaveis)
      .catch((err) => console.error('[BoaJornadaForm] Erro ao carregar Responsáveis:', err));
  }, []);

  // ── Auto-hide toast ─────────────────────────────────────────────────
  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
    return;
  }, [toast]);

  const coordenacoes = React.useMemo(() => getCoordenacoes(sedes), [sedes]);
  const gerencias = React.useMemo(
    () => coordenacoes.map((c) => c.gerencia).filter((g, i, a) => g && a.indexOf(g) === i).sort(),
    [coordenacoes]
  );
  const respFiltrados = React.useMemo(
    () => filterResponsaveis(responsaveis, formData.coordenacao, formData.gerencia),
    [responsaveis, formData.coordenacao, formData.gerencia]
  );

  // ── Handlers ────────────────────────────────────────────────────────

  const updateField = (field: keyof BoaJornadaFormData, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onCoordenacaoChange = (value: string): void => {
    const c = coordenacoes.find((x) => x.nome === value);
    setFormData((prev) => ({ ...prev, coordenacao: value, gerencia: c?.gerencia || prev.gerencia }));
  };

  const setModo = (modo: 'dia' | 'semana'): void => {
    setFormData((prev) => {
      if (prev.modo === modo) return prev;
      const base = prev.dias[0]?.data;
      const dias = modo === 'semana'
        ? buildWeek(base)
        : [{ data: base, incluido: true, atividades: [createEmptyAtividade()] }];
      return { ...prev, modo, dias };
    });
  };

  const changeWeek = (anyDate: string): void => {
    if (!anyDate) return;
    setFormData((prev) => ({ ...prev, dias: buildWeek(anyDate) }));
  };

  const updateDia = (index: number, patch: Partial<BoaJornadaFormData['dias'][0]>): void => {
    setFormData((prev) => {
      const dias = [...prev.dias];
      dias[index] = { ...dias[index], ...patch };
      return { ...prev, dias };
    });
  };

  const copiarParaProximo = (index: number): void => {
    const src = formData.dias[index].atividades;
    const copia: AtividadeFormRow[] = src.map((a) => ({ ...createEmptyAtividade(), ...a, tempId: createEmptyAtividade().tempId, status: '' }));
    updateDia(index + 1, { atividades: copia, incluido: true });
  };

  const handleSave = async (): Promise<void> => {
    if (!formData.coordenacao.trim()) {
      setToast({ type: 'error', message: 'Selecione a Coordenação.' });
      return;
    }
    if (formData.modo === 'semana' && !formData.semanaNome.trim()) {
      setToast({ type: 'error', message: 'Informe o nome da semana.' });
      return;
    }
    const diasValidos = formData.dias.filter(
      (d) => d.incluido && d.atividades.some((a) => a.atividade.trim())
    );
    if (!diasValidos.length) {
      setToast({ type: 'error', message: 'Adicione pelo menos uma atividade.' });
      return;
    }

    try {
      setSaving(true);
      const ids = await service.saveBoaJornadaCompleta(formData);
      setToast({
        type: 'success',
        message: ids.length > 1 ? `${ids.length} Boa Jornadas salvas com sucesso!` : 'Boa Jornada salva com sucesso!',
      });
      setTimeout(() => onSaved(), 1500);
    } catch (err) {
      console.error('[BoaJornadaForm] Erro ao salvar:', err);
      setToast({ type: 'error', message: 'Erro ao salvar. Tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  const formatDiaLabel = (iso: string): string => {
    const d = parseIsoDate(iso);
    return `${DIAS_SEMANA[d.getDay()]} — ${d.toLocaleDateString('pt-BR')}`;
  };

  const modoBtn = (modo: 'dia' | 'semana', label: string): React.ReactNode => (
    <button
      className={formData.modo === modo ? styles.btnSave : styles.btnCancel}
      onClick={() => setModo(modo)}
      style={{ padding: '6px 16px' }}
    >
      {label}
    </button>
  );

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className={styles.homePage}>
      <div className={styles.formContainer}>

        {toast && (
          <div className={toast.type === 'success' ? styles.successToast : styles.errorToast}>
            {toast.type === 'success' ? '✓' : '✕'} {toast.message}
          </div>
        )}

        {/* Header */}
        <div className={styles.formHeader}>
          <div className={styles.formHeaderLeft}>
            <button className={styles.formBackButton} onClick={onBack} title="Voltar">←</button>
            <h1 className={styles.formTitle}>Boa Jornada</h1>
          </div>
          <div className={styles.formHeaderRight}>
            <span className={styles.formHeaderLogo}>CRM</span>
            <span className={styles.formHeaderLogoCheck}>✓</span>
          </div>
        </div>

        {/* Modo */}
        <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
          {modoBtn('dia', '📅 Dia único')}
          {modoBtn('semana', '🗓️ Semana inteira')}
        </div>

        {/* Campos gerais */}
        <div className={styles.formFieldsRow}>
          <div className={styles.formFieldGroup}>
            <span className={styles.formFieldLabel}>Coordenação:</span>
            <select
              className={styles.formFieldInput}
              value={formData.coordenacao}
              onChange={(e) => onCoordenacaoChange(e.target.value)}
            >
              <option value="">— Selecione —</option>
              {coordenacoes.map((c) => <option key={c.nome} value={c.nome}>{c.nome}</option>)}
            </select>
          </div>
          <div className={styles.formFieldGroup}>
            <span className={styles.formFieldLabel}>Gerência:</span>
            <select
              className={styles.formFieldInput}
              value={formData.gerencia}
              onChange={(e) => updateField('gerencia', e.target.value)}
            >
              <option value="">— Selecione —</option>
              {gerencias.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className={styles.formFieldGroup}>
            {formData.modo === 'semana' && (
              <span className={styles.formFieldLabel}>Semana de:</span>
            )}
            <input
              type="date"
              className={`${styles.formFieldInput} ${styles.formFieldDate}`}
              value={formData.dias[0]?.data || ''}
              onChange={(e) =>
                formData.modo === 'semana'
                  ? changeWeek(e.target.value)
                  : updateDia(0, { data: e.target.value })
              }
            />
          </div>
        </div>

        <div className={styles.formFieldsRow}>
          <div className={styles.formFieldGroup} style={{ flex: 2 }}>
            <span className={styles.formFieldLabel}>Tema:</span>
            <input
              type="text"
              className={styles.formFieldInput}
              value={formData.tema}
              onChange={(e) => updateField('tema', e.target.value)}
              placeholder="Tema do Boa Jornada"
            />
          </div>
          {formData.modo === 'semana' && (
            <div className={styles.formFieldGroup}>
              <span className={styles.formFieldLabel}>Nome da semana:</span>
              <input
                type="text"
                className={styles.formFieldInput}
                value={formData.semanaNome}
                onChange={(e) => updateField('semanaNome', e.target.value)}
                placeholder="Ex: Parada Semana 45"
              />
            </div>
          )}
        </div>

        {/* Atividades */}
        <div className={styles.tableSection}>
          {formData.modo === 'dia' ? (
            <ActivityTableEditor
              rows={formData.dias[0].atividades}
              onChange={(rows) => updateDia(0, { atividades: rows })}
              riscos={riscos}
              responsaveis={respFiltrados}
              showHints
            />
          ) : (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                {formData.dias.map((d, i) => (
                  <label key={d.data} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                      type="checkbox"
                      checked={d.incluido}
                      onChange={(e) => updateDia(i, { incluido: e.target.checked })}
                    />
                    {formatDiaLabel(d.data)}
                  </label>
                ))}
              </div>
              {formData.dias.map((d, i) => d.incluido && (
                <details key={d.data} open={i === 0} style={{ marginBottom: 12, border: '1px solid #ddd', borderRadius: 6, padding: 8 }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 16 }}>
                    {formatDiaLabel(d.data)} — {d.atividades.filter((a) => a.atividade.trim()).length} atividade(s)
                  </summary>
                  <div style={{ marginTop: 8 }}>
                    <ActivityTableEditor
                      rows={d.atividades}
                      onChange={(rows) => updateDia(i, { atividades: rows })}
                      riscos={riscos}
                      responsaveis={respFiltrados}
                    />
                    {i < formData.dias.length - 1 && (
                      <button
                        className={styles.btnCancel}
                        style={{ marginTop: 8 }}
                        onClick={() => copiarParaProximo(i)}
                        title="Substitui as atividades do próximo dia"
                      >
                        ⤵ Copiar atividades para o próximo dia
                      </button>
                    )}
                  </div>
                </details>
              ))}
            </>
          )}
        </div>

        {/* Seção Inferior */}
        <div className={styles.bottomSection}>
          <div className={styles.bottomCell}>
            <div className={styles.bottomCellHeader}>
              <span className={styles.bottomCellHeaderLabel}>
                Riscos Críticos com maior índice de desvios:
              </span>
            </div>
            <textarea
              className={styles.bottomCellInput}
              value={formData.riscosMaiorIndice}
              onChange={(e) => updateField('riscosMaiorIndice', e.target.value)}
              placeholder="Informe os riscos..."
            />
          </div>
          <div className={styles.bottomCell}>
            <div className={styles.bottomCellHeader}>
              <span className={styles.bottomCellHeaderLabel}>Detalhamento dos desvios:</span>
            </div>
            <textarea
              className={styles.bottomCellInput}
              value={formData.detalhamento}
              onChange={(e) => updateField('detalhamento', e.target.value)}
              placeholder="Detalhe os desvios encontrados..."
            />
          </div>
        </div>

        {/* Ações */}
        <div className={styles.formActions}>
          <button className={styles.btnCancel} onClick={onBack}>Cancelar</button>
          <button className={styles.btnSave} onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : '💾 Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};
