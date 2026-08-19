// DashboardHeader.tsx
import * as React from 'react';
import styles from './BatteryDashboard.module.scss';
import { Icon } from '@fluentui/react/lib/Icon';
import { DefaultButton, PrimaryButton } from '@fluentui/react/lib/Button';
import { formatDate } from '../../../utils/dashboardUtils';
import { useDashboard } from '../../../contexts/DashboardContext';
import { Dropdown, IDropdownOption } from '@fluentui/react/lib/Dropdown';


export interface IDashboardHeaderProps {
  userDisplayName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onRefresh: () => Promise<void>;
  lastLoadedAt?: Date;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const DashboardHeader: React.FC<IDashboardHeaderProps> = ({
  userDisplayName, context, sidebarOpen, onToggleSidebar, onRefresh, lastLoadedAt,
  isDark, onToggleTheme,
}) => {
  const [refreshing, setRefreshing] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState<string>('');
  const ctx = useDashboard();
  const locationOptions = React.useMemo<IDropdownOption[]>(() => {
    return [
      { key: '', text: 'Todos' },
      ...ctx.rawData.locations.map((l) => ({ key: l.id, text: l.localKm })),
    ];
  }, [ctx.rawData.locations]);

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

  const dropdownStyles = {
    root: { width: '100%' },
    dropdown: {
      borderRadius: 8, fontSize: '0.812rem',
      border: '1px solid #e2e8f0', backgroundColor: '#F8FAFC',
    }
  }

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        {/* <DefaultButton
          iconProps={{ iconName: 'Filter' }}
          onClick={onToggleSidebar}
          checked={sidebarOpen}
          styles={{
            root: {
              minWidth: 36, padding: '6px 8px',
              borderColor: sidebarOpen ? '#2563EB' : 'var(--border-primary)',
              backgroundColor: sidebarOpen ? (isDark ? '#1E3A5F' : '#EFF6FF') : 'var(--bg-surface)',
            },
            icon: { color: sidebarOpen ? '#2563EB' : 'var(--text-muted)', fontSize: 16 },
          }}
        /> */}
        <div className={styles.headerTitle}>
          <h1>Dashboard de Saúde das Baterias</h1>
        </div>

        <div className={styles.filterHeader}>
          <span className={styles.filterLabel}>Local:</span>

          <Dropdown
            placeholder="Todos"
            selectedKey={ctx.filters.locationId ?? ''}
            options={locationOptions}
            onChange={(_, opt) => ctx.setLocationId(opt?.key ? Number(opt.key) : undefined)}
            styles={{
              root: { minWidth: 160 },
              dropdown: {
                width: 160,
              }
            }}
          />
        </div>
      </div>



      <div className={styles.headerRight}>
        {lastLoadedAt && (
          <span className={styles.syncInfo}>
            Atualizado em <strong>{formatDate(lastLoadedAt)}</strong>
          </span>
        )}

        {/* Toggle Dark/Light */}
        <button
          className={styles.themeToggle}
          onClick={onToggleTheme}
          title={isDark ? 'Modo Claro' : 'Modo Escuro'}
        >
          <Icon
            iconName={isDark ? 'Sunny' : 'ClearNight'}
            styles={{ root: { fontSize: 16, color: isDark ? '#FBBF24' : '#64748B' } }}
          />
        </button>

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
