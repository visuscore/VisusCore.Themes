import { injectable } from '../lib/inversify-fix';
import { User, UserManager } from 'oidc-client-ts';
import environment from '../environments/environment';
import { UserModel } from '../models/User.Model';
import { BehaviorSubject } from 'rxjs';

@injectable()
export default class AuthenticationService {
    private _userManager: UserManager;
    private _currentUser?: UserModel;
    private _currentToken?: string;
    private _isAuthenticated = false;
    private _isAuthenticatedStateChange = new BehaviorSubject<boolean>(false);

    get currentUser(): UserModel | undefined {
        return this._currentUser;
    }

    private set currentUser(user: UserModel | undefined) {
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
        } else {
            localStorage.removeItem('currentUser');
        }

        this._currentUser = user;
    }

    get currentToken(): string | undefined {
        return this._currentToken;
    }

    private set currentToken(token: string | undefined) {
        if (token) {
            localStorage.setItem('currentToken', token);
        } else {
            localStorage.removeItem('currentToken');
        }

        this._currentToken = token;
    }

    get isAuthenticated(): boolean {
        return this._isAuthenticated;
    }

    private set isAuthenticated(isAuthenticated: boolean) {
        localStorage.setItem('isAuthenticated', JSON.stringify(isAuthenticated));
        this._isAuthenticated = isAuthenticated;
        this._isAuthenticatedStateChange.next(isAuthenticated);
    }

    get isAuthenticatedStateChange() {
        return this._isAuthenticatedStateChange.asObservable();
    }

    constructor() {
        this._userManager = new UserManager({
            authority: '',
            client_id: environment.openIdClientId,
            scope: environment.openIdScopes,
            redirect_uri: '',
            loadUserInfo: true,
            metadata: {
                authorization_endpoint: environment.openIdAuthorizationEndpoint,
                token_endpoint: environment.openIdTokenEndpoint,
                userinfo_endpoint: environment.openIdUserInfoEndpoint,
                revocation_endpoint: environment.openIdRevocationEndpoint,
            },
        });

        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            this.currentUser = JSON.parse(storedUser);
        }

        const storedToken = localStorage.getItem('currentToken');
        if (storedToken) {
            this.currentToken = storedToken;
        }

        const storedIsAuthenticated = localStorage.getItem('isAuthenticated');
        if (storedIsAuthenticated) {
            this.isAuthenticated = JSON.parse(storedIsAuthenticated);
        }
    }

    async login(username: string, password: string) : Promise<UserModel> {
        const user = await this._userManager.signinResourceOwnerCredentials({username, password});
        this.currentUser = {
            name: user.profile.name,
            email: user.profile.email,
        };
        this.currentToken = user.access_token;
        this.isAuthenticated = true;

        return this.currentUser;
    }
}
