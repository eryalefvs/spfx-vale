# WebPart InputBatteries — Gestão de Baterias

Criação da WebPart `inputBatteries` para inserção em massa e substituição de baterias na lista `Baterias_SAT2`.

## Regras de Negócio

### Locais e suas capacidades

| Local | Bancos | Baterias/Banco | Total |
|-------|--------|----------------|-------|
| TU    | 2      | 10             | 20    |
| HBD   | 1      | 6              | 6     |
| PN    | 1      | 6              | 6     |
| ARM   | 1      | 2              | 2     |
| TE    | 1      | 2              | 2     |
| MO    | 2      | 24             | 48    |

### Validações
- ❌ Não permitir inserir mais baterias do que o local suporta
- ⚠️ Notificar se inserir menos baterias do que o esperado para um banco
- ❌ Não permitir banco 2 em locais que só possuem 1 banco

### Substituição
- Baterias antigas devem ser marcadas como **"Inativa"** (não excluídas)
- Novas baterias entram como **"Ativa"**
- Opção de substituir **por banco** ou **baterias individuais**

## Proposed Changes

### Modelo e Constantes

#### [MODIFY] [DashboardModels.ts](file:///c:/Users/Eryálef Vieira/Work Folder/Vale/SPFx/src/models/DashboardModels.ts)
- Adicionar campo `status: 'Ativa' | 'Inativa'` à interface `Battery`

#### [MODIFY] [DashboardConstants.ts](file:///c:/Users/Eryálef Vieira/Work Folder/Vale/SPFx/src/constants/DashboardConstants.ts)
- Adicionar constante `LOCATION_RULES` com mapa de locais → {bancos, bateriasPorBanco}
- Adicionar campo `Status` ao `SP_FIELDS.Batteries` (precisará ser criado no SP ou já existe?)

---

### Serviço de Baterias

#### [NEW] [BatteryService.ts](file:///c:/Users/Eryálef Vieira/Work Folder/Vale/SPFx/src/services/BatteryService.ts)
- `loadLocations()` — Carrega locais da lista `km das LI` (reutiliza DashboardService)
- `loadBatteriesByLocation(locationId)` — Carrega baterias ativas de um local
- `addBatteries(items[])` — Insere baterias em lote na lista `Baterias_SAT2`
- `deactivateBatteries(ids[])` — Marca baterias como "Inativa" (update do campo Status)
- `replaceBatteries(locationId, bankNumber?, newBatteries[])` — Desativa as antigas e insere as novas

---

### Componentes da WebPart

#### [MODIFY] [InputBatteriesWebPart.ts](file:///c:/Users/Eryálef Vieira/Work Folder/Vale/SPFx/src/webparts/inputBatteries/InputBatteriesWebPart.ts)
- Inicializar `SharePointService.initialize(context)` no `onInit()`
- Passar `context` para o componente root

#### [MODIFY] [IInputBatteriesProps.ts](file:///c:/Users/Eryálef Vieira/Work Folder/Vale/SPFx/src/webparts/inputBatteries/components/IInputBatteriesProps.ts)
- Adicionar `context: any` ao props

#### [NEW] [InputBatteries.module.scss](file:///c:/Users/Eryálef Vieira/Work Folder/Vale/SPFx/src/webparts/inputBatteries/components/InputBatteries.module.scss)
- Reescrever SCSS com design premium (mesmo padrão do Dashboard com CSS Variables dark/light)
- Estilos para: header, formulário, tabela de baterias, cards de resumo, notificações

#### [MODIFY] [InputBatteries.tsx](file:///c:/Users/Eryálef Vieira/Work Folder/Vale/SPFx/src/webparts/inputBatteries/components/InputBatteries.tsx)
- **Layout principal** com header, área de operação (abas Inserir / Substituir) e tabela de preview

#### [NEW] [BatteryForm.tsx](file:///c:/Users/Eryálef Vieira/Work Folder/Vale/SPFx/src/webparts/inputBatteries/components/BatteryForm.tsx)
- Formulário com campos: Nº Série, Fabricante, Modelo, Banco, Data Fabricação
- Local e KM selecionados automaticamente pelo dropdown do pai
- Botão "Adicionar" coloca na tabela de preview
- Pode gerar linhas em lote (ex: "Gerar 10 linhas")

#### [NEW] [BatteryPreviewTable.tsx](file:///c:/Users/Eryálef Vieira/Work Folder/Vale/SPFx/src/webparts/inputBatteries/components/BatteryPreviewTable.tsx)
- Tabela com todas as baterias a serem inseridas/substituídas
- Edição inline (cada célula editável)
- Botão remover por linha
- Exibe validações (highlight em vermelho se violar regras)

#### [NEW] [ReplacementPanel.tsx](file:///c:/Users/Eryálef Vieira/Work Folder/Vale/SPFx/src/webparts/inputBatteries/components/ReplacementPanel.tsx)
- Dropdown de Local → carrega baterias ativas desse local
- Opção: "Substituir Banco inteiro" (dropdown banco 1/2) ou "Selecionar baterias individualmente"
- Mostra baterias antigas que serão inativadas
- Tabela de novas baterias (mesmo formato do BatteryForm)

---

## Fluxo do Usuário

### Inserção
```
1. Seleciona Local (dropdown de 'km das LI')
   → Exibe: "TU · 2 bancos · 10 baterias/banco · Total: 20"
2. Seleciona Banco (1 ou 2, conforme local)
3. Preenche dados em massa (formulário ou cola do Excel)
4. Preview na tabela → Validações em tempo real
5. Confirma → Insere na lista SP
```

### Substituição
```
1. Seleciona Local → Carrega baterias ativas
2. Escolhe modo: "Por Banco" ou "Individual"
3. Se "Por Banco": seleciona banco → mostra baterias que serão inativadas
4. Se "Individual": seleciona baterias específicas via checkbox
5. Preenche dados das novas baterias
6. Preview + Validação
7. Confirma → Inativa antigas + Insere novas
```

## Open Questions

> [!IMPORTANT]
> **Campo "Status" na lista `Baterias_SAT2`**: A lista já possui uma coluna de Status (Ativa/Inativa) ou preciso criar? Se não existir, será necessário criar manualmente no SharePoint antes de deployar.

> [!IMPORTANT]
> **Campo "NO" (posição no banco)**: Ao inserir baterias, o campo NO deve ser numeração automática sequencial (1, 2, 3...) dentro do banco, ou o usuário informa manualmente?

> [!NOTE]
> **Importação de Excel/CSV**: Deseja que o usuário possa colar dados diretamente de uma planilha Excel (ctrl+v) para popular a tabela em massa, ou o preenchimento manual linha a linha é suficiente?

## Verification Plan

### Manual Verification
- Testar inserção de baterias para cada tipo de local
- Verificar validações (excesso, falta, banco inválido)
- Testar substituição por banco e individual
- Confirmar que baterias antigas ficam como "Inativa" na lista SP
- Verificar que o Dashboard reflete as alterações
