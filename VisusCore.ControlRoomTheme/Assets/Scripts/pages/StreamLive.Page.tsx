import { Box, Grid, Stack, Typography } from "@mui/material";
import React from "react";
import { StreamInfoModel } from "../models/playback/StreamInfo.Model";
import PlaybackStreamInfoService from "../services/PlaybackStreamInfo.Service";
import { resolve } from "inversify-react";
import hlsJs from "hls.js";

export interface IStreamLivePageProps {
    streamId: string;
};

interface IStreamLivePageState {
    stream?: StreamInfoModel;
}

export class StreamLivePage extends React.Component<IStreamLivePageProps, IStreamLivePageState> {
    @resolve(PlaybackStreamInfoService)
    private readonly playbackStreamInfoService: PlaybackStreamInfoService;
    private readonly hls = new hlsJs();
    private _videoElementRef?: HTMLVideoElement;

    private set videoElementRef(value: HTMLVideoElement | undefined) {
        if (this._videoElementRef !== value) {
            this._videoElementRef = value;
        }
    }

    constructor(props: IStreamLivePageProps) {
        super(props);
        this.state = {
        };
    }

    async componentDidMount() {
        try{
            const stream = await this.playbackStreamInfoService.getStream(this.props.streamId);

            this.setState({
                stream,
            });

            this.updatePlayer();
        } catch {
            // TODO: Error handling.
        }
    }

    private updatePlayer() {
        if (this._videoElementRef) {
            this.hls.attachMedia(this._videoElementRef);
            this.hls.loadSource(`/playback/hls/${this.props.streamId}/live/playlist`);
        } else {
            this.hls.detachMedia();
        }
    }

    render() {
        return (
            <Stack alignItems="center">
                <Typography gutterBottom variant="h6" component="div">
                    { this.state.stream?.Name ?? 'Unknown stream' }
                </Typography>
                <Grid container
                                direction="row"
                                justifyContent="center"
                                alignItems="stretch"
                                sx={{width: 0.7, height: '50vh'}}>
                    <video style={{width: '70%', height: '50vh'}}
                            ref={video => this.videoElementRef = video}
                            disablePictureInPicture
                            controls
                            autoPlay
                            autoFocus />
                </Grid>
            </Stack>
        );
    }
}
