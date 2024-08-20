
//scaffold angular routes

import { Route } from '@angular/router';
import { AppComponent } from './app.component';
import { HomePageComponent } from './home-page/home-page.component';

export const routes: Route[] = [
  {
    path: '',
    component: HomePageComponent,

  },
];
