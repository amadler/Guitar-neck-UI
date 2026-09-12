import { Injectable, inject } from '@angular/core';
import { DomainService } from '../domain/domain.service';
import { FretboardStateService } from './fretboard-state.service';
import { MarkerRoleService, MarkerRole } from './marker-role.service';
import { INTERVAL_CONFIG } from '../shared/tonal-adapter';

/**
 * CSS class suffix for each marker role.
 * Used as `fretboard__dot--role-${suffix}`.
 */
// TODO: tylko jedna różnica. Po co e ROLE_CSS
const ROLE_CSS: Record<MarkerRole, string> = {
  'scale-tone': 'scale-tone',
  'chord-tone': 'chord-tone',
  'scale-root': 'scale-root',
  'chord-root': 'chord-root',
  'chord-tone-outside-scale': 'chord-tone-outside',
};

/**
 * Reverse map: CSS class name (e.g. 'perfect-5th') → short symbol (e.g. '5').
 * Built from INTERVAL_CONFIG which is the single source of truth.
 * Used to match emphasis intervals (short notation like '5', '3') against
 * GuitarNote.interval values (long notation like 'perfect-5th', 'major-3rd').
 */
const CSS_CLASS_TO_SYMBOL: Record<string, string> = Object.fromEntries(
  INTERVAL_CONFIG.map(i => [i.cssClass, i.symbol])
);

@Injectable({ providedIn: 'root' })
export class FretboardDisplayService {
  private domainService = inject(DomainService);
  private guitarNeckService = inject(FretboardStateService);
  private markerRoleService = inject(MarkerRoleService);


  /** Returns true if the given interval should be visually emphasized based on current emphasis spec. */
  private isEmphasized(interval: string): boolean {
    const emphasis = this.domainService.currentState().emphasis;
    if (!emphasis || !emphasis.intervals || emphasis.intervals.length === 0) {
      return true; // no emphasis = show everything
    }
    // GuitarNote.interval stores CSS class names (e.g. 'perfect-5th', 'root').
    // Emphasis uses short notation (e.g. '5', '1').
    // Map CSS class → short symbol for matching.
    const normalizedInterval = interval === 'root' ? '1' : (CSS_CLASS_TO_SYMBOL[interval] ?? interval);
    return emphasis.intervals.includes(normalizedInterval);
  }

  getMarkerCssClass(interval: string | undefined): string {
    const snapshot = this.guitarNeckService.currentSnapshot();

    // When a chord relation is active, use role-based coloring instead of interval colors
    if (snapshot?.scaleChordState?.chord) {
      return '';
    }

    const mode = this.domainService.currentState().markerDisplayMode;
    if (mode === 'interval-colors' && interval) {
      // Check emphasis — if emphasis is active and this interval is NOT emphasized, dim it
      if (!this.isEmphasized(interval)) {
        return 'fretboard__dot--dimmed';
      }
      return 'fretboard__dot--' + interval;
    }
    if (mode === 'note-names') {
      // Even in note-names mode, dim non-emphasized notes
      if (interval && !this.isEmphasized(interval)) {
        return 'fretboard__dot--dimmed';
      }
      return 'fretboard__dot--neutral';
    }
    return 'fretboard__dot--neutral-dot';
  }

  get showNoteLabels(): boolean {
    return this.domainService.currentState().markerDisplayMode !== 'neutral-dots';
  }

  getActiveIntervals(): string[] {
    const snapshot = this.guitarNeckService.currentSnapshot();
    if (!snapshot || !snapshot.hasActiveResult) {
      return [];
    }
    const intervalSet = new Set<string>();
    snapshot.notes.forEach(note => {
      if (note.selected && note.interval) {
        intervalSet.add(note.interval);
      }
    });
    return Array.from(intervalSet);
  }

  // ---- Marker role support ----

  /** Returns the role CSS class for a note at a given position, or empty string. */
  getRoleCssClass(stringIndex: number, fret: number): string {
    const snapshot = this.guitarNeckService.currentSnapshot();
    if (!snapshot?.scaleChordState) {
      return '';
    }
    const key = `${stringIndex}-${fret}`;
    const role: MarkerRole | undefined = this.markerRoleService.lastRoles()?.get(key);
    if (!role) {
      return '';
    }
    const suffix = ROLE_CSS[role];
    return suffix ? `fretboard__dot--role-${suffix}` : '';
  }

  /** Returns true if there is an active scale+chord relation. */
  get hasRelation(): boolean {
    return this.guitarNeckService.currentSnapshot()?.scaleChordState !== null;
  }
}