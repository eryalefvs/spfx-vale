// InputBatteries.tsx — Componente principal da WebPart de Gestão de Baterias
import * as React from 'react';
import styles from './InputBatteries.module.scss';
import { IInputBatteriesProps } from './IInputBatteriesProps';
import { Icon } from '@fluentui/react/lib/Icon';
import { Dropdown, IDropdownOption } from '@fluentui/react/lib/Dropdown';
import { PrimaryButton, DefaultButton } from '@fluentui/react/lib/Button';
import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner';
import { MessageBar, MessageBarType } from '@fluentui/react/lib/MessageBar';
import { Location } from '../../../models/DashboardModels';
import { LOCATION_RULES, LocationRule } from '../../../constants/DashboardConstants';
import { BatteryService, NewBatteryData } from '../../../services/BatteryService';
import { BatteryForm } from './BatteryForm';
import { BatteryPreviewTable } from './BatteryPreviewTable';
import { ReplacementPanel } from './ReplacementPanel';
import { RegisteredBatteriesList } from './RegisteredBatteriesList';

type TabKey = 'insert' | 'replace';

/** Row editável no preview */
export interface BatteryRow {
  _key: string;
  serialNumber: string;
  bankNumber: number;
  sequenceNumber: number;
  model: string;
  manufacturer: string;
  manufactureDate: string;
}

