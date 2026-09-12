/* FretboardStateService — immutable snapshot store for fretboard rendering state. */
import { Injectable, signal } from '@angular/core';
import { GuitarNote } from '../shared/model/guitarNote';
import { FretboardSnapshot, ScaleChordState } from '../shared/model/fretboard-snapshot';
import { MusicSelection } from '../shared/model/music-selection';

@Injectable({ providedIn: 'root' })
export class FretboardStateService {
  /** All possible positions on the fretboard — initialized once via initialize(). */
  private allPositions: readonly GuitarNote[] = [];

  /** Private signal — state can only be updated via setSnapshot() or clearFretboard(). */
  private readonly snapshotSignal = signal<FretboardSnapshot | null>(null);

  /** Public readonly view of the current snapshot. Consumers can read but not write. */
  readonly currentSnapshot = this.snapshotSignal.asReadonly();

  /**
   * Initialize the service with all possible fretboard positions.
   * Called once by GuitarNeckComponent on startup.
   */
  initialize(allNotes: readonly GuitarNote[]): void {
    this.allPositions = allNotes;
  }

  /**
   * Atomically replace the current snapshot.
   * This is the ONLY way to update the snapshot from outside the service.
   */
  setSnapshot(snapshot: FretboardSnapshot): void {
    this.snapshotSignal.set(snapshot);
  }

  /**
   * Create a snapshot with the given notes highlighted (visible + selected).
   * Optionally applies an interval map for interval annotations.
   * Does NOT set currentSnapshot — the caller (orchestration) does that via setSnapshot().
   */
  applyHighlightedNotes(
    notesToShow: readonly GuitarNote[],
    intervalMap?: Map<string, string>,
    currentSelection?: MusicSelection | null,
    scaleChordState?: ScaleChordState | null,
  ): FretboardSnapshot {
    return this.buildSnapshot(notesToShow, intervalMap, currentSelection, scaleChordState);
  }

  /** Create a snapshot with all notes hidden. */
  hideAllNotes(): FretboardSnapshot {
    return this.buildSnapshot([], undefined, null, null);
  }

  /** Create a snapshot with all notes visible (but not selected). */
  showAll(): FretboardSnapshot {
    const allNotes: GuitarNote[] = this.allPositions.map(pos => ({
      string: pos.string,
      fret: pos.fret,
      note: pos.note,
      visible: true,
      selected: false,
      interval: '',
    }));
    return {
      notes: allNotes,
      hasActiveResult: true,
      currentSelection: null,
      scaleChordState: null,
    };
  }

  /** Clear the fretboard — sets currentSnapshot to null. */
  clearFretboard(): void {
    this.snapshotSignal.set(null);
  }

  /**
   * Build an immutable FretboardSnapshot from the given parameters.
   * Private — called by the public API methods above.
   */
  private buildSnapshot(
    highlightedNotes: readonly GuitarNote[],
    intervalMap?: Map<string, string>,
    currentSelection?: MusicSelection | null,
    scaleChordState?: ScaleChordState | null,
  ): FretboardSnapshot {
    const highlightedSet = new Set(
      highlightedNotes.map(n => `${n.string}-${n.fret}`)
    );

    const notes: GuitarNote[] = this.allPositions.map(pos => {
      const key = `${pos.string}-${pos.fret}`;
      const isHighlighted = highlightedSet.has(key);
      return {
        string: pos.string,
        fret: pos.fret,
        note: pos.note,
        visible: isHighlighted,
        selected: isHighlighted,
        interval: intervalMap?.get(key) ?? '',
      };
    });

    return {
      notes,
      hasActiveResult: highlightedNotes.length > 0,
      currentSelection: currentSelection ?? null,
      scaleChordState: scaleChordState ?? null,
    };
  }
}