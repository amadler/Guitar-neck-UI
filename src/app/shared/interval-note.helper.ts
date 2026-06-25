import { neckConfig } from 'guitar-neck-shared';

export function calculateNotesFromIntervals(rootNote: string, intervals: number[]): string[] {
  const chromaticScale = neckConfig.chromaticNotes;
  const rootIndex = chromaticScale.indexOf(rootNote);
  if (rootIndex === -1) {
    return [];
  }

  const notes = [rootNote];
  let currentIndex = rootIndex;

  for (const interval of intervals) {
    currentIndex = (currentIndex + interval) % 12;
    notes.push(chromaticScale[currentIndex]);
  }

  return notes;
}
