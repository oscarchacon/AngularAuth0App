import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ProfileComponent } from './components/profile/profile.component';
import { AuthGuard } from './auth.guard';
import { CallbackComponent } from './shared/callback/callback.component';

const routes: Routes = [
  {path: '', component: HomeComponent},
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate : [ AuthGuard ]
  },
  {path: 'callback', component: CallbackComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
