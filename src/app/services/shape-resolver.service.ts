import { Injectable } from '@angular/core';
import { neckConfig } from 'guitar-neck-shared';
import { GuitarShape, findShapeById, getShapesByCategory } from '../shared/model/guitar-shapes';

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
  private readonly chromaticNotes = neckConfig.chromaticNotes;

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

    // Cowboy chords: fixed position
    if (shape.category === 'cowboy') {
      const fixedFret = shape.fixedFret ?? 0;
      return {
        success: true,
        positions: shape.positions.map(p => ({
          string: p.string,
          fret: p.fretOffset + fixedFret,
          label: p.label,
        })),
        rootNote: rootNote,
      };
    }

    // Movable shapes (barre, triad-inversion): need rootNote or position
    const fretPosition = position ?? 0;

    if (shape.category === 'barre' || shape.category === 'triad-inversion') {
      // If rootNote is given, calculate the fret position from the root string
      let baseFret = fretPosition;

      if (rootNote) {
        const rootIndex = this.chromaticNotes.indexOf(rootNote);
        if (rootIndex === -1) {
          return {
            success: false,
            positions: [],
            message: `Invalid root note: "${rootNote}".`,
          };
        }

        // Find the open string note for the root string
        const openStringNote = neckConfig.stringNotes[shape.rootString - 1];
        const openIndex = this.chromaticNotes.indexOf(openStringNote);
        if (openIndex === -1) {
          return {
            success: false,
            positions: [],
            message: `Cannot determine open note for string ${shape.rootString}.`,
          };
        }

        // Calculate fret: semitone distance from open string to root note
        baseFret = (rootIndex - openIndex + 12) % 12;
      }

      return {
        success: true,
        positions: shape.positions.map(p => ({
          string: p.string,
          fret: p.fretOffset + baseFret,
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