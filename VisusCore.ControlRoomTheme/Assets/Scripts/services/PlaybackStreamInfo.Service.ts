import { injectable } from "../lib/inversify-fix";
import { StreamInfoModel } from "../models/playback/StreamInfo.Model";
import { HubConnectionManager } from "../helpers/HubConnectionManager";

@injectable()
export default class PlaybackStreamInfoService {
    private readonly hubConnectionManager: HubConnectionManager;

    constructor() {
        this.hubConnectionManager = new HubConnectionManager("/playback/stream-info");
    }

    async getStreams(): Promise<StreamInfoModel[]> {
        return await (await this.hubConnectionManager.createHubConnection())
            .invoke("GetStreamsAsync");
    }

    async getStream(streamId: string): Promise<StreamInfoModel> {
        return await (await this.hubConnectionManager.createHubConnection())
            .invoke("GetStreamAsync", streamId);
    }
}
