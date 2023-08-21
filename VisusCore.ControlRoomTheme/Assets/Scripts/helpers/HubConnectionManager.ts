import { HttpTransportType, HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { MessagePackHubProtocol } from "@microsoft/signalr-protocol-msgpack";

export class HubConnectionManager {
    private hubConnection?: HubConnection;
    private pendingCreateHubConnection?: Promise<HubConnection>;

    constructor(private url: string) {

    }

    createHubConnection(): Promise<HubConnection> {
        this.pendingCreateHubConnection ??= new Promise<HubConnection>((resolve, reject) => {
            const resetPendingConnection = (next: () => void) => setTimeout(() => {
                next();
                this.pendingCreateHubConnection = null;
            });

            if (!this.hubConnection) {
                this.hubConnection = new HubConnectionBuilder()
                    .withUrl(this.url, HttpTransportType.WebSockets)
                    .configureLogging(LogLevel.Error)
                    .withHubProtocol(new MessagePackHubProtocol())
                    .withAutomaticReconnect()
                    .build();
            }

            if (this.hubConnection.state === HubConnectionState.Connected) {
                resetPendingConnection(() => resolve(this.hubConnection));

                return;
            }

            this.hubConnection.start()
                .then(() => resetPendingConnection(() => resolve(this.hubConnection)))
                .catch((error) => resetPendingConnection(() => reject(error)));
        });

        return this.pendingCreateHubConnection;
    }
}
