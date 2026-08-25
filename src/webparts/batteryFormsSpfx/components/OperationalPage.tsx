import * as React from 'react';
import styles from './BatteryFormsSpfx.module.scss';
import {
  IWizardFormData,
  IParsedBatteryData,
} from '../../../models/BatteryInspection';
import { InspectionService } from '../../../services/InspectionService';
import { LOCATION_RULES } from '../../../constants/DashboardConstants';

export interface IOperationalPageProps {
  data: IWizardFormData;
  onNext: (data: Partial<IWizardFormData>) => void;
  onPrevious: (data?: Partial<IWizardFormData>) => void;
}

export const OperationalPage: React.FC<IOperationalPageProps> = ({
  data,
  onNext,
  onPrevious,
}) => {
  const [parsedBatteries, setParsedBatteries] = React.useState<
    IParsedBatteryData[]
  >(data.parsedBatteries);
  const [uploadedFiles, setUploadedFiles] = React.useState<string[]>(
    data.uploadedFileNames
  );
  const [temperature, setTemperature] = React.useState(
    data.ambientTemperature
  );
  const [totalVoltage, setTotalVoltage] = React.useState(
    data.totalFloatVoltage
  );
  const [dragOver, setDragOver] = React.useState(false);
  const [parseError, setParseError] = React.useState<string | null>(
    null
  );

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // ── Regras do tipo de local ─────────────────────────────────────

  const locationType = data.locationType;
  const locationRule = LOCATION_RULES[locationType];
  const maxFiles = locationRule ? locationRule.banks : 1;

  // ── Processamento de arquivo ────────────────────────────────────

  const processFile = (file: File): void => {
    if (uploadedFiles.length >= maxFiles) {
      alert(
        `Máximo de ${maxFiles} arquivo(s) para o tipo ${locationType}.`
      );
      return;
    }

    if (
      !file.name.endsWith('.xlsx') &&
      !file.name.endsWith('.xls')
    ) {
      alert(
        'Formato inválido. Envie apenas arquivos Excel (.xlsx).'
      );
      return;
    }

    // Verificar se arquivo já foi enviado
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
    // Reset input para permitir re-upload do mesmo arquivo
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

  // ── Coleta e navegação ──────────────────────────────────────────

  const getPageData = (): Partial<IWizardFormData> => ({
    parsedBatteries,
    uploadedFileNames: uploadedFiles,
    ambientTemperature: temperature,
    totalFloatVoltage: totalVoltage,
  });

  const handleNext = (): void => {
    if (uploadedFiles.length === 0) {
      alert(
        'Faça o upload de pelo menos um arquivo de medição.'
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
    onNext(getPageData());
  };

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Informações Operacionais</h1>
        <p>
          Faça o upload dos arquivos de medição e informe
          os dados complementares.
        </p>
      </div>

      {/* Upload Section */}
      <div className={styles.formCard}>
        <h2 className={styles.sectionTitle}>
          Upload de Arquivos Excel
        </h2>
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
            accept=".xlsx,.xls"
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
      </div>

      {/* Temperatura e Tensão */}
      <div
        className={styles.formCard}
        style={{ marginTop: '20px' }}
      >
        <h2 className={styles.sectionTitle}>
          Dados Complementares
        </h2>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label htmlFor="temperature">
              Temperatura do Ambiente (°C)
            </label>
            <input
              id="temperature"
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
            <label htmlFor="totalVoltage">
              Tensão Total de Flutuação (V)
            </label>
            <input
              id="totalVoltage"
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
