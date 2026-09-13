import { Injectable, inject } from '@angular/core';
import { GuitarNote, createGuitarNote } from '../shared/model/guitarNote';
import { neckConfig } from 'guitar-neck-shared';
import { DomainService } from '../domain/domain.service';
import { FretboardStateService } from './fretboard-state.service';

@Injectable({ providedIn: 'root' })
export class FretboardNoteQueryService {
  private domainService = inject(DomainService);
  private guitarNeckService = inject(FretboardStateService);


  /** Convenience accessor for the current snapshot's notes array. */
  private get snapshotNotes(): readonly GuitarNote[] {
    return this.guitarNeckService.currentSnapshot()?.notes ?? [];
  }

  private isMatchingNoteOnFret(note: GuitarNote, stringIndex: number, fret: number): boolean {
    return note.string === stringIndex + 1 && note.fret === fret && note.visible;
  }

  isNoteOnFret(stringIndex: number, fret: number): boolean {
    if (stringIndex >= 0 && !this.domainService.currentState().enabledStrings[stringIndex]) {
      return false;
    }
    return this.snapshotNotes.some(note => this.isMatchingNoteOnFret(note, stringIndex, fret));
  }

  getNote(stringIndex: number, fret: number): GuitarNote | undefined {
    if (stringIndex >= 0 && !this.domainService.currentState().enabledStrings[stringIndex]) {
      return undefined;
    }
    return this.snapshotNotes.find(note => this.isMatchingNoteOnFret(note, stringIndex, fret));
  }

  getNoteName(stringIndex: number, fret: number): string {
    const note = this.snapshotNotes.find(note => this.isMatchingNoteOnFret(note, stringIndex, fret));
    return note ? note.note : '';
  }

  fretNoteClicked(stringIndex: number, fret: number): GuitarNote | null {
    return this.snapshotNotes.find(note => this.isMatchingNoteOnFret(note, stringIndex, fret)) || null;
  }

  /**
   * Get a note at a physical position regardless of visibility.
   * Used in exercise mode where all positions should be clickable.
   * Returns a GuitarNote with visible=false so it won't render as a marker,
   * but the note name and position are correct.
   */
  getNoteAtPhysicalPosition(stringIndex: number, fret: number): GuitarNote | null {
    if (stringIndex < 0 || stringIndex > 5) return null;
    if (fret < 0 || fret > 24) return null;
    // Try snapshot first (has correct note name)
    const fromSnapshot = this.snapshotNotes.find(
      n => n.string === stringIndex + 1 && n.fret === fret
    );
    if (fromSnapshot) return fromSnapshot;
    // Fallback: compute note name from neck config
    const openNote = neckConfig.stringNotes[stringIndex];
    const noteIndex = (neckConfig.chromaticNotes.indexOf(openNote) + fret) % neckConfig.chromaticNotes.length;
    const noteName = neckConfig.chromaticNotes[noteIndex];
    return createGuitarNote(stringIndex + 1, fret, noteName, false);
  }
}