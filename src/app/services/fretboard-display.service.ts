import { Injectable } from '@angular/core';
import { FretboardStateService } from './guitar-neck.service';

@Injectable({ providedIn: 'root' })
export class FretboardDisplayService {
  constructor(private guitarNeckService: FretboardStateService) {}

  getMarkerCssClass(interval: string | undefined): string {
    const mode = this.guitarNeckService.markerDisplayMode;
    if (mode === 'interval-colors' && interval) {
      return 'guitar-neck__' + interval;
    }
    if (mode === 'note-names') {
      return 'guitar-neck__neutral';
    }
    return 'guitar-neck__neutral-dot';
  }

  get showNoteLabels(): boolean {
    return this.guitarNeckService.markerDisplayMode !== 'neutral-dots';
  }

  getActiveIntervals(): string[] {
    const intervalSet = new Set<string>();
    if (!this.guitarNeckService.hasActiveResult) {
      return [];
    }
    this.guitarNeckService.notes.forEach(note => {
      if (note.selected && note.interval) {
        intervalSet.add(note.interval);
      }
    });
    return Array.from(intervalSet);
  }
}
