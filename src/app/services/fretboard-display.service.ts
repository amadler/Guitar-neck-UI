import { Injectable } from '@angular/core';
import { FretboardStateService } from './guitar-neck.service';
import { MarkerRoleService, MarkerRole } from './marker-role.service';

/**
 * CSS class suffix for each marker role.
 * Used as `guitar-neck__role-${suffix}`.
 */
const ROLE_CSS: Record<MarkerRole, string> = {
  'scale-tone':               '',
  'chord-tone':               'chord-tone',
  'scale-root':               'scale-root',
  'chord-root':               'chord-root',
  'chord-tone-outside-scale': 'chord-tone-outside',
};

@Injectable({ providedIn: 'root' })
export class FretboardDisplayService {
  constructor(
    private guitarNeckService: FretboardStateService,
    private markerRoleService: MarkerRoleService,
  ) {}

  getMarkerCssClass(interval: string | undefined): string {
    // When a chord relation is active, use role-based coloring instead of interval colors
    if (this.guitarNeckService.scaleChordState?.chord) {
      return '';
    }

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

  // ---- Marker role support ----

  /** Returns the role CSS class for a note at a given position, or empty string. */
  getRoleCssClass(stringIndex: number, fret: number): string {
    if (!this.guitarNeckService.scaleChordState) {
      return '';
    }
    const key = `${stringIndex}-${fret}`;
    const role: MarkerRole | undefined = this.markerRoleService.lastRoles?.get(key);
    if (!role) {
      return '';
    }
    const suffix = ROLE_CSS[role];
    return suffix ? `guitar-neck__role-${suffix}` : '';
  }

  /** Returns true if there is an active scale+chord relation. */
  get hasRelation(): boolean {
    return this.guitarNeckService.scaleChordState !== null;
  }
}
