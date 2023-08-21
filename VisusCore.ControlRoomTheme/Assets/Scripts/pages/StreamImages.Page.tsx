import { resolve } from "inversify-react";
import React from "react";
import StorageStreamInfoService from "../services/StorageStreamInfo.Service";
import { Box, Slider, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { VideoStreamInfoMetaModel } from "../models/VideoStreamInfoMeta.Model";
import { StreamInfoModel } from "../models/playback/StreamInfo.Model";
import PlaybackStreamInfoService from "../services/PlaybackStreamInfo.Service";
import { StreamImage } from "../components/StreamImage.Component";
import moment from "moment";

export interface IStreamImagesPageProps {
    streamId: string;
};

interface IStreamImagesPageState {
    stream?: StreamInfoModel;
    firstSegment?: VideoStreamInfoMetaModel;
    timestampUtc?: number;
    imageLoading: boolean;
    lastLoadingTime?: number;
}

export class StreamImagesPage extends React.Component<IStreamImagesPageProps, IStreamImagesPageState> {
    @resolve(PlaybackStreamInfoService)
    private readonly playbackStreamInfoService: PlaybackStreamInfoService;
    @resolve(StorageStreamInfoService)
    private readonly storageStreamInfoService: StorageStreamInfoService;

    constructor(props: IStreamImagesPageProps) {
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
        const sliderValue = value as number;
        if (!this.state.imageLoading && this.state.timestampUtc !== sliderValue) {
            this.setState({
                timestampUtc: sliderValue,
                imageLoading: true,
            });
        }
    }

    private imageLoading(_timestampUtc: number) {
    }

    private imageLoaded(_timestampUtc: number, loadingTime: number) {
        this.setState({
            imageLoading: false,
            lastLoadingTime: loadingTime,
        });
    }

    private imageError(_error: any) {
        this.setState({
            imageLoading: false,
        });
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
                                    <StreamImage streamId={this.props.streamId}
                                                    timestampUtc={this.state.timestampUtc}
                                                    style={{ objectFit: 'contain' }}
                                                    loadingCallback={(timestampUtc) => this.imageLoading(timestampUtc)}
                                                    loadedCallback={(timestampUtc, loadingTime) => this.imageLoaded(timestampUtc, loadingTime)}
                                                    errorCallback={(error) => this.imageError(error)} />
                                </Box>
                                <Box sx={{ p: 1, width: 0.7 }}>
                                    <Slider min={this.state.firstSegment.TimestampUtc}
                                            max={Date.now() * 1000}
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
