import { resolve } from "inversify-react";
import { StreamDetailsModel } from "../models/StreamDetails.Model";
import { StreamInfoModel } from "../models/playback/StreamInfo.Model";
import PlaybackStreamInfoService from "../services/PlaybackStreamInfo.Service";
import PlaybackImageService from "../services/PlaybackImage.Service";
import React from "react";
import styles from "./StreamVideo.Component.module.scss";
import { StreamImage } from "./StreamImage.Component";
import CSSMatrix from '@thednp/dommatrix';
import hlsJs from "hls.js";
import lodash from "lodash";
import { useGesture, useWheel } from "@use-gesture/react";
import { VideoStreamInfoMetaModel } from "../models/VideoStreamInfoMeta.Model";
import StorageStreamInfoService from "../services/StorageStreamInfo.Service";

interface IGestureHandlerProps {
    children: JSX.Element;
    className?: string;
    wheel?: (event: WheelEvent, offset: number, direction: number) => void;
    drag?: (
        event: MouseEvent | PointerEvent | TouchEvent | KeyboardEvent,
        offset: [number, number],
        direction: [number, number]) => void;
    pinch?: (
        event: WheelEvent | PointerEvent | TouchEvent,
        origin: [number, number],
        scale: number,
        angle: number) => void;
}

const GestureHandler: React.FC<IGestureHandlerProps> = (props) => {
    let containerRef = React.useRef();

    useGesture({
        onWheel: ({ event, offset: [, y], direction: [, dy] }) => {
            event.preventDefault();

            props.wheel?.(event, y, dy);
        },
        onDrag: ({ event, offset: [x, y], direction: [dx, dy] }) => {
            event.preventDefault();

            props.drag?.(event, [x, y], [dx, dy]);
        },
        onPinch: ({ event, origin: [ox, oy], first, movement: [ms], offset: [scale, angle], memo }) => {
            event.preventDefault();

            props.pinch?.(event, [ox, oy], scale, angle);
        }
    },
    {
        target: containerRef,
        wheel: { eventOptions: { passive: false } },
        drag: {
            eventOptions: { passive: false },
            filterTaps: true,
            tapsThreshold: 3,
        },
        pinch: { eventOptions: { passive: false } },
    });

    return (
        <div ref={containerRef} className={props.className ?? ''} style={{touchAction: 'none'}}>
            {props.children}
        </div>
    );
}

export interface IStreamVideoProps {
    streamId: string;
    timestampUtc?: number;
    className?: string;
    style?: React.CSSProperties;
    imageLoadingCallback?: (timestampUtc: number) => void;
    imageLoadedCallback?: (timestampUtc: number, loadingTime: number) => void;
    imageErrorCallback?: (error: any) => void;
    videoTimeupdateCallback?: (timestampUtc: number, startSegment: VideoStreamInfoMetaModel) => void;
};

interface IStreamVideoState {
    stream?: StreamInfoModel;
    streamDetails?: StreamDetailsModel;
    pending: boolean;
    playing: boolean;
    imageLoaded: boolean;
    transformation: {
        scale: number;
        translate: [number, number];
        wheel: {
            lastOffset: number;
        };
        drag: {
            lastOffset: [number, number];
        },
        pinch: {
            lastScale: number;
            lastOrigin: [number, number];
        }
        matrix: CSSMatrix;
    };
    requestedSegment?: VideoStreamInfoMetaModel;
}

export class StreamVideo extends React.Component<IStreamVideoProps, IStreamVideoState> {
    @resolve(PlaybackStreamInfoService)
    private readonly playbackStreamInfoService: PlaybackStreamInfoService;
    @resolve(PlaybackImageService)
    private readonly playbackImageService: PlaybackImageService;
    @resolve(StorageStreamInfoService)
    private readonly storageStreamInfoService: StorageStreamInfoService;
    private readonly hls = new hlsJs();
    private _videoElementRef?: HTMLVideoElement;
    private _videoPlaying = lodash.debounce(() => this.videoPlaying(), 500);
    private _loadMedia = lodash.debounce(() => this.loadMedia(), 500);

