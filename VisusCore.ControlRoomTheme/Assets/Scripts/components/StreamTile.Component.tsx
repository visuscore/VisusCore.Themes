import React from "react";
import { StreamInfoModel } from "../models/playback/StreamInfo.Model";
import PlaybackStreamInfoService from "../services/PlaybackStreamInfo.Service";
import { resolve } from "inversify-react";
import { Button, Card, CardActions, CardContent, CardMedia, Typography } from "@mui/material";
import styles from "./StreamTile.Component.module.scss";
import PlaybackImageService from "../services/PlaybackImage.Service";
import { StreamDetailsModel } from "../models/StreamDetails.Model";
import Resources from "../constants/Resources";

export interface IStreamTileProps {
    streamId: string;
}

interface IStreamTileState {
    stream?: StreamInfoModel;
    streamDetails?: StreamDetailsModel;
    imageDataUrl?: string;
    pending: boolean;
}

export class StreamTile extends React.Component<IStreamTileProps, IStreamTileState> {
    @resolve(PlaybackStreamInfoService)
    private readonly playbackStreamInfoService: PlaybackStreamInfoService;
    @resolve(PlaybackImageService)
    private readonly playbackImageService: PlaybackImageService;
    private imageUpdateTimeoutHandler: number;
    private imageElementRef?: HTMLImageElement;

    constructor(props: IStreamTileProps) {
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

            const imageUpdateCallback = async () => {
                await this.updateImage();

                this.imageUpdateTimeoutHandler = setTimeout(imageUpdateCallback, 2000);
            };

            await imageUpdateCallback();
        } finally {
            this.setState({
                pending: false,
            });
        }
    }

    async componentWillUnmount() {
        if (this.imageUpdateTimeoutHandler) {
            clearTimeout(this.imageUpdateTimeoutHandler);
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

        try {
            if (this.state.streamDetails) {
                const imageData = await this.playbackImageService.getLatestImage(
                    this.props.streamId,
                    {
                        Scale: this.imageElementRef && this.state.streamDetails.Height
                            ? this.imageElementRef.clientHeight / this.state.streamDetails.Height
                            : 0.1,
                        Quality: 30,
                    });
                replaceImageDataUrl(imageData);
            }
        } catch {
            // TODO: Error logging.
            replaceImageDataUrl(null);
        }
    }

    render() {
        return (
            <React.Fragment>
                <Card className={styles["stream-tile-component"]}>
                    {(!this.state.pending && this.state.stream) && (
                        <React.Fragment>
                            <CardMedia component={'img'}
                                        src={ this.state.imageDataUrl ?? Resources.EmptyImage }
                                        sx={ { height: '25vh' } }
                                        ref={ image => this.imageElementRef = image }
                                        className={`${styles["card-media"]} ${this.state.imageDataUrl ? '' : styles["-noise"]}`} />
                            <CardContent>
                                <Typography gutterBottom variant="h6" component="div">
                                    {this.state.stream.Name}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button href={ `#/${this.props.streamId}/live` }>Live</Button>
                                <Button href={ `#/${this.props.streamId}/playback` }>Playback</Button>
                                <Button href={ `#/${this.props.streamId}/images` }>Images</Button>
                            </CardActions>
                        </React.Fragment>
                    )}
                </Card>
            </React.Fragment>
        );
    }
}
