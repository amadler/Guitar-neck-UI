import { MusicSelection } from './music-selection';
import { GuitarNote } from './guitarNote';
import { ScaleChordState } from '../../services/fretboard-state.service';

/**
 * Immutable snapshot of the complete fretboard rendering state at a point in time.
 * Replaces the mutable GuitarNote[] + separate signals pattern.
 *
 * notes is readonly GuitarNote[] — the array itself is immutable,
 * and each GuitarNote has readonly fields.
 */
export interface FretboardSnapshot {
  readonly notes: readonly GuitarNote[];
  readonly hasActiveResult: boolean;
  readonly currentSelection: MusicSelection | null;
  readonly scaleChordState: ScaleChordState | null;
}