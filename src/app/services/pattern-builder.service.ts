import { Injectable, inject } from '@angular/core';
import { neckConfig, CHORD_PATTERNS, SCALE_PATTERNS } from 'guitar-neck-shared';
import { PatternInfo } from '../shared/model/patternInfo';
import { MusicSelection } from '../shared/model/music-selection';
import { FretboardStateService } from './fretboard-state.service';
import { resolveNotesFromIntervals } from '../shared/pattern-resolver';
import { INTERVAL_CONFIG } from '../shared/tonal-adapter';

/** Maps semitone → interval symbol. Derived from INTERVAL_CONFIG. */
const SEMITONE_TO_INTERVAL: Record<number, string> =
  Object.fromEntries(INTERVAL_CONFIG.map(i => [i.semitone, i.symbol]));

@Injectable({ providedIn: 'root' })
export class PatternBuilderService {
  private fretboardState = inject(FretboardStateService);

  currentPattern: PatternInfo | null = null;
  /** Chord pattern info when a scale+chord relation is active. */
  relatedChord: PatternInfo | null = null;

  setCurrentPattern(patternName: string, rootNote: string, type: 'scale' | 'chord'): void {
    const patterns = type === 'scale' ? SCALE_PATTERNS : CHORD_PATTERNS;
    const pattern = patterns.find(p => p.name === patternName);
    if (!pattern) {
      this.currentPattern = null;
      this.fretboardState.currentSelection = null;
      return;
    }

    const rootIndex = neckConfig.chromaticNotes.indexOf(rootNote);
    if (rootIndex === -1) {
      this.currentPattern = null;
      this.fretboardState.currentSelection = null;
      return;
    }

    const notes = resolveNotesFromIntervals(rootNote, pattern.intervals);
    const intervals: string[] = ['1'];
    const semitones: number[] = [0];
    const steps: string[] = [];
    let cumulative = 0;

    pattern.intervals.forEach((step: number) => {
      cumulative += step;
      semitones.push(cumulative);
      steps.push(step === 2 ? 'W' : step === 1 ? 'H' : `W+H`);
      intervals.push(SEMITONE_TO_INTERVAL[cumulative % 12] || '');
    });

    this.currentPattern = { name: patternName, rootNote, type, notes, intervals, semitones, steps };
    this.fretboardState.currentSelection = {
      type,
      name: patternName,
      rootNote,
      notes,
      intervals: semitones,
    };
  }

  /** Build a PatternInfo for a chord in the context of an active scale relation. */
  setRelatedChord(chordName: string, rootNote: string): void {
    const pattern = CHORD_PATTERNS.find(p => p.name === chordName);
    if (!pattern) {
      this.relatedChord = null;
      return;
    }

    const rootIndex = neckConfig.chromaticNotes.indexOf(rootNote);
    if (rootIndex === -1) {
      this.relatedChord = null;
      return;
    }

    const notes = resolveNotesFromIntervals(rootNote, pattern.intervals);
    const intervals: string[] = ['1'];
    const semitones: number[] = [0];
    const steps: string[] = [];
    let cumulative = 0;

    pattern.intervals.forEach((step: number) => {
      cumulative += step;
      semitones.push(cumulative);
      steps.push(step === 2 ? 'W' : step === 1 ? 'H' : `W+H`);
      intervals.push(SEMITONE_TO_INTERVAL[cumulative % 12] || '');
    });

    this.relatedChord = {
      name: chordName,
      rootNote,
      type: 'chord',
      notes,
      intervals,
      semitones,
      steps,
    };
  }

  clearCurrentPattern(): void {
    this.currentPattern = null;
    this.relatedChord = null;
    this.fretboardState.currentSelection = null;
  }
}
