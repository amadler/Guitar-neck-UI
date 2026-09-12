import { Injectable, inject } from '@angular/core';
import { GuitarNote } from '../shared/model/guitarNote';
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
}