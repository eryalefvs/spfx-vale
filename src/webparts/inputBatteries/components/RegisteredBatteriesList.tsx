// RegisteredBatteriesList.tsx — Lista colapsável de locais com baterias cadastradas
// Hierarquia: Accordion → Sedes → Tipo de Local → Cards de Locais → Tabela de Baterias
import * as React from 'react';
import styles from './InputBatteries.module.scss';
import { Icon } from '@fluentui/react/lib/Icon';
import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner';
import { Location, Battery } from '../../../models/DashboardModels';
import { LOCATION_RULES } from '../../../constants/DashboardConstants';
import { SP_FIELDS } from '../../../constants/DashboardConstants';

export interface IRegisteredBatteriesListProps {
  locations: Location[];
}

interface LocationGroup {
  location: Location;
  batteries: Battery[];
}

export const RegisteredBatteriesList: React.FC<IRegisteredBatteriesListProps> = ({ locations }) => {
  const [groups, setGroups] = React.useState<LocationGroup[]>([]);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [selectedSede, setSelectedSede] = React.useState<string | undefined>();
  const [selectedLocationType, setSelectedLocationType] = React.useState<string | undefined>();
  const [selectedLocationId, setSelectedLocationId] = React.useState<number | undefined>();

  // Carregar todas as baterias ativas
  React.useEffect(() => {
    const loadAll = async (): Promise<void> => {
      try {
        const sp = (await import('../../../services/SharePointService')).SharePointService.sp;
        const f = SP_FIELDS.Batteries;
        const allBatteries = await sp.web.lists
          .getByTitle('Baterias_CSAT')
          .items
          .filter(`${f.Status} eq 'Ativa'`)
          .top(5000)();

        // Agrupar por IDLocalId
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const byLocation: Record<number, any[]> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const item of allBatteries as any[]) {
          const locId = item.IDLocalId;
          if (locId) {
            if (!byLocation[locId]) byLocation[locId] = [];
            byLocation[locId].push(item);
          }
        }

        // Criar groups para locais que têm baterias
        const result: LocationGroup[] = [];
        for (const loc of locations) {
          const items = byLocation[loc.id];
          if (items && items.length > 0) {
            result.push({
              location: loc,
              batteries: items.map((item) => ({
                id: item.Id || item.ID || 0,
                serialNumber: item.Title || '',
                sequenceNumber: item[f.NO] || 0,
                bankNumber: item[f.Banco] || 1,
                model: item[f.Modelo] || '',
                manufacturer: item[f.Fabricante] || '',
                manufactureDate: item[f.DataDeFabricacao] ? new Date(item[f.DataDeFabricacao]) : undefined,
                locationType: item[f.Local] || '',
                km: item[f.KM] || 0,
                locationId: item.IDLocalId,
                locationTitle: loc.title,
                status: item[f.Status] || 'Ativa',
              })),
            });
          }
        }

        setGroups(result);
      } catch (err) {
        console.error('[RegisteredBatteriesList] Erro:', err);
      } finally {
        setInitialLoading(false);
      }
    };

    if (locations.length > 0) {
      loadAll().catch(console.error);
    } else {
      setInitialLoading(false);
    }
  }, [locations]);

  // ── Dados derivados ──────────────────────────────────────────────────

  // Sedes disponíveis (apenas das que têm baterias)
  const sedes = React.useMemo<string[]>(() => {
    const sedeSet = new Set<string>();
    for (const g of groups) {
      if (g.location.sede) sedeSet.add(g.location.sede);
    }
    return Array.from(sedeSet).sort();
  }, [groups]);

  // Auto-selecionar primeira sede
  React.useEffect(() => {
    if (sedes.length > 0 && !selectedSede) {
      setSelectedSede(sedes[0]);
    }
  }, [sedes, selectedSede]);

  // Grupos filtrados pela sede
  const groupsBySede = React.useMemo(() => {
    if (!selectedSede) return groups;
    return groups.filter((g) => g.location.sede === selectedSede);
  }, [groups, selectedSede]);

  // Tipos de local disponíveis na sede selecionada
  const locationTypes = React.useMemo<string[]>(() => {
    const typeSet = new Set<string>();
    for (const g of groupsBySede) {
      if (g.location.locationType) typeSet.add(g.location.locationType);
    }
    return Array.from(typeSet).sort();
  }, [groupsBySede]);

  // Auto-selecionar primeiro tipo quando sede muda
  React.useEffect(() => {
    if (locationTypes.length > 0) {
      setSelectedLocationType(locationTypes[0]);
    } else {
      setSelectedLocationType(undefined);
    }
  }, [locationTypes]);

  // Grupos filtrados pela sede + tipo de local
  const filteredGroups = React.useMemo(() => {
    if (!selectedLocationType) return groupsBySede;
    return groupsBySede.filter((g) => g.location.locationType === selectedLocationType);
  }, [groupsBySede, selectedLocationType]);

  // Location selecionado para ver detalhes
  const selectedGroup = React.useMemo(() => {
    return groups.find((g) => g.location.id === selectedLocationId);
  }, [groups, selectedLocationId]);

  const handleLocationClick = React.useCallback((locId: number) => {
    setSelectedLocationId((prev) => (prev === locId ? undefined : locId));
  }, []);

  // ── Render ───────────────────────────────────────────────────────────

  if (initialLoading) {
    return (
      <div className={styles.spinnerOverlay}>
        <Spinner size={SpinnerSize.medium} label="Carregando baterias cadastradas..." />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className={styles.infoBanner}>
        <Icon iconName="Info" styles={{ root: { fontSize: 18, color: 'var(--accent)', flexShrink: 0 } }} />
        <div>Nenhum local possui baterias cadastradas ainda.</div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      {/* Accordion Header */}
      <button
        className={styles.accordionHeader}
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <div className={styles.accordionHeaderLeft}>
          <Icon
            iconName={isExpanded ? 'ChevronDown' : 'ChevronRight'}
            styles={{ root: { fontSize: 12, color: 'var(--text-muted)', marginRight: 10 } }}
          />
          <div>
            <span className={styles.accordionTitle}>
              <Icon iconName="Battery1" styles={{ root: { marginRight: 8, fontSize: 14 } }} />
              Baterias Cadastradas por Local
            </span>
            <span className={styles.accordionMeta}>
              {groups.length} locais com baterias ativas
            </span>
          </div>
        </div>
      </button>

      {/* Accordion Content */}
      {isExpanded && (
        <div className={styles.accordionContent}>
          {/* 1) Sede selector */}
          <div className={styles.sedeSelector}>
            {sedes.map((sede) => (
              <button
                key={sede}
                className={`${styles.sedeButton} ${selectedSede === sede ? styles.sedeButtonActive : ''}`}
                onClick={() => { setSelectedSede(sede); setSelectedLocationType(undefined); setSelectedLocationId(undefined); }}
              >
                {sede}
                <span className={styles.sedeCount}>
                  {groups.filter((g) => g.location.sede === sede).length}
                </span>
              </button>
            ))}
          </div>

          {/* 2) Location Type selector */}
          {selectedSede && locationTypes.length > 0 && (
            <div className={styles.sedeSelector} style={{ marginBottom: 16 }}>
              {locationTypes.map((locType) => {
                const count = groupsBySede.filter((g) => g.location.locationType === locType).length;
                return (
                  <button
                    key={locType}
                    className={`${styles.sedeButton} ${selectedLocationType === locType ? styles.sedeButtonActive : ''}`}
                    onClick={() => { setSelectedLocationType(locType); setSelectedLocationId(undefined); }}
                  >
                    {locType}
                    <span className={styles.sedeCount}>{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 3) Location chips grid */}
          {selectedLocationType && filteredGroups.length > 0 && (
            <div className={styles.batteryGrid}>
              {filteredGroups.map((group) => {
                const rule = LOCATION_RULES[group.location.locationType];
                const totalExpected = rule ? rule.total : 0;
                const isFull = rule && group.batteries.length >= rule.total;
                const isSelected = selectedLocationId === group.location.id;

                return (
                  <div
                    key={group.location.id}
                    className={`${styles.locationChip} ${isSelected ? styles.locationChipSelected : ''}`}
                    onClick={() => handleLocationClick(group.location.id)}
                  >
                    <span className={styles.chipSerial}>
                      {group.location.localKm || (group.location.locationType + ' · KM ' + group.location.km)}
                    </span>
                    <span className={styles.chipMeta}>
                      {group.batteries.length}/{totalExpected} baterias
                    </span>
                    <span
                      className={styles.chipStatus}
                      style={{
                        color: isFull ? 'var(--success)' : 'var(--warning)',
                      }}
                    >
                      {isFull ? '● Completo' : '○ Incompleto'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* 4) Tabela de baterias do local selecionado */}
          {selectedGroup && (
            <div className={styles.selectedLocationDetail}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    {selectedGroup.location.localKm || (selectedGroup.location.locationType + ' · KM ' + selectedGroup.location.km)}
                  </p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                    {selectedGroup.batteries.length} baterias cadastradas
                  </p>
                </div>
                <button
                  className={styles.removeBtn}
                  onClick={() => setSelectedLocationId(undefined)}
                  title="Fechar"
                  style={{ width: 28, height: 28, fontSize: '1.1rem' }}
                >
                  ×
                </button>
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
                    </tr>
                  </thead>
                  <tbody>
                    {selectedGroup.batteries
                      .sort((a, b) => a.bankNumber - b.bankNumber || a.sequenceNumber - b.sequenceNumber)
                      .map((bat) => (
                        <tr key={bat.id}>
                          <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{bat.sequenceNumber}</td>
                          <td>Banco {bat.bankNumber}</td>
                          <td style={{ fontWeight: 600 }}>{bat.serialNumber}</td>
                          <td>{bat.model}</td>
                          <td>{bat.manufacturer}</td>
                          <td>
                            {bat.manufactureDate
                              ? (bat.manufactureDate.getDate() + '/' +
                                (bat.manufactureDate.getMonth() + 1) + '/' +
                                bat.manufactureDate.getFullYear())
                              : '-'
                            }
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
