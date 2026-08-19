export interface BoaJornadaInfoGerais {
    id: number;
    title: string;
    data: Date;
    area: string;
    coordenacao: string;
    gerencia: string;
    detalhamento: string;
}

export interface BoaJornadaAtividade {
    id: number;
    title: string;
    jornadaId: number;
    atividade: string;
    executantes: string;
    oQuePodematar: string;
    riscosCriticos: RiscosCriticos[];
    riscosMaiorIndice: string;
    detalhamento: string;
}

export interface RiscosCriticos {
    id: number;
    title: string;
    descricao: string;
    rac: string;
    icone: string;
}