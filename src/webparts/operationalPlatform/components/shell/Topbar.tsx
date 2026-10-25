// ============================================================================
// Topbar.tsx
// Barra superior com breadcrumb dinâmico baseado na rota atual.
// ============================================================================

import * as React from 'react';
import { Icon } from '@fluentui/react/lib/Icon';
import styles from './Topbar.module.scss';
import {
  useNavigation,
  getArea,
  getProcedure,
} from '../../../../contexts/NavigationContext';

export const Topbar: React.FC = () => {
  const { currentRoute, goBack } = useNavigation();

  // Não mostrar topbar na home
  if (currentRoute.page === 'home') {
    return null;
  }

  const renderBreadcrumb = (): React.ReactNode => {
    switch (currentRoute.page) {
      case 'area': {
        return (
          <button className={styles.backButton} onClick={goBack}>
            <Icon iconName="ChevronLeft" className={styles.backIcon} />
            Voltar ao Início
          </button>
        );
      }

      case 'procedure': {
        const area = getArea(currentRoute.areaId);
        return (
          <button className={styles.backButton} onClick={goBack}>
            <Icon iconName="ChevronLeft" className={styles.backIcon} />
            Voltar a {area?.name || 'Área'}
          </button>
        );
      }

      case 'action': {
        const procedure = getProcedure(currentRoute.areaId, currentRoute.procedureId);
        return (
          <button className={styles.backButton} onClick={goBack}>
            <Icon iconName="ChevronLeft" className={styles.backIcon} />
            Voltar a {procedure?.name || 'Procedimento'}
          </button>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className={styles.topbar}>
      <div className={styles.breadcrumb}>
        {renderBreadcrumb()}
      </div>
      <div className={styles.topbarActions}>
        <button className={styles.iconButton} title="Notificações">
          <Icon iconName="Ringer" />
        </button>
      </div>
    </div>
  );
};
