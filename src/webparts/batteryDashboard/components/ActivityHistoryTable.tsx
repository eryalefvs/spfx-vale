// ActivityHistoryTable.tsx — Tabela de histórico de atividades com accordion de medições
import * as React from 'react';
import styles from './BatteryDashboard.module.scss';
import { Measurement, Battery, Activity } from '../../../models/DashboardModels';
import { formatDate, parseStatus, getStatusColor } from '../../../utils/dashboardUtils';
import { Icon } from '@fluentui/react/lib/Icon';
import { IconButton } from '@fluentui/react/lib/Button';
import { SearchBox } from '@fluentui/react/lib/SearchBox';
import { TABLE_CONFIG } from '../../../constants/DashboardConstants';

export interface IActivityHistoryTableProps {
  measurements: Measurement[];
  batteries: Battery[];
  activities: Activity[];
  onSelectBattery: (serialNumber: string) => void;
}

interface EnrichedActivity extends Activity {
  measurements: Array<Measurement & { battery?: Battery }>;
}

export const ActivityHistoryTable: React.FC<IActivityHistoryTableProps> = ({
  measurements, batteries, activities, onSelectBattery,
}) => {
  const [page, setPage] = React.useState(0);
  const [searchText, setSearchText] = React.useState('');
  const [expandedIds, setExpandedIds] = React.useState<Set<number>>(new Set());
  const pageSize = TABLE_CONFIG.defaultPageSize;

  // Enriquecer atividades com suas medições
  const enrichedActivities = React.useMemo<EnrichedActivity[]>(() => {
    // Mapa de activityId → medições
    const measurementsByActivity: Record<number, Array<Measurement & { battery?: Battery }>> = {};
    for (const m of measurements) {
      if (!m.activityId) continue;
      if (!measurementsByActivity[m.activityId]) measurementsByActivity[m.activityId] = [];
      const battery = batteries.find((b) => b.serialNumber === m.batterySerialNumber);
      measurementsByActivity[m.activityId].push({ ...m, battery });
    }

    return activities
      .filter((a) => measurementsByActivity[a.id] && measurementsByActivity[a.id].length > 0)
      .map((a) => ({
        ...a,
        measurements: (measurementsByActivity[a.id] || [])
          .sort((x, y) => {
            const bx = x.battery;
            const by = y.battery;
            if (bx && by) return bx.bankNumber - by.bankNumber || bx.sequenceNumber - by.sequenceNumber;
            return 0;
          }),
      }))
      .sort((a, b) => b.activityDate.getTime() - a.activityDate.getTime());
  }, [measurements, batteries, activities]);

  // Filtro por texto
  const filtered = React.useMemo(() => {
    if (!searchText) return enrichedActivities;
    const q = searchText.toLowerCase();
    return enrichedActivities.filter((a) =>
      a.maintenanceOrder.toLowerCase().includes(q) ||
      a.locationType.toLowerCase().includes(q) ||
      a.km.toLowerCase().includes(q) ||
      a.responsibles.some((r) => r.toLowerCase().includes(q))
    );
  }, [enrichedActivities, searchText]);

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

  return (
    <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
      {/* Header */}
      <div className={styles.chartCardHeader}>
        <div>
          <p className={styles.chartCardTitle}>Histórico de Atividades</p>
          <p className={styles.chartCardSubtitle}>{filtered.length} atividades encontradas</p>
        </div>
        <SearchBox
          placeholder="Buscar por OM, local, responsável..."
          value={searchText}
          onChange={(_, v) => { setSearchText(v || ''); setPage(0); }}
          styles={{ root: { width: 260, borderRadius: 8 } }}
        />
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
                    <td>{act.locationType || '-'}</td>
                    <td>{act.km || '-'}</td>
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
                        title="Baixar relatório (em breve)"
                        disabled={true}
                        styles={{
                          root: { width: 28, height: 28 },
                          icon: { fontSize: 14, color: 'var(--text-muted)' },
                        }}
                        onClick={(e) => { e.stopPropagation(); /* TODO: PDF export */ }}
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
                                    onClick={(e) => { e.stopPropagation(); onSelectBattery(m.batterySerialNumber); }}
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
