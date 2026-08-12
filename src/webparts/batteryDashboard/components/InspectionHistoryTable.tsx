// InspectionHistoryTable.tsx
import * as React from 'react';
import styles from './BatteryDashboard.module.scss';
import { Measurement, Battery, Location, Activity } from '../../../models/DashboardModels';
import { formatDate, parseStatus, getStatusColor, getStatusLabel } from '../../../utils/dashboardUtils';
import { DefaultButton, IconButton } from '@fluentui/react/lib/Button';
import { SearchBox } from '@fluentui/react/lib/SearchBox';
import { TABLE_CONFIG } from '../../../constants/DashboardConstants';

export interface IInspectionHistoryTableProps {
  measurements: Measurement[];
  batteries: Battery[];
  locations: Location[];
  activities: Activity[];
  onSelectBattery: (serialNumber: string) => void;
}

type SortKey = 'date' | 'voltage' | 'resistance' | 'current' | 'status' | 'battery';
type SortDir = 'asc' | 'desc';

export const InspectionHistoryTable: React.FC<IInspectionHistoryTableProps> = ({
  measurements, batteries, locations, activities, onSelectBattery,
}) => {
  const [page, setPage] = React.useState(0);
  const [sortKey, setSortKey] = React.useState<SortKey>('date');
  const [sortDir, setSortDir] = React.useState<SortDir>('desc');
  const [searchText, setSearchText] = React.useState('');
  const pageSize = TABLE_CONFIG.defaultPageSize;

  // Resolver lookups para display
  const enrichedData = React.useMemo(() => {
    return measurements.map((m) => {
      const battery = batteries.find((b) => b.serialNumber === m.batterySerialNumber);
      const activity = m.activityId ? activities.find((a) => a.id === m.activityId) : undefined;
      return { ...m, battery, activity };
    });
  }, [measurements, batteries, activities]);

  // Filtro local
  const filtered = React.useMemo(() => {
    if (!searchText) return enrichedData;
    const q = searchText.toLowerCase();
    return enrichedData.filter((m) =>
      m.batterySerialNumber.toLowerCase().includes(q) ||
      m.overallStatus.toLowerCase().includes(q) ||
      (m.activity?.maintenanceOrder?.toLowerCase().includes(q))
    );
  }, [enrichedData, searchText]);

  // Sort
  const sorted = React.useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'date': cmp = a.date.getTime() - b.date.getTime(); break;
        case 'voltage': cmp = a.voltage - b.voltage; break;
        case 'resistance': cmp = a.resistance - b.resistance; break;
        case 'current': cmp = a.current - b.current; break;
        case 'status': cmp = a.overallStatus.localeCompare(b.overallStatus); break;
        case 'battery': cmp = a.batterySerialNumber.localeCompare(b.batterySerialNumber); break;
        default: cmp = 0;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(sorted.length / pageSize);

  // Reset page on filter change
  React.useEffect(() => setPage(0), [searchText, measurements]);

  const handleSort = React.useCallback((key: SortKey) => {
    setSortKey(key);
    setSortDir((prev) => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  const renderSortIcon = (key: SortKey): string => {
    if (sortKey !== key) return '⇅';
    return sortDir === 'asc' ? '↑' : '↓';
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p className={styles.cardTitle}>Histórico de Medições</p>
          <p className={styles.cardSubtitle}>{sorted.length} registros</p>
        </div>
        <SearchBox
          placeholder="Buscar por NS, status, OM..."
          onChange={(_, v) => setSearchText(v || '')}
          styles={{ root: { maxWidth: 250, borderRadius: 8 } }}
        />
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th onClick={() => handleSort('date')}>Data {renderSortIcon('date')}</th>
              <th onClick={() => handleSort('battery')}>Bateria {renderSortIcon('battery')}</th>
              <th>Banco</th>
              <th onClick={() => handleSort('voltage')}>Tensão (V) {renderSortIcon('voltage')}</th>
              <th onClick={() => handleSort('resistance')}>Resistência (Ω) {renderSortIcon('resistance')}</th>
              <th onClick={() => handleSort('current')}>Corrente (A) {renderSortIcon('current')}</th>
              <th onClick={() => handleSort('status')}>Status {renderSortIcon('status')}</th>
              <th>Responsável</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((m) => {
              const status = parseStatus(m.overallStatus);
              const statusColor = getStatusColor(status);
              return (
                <tr key={m.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(m.date)}</td>
                  <td>
                    <button
                      onClick={() => onSelectBattery(m.batterySerialNumber)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                        color: '#2563EB', fontWeight: 500, fontSize: '0.8125rem',
                      }}
                    >
                      {m.batterySerialNumber}
                    </button>
                  </td>
                  <td>{m.battery?.bankNumber ?? '-'}</td>
                  <td style={{ fontWeight: 600, /*color: '#0F172A'*/ }}>{m.voltage}</td>
                  <td style={{ fontWeight: 600, /*color: '#0F172A'*/ }}>{m.resistance}</td>
                  <td>{m.current}</td>
                  <td>
                    <span
                      className={styles.statusBadge}
                      style={{ backgroundColor: `${statusColor}14`, color: statusColor }}
                    >
                      <span className={styles.statusDot} style={{ backgroundColor: statusColor }} />
                      {getStatusLabel(status)}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.78rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                    {m.activity?.responsibles?.join(', ') || '-'}
                  </td>
                </tr>
              );
            })}
            {paged.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#94A3B8' }}>
                  Nenhuma medição encontrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>
            Mostrando {page * pageSize + 1} a {Math.min((page + 1) * pageSize, sorted.length)} de {sorted.length}
          </span>
          <div className={styles.paginationButtons}>
            <DefaultButton
              text="Anterior"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              styles={{ root: { minWidth: 'auto', borderRadius: 6, fontSize: '0.75rem' } }}
            />
            <span style={{ padding: '0 12px', fontSize: '0.8125rem', fontWeight: 600 }}>
              {page + 1} / {totalPages}
            </span>
            <DefaultButton
              text="Próximo"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              styles={{ root: { minWidth: 'auto', borderRadius: 6, fontSize: '0.75rem' } }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
