import React from "react";
import PlaybackImageService from "../services/PlaybackImage.Service";
import { resolve } from "inversify-react";
import { StreamDetailsModel } from "../models/StreamDetails.Model";
import { StreamInfoModel } from "../models/playback/StreamInfo.Model";
import Resources from "../constants/Resources";
import PlaybackStreamInfoService from "../services/PlaybackStreamInfo.Service";
import styles from "./StreamImage.Component.module.scss";

export interface IStreamImageProps {
    streamId: string;
    className?: string;
    style?: React.CSSProperties;
    timestampUtc?: number;
    scale?: number;
    loadingCallback?: (timestampUtc: number) => void;
    loadedCallback?: (timestampUtc: number, loadingTime: number) => void;
    errorCallback?: (error: any) => void;
};

interface IStreamImageState {
    stream?: StreamInfoModel;
    streamDetails?: StreamDetailsModel;
    imageDataUrl?: string;
    pending: boolean;
}

export class StreamImage extends React.Component<IStreamImageProps, IStreamImageState> {
    @resolve(PlaybackStreamInfoService)
    private readonly playbackStreamInfoService: PlaybackStreamInfoService;
    @resolve(PlaybackImageService)
    private readonly playbackImageService: PlaybackImageService;
    private imageElementRef?: HTMLImageElement;

    constructor(props: IStreamImageProps) {
        super(props);
        this.state = {
            pending: false,
        };
    }

    async componentDidMount() {
        this.setState({
            pending: true,
        });
        try {
            this.setState({
                stream: await this.playbackStreamInfoService.getStream(this.props.streamId),
                streamDetails: await this.playbackImageService.getLatestSegmentDetails(this.props.streamId),
            });

            await this.updateImage();
        } finally {
            this.setState({
                pending: false,
            });
        }
    }

    async componentDidUpdate(prevProps: Readonly<IStreamImageProps>, prevState: Readonly<IStreamImageState>, snapshot?: any) {
        if (prevProps.timestampUtc !== this.props.timestampUtc || prevProps.scale !== this.props.scale) {
            await this.updateImage();
        }
    }

    private async updateImage() {
        const replaceImageDataUrl = (imageData?: Uint8Array) => {
            const oldImageDataUrl = this.state.imageDataUrl;
            this.setState({
                imageDataUrl: imageData
                    ? URL.createObjectURL(new Blob([imageData], { type: 'image/jpeg' }))
                    : null,
            });

            if (oldImageDataUrl) {
                URL.revokeObjectURL(oldImageDataUrl);
            }
        }

        this.setState({
            pending: true,
        });

        try {
            if (this.imageElementRef && this.state.streamDetails) {
                this.props.loadingCallback?.(this.props.timestampUtc);
                const startLoading = Date.now();
                const transformations = {
                    Scale: this.imageElementRef && this.state.streamDetails.Height
                        ? this.imageElementRef.clientHeight / this.state.streamDetails.Height
                        : 0.1,
                    Quality: 20,
                };
                transformations.Scale *= this.props.scale ?? 1;
                const imageData = await (this.props.timestampUtc
                    ? this.playbackImageService.getImage(this.props.streamId, this.props.timestampUtc, false, transformations)
                    : this.playbackImageService.getLatestImage(this.props.streamId, transformations));
                const endLoading = Date.now();
                if (!imageData) {
                    throw new Error('Failed to load image.');
                }

                this.props.loadedCallback?.(this.props.timestampUtc, endLoading - startLoading);

                replaceImageDataUrl(imageData);
            }
        } catch (error) {
            // TODO: Error logging.
            replaceImageDataUrl(null);
            this.props.errorCallback?.(error);
        } finally {
            this.setState({
                pending: false,
            });
        }
    }

    render() {
        return (
            <img src={this.state.imageDataUrl ?? Resources.EmptyImage}
                    ref={image => this.imageElementRef = image}
                    style={this.props.style ?? {}}
                    className={`${this.props.className ?? ''} ${styles['stream-image-component']}`} />
        );
    }
}
