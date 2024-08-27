import { v4 as uuidv4 } from 'uuid';
export class GuitarNote {
  id?: string;
  string: number;
  fret: number;
  note: string;
  visible: boolean;
  selected: boolean;
  isRoot: boolean;
  isFifth: boolean;
  isThird: boolean;
  /// TODO: interwały jako literały



  constructor(string: number, fret: number, note: string, visible: boolean = true) {
    this.id = uuidv4();
    this.string = string;
    this.fret = fret;
    this.note = note;
    this.visible = visible;
    this.selected = false;
    this.isRoot = false;
    this.isFifth = false;
    this.isThird = false;
  }
}
