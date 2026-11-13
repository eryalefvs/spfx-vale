// ============================================================================
// BoaJornadaConstants.ts
// Constantes de campos do SharePoint para o módulo Boa Jornada CRM.
// ============================================================================

export const SP_FIELDS_BOAJORNADA = {
    BoaJornadaInfoGerais: {
        Title: "Title",
        Data: "Data",
        Supervisao: "Supervisao",
        Area: "Area",
        Coordenacao: "Coordenacao",
        Gerencia: "Gerencia",
        Detalhamento: "Detalhamento",
        RiscosMaiorIndice: "RiscosMaiorIndice",
        // Novos
        Tema: "Tema",                 // Texto (uma linha)
        Semana: "Semana",             // Texto (uma linha) - nome dado à semana
        SemanaId: "SemanaId"          // Texto (uma linha) - chave que agrupa os dias da semana
    },
    BoaJornadaAtividade: {
        Title: "Title",
        JornadaId: "JornadaID",
        Atividade: "Atividade",
        Executantes: "Executantes",
        OQuePodeMatar: "OQuePodeMatar", // legado (não é mais preenchido)
        RiscosCriticos: "RiscosCriticos",
        // Novos
        TipoAtividade: "TipodeAtividade",     // Texto ou Escolha
        StatusAtividade: "StatusAtividade", // Texto ou Escolha
        PontosAtencao: "PontosAtencao"      // Várias linhas de texto
    },
    IconeRiscosCriticos: {
        Title: "Title",
        Descricao: "Descri_x00e7__x00e3_o",
        RACAssociado: "RACassociado",
        Icone: "OData__x00cd_cone"
    },
    Sedes: {
        Sede: "Title",
        Supervisao: "Supervis_x00e3_o",
        Gerencia: "Gerencia"
    },
    Responsaveis: {
        Nome: "Title",
        Supervisao: "Supervis_x00e3_o",
        Ativo: "Ativo",
        Matricula: "Matr_x00ed_cula",
        Gerencia: "Gerencia"
    }
} as const;

export const TIPOS_ATIVIDADE = ['Planejada', 'Não planejada'];
export const STATUS_ATIVIDADE = ['Em andamento', 'Concluído', 'Não executado', 'Cancelado'];

export const STATUS_CORES: Record<string, string> = {
    'Em andamento': '#0078d4',
    'Concluído': '#107c10',
    'Não executado': '#d83b01',
    'Cancelado': '#605e5c'
};