export type QueryTypes = 'scale' | 'chord' | 'basic' | 'custom';

export interface ToolboxSearchQuery {
  musicElements: string;
  keys: string;
  type: QueryTypes;
}
