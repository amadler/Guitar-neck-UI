import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { DomainService } from './app/domain/domain.service';

bootstrapApplication(AppComponent, appConfig)
  .then(appRef => {
    const ds = appRef.injector.get(DomainService);
    (window as any).__ds = ds;
  })
  .catch((err) => console.error(err));
