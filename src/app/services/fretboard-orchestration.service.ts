import { Injectable, inject } from '@angular/core';
import { GuitarNote } from '../shared/model/guitarNote';
import { MusicSelection } from '../shared/model/music-selection';
import { FretboardNotePositionService } from './note.service';
import { FretboardStateService } from './fretboard-state.service';
import { ScaleChordState } from '../shared/model/fretboard-snapshot';
import { MarkerRoleService } from './marker-role.service';
import { TonalFacadeService } from './tonal-facade.service';

/**
 * FretboardOrchestrationService — koordynator pipeline'u wyświetlania koncepcji muzycznych na gryfie.
 *
 * Pipeline: teoria muzyki (TonalFacadeService) → pozycje (FretboardNotePositionService)
 *           → podświetlenie (FretboardStateService) → interwały/role (MarkerRoleService)
 *
 * All display*() methods now produce an immutable FretboardSnapshot and set it
 * on FretboardStateService via setSnapshot(). They return void.
 *
 */
@Injectable({ providedIn: 'root' })
export class FretboardOrchestrationService {
  private noteService = inject(FretboardNotePositionService);
  private guitarNeckService = inject(FretboardStateService);
  private markerRoleService = inject(MarkerRoleService);
  private tonalFacade = inject(TonalFacadeService);


  /** Wyświetla skalę na gryfie z oznaczeniem interwałów. */
  displayScale(scaleName: string, rootNote: string): void {
    const { simplified, raw } = this.tonalFacade.resolvePattern(scaleName, rootNote, 'scale');
    const positions = this.noteService.findPositionsByScaleNotes(simplified);
    const intervalMap = this.computeIntervals(rootNote, positions, raw);
    const snapshot = this.guitarNeckService.applyHighlightedNotes(positions, intervalMap, null, null);
    this.guitarNeckService.setSnapshot(snapshot);
  }

  /** Wyświetla akord na gryfie z oznaczeniem interwałów. */
  displayChord(triadType: string, rootNote: string): void {
    this.clearFretboard();
    const { simplified, raw } = this.tonalFacade.resolvePattern(triadType, rootNote, 'chord');
    const positions = this.noteService.findPositionsByScaleNotes(simplified);
    const intervalMap = this.computeIntervals(rootNote, positions, raw);
    const snapshot = this.guitarNeckService.applyHighlightedNotes(positions, intervalMap, null, null);
    this.guitarNeckService.setSnapshot(snapshot);
  }

  /** Clear the fretboard — reset notes, selection, and intervals. */
  clearFretboard(): void {
    this.guitarNeckService.clearFretboard();
  }

  /** Wyświetla custom pattern nut z interwałami względem rootNote. */
  displayCustomPattern(notes: string[], rootNote: string): void {
    this.clearFretboard();
    const positions = this.noteService.findPositionsByScaleNotes(notes);
    const intervalMap = this.computeIntervals(rootNote, positions);
    const snapshot = this.guitarNeckService.applyHighlightedNotes(positions, intervalMap, null, null);
    this.guitarNeckService.setSnapshot(snapshot);
  }

  /**
   * Wyświetla konkretne pozycje na gryfie (RAW API — wewnętrzne, nie dla AI).
   * Przyjmuje tablicę GuitarNote[] z konkretnych (string, fret) pozycji.
   * Opcjonalnie: rootNote dla oznaczeń interwałowych.
   */
  displayPositions(positions: GuitarNote[], rootNote?: string): void {
    this.clearFretboard();
    const intervalMap = rootNote ? this.computeIntervals(rootNote, positions) : undefined;
    const snapshot = this.guitarNeckService.applyHighlightedNotes(positions, intervalMap, null, null);
    this.guitarNeckService.setSnapshot(snapshot);
  }

  // ---- Scale + Chord relation ----

  /** Wyświetla skalę z nałożonym akordem w trybie scale-chord. */
  displayScaleWithChord(
    scaleName: string,
    scaleRoot: string,
    chordName: string,
    chordRoot: string,
  ): void {
    const { simplified: simplifiedScaleNotes } = this.tonalFacade.resolvePattern(scaleName, scaleRoot, 'scale');
    const { simplified: simplifiedChordNotes } = this.tonalFacade.resolvePattern(chordName, chordRoot, 'chord');

    const outsideChordNotes = simplifiedChordNotes.filter(n => !simplifiedScaleNotes.includes(n));

    const scalePositions = this.noteService.findPositionsByScaleNotes(simplifiedScaleNotes);
    const outsidePositions = this.noteService.findPositionsByScaleNotes(outsideChordNotes);
    const allPositions = [...scalePositions, ...outsidePositions];

    const chordSelection: MusicSelection = {
      type: 'chord',
      name: chordName,
      rootNote: chordRoot,
      notes: simplifiedChordNotes, // FIX: was simplifiedScaleNotes — now stores correct chord notes
    };

    const scaleSelection: MusicSelection = {
      type: 'scale',
      name: scaleName,
      rootNote: scaleRoot,
      notes: simplifiedScaleNotes,
    };

    const scaleChordState: ScaleChordState = {
      scale: scaleSelection,
      chord: chordSelection,
    };

    const snapshot = this.guitarNeckService.applyHighlightedNotes(allPositions, undefined, null, scaleChordState);
    this.guitarNeckService.setSnapshot(snapshot);

    this.markerRoleService.computeRoles(
      snapshot.notes,
      scaleSelection,
      chordSelection,
    );
  }

  // ---- Private helpers ----

  /**
   * Compute interval annotations for a set of notes relative to a root note.
   * Returns a Map keyed by "${string}-${fret}" → interval CSS class name.
   * Pure function — does not mutate anything.
   */
  private computeIntervals(
    rootNote: string,
    notes: readonly GuitarNote[],
    rawNoteNames?: string[],
  ): Map<string, string> {
    const intervalMap = new Map<string, string>();
    for (const note of notes) {
      const key = `${note.string}-${note.fret}`;
      if (note.note === rootNote) {
        intervalMap.set(key, 'root');
      } else {
        const rawName = rawNoteNames
          ? (rawNoteNames.find(n => this.tonalFacade.simplifyNote(n) === note.note) || note.note)
          : note.note;
        const tonalInterval = this.tonalFacade.intervalBetween(rootNote, rawName);
        intervalMap.set(key, this.tonalFacade.mapInterval(tonalInterval) || '');
      }
    }
    return intervalMap;
  }
}