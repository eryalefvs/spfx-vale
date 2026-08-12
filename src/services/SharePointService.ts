import { SPFI, spfi } from '@pnp/sp'
import { SPFx } from '@pnp/sp'
import '@pnp/sp/webs'
import '@pnp/sp/lists'
import '@pnp/sp/items'

import { WebPartContext } from '@microsoft/sp-webpart-base'

export class SharePointService {
  private static _sp: SPFI  // Private static variable to hold the SPFI instance; Especifica apenas uma intância da conexão

  public static initialize(context: WebPartContext): void { // Recebemos o contexto da conexão: usuário, site, etc.
    this._sp = spfi().using(SPFx(context)) // Inicializa a conexão com o SharePoint usando o contexto fornecido
  }

  public static get sp(): SPFI { // Getter para acessar a instância do SPFI; permite que outras partes do código usem a conexão com o SharePoint
    if (!this._sp) {
      throw new Error('SharePointService is not initialized. Call SharePointService.initialize(context) before using it.')
    }
    return this._sp
  }
}
