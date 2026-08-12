import { SharePointService } from "./SharePointService";

export class UserService {
    public static async getCurrentUser() { // Método assíncrono para obter o nome de exibição do usuário atual
        return await SharePointService.sp.web.siteUserInfoList(); // Retorna uma Promise que resolve com os dados do usuário atual, usando a instância do SharePointService
    }
}