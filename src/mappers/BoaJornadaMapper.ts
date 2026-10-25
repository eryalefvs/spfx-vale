// ============================================================================
// BoaJornadaMapper.ts
// Mapeamento entre objetos do SharePoint e modelos do Boa Jornada CRM.
// ============================================================================

import {
    BoaJornadaInfoGerais,
    BoaJornadaAtividade,
    RiscoCriticoIcone,
    AtividadeFormRow
} from '../models/BoajornadaModels';
import { SP_FIELDS_BOAJORNADA } from '../constants/BoaJornadaConstants';

const f = SP_FIELDS_BOAJORNADA;

// ── InfoGerais ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSPToBoaJornada(item: any): BoaJornadaInfoGerais {
    return {
        id: item.Id,
        title: item[f.BoaJornadaInfoGerais.Title] || '',
        data: item[f.BoaJornadaInfoGerais.Data] || '',
        //supervisao: item[f.BoaJornadaInfoGerais.Supervisao] || '',
        // area: item[f.BoaJornadaInfoGerais.Area] || '',
        coordenacao: item[f.BoaJornadaInfoGerais.Coordenacao] || '',
        gerencia: item[f.BoaJornadaInfoGerais.Gerencia] || '',
        riscosMaiorIndice: item[f.BoaJornadaInfoGerais.RiscosMaiorIndice] || '',
        detalhamento: item[f.BoaJornadaInfoGerais.Detalhamento] || '',
    };
}

export function mapBoaJornadaToSP(data: {
    //supervisao: string;
    //area: string;
    data: string;
    coordenacao: string;
    gerencia: string;
    // riscosMaiorIndice: string;
    detalhamento: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): Record<string, any> {
    return {
        [f.BoaJornadaInfoGerais.Title]: `Boa Jornada - ${data.coordenacao} - ${data.data}`,
        [f.BoaJornadaInfoGerais.Data]: data.data,
        // [f.BoaJornadaInfoGerais.Supervisao]: data.supervisao,
        //[f.BoaJornadaInfoGerais.Area]: data.area,
        [f.BoaJornadaInfoGerais.Coordenacao]: data.coordenacao,
        [f.BoaJornadaInfoGerais.Gerencia]: data.gerencia,
        // [f.BoaJornadaInfoGerais.RiscosMaiorIndice]: data.riscosMaiorIndice,
        [f.BoaJornadaInfoGerais.Detalhamento]: data.detalhamento,
    };
}

// ── Atividades ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    };
}

export function mapAtividadeToSP(
    atividade: AtividadeFormRow,
    jornadaId: number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
    return {
        [f.BoaJornadaAtividade.Title]: atividade.atividade.substring(0, 255),
        [`${f.BoaJornadaAtividade.JornadaId}Id`]: jornadaId,
        [f.BoaJornadaAtividade.Atividade]: atividade.atividade,
        [f.BoaJornadaAtividade.Executantes]: atividade.executantes,
        [f.BoaJornadaAtividade.OQuePodeMatar]: atividade.oQuePodeMatar,
        [`${f.BoaJornadaAtividade.RiscosCriticos}Id`]: atividade.riscosCriticosIds
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
