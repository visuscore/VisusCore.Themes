import React from "react";
import StorageStreamInfoService from "../services/StorageStreamInfo.Service";
import PlaybackStreamInfoService from "../services/PlaybackStreamInfo.Service";
import { resolve } from "inversify-react";
import { VideoStreamInfoMetaModel } from "../models/VideoStreamInfoMeta.Model";
import { StreamInfoModel } from "../models/playback/StreamInfo.Model";
import { Box, Slider, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { StreamVideo } from "../components/StreamVideo.Component";
import moment from "moment";

export interface IStreamPlaybackPageProps {
    streamId: string;
};

interface IStreamPlaybackPageState {
    stream?: StreamInfoModel;
    firstSegment?: VideoStreamInfoMetaModel;
    timestampUtc?: number;
    imageLoading: boolean;
    lastLoadingTime?: number;
    currentTimestampUtc?: number;
}

export class StreamPlaybackPage extends React.Component<IStreamPlaybackPageProps, IStreamPlaybackPageState> {
    @resolve(PlaybackStreamInfoService)
    private readonly playbackStreamInfoService: PlaybackStreamInfoService;
    @resolve(StorageStreamInfoService)
    private readonly storageStreamInfoService: StorageStreamInfoService;

    constructor(props: IStreamPlaybackPageProps) {
        super(props);
        this.state = {
            imageLoading: false,
        };
    }

    async componentDidMount() {
        try{
            const stream = await this.playbackStreamInfoService.getStream(this.props.streamId);
            const segments = await this.storageStreamInfoService.getSegments(this.props.streamId, 0, null, 0, 1);
            const firstSegment = segments && segments.length ? segments[0] : null;
            this.setState({
                stream,
                firstSegment: firstSegment,
                timestampUtc: firstSegment?.TimestampUtc
            });
        } catch {
            // TODO: Error handling.
        }
    }

    private sliderChanged(_event: any, value: number | number[]) {
        var sliderValue = value as number;
        if (!this.state.imageLoading && this.state.currentTimestampUtc !== sliderValue) {
            this.setState({
                timestampUtc: sliderValue,
                imageLoading: true,
            });
        }
    }

    private imageLoading(_timestampUtc: number) {
    }

    private imageLoaded(timestampUtc: number, loadingTime: number) {
        this.setState({
            imageLoading: false,
            lastLoadingTime: loadingTime,
            currentTimestampUtc: timestampUtc,
        });
    }

    private imageError(_error: any) {
        this.setState({
            imageLoading: false,
        });
    }

    private videoTimeupdate(timestampUtc: number, startSegment: VideoStreamInfoMetaModel)
    {
        this.setState({
            currentTimestampUtc: timestampUtc,
        })
    }

    render() {
        return (
            <Grid container alignContent={'center'} justifyContent={'center'}>
                <Grid xs={12} sm={12} md={10} lg={8} xl={8}>
                    <Stack alignItems="center">
                        <Typography gutterBottom variant="h6" component="div">
                            { this.state.stream?.Name ?? 'Unknown stream' }
                        </Typography>
                        { this.state.firstSegment && (
                            <React.Fragment>
                                <Box sx={{width: 1, height: '50vh'}}>
                                    <StreamVideo streamId={this.props.streamId}
                                                    timestampUtc={this.state.timestampUtc}
                                                    imageErrorCallback={error => this.imageError(error)}
                                                    imageLoadedCallback={(timestampUtc, loadingTime) => this.imageLoaded(timestampUtc, loadingTime)}
                                                    imageLoadingCallback={timestampUtc => this.imageLoading(timestampUtc)}
                                                    videoTimeupdateCallback={(timestampUtc, startSegment) => this.videoTimeupdate(timestampUtc, startSegment)} />
                                </Box>
                                <Box sx={{width: 1}}>
                                    <Slider min={this.state.firstSegment.TimestampUtc}
                                            max={Date.now() * 1000}
                                            value={this.state.currentTimestampUtc ?? this.state.firstSegment.TimestampUtc}
                                            step={1000000}
                                            valueLabelDisplay="auto"
                                            valueLabelFormat={(value) => moment(value / 1000).format('YYYY-MM-DD HH:mm:ss')}
                                            onChange={ (event, value) => this.sliderChanged(event, value) } />
                                </Box>
                            </React.Fragment>
                        )}
                        { typeof(this.state.lastLoadingTime) === 'number' && (
                            <Typography gutterBottom variant="body2" component="div">
                                Last image loaded in {this.state.lastLoadingTime.toFixed(0)} ms
                            </Typography>
                        )}
                    </Stack>
                </Grid>
            </Grid>
        );
    }
}
