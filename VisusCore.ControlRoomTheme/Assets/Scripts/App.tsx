import * as React from "react";
import ReactDOM from "react-dom";
import { HashRouter } from "react-router-dom";
import { Provider } from "inversify-react";
import AppRoutes from "./App.Routes";
import AppServices from "./App.Services";
import { StyledEngineProvider } from "@mui/material";

class App extends React.Component {
    render() {
        return (
            <React.StrictMode>
                <Provider container={AppServices}>
                    <StyledEngineProvider injectFirst>
                        <HashRouter>
                            {AppRoutes}
                        </HashRouter>
                    </StyledEngineProvider>
                </Provider>
            </React.StrictMode>
        );
    }
}

ReactDOM.render(<App />, document.getElementById("control-room-app"));
