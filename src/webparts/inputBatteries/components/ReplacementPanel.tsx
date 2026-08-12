// ReplacementPanel.tsx — Painel de substituição de baterias
import * as React from 'react';
import styles from './InputBatteries.module.scss';
import { Icon } from '@fluentui/react/lib/Icon';
import { Dropdown, IDropdownOption } from '@fluentui/react/lib/Dropdown';
import { PrimaryButton, DefaultButton } from '@fluentui/react/lib/Button';
import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner';
import { MessageBarType } from '@fluentui/react/lib/MessageBar';
import { Location, Battery } from '../../../models/DashboardModels';
import { LocationRule } from '../../../constants/DashboardConstants';
import { BatteryService, NewBatteryData } from '../../../services/BatteryService';
import { BatteryRow } from './InputBatteries';
import { BatteryForm } from './BatteryForm';
import { BatteryPreviewTable } from './BatteryPreviewTable';

export interface IReplacementPanelProps {
  location: Location;
  locationRule: LocationRule;
  onMessage: (msg: { text: string; type: MessageBarType } | null) => void;
}

type ReplaceMode = 'bank' | 'individual';

let _repKeyCounter = 0;
function nextKey(): string {
  return 'repbat_' + (++_repKeyCounter) + '_' + Date.now();
}

