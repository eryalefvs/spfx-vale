// ============================================================================
// PlaceholderPage.tsx
// Página placeholder para funcionalidades futuras ("Em breve").
// ============================================================================

import * as React from 'react';
import { Icon } from '@fluentui/react/lib/Icon';
import styles from './PlaceholderPage.module.scss';
import { useNavigation } from '../../../../contexts/NavigationContext';

export interface IPlaceholderPageProps {
  title?: string;
}

export const PlaceholderPage: React.FC<IPlaceholderPageProps> = ({ title }) => {
  const { goBack } = useNavigation();

  return (
    <div className={styles.page}>
      <Icon iconName="DeveloperTools" className={styles.icon} />
      <h1 className={styles.title}>Em breve</h1>
      <p className={styles.subtitle}>
        {title
          ? `A funcionalidade "${title}" está em desenvolvimento e será disponibilizada em breve.`
          : 'Esta funcionalidade está em desenvolvimento e será disponibilizada em breve.'}
      </p>
      <button className={styles.backButton} onClick={goBack}>
        <Icon iconName="ChevronLeft" />
        Voltar
      </button>
    </div>
  );
};
