// ============================================================================
// BoajornadaModels.ts
// Interfaces do módulo Boa Jornada CRM.
// ============================================================================

/** Dados gerais de uma sessão de Boa Jornada */
export interface BoaJornadaInfoGerais {
    id: number;
    title: string;
    data: string;
    //supervisao: string;
    //area: string;
    coordenacao: string;
    gerencia: string;
    detalhamento: string;
    riscosMaiorIndice: string;
    tema: string;
    semana: string;
    semanaId: string;
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
    tipoAtividade: string;
    status: string;
    pontosAtencao: string;
}

/** Ícone de risco crítico carregado da lista do SharePoint */
export interface RiscoCriticoIcone {
    id: number;
    title: string;
    descricao: string;
    racAssociado: string;
    iconeUrl: string;
}

/** Item da lista 'Sedes' */
export interface Sede {
    id: number;
    sede: string;
    supervisao: string;
    gerencia: string;
}

/** Item da lista 'Baterias - Responsáveis' */
export interface Responsavel {
    id: number;
    nome: string;
    supervisao: string;
    gerencia: string;
    matricula: string;
}

// ── Estado do Formulário ────────────────────────────────────────────────────

/** Linha da tabela de atividades no formulário */
export interface AtividadeFormRow {
    tempId: string;
    spId?: number;
    atividade: string;
    executantes: string; // nomes separados por "; "
    tipoAtividade: string;
    status: string;
    pontosAtencao: string;
    riscosCriticosIds: number[];
}

/** Um dia de atividades (modo dia único = 1 dia; modo semana = vários) */
export interface DiaForm {
    data: string; // YYYY-MM-DD
    incluido: boolean;
    atividades: AtividadeFormRow[];
}

/** Estado completo do formulário de Boa Jornada */
export interface BoaJornadaFormData {
    modo: 'dia' | 'semana';
    semanaNome: string;
    tema: string;
    coordenacao: string;
    gerencia: string;
    riscosMaiorIndice: string;
    detalhamento: string;
    dias: DiaForm[];
}

/** Valores padrão para nova atividade */
export const createEmptyAtividade = (): AtividadeFormRow => ({
    tempId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    atividade: '',
    executantes: '',
    tipoAtividade: 'Planejada',
    status: '',
    pontosAtencao: '',
    riscosCriticosIds: [],
});

// ── Helpers de data (sem problemas de fuso) ─────────────────────────────

export const toIsoDate = (d: Date): string => {
    const m = `0${d.getMonth() + 1}`.slice(-2);
    const day = `0${d.getDate()}`.slice(-2);
    return `${d.getFullYear()}-${m}-${day}`;
};

export const parseIsoDate = (s: string): Date => {
    const [y, m, d] = s.substring(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
};

/** Gera os 7 dias (Seg→Dom) da semana que contém a data informada */
export const buildWeek = (anyDate: string): DiaForm[] => {
    const base = parseIsoDate(anyDate);
    const offset = (base.getDay() + 6) % 7; // segunda = 0
    base.setDate(base.getDate() - offset);
    const dias: DiaForm[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(base);
        d.setDate(base.getDate() + i);
        dias.push({ data: toIsoDate(d), incluido: i < 5, atividades: [createEmptyAtividade()] });
    }
    return dias;
};

/** Valores padrão para o formulário */
export const createDefaultForm = (): BoaJornadaFormData => ({
    modo: 'dia',
    semanaNome: '',
    tema: '',
    coordenacao: '',
    gerencia: '',
    riscosMaiorIndice: '',
    detalhamento: '',
    dias: [{ data: toIsoDate(new Date()), incluido: true, atividades: [createEmptyAtividade()] }],
});