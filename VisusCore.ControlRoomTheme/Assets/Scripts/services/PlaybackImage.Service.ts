import { HubConnectionManager } from "../helpers/HubConnectionManager";
import { injectable } from "../lib/inversify-fix";
import { StreamDetailsModel } from "../models/StreamDetails.Model";
import ImageTransformationsParameters from "../models/playback/image/ImageTransformationsParameters.Model";

@injectable()
export default class PlaybackImageService {
    private readonly hubConnectionManager: HubConnectionManager;

    constructor() {
        this.hubConnectionManager = new HubConnectionManager("/playback/image");
    }

    async getLatestImage(
        streamId: string,
        transformations: ImageTransformationsParameters): Promise<Uint8Array> {
        return await (await this.hubConnectionManager.createHubConnection())
            .invoke("GetLatestImageAsync", streamId, transformations);
    }

    async getImage(
        streamId: string,
        timestampUtc: number,
        exact: boolean,
        transformations: ImageTransformationsParameters): Promise<Uint8Array> {
        return await (await this.hubConnectionManager.createHubConnection())
            .invoke("GetImageAsync", streamId, timestampUtc, exact, transformations);
    }

    async getLatestSegmentDetails(streamId: string): Promise<StreamDetailsModel> {
        return await (await this.hubConnectionManager.createHubConnection())
            .invoke("GetLatestSegmentDetailsAsync", streamId);
    }

    async getSegmentDetails(streamId: string, timestampUtc: number): Promise<StreamDetailsModel> {
        return await (await this.hubConnectionManager.createHubConnection())
            .invoke("GetSegentDetailsAsync", streamId, timestampUtc);
    }
}
