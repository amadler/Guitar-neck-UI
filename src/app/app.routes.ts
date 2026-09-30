import { Route } from '@angular/router';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { AppPageComponent } from './app-page/app-page.component';

export const routes: Route[] = [
  {
    path: '',
    component: LandingPageComponent,
  },
  {
    path: 'app',
    component: AppPageComponent,
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent),
  },
];