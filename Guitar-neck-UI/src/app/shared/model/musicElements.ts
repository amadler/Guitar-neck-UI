export interface ToolboxSearchQuery {
  musicElements: string;
  keys: string;
  type: QueryTypes;
}
export type QueryTypes = 'scale' | 'chord' | 'basic'
