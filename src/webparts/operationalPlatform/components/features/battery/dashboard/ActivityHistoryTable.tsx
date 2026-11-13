// ActivityHistoryTable.tsx — Tabela de histórico de atividades com accordion de medições e filtros
import * as React from 'react';
import styles from './BatteryDashboard.module.scss';
import { Measurement, Battery, Activity, Location } from '../../../../../../models/DashboardModels';
import { formatDate, parseStatus, getStatusColor } from '../../../../../../utils/dashboardUtils';
import { downloadActivityPdf } from '../../../../../../utils/activityPdfGenerator';
import { Icon } from '@fluentui/react/lib/Icon';
import { IconButton } from '@fluentui/react/lib/Button';
import { SearchBox } from '@fluentui/react/lib/SearchBox';
import { Dropdown, IDropdownOption } from '@fluentui/react/lib/Dropdown';
import { TABLE_CONFIG } from '../../../../../../constants/DashboardConstants';
import { useDashboard } from '../../../../../../contexts/DashboardContext';
import { LoadingOverlay } from './LoadingOverlay';
import { ErrorState } from './ErrorState';
import { BatteryDetailsPanel } from './BatteryDetailsPanel';

export interface IActivityHistoryTableProps {
  measurements: Measurement[];
  batteries: Battery[];
  activities: Activity[];
  locations?: Location[];
  onSelectBattery: (id: number) => void;
}

interface EnrichedActivity extends Activity {
  measurements: Array<Measurement & { battery?: Battery }>;
  locationBatteries: Battery[];
  locationId?: number;
  resolvedSede: string;
  resolvedKm: string;
  resolvedLocationType: string;
  localKm: string;
}

