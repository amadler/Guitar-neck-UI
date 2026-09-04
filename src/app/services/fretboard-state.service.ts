/* GuitarNeckService zarządza stanem gryfu.*/
import { Injectable, inject } from '@angular/core';
import { GuitarNote } from '../shared/model/guitarNote';
import { MusicSelection } from '../shared/model/music-selection';

/** Dual selection state when both a scale and a chord are displayed. */
export interface ScaleChordState {
  scale: MusicSelection;
  chord: MusicSelection | null;
}
import { FretboardNotePositionService } from './note.service';

@Injectable({ providedIn: 'root' })
export class FretboardStateService {
  private noteService = inject(FretboardNotePositionService);

  notes: GuitarNote[];
  /** Whether there is an active result (notes highlighted/show all) on the fretboard. */
  hasActiveResult = false;
  /** Unified domain model describing what is currently selected. */
  currentSelection: MusicSelection | null = null;
  /** Dual selection state for scale + chord relation. null when no relation is active. */
  scaleChordState: ScaleChordState | null = null;
  /** O(1) lookup map keyed by "${string}-${fret}". Rebuilt when notes are initialized. */
  private notesMap: Map<string, GuitarNote> = new Map();

  constructor() {
    this.notes = this.noteService.getAllPositions();
    this.buildNotesMap();
  }

  /** Populate the O(1) lookup map from the current notes array. */
  private buildNotesMap(): void {
    this.notesMap.clear();
    this.notes.forEach(note => {
      const key = `${note.string}-${note.fret}`;
      this.notesMap.set(key, note);
    });
  }

  applyHighlightedNotes(notes: GuitarNote[]): GuitarNote[] {
    this.notes.forEach(note => {
      note.visible = false;
      note.selected = false;
    });

    notes.forEach(noteToShow => {
      const key = `${noteToShow.string}-${noteToShow.fret}`;
      const note = this.notesMap.get(key);
      if (note) {
        note.visible = true;
        note.selected = true;
      }
    });

    this.hasActiveResult = notes.length > 0;

    return this.notes.filter(note => note.selected);
  }

  hideAllNotes() {
    this.notes.forEach(note => note.visible = false);
  }

  showAll() {
    this.notes.forEach(note => note.visible = true);
    this.hasActiveResult = true;
  }

  clearSelection() {
    this.notes.forEach(note => note.selected = false);
  }

  clearFretboard() {
    this.hideAllNotes();
    this.clearSelection();
    this.hasActiveResult = false;
    this.currentSelection = null;
    this.scaleChordState = null;
    // Note: enabledStrings are NOT reset here — they persist in DomainState until the user manually toggles them.
  }
}
