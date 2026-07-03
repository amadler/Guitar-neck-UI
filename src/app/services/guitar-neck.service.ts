/* GuitarNeckService zarządza stanem gryfu.*/
import { Injectable } from '@angular/core';
import { neckConfig, CHORD_PATTERNS, SCALE_PATTERNS } from 'guitar-neck-shared';
import { GuitarNote } from '../shared/model/guitarNote';
import { PatternInfo } from '../shared/model/patternInfo';
import { FretboardNotePositionService } from './note.service';
import { IntervalService } from './interval.service';

export type MarkerDisplayMode = 'interval-colors' | 'note-names' | 'neutral-dots';

const SEMITONE_TO_INTERVAL: Record<number, string> = {
  0: '1',
  1: 'b2',
  2: '2',
  3: 'b3',
  4: '3',
  5: '4',
  6: 'b5',
  7: '5',
  8: 'b6',
  9: '6',
  10: 'b7',
  11: '7',
};

@Injectable({ providedIn: 'root' })
export class FretboardStateService {
  notes: GuitarNote[];
  strings = neckConfig.stringNotes;
  frets = Array.from({ length: neckConfig.numberOfFrets }, (_, i) => i + 1);
  /** Per-string active state. true = show notes on this string. Reset on clearFretboard(). */
  activeStrings: boolean[];
  /** Which visual mode the fretboard markers use. */
  markerDisplayMode: MarkerDisplayMode = 'interval-colors';
  /** Whether there is an active result (notes highlighted/show all) on the fretboard. */
  hasActiveResult = false;
  /** Current pattern info for the pattern display panel. */
  currentPattern: PatternInfo | null = null;

  constructor(
    private noteService: FretboardNotePositionService,
    private intervalService: IntervalService
  ) {
    this.notes = this.noteService.getAllPositions();
    this.activeStrings = this.strings.map(() => true);
  }

  private isMatchingNoteOnFret(note: GuitarNote, stringIndex: number, fret: number) {
    return note.string === stringIndex + 1 && note.fret === fret && note.visible;
  }

  isNoteOnFret(stringIndex: number, fret: number): boolean {
    if (stringIndex >= 0 && !this.activeStrings[stringIndex]) {
      return false;
    }
    return this.notes.some(note => this.isMatchingNoteOnFret(note, stringIndex, fret));
  }

  getNote(stringIndex: number, fret: number): GuitarNote | undefined {
    return this.notes.find(note => this.isMatchingNoteOnFret(note, stringIndex, fret));
  }

  getNoteName(stringIndex: number, fret: number): string {
    const note = this.notes.find(note => this.isMatchingNoteOnFret(note, stringIndex, fret));
    return note ? note.note : '';
  }

  applyHighlightedNotes(notes: GuitarNote[]): GuitarNote[] {
    this.notes.forEach(note => {
        note.visible = false;
        note.selected = false;
    });

    notes.forEach(noteToShow => {
        const matchingNotes = this.notes.filter(n =>
            n.note === noteToShow.note &&
            n.string === noteToShow.string
        );

        matchingNotes.forEach(note => {
            note.visible = true;
            note.selected = true;
        });
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
    this.activeStrings = this.strings.map(() => true);
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

  fretNoteClicked(stringIndex: number, fret: number): GuitarNote | null {
    return this.notes.find(note => this.isMatchingNoteOnFret(note, stringIndex, fret)) || null;
  }

  /** Return the CSS class string for a note marker based on the current display mode. */
  getMarkerCssClass(interval: string | undefined): string {
    if (this.markerDisplayMode === 'interval-colors' && interval) {
      return 'guitar-neck__' + interval;
    }
    if (this.markerDisplayMode === 'note-names') {
      return 'guitar-neck__neutral';
    }
    // neutral-dots: visible white dots using dedicated CSS class
    return 'guitar-neck__neutral-dot';
  }

  /** Whether note labels should be visible inside markers. */
  get showNoteLabels(): boolean {
    return this.markerDisplayMode !== 'neutral-dots';
  }

  /** Collect unique interval names from currently selected notes. */
  getActiveIntervals(): string[] {
    const intervalSet = new Set<string>();
    if (!this.hasActiveResult) {
      return [];
    }
    this.notes.forEach(note => {
      if (note.selected && note.interval) {
        intervalSet.add(note.interval);
      }
    });
    return Array.from(intervalSet);
  }

  /**
   * Build and store PatternInfo for the currently selected scale/chord.
   * Called from HomePageComponent after a toolbox submit.
   */
  setCurrentPattern(patternName: string, rootNote: string, type: 'scale' | 'chord'): void {
    const patterns = type === 'scale' ? SCALE_PATTERNS : CHORD_PATTERNS;
    const pattern = patterns.find(p => p.name === patternName);
    if (!pattern) {
      this.currentPattern = null;
      return;
    }

    const rootIndex = neckConfig.chromaticNotes.indexOf(rootNote);
    if (rootIndex === -1) {
      this.currentPattern = null;
      return;
    }

    const chromatic = neckConfig.chromaticNotes;
    const notes: string[] = [rootNote];
    const intervals: string[] = ['1'];
    const semitones: number[] = [0];
    const steps: string[] = [];
    let cumulative = 0;

    pattern.intervals.forEach((step: number) => {
      cumulative += step;
      const noteIndex = (rootIndex + cumulative) % 12;
      notes.push(chromatic[noteIndex]);
      semitones.push(cumulative);
      steps.push(step === 2 ? 'W' : step === 1 ? 'H' : `W+H`);
      intervals.push(SEMITONE_TO_INTERVAL[cumulative % 12] || '');
    });

    this.currentPattern = { name: patternName, rootNote, type, notes, intervals, semitones, steps };
  }

  clearCurrentPattern(): void {
    this.currentPattern = null;
  }

  clearFretboard() {
    this.intervalService.removeIntervals(this.notes);
    this.hideAllNotes();
    this.clearSelection();
    this.hasActiveResult = false;
    this.currentPattern = null;
    // Note: activeStrings are NOT reset here — they persist until the user manually toggles them.
  }
}
