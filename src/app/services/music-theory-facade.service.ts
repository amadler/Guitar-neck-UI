import { Injectable } from '@angular/core';
import { get as scaleGet } from '@tonaljs/scale';
import { get as chordGet } from '@tonaljs/chord';
import { simplify } from '@tonaljs/note';
import { distance } from '@tonaljs/interval';
import { GuitarNote } from '../shared/model/guitarNote';
import { MusicSelection } from '../shared/model/music-selection';
import { FretboardNotePositionService } from './note.service';
import { FretboardStateService } from './guitar-neck.service';
import { MarkerRoleService } from './marker-role.service';
import { INTERVAL_MAP, CHORD_NAME_TO_TONAL, SCALE_NAME_TO_TONAL, SCALES_NOT_IN_TONAL, CHORDS_NOT_IN_TONAL } from '../shared/tonal-adapter';
import { CHORD_PATTERNS, SCALE_PATTERNS, neckConfig } from 'guitar-neck-shared';
import { resolveNotesFromIntervals } from '../shared/pattern-resolver';

/**
 * FretboardOrchestrationService — fasada dla logiki teorii muzyki.
 *
 * Jedyna warstwa między UI a silnikiem Tonal.js.
 * Metody są synchroniczne — żadnych Observable, żadnego HTTP.
 *
 * Nazwy patternów są mapowane przez CHORD_NAME_TO_TONAL / SCALE_NAME_TO_TONAL.
 * Dla patternów których Tonal nie ma, używamy fallbacku z CHORD_PATTERNS / SCALE_PATTERNS.
 */
@Injectable({ providedIn: 'root' })
export class FretboardOrchestrationService {
  constructor(
    private noteService: FretboardNotePositionService,
    private guitarNeckService: FretboardStateService,
    private markerRoleService: MarkerRoleService,
  ) {}

  /** Wyświetla skalę na gryfie z oznaczeniem interwałów. */
  displayScale(scaleName: string, rootNote: string): GuitarNote[] {
    const { simplified, raw } = this.resolveScaleNotes(scaleName, rootNote);
    const positions = this.noteService.findPositionsByScaleNotes(simplified);
    const highlighted = this.guitarNeckService.applyHighlightedNotes(positions);
    this.markIntervals(rootNote, highlighted, raw);
    return highlighted;
  }

  /** Wyświetla akord na gryfie z oznaczeniem interwałów. */
  displayChord(triadType: string, rootNote: string): GuitarNote[] {
    this.clearFretboard();
    const { simplified, raw } = this.resolveChordNotes(triadType, rootNote);
    const positions = this.noteService.findPositionsByScaleNotes(simplified);
    const highlighted = this.guitarNeckService.applyHighlightedNotes(positions);
    this.markIntervals(rootNote, highlighted, raw);
    return highlighted;
  }

  private clearFretboard(): void {
    this.removeIntervals(this.guitarNeckService.notes);
    this.guitarNeckService.clearFretboard();
  }

  /** Wyświetla custom pattern nut z interwałami względem rootNote. */
  displayCustomPattern(notes: string[], rootNote: string): GuitarNote[] {
    this.clearFretboard();
    const positions = this.noteService.findPositionsByScaleNotes(notes);
    const highlighted = this.guitarNeckService.applyHighlightedNotes(positions);
    this.markIntervals(rootNote, highlighted);
    return highlighted;
  }

  // ---- Scale + Chord relation ----

  /** Wyświetla skalę z nałożonym akordem w trybie scale-chord. */
  displayScaleWithChord(
    scaleName: string,
    scaleRoot: string,
    chordName: string,
    chordRoot: string,
  ): GuitarNote[] {
    this.removeIntervals(this.guitarNeckService.notes);

    const { simplified: simplifiedScaleNotes } = this.resolveScaleNotes(scaleName, scaleRoot);
    const { simplified: simplifiedChordNotes } = this.resolveChordNotes(chordName, chordRoot);

    const outsideChordNotes = simplifiedChordNotes.filter(n => !simplifiedScaleNotes.includes(n));

    const scalePositions = this.noteService.findPositionsByScaleNotes(simplifiedScaleNotes);
    const outsidePositions = this.noteService.findPositionsByScaleNotes(outsideChordNotes);
    const allPositions = [...scalePositions, ...outsidePositions];
    const highlightedNotes = this.guitarNeckService.applyHighlightedNotes(allPositions);

    const chordSelection: MusicSelection = {
      type: 'chord',
      name: chordName,
      rootNote: chordRoot,
    };

    this.guitarNeckService.scaleChordState = {
      scale: {
        type: 'scale',
        name: scaleName,
        rootNote: scaleRoot,
        notes: simplifiedScaleNotes,
      },
      chord: chordSelection,
    };

    this.markerRoleService.computeRoles(
      this.guitarNeckService.notes,
      this.guitarNeckService.scaleChordState.scale,
      chordSelection,
    );

    return highlightedNotes;
  }

