import { SharePointService } from "./SharePointService";

export class ListService {
    protected get sp() {
        return SharePointService.sp;
    }
}