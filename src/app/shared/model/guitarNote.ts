import { v4 as uuidv4 } from 'uuid';
export class GuitarNote {
  id?: string;
  string: number;
  fret: number;
  note: string;
  visible: boolean;
  selected: boolean;
  interval: string;

  constructor(string: number, fret: number, note: string, visible: boolean = true) {
    this.id = uuidv4();
    this.string = string;
    this.fret = fret;
    this.note = note;
    this.visible = visible;
    this.selected = false;
    this.interval = '';
  }
}
