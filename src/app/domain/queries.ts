import { PatternInfo } from '../shared/model/patternInfo';
import { DomainState } from './state';

/**
 * Get the current view state.
 */
export interface GetCurrentViewQuery {
  type: 'get-current-view';
}

/**
 * Get the list of available patterns.
 */
export interface GetAvailablePatternsQuery {
  type: 'get-available-patterns';
}

/**
 * Get details for a specific pattern.
 */
export interface GetPatternDetailsQuery {
  type: 'get-pattern-details';
  patternType: 'scale' | 'chord';
  patternName: string;
  rootNote: string;
}

// ─── Nowe kwerendy ────────────────────────────────────────────────────

/**
 * Detect chord name(s) from a list of notes.
 * Uses @tonaljs/chord-detect.
 */
export interface DetectChordQuery {
  type: 'detect-chord';
  notes: string[];
}

/**
 * Detect scale name(s) from a list of notes.
 * Uses @tonaljs/scale.detect().
 */
export interface DetectScaleQuery {
  type: 'detect-scale';
  notes: string[];
  tonic?: string;
  match?: 'exact' | 'fit';
}

/**
 * Get full key analysis (scale, triads, chords, secondary dominants, etc.).
 * Uses @tonaljs/key.
 */
export interface GetKeyAnalysisQuery {
  type: 'get-key-analysis';
  tonic: string;
  mode: 'major' | 'minor';
}

/**
 * Get available shapes from the shape registry.
 */
export interface GetAvailableShapesQuery {
  type: 'get-available-shapes';
  category?: 'cowboy' | 'barre' | 'triad-inversion' | 'caged' | 'custom';
}

/**
 * Resolve a shape to concrete positions without displaying.
 */
export interface ResolveShapeQuery {
  type: 'resolve-shape-query';
  shapeId: string;
  rootNote?: string;
  position?: number;
}

/**
 * A domain query reads state without changing it.
 */
export type DomainQuery =
  | GetCurrentViewQuery
  | GetAvailablePatternsQuery
  | GetPatternDetailsQuery
  | DetectChordQuery
  | DetectScaleQuery
  | GetKeyAnalysisQuery
  | GetAvailableShapesQuery
  | ResolveShapeQuery;

/**
 * Result types for queries.
 */
export type GetCurrentViewResult = DomainState;
export type GetAvailablePatternsResult = { scales: string[]; chords: string[] };
export type GetPatternDetailsResult = PatternInfo;
export type DetectChordResult = { chords: string[] };
export type DetectScaleResult = { scales: string[] };
export type GetKeyAnalysisResult = Record<string, unknown>;
export type GetAvailableShapesResult = { shapes: Array<{ id: string; name: string; category: string }> };
export type ResolveShapeQueryResult = { positions: Array<{ string: number; fret: number; label?: string }> };