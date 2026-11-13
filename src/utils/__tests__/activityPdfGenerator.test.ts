import { generateActivityPdfBytes, IActivityPdfData } from '../activityPdfGenerator';

describe('activityPdfGenerator', () => {
  it('gera um documento PDF 1.4 válido com cabeçalho %PDF-1.4 e marcador %%EOF', () => {
    const sampleActivity: IActivityPdfData = {
      id: 1,
      maintenanceOrder: 'OM-123456',
      activityDate: new Date(2026, 2, 15),
      responsibles: ['João Silva', 'Maria Oliveira'],
      supervision: 'CSATSI',
      sede: 'VTM',
      activityType: 'Manutenção Preventiva',
      locationType: 'TU',
      km: '85',
      roomTemperature: 26.5,
      totalVoltage: 136.4,
      generalObservations: 'Baterias inspecionadas sem intercorrências.',
      integrityAnomalies: 'Nenhuma anomalia encontrada',
      integritySolutions: '',
      justificationLackOfInfo: '',
      justificationNoContactMCM: '',
      resolvedSede: 'VTM',
      resolvedKm: '85',
      resolvedLocationType: 'TU',
      localKm: 'TU-85',
      measurements: [
        {
          id: 101,
          title: 'B1-Bat01',
          batteryId: 10,
          batterySerialNumber: 'BAT-001',
          activityId: 1,
          voltage: 13.65,
          resistance: 2.35,
          current: 0,
          overallStatus: 'EXCELENTE',
          voltageStatus: 'EXCELENTE',
          resistanceStatus: 'EXCELENTE',
          date: new Date(2026, 2, 15),
          battery: {
            id: 10,
            serialNumber: 'BAT-001',
            sequenceNumber: 1,
            bankNumber: 1,
            model: 'SBS-170F',
            manufacturer: 'EnerSys',
            locationType: 'TU',
            km: 85,
            locationId: 5,
            locationTitle: 'TU-85',
            status: 'Ativa',
          },
        },
      ],
    };

    const bytes = generateActivityPdfBytes(sampleActivity);
    expect(bytes.length).toBeGreaterThan(200);

    const fullPdfText = String.fromCharCode(...Array.from(bytes));
    expect(fullPdfText.slice(0, 8)).toBe('%PDF-1.4');
    expect(fullPdfText.slice(fullPdfText.length - 5)).toBe('%%EOF');
    expect(fullPdfText).toContain('DADOS DAS BATERIAS DO LOCAL');
    expect(fullPdfText).toContain('EnerSys');
    expect(fullPdfText).toContain('SBS-170F');
  });
});

