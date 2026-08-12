// // DashboardFilters.tsx
// import * as React from 'react';
// import styles from './BatteryDashboard.module.scss';
// import { useDashboard } from '../../../contexts/DashboardContext';
// import { Dropdown, IDropdownOption } from '@fluentui/react/lib/Dropdown';
// import { PrimaryButton } from '@fluentui/react/lib/Button';
// import { IconButton } from '@fluentui/react/lib/Button';

// export interface IDashboardFiltersProps {
//   open: boolean;
//   onClose: () => void;
// }

// export const DashboardFilters: React.FC<IDashboardFiltersProps> = ({ open, onClose }) => {
//   const ctx = useDashboard();

//   // Opções de Local derivadas dos dados brutos
//   const locationOptions = React.useMemo<IDropdownOption[]>(() => {
//     return [
//       { key: '', text: 'Todos' },
//       ...ctx.rawData.locations.map((l) => ({ key: l.id, text: l.localKm })),
//     ];
//   }, [ctx.rawData.locations]);

//   const dropdownStyles = {
//     root: { width: '100%' },
//     dropdown: {
//       borderRadius: 8, fontSize: '0.8125rem',
//       border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC',
//     },
//   };

//   return (
//     <div className={`${styles.filterSidebar} ${open ? styles.filterSidebarOpen : styles.filterSidebarClosed}`}>
//       <div className={`${styles.filterSidebarInner} ${!open ? styles.filterSidebarHidden : ''}`}>
//         <div className={styles.filterHeader}>
//           <p>Filtros</p>
//           <IconButton
//             iconProps={{ iconName: 'Cancel' }}
//             onClick={onClose}
//             styles={{ root: { color: '#94A3B8' } }}
//           />
//         </div>

//         <div className={styles.filterGroup}>
//           <Dropdown
//             label="Local"
//             selectedKey={ctx.filters.locationId ?? ''}
//             options={locationOptions}
//             onChange={(_, opt) => ctx.setLocationId(opt?.key ? Number(opt.key) : undefined)}
//             styles={dropdownStyles}
//           />

//           <PrimaryButton
//             text="Limpar Filtros"
//             onClick={ctx.clearFilters}
//             disabled={!ctx.hasActiveFilters}
//             styles={{
//               root: {
//                 width: '100%', borderRadius: 8, marginTop: 8,
//                 backgroundColor: ctx.hasActiveFilters ? '#2563EB' : '#F1F5F9',
//                 borderColor: ctx.hasActiveFilters ? '#2563EB' : '#F1F5F9',
//                 color: ctx.hasActiveFilters ? '#fff' : '#64748B',
//               },
//             }}
//           />
//         </div>
//       </div>
//     </div>
//   );
// };
