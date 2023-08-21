export interface VideoStreamInfoMetaModel {
    StreamId: string;
    TimestampUtc: number;
    Duration: number;
    TimestampProvided?: number;
    FrameCount: number;
}
