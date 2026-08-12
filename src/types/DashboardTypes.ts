// ============================================================================
// DashboardTypes.ts
// Tipos base e interfaces SharePoint (raw) para o Dashboard de Baterias.
// Estes tipos representam os dados como chegam do SharePoint via PnPjs,
// antes de serem convertidos para os modelos de domínio.
// ============================================================================

// ─── Enums de Domínio ────────────────────────────────────────────────────────

/** Status de saúde de uma bateria, baseado nos limites de tensão e resistência */
export type BatteryStatus = 'EXCELENTE' | 'ALERTA' | 'CRITICO';

/** Tipos de local de instalação com suas regras de bancos */
export type LocationType = 'TU' | 'CV' | 'MO' | 'CANCELA' | 'TE' | 'HBD' | 'AMV';

// ─── Interfaces SharePoint Raw ───────────────────────────────────────────────
// Representam exatamente como os dados chegam do SharePoint.
// Campos Lookup do SharePoint retornam objetos com Id e Title (quando expandidos).

/** Item raw da lista "km das LI" */
export interface SPLocationItem {
  Id: number;
  Title: string;              // "Locais de Instalação" — ex: "EFCJ-LPR-085-SINAL_INT_ECJABRTUK085"
  Local: string;              // Tipo do local — ex: "TU", "ARM", "MO"
  km: number;                 // KM da instalação — ex: 85, 94, 105
  Sede: string;               // Sede — ex: "VTM", "SIS"
  Supervisao: string;         // Supervisão — ex: "CSATSI"
}

/** Item raw da lista "Baterias_SAT2" */
export interface SPBatteryItem {
  Id: number;
  Title: string;              // "NumeroDeSerie" — ex: "ESB-WI 20062"
  NO: number;                 // Número de Ordem (sequência dentro do banco)
  Banco: number;              // Número do banco (1 ou 2)
  Modelo: string;             // Modelo — ex: "SBS-170F"
  Fabricante: string;         // Fabricante — ex: "EnerSys"
  DataDeFabricacao: string;   // Data de fabricação (ISO string)
  Local: string;              // Tipo do local — ex: "TU"
  KM: number;                 // KM da instalação
  IDLocalId?: number;         // ID do Lookup para "km das LI" (SharePoint adiciona "Id" ao nome do campo Lookup)
  IDLocal?: {                 // Lookup expandido (quando usamos $expand)
    Id: number;
    Title: string;
  };
}

/** Item raw da lista "RG 1107 - info_medicoes_baterias" */
export interface SPMeasurementItem {
  Id: number;
  Title: string;
  BateriaId?: number;         // ID do Lookup para Baterias_SAT2
  Bateria?: {                 // Lookup expandido
    Id: number;
    Title: string;            // NumeroDeSerie da bateria
  };
  ID_AtividadeId?: number;    // ID do Lookup para info_atividades
  ID_Atividade?: {            // Lookup expandido
    Id: number;
  };
  Tensao: number;
  Resistencia: number;
  Corrente: number;
  Status_geral: string;       // "EXCELENTE", "ALERTA", "CRITICO"
  Status_tensao: string;
  Status_resistencia: string;
  Data: string;                // Data da medição (ISO string)
}

/**
 * Item raw da lista "RG 1107 - info_atividades"
 *
 * NOTA: Colunas com caracteres especiais (acentos, espaços, hífens) podem ter
 * internal names diferentes no SharePoint. Os nomes abaixo são os nomes de
 * exibição fornecidos. Se necessário, ajustar para os internal names reais
 * (ex: "Supervisão" pode ser "Supervis_x00e3_o" internamente).
 */
export interface SPActivityItem {
  Id: number;
  OM: string;                                           // Ordem de Manutenção
  Data_da_Atividade: string;                            // Data da atividade (ISO string)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Respons_x00e1_veis?: any;                             // Responsáveis (pode ser Person[] ou string)
  Supervis_x00e3_o?: string;                            // Supervisão
  Sede?: string;
  Tipo_de_Atividade?: string;
  Tipo_de_Local?: string;
  KM?: string;
  Temperatura_da_Sala?: number;
  Tens_x00e3_o_Total?: number;                          // Tensão Total
  Observacoes_Gerais?: string;
  'Integridade_x0020__x002d__x0020_Anomalias'?: string; // "Integridade - Anomalias"
  'Integridade_x0020__x002d__x0020_Solucoes'?: string;  // "Integridade - Solucoes"
  'Justificativa_x0020__x002d__x0020_Falta_x0020_de_x0020_Informacao'?: string;
  'Justificativa_x0020__x002d__x0020_Sem_x0020_Contato_x0020_MCM'?: string;
}

// ─── Tipos para estado do Dashboard ──────────────────────────────────────────

/** Estado de loading do dashboard */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/** Resultado de uma operação de carregamento */
export interface DataLoadResult<T> {
  data: T;
  loadedAt: Date;
  fromCache: boolean;
}
