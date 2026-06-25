export type QueryTypes = 'scale' | 'chord' | 'basic' | 'custom';

export interface CustomToolboxSearchQuery {
  type: 'custom';
  musicElements: number[];
  keys: string;
}

export interface ToolboxSearchQuery {
  musicElements: string | number[];
  keys: string;
  type: QueryTypes;
}

export function isCustomToolboxSearchQuery(event: ToolboxSearchQuery): event is CustomToolboxSearchQuery {
  return event.type === 'custom' && Array.isArray(event.musicElements);
}
