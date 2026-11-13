// ============================================================================
// HistoryList.tsx
// Lista de histórico de Boa Jornadas — busca e seleção.
// ============================================================================

import * as React from 'react';
import styles from './CrmBoaJornada.module.scss';
import { BoaJornadaInfoGerais } from '../../../models/BoajornadaModels';
import { BoaJornadaService } from '../../../services/BoaJornadaService';
import { formatIsoPtBr } from './HistoryDetail';

export interface IHistoryListProps {
  onBack: () => void;
  onSelectJornada: (id: number) => void;
}

type HistoryEntry =
  | { kind: 'single'; data: string; jornada: BoaJornadaInfoGerais }
  | { kind: 'week'; data: string; semanaId: string; nome: string; jornadas: BoaJornadaInfoGerais[] };

export const HistoryList: React.FC<IHistoryListProps> = ({ onBack, onSelectJornada }) => {
  const service = React.useMemo(() => new BoaJornadaService(), []);

  const [jornadas, setJornadas] = React.useState<BoaJornadaInfoGerais[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    service.loadBoaJornadas()
      .then((data) => { setJornadas(data); setLoading(false); })
      .catch((err) => { console.error('[HistoryList] Erro ao carregar:', err); setLoading(false); });
  }, []);

  const term = search.toLowerCase();
  const filtered = jornadas.filter((j) =>
    [j.coordenacao, j.gerencia, j.title, j.tema, j.semana, formatIsoPtBr(j.data)]
      .some((v) => (v || '').toLowerCase().indexOf(term) >= 0)
  );

  // Agrupa por SemanaId; mantém a ordenação por data (desc)
  const entries: HistoryEntry[] = React.useMemo(() => {
    const result: HistoryEntry[] = [];
    const weeks: Record<string, HistoryEntry & { kind: 'week' }> = {};
    filtered.forEach((j) => {
      if (!j.semanaId) {
        result.push({ kind: 'single', data: j.data, jornada: j });
        return;
      }
      if (!weeks[j.semanaId]) {
        weeks[j.semanaId] = { kind: 'week', data: j.data, semanaId: j.semanaId, nome: j.semana, jornadas: [] };
        result.push(weeks[j.semanaId]);
      }
      weeks[j.semanaId].jornadas.push(j);
    });
    return result;
  }, [filtered]);

  const toggle = (id: string): void => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const renderRow = (j: BoaJornadaInfoGerais, nested?: boolean): React.ReactNode => (
    <tr key={j.id} onClick={() => onSelectJornada(j.id)} style={nested ? { background: '#fafafa' } : undefined}>
      <td style={nested ? { paddingLeft: 36 } : undefined}>
        <span className={styles.historyBadge}>{formatIsoPtBr(j.data)}</span>
      </td>
      <td>{j.tema || '—'}</td>
      <td>{j.gerencia || '—'}</td>
      <td>{j.coordenacao || '—'}</td>
    </tr>
  );

  return (
    <div className={styles.homePage}>
      <div className={styles.historyContainer}>
        <div className={styles.historyHeader}>
          <button className={styles.historyBackButton} onClick={onBack} title="Voltar">←</button>
          <h1 className={styles.historyTitle}>Histórico de Boa Jornada</h1>
        </div>

        <div className={styles.historyContent}>
          <input
            type="text"
            className={styles.historySearch}
            placeholder="Buscar por Coordenação, Gerência, Tema, Semana ou data..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner} />
              <span className={styles.loadingText}>Carregando histórico...</span>
            </div>
          ) : entries.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>📋</div>
              <h2 className={styles.emptyStateTitle}>
                {search ? 'Nenhum resultado encontrado' : 'Nenhum registro encontrado'}
              </h2>
              <p className={styles.emptyStateText}>
                {search ? 'Tente alterar o termo de busca.' : 'Crie uma nova Boa Jornada para começar.'}
              </p>
            </div>
          ) : (
            <table className={styles.historyTable}>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tema</th>
                  <th>Gerência</th>
                  <th>Coordenação</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  if (e.kind === 'single') return renderRow(e.jornada);
                  const open = !!expanded[e.semanaId] || !!search;
                  const datas = e.jornadas.map((j) => j.data).sort();
                  const first = e.jornadas[0];
                  return (
                    <React.Fragment key={e.semanaId}>
                      <tr onClick={() => toggle(e.semanaId)} style={{ background: '#eef4fb', fontWeight: 600 }}>
                        <td>
                          {open ? '▾' : '▸'} 🗓️ {e.nome || 'Semana'}
                          <div style={{ fontWeight: 400, fontSize: 12, color: '#666' }}>
                            {formatIsoPtBr(datas[0])} a {formatIsoPtBr(datas[datas.length - 1])} · {e.jornadas.length} dia(s)
                          </div>
                        </td>
                        <td>{first.tema || '—'}</td>
                        <td>{first.gerencia || '—'}</td>
                        <td>{first.coordenacao || '—'}</td>
                      </tr>
                      {open && e.jornadas.map((j) => renderRow(j, true))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
