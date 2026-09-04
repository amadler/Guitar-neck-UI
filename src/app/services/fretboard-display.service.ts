import { Injectable, inject } from '@angular/core';
import { DomainService } from '../domain/domain.service';
import { FretboardStateService } from './fretboard-state.service';
import { MarkerRoleService, MarkerRole } from './marker-role.service';

/**
 * CSS class suffix for each marker role.
 * Used as `fretboard__dot--role-${suffix}`.
 */
const ROLE_CSS: Record<MarkerRole, string> = {
  'scale-tone': 'scale-tone',
  'chord-tone': 'chord-tone',
  'scale-root': 'scale-root',
  'chord-root': 'chord-root',
  'chord-tone-outside-scale': 'chord-tone-outside',
};

@Injectable({ providedIn: 'root' })
export class FretboardDisplayService {
  private domainService = inject(DomainService);
  private guitarNeckService = inject(FretboardStateService);
  private markerRoleService = inject(MarkerRoleService);


  getMarkerCssClass(interval: string | undefined): string {
    // When a chord relation is active, use role-based coloring instead of interval colors
    if (this.guitarNeckService.scaleChordState?.chord) {
      return '';
    }

    const mode = this.domainService.currentState.markerDisplayMode;
    if (mode === 'interval-colors' && interval) {
      return 'fretboard__dot--' + interval;
    }
    if (mode === 'note-names') {
      return 'fretboard__dot--neutral';
    }
    return 'fretboard__dot--neutral-dot';
  }

  get showNoteLabels(): boolean {
    return this.domainService.currentState.markerDisplayMode !== 'neutral-dots';
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
    return suffix ? `fretboard__dot--role-${suffix}` : '';
  }

  /** Returns true if there is an active scale+chord relation. */
  get hasRelation(): boolean {
    return this.guitarNeckService.scaleChordState !== null;
  }
}
