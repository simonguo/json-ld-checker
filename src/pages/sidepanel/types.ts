import type { JsonPath } from '@/lib/json-path';

export interface JsonLdData {
  found: boolean;
  count: number;
  data: any[];
}
export type SidePanelView = 'inspector' | 'issues' | 'history' | 'assist';

export interface FocusRequest {
  requestedPath: JsonPath;
  resolvedPath: JsonPath;
  exact: boolean;
  token: number;
}
