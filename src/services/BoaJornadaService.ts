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
    AtividadeFormRow,
    Sede,
    Responsavel
} from '../models/BoajornadaModels';
import {
    mapSPToBoaJornada,
    mapBoaJornadaToSP,
    mapSPToAtividade,
    mapAtividadeToSP,
    mapAtividadeFieldsToSP,
    mapSPToSede,
    mapSPToResponsavel
} from '../mappers/BoaJornadaMapper';
import '@pnp/sp/attachments';

const fInfo = SP_FIELDS_BOAJORNADA.BoaJornadaInfoGerais;
const fAtiv = SP_FIELDS_BOAJORNADA.BoaJornadaAtividade;
const fRisco = SP_FIELDS_BOAJORNADA.IconeRiscosCriticos;
const fSede = SP_FIELDS_BOAJORNADA.Sedes;
const fResp = SP_FIELDS_BOAJORNADA.Responsaveis;

export class BoaJornadaService {

    // ── Ícones de Riscos Críticos ───────────────────────────────────────

    /** Carrega todos os ícones de riscos críticos da lista do SP */
    // public async loadRiscosCriticos(): Promise<RiscoCriticoIcone[]> {
    //     const sp = SharePointService.sp;

    //     const items = await sp.web.lists
    //          .getByTitle(ListNames.IconeRiscosCriticos)
    //          .items
    //          .top(1)();

    //     console.log("ITEM DA LISTA:", items[0]);
    //     console.log("CHAVES:", Object.keys(items[0]));

    //     return items;

    //     const items = await sp.web.lists
    //         .getByTitle(ListNames.IconeRiscosCriticos)
    //         .items.select(
    //             'Id', fRisco.Title, fRisco.Descricao,
    //             fRisco.RACAssociado, fRisco.Icone
    //         )
    //         .top(100)();

    //     const attachments = await sp.web.lists
    //         .getByTitle(ListNames.IconeRiscosCriticos)
    //         .items
    //         .getById(1)
    //         .attachmentFiles();

    //     console.log('ANEXOS DO ITEM:', attachments);
    //     console.log('URL DA IMAGEM:', attachments[0]?.ServerRelativeUrl);
    //     console.log('NOME:', attachments[0]?.FileName);

    //     return items.map(mapSPToRiscoCritico);
    // }

    public async loadRiscosCriticos(): Promise<RiscoCriticoIcone[]> {
        const sp = SharePointService.sp;

        const items = await sp.web.lists
            .getByTitle(ListNames.IconeRiscosCriticos)
            .items
            .select(
                'Id',
                fRisco.Title,
                fRisco.Descricao,
                fRisco.RACAssociado
            )
            .top(100)();

        const riscos = await Promise.all(
            items.map(async (item) => {
                const attachments = await sp.web.lists
                    .getByTitle(ListNames.IconeRiscosCriticos)
                    .items
                    .getById(item.Id)
                    .attachmentFiles();

                const serverRelativeUrl = attachments[0]?.ServerRelativeUrl || '';

                const iconeUrl = serverRelativeUrl
                    ? new URL(serverRelativeUrl, window.location.origin).href
                    : '';

                return {
                    id: item.Id,
                    title: item[fRisco.Title] || '',
                    descricao: item[fRisco.Descricao] || '',
                    racAssociado: item[fRisco.RACAssociado] || '',
                    iconeUrl
                };
            })
        );

        return riscos;
    }

    // ── Listas auxiliares (Sedes / Responsáveis) ────────────────────────

    /** Carrega a lista 'Sedes' (fonte das coordenações) */
    public async loadSedes(): Promise<Sede[]> {
        const sp = SharePointService.sp;
        const items = await sp.web.lists
            .getByTitle(ListNames.Sedes)
            .items.select('Id', fSede.Sede, fSede.Supervisao, fSede.Gerencia)
            .top(1000)();
        return items.map(mapSPToSede);
    }

    /** Carrega os responsáveis ativos (fonte dos executantes) */
    public async loadResponsaveis(): Promise<Responsavel[]> {
        const sp = SharePointService.sp;
        const items = await sp.web.lists
            .getByTitle(ListNames.Responsaveis)
            .items.select('Id', fResp.Nome, fResp.Supervisao, fResp.Gerencia, fResp.Matricula)
            .filter(`${fResp.Ativo} eq 1`)
            .orderBy(fResp.Nome, true)
            .top(5000)();
        return items.map(mapSPToResponsavel);
    }

    // ── Informações Gerais ──────────────────────────────────────────────

    private readonly infoFields = [
        'Id', fInfo.Title, fInfo.Data, fInfo.Coordenacao, fInfo.Gerencia,
        fInfo.Detalhamento, fInfo.RiscosMaiorIndice, fInfo.Tema, fInfo.Semana, fInfo.SemanaId
    ];

    /** Lista todas as Boa Jornadas (para histórico) */
    public async loadBoaJornadas(): Promise<BoaJornadaInfoGerais[]> {
        const sp = SharePointService.sp;

        const items = await sp.web.lists
            .getByTitle(ListNames.BoaJornadaInfoGerais)
            .items.select(...this.infoFields)
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
            .select(...this.infoFields)();

        return mapSPToBoaJornada(item);
    }

    /** Salva as informações gerais de UM dia e retorna o ID criado */
    public async saveInfoGerais(
        data: BoaJornadaFormData,
        dia: string,
        semanaId: string
    ): Promise<number> {
        const sp = SharePointService.sp;
        const spItem = mapBoaJornadaToSP({
            data: dia,
            coordenacao: data.coordenacao,
            gerencia: data.gerencia,
            riscosMaiorIndice: data.riscosMaiorIndice,
            detalhamento: data.detalhamento,
            tema: data.tema,
            semana: data.modo === 'semana' ? data.semanaNome : '',
            semanaId,
        });

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
                'Id', fAtiv.Title, 'JornadaID/Id', fAtiv.Atividade,
                fAtiv.Executantes, fAtiv.OQuePodeMatar, 'RiscosCriticos/Id',
                fAtiv.TipoAtividade, fAtiv.StatusAtividade, fAtiv.PontosAtencao,
            )
            .expand('JornadaID', 'RiscosCriticos')
            .filter(`JornadaID/Id eq ${jornadaId}`)
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

        // console.log("JORNADA ID:", jornadaId, "Atividades:", atividades);

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
            .update(mapAtividadeFieldsToSP(atividade));
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

    /**
     * Salva toda a Boa Jornada (info gerais + atividades).
     * Modo 'dia': cria 1 registro. Modo 'semana': cria 1 registro por dia
     * incluído (com atividades), todos com o mesmo SemanaId/Semana.
     */
    public async saveBoaJornadaCompleta(data: BoaJornadaFormData): Promise<number[]> {
        const semanaId = data.modo === 'semana'
            ? `sem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
            : '';
        const ids: number[] = [];

        for (const dia of data.dias) {
            if (!dia.incluido) continue;
            if (!dia.atividades.some((a) => a.atividade.trim())) continue;

            const jornadaId = await this.saveInfoGerais(data, dia.data, semanaId);
            await this.saveAtividades(jornadaId, dia.atividades);
            ids.push(jornadaId);
        }

        return ids;
    }
}
