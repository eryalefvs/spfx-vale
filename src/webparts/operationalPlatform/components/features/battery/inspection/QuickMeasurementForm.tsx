// ============================================================================
// QuickMeasurementForm.tsx
// Formulário simplificado de medição avulsa de baterias.
// Permite registrar medições sem preencher o RG PRO 001107 completo.
// Suporta duas formas de entrada: upload do analisador e entrada manual/colar.
// ============================================================================

import * as React from 'react';
import styles from './BatteryFormsSpfx.module.scss';
import {
  IQuickMeasurementData,
  IParsedBatteryData,
} from '../../../../../../models/BatteryInspection';
import { Location } from '../../../../../../models/DashboardModels';
import { InspectionService } from '../../../../../../services/InspectionService';
import {
  LOCATION_RULES,
  STATUS_COLORS,
} from '../../../../../../constants/DashboardConstants';
import { BatteryStatus } from '../../../../../../types/DashboardTypes';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const logoVale = require('../../../../../../../images/logo-vale-escudo-2048.png');

/** Modo de entrada de dados */
type InputMode = 'upload' | 'manual';

/** Linha editável na tabela de entrada manual */
interface ManualRow {
  no: number;
  bankNumber: number;
  resistance: string;
  voltage: string;
}

export const QuickMeasurementForm: React.FC = () => {
  const inspectionService = React.useMemo(
    () => new InspectionService(),
    []
  );

  // ── Estado do formulário ──────────────────────────────────────────

  const [supervision, setSupervision] = React.useState('');
  const [sede, setSede] = React.useState('');
  const [sedeId, setSedeId] = React.useState(0);
  const [selectedLocationId, setSelectedLocationId] = React.useState(0);
  const [measurementDate, setMeasurementDate] = React.useState('');
  const [temperature, setTemperature] = React.useState('');
  const [totalVoltage, setTotalVoltage] = React.useState('');
  const [parsedBatteries, setParsedBatteries] = React.useState<
    IParsedBatteryData[]
  >([]);
  const [uploadedFiles, setUploadedFiles] = React.useState<string[]>([]);

  // ── Estado de modo de entrada ─────────────────────────────────────

  const [inputMode, setInputMode] = React.useState<InputMode>('upload');
  const [manualRows, setManualRows] = React.useState<ManualRow[]>([]);

  // ── Estado de UI ──────────────────────────────────────────────────

  const [dragOver, setDragOver] = React.useState(false);
  const [parseError, setParseError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  // ── Fontes de dados ───────────────────────────────────────────────

  const [locations, setLocations] = React.useState<Location[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const pasteAreaRef = React.useRef<HTMLDivElement>(null);

  // ── Carregamento inicial ──────────────────────────────────────────

  React.useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const locationsData = await inspectionService.loadLocations();

        setLocations(locationsData);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setLoadError('Não foi possível carregar os dados necessários.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [inspectionService]);

  // ── Filtros cascata ───────────────────────────────────────────────

  const availableSupervisions = React.useMemo(() => {
    const supSet = new Set<string>();
    for (const loc of locations) {
      if (loc.supervisao) supSet.add(loc.supervisao);
    }
    return Array.from(supSet).sort();
  }, [locations]);

  const filteredSedes = React.useMemo(() => {
    if (!supervision) return [];
    const sedeSet = new Set<string>();
    for (const loc of locations) {
      if (loc.supervisao === supervision && loc.sede) {
        sedeSet.add(loc.sede);
      }
    }
    return Array.from(sedeSet).sort();
  }, [locations, supervision]);

  const filteredLocations = React.useMemo(() => {
    if (!sede) return [];
    return locations.filter((l) => l.sede === sede);
  }, [locations, sede]);

  // ── Dados derivados do local selecionado ──────────────────────────

  const selectedLocation = React.useMemo(
    () => locations.find((l) => l.id === selectedLocationId),
    [locations, selectedLocationId]
  );

  const locationType = selectedLocation?.locationType || '';
  const locationRule = locationType ? LOCATION_RULES[locationType] : undefined;
  const maxFiles = locationRule ? locationRule.banks : 1;

  // ── Handlers de reset em cascata ──────────────────────────────────

  const handleSupervisionChange = (value: string): void => {
    setSupervision(value);
    setSede('');
    setSedeId(0);
    setSelectedLocationId(0);
    setParsedBatteries([]);
    setUploadedFiles([]);
    setManualRows([]);
    setParseError(null);
  };

  const handleSedeChange = (value: string): void => {
    setSede(value);
    setSedeId(0);
    setSelectedLocationId(0);
    setParsedBatteries([]);
    setUploadedFiles([]);
    setManualRows([]);
    setParseError(null);
  };

  const handleLocationChange = (value: string): void => {
    const locId = parseInt(value, 10);
    setSelectedLocationId(locId || 0);
    setParsedBatteries([]);
    setUploadedFiles([]);
    setManualRows([]);
    setParseError(null);
  };

  // ── Troca de modo de entrada ──────────────────────────────────────

  const handleInputModeChange = (mode: InputMode): void => {
    setInputMode(mode);
    // Limpar dados do modo anterior
    setParsedBatteries([]);
    setUploadedFiles([]);
    setManualRows([]);
    setParseError(null);
    setTotalVoltage('');
  };

  // ── Gerar linhas vazias da tabela manual ──────────────────────────

  const generateManualRows = React.useCallback((): void => {
    if (!locationRule) return;
    const rows: ManualRow[] = [];
    for (let bank = 1; bank <= locationRule.banks; bank++) {
      for (let i = 1; i <= locationRule.batteriesPerBank; i++) {
        rows.push({
          no: i,
          bankNumber: bank,
          resistance: '',
          voltage: '',
        });
      }
    }
    setManualRows(rows);
  }, [locationRule]);

  // Gerar linhas quando mudar de local e estiver no modo manual
  React.useEffect(() => {
    if (inputMode === 'manual' && selectedLocationId > 0 && locationRule) {
      generateManualRows();
    }
  }, [inputMode, selectedLocationId, locationRule, generateManualRows]);

  // ── Handlers da tabela manual ─────────────────────────────────────

  const handleManualRowChange = (
    index: number,
    field: 'resistance' | 'voltage',
    value: string
  ): void => {
    setManualRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // ── Paste handler para tabela manual ──────────────────────────────

  const handleManualPaste = React.useCallback(
    (e: React.ClipboardEvent): void => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      if (!text.trim()) return;

      const lines = text
        .trim()
        .split('\n')
        .map((line) => line.split('\t'))
        .filter(
          (cols) => cols.length > 0 && !(cols.length === 1 && !cols[0].trim())
        );

      if (lines.length === 0) return;

      // Detectar formato: pode ser apenas 2 colunas (resistência, tensão)
      // ou 1 coluna (apenas tensão ou apenas resistência — menos provável)
      if (!locationRule) return;

      const totalExpected = locationRule.total;
      const perBank = locationRule.batteriesPerBank;

      // Gerar as linhas com os dados colados
      const newRows: ManualRow[] = [];
      let lineIdx = 0;

      for (let bank = 1; bank <= locationRule.banks; bank++) {
        for (let i = 1; i <= perBank; i++) {
          if (lineIdx < lines.length) {
            const cols = lines[lineIdx];
            // Tentar detectar se é "resistência\ttensão" ou "tensão\tresistência"
            // Convenção: primeira coluna = resistência, segunda = tensão
            const val1 = (cols[0] || '').trim().replace(',', '.');
            const val2 = (cols[1] || '').trim().replace(',', '.');
            newRows.push({
              no: i,
              bankNumber: bank,
              resistance: val1,
              voltage: val2,
            });
            lineIdx++;
          } else {
            newRows.push({
              no: i,
              bankNumber: bank,
              resistance: '',
              voltage: '',
            });
          }
        }
      }

      setManualRows(newRows);
    },
    [locationRule]
  );

  // ── Converter linhas manuais → IParsedBatteryData ─────────────────

  const convertManualToParsed = React.useCallback((): IParsedBatteryData[] => {
    const result: IParsedBatteryData[] = [];

    for (const row of manualRows) {
      const resistance = parseFloat(row.resistance.replace(',', '.'));
      const voltage = parseFloat(row.voltage.replace(',', '.'));

      if (isNaN(resistance) || isNaN(voltage)) continue;

      const voltageStatus = InspectionService.calculateVoltageStatus(voltage);
      const resistanceStatus =
        InspectionService.calculateResistanceStatus(resistance);
      const overallStatus = InspectionService.calculateOverallStatus(
        voltageStatus,
        resistanceStatus
      );

      result.push({
        no: row.no,
        resistance,
        voltage,
        bankNumber: row.bankNumber,
        bankLabel: `B${row.bankNumber}`,
        fileName: '_manual_',
        voltageStatus,
        resistanceStatus,
        overallStatus,
      });
    }

    return result;
  }, [manualRows]);

  // Sincronizar manualRows → parsedBatteries quando muda
  React.useEffect(() => {
    if (inputMode === 'manual') {
      const parsed = convertManualToParsed();
      setParsedBatteries(parsed);
    }
  }, [manualRows, inputMode, convertManualToParsed]);

  // ── Processamento de arquivo Excel ────────────────────────────────

  const processFile = (file: File): void => {
    if (uploadedFiles.length >= maxFiles) {
      alert(
        `Máximo de ${maxFiles} arquivo(s) para o tipo ${locationType}.`
      );
      return;
    }

    if (
      !file.name.endsWith('.xlsx') &&
      !file.name.endsWith('.xls') &&
      !file.name.endsWith('.csv')
    ) {
      alert(
        'Formato inválido. Envie apenas arquivos Excel (.xlsx) ou CSV (.csv).'
      );
      return;
    }

    if (uploadedFiles.indexOf(file.name) !== -1) {
      alert(`O arquivo "${file.name}" já foi enviado.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e): void => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const batteries = InspectionService.parseExcelFile(
          arrayBuffer,
          file.name
        );

        if (batteries.length === 0) {
          setParseError(
            `Não foi possível extrair dados de "${file.name}". ` +
            'Verifique se o arquivo é do formato esperado.'
          );
          return;
        }

        // Validar quantidade vs regra do local
        if (locationRule) {
          const expectedPerBank = locationRule.batteriesPerBank;
          if (batteries.length !== expectedPerBank) {
            setParseError(
              `O arquivo "${file.name}" contém ${batteries.length} bateria(s), ` +
              `mas para o local "${locationType}" são esperadas ${expectedPerBank} ` +
              `bateria(s) por banco. Verifique o arquivo e tente novamente.`
            );
            return;
          }
        }

        setParsedBatteries((prev) => [...prev, ...batteries]);
        setUploadedFiles((prev) => [...prev, file.name]);
        setParseError(null);
      } catch (err) {
        console.error('Erro ao processar arquivo:', err);
        setParseError(
          `Erro ao processar "${file.name}". Verifique o formato.`
        );
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      processFile(files[i]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
      processFile(files[i]);
    }
  };

  const removeFile = (index: number): void => {
    const fileName = uploadedFiles[index];
    setUploadedFiles((prev) =>
      prev.filter((_, i) => i !== index)
    );
    setParsedBatteries((prev) =>
      prev.filter((b) => b.fileName !== fileName)
    );
    setParseError(null);
  };

  // ── Auto-cálculo da Tensão Total ──────────────────────────────

  React.useEffect(() => {
    const bank1Batteries = parsedBatteries.filter((b) => b.bankNumber === 1);
    if (bank1Batteries.length > 0) {
      const sum = bank1Batteries.reduce((acc, b) => acc + b.voltage, 0);
      setTotalVoltage(sum.toFixed(2));
    }
  }, [parsedBatteries]);

  // ── Validação e Salvamento ────────────────────────────────────────

  const handleSave = async (): Promise<void> => {
    if (!supervision) {
      alert('Selecione a supervisão.');
      return;
    }
    if (!sede) {
      alert('Selecione a sede.');
      return;
    }
    if (!selectedLocationId) {
      alert('Selecione o local de instalação.');
      return;
    }
    if (!measurementDate) {
      alert('Informe a data da medição.');
      return;
    }
    if (parsedBatteries.length === 0) {
      alert(
        inputMode === 'upload'
          ? 'Faça o upload de pelo menos um arquivo de medição.'
          : 'Preencha os dados de pelo menos uma bateria na tabela.'
      );
      return;
    }
    if (!temperature.trim()) {
      alert('Informe a temperatura do ambiente.');
      return;
    }
    if (!totalVoltage.trim()) {
      alert('Informe a tensão total de flutuação.');
      return;
    }

    const loc = selectedLocation;
    if (!loc) return;

    const formData: IQuickMeasurementData = {
      supervision,
      locationType: loc.locationType,
      sede,
      sedeId,
      km: String(loc.km),
      kmId: loc.id,
      locationId: loc.id,
      measurementDate,
      ambientTemperature: temperature,
      totalFloatVoltage: totalVoltage,
      parsedBatteries,
      uploadedFileNames: inputMode === 'upload' ? uploadedFiles : ['entrada-manual'],
    };

    try {
      setIsSaving(true);
      setSaveError(null);

      // 1. Salvar atividade (tipo "Outros")
      const activityId = await inspectionService.saveQuickActivity(formData);
      console.log(
        '[QuickMeasurement] Atividade avulsa salva com ID:',
        activityId
      );

      // 2. Salvar medições vinculadas
      if (parsedBatteries.length > 0) {
        await inspectionService.saveMeasurements(
          activityId,
          parsedBatteries,
          measurementDate,
          loc.id
        );
        console.log(
          '[QuickMeasurement] Medições salvas:',
          parsedBatteries.length
        );
      }

      setSaveSuccess(true);
    } catch (err) {
      console.error('Erro ao salvar medição avulsa:', err);
      setSaveError(
        'Ocorreu um erro ao salvar a medição. Tente novamente.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ── Contagem de status ────────────────────────────────────────────

  const statusCount = parsedBatteries.reduce<
    Record<string, number>
  >((acc, b) => {
    acc[b.overallStatus] = (acc[b.overallStatus] || 0) + 1;
    return acc;
  }, {});

  // ── Contagem de linhas preenchidas na tabela manual ────────────────

  const filledManualCount = manualRows.filter(
    (r) => r.resistance.trim() !== '' && r.voltage.trim() !== ''
  ).length;

  // ── Bancos únicos na tabela manual ────────────────────────────────

  const manualBanks = React.useMemo(() => {
    const banks = new Set<number>();
    for (const r of manualRows) banks.add(r.bankNumber);
    return Array.from(banks).sort();
  }, [manualRows]);

  // ── Render: Loading ───────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className={styles.wizardContainer}>
        <header className={styles.wizardHeader}>
          <div className={styles.headerContent}>
            <img
              src={logoVale}
              alt="Vale"
              className={styles.headerLogo}
            />
            <h1 className={styles.headerTitle}>
              Nova Medição Avulsa
            </h1>
          </div>
        </header>
        <div className={styles.loadingState}>
          Carregando informações...
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.wizardContainer}>
        <header className={styles.wizardHeader}>
          <div className={styles.headerContent}>
            <img
              src={logoVale}
              alt="Vale"
              className={styles.headerLogo}
            />
            <h1 className={styles.headerTitle}>
              Nova Medição Avulsa
            </h1>
          </div>
        </header>
        <div className={styles.errorState}>{loadError}</div>
      </div>
    );
  }

  // ── Render: Sucesso ───────────────────────────────────────────────

  if (saveSuccess) {
    return (
      <div className={styles.wizardContainer}>
        <header className={styles.wizardHeader}>
          <div className={styles.headerContent}>
            <img
              src={logoVale}
              alt="Vale"
              className={styles.headerLogo}
            />
            <h1 className={styles.headerTitle}>
              Nova Medição Avulsa
            </h1>
          </div>
        </header>
        <main className={styles.pageContent}>
          <div className={styles.pageContainer}>
            <div className={styles.successMessage}>
              <div className={styles.successIcon}>✓</div>
              <h1>Medição Avulsa Salva com Sucesso!</h1>
              <p>
                Todos os dados foram registrados nas listas do
                SharePoint.
              </p>
              <div className={styles.successDetails}>
                <p>
                  <strong>Local:</strong>{' '}
                  {selectedLocation?.locationType} — KM {selectedLocation?.km}
                </p>
                <p>
                  <strong>Data:</strong>{' '}
                  {measurementDate}
                </p>
                <p>
                  <strong>Baterias registradas:</strong>{' '}
                  {parsedBatteries.length}
                </p>
                <p>
                  <strong>Tipo de Atividade:</strong>{' '}
                  Outros (medição avulsa)
                </p>
                <p>
                  <strong>Modo de entrada:</strong>{' '}
                  {inputMode === 'upload' ? 'Upload do analisador' : 'Entrada manual'}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Render: Formulário ────────────────────────────────────────────

  return (
    <div className={styles.wizardContainer}>
      {/* Header */}
      <header className={styles.wizardHeader}>
        <div className={styles.headerContent}>
          <img
            src={logoVale}
            alt="Vale"
            className={styles.headerLogo}
          />
          <h1 className={styles.headerTitle}>
            Nova Medição Avulsa
          </h1>
        </div>
      </header>

      <main className={styles.pageContent}>
        <div className={styles.pageContainer}>
          <div className={styles.pageHeader}>
            <h1>Medição Avulsa de Baterias</h1>
            <p>
              Registre rapidamente uma medição de baterias em campo
              sem preencher o RG PRO 001107 completo.
            </p>
          </div>

          {/* Seleção de Local */}
          <div className={styles.formCard}>
            <h2 className={styles.sectionTitle}>
              Local da Medição
            </h2>
            <p className={styles.sectionHint}>
              Selecione a supervisão e o local de instalação onde a medição foi realizada.
            </p>

            <div className={styles.formGrid}>
              {/* Supervisão */}
              <div className={styles.formGroup}>
                <label htmlFor="qm-supervision">Supervisão</label>
                <select
                  id="qm-supervision"
                  value={supervision}
                  onChange={(e) =>
                    handleSupervisionChange(e.target.value)
                  }
                >
                  <option value="">Selecione...</option>
                  {availableSupervisions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sede */}
              <div className={styles.formGroup}>
                <label htmlFor="qm-sede">Sede</label>
                <select
                  id="qm-sede"
                  value={sede}
                  onChange={(e) =>
                    handleSedeChange(e.target.value)
                  }
                  disabled={!supervision}
                >
                  <option value="">Selecione...</option>
                  {filteredSedes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Local de Instalação */}
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label htmlFor="qm-location">Local de Instalação</label>
                <select
                  id="qm-location"
                  value={selectedLocationId || ''}
                  onChange={(e) =>
                    handleLocationChange(e.target.value)
                  }
                  disabled={!sede}
                >
                  <option value="">Selecione...</option>
                  {filteredLocations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.localKm || `${l.locationType} · KM ${l.km}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Data da Medição */}
          <div
            className={styles.formCard}
            style={{ marginTop: '20px' }}
          >
            <h2 className={styles.sectionTitle}>
              Dados da Medição
            </h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="qm-date">
                  Data da Medição
                </label>
                <input
                  id="qm-date"
                  type="date"
                  value={measurementDate}
                  onChange={(e) =>
                    setMeasurementDate(e.target.value)
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="qm-temperature">
                  Temperatura do Ambiente (°C)
                </label>
                <input
                  id="qm-temperature"
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) =>
                    setTemperature(e.target.value)
                  }
                  placeholder="Ex: 28.5"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="qm-voltage">
                  Tensão Total de Flutuação (V)
                </label>
                <input
                  id="qm-voltage"
                  type="number"
                  step="0.01"
                  value={totalVoltage}
                  onChange={(e) =>
                    setTotalVoltage(e.target.value)
                  }
                  placeholder="Ex: 137.8"
                />
              </div>
            </div>
          </div>

          {/* Modo de Entrada — Toggle */}
          {selectedLocationId > 0 && (
            <div
              className={styles.formCard}
              style={{ marginTop: '20px' }}
            >
              <h2 className={styles.sectionTitle}>
                Dados das Baterias
              </h2>
              <p className={styles.sectionHint}>
                Escolha como deseja informar os dados de medição:
              </p>

              {/* Toggle buttons */}
              <div style={{
                display: 'flex',
                gap: 0,
                marginBottom: 20,
                borderRadius: 10,
                overflow: 'hidden',
                border: '1px solid #E2E8F0',
                width: 'fit-content',
              }}>
                <button
                  type="button"
                  onClick={() => handleInputModeChange('upload')}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                    backgroundColor: inputMode === 'upload' ? '#007E7A' : '#F8FAFC',
                    color: inputMode === 'upload' ? '#FFFFFF' : '#475569',
                  }}
                >
                  📁 Upload do Analisador
                </button>
                <button
                  type="button"
                  onClick={() => handleInputModeChange('manual')}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderLeft: '1px solid #E2E8F0',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                    backgroundColor: inputMode === 'manual' ? '#007E7A' : '#F8FAFC',
                    color: inputMode === 'manual' ? '#FFFFFF' : '#475569',
                  }}
                >
                  ✏️ Entrada Manual / Colar
                </button>
              </div>

              {/* ── Modo Upload ────────────────────────────────── */}
              {inputMode === 'upload' && (
                <>
                  <p className={styles.sectionHint}>
                    {maxFiles > 1
                      ? `Para ${locationType}, são esperados até ${maxFiles} arquivos (um por banco de baterias).`
                      : `Para ${locationType}, é esperado 1 arquivo de medição.`}
                  </p>

                  <div
                    className={`${styles.uploadZone} ${dragOver ? styles.uploadZoneActive : ''
                      }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className={styles.uploadIcon}>📁</div>
                    <p className={styles.uploadText}>
                      Arraste os arquivos Excel aqui ou clique para
                      selecionar
                    </p>
                    <span className={styles.uploadHint}>
                      Formatos aceitos: .xlsx &bull; Máximo:{' '}
                      {maxFiles} arquivo(s)
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                      multiple={maxFiles > 1}
                    />
                  </div>

                  {parseError && (
                    <div className={styles.errorMessage}>
                      {parseError}
                    </div>
                  )}

                  {/* Lista de arquivos enviados */}
                  {uploadedFiles.length > 0 && (
                    <div className={styles.fileList}>
                      {uploadedFiles.map((name, index) => {
                        const count = parsedBatteries.filter(
                          (b) => b.fileName === name
                        ).length;
                        return (
                          <div
                            key={index}
                            className={styles.fileItem}
                          >
                            <span className={styles.fileIcon}>
                              📊
                            </span>
                            <span className={styles.fileName}>
                              {name}
                            </span>
                            <span className={styles.fileBadge}>
                              {count} baterias
                            </span>
                            <button
                              type="button"
                              className={styles.fileRemove}
                              onClick={() => removeFile(index)}
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* ── Modo Manual ────────────────────────────────── */}
              {inputMode === 'manual' && locationRule && (
                <>
                  {/* Paste area */}
                  <div
                    ref={pasteAreaRef}
                    tabIndex={0}
                    onPaste={handleManualPaste}
                    style={{
                      padding: '14px 18px',
                      border: '2px dashed #CBD5E1',
                      borderRadius: 10,
                      backgroundColor: '#F8FAFC',
                      cursor: 'text',
                      marginBottom: 16,
                      transition: 'border-color 0.2s ease',
                      outline: 'none',
                    }}
                    onFocus={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = '#007E7A';
                    }}
                    onBlur={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = '#CBD5E1';
                    }}
                  >
                    <p style={{
                      margin: '0 0 4px 0',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      color: '#1E293B',
                    }}>
                      📋 Cole dados do Excel aqui (Ctrl+V)
                    </p>
                    <p style={{
                      margin: 0,
                      fontSize: '0.78rem',
                      color: '#64748B',
                    }}>
                      Formato esperado: duas colunas — Resistência (mΩ) | Tensão (V).
                      As linhas serão distribuídas automaticamente entre os bancos.
                    </p>
                  </div>

                  {/* Tabela editável por banco */}
                  {manualBanks.map((bank) => {
                    const bankRows = manualRows
                      .map((r, idx) => ({ ...r, _idx: idx }))
                      .filter((r) => r.bankNumber === bank);

                    return (
                      <div key={'manual-bank-' + bank} style={{ marginBottom: 20 }}>
                        <h3 style={{
                          margin: '0 0 8px 0',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: '#007E7A',
                        }}>
                          Banco {bank}
                        </h3>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '0.82rem',
                          }}>
                            <thead>
                              <tr style={{ backgroundColor: '#F1F5F9' }}>
                                <th style={{
                                  padding: '8px 10px',
                                  textAlign: 'center',
                                  borderBottom: '2px solid #E2E8F0',
                                  fontWeight: 700,
                                  color: '#475569',
                                  width: 50,
                                }}>
                                  NO
                                </th>
                                <th style={{
                                  padding: '8px 10px',
                                  textAlign: 'center',
                                  borderBottom: '2px solid #E2E8F0',
                                  fontWeight: 700,
                                  color: '#475569',
                                }}>
                                  Resistência (mΩ)
                                </th>
                                <th style={{
                                  padding: '8px 10px',
                                  textAlign: 'center',
                                  borderBottom: '2px solid #E2E8F0',
                                  fontWeight: 700,
                                  color: '#475569',
                                }}>
                                  Tensão (V)
                                </th>
                                <th style={{
                                  padding: '8px 10px',
                                  textAlign: 'center',
                                  borderBottom: '2px solid #E2E8F0',
                                  fontWeight: 700,
                                  color: '#475569',
                                  width: 80,
                                }}>
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {bankRows.map((row) => {
                                const resistance = parseFloat(row.resistance.replace(',', '.'));
                                const voltage = parseFloat(row.voltage.replace(',', '.'));
                                const hasValues = !isNaN(resistance) && !isNaN(voltage);
                                let statusColor = '#CBD5E1';
                                let statusLabel = '—';
                                if (hasValues) {
                                  const vStatus = InspectionService.calculateVoltageStatus(voltage);
                                  const rStatus = InspectionService.calculateResistanceStatus(resistance);
                                  const overall = InspectionService.calculateOverallStatus(vStatus, rStatus);
                                  statusColor = STATUS_COLORS[overall] || '#CBD5E1';
                                  statusLabel = overall;
                                }

                                return (
                                  <tr key={row._idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                    <td style={{
                                      padding: '6px 10px',
                                      textAlign: 'center',
                                      fontWeight: 600,
                                      color: '#64748B',
                                    }}>
                                      {row.no}
                                    </td>
                                    <td style={{ padding: '4px 6px' }}>
                                      <input
                                        type="text"
                                        inputMode="decimal"
                                        value={row.resistance}
                                        onChange={(e) =>
                                          handleManualRowChange(row._idx, 'resistance', e.target.value)
                                        }
                                        placeholder="0.00"
                                        style={{
                                          width: '100%',
                                          padding: '6px 10px',
                                          border: '1px solid #E2E8F0',
                                          borderRadius: 6,
                                          fontSize: '0.82rem',
                                          textAlign: 'center',
                                          boxSizing: 'border-box',
                                          outline: 'none',
                                          transition: 'border-color 0.2s',
                                        }}
                                        onFocus={(e) => {
                                          e.currentTarget.style.borderColor = '#007E7A';
                                        }}
                                        onBlur={(e) => {
                                          e.currentTarget.style.borderColor = '#E2E8F0';
                                        }}
                                      />
                                    </td>
                                    <td style={{ padding: '4px 6px' }}>
                                      <input
                                        type="text"
                                        inputMode="decimal"
                                        value={row.voltage}
                                        onChange={(e) =>
                                          handleManualRowChange(row._idx, 'voltage', e.target.value)
                                        }
                                        placeholder="0.00"
                                        style={{
                                          width: '100%',
                                          padding: '6px 10px',
                                          border: '1px solid #E2E8F0',
                                          borderRadius: 6,
                                          fontSize: '0.82rem',
                                          textAlign: 'center',
                                          boxSizing: 'border-box',
                                          outline: 'none',
                                          transition: 'border-color 0.2s',
                                        }}
                                        onFocus={(e) => {
                                          e.currentTarget.style.borderColor = '#007E7A';
                                        }}
                                        onBlur={(e) => {
                                          e.currentTarget.style.borderColor = '#E2E8F0';
                                        }}
                                      />
                                    </td>
                                    <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                                      {hasValues ? (
                                        <span style={{
                                          display: 'inline-block',
                                          padding: '2px 8px',
                                          borderRadius: 4,
                                          fontSize: '0.7rem',
                                          fontWeight: 700,
                                          backgroundColor: statusColor,
                                          color: '#FFFFFF',
                                        }}>
                                          {statusLabel}
                                        </span>
                                      ) : (
                                        <span style={{ color: '#CBD5E1' }}>—</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}

                  {/* Info de preenchimento */}
                  {manualRows.length > 0 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      backgroundColor: filledManualCount === manualRows.length ? '#F0FDF4' : '#FFFBEB',
                      border: `1px solid ${filledManualCount === manualRows.length ? '#BBF7D0' : '#FDE68A'}`,
                      borderRadius: 8,
                      fontSize: '0.8rem',
                      color: filledManualCount === manualRows.length ? '#166534' : '#92400E',
                      fontWeight: 500,
                    }}>
                      {filledManualCount === manualRows.length
                        ? `✅ Todas as ${manualRows.length} baterias preenchidas.`
                        : `⚠ ${filledManualCount} de ${manualRows.length} baterias preenchidas.`}
                    </div>
                  )}
                </>
              )}

              {/* Resumo de status das baterias parseadas */}
              {Object.keys(statusCount).length > 0 && (
                <div className={styles.statusSummary} style={{ marginTop: 16 }}>
                  {Object.entries(statusCount).map(
                    ([status, count]) => (
                      <div
                        key={status}
                        className={styles.statusSummaryItem}
                      >
                        <span
                          className={styles.statusBadge}
                          style={{
                            backgroundColor:
                              STATUS_COLORS[
                              status as BatteryStatus
                              ] || '#666',
                          }}
                        >
                          {status}
                        </span>
                        <span>{count} bateria(s)</span>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}

          {/* Erro de salvamento */}
          {saveError && (
            <div
              className={styles.errorMessage}
              style={{ marginTop: '16px' }}
            >
              {saveError}
            </div>
          )}

          {/* Botão Salvar */}
          <div className={styles.navigation}>
            <div />
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Salvando...' : '💾 Salvar Medição Avulsa'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};