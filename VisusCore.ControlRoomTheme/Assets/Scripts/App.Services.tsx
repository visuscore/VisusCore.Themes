import { Container } from "./lib/inversify-fix";
import AuthenticationService from "./services/Authentication.Service";
import PlaybackImageService from "./services/PlaybackImage.Service";
import PlaybackStreamInfoService from "./services/PlaybackStreamInfo.Service";
import StorageStreamInfoService from "./services/StorageStreamInfo.Service";

const container = new Container();

container.bind<PlaybackStreamInfoService>(PlaybackStreamInfoService).toSelf().inSingletonScope();
container.bind<PlaybackImageService>(PlaybackImageService).toSelf().inSingletonScope();
container.bind<StorageStreamInfoService>(StorageStreamInfoService).toSelf().inSingletonScope();
container.bind<AuthenticationService>(AuthenticationService).toSelf().inSingletonScope();

export default container;
