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
 *
 * Ważne: Tonal zwraca nuty w notacji enharmonicznej (C##, B#, F##).
 * Do mapowania na gryf używamy simplify(), ale do liczenia interwałów
 * zachowujemy oryginalne nazwy Tonal — inaczej distance() da złe wyniki.
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
    const rawNotes = scaleGet(`${rootNote} ${tonalName}`).notes;
    // Używamy simplify() tylko do mapowania na gryf
    const simplifiedNotes = rawNotes.map(n => simplify(n));
    const positions = this.noteService.findPositionsByScaleNotes(simplifiedNotes);
    const highlighted = this.guitarNeckService.applyHighlightedNotes(positions);
    // Interwały liczymy z oryginalnych nazw Tonal
    this.markIntervals(rootNote, rawNotes, highlighted);
    return highlighted;
  }

  /** Wyświetla akord na gryfie z oznaczeniem interwałów. */
  displayChord(triadType: string, rootNote: string): GuitarNote[] {
    this.clearFretboard();
    const { simplified, raw } = this.resolveChordNotes(triadType, rootNote);
    const positions = this.noteService.findPositionsByChordNotes(simplified);
    const highlighted = this.guitarNeckService.applyHighlightedNotes(positions);
    this.markIntervals(rootNote, raw, highlighted);
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
    const rawScaleNotes = scaleGet(`${scaleRoot} ${tonalScaleName}`).notes;
    const simplifiedScaleNotes = rawScaleNotes.map(n => simplify(n));

    // 2. Resolve chord notes via Tonal
    const { simplified: simplifiedChordNotes } = this.resolveChordNotes(chordName, chordRoot);

    // 3. Find chord notes that are NOT in the scale
    const outsideChordNotes = simplifiedChordNotes.filter(n => !simplifiedScaleNotes.includes(n));

    // 4. Find positions for scale notes AND outside chord notes
    const scalePositions = this.noteService.findPositionsByScaleNotes(simplifiedScaleNotes);
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
        notes: simplifiedScaleNotes,
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
    name = name.replace(/^dom(\d+)$/, '$1');
    name = name.replace(/^min(\d+)$/, 'm$1');
    name = name.replace('minmaj7', 'mM7');
    name = name.replace('min6', 'm6');
    return name;
  }

  /**
   * Resolves chord note names from a chord type and root.
   * Returns both simplified names (for fretboard) and raw Tonal names (for intervals).
   */
  private resolveChordNotes(chordType: string, rootNote: string): { simplified: string[]; raw: string[] } {
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

    const tonalName = this.toTonalChordName(chordType);
    const result = chordGet(`${rootNote}${tonalName}`);
    if (result.empty) {
      console.warn(`[FretboardOrchestrationService] Unknown chord: ${chordType} (tried Tonal: ${tonalName})`);
      return { simplified: [], raw: [] };
    }
    const raw = result.notes;
    const simplified = raw.map((n: string) => simplify(n));
    return { simplified, raw };
  }

  /** Oznacza nuty interwałami, używając oryginalnych nazw Tonal do distance(). */
  private markIntervals(rootNote: string, rawNoteNames: string[], notes: GuitarNote[]): void {
    for (const note of notes) {
      if (note.note === rootNote) {
        note.interval = 'root';
      } else {
        // Znajdź oryginalną nazwę Tonal dla tej nuty (po simplified)
        const rawName = rawNoteNames.find(n => simplify(n) === note.note) || note.note;
        const tonalInterval = distance(rootNote, rawName);
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