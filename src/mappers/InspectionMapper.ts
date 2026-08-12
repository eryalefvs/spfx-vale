import { InspectionData } from "../models/BatteryInspection";


export class InspectionMapper {
    public static toSharePoint(data: InspectionData) {
        return {
            title: data.title,
            maintenanceOrder: data.maintenanceOrder,
            inspectionDate: data.inspectionDate,
            inspectorName: data.inspectorName,
            typeInspection: data.typeInspection,
            supervision: data.supervision,
            venue: data.venue,
            typeOfLocation: data.typeOfLocation,
            km: data.km,
            integrityAnomalies: data.integrityAnomalies,
            integritySolutions: data.integritySolutions,
            justificationLackOfInformation: data.justificationLackOfInformation,
            justificationNoContactWithMCM: data.justificationNoContactWithMCM,
            notes: data.notes
        }

    }
    public static fromSharePoint(item: any): InspectionData {
        return {
            title: item.title,
            maintenanceOrder: item.maintenanceOrder,
            inspectionDate: item.inspectionDate,
            inspectorName: item.inspectorName,
            typeInspection: item.typeInspection,
            supervision: item.supervision,
            venue: item.venue,
            typeOfLocation: item.typeOfLocation,
            km: item.km,
            integrityAnomalies: item.integrityAnomalies,
            integritySolutions: item.integritySolutions,
            justificationLackOfInformation: item.justificationLackOfInformation,
            justificationNoContactWithMCM: item.justificationNoContactWithMCM,
            notes: item.notes
        }
    }
}