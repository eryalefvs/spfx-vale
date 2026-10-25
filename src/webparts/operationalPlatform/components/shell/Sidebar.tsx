// ============================================================================
// Sidebar.tsx
// Sidebar retrátil da Plataforma Operacional Vale.
// Logo, navegação principal (Início), categorias (Energia, Telecom),
// configurações, toggle dark/light e informações do usuário.
// ============================================================================

import * as React from 'react';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { Icon } from '@fluentui/react/lib/Icon';
import styles from './Sidebar.module.scss';
import {
  useNavigation,
  AREAS_CATALOG,
} from '../../../../contexts/NavigationContext';
import { useTheme } from '../../../../contexts/ThemeContext';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const logo: string = require('../../../../../images/Logotipo_Vale.svg.png');

export interface ISidebarProps {
  userDisplayName: string;
  context: WebPartContext;
}

export const Sidebar: React.FC<ISidebarProps> = ({ userDisplayName, context }) => {
  const { currentRoute, navigateTo } = useNavigation();
  const { isDark, toggleTheme } = useTheme();
  const [userEmail, setUserEmail] = React.useState<string>('');
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleCollapse = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem('sidebar-collapsed', String(next)); } catch { /* noop */ }
      return next;
    });
  }, []);

  // Carregar email do usuário via Graph API
  React.useEffect(() => {
    const loadUser = async (): Promise<void> => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const graphClient = await (context as any).msGraphClientFactory.getClient('3');
        const me = await graphClient.api('/me').select('mail').get();
        setUserEmail(me.mail || '');
      } catch (err) {
        console.warn('[Sidebar] Não foi possível carregar email do usuário:', err);
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((context as any)?.msGraphClientFactory) {
      loadUser().catch(console.error);
    }
  }, [context]);

  // URL da foto do usuário
  const photoUrl = React.useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!userEmail || !(context as any)?.pageContext?.web?.absoluteUrl) return '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (context as any).pageContext.web.absoluteUrl +
      '/_layouts/15/userphoto.aspx?size=S&accountname=' + encodeURIComponent(userEmail);
  }, [userEmail, context]);

  const initials = userDisplayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isHome = currentRoute.page === 'home';

  const isAreaActive = (areaId: string): boolean => {
    if (currentRoute.page === 'area' && currentRoute.areaId === areaId) return true;
    if (currentRoute.page === 'procedure' && currentRoute.areaId === areaId) return true;
    if (currentRoute.page === 'action' && currentRoute.areaId === areaId) return true;
    return false;
  };

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
      {/* Toggle Collapse */}
      <button
        className={styles.collapseToggle}
        onClick={handleToggleCollapse}
        title={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
      >
        <Icon iconName={collapsed ? 'ChevronRight' : 'ChevronLeft'} className={styles.collapseIcon} />
      </button>

      {/* Logo */}
      <div className={styles.logoSection}>
        {!collapsed && <img src={logo} alt="Logo Vale" className={styles.logoIcon} />}
        {collapsed && (
          <div className={styles.logoCollapsed} title="Vale">
            <Icon iconName="Manufacturing" className={styles.logoCollapsedIcon} />
          </div>
        )}
      </div>

      {/* Navegação Principal */}
      <nav className={styles.navSection}>
        <button
          className={`${styles.navItem} ${isHome ? styles.navItemActive : ''}`}
          onClick={() => navigateTo({ page: 'home' })}
          title="Início"
        >
          <Icon iconName="Home" className={styles.navIcon} />
          <span className={styles.navLabel}>Início</span>
        </button>

        {/* Categorias */}
        {!collapsed && <div className={styles.sectionLabel}>PROCEDIMENTOS</div>}

        {AREAS_CATALOG.map((area) => (
          <button
            key={area.id}
            className={`${styles.categoryItem} ${isAreaActive(area.id) ? styles.categoryItemActive : ''}`}
            onClick={() => navigateTo({ page: 'area', areaId: area.id })}
            title={area.name}
          >
            <div className={styles.categoryLeft}>
              <span className={styles.categoryDot} />
              <span className={styles.navLabel}>{area.name}</span>
            </div>
            {!collapsed && <Icon iconName="ChevronRight" className={styles.categoryChevron} />}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className={styles.sidebarFooter}>
        {/* Theme Toggle */}
        <button
          className={styles.settingsItem}
          onClick={toggleTheme}
          title={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
        >
          <Icon iconName={isDark ? 'Sunny' : 'ClearNight'} className={styles.navIcon} />
          <span className={styles.navLabel}>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
        </button>

        <button className={styles.settingsItem} title="Configurações">
          <Icon iconName="Settings" className={styles.navIcon} />
          <span className={styles.navLabel}>Configurações</span>
        </button>

        <div className={styles.userSection}>
          <div className={styles.userAvatar}>
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={userDisplayName}
                className={styles.userPhoto}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    parent.textContent = initials;
                  }
                }}
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          {!collapsed && (
            <div className={styles.userInfo}>
              <span className={styles.userName}>{userDisplayName}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
