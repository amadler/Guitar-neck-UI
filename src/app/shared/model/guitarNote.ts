export class GuitarNote {
  string: number;
  fret: number;
  note: string;
  visible: boolean;
  selected: boolean;
  interval: string;

  constructor(string: number, fret: number, note: string, visible: boolean = true) {
    this.string = string;
    this.fret = fret;
    this.note = note;
    this.visible = visible;
    this.selected = false;
    this.interval = '';
  }
}
