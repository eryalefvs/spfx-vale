// ============================================================================
// ActivityTableEditor.tsx
// Tabela editável de atividades — reutilizada no formulário e no histórico.
// Colunas: Atividade | Tipo | Status | Pontos de atenção/desvios |
//          Executantes | Riscos Críticos aplicáveis
// ============================================================================

import * as React from 'react';
import { Dropdown, IDropdownOption, IDropdownStyles } from '@fluentui/react';
import styles from './CrmBoaJornada.module.scss';
import {
  AtividadeFormRow,
  RiscoCriticoIcone,
  Responsavel,
  createEmptyAtividade
} from '../../../models/BoajornadaModels';
import { TIPOS_ATIVIDADE, STATUS_ATIVIDADE } from '../../../constants/BoaJornadaConstants';
import { RiscosIconPicker } from './RiscosIconPicker';

export interface IActivityTableEditorProps {
  rows: AtividadeFormRow[];
  onChange: (rows: AtividadeFormRow[]) => void;
  riscos: RiscoCriticoIcone[];
  responsaveis: Responsavel[];
  showHints?: boolean;
}

const SEP = ';';

/** Separa a string de executantes em nomes da lista e "outros" (texto livre) */
export const splitExecutantes = (
  value: string,
  responsaveis: Responsavel[]
): { selecionados: string[]; outros: string } => {
  const nomes = value.split(SEP).map((s) => s.trim()).filter(Boolean);
  const lista = responsaveis.map((r) => r.nome);
  return {
    selecionados: nomes.filter((n) => lista.indexOf(n) >= 0),
    outros: nomes.filter((n) => lista.indexOf(n) < 0).join('; '),
  };
};

const joinExecutantes = (selecionados: string[], outros: string): string =>
  [...selecionados, ...outros.split(SEP).map((s) => s.trim()).filter(Boolean)].join('; ');

const selectStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 38,
  padding: '6px 8px',
  fontSize: '15px',
  fontWeight: 600,
  lineHeight: '1.4',
  borderRadius: 4,
  border: '1px solid #c8c6c4',
  backgroundColor: '#ffffff',
  color: '#323130',
  boxSizing: 'border-box',
  cursor: 'pointer'
};

const dropdownStyles: Partial<IDropdownStyles> = {
  root: { width: '100%' },
  dropdown: { width: '100%', minHeight: 38 },
  title: {
    height: 'auto',
    minHeight: 38,
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    lineHeight: '1.4',
    padding: '6px 28px 6px 8px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  caretDownWrapper: {
    height: 38,
    lineHeight: 38
  }
};

