
export interface NeckConfig {
  stringNotes: string[];
  chromaticNotes: string[];
  numberOfFrets: number;
  numberOfStrings: number;
  markedFrets: number[];
  markedTwelffeFrets: number[];
}

/**
 * Represents the configuration for a guitar neck.
 */
export const neckConfig: NeckConfig = {
  /**
   * The notes of the open strings from lowest to highest.
   */
  stringNotes: ["E", "B", "G", "D", "A", "E"],
  /**
   * The notes of the fretted positions on the neck.
   */
  chromaticNotes: [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ],
  /**
   * The number of frets on the neck (from 0).
   */
  numberOfFrets: 24,
  numberOfStrings: 6,
  markedFrets: [3, 5, 7, 9, 15, 17, 19, 21],
  markedTwelffeFrets: [12,24],
};