export const ReplacementPanel: React.FC<IReplacementPanelProps> = ({
  location, locationRule, onMessage,
}) => {
  const [activeBatteries, setActiveBatteries] = React.useState<Battery[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [mode, setMode] = React.useState<ReplaceMode>('bank');
  const [selectedBank, setSelectedBank] = React.useState<number>(1);
  const [selectedBatteryIds, setSelectedBatteryIds] = React.useState<Set<number>>(new Set());
  const [newRows, setNewRows] = React.useState<BatteryRow[]>([]);
  const [saving, setSaving] = React.useState(false);

  // Carregar baterias ativas do local
  React.useEffect(() => {
    setLoading(true);
    setSelectedBatteryIds(new Set());
    setNewRows([]);
    BatteryService.loadActiveBatteriesByLocation(location.id)
      .then((bats) => { setActiveBatteries(bats); setLoading(false); })
      .catch((err) => {
        console.error('[ReplacementPanel] Erro:', err);
        onMessage({ text: 'Erro ao carregar baterias: ' + err.message, type: MessageBarType.error });
        setLoading(false);
      });
  }, [location.id]);

  // Baterias a serem substituídas (por banco ou individual)
  const batteriesToReplace = React.useMemo<Battery[]>(() => {
    if (mode === 'bank') {
      return activeBatteries.filter((b) => b.bankNumber === selectedBank);
    }
    return activeBatteries.filter((b) => selectedBatteryIds.has(b.id));
  }, [mode, selectedBank, selectedBatteryIds, activeBatteries]);

  // Validação
  const validationMessages = React.useMemo<string[]>(() => {
    const msgs: string[] = [];
    if (batteriesToReplace.length === 0 && activeBatteries.length > 0) {
      msgs.push('Selecione as baterias que deseja substituir.');
    }
    if (newRows.length > 0 && mode === 'bank') {
      if (newRows.length < locationRule.batteriesPerBank) {
        msgs.push(`Banco ${selectedBank}: inseridas ${newRows.length} de ${locationRule.batteriesPerBank} baterias esperadas.`);
      }
      if (newRows.length > locationRule.batteriesPerBank) {
        msgs.push(`Banco ${selectedBank}: excesso! ${newRows.length} baterias, máximo ${locationRule.batteriesPerBank}.`);
      }
    }
    if (newRows.length > 0 && mode === 'individual') {
      if (newRows.length !== batteriesToReplace.length) {
        msgs.push(`Você selecionou ${batteriesToReplace.length} baterias para substituir, mas inseriu ${newRows.length} novas.`);
      }
    }
    return msgs;
  }, [batteriesToReplace, newRows, mode, selectedBank, locationRule, activeBatteries]);

  const hasErrors = validationMessages.some((m) => m.includes('Excesso') || m.includes('excesso'));

  // Toggle individual selection
  const toggleBattery = React.useCallback((id: number) => {
    setSelectedBatteryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Bank options
  const bankOptions = React.useMemo<IDropdownOption[]>(() => {
    const opts: IDropdownOption[] = [];
    for (let i = 1; i <= locationRule.banks; i++) {
      const count = activeBatteries.filter((b) => b.bankNumber === i).length;
      opts.push({ key: i, text: `Banco ${i} (${count} baterias ativas)` });
    }
    return opts;
  }, [locationRule.banks, activeBatteries]);

  // Save handler
  const handleReplace = React.useCallback(async () => {
    if (batteriesToReplace.length === 0 || newRows.length === 0) return;

    const emptySerial = newRows.find((r) => !r.serialNumber.trim());
    if (emptySerial) {
      onMessage({ text: 'Todos os campos de Nº Série das novas baterias devem ser preenchidos.', type: MessageBarType.error });
      return;
    }

    setSaving(true);
    onMessage(null);

    try {
      const newBatteryData: NewBatteryData[] = newRows.map((r) => ({
        serialNumber: r.serialNumber,
        sequenceNumber: r.sequenceNumber,
        bankNumber: r.bankNumber,
        model: r.model,
        manufacturer: r.manufacturer,
        manufactureDate: r.manufactureDate || undefined,
        locationType: location.locationType,
        km: String(location.km),
        locationId: location.id,
        status: 'Ativa',
      }));

      await BatteryService.replaceBatteries(
        batteriesToReplace.map((b) => b.id),
        newBatteryData
      );

      onMessage({
        text: `Substituição concluída! ${batteriesToReplace.length} baterias inativadas, ${newRows.length} novas inseridas.`,
        type: MessageBarType.success,
      });

      // Recarregar
      const updated = await BatteryService.loadActiveBatteriesByLocation(location.id);
      setActiveBatteries(updated);
      setNewRows([]);
      setSelectedBatteryIds(new Set());
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      onMessage({ text: 'Erro na substituição: ' + errorMsg, type: MessageBarType.error });
    } finally {
      setSaving(false);
    }
  }, [batteriesToReplace, newRows, location, onMessage]);

  // ── Loading ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.spinnerOverlay}>
        <Spinner size={SpinnerSize.large} label="Carregando baterias ativas..." />
      </div>
    );
  }

  if (activeBatteries.length === 0) {
    return (
      <div className={styles.infoBanner}>
        <Icon iconName="Info" styles={{ root: { fontSize: 18, color: 'var(--accent)', flexShrink: 0 } }} />
        <div>Não há baterias ativas cadastradas neste local. Use a aba "Inserir Baterias" primeiro.</div>
      </div>
    );
  }

  return (
    <>
      {/* Orientação */}
      <div className={styles.infoBanner}>
        <Icon iconName="Info" styles={{ root: { fontSize: 18, color: 'var(--accent)', flexShrink: 0, marginTop: 2 } }} />
        <div>
          <strong>Substituição de Baterias:</strong> Selecione as baterias que serão substituídas.
          As baterias antigas serão marcadas como "Inativa" e as novas serão inseridas como "Ativa".
        </div>
      </div>

      {/* Modo de seleção */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <p className={styles.cardTitle}>Selecionar Baterias para Substituição</p>
        </div>
        <div className={styles.cardBody}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <DefaultButton
              text="Por Banco"
              checked={mode === 'bank'}
              iconProps={{ iconName: 'GridViewSmall' }}
              onClick={() => { setMode('bank'); setSelectedBatteryIds(new Set()); setNewRows([]); }}
              styles={{
                root: {
                  borderRadius: 8,
                  borderColor: mode === 'bank' ? 'var(--accent)' : 'var(--border-primary)',
                  backgroundColor: mode === 'bank' ? 'var(--accent-light)' : 'var(--bg-surface)',
                },
              }}
            />
            <DefaultButton
              text="Individual"
              checked={mode === 'individual'}
              iconProps={{ iconName: 'CheckboxComposite' }}
              onClick={() => { setMode('individual'); setNewRows([]); }}
              styles={{
                root: {
                  borderRadius: 8,
                  borderColor: mode === 'individual' ? 'var(--accent)' : 'var(--border-primary)',
                  backgroundColor: mode === 'individual' ? 'var(--accent-light)' : 'var(--bg-surface)',
                },
              }}
            />
          </div>

          {mode === 'bank' && (
            <Dropdown
              label="Selecionar Banco"
              selectedKey={selectedBank}
              options={bankOptions}
              onChange={(_, opt) => opt && setSelectedBank(Number(opt.key))}
              styles={{ dropdown: { borderRadius: 8 }, root: { maxWidth: 300 } }}
            />
          )}

          {mode === 'individual' && (
            <div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                Clique para selecionar/desselecionar:
              </p>
              <div className={styles.batteryGrid}>
                {activeBatteries.map((bat) => (
                  <div
                    key={bat.id}
                    className={`${styles.batteryChip} ${selectedBatteryIds.has(bat.id) ? styles.batteryChipSelected : ''}`}
                    onClick={() => toggleBattery(bat.id)}
                  >
                    <span className={styles.chipSerial}>{bat.serialNumber}</span>
                    <span className={styles.chipMeta}>Banco {bat.bankNumber} · NO {bat.sequenceNumber}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Baterias que serão inativadas */}
          {batteriesToReplace.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                Baterias que serão inativadas ({batteriesToReplace.length}):
              </p>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>NO</th>
                      <th>Banco</th>
                      <th>Nº Série</th>
                      <th>Modelo</th>
                      <th>Fabricante</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batteriesToReplace.map((bat) => (
                      <tr key={bat.id}>
                        <td>{bat.sequenceNumber}</td>
                        <td>Banco {bat.bankNumber}</td>
                        <td style={{ fontWeight: 600 }}>{bat.serialNumber}</td>
                        <td>{bat.model}</td>
                        <td>{bat.manufacturer}</td>
                        <td>
                          <span style={{
                            padding: '2px 8px', borderRadius: 4,
                            fontSize: '0.7rem', fontWeight: 600,
                            backgroundColor: 'var(--danger-light)', color: 'var(--danger)',
                          }}>
                            → Inativa
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Novas baterias */}
      {batteriesToReplace.length > 0 && (
        <>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <p className={styles.cardTitle}>Novas Baterias</p>
              <p className={styles.cardSubtitle}>Insira as baterias que substituirão as selecionadas</p>
            </div>
            <div className={styles.cardBody}>
              <BatteryForm
                locationRule={locationRule}
                rows={newRows}
                onRowsChange={setNewRows}
              />
            </div>
          </div>

          {/* Validações */}
          {validationMessages.length > 0 && (
            <div className={hasErrors ? styles.dangerBanner : styles.warningBanner}>
              <Icon iconName="Warning" styles={{ root: { fontSize: 18, flexShrink: 0, marginTop: 2 } }} />
              <div>
                {validationMessages.map((msg, i) => (
                  <div key={i}>{msg}</div>
                ))}
              </div>
            </div>
          )}

          {/* Preview das novas */}
          {newRows.length > 0 && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <p className={styles.cardTitle}>Preview — {newRows.length} novas baterias</p>
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
                      <th style={{ width: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {newRows.map((row) => (
                      <tr key={row._key}>
                        <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{row.sequenceNumber}</td>
                        <td>Banco {row.bankNumber}</td>
                        <td>
                          <input
                            className={`${styles.cellInput} ${!row.serialNumber.trim() ? styles.cellError : ''}`}
                            value={row.serialNumber}
                            onChange={(e) => {
                              setNewRows((prev) =>
                                prev.map((r) => r._key === row._key ? { ...r, serialNumber: e.target.value } : r)
                              );
                            }}
                            placeholder="Nº Série *"
                          />
                        </td>
                        <td>
                          <input
                            className={styles.cellInput}
                            value={row.model}
                            onChange={(e) => {
                              setNewRows((prev) =>
                                prev.map((r) => r._key === row._key ? { ...r, model: e.target.value } : r)
                              );
                            }}
                          />
                        </td>
                        <td>
                          <input
                            className={styles.cellInput}
                            value={row.manufacturer}
                            onChange={(e) => {
                              setNewRows((prev) =>
                                prev.map((r) => r._key === row._key ? { ...r, manufacturer: e.target.value } : r)
                              );
                            }}
                          />
                        </td>
                        <td>
                          <input
                            className={styles.cellInput}
                            type="date"
                            value={row.manufactureDate}
                            onChange={(e) => {
                              setNewRows((prev) =>
                                prev.map((r) => r._key === row._key ? { ...r, manufactureDate: e.target.value } : r)
                              );
                            }}
                          />
                        </td>
                        <td>
                          <button
                            className={styles.removeBtn}
                            onClick={() => {
                              setNewRows((prev) => prev.filter((r) => r._key !== row._key));
                            }}
                            title="Remover"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={styles.actionBar}>
                <div className={styles.actionBarLeft}>
                  {batteriesToReplace.length} a inativar · {newRows.length} a inserir
                </div>
                <div className={styles.actionBarRight}>
                  {saving ? (
                    <Spinner size={SpinnerSize.small} label="Substituindo..." />
                  ) : (
                    <PrimaryButton
                      text="Confirmar Substituição"
                      iconProps={{ iconName: 'Refresh' }}
                      onClick={handleReplace}
                      disabled={hasErrors || newRows.length === 0}
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
          )}
        </>
      )}
    </>
  );
};
