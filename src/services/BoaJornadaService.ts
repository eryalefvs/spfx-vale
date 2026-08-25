// ============================================================================
// BoaJornadaService.ts
// Serviço para operações CRUD do módulo Boa Jornada CRM no SharePoint.
// ============================================================================

import { SharePointService } from './SharePointService';
import { ListNames } from '../constants/ListNames';
import { SP_FIELDS_BOAJORNADA } from '../constants/BoaJornadaConstants';
import {
    BoaJornadaInfoGerais,
    BoaJornadaAtividade,
    RiscoCriticoIcone,
    BoaJornadaFormData,
    AtividadeFormRow
} from '../models/BoajornadaModels';
import {
    mapSPToBoaJornada,
    mapBoaJornadaToSP,
    mapSPToAtividade,
    mapAtividadeToSP,
    mapSPToRiscoCritico
} from '../mappers/BoaJornadaMapper';

const fInfo = SP_FIELDS_BOAJORNADA.BoaJornadaInfoGerais;
const fAtiv = SP_FIELDS_BOAJORNADA.BoaJornadaAtividade;
const fRisco = SP_FIELDS_BOAJORNADA.IconeRiscosCriticos;

export class BoaJornadaService {

    // ── Ícones de Riscos Críticos ───────────────────────────────────────

    /** Carrega todos os ícones de riscos críticos da lista do SP */
    public async loadRiscosCriticos(): Promise<RiscoCriticoIcone[]> {
        const sp = SharePointService.sp;

        const items = await sp.web.lists
            .getByTitle(ListNames.IconeRiscosCriticos)
            .items
            .top(1)();

        console.log("ITEM DA LISTA:", items[0]);
        console.log("CHAVES:", Object.keys(items[0]));

        return items;

        // const items = await sp.web.lists
        //     .getByTitle(ListNames.IconeRiscosCriticos)
        //     .items.select(
        //         'Id', fRisco.Title, fRisco.Descricao,
        //         fRisco.RACAssociado, fRisco.Icone
        //     )
        //     .top(100)();

        // return items.map(mapSPToRiscoCritico);
    }

    // ── Informações Gerais ──────────────────────────────────────────────

    /** Lista todas as Boa Jornadas (para histórico) */
    public async loadBoaJornadas(): Promise<BoaJornadaInfoGerais[]> {
        const sp = SharePointService.sp;

        const items = await sp.web.lists
            .getByTitle(ListNames.BoaJornadaInfoGerais)
            .items.select(
                'Id', fInfo.Title, fInfo.Data, fInfo.Supervisao,
                fInfo.Area, fInfo.Coordenacao, fInfo.Gerencia,
                fInfo.RiscosMaiorIndice, fInfo.Detalhamento
            )
            .orderBy(fInfo.Data, false)
            .top(500)();

        return items.map(mapSPToBoaJornada);
    }

    /** Carrega uma Boa Jornada específica pelo ID */
    public async loadBoaJornadaById(id: number): Promise<BoaJornadaInfoGerais> {
        const sp = SharePointService.sp;

        const item = await sp.web.lists
            .getByTitle(ListNames.BoaJornadaInfoGerais)
            .items.getById(id)
            .select(
                'Id', fInfo.Title, fInfo.Data, fInfo.Supervisao,
                fInfo.Area, fInfo.Coordenacao, fInfo.Gerencia,
                fInfo.RiscosMaiorIndice, fInfo.Detalhamento
            )();

        return mapSPToBoaJornada(item);
    }

    /** Salva as informações gerais e retorna o ID criado */
    public async saveInfoGerais(data: BoaJornadaFormData): Promise<number> {
        const sp = SharePointService.sp;
        const spItem = mapBoaJornadaToSP(data);

        const result = await sp.web.lists
            .getByTitle(ListNames.BoaJornadaInfoGerais)
            .items.add(spItem);

        return result.Id;
    }

    // ── Atividades ──────────────────────────────────────────────────────

    /** Carrega atividades de uma Boa Jornada pelo jornadaId */
    public async loadAtividades(jornadaId: number): Promise<BoaJornadaAtividade[]> {
        const sp = SharePointService.sp;

        const items = await sp.web.lists
            .getByTitle(ListNames.BoaJornadaAtividade)
            .items.select(
                'Id', fAtiv.Title, fAtiv.JornadaId, fAtiv.Atividade,
                fAtiv.Executantes, fAtiv.OQuePodeMatar, fAtiv.RiscosCriticos
            )
            .filter(`${fAtiv.JornadaId} eq ${jornadaId}`)
            .top(100)();

        return items.map(mapSPToAtividade);
    }

    /** Salva todas as atividades vinculadas a um jornadaId */
    public async saveAtividades(
        jornadaId: number,
        atividades: AtividadeFormRow[]
    ): Promise<void> {
        const sp = SharePointService.sp;
        const list = sp.web.lists.getByTitle(ListNames.BoaJornadaAtividade);

        for (const atividade of atividades) {
            if (!atividade.atividade.trim()) continue; // Pula linhas vazias
            const spItem = mapAtividadeToSP(atividade, jornadaId);
            await list.items.add(spItem);
        }
    }

    /** Atualiza uma atividade existente */
    public async updateAtividade(
        atividadeId: number,
        atividade: AtividadeFormRow
    ): Promise<void> {
        const sp = SharePointService.sp;

        await sp.web.lists
            .getByTitle(ListNames.BoaJornadaAtividade)
            .items.getById(atividadeId)
            .update({
                [fAtiv.Atividade]: atividade.atividade,
                [fAtiv.Executantes]: atividade.executantes,
                [fAtiv.OQuePodeMatar]: atividade.oQuePodeMatar,
                [fAtiv.RiscosCriticos]: JSON.stringify(atividade.riscosCriticosIds),
            });
    }

    /** Exclui uma atividade */
    public async deleteAtividade(atividadeId: number): Promise<void> {
        const sp = SharePointService.sp;

        await sp.web.lists
            .getByTitle(ListNames.BoaJornadaAtividade)
            .items.getById(atividadeId)
            .delete();
    }

    // ── Fluxo Completo ──────────────────────────────────────────────────

    /** Salva toda a Boa Jornada (info gerais + atividades) */
    public async saveBoaJornadaCompleta(data: BoaJornadaFormData): Promise<number> {
        // 1. Salva info gerais → obtém ID
        const jornadaId = await this.saveInfoGerais(data);

        // 2. Salva atividades vinculadas
        await this.saveAtividades(jornadaId, data.atividades);

        return jornadaId;
    }
}