const InputBatteries: React.FC<IInputBatteriesProps> = ({ userDisplayName }) => {
  // ── State ─────────────────────────────────────────────────────────────
  const [isDark, setIsDark] = React.useState<boolean>(() => {
    try { return localStorage.getItem('inputbat-theme') === 'dark'; } catch { return false; }
  });
  const [activeTab, setActiveTab] = React.useState<TabKey>('insert');
  const [locations, setLocations] = React.useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = React.useState<number | undefined>();
  const [rows, setRows] = React.useState<BatteryRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ text: string; type: MessageBarType } | null>(null);

  // ── Carregar locais ────────────────────────────────────────────────────
  React.useEffect(() => {
    BatteryService.loadLocations()
      .then((locs) => { setLocations(locs); setLoading(false); })
      .catch((err) => {
        console.error('[InputBatteries] Erro ao carregar locais:', err);
        setMessage({ text: 'Erro ao carregar locais: ' + err.message, type: MessageBarType.error });
        setLoading(false);
      });
  }, []);

  // ── Dados derivados ────────────────────────────────────────────────────
  const selectedLocation = React.useMemo(
    () => locations.find((l) => l.id === selectedLocationId),
    [locations, selectedLocationId]
  );

  const locationRule: LocationRule | undefined = React.useMemo(() => {
    if (!selectedLocation) return undefined;
    return LOCATION_RULES[selectedLocation.locationType] || undefined;
  }, [selectedLocation]);

  const locationOptions = React.useMemo<IDropdownOption[]>(() => {
    return [
      { key: '', text: 'Selecione um local...' },
      ...locations.map((l) => ({
        key: l.id,
        text: l.localKm || (l.locationType + ' · KM ' + l.km),
      })),
    ];
  }, [locations]);

  // ── Validação ──────────────────────────────────────────────────────────
  const validationMessages = React.useMemo<string[]>(() => {
    if (!locationRule || rows.length === 0) return [];
    const msgs: string[] = [];

    if (rows.length > locationRule.total) {
      msgs.push(`Excesso de baterias! O local suporta ${locationRule.total}, mas você inseriu ${rows.length}.`);
    }

    // Verificar por banco
    for (let bank = 1; bank <= locationRule.banks; bank++) {
      const bankRows = rows.filter((r) => r.bankNumber === bank);
      if (bankRows.length > 0 && bankRows.length < locationRule.batteriesPerBank) {
        msgs.push(`Banco ${bank}: inseridas ${bankRows.length} de ${locationRule.batteriesPerBank} baterias esperadas.`);
      }
      if (bankRows.length > locationRule.batteriesPerBank) {
        msgs.push(`Banco ${bank}: excesso! ${bankRows.length} baterias inseridas, máximo ${locationRule.batteriesPerBank}.`);
      }
    }

    // Verificar banco inválido
    const invalidBank = rows.find((r) => r.bankNumber > locationRule.banks);
    if (invalidBank) {
      msgs.push(`Banco ${invalidBank.bankNumber} não existe para este local. Máximo: ${locationRule.banks}.`);
    }

    return msgs;
  }, [rows, locationRule]);

  const hasErrors = validationMessages.some((m) => m.includes('Excesso') || m.includes('não existe'));

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleLocationChange = React.useCallback((_: unknown, opt?: IDropdownOption) => {
    setSelectedLocationId(opt?.key ? Number(opt.key) : undefined);
    setRows([]);
    setMessage(null);
  }, []);

  const handleToggleTheme = React.useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      try { localStorage.setItem('inputbat-theme', next ? 'dark' : 'light'); } catch { /* noop */ }
      return next;
    });
  }, []);

  const handleSave = React.useCallback(async () => {
    if (!selectedLocation || !locationRule || rows.length === 0) return;
    if (hasErrors) {
      setMessage({ text: 'Corrija os erros antes de salvar.', type: MessageBarType.error });
      return;
    }

    // Verificar se há serial number vazio
    const emptySerial = rows.find((r) => !r.serialNumber.trim());
    if (emptySerial) {
      setMessage({ text: 'Todos os campos de Nº Série devem ser preenchidos.', type: MessageBarType.error });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const batteryData: NewBatteryData[] = rows.map((r) => ({
        serialNumber: r.serialNumber,
        sequenceNumber: r.sequenceNumber,
        bankNumber: r.bankNumber,
        model: r.model,
        manufacturer: r.manufacturer,
        manufactureDate: r.manufactureDate || undefined,
        locationType: selectedLocation.locationType,
        km: String(selectedLocation.km),
        locationId: selectedLocation.id,
        status: 'Ativa',
      }));

      await BatteryService.addBatteries(batteryData);
      setMessage({ text: `${rows.length} baterias inseridas com sucesso!`, type: MessageBarType.success });
      setRows([]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setMessage({ text: 'Erro ao salvar: ' + errorMsg, type: MessageBarType.error });
    } finally {
      setSaving(false);
    }
  }, [selectedLocation, locationRule, rows, hasErrors]);

  // ── Render ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`${styles.root} ${isDark ? styles.rootDark : ''}`}>
        <div className={styles.spinnerOverlay}>
          <Spinner size={SpinnerSize.large} label="Carregando..." />
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.root} ${isDark ? styles.rootDark : ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Gestão de Baterias</h1>
          <p>Inserção e substituição de baterias · Baterias_SAT2</p>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.themeToggle} onClick={handleToggleTheme} title={isDark ? 'Modo Claro' : 'Modo Escuro'}>
            <Icon iconName={isDark ? 'Sunny' : 'ClearNight'} styles={{ root: { fontSize: 16, color: isDark ? '#FBBF24' : '#64748B' } }} />
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {/* Message */}
        {message && (
          <MessageBar messageBarType={message.type} onDismiss={() => setMessage(null)} dismissButtonAriaLabel="Fechar" styles={{ root: { borderRadius: 8, marginBottom: 16 } }}>
            {message.text}
          </MessageBar>
        )}

        {/* Location Selector */}
        <div className={styles.card}>
          <div className={styles.cardBody}>
            <div className={styles.formGrid}>
              <div className={styles.formField} style={{ gridColumn: 'span 2' }}>
                <Dropdown
                  label="Local de Instalação"
                  selectedKey={selectedLocationId ?? ''}
                  options={locationOptions}
                  onChange={handleLocationChange}
                  styles={{ dropdown: { borderRadius: 8 } }}
                />
              </div>
            </div>

            {/* Location info cards */}
            {locationRule && selectedLocation && (
              <div className={styles.locationInfo}>
                <div className={styles.locationInfoItem}>
                  <div className={'infoValue'} style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)' }}>
                    {selectedLocation.locationType}
                  </div>
                  <div className={'infoLabel'} style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tipo</div>
                </div>
                <div className={styles.locationInfoItem}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)' }}>
                    {locationRule.banks}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bancos</div>
                </div>
                <div className={styles.locationInfoItem}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)' }}>
                    {locationRule.batteriesPerBank}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Baterias/Banco</div>
                </div>
                <div className={styles.locationInfoItem}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)' }}>
                    {locationRule.total}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lista de locais com baterias cadastradas */}
        <RegisteredBatteriesList locations={locations} />

        {/* Tabs */}
        {selectedLocationId && (
          <>
            <div className={styles.tabBar}>
              <button className={`${styles.tab} ${activeTab === 'insert' ? styles.tabActive : ''}`} onClick={() => { setActiveTab('insert'); setRows([]); }}>
                <Icon iconName="Add" styles={{ root: { marginRight: 6 } }} />
                Inserir Baterias
              </button>
              <button className={`${styles.tab} ${activeTab === 'replace' ? styles.tabActive : ''}`} onClick={() => { setActiveTab('replace'); setRows([]); }}>
                <Icon iconName="Refresh" styles={{ root: { marginRight: 6 } }} />
                Substituir Baterias
              </button>
            </div>

            {activeTab === 'insert' && locationRule && selectedLocation && (
              <>
                {/* Info orientação */}
                <div className={styles.infoBanner}>
                  <Icon iconName="Info" styles={{ root: { fontSize: 18, color: 'var(--accent)', flexShrink: 0, marginTop: 2 } }} />
                  <div>
                    <strong>Orientação:</strong> Insira as baterias na ordem em que estão instaladas no local.
                    A numeração (NO) será atribuída automaticamente de acordo com a ordem de inserção.
                    Você pode colar dados do Excel (Nº Série, Modelo, Fabricante, Data Fabricação).
                  </div>
                </div>

                {/* Validation messages */}
                {validationMessages.length > 0 && (
                  <div className={validationMessages.some((m) => m.includes('Excesso') || m.includes('não existe')) ? styles.dangerBanner : styles.warningBanner}>
                    <Icon iconName="Warning" styles={{ root: { fontSize: 18, color: hasErrors ? 'var(--danger)' : 'var(--warning)', flexShrink: 0, marginTop: 2 } }} />
                    <div>
                      {validationMessages.map((msg, i) => (
                        <div key={i}>{msg}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Form + Preview */}
                <BatteryForm
                  locationRule={locationRule}
                  rows={rows}
                  onRowsChange={setRows}
                />

                {rows.length > 0 && (
                  <BatteryPreviewTable
                    rows={rows}
                    onRowsChange={setRows}
                    locationRule={locationRule}
                    saving={saving}
                    onSave={handleSave}
                    hasErrors={hasErrors}
                  />
                )}
              </>
            )}

            {activeTab === 'replace' && locationRule && selectedLocation && (
              <ReplacementPanel
                location={selectedLocation}
                locationRule={locationRule}
                onMessage={setMessage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InputBatteries;
