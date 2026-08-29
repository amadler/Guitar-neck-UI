import { neckConfig } from 'guitar-neck-shared';

/**
 * Resolves note names from a root note and a list of semitone intervals.
 *
 * @param rootNote - The root/tonic note (e.g. "C", "F#")
 * @param intervals - Semitone steps from the root (e.g. [4, 7] for major triad)
 * @param chromatic - Optional chromatic scale (defaults to neckConfig.chromaticNotes)
 * @returns Deduplicated array of note names in order of discovery
 *
 * @example
 * resolveNotesFromIntervals('C', [4, 7]) // → ['C', 'E', 'G']
 * resolveNotesFromIntervals('C', [2, 4, 5, 7, 9, 11]) // → ['C', 'D', 'E', 'F', 'G', 'A', 'B']
 */
export function resolveNotesFromIntervals(
  rootNote: string,
  intervals: number[],
  chromatic: string[] = neckConfig.chromaticNotes,
): string[] {
  const rootIndex = chromatic.indexOf(rootNote);
  if (rootIndex === -1) return [];

  const notes: string[] = [rootNote];
  let cumulative = 0;

  for (const step of intervals) {
    cumulative += step;
    notes.push(chromatic[(rootIndex + cumulative) % 12]);
  }

  // Deduplicate while preserving order
  return [...new Set(notes)];
}