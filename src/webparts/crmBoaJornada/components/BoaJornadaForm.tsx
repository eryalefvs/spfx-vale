// ============================================================================
// BoaJornadaForm.tsx
// Formulário de preenchimento da Boa Jornada — layout baseado no PowerApps.
// ============================================================================

import * as React from 'react';
import styles from './CrmBoaJornada.module.scss';
import {
  BoaJornadaFormData,
  DEFAULT_BOA_JORNADA_FORM,
  createEmptyAtividade,
  RiscoCriticoIcone,
  AtividadeFormRow
} from '../../../models/BoajornadaModels';
import { BoaJornadaService } from '../../../services/BoaJornadaService';
import { RiscosIconPicker } from './RiscosIconPicker';

export interface IBoaJornadaFormProps {
  onBack: () => void;
  onSaved: () => void;
}

export const BoaJornadaForm: React.FC<IBoaJornadaFormProps> = ({
  onBack,
  onSaved,
}) => {
  const service = React.useMemo(() => new BoaJornadaService(), []);

  // ── State ───────────────────────────────────────────────────────────
  const [formData, setFormData] = React.useState<BoaJornadaFormData>(
    DEFAULT_BOA_JORNADA_FORM
  );
  const [riscos, setRiscos] = React.useState<RiscoCriticoIcone[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [toast, setToast] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Picker state
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [pickerRowIndex, setPickerRowIndex] = React.useState<number>(0);

  // ── Load riscos on mount ────────────────────────────────────────────
  React.useEffect(() => {
    service.loadRiscosCriticos().then(setRiscos).catch((err) => {
      console.error('[BoaJornadaForm] Erro ao carregar riscos:', err);
    });
  }, []);

  // ── Auto-hide toast ─────────────────────────────────────────────────
  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
    return;
  }, [toast]);

  // ── Handlers ────────────────────────────────────────────────────────

  const updateField = (field: keyof BoaJornadaFormData, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateAtividade = (
    index: number,
    field: keyof AtividadeFormRow,
    value: string
  ): void => {
    setFormData((prev) => {
      const atividades = [...prev.atividades];
      atividades[index] = { ...atividades[index], [field]: value };
      return { ...prev, atividades };
    });
  };

  const addAtividade = (): void => {
    setFormData((prev) => ({
      ...prev,
      atividades: [...prev.atividades, createEmptyAtividade()],
    }));
  };

  const removeAtividade = (index: number): void => {
    setFormData((prev) => {
      if (prev.atividades.length <= 1) return prev;
      const atividades = prev.atividades.filter((_, i) => i !== index);
      return { ...prev, atividades };
    });
  };

  const openPicker = (rowIndex: number): void => {
    setPickerRowIndex(rowIndex);
    setPickerOpen(true);
  };

  const handlePickerConfirm = (selectedIds: number[]): void => {
    setFormData((prev) => {
      const atividades = [...prev.atividades];
      atividades[pickerRowIndex] = {
        ...atividades[pickerRowIndex],
        riscosCriticosIds: selectedIds,
      };
      return { ...prev, atividades };
    });
    setPickerOpen(false);
  };

  const handleSave = async (): Promise<void> => {
    // Validação básica
    if (!formData.area.trim()) {
      setToast({ type: 'error', message: 'Preencha o campo Área.' });
      return;
    }
    if (!formData.data) {
      setToast({ type: 'error', message: 'Preencha o campo Data.' });
      return;
    }
    const hasAtividades = formData.atividades.some((a) => a.atividade.trim());
    if (!hasAtividades) {
      setToast({ type: 'error', message: 'Adicione pelo menos uma atividade.' });
      return;
    }

    try {
      setSaving(true);
      await service.saveBoaJornadaCompleta(formData);
      setToast({ type: 'success', message: 'Boa Jornada salva com sucesso!' });
      setTimeout(() => onSaved(), 1500);
    } catch (err) {
      console.error('[BoaJornadaForm] Erro ao salvar:', err);
      setToast({ type: 'error', message: 'Erro ao salvar. Tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  const getRiscoById = (id: number): RiscoCriticoIcone | undefined =>
    riscos.find((r) => r.id === id);

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className={styles.formContainer}>

      {/* Toast */}
      {toast && (
        <div className={toast.type === 'success' ? styles.successToast : styles.errorToast}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.message}
        </div>
      )}

      {/* Header */}
      <div className={styles.formHeader}>
        <div className={styles.formHeaderLeft}>
          <button className={styles.formBackButton} onClick={onBack} title="Voltar">
            ←
          </button>
          <h1 className={styles.formTitle}>Boa Jornada</h1>
        </div>
        <div className={styles.formHeaderRight}>
          <span className={styles.formHeaderLogo}>CRM</span>
          <span className={styles.formHeaderLogoCheck}>✓</span>
        </div>
      </div>

      {/* Campos: Supervisão, Área, Data */}
      <div className={styles.formFieldsRow}>
        <div className={styles.formFieldGroup}>
          <span className={styles.formFieldLabel}>Supervisão:</span>
          <input
            type="text"
            className={styles.formFieldInput}
            value={formData.supervisao}
            onChange={(e) => updateField('supervisao', e.target.value)}
            placeholder="Informe a supervisão"
          />
        </div>
        <div className={styles.formFieldGroup}>
          <span className={styles.formFieldLabel}>Área:</span>
          <input
            type="text"
            className={styles.formFieldInput}
            value={formData.area}
            onChange={(e) => updateField('area', e.target.value)}
            placeholder="Ex: SAT 02"
          />
        </div>
        <div className={styles.formFieldGroup}>
          <input
            type="date"
            className={`${styles.formFieldInput} ${styles.formFieldDate}`}
            value={formData.data}
            onChange={(e) => updateField('data', e.target.value)}
          />
          <div className={styles.formFieldCalendarIcon}>📅</div>
        </div>
      </div>

      {/* Tabela de Atividades */}
      <div className={styles.tableSection}>
        <table className={styles.activityTable}>
          <thead className={styles.tableHeader}>
            <tr>
              <th style={{ width: '28%' }}>
                <span className={styles.tableHeaderTitle}>Atividades</span>
                <span className={styles.tableHeaderHint}>
                  Descreva a atividade assim como consta na Ordem de
                  Manutenção (OM). Informe o número da OM.
                </span>
              </th>
              <th style={{ width: '20%' }}>
                <span className={styles.tableHeaderTitle}>Executantes</span>
                <span className={styles.tableHeaderHint}>
                  Quem está nesta atividade (Próprios e Contratados)?
                </span>
              </th>
              <th style={{ width: '28%' }}>
                <span className={styles.tableHeaderTitle}>O que pode matar?</span>
                <span className={styles.tableHeaderHint}>
                  Identifique situações de riscos que podem levar a morte
                  se não gerenciadas e como poderia acontecer.
                </span>
              </th>
              <th style={{ width: '20%' }}>
                <span className={styles.tableHeaderTitle}>Riscos Críticos aplicáveis?</span>
                <span className={styles.tableHeaderHint}>
                  Informar quais riscos críticos devem ser verificados no CRM
                </span>
              </th>
              <th style={{ width: '4%' }}>{/* Ações */}</th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {formData.atividades.map((atividade, index) => (
              <tr key={atividade.tempId}>
                <td>
                  <textarea
                    className={styles.tableCellInput}
                    value={atividade.atividade}
                    onChange={(e) => updateAtividade(index, 'atividade', e.target.value)}
                    placeholder="Descreva a atividade..."
                  />
                </td>
                <td>
                  <textarea
                    className={styles.tableCellInput}
                    value={atividade.executantes}
                    onChange={(e) => updateAtividade(index, 'executantes', e.target.value)}
                    placeholder="Nomes dos executantes..."
                  />
                </td>
                <td>
                  <textarea
                    className={styles.tableCellInput}
                    value={atividade.oQuePodeMatar}
                    onChange={(e) => updateAtividade(index, 'oQuePodeMatar', e.target.value)}
                    placeholder="Riscos identificados..."
                  />
                </td>
                <td>
                  <div className={styles.tableCellRiscos}>
                    {atividade.riscosCriticosIds.map((rId) => {
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
                      title="Selecionar riscos críticos"
                    >
                      +
                    </button>
                  </div>
                </td>
                <td>
                  {formData.atividades.length > 1 && (
                    <button
                      className={styles.removeRowButton}
                      onClick={() => removeAtividade(index)}
                      title="Remover atividade"
                    >
                      ✕
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button className={styles.addRowButton} onClick={addAtividade}>
          + Adicionar Atividade
        </button>
      </div>

      {/* Seção Inferior */}
      <div className={styles.bottomSection}>
        <div className={styles.bottomCell}>
          <div className={styles.bottomCellHeader}>
            <span className={styles.bottomCellHeaderLabel}>
              Riscos Críticos com maior índice de desvios:
            </span>
            <span className={styles.bottomCellSublabel}>
              Aponte os Riscos Críticos com maior
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
            <span className={styles.bottomCellHeaderLabel}>Coordenação</span>
          </div>
          <textarea
            className={styles.bottomCellInput}
            value={formData.coordenacao}
            onChange={(e) => updateField('coordenacao', e.target.value)}
            placeholder=""
          />
        </div>
        <div className={styles.bottomCell}>
          <div className={styles.bottomCellHeader}>
            <span className={styles.bottomCellHeaderLabel}>Gerência</span>
          </div>
          <textarea
            className={styles.bottomCellInput}
            value={formData.gerencia}
            onChange={(e) => updateField('gerencia', e.target.value)}
            placeholder=""
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
        <button className={styles.btnCancel} onClick={onBack}>
          Cancelar
        </button>
        <button
          className={styles.btnSave}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Salvando...' : '💾 Salvar'}
        </button>
      </div>

      {/* Picker Modal */}
      {pickerOpen && (
        <RiscosIconPicker
          riscos={riscos}
          selectedIds={formData.atividades[pickerRowIndex]?.riscosCriticosIds || []}
          onConfirm={handlePickerConfirm}
          onCancel={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
};
