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
];