// RegisteredBatteriesList.tsx — Lista colapsável de locais com baterias cadastradas
import * as React from 'react';
import styles from './InputBatteries.module.scss';
import { Icon } from '@fluentui/react/lib/Icon';
import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner';
import { Location, Battery } from '../../../models/DashboardModels';
import { BatteryService } from '../../../services/BatteryService';
import { LOCATION_RULES } from '../../../constants/DashboardConstants';

export interface IRegisteredBatteriesListProps {
  locations: Location[];
}

interface LocationGroup {
  location: Location;
  batteries: Battery[];
  loading: boolean;
  expanded: boolean;
}

export const RegisteredBatteriesList: React.FC<IRegisteredBatteriesListProps> = ({ locations }) => {
  const [groups, setGroups] = React.useState<LocationGroup[]>([]);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [isExpanded, setIsExpanded] = React.useState(false)

  // Carregar baterias de todos os locais para saber quais têm cadastro
  React.useEffect(() => {
    const loadAll = async (): Promise<void> => {
      try {
        const sp = (await import('../../../services/SharePointService')).SharePointService.sp;
        const allBatteries = await sp.web.lists
          .getByTitle('Baterias_SAT2')
          .items
          .filter("Status eq 'Ativa'")
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

        // Filtrar locais que têm baterias e criar os groups
        const result: LocationGroup[] = [];
        for (const loc of locations) {
          const items = byLocation[loc.id];
          if (items && items.length > 0) {
            result.push({
              location: loc,
              batteries: items.map((item) => ({
                id: item.Id || item.ID || 0,
                serialNumber: item.Title || '',
                sequenceNumber: item.field_0 || 0,
                bankNumber: item.field_2 || 1,
                model: item.field_3 || '',
                manufacturer: item.field_4 || '',
                manufactureDate: item.field_5 ? new Date(item.field_5) : undefined,
                locationType: item.field_6 || '',
                km: item.field_7 || 0,
                locationId: item.IDLocalId,
                locationTitle: loc.title,
                status: item.Status || 'Ativa',
              })),
              loading: false,
              expanded: false,
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

  const toggleExpand = React.useCallback((locationId: number) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.location.id === locationId ? { ...g, expanded: !g.expanded } : g
      )
    );
  }, []);

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

  // function PainelExpansivel({ titulo, conteudo }) {
  // // Estado para guardar se está aberto ou fechado
  // const [estaAberto, setEstaAberto] = useState(false);

  // // Função para inverter o valor atual
  // const alternarAbertura = () => {
  //   setEstaAberto((anterior) => !anterior);
  // };

  return (
    <div className={styles.card}>
      {/* </div><div className={styles.cardHeader}> */}
      <button
        type='button'
        className={styles.cardHeaderAccordion}
        onClick={() => setIsExpanded(prev => !prev)}
      >
        <div>
          <p className={styles.cardTitle}>
            <Icon iconName="Battery1" styles={{ root: { marginRight: 8 } }} />
            Baterias Cadastradas por Local
          </p>
          <p className={styles.cardSubtitle}>{groups.length} locais com baterias ativas</p>
        </div>
        <Icon
          iconName={isExpanded ? 'ChevronDown' : 'ChevronRight'}
          className={styles.cardHeaderChevron}
        />
      </button>
      {/* </div> */}

      {isExpanded && (
        <div className={styles.cardBody} style={{ padding: 0 }}>
          {groups.map((group) => {
            const rule = LOCATION_RULES[group.location.locationType];
            const totalExpected = rule ? rule.total : '?';
            const isFull = rule && group.batteries.length >= rule.total;

            return (
              <div key={group.location.id} className={styles.accordionItem}>
                {/* Header do accordion */}
                <button
                  className={styles.accordionHeader}
                  onClick={() => toggleExpand(group.location.id)}
                >
                  <div className={styles.accordionHeaderLeft}>
                    <Icon
                      iconName={group.expanded ? 'ChevronDown' : 'ChevronRight'}
                      styles={{ root: { fontSize: 12, color: 'var(--text-muted)', marginRight: 10, transition: 'transform 0.2s' } }}
                    />
                    <div>
                      <span className={styles.accordionTitle}>
                        {group.location.localKm || (group.location.locationType + ' · KM ' + group.location.km)}
                      </span>
                      <span className={styles.accordionMeta}>
                        {group.location.locationType} · {group.batteries.length}/{totalExpected} baterias
                      </span>
                    </div>
                  </div>
                  <div className={styles.accordionBadge} style={{
                    backgroundColor: isFull ? 'var(--success-light)' : 'var(--warning-light)',
                    color: isFull ? 'var(--success)' : 'var(--warning)',
                  }}>
                    {isFull ? 'Completo' : 'Incompleto'}
                  </div>
                </button>

                {/* Conteúdo expandido */}
                {group.expanded && (
                  <div className={styles.accordionContent}>
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
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.batteries
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
                                <td>
                                  <span style={{
                                    padding: '2px 8px', borderRadius: 4,
                                    fontSize: '0.7rem', fontWeight: 600,
                                    backgroundColor: bat.status === 'Ativa' ? 'var(--success-light)' : 'var(--danger-light)',
                                    color: bat.status === 'Ativa' ? 'var(--success)' : 'var(--danger)',
                                  }}>
                                    {bat.status || 'Ativa'}
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
            );
          })}
        </div>
      )}
    </div>
  );
};
