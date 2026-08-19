export interface InspectionData {
    id?: number;
    title: string;
    maintenanceOrder: string;
    inspectionDate: Date;
    inspectorName: string[];
    typeInspection: string;
    supervision: string;
    venue: string;
    typeOfLocation: string;
    km: string;
    integrityAnomalies: string;
    integritySolutions: string;
    justificationLackOfInformation?: string;
    justificationNoContactWithMCM?: string;
    notes?: string;
}

export interface BatteryInspectionFormData {
    title: string;
    NO: string;
    serialNumber: string;
    batteryBank: string;
    fabricationDate: string;
    manufacturer: string;
    voltage: string;
    resistance: string;
    current: string;
    totalFloatVoltage: string;
    overallStatus: string;
    voltageStatus: string;
    resistanceStatus: string;
    roomTemperature: string;
    attachments: string[];
}

export interface Measurement {
    id?: number;
    title: string;
    tensao: string;
    resistencia: string;
    corrente: string;
    statusGeral: string;
    statusTensao: string;
    statusResistencia: string;
    idAtividade: number;
    bateria: string;
    data: Date;
}