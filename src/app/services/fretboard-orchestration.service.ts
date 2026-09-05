import { Injectable, inject } from '@angular/core';
import { GuitarNote } from '../shared/model/guitarNote';
import { MusicSelection } from '../shared/model/music-selection';
import { FretboardNotePositionService } from './note.service';
import { FretboardStateService } from './fretboard-state.service';
import { MarkerRoleService } from './marker-role.service';
import { TonalFacadeService } from './tonal-facade.service';

/**
 * FretboardOrchestrationService — koordynator pipeline'u wyświetlania koncepcji muzycznych na gryfie.
 *
 * Pipeline: teoria muzyki (TonalFacadeService) → pozycje (FretboardNotePositionService)
 *           → podświetlenie (FretboardStateService) → interwały/role (MarkerRoleService)
 *
 */
@Injectable({ providedIn: 'root' })
export class FretboardOrchestrationService {
  private noteService = inject(FretboardNotePositionService);
  private guitarNeckService = inject(FretboardStateService);
  private markerRoleService = inject(MarkerRoleService);
  private tonalFacade = inject(TonalFacadeService);


  /** Wyświetla skalę na gryfie z oznaczeniem interwałów. */
  displayScale(scaleName: string, rootNote: string): GuitarNote[] {
    this.guitarNeckService.scaleChordState.set(null); // clear stale compare state
    const { simplified, raw } = this.tonalFacade.resolvePattern(scaleName, rootNote, 'scale');
    const positions = this.noteService.findPositionsByScaleNotes(simplified);
    const highlighted = this.guitarNeckService.applyHighlightedNotes(positions);
    this.markIntervals(rootNote, highlighted, raw);
    return highlighted;
  }

  /** Wyświetla akord na gryfie z oznaczeniem interwałów. */
  displayChord(triadType: string, rootNote: string): GuitarNote[] {
    this.clearFretboard();
    this.guitarNeckService.scaleChordState.set(null); // clear stale compare state
    const { simplified, raw } = this.tonalFacade.resolvePattern(triadType, rootNote, 'chord');
    const positions = this.noteService.findPositionsByScaleNotes(simplified);
    const highlighted = this.guitarNeckService.applyHighlightedNotes(positions);
    this.markIntervals(rootNote, highlighted, raw);
    return highlighted;
  }

  /** Clear the fretboard — reset notes, selection, and intervals. */
  clearFretboard(): void {
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

  /**
   * Wyświetla konkretne pozycje na gryfie (RAW API — wewnętrzne, nie dla AI).
   * Przyjmuje tablicę GuitarNote[] z konkretnych (string, fret) pozycji.
   * Opcjonalnie: rootNote dla oznaczeń interwałowych.
   */
  displayPositions(positions: GuitarNote[], rootNote?: string): GuitarNote[] {
    this.clearFretboard();
    const highlighted = this.guitarNeckService.applyHighlightedNotes(positions);
    if (rootNote) {
      this.markIntervals(rootNote, highlighted);
    }
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

    const { simplified: simplifiedScaleNotes } = this.tonalFacade.resolvePattern(scaleName, scaleRoot, 'scale');
    const { simplified: simplifiedChordNotes } = this.tonalFacade.resolvePattern(chordName, chordRoot, 'chord');

    const outsideChordNotes = simplifiedChordNotes.filter(n => !simplifiedScaleNotes.includes(n));

    const scalePositions = this.noteService.findPositionsByScaleNotes(simplifiedScaleNotes);
    const outsidePositions = this.noteService.findPositionsByScaleNotes(outsideChordNotes);
    const allPositions = [...scalePositions, ...outsidePositions];
    const highlightedNotes = this.guitarNeckService.applyHighlightedNotes(allPositions);

    const chordSelection: MusicSelection = {
      type: 'chord',
      name: chordName,
      rootNote: chordRoot,
      notes: simplifiedScaleNotes
    };

    const scaleSelection: MusicSelection = {
      type: 'scale',
      name: scaleName,
      rootNote: scaleRoot,
      notes: simplifiedScaleNotes,
    };
    this.guitarNeckService.scaleChordState.set(
      {
        scale: scaleSelection,
        chord: chordSelection,
      }
    );

    this.markerRoleService.computeRoles(
      this.guitarNeckService.notes,
      scaleSelection,
      chordSelection,
    );

    return highlightedNotes;
  }

  // ---- Private helpers ----

  /**
   * Oznacza nuty interwałami.
   * Używa TonalFacadeService.intervalBetween() który jest enharmonicznie bezpieczny.
   */
  private markIntervals(rootNote: string, notes: GuitarNote[], rawNoteNames?: string[]): void {
    for (const note of notes) {
      if (note.note === rootNote) {
        note.interval = 'root';
      } else {
        const rawName = rawNoteNames
          ? (rawNoteNames.find(n => this.tonalFacade.simplifyNote(n) === note.note) || note.note)
          : note.note;
        const tonalInterval = this.tonalFacade.intervalBetween(rootNote, rawName);
        note.interval = this.tonalFacade.mapInterval(tonalInterval) || '';
      }
    }
  }

  /** Usuwa oznaczenia interwałowe z nut. */
  private removeIntervals(notes: GuitarNote[]): void {
    notes.forEach(note => { note.interval = ''; });
  }
}
