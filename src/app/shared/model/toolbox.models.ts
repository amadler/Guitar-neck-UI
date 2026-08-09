export interface ToolboxSearchQuery {
  musicElements: string | number[];
  keys: string;
  type: 'scale' | 'chord' | 'basic' | 'custom';
}

export interface ScaleChordRelation {
  scaleName: string;
  scaleRoot: string;
  chordName: string;
  chordRoot: string;
}
