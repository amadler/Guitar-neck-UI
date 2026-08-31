import { Injectable } from '@angular/core';
import { get as scaleGet } from '@tonaljs/scale';
import { get as chordGet } from '@tonaljs/chord';
import { simplify } from '@tonaljs/note';
import { fromSemitones } from '@tonaljs/interval';
import { CHORD_PATTERNS, SCALE_PATTERNS, neckConfig } from 'guitar-neck-shared';
import {
  CHORD_NAME_TO_TONAL,
  SCALE_NAME_TO_TONAL,
  SCALES_NOT_IN_TONAL,
  CHORDS_NOT_IN_TONAL,
  INTERVAL_MAP,
} from '../shared/tonal-adapter';
import { resolveNotesFromIntervals } from '../shared/pattern-resolver';
import { noteToChroma } from '../shared/note-utils';

export type PatternType = 'scale' | 'chord';

export interface ResolvedPattern {
  simplified: string[];
  raw: string[];
}

/**
 * TonalFacadeService — jedyne miejsce w aplikacji które importuje Tonal.js.
 *
 * Odpowiedzialności:
 * 1. Kalkulacja nut skali/akordu przez Tonal.js z fallbackiem do CHORD_PATTERNS/SCALE_PATTERNS
 * 2. Mapowanie nazw patternów (UI → Tonal) przez tonal-adapter.ts
 * 3. Chroma (pitch class) — enharmonicznie bezpieczne porównywanie nut
 * 4. Interwały między nutami
 *
 * Żaden inny serwis ani komponent nie importuje @tonaljs/* bezpośrednio.
 */
@Injectable({ providedIn: 'root' })
export class TonalFacadeService {

  /**
   * Rozwiązuje pattern (skalę lub akord) na tablicę nut.
   * Używa Tonal.js jeśli pattern istnieje, fallback do CHORD_PATTERNS/SCALE_PATTERNS.
   */
  resolvePattern(patternName: string, rootNote: string, type: PatternType): ResolvedPattern {
    if (type === 'scale') {
      return this.resolveScaleNotes(patternName, rootNote);
    }
    return this.resolveChordNotes(patternName, rootNote);
  }

  /**
   * Zwraca pitch class (0-11) dla nazwy nuty.
   * Enharmonicznie bezpieczne: C# i Db → 1.
   */
  chroma(noteName: string): number {
    return noteToChroma(noteName);
  }

  /**
   * Oblicza interwał między dwiema nutami (spelling-independent).
   * Używa chroma (pitch class) zamiast spellingu — C→D# i C→Eb dają '3m'.
   * Zwraca format Tonal (np. '3M', '5P') lub '' jeśli nieznane.
   */
  intervalBetween(rootNote: string, otherNote: string): string {
    const rootChroma = noteToChroma(rootNote);
    const otherChroma = noteToChroma(otherNote);
    if (rootChroma === -1 || otherChroma === -1) return '';
    const semitones = (otherChroma - rootChroma + 12) % 12;
    return fromSemitones(semitones);
  }

  /**
   * Mapuje interwał Tonal (np. '3M') na nazwę UI (np. 'major-3rd').
   */
  mapInterval(tonalInterval: string): string {
    return INTERVAL_MAP[tonalInterval] || '';
  }

  /**
   * Upraszcza nazwę nuty (C# → Db).
   */
  simplifyNote(noteName: string): string {
    return simplify(noteName);
  }

  // ---- Private helpers ----

  private resolveScaleNotes(scaleName: string, rootNote: string): ResolvedPattern {
    if (SCALES_NOT_IN_TONAL.has(scaleName)) {
      return this.resolveFromPatterns(scaleName, rootNote, SCALE_PATTERNS);
    }

    const tonalName = SCALE_NAME_TO_TONAL[scaleName] || scaleName.replace(/-/g, ' ');
    const result = scaleGet(`${rootNote} ${tonalName}`);
    if (result.empty) {
      console.warn(`[TonalFacadeService] Unknown scale: ${scaleName} (tried Tonal: ${tonalName})`);
      return this.resolveFromPatterns(scaleName, rootNote, SCALE_PATTERNS);
    }
    const raw = result.notes;
    const simplified = raw.map((n: string) => simplify(n));
    return { simplified, raw };
  }

  private resolveChordNotes(chordType: string, rootNote: string): ResolvedPattern {
    // add11: Tonal doesn't have it
    if (chordType === 'add11') {
      const chromatic = neckConfig.chromaticNotes;
      const rootIndex = chromatic.indexOf(rootNote);
      if (rootIndex === -1) return { simplified: [], raw: [] };
      const notes = [
        chromatic[rootIndex],
        chromatic[(rootIndex + 4) % 12],
        chromatic[(rootIndex + 7) % 12],
        chromatic[(rootIndex + 5) % 12],
      ];
      const deduped = [...new Set(notes)];
      return { simplified: deduped, raw: deduped };
    }

    if (CHORDS_NOT_IN_TONAL.has(chordType)) {
      return this.resolveFromPatterns(chordType, rootNote, CHORD_PATTERNS);
    }

    const tonalName = CHORD_NAME_TO_TONAL[chordType];
    if (!tonalName) {
      console.warn(`[TonalFacadeService] Unknown chord mapping: ${chordType}`);
      return this.resolveFromPatterns(chordType, rootNote, CHORD_PATTERNS);
    }

    const result = chordGet(`${rootNote}${tonalName}`);
    if (result.empty) {
      console.warn(`[TonalFacadeService] Tonal returned empty for: ${chordType} → ${tonalName}`);
      return this.resolveFromPatterns(chordType, rootNote, CHORD_PATTERNS);
    }
    const raw = result.notes;
    const simplified = raw.map((n: string) => simplify(n));
    return { simplified, raw };
  }

  private resolveFromPatterns(
    patternName: string,
    rootNote: string,
    patterns: Array<{ name: string; intervals: number[] }>,
  ): ResolvedPattern {
    const pattern = patterns.find(p => p.name === patternName);
    if (!pattern) {
      console.warn(`[TonalFacadeService] Pattern not found in fallback: ${patternName}`);
      return { simplified: [], raw: [] };
    }

    const notes = resolveNotesFromIntervals(rootNote, pattern.intervals);
    return { simplified: notes, raw: notes };
  }
}