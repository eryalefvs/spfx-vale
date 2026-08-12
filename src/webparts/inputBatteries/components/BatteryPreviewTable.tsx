// BatteryPreviewTable.tsx — Tabela de preview com edição inline
import * as React from 'react';
import styles from './InputBatteries.module.scss';
import { PrimaryButton } from '@fluentui/react/lib/Button';
import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner';
import { LocationRule } from '../../../constants/DashboardConstants';
import { BatteryRow } from './InputBatteries';

export interface IBatteryPreviewTableProps {
  rows: BatteryRow[];
  onRowsChange: (rows: BatteryRow[]) => void;
  locationRule: LocationRule;
  saving: boolean;
  onSave: () => void;
  hasErrors: boolean;
}

export const BatteryPreviewTable: React.FC<IBatteryPreviewTableProps> = ({
  rows, onRowsChange, locationRule, saving, onSave, hasErrors,
}) => {

  const handleCellChange = React.useCallback((key: string, field: keyof BatteryRow, value: string | number) => {
    onRowsChange(
      rows.map((r) => r._key === key ? { ...r, [field]: value } : r)
    );
  }, [rows, onRowsChange]);

  const handleRemoveRow = React.useCallback((key: string) => {
    const updated = rows.filter((r) => r._key !== key);
    // Recalcular NO por banco
    const recalculated = updated.map((r) => {
      const bankRows = updated.filter((br) => br.bankNumber === r.bankNumber);
      const idx = bankRows.indexOf(r);
      return { ...r, sequenceNumber: idx + 1 };
    });
    onRowsChange(recalculated);
  }, [rows, onRowsChange]);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <p className={styles.cardTitle}>Preview — {rows.length} baterias</p>
          <p className={styles.cardSubtitle}>Clique em uma célula para editar</p>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>NO</th>
              <th>Banco</th>
              <th>Nº Série</th>
              <th>Modelo</th>
              <th>Fabricante</th>
              <th>Data Fabricação</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const isExcess = row.bankNumber > locationRule.banks ||
                rows.filter((r) => r.bankNumber === row.bankNumber).indexOf(row) >= locationRule.batteriesPerBank;

              return (
                <tr key={row._key} style={isExcess ? { backgroundColor: 'var(--danger-light)' } : undefined}>
                  <td style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>{idx + 1}</td>
                  <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{row.sequenceNumber}</td>
                  <td>
                    <select
                      className={styles.cellInput}
                      value={row.bankNumber}
                      onChange={(e) => handleCellChange(row._key, 'bankNumber', Number(e.target.value))}
                    >
                      {Array.from({ length: locationRule.banks }, (_, i) => (
                        <option key={i + 1} value={i + 1}>Banco {i + 1}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className={`${styles.cellInput} ${!row.serialNumber.trim() ? styles.cellError : ''}`}
                      value={row.serialNumber}
                      onChange={(e) => handleCellChange(row._key, 'serialNumber', e.target.value)}
                      placeholder="Nº Série *"
                    />
                  </td>
                  <td>
                    <input
                      className={styles.cellInput}
                      value={row.model}
                      onChange={(e) => handleCellChange(row._key, 'model', e.target.value)}
                      placeholder="Modelo"
                    />
                  </td>
                  <td>
                    <input
                      className={styles.cellInput}
                      value={row.manufacturer}
                      onChange={(e) => handleCellChange(row._key, 'manufacturer', e.target.value)}
                      placeholder="Fabricante"
                    />
                  </td>
                  <td>
                    <input
                      className={styles.cellInput}
                      type="date"
                      value={row.manufactureDate}
                      onChange={(e) => handleCellChange(row._key, 'manufactureDate', e.target.value)}
                    />
                  </td>
                  <td>
                    <button className={styles.removeBtn} onClick={() => handleRemoveRow(row._key)} title="Remover">
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={styles.actionBar}>
        <div className={styles.actionBarLeft}>
          {rows.length} {rows.length === 1 ? 'bateria' : 'baterias'} para inserir
        </div>
        <div className={styles.actionBarRight}>
          {saving ? (
            <Spinner size={SpinnerSize.small} label="Salvando..." />
          ) : (
            <PrimaryButton
              text="Salvar no SharePoint"
              iconProps={{ iconName: 'Save' }}
              onClick={onSave}
              disabled={hasErrors || rows.length === 0}
              styles={{
                root: {
                  borderRadius: 8,
                  backgroundColor: '#2563EB',
                  borderColor: '#2563EB',
                },
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
