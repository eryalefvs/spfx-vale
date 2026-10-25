// ============================================================================
// OperationalPlatformWebPart.test.ts
// Testes unitários para o entry point da WebPart OperationalPlatform.
// ============================================================================

// Mock do módulo de strings do SPFx
jest.mock('OperationalPlatformWebPartStrings', () => ({
  PropertyPaneDescription: 'Descrição da WebPart',
  BasicGroupName: 'Configurações Básicas',
  DescriptionFieldLabel: 'Descrição',
}), { virtual: true });

// Mock do App root
jest.mock('../components/App', () => ({
  App: () => null,
}));

// Mock do SharePointService
jest.mock('../../../services/SharePointService', () => ({
  SharePointService: {
    initialize: jest.fn(),
    sp: {},
  },
}));

import { SharePointService } from '../../../services/SharePointService';
import OperationalPlatformWebPart from '../OperationalPlatformWebPart';

describe('OperationalPlatformWebPart', () => {
  let webpart: OperationalPlatformWebPart;
  let domElement: HTMLDivElement;

  const mockContext: any = {
    pageContext: {
      user: { displayName: 'Eryalef Vieira' },
    },
  };

  beforeEach(() => {
    webpart = new OperationalPlatformWebPart();
    domElement = document.createElement('div');
    // Injetar contexto e domElement via defineProperty para sobrepor getters da BaseClientSideWebPart
    Object.defineProperty(webpart, 'domElement', {
      get: () => domElement,
      configurable: true,
    });
    Object.defineProperty(webpart, 'context', {
      get: () => mockContext,
      configurable: true,
    });
    Object.defineProperty(webpart, 'properties', {
      get: () => ({ description: 'Teste WebPart' }),
      configurable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('dataVersion retorna versão 1.0', () => {
    const version = (webpart as any).dataVersion;
    expect(version.toString()).toBe('1.0');
  });

  it('onInit inicializa o SharePointService com o contexto da WebPart', async () => {
    // Simular chamada super.onInit
    jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(webpart)), 'onInit').mockResolvedValue(undefined);

    await (webpart as any).onInit();

    expect(SharePointService.initialize).toHaveBeenCalledWith(mockContext);
  });

  it('render monta o componente App no domElement via ReactDom.render', () => {
    expect(() => webpart.render()).not.toThrow();
  });

  it('onDispose desmonta o componente montado no domElement', () => {
    webpart.render();
    expect(() => (webpart as any).onDispose()).not.toThrow();
  });

  it('onThemeChanged define variáveis CSS semânticas no domElement', () => {
    const mockTheme: any = {
      semanticColors: {
        bodyText: '#333333',
        link: '#0078d4',
        linkHovered: '#004578',
      },
    };

    (webpart as any).onThemeChanged(mockTheme);

    expect(domElement.style.getPropertyValue('--bodyText')).toBe('#333333');
    expect(domElement.style.getPropertyValue('--link')).toBe('#0078d4');
    expect(domElement.style.getPropertyValue('--linkHovered')).toBe('#004578');
  });

  it('getPropertyPaneConfiguration retorna configuração válida com campo de descrição', () => {
    const config = (webpart as any).getPropertyPaneConfiguration();

    expect(config.pages).toBeDefined();
    expect(config.pages.length).toBeGreaterThan(0);
    expect(config.pages[0].header.description).toBe('Descrição da WebPart');
    expect(config.pages[0].groups[0].groupName).toBe('Configurações Básicas');
  });
});
