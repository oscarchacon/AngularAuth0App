import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import * as auth0 from 'auth0-js';
import { AUTH_VAR } from './auth-variables';
import { Observer, Observable, timer, of } from 'rxjs';
import { flatMap } from 'rxjs/operators';

@Injectable()
export class AuthService {

  private _idToken: string;
  private _accessToken: string;
  private _expiresAt: number;

  auth0 = new auth0.WebAuth({
    clientID: AUTH_VAR.auth.clientID,
    domain: AUTH_VAR.auth.domain,
    responseType: 'token id_token',
    audience: AUTH_VAR.auth.apiURL,
    redirectUri: AUTH_VAR.auth.redirectUri,
    scope: AUTH_VAR.auth.scope
  });

  userProfile: any;
  refreshSubscription: any;
  observer: Observer<boolean>;
  ssoAuthComplete$: Observable<boolean> = new Observable(
    obs => (this.observer = obs)
  );

  constructor(public router: Router) {
    /*this._idToken = '';
    this._accessToken = '';
    this._expiresAt = 0;*/
  }

  get accessToken(): string {
    return this._accessToken;
  }

  get idToken(): string {
    return this._idToken;
  }

  public login(): void {
    this.auth0.authorize();
  }

  public handleAuthentication(): void {
    this.auth0.parseHash((err, authResult) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        //window.location.hash = '';
        this.localLogin(authResult);
        //this.router.navigate(['/home']);
        this.router.navigate(['/']);
      } else if (err) {
        //this.router.navigate(['/home']);
        this.router.navigate(['/']);
        console.log(err);
      }
    });
  }


  private localLogin(authResult): void {
    // Set isLoggedIn flag in localStorage
    localStorage.setItem('isLoggedIn', 'true');
    // Set the time that the access token will expire at
    const expiresAt = (authResult.expiresIn * 1000) + new Date().getTime();
    this._accessToken = authResult.accessToken;
    localStorage.setItem('access_token', this._accessToken);
    this._idToken = authResult.idToken;
    localStorage.setItem('id_token', this._idToken);
    this._expiresAt = expiresAt;
    localStorage.setItem('expires_at', JSON.stringify(this._expiresAt));
  }

  /*public renewTokens(): void {
    this.auth0.checkSession({}, (err, authResult) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        this.localLogin(authResult);
      } else if (err) {
        alert(`Could not get a new token (${err.error}: ${err.error_description}).`);
        this.logout();
      }
    });
  }*/

  public renewToken() {
    this.auth0.checkSession({},
      (err, result) => {
        if (err) {
          alert(
            `Could not get a new token (${err.error}: ${err.error_description}).`
          );
          this.login();
        } else {
          this.localLogin(result);
          this.observer.next(true);
        }
      }
    );
  }

  public logout(): void {
    // Remove tokens and expiry time
    this._accessToken = '';
    this._idToken = '';
    this._expiresAt = 0;
    // Remove isLoggedIn flag from localStorage
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('expires_at');
    localStorage.clear();
    this.auth0.logout({
      returnTo: AUTH_VAR.auth.logoutUrl,
      clientID:  AUTH_VAR.auth.clientID
    });
    // Go back to the home route
    this.router.navigate(['/']);
  }

  public isAuthenticated(): boolean {
    // Check whether the current time is past the
    // access token's expiry time
    return new Date().getTime() < this._expiresAt;
  }

  public getProfile(cb): void {
    this._accessToken = localStorage.getItem('access_token');
    if (!this._accessToken) {
      throw new Error('Access Token must exist to fetch profile');
    }

    const self = this;
    this.auth0.client.userInfo(this._accessToken, (err, profile) => {
      if (profile) {
        self.userProfile = profile;
      }
      cb(err, profile);
    });
  }

  public scheduleRenewal() {
    if (!this.isAuthenticated()) { return; }
    this.unscheduleRenewal();

    const expiresAt = JSON.parse(window.localStorage.getItem('expires_at'));

    const source = of(expiresAt).pipe(
      flatMap(expiresAt => {
        const now = Date.now();

        // Use the delay in a timer to
        // run the refresh at the proper time
        return timer(Math.max(1, expiresAt - now));
      })
    );

    // Once the delay time from above is
    // reached, get a new JWT and schedule
    // additional refreshes
    this.refreshSubscription = source.subscribe(() => {
      this.renewToken();
      this.scheduleRenewal();
    });
  }

  public unscheduleRenewal() {
    if (!this.refreshSubscription) { return; }
    this.refreshSubscription.unsubscribe();
  }

}