    private set videoElementRef(value: HTMLVideoElement | undefined) {
        if (value && !this._videoElementRef) {
            this._videoElementRef = value;
            this.updatePlayer();
        }
    }

    constructor(props: IStreamVideoProps) {
        super(props);
        this.state = {
            pending: false,
            playing: false,
            imageLoaded: false,
            transformation: {
                scale: 1,
                translate: [0, 0],
                wheel: {
                    lastOffset: 0,
                },
                drag: {
                    lastOffset: [0, 0],
                },
                pinch: {
                    lastScale: 1,
                    lastOrigin: [0, 0],
                },
                matrix: new CSSMatrix(),
            },
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
        } finally {
            this.setState({
                pending: false,
            });
        }
    }

    componentDidUpdate(prevProps: Readonly<IStreamVideoProps>, prevState: Readonly<IStreamVideoState>, snapshot?: any) {
        if (prevProps.timestampUtc !== this.props.timestampUtc) {
            this.setState({
                imageLoaded: false,
                playing: false,
            });
        }
    }

    private imageLoading(_timestampUtc: number) {
        return this.props.imageLoadingCallback?.(_timestampUtc);
    }

    private imageLoaded(_timestampUtc: number, loadingTime: number) {
        this.setState({imageLoaded: true});
        if (!this.state.playing) {
            this._loadMedia();
        }

        return this.props.imageLoadedCallback?.(_timestampUtc, loadingTime);
    }

    private imageError(_error: any) {
        return this.props.imageErrorCallback?.(_error);
    }

    private updatePlayer() {
        if (this._videoElementRef && this.props.timestampUtc) {
            this.hls.attachMedia(this._videoElementRef);
            this._loadMedia();
        } else {
            this.hls.detachMedia();
        }
    }

    private loadMedia() {
        if (this.state.imageLoaded) {
            this.setState({requestedSegment: null});
            this.storageStreamInfoService.getSegments(this.props.streamId, this.props.timestampUtc, null, 0, 1)
                .then(segments => {
                    if (segments && segments.length) {
                        this.setState({requestedSegment: segments[0]});
                        this.hls.loadSource(`/playback/hls/${this.props.streamId}/playback/playlist/${this.props.timestampUtc}`);
                    }
                });
        }
    }

    private videoPlaying() {
        this.setState({playing: true});
    }

    private videoTimeUpdate(event: React.SyntheticEvent<HTMLVideoElement, Event>) {
        if (this.state.playing && this.state.requestedSegment) {
            this.props.videoTimeupdateCallback?.(
                this.state.requestedSegment.TimestampUtc + event.currentTarget.currentTime * 1000000,
                this.state.requestedSegment);
        }
    }

    private consolidateTranslate(target: HTMLElement, scale: number, translate: [number, number]): [number, number] {
        const originalSize = [target.offsetWidth, target.offsetHeight];
        const scaledSize = [originalSize[0] * scale, originalSize[1] * scale];
        const consolidateDimension = (offset: number, originalDimension: number, scaledDimension: number) => {
            return offset > (scaledDimension - originalDimension) / 2
                ? (scaledDimension - originalDimension) / 2
                : offset < (originalDimension - scaledDimension) / 2
                    ? (originalDimension - scaledDimension) / 2
                    : offset;
        }

        return [
            consolidateDimension(translate[0], originalSize[0], scaledSize[0]),
            consolidateDimension(translate[1], originalSize[1], scaledSize[1]),
        ];
    }

    private pinchHandler(
        event: WheelEvent | PointerEvent | TouchEvent,
        origin: [number, number],
        scale: number,
        _angle: number) {
        const eventTarget = event.currentTarget as HTMLElement;
        if (!eventTarget) {
            return;
        }

        const containerSize = [eventTarget.offsetWidth, eventTarget.offsetHeight];
        const diff = this.state.transformation.pinch.lastScale - scale;
        const localScale = Math.max(Math.min(this.state.transformation.scale - diff * 0.1, 3), 1);
        const translate: [number, number] = this.consolidateTranslate(
            eventTarget,
            localScale,
            [
                this.state.transformation.translate[0]
                    + (containerSize[0] / 2 - origin[0]) * (localScale - this.state.transformation.scale),
                this.state.transformation.translate[1]
                    + (containerSize[1] / 2 - origin[1]) * (localScale - this.state.transformation.scale),
            ]);

        this.setState({
            transformation: {
                ...this.state.transformation,
                scale: localScale,
                translate,
                pinch: {
                    lastScale: scale,
                    lastOrigin: origin,
                },
            }
        })

        this.updateTransformation();
    }

