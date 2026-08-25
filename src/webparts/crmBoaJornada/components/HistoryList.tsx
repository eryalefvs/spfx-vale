// ============================================================================
// HistoryList.tsx
// Lista de histórico de Boa Jornadas — busca e seleção.
// ============================================================================

import * as React from 'react';
import styles from './CrmBoaJornada.module.scss';
import { BoaJornadaInfoGerais } from '../../../models/BoajornadaModels';
import { BoaJornadaService } from '../../../services/BoaJornadaService';

export interface IHistoryListProps {
  onBack: () => void;
  onSelectJornada: (id: number) => void;
}

export const HistoryList: React.FC<IHistoryListProps> = ({
  onBack,
  onSelectJornada,
}) => {
  const service = React.useMemo(() => new BoaJornadaService(), []);

  const [jornadas, setJornadas] = React.useState<BoaJornadaInfoGerais[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    service.loadBoaJornadas()
      .then((data) => {
        setJornadas(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[HistoryList] Erro ao carregar:', err);
        setLoading(false);
      });
  }, []);

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  const filtered = jornadas.filter((j) => {
    const term = search.toLowerCase();
    return (
      j.area.toLowerCase().indexOf(term) >= 0 ||
      j.supervisao.toLowerCase().indexOf(term) >= 0 ||
      j.title.toLowerCase().indexOf(term) >= 0 ||
      formatDate(j.data).indexOf(term) >= 0
    );
  });

  return (
    <div className={styles.historyContainer}>
      {/* Header */}
      <div className={styles.historyHeader}>
        <button className={styles.historyBackButton} onClick={onBack} title="Voltar">
          ←
        </button>
        <h1 className={styles.historyTitle}>Histórico de Boa Jornada</h1>
      </div>

      {/* Conteúdo */}
      <div className={styles.historyContent}>
        {/* Busca */}
        <input
          type="text"
          className={styles.historySearch}
          placeholder="Buscar por área, supervisão ou data..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <span className={styles.loadingText}>Carregando histórico...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>📋</div>
            <h2 className={styles.emptyStateTitle}>
              {search ? 'Nenhum resultado encontrado' : 'Nenhum registro encontrado'}
            </h2>
            <p className={styles.emptyStateText}>
              {search
                ? 'Tente alterar o termo de busca.'
                : 'Crie uma nova Boa Jornada para começar.'}
            </p>
          </div>
        ) : (
          <table className={styles.historyTable}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Supervisão</th>
                <th>Área</th>
                <th>Coordenação</th>
                <th>Gerência</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((jornada) => (
                <tr
                  key={jornada.id}
                  onClick={() => onSelectJornada(jornada.id)}
                >
                  <td>
                    <span className={styles.historyBadge}>
                      {formatDate(jornada.data)}
                    </span>
                  </td>
                  <td>{jornada.supervisao || '—'}</td>
                  <td>{jornada.area || '—'}</td>
                  <td>{jornada.coordenacao || '—'}</td>
                  <td>{jornada.gerencia || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
