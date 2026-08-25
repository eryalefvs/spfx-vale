// ============================================================================
// RiscosIconPicker.tsx
// Modal para selecionar ícones de riscos críticos da lista do SharePoint.
// ============================================================================

import * as React from 'react';
import styles from './CrmBoaJornada.module.scss';
import { RiscoCriticoIcone } from '../../../models/BoajornadaModels';

export interface IRiscosIconPickerProps {
  riscos: RiscoCriticoIcone[];
  selectedIds: number[];
  onConfirm: (selectedIds: number[]) => void;
  onCancel: () => void;
}

export const RiscosIconPicker: React.FC<IRiscosIconPickerProps> = ({
  riscos,
  selectedIds,
  onConfirm,
  onCancel,
}) => {
  const [localSelected, setLocalSelected] = React.useState<number[]>([...selectedIds]);

  const toggleRisco = (id: number): void => {
    setLocalSelected((prev) =>
      prev.indexOf(id) >= 0
        ? prev.filter((rId) => rId !== id)
        : [...prev, id]
    );
  };

  const handleConfirm = (): void => {
    onConfirm(localSelected);
  };

  const handleOverlayClick = (e: React.MouseEvent): void => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className={styles.pickerOverlay} onClick={handleOverlayClick}>
      <div className={styles.pickerModal}>

        {/* Header */}
        <div className={styles.pickerHeader}>
          <h3 className={styles.pickerTitle}>Selecionar Riscos Críticos</h3>
          <button
            className={styles.pickerCloseButton}
            onClick={onCancel}
            title="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Body — grid de ícones */}
        <div className={styles.pickerBody}>
          <div className={styles.pickerGrid}>
            {riscos.map((risco) => {
              const isSelected = localSelected.indexOf(risco.id) >= 0;
              return (
                <div
                  key={risco.id}
                  className={`${styles.pickerItem} ${isSelected ? styles.pickerItemSelected : ''}`}
                  onClick={() => toggleRisco(risco.id)}
                  role="checkbox"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && toggleRisco(risco.id)}
                  title={risco.descricao || risco.title}
                >
                  {risco.iconeUrl ? (
                    <img
                      src={risco.iconeUrl}
                      alt={risco.title}
                      className={styles.pickerItemIcon}
                    />
                  ) : (
                    <div className={styles.pickerItemIcon}>⚠️</div>
                  )}
                  <span className={styles.pickerItemLabel}>
                    {risco.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.pickerFooter}>
          <button className={styles.btnPickerCancel} onClick={onCancel}>
            Cancelar
          </button>
          <button className={styles.btnPickerConfirm} onClick={handleConfirm}>
            Confirmar ({localSelected.length})
          </button>
        </div>

      </div>
    </div>
  );
};
