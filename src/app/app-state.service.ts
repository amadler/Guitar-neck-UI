import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type AppMode = 'custom-pattern' | 'scale-or-chord' | 'scale-chord';;

@Injectable({ providedIn: 'root' })
export class AppStateService {
  private appModeSubject = new BehaviorSubject<AppMode>('scale-or-chord');
  appMode$: Observable<AppMode> = this.appModeSubject.asObservable();

  get appMode(): AppMode {
    return this.appModeSubject.value;
  }

  setMode(mode: AppMode): void {
    if (mode === this.appMode) return;
    this.appModeSubject.next(mode);
    console.log(mode);
  }

}
