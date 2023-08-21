import React, { PropsWithChildren, useContext } from "react";
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { StreamsPage } from "./pages/Streams.Page";
import { StreamLivePage } from "./pages/StreamLive.Page";
import { StreamPlaybackPage } from "./pages/StreamPlayback.Page";
import { StreamImagesPage } from "./pages/StreamImages.Page";
import { LoginPage } from "./pages/Login.Page";
import AuthenticationService from "./services/Authentication.Service";
import { resolve } from "inversify-react";
import _ from "lodash";

class ProtectedRoute extends React.Component<PropsWithChildren<{loginRoute?: string}>, {}> {
    @resolve(AuthenticationService)
    private readonly _authenticationService: AuthenticationService;

    render() {
        if(!this._authenticationService.isAuthenticated) {
            return <Navigate to={this.props.loginRoute ?? '/login'} replace />
        }

        return this.props.children;
    }
}

export default (
    <Routes>
        <Route path="/"
                Component={() => {
                    return (
                        <ProtectedRoute>
                            <StreamsPage />
                        </ProtectedRoute>
                    );
                }} />
        <Route path="/:streamId/live"
                Component={() => {
                    return (
                        <ProtectedRoute>
                            <StreamLivePage streamId={useParams().streamId} />
                        </ProtectedRoute>
                    );
                }} />
        <Route path="/:streamId/playback"
                Component={() => {
                    return (
                        <ProtectedRoute>
                            <StreamPlaybackPage streamId={useParams().streamId} />
                        </ProtectedRoute>
                    );
                }} />
        <Route path="/:streamId/images"
                Component={() => {
                    return (
                        <ProtectedRoute>
                            <StreamImagesPage streamId={useParams().streamId} />
                        </ProtectedRoute>
                    );
                }} />
        <Route path="/login" Component={() => {
            return (<LoginPage navigate={useNavigate()} />);
        }} />
    </Routes>
);
