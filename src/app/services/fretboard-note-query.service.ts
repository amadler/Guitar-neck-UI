import { Injectable } from '@angular/core';
import { GuitarNote } from '../shared/model/guitarNote';
import { DomainService } from '../domain/domain.service';
import { FretboardStateService } from './fretboard-state.service';

@Injectable({ providedIn: 'root' })
export class FretboardNoteQueryService {
  constructor(
    private domainService: DomainService,
    private guitarNeckService: FretboardStateService,
  ) {}

  private isMatchingNoteOnFret(note: GuitarNote, stringIndex: number, fret: number): boolean {
    return note.string === stringIndex + 1 && note.fret === fret && note.visible;
  }

  isNoteOnFret(stringIndex: number, fret: number): boolean {
    if (stringIndex >= 0 && !this.domainService.currentState.enabledStrings[stringIndex]) {
      return false;
    }
    return this.guitarNeckService.notes.some(note => this.isMatchingNoteOnFret(note, stringIndex, fret));
  }

  getNote(stringIndex: number, fret: number): GuitarNote | undefined {
    if (stringIndex >= 0 && !this.domainService.currentState.enabledStrings[stringIndex]) {
      return undefined;
    }
    return this.guitarNeckService.notes.find(note => this.isMatchingNoteOnFret(note, stringIndex, fret));
  }

  getNoteName(stringIndex: number, fret: number): string {
    const note = this.guitarNeckService.notes.find(note => this.isMatchingNoteOnFret(note, stringIndex, fret));
    return note ? note.note : '';
  }

  fretNoteClicked(stringIndex: number, fret: number): GuitarNote | null {
    return this.guitarNeckService.notes.find(note => this.isMatchingNoteOnFret(note, stringIndex, fret)) || null;
  }
}
