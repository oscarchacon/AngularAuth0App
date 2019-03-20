import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.sass']
})
export class NavbarComponent {

  constructor(private auth: AuthService) {
    auth.handleAuthentication();
  }

  Login() : void {
    this.auth.login();
  }

  Logout(): void {
    this.auth.logout();
  }

  IsAuthenticated() : boolean {
    return this.auth.isAuthenticated();
  }

}
