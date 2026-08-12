// BatteryForm.tsx — Formulário de inserção de baterias + paste do Excel
import * as React from 'react';
import styles from './InputBatteries.module.scss';
import { Icon } from '@fluentui/react/lib/Icon';
import { PrimaryButton, DefaultButton } from '@fluentui/react/lib/Button';
import { Dropdown, IDropdownOption } from '@fluentui/react/lib/Dropdown';
import { LocationRule } from '../../../constants/DashboardConstants';
import { BatteryRow } from './InputBatteries';

export interface IBatteryFormProps {
  locationRule: LocationRule;
  rows: BatteryRow[];
  onRowsChange: (rows: BatteryRow[]) => void;
}

let _keyCounter = 0;
function nextKey(): string {
  return 'bat_' + (++_keyCounter) + '_' + Date.now();
}

export const BatteryForm: React.FC<IBatteryFormProps> = ({ locationRule, rows, onRowsChange }) => {
  const [selectedBank, setSelectedBank] = React.useState<number>(1);
  const [serialNumber, setSerialNumber] = React.useState('');
  const [model, setModel] = React.useState('');
  const [manufacturer, setManufacturer] = React.useState('');
  const [manufactureDate, setManufactureDate] = React.useState('');
  const pasteRef = React.useRef<HTMLDivElement>(null);

  // Opções de banco
  const bankOptions = React.useMemo<IDropdownOption[]>(() => {
    const opts: IDropdownOption[] = [];
    for (let i = 1; i <= locationRule.banks; i++) {
      opts.push({ key: i, text: 'Banco ' + i });
    }
    return opts;
  }, [locationRule.banks]);

  // Calcular próximo NO
  const getNextNO = React.useCallback((bank: number, currentRows: BatteryRow[]): number => {
    const bankRows = currentRows.filter((r) => r.bankNumber === bank);
    return bankRows.length + 1;
  }, []);

  // Adicionar uma linha manualmente
  const handleAddRow = React.useCallback(() => {
    if (!serialNumber.trim()) return;
    const newRow: BatteryRow = {
      _key: nextKey(),
      serialNumber: serialNumber.trim(),
      bankNumber: selectedBank,
      sequenceNumber: getNextNO(selectedBank, rows),
      model: model.trim(),
      manufacturer: manufacturer.trim(),
      manufactureDate: manufactureDate,
    };
    onRowsChange([...rows, newRow]);
    setSerialNumber('');
  }, [serialNumber, selectedBank, model, manufacturer, manufactureDate, rows, onRowsChange, getNextNO]);

  // Gerar linhas vazias para preencher um banco inteiro
  const handleGenerateBank = React.useCallback(() => {
    const count = locationRule.batteriesPerBank;
    const newRows: BatteryRow[] = [];
    const startNO = getNextNO(selectedBank, rows);
    for (let i = 0; i < count; i++) {
      newRows.push({
        _key: nextKey(),
        serialNumber: '',
        bankNumber: selectedBank,
        sequenceNumber: startNO + i,
        model: model.trim(),
        manufacturer: manufacturer.trim(),
        manufactureDate: manufactureDate,
      });
    }
    onRowsChange([...rows, ...newRows]);
  }, [locationRule.batteriesPerBank, selectedBank, model, manufacturer, manufactureDate, rows, onRowsChange, getNextNO]);

  // ── Excel Paste Handler ──────────────────────────────────────────────
  const handlePaste = React.useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    if (!text.trim()) return;

    const lines = text.trim().split('\n').map((line) => line.split('\t'));
    const newRows: BatteryRow[] = [];
    let seqNum = getNextNO(selectedBank, rows);

    for (const cols of lines) {
      if (cols.length === 0 || (cols.length === 1 && !cols[0].trim())) continue;

      // Esperado: Nº Série | Modelo | Fabricante | Data Fabricação (opcional)
      const row: BatteryRow = {
        _key: nextKey(),
        serialNumber: (cols[0] || '').trim(),
        bankNumber: selectedBank,
        sequenceNumber: seqNum++,
        model: (cols[1] || model).trim(),
        manufacturer: (cols[2] || manufacturer).trim(),
        manufactureDate: (cols[3] || manufactureDate || '').trim(),
      };

      // Tentar converter data BR (DD/MM/YYYY) para ISO
      if (row.manufactureDate && row.manufactureDate.includes('/')) {
        const parts = row.manufactureDate.split('/');
        if (parts.length === 3) {
          row.manufactureDate =
            parts[2] + '-' +
            ('0' + parts[1]).slice(-2) + '-' +
            ('0' + parts[0]).slice(-2);
        }
      }

      newRows.push(row);
    }

    if (newRows.length > 0) {
      onRowsChange([...rows, ...newRows]);
    }
  }, [selectedBank, model, manufacturer, manufactureDate, rows, onRowsChange, getNextNO]);

  return (
    <>
      {/* Paste Area */}
      <div
        ref={pasteRef}
        className={styles.pasteArea}
        tabIndex={0}
        onPaste={handlePaste}
      >
        <p className={styles.pasteTitle}>
          <Icon iconName="Paste" styles={{ root: { marginRight: 8 } }} />
          Cole dados do Excel aqui (Ctrl+V)
        </p>
        <p>Formato esperado: Nº Série | Modelo | Fabricante | Data Fabricação</p>
        <p className={styles.pasteSubtitle}>
          Selecione o banco abaixo antes de colar. A numeração (NO) será gerada automaticamente.
        </p>
      </div>

      {/* Manual form */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <p className={styles.cardTitle}>Adicionar Bateria</p>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <Dropdown
                label="Banco"
                selectedKey={selectedBank}
                options={bankOptions}
                onChange={(_, opt) => opt && setSelectedBank(Number(opt.key))}
                styles={{ dropdown: { borderRadius: 8 } }}
              />
            </div>
            <div className={styles.formField}>
              <label>Nº Série *</label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="Ex: ESB-WI 20062"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddRow(); }}
              />
            </div>
            <div className={styles.formField}>
              <label>Modelo</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Ex: SBS-170F"
              />
            </div>
            <div className={styles.formField}>
              <label>Fabricante</label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="Ex: EnerSys"
              />
            </div>
            <div className={styles.formField}>
              <label>Data Fabricação</label>
              <input
                type="date"
                value={manufactureDate}
                onChange={(e) => setManufactureDate(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <PrimaryButton
              text="Adicionar"
              iconProps={{ iconName: 'Add' }}
              onClick={handleAddRow}
              disabled={!serialNumber.trim()}
              styles={{ root: { borderRadius: 8 } }}
            />
            <DefaultButton
              text={`Gerar Banco ${selectedBank} (${locationRule.batteriesPerBank} linhas)`}
              iconProps={{ iconName: 'GridViewMedium' }}
              onClick={handleGenerateBank}
              styles={{ root: { borderRadius: 8 } }}
            />
            {rows.length > 0 && (
              <DefaultButton
                text="Limpar Tudo"
                iconProps={{ iconName: 'Delete' }}
                onClick={() => onRowsChange([])}
                styles={{ root: { borderRadius: 8, color: '#DC2626', borderColor: '#DC2626' } }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};