  // ---- Private helpers ----

  /**
   * Resolves scale note names from a UI scale name and root.
   * Uses Tonal if available, falls back to SCALE_PATTERNS for exotic scales.
   */
  private resolveScaleNotes(scaleName: string, rootNote: string): { simplified: string[]; raw: string[] } {
    // Fallback for scales not in Tonal
    if (SCALES_NOT_IN_TONAL.has(scaleName)) {
      return this.resolveFromPatterns(scaleName, rootNote, SCALE_PATTERNS);
    }

    const tonalName = SCALE_NAME_TO_TONAL[scaleName] || scaleName.replace(/-/g, ' ');
    const result = scaleGet(`${rootNote} ${tonalName}`);
    if (result.empty) {
      console.warn(`[FretboardOrchestrationService] Unknown scale: ${scaleName} (tried Tonal: ${tonalName})`);
      return this.resolveFromPatterns(scaleName, rootNote, SCALE_PATTERNS);
    }
    const raw = result.notes;
    const simplified = raw.map((n: string) => simplify(n));
    return { simplified, raw };
  }

  /**
   * Resolves chord note names from a UI chord name and root.
   * Uses Tonal if available, falls back to CHORD_PATTERNS for exotic chords.
   * add11 is handled specially since Tonal doesn't have it.
   */
  private resolveChordNotes(chordType: string, rootNote: string): { simplified: string[]; raw: string[] } {
    // add11: Tonal doesn't have it
    if (chordType === 'add11') {
      const chromatic = neckConfig.chromaticNotes;
      const rootIndex = chromatic.indexOf(rootNote);
      if (rootIndex === -1) return { simplified: [], raw: [] };
      const notes = [
        chromatic[rootIndex],
        chromatic[(rootIndex + 4) % 12],
        chromatic[(rootIndex + 7) % 12],
        chromatic[(rootIndex + 5) % 12],
      ];
      const deduped = [...new Set(notes)];
      return { simplified: deduped, raw: deduped };
    }

    // Fallback for chords not in Tonal
    if (CHORDS_NOT_IN_TONAL.has(chordType)) {
      return this.resolveFromPatterns(chordType, rootNote, CHORD_PATTERNS);
    }

    const tonalName = CHORD_NAME_TO_TONAL[chordType];
    if (!tonalName) {
      console.warn(`[FretboardOrchestrationService] Unknown chord mapping: ${chordType}`);
      return this.resolveFromPatterns(chordType, rootNote, CHORD_PATTERNS);
    }

    const result = chordGet(`${rootNote}${tonalName}`);
    if (result.empty) {
      console.warn(`[FretboardOrchestrationService] Tonal returned empty for: ${chordType} → ${tonalName}`);
      return this.resolveFromPatterns(chordType, rootNote, CHORD_PATTERNS);
    }
    const raw = result.notes;
    const simplified = raw.map((n: string) => simplify(n));
    return { simplified, raw };
  }

  /**
   * Fallback: resolves note names from CHORD_PATTERNS / SCALE_PATTERNS.
   * Used for exotic patterns that Tonal doesn't know.
   */
  private resolveFromPatterns(
    patternName: string,
    rootNote: string,
    patterns: Array<{ name: string; intervals: number[] }>,
  ): { simplified: string[]; raw: string[] } {
    const pattern = patterns.find(p => p.name === patternName);
    if (!pattern) {
      console.warn(`[FretboardOrchestrationService] Pattern not found in fallback: ${patternName}`);
      return { simplified: [], raw: [] };
    }

    const notes = resolveNotesFromIntervals(rootNote, pattern.intervals);
    // For fallback, simplified and raw are the same (no enharmonic notation)
    return { simplified: notes, raw: notes };
  }

  /**
   * Oznacza nuty interwałami.
   * Gdy podano rawNoteNames, używa ich do distance() (enharmonic-aware).
   * Gdy brak rawNoteNames, używa bezpośrednio note.note (custom pattern).
   */
  private markIntervals(rootNote: string, notes: GuitarNote[], rawNoteNames?: string[]): void {
    for (const note of notes) {
      if (note.note === rootNote) {
        note.interval = 'root';
      } else {
        const rawName = rawNoteNames
          ? (rawNoteNames.find(n => simplify(n) === note.note) || note.note)
          : note.note;
        const tonalInterval = distance(rootNote, rawName);
        note.interval = INTERVAL_MAP[tonalInterval] || '';
      }
    }
  }

  /** Usuwa oznaczenia interwałowe z nut. */
  private removeIntervals(notes: GuitarNote[]): void {
    notes.forEach(note => { note.interval = ''; });
  }
}