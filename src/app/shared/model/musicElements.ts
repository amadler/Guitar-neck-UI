export type QueryTypes = 'scale' | 'chord' | 'basic' | 'custom';

export interface ToolboxSearchQuery {
  musicElements: string | number[];
  keys: string;
  type: QueryTypes;
}
