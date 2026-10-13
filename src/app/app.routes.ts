import { Route } from '@angular/router';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { AppPageComponent } from './app-page/app-page.component';
import { authGuard } from './auth/auth.guard';

export const routes: Route[] = [
  {
    path: '',
    component: LandingPageComponent,
  },
  {
    path: 'app',
    component: AppPageComponent,
    canActivate: [authGuard],
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
    path: 'forgot-password',
    loadComponent: () => import('./auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
  },
  {
    path: 'change-password',
    loadComponent: () => import('./auth/change-password/change-password.component').then(m => m.ChangePasswordComponent),
    canActivate: [authGuard],
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [authGuard],
  },
];