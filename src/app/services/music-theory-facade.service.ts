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
import { INTERVAL_MAP } from '../shared/tonal-adapter';
import { neckConfig } from 'guitar-neck-shared';

/**
 * FretboardOrchestrationService — fasada dla logiki teorii muzyki.
 *
 * Jedyna warstwa między UI a silnikiem Tonal.js.
 * Metody są synchroniczne — żadnych Observable, żadnego HTTP.
 * Nazwy patternów są normalizowane z formatu UI → Tonal.
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
    const tonalName = this.toTonalScaleName(scaleName);
    const scaleNotes = scaleGet(`${rootNote} ${tonalName}`)
      .notes.map(n => simplify(n));
    const positions = this.noteService.findPositionsByScaleNotes(scaleNotes);
    const highlighted = this.guitarNeckService.applyHighlightedNotes(positions);
    this.markIntervals(rootNote, highlighted);
    return highlighted;
  }

  /** Wyświetla akord na gryfie z oznaczeniem interwałów. */
  displayChord(triadType: string, rootNote: string): GuitarNote[] {
    this.clearFretboard();
    const chordNotes = this.resolveChordNotes(triadType, rootNote);
    const positions = this.noteService.findPositionsByChordNotes(chordNotes);
    const highlighted = this.guitarNeckService.applyHighlightedNotes(positions);
    this.markIntervals(rootNote, highlighted);
    return highlighted;
  }

  /** Wyświetla pojedynczą nutę na gryfie. */
  displaySingleNote(noteName: string): void {
    const positions = this.noteService.findPositionsByNoteName(noteName);
    this.guitarNeckService.applyHighlightedNotes(positions);
  }

  /** Wyświetla wszystkie nuty na gryfie. */
  displayAllNotes(): void {
    this.guitarNeckService.showAll();
  }

  /** Resetuje gryf — ukrywa nuty, usuwa interwały. */
  resetFretboard(): void {
    this.removeIntervals(this.guitarNeckService.notes);
    this.guitarNeckService.clearFretboard();
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
    this.markCustomIntervals(rootNote, highlighted);
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

    // 1. Resolve scale notes via Tonal
    const tonalScaleName = this.toTonalScaleName(scaleName);
    const scaleNotes = scaleGet(`${scaleRoot} ${tonalScaleName}`)
      .notes.map(n => simplify(n));

    // 2. Resolve chord notes via Tonal
    const chordNoteNames = this.resolveChordNotes(chordName, chordRoot);

    // 3. Find chord notes that are NOT in the scale
    const outsideChordNotes = chordNoteNames.filter(n => !scaleNotes.includes(n));

    // 4. Find positions for scale notes AND outside chord notes
    const scalePositions = this.noteService.findPositionsByScaleNotes(scaleNotes);
    const outsidePositions = this.noteService.findPositionsByScaleNotes(outsideChordNotes);
    const allPositions = [...scalePositions, ...outsidePositions];
    const highlightedNotes = this.guitarNeckService.applyHighlightedNotes(allPositions);

    // 5. Skip interval marking — role-based coloring handles visuals via MarkerRoleService

    // 6. Build chord selection
    const chordSelection: MusicSelection = {
      type: 'chord',
      name: chordName,
      rootNote: chordRoot,
    };

    // 7. Set dual selection state
    this.guitarNeckService.scaleChordState = {
      scale: {
        type: 'scale',
        name: scaleName,
        rootNote: scaleRoot,
        notes: scaleNotes,
      },
      chord: chordSelection,
    };

    // 8. Compute marker roles
    this.markerRoleService.computeRoles(
      this.guitarNeckService.notes,
      this.guitarNeckService.scaleChordState.scale,
      chordSelection,
    );

    return highlightedNotes;
  }

  /** Usuwa relację akordu, pozostawiając samą skalę. */
  clearRelation(): void {
    if (this.guitarNeckService.scaleChordState) {
      this.guitarNeckService.scaleChordState = {
        scale: this.guitarNeckService.scaleChordState.scale,
        chord: null,
      };
      this.markerRoleService.lastRoles = new Map();
    }
  }

  // ---- Private helpers ----

  /** Normalizuje nazwę skali z formatu UI (myślniki) na format Tonal (spacje). */
  private toTonalScaleName(name: string): string {
    return name.replace(/-/g, ' ');
  }

  /** Normalizuje nazwę akordu z formatu UI na format Tonal. */
  private toTonalChordName(name: string): string {
    // dom7 → 7, dom9 → 9, dom11 → 11, dom13 → 13
    name = name.replace(/^dom(\d+)$/, '$1');
    // min7 → m7, min9 → m9, min11 → m11, min13 → m13
    name = name.replace(/^min(\d+)$/, 'm$1');
    // minmaj7 → mM7
    name = name.replace('minmaj7', 'mM7');
    // min6 → m6
    name = name.replace('min6', 'm6');
    // m7b5 stays as is (Tonal has it)
    return name;
  }

  /**
   * Resolves chord note names from a chord type and root.
   * Uses Tonal for most chords; handles add11 specially since Tonal doesn't have it.
   */
  private resolveChordNotes(chordType: string, rootNote: string): string[] {
    if (chordType === 'add11') {
      // add11 = root, major 3rd, perfect 5th, perfect 11th (= perfect 4th up octave)
      // In pitch classes: root + 4 semitones + 7 semitones + 5 semitones
      const chromatic = neckConfig.chromaticNotes;
      const rootIndex = chromatic.indexOf(rootNote);
      if (rootIndex === -1) return [];
      const notes = [
        chromatic[rootIndex],
        chromatic[(rootIndex + 4) % 12],  // major 3rd
        chromatic[(rootIndex + 7) % 12],  // perfect 5th
        chromatic[(rootIndex + 5) % 12],  // perfect 11th (= 4th)
      ];
      return [...new Set(notes)]; // deduplicate in case of enharmonic overlap
    }

    const tonalName = this.toTonalChordName(chordType);
    const result = chordGet(`${rootNote}${tonalName}`);
    if (result.empty) {
      console.warn(`[FretboardOrchestrationService] Unknown chord: ${chordType} (tried Tonal: ${tonalName})`);
      return [];
    }
    return result.notes.map((n: string) => simplify(n));
  }

  /** Oznacza nuty interwałami względem rootNote. */
  private markIntervals(rootNote: string, notes: GuitarNote[]): void {
    for (const note of notes) {
      if (note.note === rootNote) {
        note.interval = 'root';
      } else {
        const tonalInterval = distance(rootNote, note.note);
        note.interval = INTERVAL_MAP[tonalInterval] || '';
      }
    }
  }

  /** Oznacza nuty interwałami dla custom patternu. */
  private markCustomIntervals(rootNote: string, notes: GuitarNote[]): void {
    for (const note of notes) {
      if (note.note === rootNote) {
        note.interval = 'root';
      } else {
        const tonalInterval = distance(rootNote, note.note);
        note.interval = INTERVAL_MAP[tonalInterval] || '';
      }
    }
  }

  /** Usuwa oznaczenia interwałowe z nut. */
  private removeIntervals(notes: GuitarNote[]): void {
    notes.forEach(note => { note.interval = ''; });
  }
}