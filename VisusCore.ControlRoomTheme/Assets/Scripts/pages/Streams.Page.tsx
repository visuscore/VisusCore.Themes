import React from "react";
import { StreamInfoModel } from "../models/playback/StreamInfo.Model";
import PlaybackStreamInfoService from "../services/PlaybackStreamInfo.Service";
import { resolve } from "inversify-react";
import Grid from "@mui/material/Unstable_Grid2";
import { StreamTile } from "../components/StreamTile.Component";

export interface IStreamsPageProps {
};

interface IStreamsPageState {
    streams: StreamInfoModel[];
};

export class StreamsPage extends React.Component<IStreamsPageProps, IStreamsPageState> {
    @resolve(PlaybackStreamInfoService)
    private readonly playbackStreamInfoService: PlaybackStreamInfoService;

    constructor(props: IStreamsPageProps) {
        super(props);
        this.state = {
            streams: [],
        };
    }

    async componentDidMount() {
        this.setState({
            streams: await this.playbackStreamInfoService.getStreams(),
        });
    }

    render() {
        return (
            <Grid container spacing={1}>
                {this.state.streams.filter(stream => stream.Enabled)
                    .map((stream, index) => (
                        <Grid xs={12} sm={6} md={6} lg={3} xl={3} key={index}>
                            <StreamTile streamId={stream.Id} />
                        </Grid>
                    ))}
            </Grid>
        );
    }
}
