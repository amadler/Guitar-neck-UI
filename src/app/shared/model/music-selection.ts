export type MusicSelectionType = 'scale' | 'chord' | 'note' | 'custom' | 'all-notes';

export interface MusicSelection {
  type: MusicSelectionType;
  name?: string;        // pattern name for scale/chord
  rootNote?: string;    // root/tonic note
  notes?: string[];     // resolved note names
  intervals?: number[]; // semitone intervals for custom patterns
}
