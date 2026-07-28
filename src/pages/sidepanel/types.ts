import type { JsonPath } from '@/lib/json-path';
import type { JsonLdScanResult } from '@/lib/json-ld';

export type JsonLdData = JsonLdScanResult;
export type SidePanelView = 'inspector' | 'issues' | 'history' | 'assist';

export interface FocusRequest {
  requestedPath: JsonPath;
  resolvedPath: JsonPath;
  exact: boolean;
  token: number;
}
