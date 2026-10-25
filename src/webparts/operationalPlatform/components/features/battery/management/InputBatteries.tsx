// InputBatteries.tsx — Componente principal da WebPart de Gestão de Baterias
import * as React from 'react';
import styles from './InputBatteries.module.scss';
import { IInputBatteriesProps } from './IInputBatteriesProps';
import { Icon } from '@fluentui/react/lib/Icon';
import { Dropdown, IDropdownOption } from '@fluentui/react/lib/Dropdown';
import { PrimaryButton, DefaultButton } from '@fluentui/react/lib/Button';
import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner';
import { MessageBar, MessageBarType } from '@fluentui/react/lib/MessageBar';
import { Location, Battery } from '../../../../../../models/DashboardModels';
import { LOCATION_RULES, LocationRule } from '../../../../../../constants/DashboardConstants';
import { BatteryService, NewBatteryData } from '../../../../../../services/BatteryService';
import { BatteryForm } from './BatteryForm';
import { BatteryPreviewTable } from './BatteryPreviewTable';
import { ReplacementPanel } from './ReplacementPanel';
import { RegisteredBatteriesList } from './RegisteredBatteriesList';
import { EditBatteriesPanel } from './EditBatteriesPanel';

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
  const [activeTab, setActiveTab] = React.useState<TabKey>('insert');
  const [locations, setLocations] = React.useState<Location[]>([]);
  const [selectedSede, setSelectedSede] = React.useState<string | undefined>();
  const [selectedSupervisao, setSelectedSupervisao] = React.useState<string | undefined>();
  const [selectedLocationId, setSelectedLocationId] = React.useState<number | undefined>();
  const [rows, setRows] = React.useState<BatteryRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ text: string; type: MessageBarType } | null>(null);
  const [existingBatteries, setExistingBatteries] = React.useState<Battery[]>([]);
  const [existingBatteriesCount, setExistingBatteriesCount] = React.useState<number>(0);
  const [checkingExisting, setCheckingExisting] = React.useState(false);

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

  // Supervisões disponíveis (extraídas dos locais carregados)
  const supervisaoOptions = React.useMemo<IDropdownOption[]>(() => {
    const supSet = new Set<string>();
    for (const loc of locations) {
      if (loc.supervisao) supSet.add(loc.supervisao);
    }
    const sorted = Array.from(supSet).sort();
    return [
      { key: '', text: 'Selecione uma supervisão...' },
      ...sorted.map((s) => ({ key: s, text: s })),
    ];
  }, [locations]);

  // Locais filtrados pela supervisão selecionada
  const locationsBySupervisao = React.useMemo(() => {
    if (!selectedSupervisao) return [];
    return locations.filter((l) => l.supervisao === selectedSupervisao);
  }, [locations, selectedSupervisao]);

  // Sedes disponíveis (coluna 'Sedes' da lista 'km das LI') dentro da supervisão
  const sedeOptions = React.useMemo<IDropdownOption[]>(() => {
    const sedeSet = new Set<string>();
    for (const loc of locationsBySupervisao) {
      if (loc.sede) sedeSet.add(loc.sede);
    }
    const sorted = Array.from(sedeSet).sort();
    return [
      { key: '', text: 'Todas as sedes' },
      ...sorted.map((s) => ({ key: s, text: s })),
    ];
  }, [locationsBySupervisao]);

  // Locais filtrados pela supervisão + sede (todas, se nenhuma sede)
  const filteredLocations = React.useMemo(() => {
    if (!selectedSede) return locationsBySupervisao;
    return locationsBySupervisao.filter((l) => l.sede === selectedSede);
  }, [locationsBySupervisao, selectedSede]);

  const locationOptions = React.useMemo<IDropdownOption[]>(() => {
    return [
      { key: '', text: 'Selecione um local...' },
      ...filteredLocations.map((l) => ({
        key: l.id,
        text: l.localKm || (l.locationType + ' · KM ' + l.km),
      })),
    ];
  }, [filteredLocations]);

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
    const locId = opt?.key ? Number(opt.key) : undefined;
    setSelectedLocationId(locId);
    setRows([]);
    setMessage(null);
    setExistingBatteries([]);
    setExistingBatteriesCount(0);

    // Verificar baterias ativas existentes no local selecionado
    if (locId) {
      setCheckingExisting(true);
      BatteryService.loadActiveBatteriesByLocation(locId)
        .then((bats) => {
          setExistingBatteries(bats);
          setExistingBatteriesCount(bats.length);
          setCheckingExisting(false);
        })
        .catch((err) => {
          console.error('[InputBatteries] Erro ao verificar baterias existentes:', err);
          setCheckingExisting(false);
        });
    }
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
        supervisao: selectedLocation.supervisao,
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
      <div className={styles.root}>
        <div className={styles.spinnerOverlay}>
          <Spinner size={SpinnerSize.large} label="Carregando..." />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Gestão de Baterias</h1>
          <p>Inserção e substituição de baterias</p>
        </div>
        <div className={styles.headerRight} />
      </div>

      <div className={styles.content}>
        {/* Message */}
        {message && (
          <MessageBar messageBarType={message.type} onDismiss={() => setMessage(null)} dismissButtonAriaLabel="Fechar" styles={{ root: { borderRadius: 8, marginBottom: 16 } }}>
            {message.text}
          </MessageBar>
        )}

        {/* Supervisão + Location Selector */}
        <div className={styles.card}>
          <div className={styles.cardBody}>
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <Dropdown
                  label="Supervisão"
                  selectedKey={selectedSupervisao ?? ''}
                  options={supervisaoOptions}
                  onChange={(_, opt) => {
                    const sup = opt?.key ? String(opt.key) : undefined;
                    setSelectedSupervisao(sup);
                    // Limpar sede e local ao trocar supervisão
                    setSelectedSede(undefined);
                    setSelectedLocationId(undefined);
                    setRows([]);
                    setMessage(null);
                    setExistingBatteries([]);
                    setExistingBatteriesCount(0);
                  }}
                  styles={{ dropdown: { borderRadius: 8 } }}
                />
              </div>
              <div className={styles.formField}>
                <Dropdown
                  label="Sede"
                  selectedKey={selectedSede ?? ''}
                  options={sedeOptions}
                  onChange={(_, opt) => {
                    const sede = opt?.key ? String(opt.key) : undefined;
                    setSelectedSede(sede);
                    // Limpar local ao trocar sede
                    setSelectedLocationId(undefined);
                    setRows([]);
                    setMessage(null);
                    setExistingBatteries([]);
                    setExistingBatteriesCount(0);
                  }}
                  disabled={!selectedSupervisao}
                  styles={{ dropdown: { borderRadius: 8 } }}
                />
              </div>
              <div className={styles.formField}>
                <Dropdown
                  label="Local de Instalação"
                  selectedKey={selectedLocationId ?? ''}
                  options={locationOptions}
                  onChange={handleLocationChange}
                  disabled={!selectedSupervisao}
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
                {/* Verificar se local já está completo */}
                {checkingExisting ? (
                  <div className={styles.infoBanner}>
                    <Spinner size={SpinnerSize.small} />
                    <div>Verificando baterias cadastradas...</div>
                  </div>
                ) : existingBatteriesCount >= locationRule.total ? (
                  <EditBatteriesPanel
                    batteries={existingBatteries}
                    locationRule={locationRule}
                    onBatteriesUpdated={() => {
                      // Recarregar baterias após edição
                      if (selectedLocationId) {
                        BatteryService.loadActiveBatteriesByLocation(selectedLocationId)
                          .then((bats) => {
                            setExistingBatteries(bats);
                            setExistingBatteriesCount(bats.length);
                          })
                          .catch(console.error);
                      }
                    }}
                  />
                ) : (
                  <>
                    {/* Info orientação */}
                    <div className={styles.infoBanner}>
                      <Icon iconName="Info" styles={{ root: { fontSize: 18, color: 'var(--accent)', flexShrink: 0, marginTop: 2 } }} />
                      <div>
                        <strong>Orientação:</strong> Insira as baterias na ordem em que estão instaladas no local.
                        A numeração (NO) será atribuída automaticamente de acordo com a ordem de inserção.
                        Você pode colar dados do Excel (Nº Série, Modelo, Fabricante, Data Fabricação).
                        {existingBatteriesCount > 0 && (
                          <span style={{ display: 'block', marginTop: 4, color: 'var(--warning)' }}>
                            ⚠ Este local já possui {existingBatteriesCount}/{locationRule.total} baterias cadastradas.
                          </span>
                        )}
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
