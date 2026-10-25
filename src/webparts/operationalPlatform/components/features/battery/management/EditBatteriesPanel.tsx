// EditBatteriesPanel.tsx — Painel de edição inline de baterias já cadastradas
// Permite editar campos (Nº Série, Modelo, Fabricante, Data Fabricação) sem adicionar ou remover baterias
import * as React from 'react';
import styles from './InputBatteries.module.scss';
import { Icon } from '@fluentui/react/lib/Icon';
import { PrimaryButton } from '@fluentui/react/lib/Button';
import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner';
import { MessageBar, MessageBarType } from '@fluentui/react/lib/MessageBar';
import { Battery } from '../../../../../../models/DashboardModels';
import { LocationRule } from '../../../../../../constants/DashboardConstants';
import { BatteryService, UpdateBatteryData } from '../../../../../../services/BatteryService';

export interface IEditBatteriesPanelProps {
  batteries: Battery[];
  locationRule: LocationRule;
  onBatteriesUpdated: () => void;
}

/** Estado editável de cada bateria */
interface EditableBattery {
  id: number;
  sequenceNumber: number;
  bankNumber: number;
  serialNumber: string;
  model: string;
  manufacturer: string;
  manufactureDate: string;
  // Valores originais para dirty tracking
  _origSerialNumber: string;
  _origModel: string;
  _origManufacturer: string;
  _origManufactureDate: string;
}

function toEditableBattery(bat: Battery): EditableBattery {
  const dateStr = bat.manufactureDate
    ? bat.manufactureDate.getFullYear() + '-' +
      ('0' + (bat.manufactureDate.getMonth() + 1)).slice(-2) + '-' +
      ('0' + bat.manufactureDate.getDate()).slice(-2)
    : '';

  return {
    id: bat.id,
    sequenceNumber: bat.sequenceNumber,
    bankNumber: bat.bankNumber,
    serialNumber: bat.serialNumber,
    model: bat.model,
    manufacturer: bat.manufacturer,
    manufactureDate: dateStr,
    _origSerialNumber: bat.serialNumber,
    _origModel: bat.model,
    _origManufacturer: bat.manufacturer,
    _origManufactureDate: dateStr,
  };
}

function isDirty(bat: EditableBattery): boolean {
  return (
    bat.serialNumber !== bat._origSerialNumber ||
    bat.model !== bat._origModel ||
    bat.manufacturer !== bat._origManufacturer ||
    bat.manufactureDate !== bat._origManufactureDate
  );
}

