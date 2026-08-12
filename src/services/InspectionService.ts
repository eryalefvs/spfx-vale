import { InspectionMapper } from "../mappers/InspectionMapper";
import { InspectionData } from "../models/BatteryInspection";
import { SharePointService } from "./SharePointService";
import { ListNames } from "../constants/ListNames";

export class InspectionService {

    public async create(data: InspectionData): Promise<number> {
        const item = InspectionMapper.toSharePoint(data);
        const result = await SharePointService.sp.web.lists
        .getByTitle(ListNames.InspectionData)
        .items.add(item)
        return result.data.Id; // Retorna o ID do item criado na lista do SharePoint
    }
}