export const ActivityHistoryTable: React.FC<IActivityHistoryTableProps> = ({
  measurements, batteries, activities, locations = [], onSelectBattery,
}) => {
  const [page, setPage] = React.useState(0);
  const [searchText, setSearchText] = React.useState('');
  const [selectedSede, setSelectedSede] = React.useState<string | undefined>(undefined);
  const [selectedLocationId, setSelectedLocationId] = React.useState<number | undefined>(undefined);
  const [expandedIds, setExpandedIds] = React.useState<Set<number>>(new Set());
  const pageSize = TABLE_CONFIG.defaultPageSize;

  // Mapa rápido de Location por ID
  const locationMap = React.useMemo(() => {
    const map: Record<number, Location> = {};
    for (const loc of locations) {
      map[loc.id] = loc;
    }
    return map;
  }, [locations]);

  // Opções de filtro: Sedes
  const sedeOptions = React.useMemo<IDropdownOption[]>(() => {
    const uniqueSedes = Array.from(
      new Set(locations.map((l) => l.sede).filter(Boolean))
    ).sort();
    return [
      { key: '', text: 'Todas' },
      ...uniqueSedes.map((s) => ({ key: s, text: s })),
    ];
  }, [locations]);

  // Opções de filtro: Local de Instalação (filtrado pela Sede selecionada)
  const locationOptions = React.useMemo<IDropdownOption[]>(() => {
    const filteredLocs = selectedSede
      ? locations.filter((l) => l.sede === selectedSede)
      : locations;
    return [
      { key: '', text: 'Todos' },
      ...filteredLocs.map((l) => ({
        key: l.id,
        text: l.localKm || `${l.locationType} - KM ${l.km}`,
      })),
    ];
  }, [locations, selectedSede]);

  // Enriquecer atividades com suas medições e dados de local
  const enrichedActivities = React.useMemo<EnrichedActivity[]>(() => {
    const measurementsByActivity: Record<number, Array<Measurement & { battery?: Battery }>> = {};
    for (const m of measurements) {
      if (!m.activityId) continue;
      if (!measurementsByActivity[m.activityId]) measurementsByActivity[m.activityId] = [];
      const battery = batteries.find((b) => b.id === m.batteryId);
      measurementsByActivity[m.activityId].push({ ...m, battery });
    }

    return activities
      .filter((a) => measurementsByActivity[a.id] && measurementsByActivity[a.id].length > 0)
      .map((a) => {
        const actMeasurements = (measurementsByActivity[a.id] || []).sort((x, y) => {
          const bx = x.battery;
          const by = y.battery;
          if (bx && by) return bx.bankNumber - by.bankNumber || bx.sequenceNumber - by.sequenceNumber;
          return 0;
        });

        const firstBatWithLoc = actMeasurements.find((m) => m.battery?.locationId !== undefined)?.battery;
        const locId = firstBatWithLoc?.locationId ?? a.locationId;
        const loc = locId !== undefined ? locationMap[locId] : undefined;

        const locationBatteries = locId !== undefined
          ? batteries
              .filter((b) => b.locationId === locId)
              .sort((x, y) => x.bankNumber - y.bankNumber || x.sequenceNumber - y.sequenceNumber)
          : actMeasurements
              .map((m) => m.battery)
              .filter((b): b is Battery => b !== undefined);

        return {
          ...a,
          measurements: actMeasurements,
          locationBatteries,
          locationId: locId,
          resolvedSede: loc?.sede || a.sede || '',
          resolvedKm: a.km || (loc ? String(loc.km) : ''),
          resolvedLocationType: a.locationType || loc?.locationType || '',
          localKm: loc?.localKm || '',
        };
      })
      .sort((a, b) => b.activityDate.getTime() - a.activityDate.getTime());
  }, [measurements, batteries, activities, locationMap]);

  // Filtro por Sede, Local de Instalação e busca textual
  const filtered = React.useMemo(() => {
    return enrichedActivities.filter((a) => {
      if (selectedSede && a.resolvedSede !== selectedSede) return false;
      if (selectedLocationId !== undefined && a.locationId !== selectedLocationId) return false;

      if (searchText) {
        const q = searchText.toLowerCase();
        const matchesText =
          a.maintenanceOrder.toLowerCase().includes(q) ||
          a.resolvedLocationType.toLowerCase().includes(q) ||
          a.resolvedKm.toLowerCase().includes(q) ||
          a.localKm.toLowerCase().includes(q) ||
          a.responsibles.some((r) => r.toLowerCase().includes(q));
        if (!matchesText) return false;
      }

      return true;
    });
  }, [enrichedActivities, selectedSede, selectedLocationId, searchText]);

  // Paginação
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const toggleExpand = React.useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSedeChange = React.useCallback((_: unknown, opt?: IDropdownOption) => {
    const val = opt?.key ? String(opt.key) : undefined;
    setSelectedSede(val);
    setSelectedLocationId(undefined);
    setPage(0);
  }, []);

  const handleLocationChange = React.useCallback((_: unknown, opt?: IDropdownOption) => {
    const val = opt?.key ? Number(opt.key) : undefined;
    setSelectedLocationId(val);
    setPage(0);
  }, []);

  const handleClearFilters = React.useCallback(() => {
    setSelectedSede(undefined);
    setSelectedLocationId(undefined);
    setSearchText('');
    setPage(0);
  }, []);

  const hasActiveFilters = Boolean(selectedSede || selectedLocationId !== undefined || searchText);

  return (
    <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
      {/* Header */}
      <div className={styles.chartCardHeader}>
        <div>
          <p className={styles.chartCardTitle}>Histórico de Atividades</p>
          <p className={styles.chartCardSubtitle}>{filtered.length} atividades encontradas</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Filtro de Sedes */}
          <div className={styles.filterItem}>
            <span className={styles.filterLabel}>Sedes:</span>
            <Dropdown
              placeholder="Todas"
              selectedKey={selectedSede ?? ''}
              options={sedeOptions}
              onChange={handleSedeChange}
              styles={{
                root: { minWidth: 130 },
                dropdown: { width: 130 },
              }}
            />
          </div>

          {/* Filtro de Local de Instalação */}
          <div className={styles.filterItem}>
            <span className={styles.filterLabel}>Local de Instalação:</span>
            <Dropdown
              placeholder="Todos"
              selectedKey={selectedLocationId ?? ''}
              options={locationOptions}
              onChange={handleLocationChange}
              styles={{
                root: { minWidth: 180 },
                dropdown: { width: 180 },
              }}
            />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className={styles.filterClearBtn}
              onClick={handleClearFilters}
              title="Limpar filtros"
            >
              ✕ Limpar
            </button>
          )}

          <SearchBox
            placeholder="Buscar por OM, local, responsável..."
            value={searchText}
            onChange={(_, v) => { setSearchText(v || ''); setPage(0); }}
            styles={{ root: { width: 240, borderRadius: 8 } }}
          />
        </div>
      </div>

      {/* Tabela */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: 36 }}></th>
              <th>Data</th>
              <th>OM</th>
              <th>Local</th>
              <th>KM</th>
              <th>Responsável</th>
              <th>Tensão Total</th>
              <th>Temp. Amb.</th>
              <th>Medições</th>
              <th style={{ width: 40 }}>PDF</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((act) => {
              const isExpanded = expandedIds.has(act.id);

              return (
                <React.Fragment key={act.id}>
                  {/* Activity row */}
                  <tr
                    className={styles.activityRow}
                    onClick={() => toggleExpand(act.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <Icon
                        iconName={isExpanded ? 'ChevronDown' : 'ChevronRight'}
                        styles={{ root: { fontSize: 11, color: 'var(--text-muted)' } }}
                      />
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatDate(act.activityDate)}</td>
                    <td>{act.maintenanceOrder || '-'}</td>
                    <td>{act.resolvedLocationType || '-'}</td>
                    <td>{act.resolvedKm || '-'}</td>
                    <td>{act.responsibles.length > 0 ? act.responsibles.join(', ') : '-'}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent)' }}>
                      {act.totalVoltage ? act.totalVoltage + ' V' : '-'}
                    </td>
                    <td>{act.roomTemperature ? act.roomTemperature + ' °C' : '-'}</td>
                    <td>
                      <span className={styles.measurementBadge}>
                        {act.measurements.length}
                      </span>
                    </td>
                    <td>
                      <IconButton
                        iconProps={{ iconName: 'PDF' }}
                        title="Baixar relatório em PDF"
                        styles={{
                          root: { width: 28, height: 28 },
                          icon: { fontSize: 15, color: '#DC2626' },
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadActivityPdf(act);
                        }}
                      />
                    </td>
                  </tr>

                  {/* Expanded measurements */}
                  {isExpanded && (
                    <tr className={styles.expandedRow}>
                      <td colSpan={10} style={{ padding: 0 }}>
                        <div className={styles.expandedContent}>
                          <table className={styles.innerTable}>
                            <thead>
                              <tr>
                                <th>NO</th>
                                <th>Banco</th>
                                <th>Nº Série</th>
                                <th>Tensão (V)</th>
                                <th>Resistência (Ω)</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {act.measurements.map((m) => {
                                const status = parseStatus(m.overallStatus);
                                return (
                                  <tr
                                    key={m.id}
                                    onClick={(e) => { e.stopPropagation(); if (m.batteryId !== undefined) { onSelectBattery(m.batteryId) } }}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    <td style={{ fontWeight: 600, color: 'var(--accent)' }}>
                                      {m.battery ? m.battery.sequenceNumber : '-'}
                                    </td>
                                    <td>Banco {m.battery ? m.battery.bankNumber : '-'}</td>
                                    <td style={{ fontWeight: 600 }}>{m.batterySerialNumber}</td>
                                    <td>{m.voltage.toFixed(2)}</td>
                                    <td>{m.resistance.toFixed(2)}</td>
                                    <td>
                                      <span
                                        style={{
                                          padding: '2px 8px',
                                          borderRadius: 4,
                                          fontSize: '0.68rem',
                                          fontWeight: 600,
                                          backgroundColor: getStatusColor(status) + '20',
                                          color: getStatusColor(status),
                                        }}
                                      >
                                        {m.overallStatus || status}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>
            Página {page + 1} de {totalPages}
          </span>
          <div className={styles.paginationButtons}>
            <IconButton
              iconProps={{ iconName: 'ChevronLeft' }}
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            />
            <IconButton
              iconProps={{ iconName: 'ChevronRight' }}
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const ActivityRecordsPage: React.FC = () => {
  const ctx = useDashboard();
  const [selectedBatteryId, setSelectedBatteryId] = React.useState<number | undefined>(undefined);

  const handleSelectBattery = React.useCallback((id: number) => {
    setSelectedBatteryId(id);
  }, []);

  const handleClosePanel = React.useCallback(() => {
    setSelectedBatteryId(undefined);
  }, []);

  if (ctx.loadingState === 'loading') {
    return <LoadingOverlay />;
  }

  if (ctx.loadingState === 'error') {
    return <ErrorState message={ctx.error || 'Erro desconhecido'} onRetry={ctx.refresh} />;
  }

  return (
    <div className={styles.dashboardRoot}>
      <div className={styles.body}>
        <div className={styles.contentArea}>
          <ActivityHistoryTable
            measurements={ctx.rawData.measurements}
            batteries={ctx.rawData.batteries}
            activities={ctx.rawData.activities}
            locations={ctx.rawData.locations}
            onSelectBattery={handleSelectBattery}
          />
        </div>
      </div>

      {selectedBatteryId && (
        <BatteryDetailsPanel
          id={selectedBatteryId}
          batteries={ctx.rawData.batteries}
          measurements={ctx.rawData.measurements}
          locations={ctx.rawData.locations}
          activities={ctx.rawData.activities}
          onClose={handleClosePanel}
        />
      )}
    </div>
  );
};
