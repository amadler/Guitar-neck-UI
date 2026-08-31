import { Injectable } from '@angular/core';
import { CHORD_PATTERNS, SCALE_PATTERNS } from 'guitar-neck-shared';
import { GuitarNote } from '../shared/model/guitarNote';
import { MusicSelection } from '../shared/model/music-selection';
import { resolveNotesFromIntervals } from '../shared/pattern-resolver';
import { noteToChroma } from '../shared/note-utils';

/**
 * Marker role describes the visual role of a note on the fretboard
 * when both a scale and a chord are displayed simultaneously.
 *
 * Roles:
 * - `scale-tone`            — note belongs to the scale but NOT to the chord
 * - `chord-tone`            — note belongs to both the scale AND the chord
 * - `scale-root`            — root note of the scale
 * - `chord-root`            — root note of the chord (may differ from scale-root)
 * - `chord-tone-outside-scale` — note belongs to the chord but NOT to the scale
 */
export type MarkerRole =
  | 'scale-tone'
  | 'chord-tone'
  | 'scale-root'
  | 'chord-root'
  | 'chord-tone-outside-scale';

/**
 * Resolves the set of chroma values for a chord pattern rooted at a given root note.
 * Uses chroma (pitch class) instead of note names to avoid enharmonic mismatches.
 */
function resolveChordChromas(chordName: string, rootNote: string): Set<number> {
  const pattern = CHORD_PATTERNS.find(p => p.name === chordName);
  if (!pattern) {
    console.warn(`[MarkerRoleService] Unknown chord pattern: ${chordName}`);
    return new Set();
  }
  const names = resolveNotesFromIntervals(rootNote, pattern.intervals);
  return new Set(names.map(noteToChroma));
}

/**
 * Resolves the set of chroma values for a scale pattern rooted at a given root note.
 * Uses chroma (pitch class) instead of note names to avoid enharmonic mismatches.
 */
function resolveScaleChromas(scaleName: string, rootNote: string): Set<number> {
  const pattern = SCALE_PATTERNS.find(p => p.name === scaleName);
  if (!pattern) {
    console.warn(`[MarkerRoleService] Unknown scale pattern: ${scaleName}`);
    return new Set();
  }
  const names = resolveNotesFromIntervals(rootNote, pattern.intervals);
  return new Set(names.map(noteToChroma));
}

@Injectable({ providedIn: 'root' })
export class MarkerRoleService {

  /** Cached result of the last computeRoles() call, for read access by display layer. */
  lastRoles: Map<string, MarkerRole> = new Map();

  /**
   * Compute marker roles for every note on the fretboard given a scale
   * selection and an optional chord selection.
   *
   * Returns a Map keyed by `"${stringIndex}-${fret}"` where `stringIndex`
   * is 0-based (matching the template's `let i = index`), → MarkerRole.
   * Only notes that have a role are included in the map.
   *
   * When `chordSelection` is null, only `scale-tone` and `scale-root` roles
   * are returned — preserving backward-compatible behaviour.
   */
  computeRoles(
    notes: GuitarNote[],
    scaleSelection: MusicSelection,
    chordSelection: MusicSelection | null,
  ): Map<string, MarkerRole> {
    const roles = new Map<string, MarkerRole>();

    if (!scaleSelection.rootNote || !scaleSelection.name) {
      return roles;
    }

    const scaleChromas = resolveScaleChromas(scaleSelection.name, scaleSelection.rootNote);
    const scaleRootChroma = noteToChroma(scaleSelection.rootNote);

    if (chordSelection?.rootNote && chordSelection?.name) {
      // --- Dual mode: scale + chord ---
      const chordChromas = resolveChordChromas(chordSelection.name, chordSelection.rootNote);
      const chordRootChroma = noteToChroma(chordSelection.rootNote);

      for (const note of notes) {
        // Use 0-based string index to match template's `let i = index`
        const key = `${note.string - 1}-${note.fret}`;
        const noteChroma = noteToChroma(note.note);
        const inScale = scaleChromas.has(noteChroma);
        const inChord = chordChromas.has(noteChroma);

        if (inScale && inChord) {
          // Could be both scale-root and chord-root simultaneously
          if (noteChroma === scaleRootChroma && noteChroma === chordRootChroma) {
            roles.set(key, 'chord-root'); // chord-root wins when both roots are the same note
          } else if (noteChroma === chordRootChroma) {
            roles.set(key, 'chord-root');
          } else if (noteChroma === scaleRootChroma) {
            roles.set(key, 'scale-root');
          } else {
            roles.set(key, 'chord-tone');
          }
        } else if (inChord && !inScale) {
          roles.set(key, 'chord-tone-outside-scale');
        } else if (inScale) {
          if (noteChroma === scaleRootChroma) {
            roles.set(key, 'scale-root');
          } else {
            roles.set(key, 'scale-tone');
          }
        }
      }
    } else {
      // --- Single mode: scale only ---
      for (const note of notes) {
        const noteChroma = noteToChroma(note.note);
        if (scaleChromas.has(noteChroma)) {
          // Use 0-based string index to match template's `let i = index`
          const key = `${note.string - 1}-${note.fret}`;
          roles.set(key, noteChroma === scaleRootChroma ? 'scale-root' : 'scale-tone');
        }
      }
    }

    this.lastRoles = roles;
    return roles;
  }
}
