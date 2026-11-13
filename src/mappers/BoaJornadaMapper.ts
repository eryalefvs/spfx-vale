// ============================================================================
// BoaJornadaMapper.ts
// Mapeamento entre objetos do SharePoint e modelos do Boa Jornada CRM.
// ============================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    BoaJornadaInfoGerais,
    BoaJornadaAtividade,
    RiscoCriticoIcone,
    AtividadeFormRow,
    Sede,
    Responsavel
} from '../models/BoajornadaModels';
import { SP_FIELDS_BOAJORNADA } from '../constants/BoaJornadaConstants';

const f = SP_FIELDS_BOAJORNADA;

// ── InfoGerais ──────────────────────────────────────────────────────────────

export function mapSPToBoaJornada(item: any): BoaJornadaInfoGerais {
    return {
        id: item.Id,
        title: item[f.BoaJornadaInfoGerais.Title] || '',
        data: item[f.BoaJornadaInfoGerais.Data] || '',
        coordenacao: item[f.BoaJornadaInfoGerais.Coordenacao] || '',
        gerencia: item[f.BoaJornadaInfoGerais.Gerencia] || '',
        riscosMaiorIndice: item[f.BoaJornadaInfoGerais.RiscosMaiorIndice] || '',
        detalhamento: item[f.BoaJornadaInfoGerais.Detalhamento] || '',
        tema: item[f.BoaJornadaInfoGerais.Tema] || '',
        semana: item[f.BoaJornadaInfoGerais.Semana] || '',
        semanaId: item[f.BoaJornadaInfoGerais.SemanaId] || '',
    };
}

export function mapBoaJornadaToSP(data: {
    data: string;
    coordenacao: string;
    gerencia: string;
    riscosMaiorIndice: string;
    detalhamento: string;
    tema: string;
    semana: string;
    semanaId: string;
}): Record<string, any> {
    return {
        [f.BoaJornadaInfoGerais.Title]: `Boa Jornada - ${data.coordenacao} - ${data.data}`,
        [f.BoaJornadaInfoGerais.Data]: data.data,
        [f.BoaJornadaInfoGerais.Coordenacao]: data.coordenacao,
        [f.BoaJornadaInfoGerais.Gerencia]: data.gerencia,
        [f.BoaJornadaInfoGerais.RiscosMaiorIndice]: data.riscosMaiorIndice,
        [f.BoaJornadaInfoGerais.Detalhamento]: data.detalhamento,
        [f.BoaJornadaInfoGerais.Tema]: data.tema,
        [f.BoaJornadaInfoGerais.Semana]: data.semana,
        [f.BoaJornadaInfoGerais.SemanaId]: data.semanaId,
    };
}

// ── Atividades ──────────────────────────────────────────────────────────────

export function mapSPToAtividade(item: any): BoaJornadaAtividade {
    const raw = item[f.BoaJornadaAtividade.RiscosCriticos];

    const riscoIds: number[] = Array.isArray(raw)
        ? raw.map((r: any) => r.Id).filter((id: any) => typeof id === 'number')
        : [];

    return {
        id: item.Id,
        title: item[f.BoaJornadaAtividade.Title] || '',
        jornadaId: item[f.BoaJornadaAtividade.JornadaId]?.Id || 0,
        atividade: item[f.BoaJornadaAtividade.Atividade] || '',
        executantes: item[f.BoaJornadaAtividade.Executantes] || '',
        oQuePodeMatar: item[f.BoaJornadaAtividade.OQuePodeMatar] || '',
        riscosCriticosIds: riscoIds,
        tipoAtividade: item[f.BoaJornadaAtividade.TipoAtividade] || '',
        status: item[f.BoaJornadaAtividade.StatusAtividade] || '',
        pontosAtencao: item[f.BoaJornadaAtividade.PontosAtencao] || '',
    };
}

/** Campos editáveis da atividade (usado no add e no update) */
export function mapAtividadeFieldsToSP(atividade: AtividadeFormRow): Record<string, any> {
    return {
        [f.BoaJornadaAtividade.Title]: atividade.atividade.substring(0, 255),
        [f.BoaJornadaAtividade.Atividade]: atividade.atividade,
        [f.BoaJornadaAtividade.Executantes]: atividade.executantes,
        [f.BoaJornadaAtividade.TipoAtividade]: atividade.tipoAtividade,
        [f.BoaJornadaAtividade.StatusAtividade]: atividade.status,
        [f.BoaJornadaAtividade.PontosAtencao]: atividade.pontosAtencao,
        [`${f.BoaJornadaAtividade.RiscosCriticos}Id`]: atividade.riscosCriticosIds
    };
}

export function mapAtividadeToSP(atividade: AtividadeFormRow, jornadaId: number): Record<string, any> {
    return {
        ...mapAtividadeFieldsToSP(atividade),
        [`${f.BoaJornadaAtividade.JornadaId}Id`]: jornadaId,
    };
}

// ── Listas auxiliares ───────────────────────────────────────────────────

export function mapSPToSede(item: any): Sede {
    return {
        id: item.Id,
        sede: item[f.Sedes.Sede] || '',
        supervisao: item[f.Sedes.Supervisao] || '',
        gerencia: item[f.Sedes.Gerencia] || '',
    };
}

export function mapSPToResponsavel(item: any): Responsavel {
    return {
        id: item.Id,
        nome: item[f.Responsaveis.Nome] || '',
        supervisao: item[f.Responsaveis.Supervisao] || '',
        gerencia: item[f.Responsaveis.Gerencia] || '',
        matricula: item[f.Responsaveis.Matricula] || '',
    };
}

// ── Ícones Riscos Críticos ──────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSPToRiscoCritico(item: any): RiscoCriticoIcone {
    let iconeUrl = '';
    const iconeField = item[f.IconeRiscosCriticos.Icone];
    if (iconeField) {
        // Campo de imagem pode vir como objeto JSON com Url ou como string
        if (typeof iconeField === 'string') {
            try {
                const parsed = JSON.parse(iconeField);
                iconeUrl = parsed.serverRelativeUrl || parsed.Url || parsed.url || iconeField;
            } catch {
                iconeUrl = iconeField;
            }
        } else if (iconeField.Url) {
            iconeUrl = iconeField.Url;
        } else if (iconeField.serverRelativeUrl) {
            iconeUrl = iconeField.serverRelativeUrl;
        }
    }

    return {
        id: item.Id,
        title: item[f.IconeRiscosCriticos.Title] || '',
        descricao: item[f.IconeRiscosCriticos.Descricao] || '',
        racAssociado: item[f.IconeRiscosCriticos.RACAssociado] || '',
        iconeUrl,
    };
}
