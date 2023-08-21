import { injectable } from "../lib/inversify-fix";
import { HubConnectionManager } from "../helpers/HubConnectionManager";
import { VideoStreamInfoMetaModel } from "../models/VideoStreamInfoMeta.Model";

@injectable()
export default class StorageStreamInfoService {
    private readonly hubConnectionManager: HubConnectionManager;

    constructor() {
        this.hubConnectionManager = new HubConnectionManager("/storage/stream-info");
    }

    async getSegments(streamId: string, from?: number, to?: number, skip?: number, take?: number): Promise<VideoStreamInfoMetaModel[]> {
        return await (await this.hubConnectionManager.createHubConnection())
            .invoke("GetSegmentsAsync", streamId, from, to, skip, take);
    }
}
