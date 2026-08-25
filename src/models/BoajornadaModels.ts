// ============================================================================
// BoajornadaModels.ts
// Interfaces do módulo Boa Jornada CRM.
// ============================================================================

/** Dados gerais de uma sessão de Boa Jornada */
export interface BoaJornadaInfoGerais {
    id: number;
    title: string;
    data: string;
    supervisao: string;
    area: string;
    coordenacao: string;
    gerencia: string;
    riscosMaiorIndice: string;
    detalhamento: string;
}

/** Atividade vinculada a uma Boa Jornada via jornadaId */
export interface BoaJornadaAtividade {
    id: number;
    title: string;
    jornadaId: number;
    atividade: string;
    executantes: string;
    oQuePodeMatar: string;
    riscosCriticosIds: number[];
}

/** Ícone de risco crítico carregado da lista do SharePoint */
export interface RiscoCriticoIcone {
    id: number;
    title: string;
    descricao: string;
    racAssociado: string;
    iconeUrl: string;
}

// ── Estado do Formulário ────────────────────────────────────────────────────

/** Linha da tabela de atividades no formulário */
export interface AtividadeFormRow {
    tempId: string;
    atividade: string;
    executantes: string;
    oQuePodeMatar: string;
    riscosCriticosIds: number[];
}

/** Estado completo do formulário de Boa Jornada */
export interface BoaJornadaFormData {
    supervisao: string;
    area: string;
    data: string;
    coordenacao: string;
    gerencia: string;
    riscosMaiorIndice: string;
    detalhamento: string;
    atividades: AtividadeFormRow[];
}

/** Valores padrão para nova atividade */
export const createEmptyAtividade = (): AtividadeFormRow => ({
    tempId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    atividade: '',
    executantes: '',
    oQuePodeMatar: '',
    riscosCriticosIds: [],
});

/** Valores padrão para o formulário */
export const DEFAULT_BOA_JORNADA_FORM: BoaJornadaFormData = {
    supervisao: '',
    area: '',
    data: new Date().toISOString().split('T')[0],
    coordenacao: '',
    gerencia: '',
    riscosMaiorIndice: '',
    detalhamento: '',
    atividades: [createEmptyAtividade()],
};