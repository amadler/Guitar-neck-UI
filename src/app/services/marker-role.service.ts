import { Injectable } from '@angular/core';
import { neckConfig, CHORD_PATTERNS, SCALE_PATTERNS } from 'guitar-neck-shared';
import { GuitarNote } from '../shared/model/guitarNote';
import { MusicSelection } from '../shared/model/music-selection';

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
 * Resolves the set of note names (pitch classes) for a chord pattern
 * rooted at a given root note, using the same logic as IntervalService
 * but returning raw note names instead of mutating GuitarNote objects.
 */
function resolveChordNoteNames(chordName: string, rootNote: string): Set<string> {
  const pattern = CHORD_PATTERNS.find(p => p.name === chordName);
  if (!pattern) {
    console.warn(`[MarkerRoleService] Unknown chord pattern: ${chordName}`);
    return new Set();
  }

  const chromatic = neckConfig.chromaticNotes;
  const rootIndex = chromatic.indexOf(rootNote);
  if (rootIndex === -1) {
    console.warn(`[MarkerRoleService] Invalid root note: ${rootNote}`);
    return new Set();
  }

  const notes = new Set<string>();
  notes.add(rootNote);

  let cumulative = 0;
  for (const step of pattern.intervals) {
    cumulative += step;
    const noteIndex = (rootIndex + cumulative) % 12;
    notes.add(chromatic[noteIndex]);
  }

  return notes;
}

/**
 * Resolves the set of note names for a scale pattern rooted at a given root note.
 */
function resolveScaleNoteNames(scaleName: string, rootNote: string): Set<string> {
  const pattern = SCALE_PATTERNS.find(p => p.name === scaleName);
  if (!pattern) {
    console.warn(`[MarkerRoleService] Unknown scale pattern: ${scaleName}`);
    return new Set();
  }

  const chromatic = neckConfig.chromaticNotes;
  const rootIndex = chromatic.indexOf(rootNote);
  if (rootIndex === -1) {
    console.warn(`[MarkerRoleService] Invalid root note: ${rootNote}`);
    return new Set();
  }

  const notes = new Set<string>();
  notes.add(rootNote);

  let cumulative = 0;
  for (const step of pattern.intervals) {
    cumulative += step;
    const noteIndex = (rootIndex + cumulative) % 12;
    notes.add(chromatic[noteIndex]);
  }

  return notes;
}

@Injectable({ providedIn: 'root' })
export class MarkerRoleService {

  /** Cached result of the last computeRoles() call, for read access by display layer. */
  lastRoles: Map<string, MarkerRole> = new Map();

  /**
   * Compute marker roles for every note on the fretboard given a scale
   * selection and an optional chord selection.
   *
   * Returns a Map keyed by `"${string}-${fret}"` → MarkerRole.
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

    const scaleNoteNames = resolveScaleNoteNames(scaleSelection.name, scaleSelection.rootNote);
    const scaleRoot = scaleSelection.rootNote;

    if (chordSelection?.rootNote && chordSelection?.name) {
      // --- Dual mode: scale + chord ---
      const chordNoteNames = resolveChordNoteNames(chordSelection.name, chordSelection.rootNote);
      const chordRoot = chordSelection.rootNote;

      for (const note of notes) {
        const key = `${note.string}-${note.fret}`;
        const inScale = scaleNoteNames.has(note.note);
        const inChord = chordNoteNames.has(note.note);

        if (inScale && inChord) {
          // Could be both scale-root and chord-root simultaneously
          if (note.note === scaleRoot && note.note === chordRoot) {
            roles.set(key, 'scale-root'); // scale-root takes precedence; chord-root is implied
          } else if (note.note === chordRoot) {
            roles.set(key, 'chord-root');
          } else if (note.note === scaleRoot) {
            roles.set(key, 'scale-root');
          } else {
            roles.set(key, 'chord-tone');
          }
        } else if (inChord && !inScale) {
          roles.set(key, 'chord-tone-outside-scale');
        } else if (inScale) {
          if (note.note === scaleRoot) {
            roles.set(key, 'scale-root');
          } else {
            roles.set(key, 'scale-tone');
          }
        }
      }
    } else {
      // --- Single mode: scale only ---
      for (const note of notes) {
        if (scaleNoteNames.has(note.note)) {
          const key = `${note.string}-${note.fret}`;
          roles.set(key, note.note === scaleRoot ? 'scale-root' : 'scale-tone');
        }
      }
    }

    this.lastRoles = roles;
    return roles;
  }
}
