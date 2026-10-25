// ============================================================================
// ProcedurePage.tsx
// Hub do procedimento operacional.
// Mostra informações do procedimento e cards de ações disponíveis.
// ============================================================================

import * as React from 'react';
import { Icon } from '@fluentui/react/lib/Icon';
import styles from './ProcedurePage.module.scss';
import {
  useNavigation,
  getArea,
  getProcedure,
} from '../../../../contexts/NavigationContext';

export interface IProcedurePageProps {
  areaId: string;
  procedureId: string;
}

export const ProcedurePage: React.FC<IProcedurePageProps> = ({ areaId, procedureId }) => {
  const { navigateTo } = useNavigation();
  const area = getArea(areaId);
  const procedure = getProcedure(areaId, procedureId);

  if (!area || !procedure) {
    return (
      <div className={styles.page}>
        <p>Procedimento não encontrado.</p>
      </div>
    );
  }

  const handleActionClick = (actionId: string, enabled: boolean): void => {
    if (!enabled) return;
    navigateTo({
      page: 'action',
      areaId,
      procedureId,
      action: actionId,
    });
  };

  return (
    <div className={styles.page}>
      {/* Procedure Header */}
      <div className={styles.procedureHeader}>
        <span className={styles.procedureCode}>{procedure.code}</span>
        <h1 className={styles.procedureName}>{procedure.name}</h1>
        <p className={styles.procedureArea}>
          Área:{' '}
          <a onClick={() => navigateTo({ page: 'area', areaId })}>
            {area.name}
          </a>
        </p>
      </div>

      {/* Actions */}
      <p className={styles.sectionLabel}>
        Selecione a ação que deseja realizar neste procedimento.
      </p>

      <div className={styles.actionsGrid}>
        {procedure.actions.map((action) => (
          <button
            key={action.id}
            className={`${styles.actionCard} ${!action.enabled ? styles.actionCardDisabled : ''}`}
            onClick={() => handleActionClick(action.id, action.enabled)}
          >
            {!action.enabled && (
              <span className={styles.comingSoonBadge}>Em breve</span>
            )}

            <div className={styles.actionCardTop}>
              <div className={styles.actionIcon}>
                <Icon iconName={action.icon} />
              </div>
              {action.enabled && (
                <Icon iconName="ChevronRight" className={styles.actionChevron} />
              )}
            </div>

            <h3 className={styles.actionLabel}>{action.label}</h3>
            <p className={styles.actionDescription}>{action.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};
