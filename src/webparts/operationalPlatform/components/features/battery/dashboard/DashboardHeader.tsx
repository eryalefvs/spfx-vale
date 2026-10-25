// DashboardHeader.tsx
import * as React from 'react';
import styles from './BatteryDashboard.module.scss';
import { Icon } from '@fluentui/react/lib/Icon';
import { PrimaryButton } from '@fluentui/react/lib/Button';
import { formatDate } from '../../../../../../utils/dashboardUtils';
import { useDashboard } from '../../../../../../contexts/DashboardContext';
import { Dropdown, IDropdownOption } from '@fluentui/react/lib/Dropdown';


export interface IDashboardHeaderProps {
  userDisplayName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onRefresh: () => Promise<void>;
  lastLoadedAt?: Date;
}

export const DashboardHeader: React.FC<IDashboardHeaderProps> = ({
  userDisplayName, context, sidebarOpen, onToggleSidebar, onRefresh, lastLoadedAt,
}) => {
  const [refreshing, setRefreshing] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState<string>('');
  const ctx = useDashboard();

  // ── Opções de Supervisão (derivadas dos locais) ──────────────────────
  const supervisaoOptions = React.useMemo<IDropdownOption[]>(() => {
    const unique = Array.from(
      new Set(ctx.rawData.locations.map((l) => l.supervisao).filter(Boolean))
    ).sort();
    return [
      { key: '', text: 'Todas' },
      ...unique.map((s) => ({ key: s, text: s })),
    ];
  }, [ctx.rawData.locations]);

  // ── Opções de Sede (derivadas da coluna 'Sede' da lista 'km das LI') ──
  const sedeOptions = React.useMemo<IDropdownOption[]>(() => {
    let locs = ctx.rawData.locations;
    if (ctx.filters.supervisao) {
      locs = locs.filter((l) => l.supervisao === ctx.filters.supervisao);
    }
    const uniqueNames = Array.from(new Set(locs.map((l) => l.sede).filter(Boolean))).sort();
    return [
      { key: '', text: 'Todas' },
      ...uniqueNames.map((s) => ({ key: s, text: s })),
    ];
  }, [ctx.rawData.locations, ctx.filters.supervisao]);

  // ── Opções de Local (filtradas pela sede/supervisão) ─────────────────
  const locationOptions = React.useMemo<IDropdownOption[]>(() => {
    let locs = ctx.rawData.locations;
    if (ctx.filters.supervisao) {
      locs = locs.filter((l) => l.supervisao === ctx.filters.supervisao);
    }
    if (ctx.filters.sede) {
      locs = locs.filter((l) => l.sede === ctx.filters.sede);
    }
    return [
      { key: '', text: 'Todos' },
      ...locs.map((l) => ({ key: l.id, text: l.localKm })),
    ];
  }, [ctx.rawData.locations, ctx.filters.supervisao, ctx.filters.sede]);

  // ── Handlers cascata ────────────────────────────────────────────────
  const handleSupervisaoChange = React.useCallback((_: unknown, opt?: IDropdownOption) => {
    const value = opt?.key ? String(opt.key) : undefined;
    ctx.setSupervisao(value);
    ctx.setSede(undefined);        // limpar sede ao mudar supervisão
    ctx.setLocationId(undefined);  // limpar local ao mudar supervisão
  }, [ctx]);

  const handleSedeChange = React.useCallback((_: unknown, opt?: IDropdownOption) => {
    const value = opt?.key ? String(opt.key) : undefined;
    ctx.setSede(value);
    ctx.setLocationId(undefined);  // limpar local ao mudar sede
  }, [ctx]);

  const handleLocationChange = React.useCallback((_: unknown, opt?: IDropdownOption) => {
    ctx.setLocationId(opt?.key ? Number(opt.key) : undefined);
  }, [ctx]);

  const handleClearFilters = React.useCallback(() => {
    ctx.clearFilters();
  }, [ctx]);

  // Carregar email do usuário via Graph API
  React.useEffect(() => {
    const loadUser = async (): Promise<void> => {
      try {
        const graphClient = await context.msGraphClientFactory.getClient('3');
        const me = await graphClient
          .api('/me')
          .select('mail')
          .get();
        setUserEmail(me.mail || '');
      } catch (err) {
        console.warn('[DashboardHeader] Não foi possível carregar email do usuário:', err);
      }
    };
    if (context?.msGraphClientFactory) {
      loadUser().catch(console.error);
    }
  }, [context]);

  // URL da foto
  const photoUrl = React.useMemo(() => {
    if (!userEmail || !context?.pageContext?.web?.absoluteUrl) return '';
    return context.pageContext.web.absoluteUrl +
      '/_layouts/15/userphoto.aspx?size=S&accountname=' + encodeURIComponent(userEmail);
  }, [userEmail, context]);

  const initials = userDisplayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try { await onRefresh(); } finally { setRefreshing(false); }
  }, [onRefresh]);

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <div className={styles.headerTitle}>
          <h1>Dashboard de Saúde das Baterias</h1>
        </div>

        <div className={styles.filterHeader}>
          <div className={styles.filterItem}>
            <span className={styles.filterLabel}>Supervisão:</span>
            <Dropdown
              placeholder="Todas"
              selectedKey={ctx.filters.supervisao ?? ''}
              options={supervisaoOptions}
              onChange={handleSupervisaoChange}
              styles={{
                root: { minWidth: 130 },
                dropdown: { width: 130 },
              }}
            />
          </div>

          <div className={styles.filterItem}>
            <span className={styles.filterLabel}>Sede:</span>
            <Dropdown
              placeholder="Todas"
              selectedKey={ctx.filters.sede ?? ''}
              options={sedeOptions}
              onChange={handleSedeChange}
              styles={{
                root: { minWidth: 110 },
                dropdown: { width: 110 },
              }}
            />
          </div>

          <div className={styles.filterItem}>
            <span className={styles.filterLabel}>Local:</span>
            <Dropdown
              placeholder="Todos"
              selectedKey={ctx.filters.locationId ?? ''}
              options={locationOptions}
              onChange={handleLocationChange}
              styles={{
                root: { minWidth: 160 },
                dropdown: { width: 160 },
              }}
            />
          </div>

          {ctx.hasActiveFilters && (
            <button
              className={styles.filterClearBtn}
              onClick={handleClearFilters}
              title="Limpar todos os filtros"
            >
              ✕ Limpar
            </button>
          )}
        </div>
      </div>



      <div className={styles.headerRight}>
        {lastLoadedAt && (
          <span className={styles.syncInfo}>
            Atualizado em <strong>{formatDate(lastLoadedAt)}</strong>
          </span>
        )}


        <div className={styles.userInfo}>
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={userDisplayName}
              className={styles.userPhoto}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                const parent = (e.target as HTMLImageElement).parentElement;
                if (parent) {
                  const fallback = parent.querySelector('.' + styles.userAvatar) as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div className={styles.userAvatar} style={{ display: photoUrl ? 'none' : 'flex' }}>
            <span>{initials}</span>
          </div>
          <span className={styles.userName}>{userDisplayName}</span>
        </div>

        <PrimaryButton
          iconProps={{ iconName: 'Refresh' }}
          text="Atualizar"
          onClick={handleRefresh}
          disabled={refreshing}
          styles={{
            root: {
              borderRadius: 8, fontSize: '0.8125rem', fontWeight: 600,
              backgroundColor: '#2563EB', borderColor: '#2563EB',
            },
          }}
        />
      </div>
    </header>
  );
};
