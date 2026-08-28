import { Injectable } from '@angular/core';
import { get as scaleGet } from '@tonaljs/scale';
import { chord } from '@tonaljs/chord';
import { simplify } from '@tonaljs/note';
import { distance } from '@tonaljs/interval';
import { GuitarNote } from '../shared/model/guitarNote';
import { MusicSelection } from '../shared/model/music-selection';
import { FretboardNotePositionService } from './note.service';
import { FretboardStateService } from './guitar-neck.service';
import { MarkerRoleService } from './marker-role.service';
import { INTERVAL_MAP } from '../shared/tonal-adapter';

/**
 * FretboardOrchestrationService — fasada dla logiki teorii muzyki.
 *
 * Jedyna warstwa między UI a silnikiem Tonal.js.
 * Metody są synchroniczne — żadnych Observable, żadnego HTTP.
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
    const scaleNotes = scaleGet(`${rootNote} ${scaleName}`)
      .notes.map(n => simplify(n));
    const positions = this.noteService.findPositionsByScaleNotes(scaleNotes);
    const highlighted = this.guitarNeckService.applyHighlightedNotes(positions);
    this.markIntervals(rootNote, highlighted);
    return highlighted;
  }

  /** Wyświetla akord na gryfie z oznaczeniem interwałów. */
  displayChord(triadType: string, rootNote: string): GuitarNote[] {
    this.clearFretboard();
    const chordNotes = chord(`${rootNote}${triadType}`)
      .notes.map(n => simplify(n));
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
    const scaleNotes = scaleGet(`${scaleRoot} ${scaleName}`)
      .notes.map(n => simplify(n));

    // 2. Resolve chord notes via Tonal
    const chordNoteNames = chord(`${chordRoot}${chordName}`)
      .notes.map(n => simplify(n));

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