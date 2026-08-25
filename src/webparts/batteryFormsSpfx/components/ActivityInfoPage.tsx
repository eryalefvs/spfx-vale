import * as React from 'react';
import styles from './BatteryFormsSpfx.module.scss';
import {
  IWizardFormData,
  ACTIVITY_TYPES,
  LOCATION_TYPES,
  SUPERVISIONS,
} from '../../../models/BatteryInspection';
import { Sedes, Responsibles, Location } from '../../../models/DashboardModels';
import { InspectionService } from '../../../services/InspectionService';

export interface IActivityInfoPageProps {
  data: IWizardFormData;
  onNext: (data: Partial<IWizardFormData>) => void;
  onPrevious: (data?: Partial<IWizardFormData>) => void;
}

export const ActivityInfoPage: React.FC<IActivityInfoPageProps> = ({
  data,
  onNext,
  onPrevious,
}) => {
  const inspectionService = React.useMemo(
    () => new InspectionService(),
    []
  );

  // ── Estado local (inicializado com dados do wizard) ──────────────

  const [maintenanceOrder, setMaintenanceOrder] = React.useState(
    data.maintenanceOrder
  );
  const [activityDate, setActivityDate] = React.useState(
    data.activityDate
  );
  const [activityType, setActivityType] = React.useState(
    data.activityType
  );
  const [supervision, setSupervision] = React.useState(
    data.supervision
  );
  const [selectedResponsibles, setSelectedResponsibles] = React.useState<
    string[]
  >(data.responsibles);
  const [selectedResponsibleIds, setSelectedResponsibleIds] = React.useState<
    number[]
  >(data.responsibleIds);
  const [locationType, setLocationType] = React.useState(
    data.locationType
  );
  const [sede, setSede] = React.useState(data.sede);
  const [sedeId, setSedeId] = React.useState(data.sedeId);
  const [km, setKm] = React.useState(data.km);
  const [kmId, setKmId] = React.useState(data.kmId);
  const [generalObservations, setGeneralObservations] = React.useState(
    data.generalObservations
  );

  // ── Fontes de dados ─────────────────────────────────────────────

  const [responsibles, setResponsibles] = React.useState<Responsibles[]>(
    []
  );
  const [sedes, setSedes] = React.useState<Sedes[]>([]);
  const [locations, setLocations] = React.useState<Location[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // ── Carregamento dos dropdowns ──────────────────────────────────

  React.useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        const [
          responsiblesData,
          sedesData,
          locationsData,
        ] = await Promise.all([
          inspectionService.loadResponsaveis(),
          inspectionService.loadSedes(),
          inspectionService.loadLocations(),
        ]);

        setResponsibles(responsiblesData);
        setSedes(sedesData);
        setLocations(locationsData);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError(
          'Não foi possível carregar os dados necessários.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [inspectionService]);

  // ── Filtros cascata ─────────────────────────────────────────────

  const filteredSedes = React.useMemo(() => {
    if (!supervision) return [];
    return sedes.filter((s) => s.supervisao === supervision);
  }, [sedes, supervision]);

  const filteredResponsibles = React.useMemo(() => {
    if (!supervision) return [];
    return responsibles.filter(
      (r) => r.supervisao === supervision
    );
  }, [responsibles, supervision]);

  const filteredLocations = React.useMemo(() => {
    if (!sede || !locationType) return [];
    return locations.filter(
      (l) =>
        l.sede === sede && l.locationType === locationType
    );
  }, [locations, sede, locationType]);

  // ── Handlers de reset em cascata ────────────────────────────────

  const handleSupervisionChange = (value: string): void => {
    setSupervision(value);
    setSelectedResponsibles([]);
    setSelectedResponsibleIds([]);
    setSede('');
    setSedeId(0);
    setKm('');
    setKmId(0);
  };

  const handleSedeChange = (value: string): void => {
    const selected = filteredSedes.find((s) => s.title === value);
    setSede(value);
    setSedeId(selected?.id || 0);
    setKm('');
    setKmId(0);
  };

  const handleLocationTypeChange = (value: string): void => {
    setLocationType(value);
    setKm('');
    setKmId(0);
  };

  const handleKmChange = (value: string): void => {
    const selected = filteredLocations.find(
      (l) => String(l.km) === value
    );
    setKm(value);
    setKmId(selected?.id || 0);
  };

  const handleResponsiblesChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    const options = Array.from(e.target.selectedOptions);
    const names = options.map((o) => o.value);
    const ids = options.map((o) => {
      const resp = filteredResponsibles.find(
        (r) => r.title === o.value
      );
      return resp?.id || 0;
    });
    setSelectedResponsibles(names);
    setSelectedResponsibleIds(ids);
  };

  // ── Coleta de dados da página ───────────────────────────────────

  const getPageData = (): Partial<IWizardFormData> => ({
    maintenanceOrder,
    activityDate,
    activityType,
    supervision,
    responsibles: selectedResponsibles,
    responsibleIds: selectedResponsibleIds,
    locationType,
    sede,
    sedeId,
    km,
    kmId,
    generalObservations,
  });

  // ── Validação e navegação ───────────────────────────────────────

  const handleNext = (): void => {
    if (!maintenanceOrder.trim()) {
      alert('Informe a OM.');
      return;
    }
    if (!activityDate) {
      alert('Informe a data da atividade.');
      return;
    }
    if (!activityType) {
      alert('Selecione o tipo de atividade.');
      return;
    }
    if (!supervision) {
      alert('Selecione a supervisão.');
      return;
    }
    if (selectedResponsibles.length === 0) {
      alert('Selecione pelo menos um responsável.');
      return;
    }
    if (!locationType) {
      alert('Selecione o tipo de local.');
      return;
    }
    if (!sede) {
      alert('Selecione a sede.');
      return;
    }
    if (!km) {
      alert('Selecione o KM.');
      return;
    }

    onNext(getPageData());
  };

  // ── Render ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        Carregando informações...
      </div>
    );
  }

  if (error) {
    return <div className={styles.errorState}>{error}</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Informações da Atividade</h1>
        <p>
          Informe os dados gerais da atividade de inspeção ou
          manutenção.
        </p>
      </div>

      <div className={styles.formCard}>
        <div className={styles.formGrid}>

          {/* OM */}
          <div className={styles.formGroup}>
            <label htmlFor="maintenanceOrder">OM</label>
            <input
              id="maintenanceOrder"
              type="text"
              value={maintenanceOrder}
              onChange={(e) =>
                setMaintenanceOrder(e.target.value)
              }
              placeholder="Ordem de manutenção"
            />
          </div>

          {/* Data da Atividade */}
          <div className={styles.formGroup}>
            <label htmlFor="activityDate">
              Data da Atividade
            </label>
            <input
              id="activityDate"
              type="date"
              value={activityDate}
              onChange={(e) =>
                setActivityDate(e.target.value)
              }
            />
          </div>

          {/* Tipo de Atividade */}
          <div className={styles.formGroup}>
            <label htmlFor="activityType">
              Tipo de Atividade
            </label>
            <select
              id="activityType"
              value={activityType}
              onChange={(e) =>
                setActivityType(e.target.value)
              }
            >
              <option value="">Selecione...</option>
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Supervisão (fixa) */}
          <div className={styles.formGroup}>
            <label htmlFor="supervision">Supervisão</label>
            <select
              id="supervision"
              value={supervision}
              onChange={(e) =>
                handleSupervisionChange(e.target.value)
              }
            >
              <option value="">Selecione...</option>
              {SUPERVISIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Responsáveis */}
          <div className={styles.formGroup}>
            <label htmlFor="responsibles">
              Responsáveis
            </label>
            <select
              id="responsibles"
              multiple
              value={selectedResponsibles}
              onChange={handleResponsiblesChange}
              disabled={!supervision}
            >
              {filteredResponsibles.map((r) => (
                <option key={r.id} value={r.title}>
                  {r.title}
                </option>
              ))}
            </select>
            <span className={styles.fieldHint}>
              Segure Ctrl para selecionar mais de um
              responsável.
            </span>
          </div>

          {/* Tipo de Local */}
          <div className={styles.formGroup}>
            <label htmlFor="locationType">
              Tipo de Local
            </label>
            <select
              id="locationType"
              value={locationType}
              onChange={(e) =>
                handleLocationTypeChange(e.target.value)
              }
            >
              <option value="">Selecione...</option>
              {LOCATION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Sede */}
          <div className={styles.formGroup}>
            <label htmlFor="sede">Sede</label>
            <select
              id="sede"
              value={sede}
              onChange={(e) =>
                handleSedeChange(e.target.value)
              }
              disabled={!supervision}
            >
              <option value="">Selecione...</option>
              {filteredSedes.map((s) => (
                <option key={s.id} value={s.title}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          {/* KM */}
          <div className={styles.formGroup}>
            <label htmlFor="km">KM</label>
            <select
              id="km"
              value={km}
              onChange={(e) =>
                handleKmChange(e.target.value)
              }
              disabled={!sede || !locationType}
            >
              <option value="">Selecione...</option>
              {filteredLocations.map((l) => (
                <option
                  key={l.id}
                  value={String(l.km)}
                >
                  {l.km}
                </option>
              ))}
            </select>
          </div>

          {/* Observações Gerais */}
          <div
            className={`${styles.formGroup} ${styles.fullWidth}`}
          >
            <label htmlFor="generalObservations">
              Observações Gerais
            </label>
            <textarea
              id="generalObservations"
              value={generalObservations}
              onChange={(e) =>
                setGeneralObservations(e.target.value)
              }
              rows={4}
              placeholder="Observações gerais sobre a atividade..."
            />
          </div>

        </div>
      </div>

      {/* Navegação */}
      <div className={styles.navigation}>
        <button
          type="button"
          className={styles.btnSecondary}
          onClick={() => onPrevious(getPageData())}
        >
          ← Voltar
        </button>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={handleNext}
        >
          Avançar →
        </button>
      </div>
    </div>
  );
};