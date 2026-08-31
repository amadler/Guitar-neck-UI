/* GuitarNeckService zarządza stanem gryfu.*/
import { Injectable } from '@angular/core';
import { neckConfig } from 'guitar-neck-shared';
import { GuitarNote } from '../shared/model/guitarNote';
import { MusicSelection } from '../shared/model/music-selection';

/** Dual selection state when both a scale and a chord are displayed. */
export interface ScaleChordState {
  scale: MusicSelection;
  chord: MusicSelection | null;
}
import { FretboardNotePositionService } from './note.service';

export type MarkerDisplayMode = 'interval-colors' | 'note-names' | 'neutral-dots';

@Injectable({ providedIn: 'root' })
export class FretboardStateService {
  notes: GuitarNote[];
  /** Per-string active state. true = show notes on this string. Reset on clearFretboard(). */
  activeStrings: boolean[];
  /** Which visual mode the fretboard markers use. */
  markerDisplayMode: MarkerDisplayMode = 'interval-colors';
  /** Whether there is an active result (notes highlighted/show all) on the fretboard. */
  hasActiveResult = false;
  /** Unified domain model describing what is currently selected. */
  currentSelection: MusicSelection | null = null;
  /** Dual selection state for scale + chord relation. null when no relation is active. */
  scaleChordState: ScaleChordState | null = null;
  /** O(1) lookup map keyed by "${string}-${fret}". Rebuilt when notes are initialized. */
  private notesMap: Map<string, GuitarNote> = new Map();

  constructor(
    private noteService: FretboardNotePositionService,
  ) {
    this.notes = this.noteService.getAllPositions();
    this.activeStrings = neckConfig.stringNotes.map(() => true);
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

  /** Toggle a single string on/off. Used by StringToggleComponent events. */
  toggleString(index: number, active: boolean): void {
    if (index >= 0 && index < this.activeStrings.length) {
      this.activeStrings[index] = active;
    }
  }

  /** Reset all strings to active. Called on clearFretboard(). */
  private resetActiveStrings(): void {
    this.activeStrings = neckConfig.stringNotes.map(() => true);
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
    // Note: activeStrings are NOT reset here — they persist until the user manually toggles them.
  }
}
