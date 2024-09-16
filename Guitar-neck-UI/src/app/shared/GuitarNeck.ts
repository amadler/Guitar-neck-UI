/**
 * Represents a guitar neck.
 */

import { NeckConfig } from "./model/neckConfig";

class GuitarNeck {
  private neckConfig: NeckConfig;
  private stringNotes: string[];
  private frets: number;
  private chromaticNotes: string[];
  public guitarNeckArray: string[][]


  constructor(neckConfig: any) {
    this.neckConfig = neckConfig;
    this.stringNotes = this.neckConfig.stringNotes;
    this.frets = this.neckConfig.numberOfFrets;
    this.chromaticNotes = this.neckConfig.chromaticNotes;
    this.guitarNeckArray = this.createguitarNeckArray();
    //console.log("guitarNeckArray", this.guitarNeckArray);
  }

  /**
   * Creates a two-dimensional array representing the guitar neck.
   * Each element in the array represents a fret on a string of the guitar.
   * @returns The guitar neck array.
   */
   private createguitarNeckArray(): string[][] {
    const neck: string[][] = [];
    for (let i = 0; i < this.stringNotes.length; i++) {
      const stringNote = this.stringNotes[i];
      const string: string[] = [];
      const startNoteIndex = this.chromaticNotes.indexOf(stringNote);
      for (let j = 0; j < this.frets; j++) {
        const noteIndex = (startNoteIndex + j) % this.chromaticNotes.length;
        const note = this.chromaticNotes[noteIndex];
        string.push(note);
      }
      neck.push(string);
    }
    return neck;
  }

}

export default GuitarNeck;