export const EditBatteriesPanel: React.FC<IEditBatteriesPanelProps> = ({
  batteries, locationRule, onBatteriesUpdated,
}) => {
  const [editRows, setEditRows] = React.useState<EditableBattery[]>(() =>
    batteries
      .sort((a, b) => a.bankNumber - b.bankNumber || a.sequenceNumber - b.sequenceNumber)
      .map(toEditableBattery)
  );
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ text: string; type: MessageBarType } | null>(null);

  // Recalcular quando batteries mudar
  React.useEffect(() => {
    setEditRows(
      batteries
        .sort((a, b) => a.bankNumber - b.bankNumber || a.sequenceNumber - b.sequenceNumber)
        .map(toEditableBattery)
    );
  }, [batteries]);

  const dirtyRows = React.useMemo(() => editRows.filter(isDirty), [editRows]);
  const hasDirty = dirtyRows.length > 0;

  const handleCellChange = React.useCallback(
    (id: number, field: 'serialNumber' | 'model' | 'manufacturer' | 'manufactureDate', value: string) => {
      setEditRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
      );
    },
    []
  );

  const handleSave = React.useCallback(async () => {
    if (dirtyRows.length === 0) return;

    // Validar seriais não vazios
    const emptySerial = dirtyRows.find((r) => !r.serialNumber.trim());
    if (emptySerial) {
      setMessage({ text: 'O campo Nº Série não pode ficar vazio.', type: MessageBarType.error });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const updates: Array<{ id: number; data: UpdateBatteryData }> = dirtyRows.map((r) => ({
        id: r.id,
        data: {
          serialNumber: r.serialNumber.trim(),
          model: r.model.trim(),
          manufacturer: r.manufacturer.trim(),
          manufactureDate: r.manufactureDate || undefined,
        },
      }));

      await BatteryService.updateBatteries(updates);

      setMessage({
        text: `${updates.length} ${updates.length === 1 ? 'bateria atualizada' : 'baterias atualizadas'} com sucesso!`,
        type: MessageBarType.success,
      });

      // Atualizar originais para refletir o novo estado salvo
      setEditRows((prev) =>
        prev.map((r) =>
          isDirty(r)
            ? {
                ...r,
                _origSerialNumber: r.serialNumber,
                _origModel: r.model,
                _origManufacturer: r.manufacturer,
                _origManufactureDate: r.manufactureDate,
              }
            : r
        )
      );

      onBatteriesUpdated();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setMessage({ text: 'Erro ao salvar: ' + errorMsg, type: MessageBarType.error });
    } finally {
      setSaving(false);
    }
  }, [dirtyRows, onBatteriesUpdated]);

  return (
    <>
      {/* Info banner */}
      <div className={styles.infoBanner} style={{ borderLeft: '4px solid var(--accent)' }}>
        <Icon iconName="Edit" styles={{ root: { fontSize: 20, color: 'var(--accent)', flexShrink: 0, marginTop: 2 } }} />
        <div>
          <strong>Edição de Baterias Cadastradas</strong>
          <br />
          Este local já possui todas as baterias cadastradas ({editRows.length}/{locationRule.total}).
          Você pode editar os dados abaixo. Não é possível adicionar ou remover baterias neste modo.
        </div>
      </div>

      {/* Message */}
      {message && (
        <MessageBar
          messageBarType={message.type}
          onDismiss={() => setMessage(null)}
          dismissButtonAriaLabel="Fechar"
          styles={{ root: { borderRadius: 8, marginBottom: 16 } }}
        >
          {message.text}
        </MessageBar>
      )}

      {/* Editable table */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <p className={styles.cardTitle}>Baterias do Local — {editRows.length} itens</p>
            <p className={styles.cardSubtitle}>
              Clique em uma célula para editar. Campos modificados ficam destacados.
            </p>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>NO</th>
                <th>Banco</th>
                <th>Nº Série</th>
                <th>Modelo</th>
                <th>Fabricante</th>
                <th>Data Fab.</th>
                <th style={{ width: 40 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {editRows.map((row) => {
                const dirty = isDirty(row);
                return (
                  <tr key={row.id} style={dirty ? { backgroundColor: 'var(--accent-light, rgba(37, 99, 235, 0.06))' } : undefined}>
                    <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{row.sequenceNumber}</td>
                    <td>Banco {row.bankNumber}</td>
                    <td>
                      <input
                        className={`${styles.cellInput} ${!row.serialNumber.trim() ? styles.cellError : ''} ${row.serialNumber !== row._origSerialNumber ? styles.cellDirty || '' : ''}`}
                        value={row.serialNumber}
                        onChange={(e) => handleCellChange(row.id, 'serialNumber', e.target.value)}
                        placeholder="Nº Série *"
                      />
                    </td>
                    <td>
                      <input
                        className={`${styles.cellInput} ${row.model !== row._origModel ? styles.cellDirty || '' : ''}`}
                        value={row.model}
                        onChange={(e) => handleCellChange(row.id, 'model', e.target.value)}
                        placeholder="Modelo"
                      />
                    </td>
                    <td>
                      <input
                        className={`${styles.cellInput} ${row.manufacturer !== row._origManufacturer ? styles.cellDirty || '' : ''}`}
                        value={row.manufacturer}
                        onChange={(e) => handleCellChange(row.id, 'manufacturer', e.target.value)}
                        placeholder="Fabricante"
                      />
                    </td>
                    <td>
                      <input
                        className={`${styles.cellInput} ${row.manufactureDate !== row._origManufactureDate ? styles.cellDirty || '' : ''}`}
                        type="date"
                        value={row.manufactureDate}
                        onChange={(e) => handleCellChange(row.id, 'manufactureDate', e.target.value)}
                      />
                    </td>
                    <td>
                      {dirty ? (
                        <span style={{
                          padding: '2px 8px', borderRadius: 4,
                          fontSize: '0.7rem', fontWeight: 600,
                          backgroundColor: 'var(--accent-light, rgba(37, 99, 235, 0.08))',
                          color: 'var(--accent)',
                        }}>
                          Editado
                        </span>
                      ) : (
                        <span style={{
                          padding: '2px 8px', borderRadius: 4,
                          fontSize: '0.7rem', fontWeight: 600,
                          backgroundColor: 'var(--success-light, rgba(34, 197, 94, 0.08))',
                          color: 'var(--success, #22c55e)',
                        }}>
                          Ativa
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className={styles.actionBar}>
          <div className={styles.actionBarLeft}>
            {hasDirty
              ? `${dirtyRows.length} ${dirtyRows.length === 1 ? 'bateria modificada' : 'baterias modificadas'}`
              : 'Nenhuma alteração pendente'}
          </div>
          <div className={styles.actionBarRight}>
            {saving ? (
              <Spinner size={SpinnerSize.small} label="Salvando..." />
            ) : (
              <PrimaryButton
                text="Salvar Alterações"
                iconProps={{ iconName: 'Save' }}
                onClick={handleSave}
                disabled={!hasDirty}
                styles={{
                  root: {
                    borderRadius: 8,
                    backgroundColor: '#2563EB',
                    borderColor: '#2563EB',
                  },
                  rootDisabled: {
                    backgroundColor: 'var(--bg-tertiary, #e5e7eb)',
                  },
                }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};
