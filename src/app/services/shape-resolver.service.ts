import { Injectable } from '@angular/core';
import { neckConfig } from 'guitar-neck-shared';
import { GuitarShape, findShapeById, getShapesByCategory } from '../shared/model/guitar-shapes';
import { noteToChroma } from '../shared/note-utils';

export interface ShapeResolutionResult {
  success: boolean;
  positions: Array<{ string: number; fret: number; label?: string }>;
  rootNote?: string;
  message?: string;
}

/**
 * ShapeResolverService — rozwijanie nazwanych kształtów na konkretne pozycje na gryfie.
 *
 * Kształty są zdefiniowane jako DANE w guitar-shapes.ts.
 * Ten serwis tylko je rozwija (przesuwa, transponuje) na konkretne progi.
 */
@Injectable({ providedIn: 'root' })
export class ShapeResolverService {
  /**
   * Rozwijanie kształtu na konkretne pozycje.
   *
   * @param shapeId - ID kształtu (np. 'cowboy-C', 'barre-E-form')
   * @param rootNote - Root note dla movable shapes (np. 'F' dla barre F-dur)
   * @param position - Fret position dla movable shapes (0 = open)
   * @returns ShapeResolutionResult z pozycjami lub błędem
   */
  resolveShape(
    shapeId: string,
    rootNote?: string,
    position?: number,
  ): ShapeResolutionResult {
    const shape = findShapeById(shapeId);
    if (!shape) {
      return {
        success: false,
        positions: [],
        message: `Shape not found: "${shapeId}". Available shapes: ${getShapesByCategory().map(s => s.id).join(', ')}`,
      };
    }

    // Cowboy chords: fixed position with own rootNote/chordType
    if (shape.category === 'cowboy') {
      // Prevent inconsistent state: cowboy shape has its own rootNote
      if (shape.rootNote && rootNote && shape.rootNote !== rootNote) {
        return {
          success: false,
          positions: [],
          message: `Shape "${shape.id}" has fixed rootNote "${shape.rootNote}". Cannot override with rootNote "${rootNote}".`,
        };
      }
      const fixedFret = shape.fixedFret ?? 0;
      return {
        success: true,
        positions: shape.positions.map(p => ({
          string: p.string,
          fret: p.fretOffset + fixedFret,
          label: p.label,
        })),
        rootNote: shape.rootNote ?? rootNote,
      };
    }

    // Movable shapes (barre, caged): require rootNote
    if (shape.category === 'barre' || shape.category === 'caged') {
      if (!rootNote) {
        return {
          success: false,
          positions: [],
          message: `Barre shape "${shape.id}" requires rootNote.`,
        };
      }

      // Use chroma (pitch class) for enharmonic-safe note lookup
      const rootChroma = noteToChroma(rootNote);
      if (rootChroma === -1) {
        return {
          success: false,
          positions: [],
          message: `Invalid root note: "${rootNote}".`,
        };
      }

      // Find the open string note for the root string
      const openStringNote = neckConfig.stringNotes[shape.rootString - 1];
      const openChroma = noteToChroma(openStringNote);
      if (openChroma === -1) {
        return {
          success: false,
          positions: [],
          message: `Cannot determine open note for string ${shape.rootString}.`,
        };
      }

      // Calculate fret: semitone distance from open string to root note
      let rootFret = (rootChroma - openChroma + 12) % 12;

      // For shapes with baseFret (e.g. CAGED C-form, G-form), the root is not
      // at the lowest fret. Positions are normalised so fretOffset 0 = lowest fret.
      // actualFret = rootFret - baseFret + fretOffset
      const baseFret = shape.baseFret ?? 0;

      // If rootFret < baseFret, the lowest fret of the shape would be negative.
      // Shift up one octave so the whole shape fits on the fretboard.
      if (rootFret < baseFret) {
        rootFret += 12;
      }

      return {
        success: true,
        positions: shape.positions.map(p => ({
          string: p.string,
          fret: rootFret - baseFret + p.fretOffset,
          label: p.label,
        })),
        rootNote: rootNote,
      };
    }

    // Custom shapes: just use the position offset
    return {
      success: true,
      positions: shape.positions.map(p => ({
        string: p.string,
        fret: (p.fretOffset ?? 0) + (position ?? 0),
        label: p.label,
      })),
      rootNote: rootNote,
    };
  }

  /**
   * Lista dostępnych kształtów.
   */
  getAvailableShapes(category?: string): Array<{ id: string; name: string; category: string }> {
    return getShapesByCategory(category).map(s => ({
      id: s.id,
      name: s.name,
      category: s.category,
    }));
  }

  /**
   * Pobierz kształt po ID.
   */
  getShapeById(shapeId: string): GuitarShape | undefined {
    return findShapeById(shapeId);
  }
}