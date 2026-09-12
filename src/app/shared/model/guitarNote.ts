/**
 * Immutable guitar note on the fretboard.
 *
 * This is an interface (not a class) with readonly fields to enforce
 * immutability. Use createGuitarNote() factory to create instances.
 */
export interface GuitarNote {
  readonly string: number;
  readonly fret: number;
  readonly note: string;
  readonly visible: boolean;
  readonly selected: boolean;
  readonly interval: string;
}

/**
 * Create a new GuitarNote instance.
 * All fields are readonly — once created, the note cannot be mutated.
 */
export function createGuitarNote(
  string: number,
  fret: number,
  note: string,
  visible = true,
  selected = false,
  interval = ''
): GuitarNote {
  return { string, fret, note, visible, selected, interval };
}