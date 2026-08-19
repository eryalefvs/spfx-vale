import { InspectionMapper } from "../mappers/InspectionMapper";
import { InspectionData, Measurement } from "../models/BatteryInspection";
import { SharePointService } from "./SharePointService";
import { ListNames } from "../constants/ListNames";
import { mapSPToLocation, mapToSede, mapToResponsibles } from "../mappers/DashboardMappers";
import { Location, Sedes, Responsibles } from "../models/DashboardModels";
import { SP_FIELDS } from "../constants/DashboardConstants";

export class InspectionService {

    public async saveActivity(data: InspectionData): Promise<number> {
        const item = InspectionMapper.toSharePoint(data);
        const result = await SharePointService.sp.web.lists
            .getByTitle(ListNames.InspectionData)
            .items.add(item)
        return result.data.Id; // Retorna o ID do item criado na lista do SharePoint
    }

    public async loadLocations(): Promise<Location[]> {
        const sp = SharePointService.sp;
        const f = SP_FIELDS.Locations;

        const items = await sp.web.lists.getByTitle(ListNames.Locations)
            .items.select(
                "Id",
                f.Title,
                f.Local,
                f.KM,
                f.Sede,
                f.Supervisao,
                f.localKm
            ).top(5000)();

        return items.map(mapSPToLocation);
    }

    public async loadSedes(): Promise<Sedes[]> {
        const f = SP_FIELDS.Sedes;

        const items = await SharePointService.sp.web.lists.getByTitle(ListNames.Sedes)
            .items.select(
                f.Title,
                f.Supervisao
            )()
        return items.map(mapToSede);
    }

    public async loadResponsaveis(): Promise<Responsibles[]> {
        const f = SP_FIELDS.Responsibles
        const items = await SharePointService.sp.web.lists.getByTitle(ListNames.Responsibles)
            .items.select(
                "Id",
                f.Title,
                f.Supervisao,
                f.Ativo,
                f.Matricula
            )()
        return items.map(mapToResponsibles);
    }

    public async saveMeasurements(activityId: number, measurements: Measurement[]): Promise<void> {
        const items = InspectionMapper.toSharePointMeasurement(activityId, measurements);

        const [batchList, execute] = SharePointService.sp.web.batched();
        const list = batchList.lists.getByTitle(ListNames.Measurements);

        for (const item of items) {
            await list.items.add(item);
        }

        await execute();
    }

    // public async parseExcelFile(file): Promise<InspectionData[]> {

    // }

}