export const ActivityTableEditor: React.FC<IActivityTableEditorProps> = ({
  rows,
  onChange,
  riscos,
  responsaveis,
  showHints,
}) => {
  const [pickerRow, setPickerRow] = React.useState<number | null>(null);

  const respOptions: IDropdownOption[] = React.useMemo(
    () => responsaveis.map((r) => ({
      key: r.nome,
      text: r.matricula ? `${r.nome} (${r.matricula})` : r.nome,
    })),
    [responsaveis]
  );

  const update = (index: number, patch: Partial<AtividadeFormRow>): void => {
    const next = [...rows];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const add = (): void => onChange([...rows, createEmptyAtividade()]);
  const remove = (index: number): void => {
    if (rows.length <= 1) return;
    onChange(rows.filter((_, i) => i !== index));
  };

  const getRisco = (id: number): RiscoCriticoIcone | undefined => riscos.find((r) => r.id === id);

  const hint = (text: string): React.ReactNode =>
    showHints ? <span className={styles.tableHeaderHint}>{text}</span> : null;

  return (
    <>
      <table className={styles.activityTable} style={{ tableLayout: 'fixed', width: '100%' }}>
        <thead className={styles.tableHeader}>
          <tr>
            <th style={{ width: '22%' }}>
              <span className={styles.tableHeaderTitle}>Atividades</span>
              {hint('Descreva a atividade assim como consta na OM. Informe o número da OM.')}
            </th>
            <th style={{ width: '12%' }}>
              <span className={styles.tableHeaderTitle}>Tipo</span>
            </th>
            <th style={{ width: '13%' }}>
              <span className={styles.tableHeaderTitle}>Status</span>
            </th>
            <th style={{ width: '18%' }}>
              <span className={styles.tableHeaderTitle}>Pontos de atenção / desvios</span>
              {hint('Situações de risco, desvios ou observações da atividade.')}
            </th>
            <th style={{ width: '18%' }}>
              <span className={styles.tableHeaderTitle}>Executantes</span>
              {hint('Selecione da lista; contratados no campo livre.')}
            </th>
            <th style={{ width: '13%' }}>
              <span className={styles.tableHeaderTitle}>Riscos Críticos aplicáveis</span>
              {hint('O que pode matar: riscos críticos a verificar no CRM.')}
            </th>
            <th style={{ width: '4%' }} />
          </tr>
        </thead>
        <tbody className={styles.tableBody}>
          {rows.map((row, index) => {
            const exec = splitExecutantes(row.executantes, responsaveis);
            return (
              <tr key={row.tempId}>
                <td>
                  <textarea
                    className={styles.tableCellInput}
                    value={row.atividade}
                    onChange={(e) => update(index, { atividade: e.target.value })}
                    placeholder="Descreva a atividade..."
                  />
                </td>
                <td style={{ padding: '8px', verticalAlign: 'top' }}>
                  <select
                    style={selectStyle}
                    value={row.tipoAtividade}
                    onChange={(e) => update(index, { tipoAtividade: e.target.value })}
                  >
                    {TIPOS_ATIVIDADE.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </td>
                <td style={{ padding: '8px', verticalAlign: 'top' }}>
                  <select
                    style={selectStyle}
                    value={row.status}
                    onChange={(e) => update(index, { status: e.target.value })}
                  >
                    <option value="">— Selecione —</option>
                    {STATUS_ATIVIDADE.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td>
                  <textarea
                    className={styles.tableCellInput}
                    value={row.pontosAtencao}
                    onChange={(e) => update(index, { pontosAtencao: e.target.value })}
                    placeholder="Pontos de atenção / desvios..."
                  />
                </td>
                <td style={{ padding: '8px', verticalAlign: 'top', wordBreak: 'break-word' }}>
                  <Dropdown
                    placeholder={responsaveis.length ? 'Selecionar executantes' : 'Selecione a coordenação'}
                    multiSelect
                    options={respOptions}
                    selectedKeys={exec.selecionados}
                    disabled={!responsaveis.length}
                    styles={dropdownStyles}
                    onChange={(_, opt) => {
                      if (!opt) return;
                      const key = String(opt.key);
                      const sel = opt.selected
                        ? [...exec.selecionados, key]
                        : exec.selecionados.filter((k) => k !== key);
                      update(index, { executantes: joinExecutantes(sel, exec.outros) });
                    }}
                  />
                  <input
                    type="text"
                    style={{
                      marginTop: 6,
                      width: '100%',
                      minHeight: 34,
                      padding: '6px 8px',
                      fontSize: '14px',
                      borderRadius: 4,
                      border: '1px solid #c8c6c4',
                      boxSizing: 'border-box'
                    }}
                    value={exec.outros}
                    placeholder="Outros / contratados (sep. por ;)"
                    onChange={(e) =>
                      update(index, { executantes: joinExecutantes(exec.selecionados, e.target.value) })
                    }
                  />
                </td>
                <td>
                  <div className={styles.tableCellRiscos}>
                    {row.riscosCriticosIds.map((rId) => {
                      const risco = getRisco(rId);
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
                      onClick={() => setPickerRow(index)}
                      title="Selecionar riscos críticos"
                    >
                      +
                    </button>
                  </div>
                </td>
                <td>
                  {rows.length > 1 && (
                    <button
                      className={styles.removeRowButton}
                      onClick={() => remove(index)}
                      title="Remover atividade"
                    >
                      ✕
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <button className={styles.addRowButton} onClick={add}>
        + Adicionar Atividade
      </button>

      {pickerRow !== null && (
        <RiscosIconPicker
          riscos={riscos}
          selectedIds={rows[pickerRow]?.riscosCriticosIds || []}
          onConfirm={(ids) => {
            update(pickerRow, { riscosCriticosIds: ids });
            setPickerRow(null);
          }}
          onCancel={() => setPickerRow(null)}
        />
      )}
    </>
  );
};