    private wheelHandler(event: WheelEvent, offset: number, _direction: number) {
        const eventTarget = event.currentTarget as HTMLElement;
        if (!eventTarget) {
            return;
        }

        const containerSize = [eventTarget.offsetWidth, eventTarget.offsetHeight];
        const diff = offset - this.state.transformation.wheel.lastOffset;
        const scale = Math.max(Math.min(this.state.transformation.scale - diff * 0.001, 3), 1);
        const translate: [number, number] = this.consolidateTranslate(
            eventTarget,
            scale,
            [
                this.state.transformation.translate[0]
                    + (containerSize[0] / 2 - event.offsetX) * (scale - this.state.transformation.scale),
                this.state.transformation.translate[1]
                    + (containerSize[1] / 2 - event.offsetY) * (scale - this.state.transformation.scale),
            ]);

        this.setState({
            transformation: {
                ...this.state.transformation,
                scale,
                translate,
                wheel: {
                    lastOffset: offset,
                },
            }
        })

        this.updateTransformation();
    }

    private dragHandler(
        event: MouseEvent |PointerEvent | TouchEvent |KeyboardEvent,
        offset: [number, number],
        _direction: [number, number]) {
        const eventTarget = event.currentTarget as HTMLElement;
        const diff = [
            offset[0] - this.state.transformation.drag.lastOffset[0],
            offset[1] - this.state.transformation.drag.lastOffset[1]];
        this.setState({
            transformation: {
                ...this.state.transformation,
                translate: this.consolidateTranslate(
                    eventTarget,
                    this.state.transformation.scale,
                    [
                        this.state.transformation.translate[0] + diff[0],
                        this.state.transformation.translate[1] + diff[1]
                    ]),
                drag: {
                    lastOffset: offset,
                }
            }
        });

        this.updateTransformation();
    }

    private updateTransformation() {
        let matrix = new CSSMatrix().translate(...this.state.transformation.translate);
        matrix = matrix.scale(this.state.transformation.scale);

        this.setState({
            transformation: {
                ...this.state.transformation,
                matrix,
            },
        });
    }

    render() {
        return (
            <div className={`${styles["stream-video-component"]} ${this.props.className ?? ''}`}
                    style={this.props.style ?? {}}>
                <GestureHandler className={styles["video-container"]}
                                wheel={(event, offset, direction) => this.wheelHandler(event, offset, direction)}
                                drag={(event, offset, direction) => this.dragHandler(event, offset, direction)}
                                pinch={(event, origin, scale, angle) => this.pinchHandler(event, origin, scale, angle)}>
                    <React.Fragment>
                        <StreamImage streamId={this.props.streamId}
                                        className={styles["preview-image"]}
                                        style={{
                                            transform: this.state.transformation.matrix.toString(),
                                        }}
                                        scale={this.state.transformation.scale}
                                        timestampUtc={this.props.timestampUtc}
                                        loadingCallback={timestampUtc => this.imageLoading(timestampUtc)}
                                        loadedCallback={(timestampUtc, loadingTime) => this.imageLoaded(timestampUtc, loadingTime)}
                                        errorCallback={error => this.imageError(error)} />
                        <div className={styles["video-player-container"]}
                                style={{
                                    visibility: this.state.playing
                                        ? "visible"
                                        : "hidden",
                                    transform: this.state.transformation.matrix.toString(),
                                }}>
                            <video ref={video => this.videoElementRef = video}
                                    className={styles["video-player"]}
                                    disablePictureInPicture
                                    autoPlay
                                    autoFocus
                                    onTimeUpdate={event => this.videoTimeUpdate(event)}
                                    onPlaying={() => this._videoPlaying()} />
                        </div>
                    </React.Fragment>
                </GestureHandler>
            </div>
        );
    }
}
