export type ToolboxIntent = 'show' | 'compare' | 'shape';

export type ShowKind = 'chord' | 'scale' | 'interval';
export type ShapeCategory = 'cowboy' | 'barre' | 'triad-inversion';
export type MusicKey =
  | 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F'
  | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export type Interval =
  | '1' | 'b2' | '2' | 'b3' | '3' | '4'
  | 'b5' | '5' | 'b6' | '6' | 'b7' | '7';

export interface ShowScaleCommand {
  kind: Extract<ShowKind, 'scale'>;
  key: MusicKey;
  scaleType: string;
}

export interface ShowChordCommand {
  kind: Extract<ShowKind, 'chord'>;
  key: MusicKey;
  chordType: string;
}

export interface ShowIntervalCommand {
  kind: Extract<ShowKind, 'interval'>;
  key: MusicKey;
  interval: Interval;
}

export type ShowCommand = ShowScaleCommand | ShowChordCommand | ShowIntervalCommand;

export interface CompareCommand {
  kind: 'scaleChordRelation';

  scaleKey: MusicKey;
  scaleType: string;

  chordKey: MusicKey;
  chordType: string;
}

export type FretboardCommand =
  | ShowScaleCommand
  | ShowChordCommand
  | ShowIntervalCommand
  | CompareCommand;