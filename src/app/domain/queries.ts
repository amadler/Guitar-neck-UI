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

/**
 * A domain query reads state without changing it.
 */
export type DomainQuery =
  | GetCurrentViewQuery
  | GetAvailablePatternsQuery
  | GetPatternDetailsQuery;

/**
 * Result types for queries.
 */
export type GetCurrentViewResult = DomainState;
export type GetAvailablePatternsResult = { scales: string[]; chords: string[] };
export type GetPatternDetailsResult = PatternInfo;