import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type AppMode = 'idle' | 'scale' | 'scale-chord';

@Injectable({ providedIn: 'root' })
export class AppStateService {
  private appModeSubject = new BehaviorSubject<AppMode>('idle');
  appMode$: Observable<AppMode> = this.appModeSubject.asObservable();

  get appMode(): AppMode {
    return this.appModeSubject.value;
  }

  setMode(mode: AppMode): void {
    if (mode === this.appMode) return;
    this.appModeSubject.next(mode);
  }

  /** Switch directly between modes — preserves current fretboard state. */
  switchMode(mode: AppMode): void {
    this.setMode(mode);
  }
}
