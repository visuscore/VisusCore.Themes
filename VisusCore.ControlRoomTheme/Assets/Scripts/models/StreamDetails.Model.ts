import { EMediaTypeModel } from "./EMediaType.Model";
import { RationalModel } from "./Rational.Model";

export interface StreamDetailsModel {
    Index: number;
    MediaType: EMediaTypeModel;
    CodecName?: string;
    CodecLongName?: string;
    Profile?: string;
    MediaTypeName?: string;
    Width?: number;
    Height?: number;
    PixelFormatName?: number;
    SampleFormatName?: number;
    SampleRate?: number;
    Channels?: number;
    FrameRate?: RationalModel;
    AvgFrameRate?: RationalModel;
    TimeBase?: RationalModel;
    BitRate?: number;
}
