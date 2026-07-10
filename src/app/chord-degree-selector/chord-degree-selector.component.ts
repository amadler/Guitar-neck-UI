import { Component, EventEmitter, Output } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FretboardStateService } from '../services/guitar-neck.service';
import { CHORD_PATTERNS, SCALE_PATTERNS, neckConfig } from 'guitar-neck-shared';

export interface ChordDegreeSelection {
  /** Display label like "I", "ii", "V", "vii°" */
  label: string;
  /** Chord name from CHORD_PATTERNS (e.g. "major", "minor", "diminished") */
  chordName: string;
  /** Root note of the chord */
  rootNote: string;
}

/**
 * Maps a scale's degree index and mode to a chord type.
 *
 * For major scale (Ionian):
 *   I = major, ii = minor, iii = minor, IV = major,
 *   V = major, vi = minor, vii° = diminished
 *
 * For minor scale (Aeolian):
 *   i = minor, ii° = diminished, III = major, iv = minor,
 *   v = minor, VI = major, VII = major
 */
function getChordTypeForDegree(
  degreeIndex: number,
  scaleType: 'major' | 'minor',
): { label: string; chordName: string } {
  if (scaleType === 'major') {
    const MAP: { label: string; chordName: string }[] = [
      { label: 'I',   chordName: 'major' },
      { label: 'ii',  chordName: 'minor' },
      { label: 'iii', chordName: 'minor' },
      { label: 'IV',  chordName: 'major' },
      { label: 'V',   chordName: 'major' },
      { label: 'vi',  chordName: 'minor' },
      { label: 'vii°', chordName: 'diminished' },
    ];
    return MAP[degreeIndex] ?? MAP[0];
  } else {
    const MAP: { label: string; chordName: string }[] = [
      { label: 'i',   chordName: 'minor' },
      { label: 'ii°', chordName: 'diminished' },
      { label: 'III', chordName: 'major' },
      { label: 'iv',  chordName: 'minor' },
      { label: 'v',   chordName: 'minor' },
      { label: 'VI',  chordName: 'major' },
      { label: 'VII', chordName: 'major' },
    ];
    return MAP[degreeIndex] ?? MAP[0];
  }
}

/**
 * Resolve a degree's root note from the scale root and the scale's interval pattern.
 * Returns the pitch class name (e.g. "C", "F#", "Bb") for the i-th degree (0-indexed).
 */
function getDegreeRootNote(
  scaleRoot: string,
  scalePatternName: string,
  degreeIndex: number,
): string {
  const pattern = SCALE_PATTERNS.find((p: { name: string }) => p.name === scalePatternName);
  if (!pattern) {
    return scaleRoot; // fallback
  }

  const chromatic = neckConfig.chromaticNotes;
  const rootIndex = chromatic.indexOf(scaleRoot);
  if (rootIndex === -1) {
    return scaleRoot;
  }

  let cumulative = 0;
  // Sum intervals up to the desired degree
  for (let i = 0; i < degreeIndex; i++) {
    cumulative += pattern.intervals[i % pattern.intervals.length];
  }

  const noteIndex = (rootIndex + cumulative) % 12;
  return chromatic[noteIndex];
}

/**
 * Heuristic: determine if a scale name is "major-like" or "minor-like".
 * Defaults to 'major' for unknown scales.
 */
function getScaleMode(scaleName: string): 'major' | 'minor' {
  const name = scaleName.toLowerCase();
  const majorLike = [
    'major', 'ionian', 'lydian', 'mixolydian',
    'major-pentatonic', 'whole-tone',
  ];
  const minorLike = [
    'minor', 'dorian', 'phrygian', 'locrian',
    'minor-pentatonic', 'blues-scale',
    'harmonic-minor', 'melodic-minor',
  ];
  if (majorLike.some(k => name.includes(k))) return 'major';
  if (minorLike.some(k => name.includes(k))) return 'minor';
  return 'major'; // default
}

@Component({
  selector: 'app-chord-degree-selector',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './chord-degree-selector.component.html',
  styleUrl: './chord-degree-selector.component.scss',
})
export class ChordDegreeSelectorComponent {
  /** Emitted when the user selects a chord degree from the dropdown. */
  @Output() chordDegreeSelected = new EventEmitter<ChordDegreeSelection>();

  constructor(private fretboardState: FretboardStateService) {}

  get visible(): boolean {
    const sel = this.fretboardState.scaleChordState;
    const result = sel !== null && sel.scale.type === 'scale' && sel.chord === null;
    console.log('[ChordDegreeSelector] visible:', result, 'sel:', JSON.stringify(sel));
    return result;
  }

  get degrees(): ChordDegreeSelection[] {
    const sel = this.fretboardState.scaleChordState;
    if (!sel || sel.scale.type !== 'scale' || !sel.scale.name || !sel.scale.rootNote) {
      return [];
    }

    const scaleMode = getScaleMode(sel.scale.name);
    const totalDegrees = 7;
    const result: ChordDegreeSelection[] = [];

    for (let i = 0; i < totalDegrees; i++) {
      const { label, chordName } = getChordTypeForDegree(i, scaleMode);
      const rootNote = getDegreeRootNote(sel.scale.rootNote, sel.scale.name, i);
      result.push({ label, chordName, rootNote });
    }

    return result;
  }

  onDegreeSelect(degree: ChordDegreeSelection): void {
    this.chordDegreeSelected.emit(degree);
  }

  clearChord(): void {
    if (this.fretboardState.scaleChordState) {
      this.fretboardState.scaleChordState = {
        scale: this.fretboardState.scaleChordState.scale,
        chord: null,
      };
    }
    this.chordDegreeSelected.emit({ label: '', chordName: '', rootNote: '' });
  }
}
