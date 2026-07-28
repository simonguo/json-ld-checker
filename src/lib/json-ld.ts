import type { JsonPath } from './json-path';

export interface JsonLdParseError {
  message: string;
  line: number;
  column: number;
  position: number;
  excerpt: string;
  pointer: string;
}

export interface JsonLdEntity {
  id: string;
  blockIndex: number;
  path: JsonPath;
  data: any;
  schemaTypes: string[];
}

export interface JsonLdBlock {
  id: string;
  index: number;
  raw: string;
  script: string;
  parsed?: unknown;
  entityIds: string[];
  parseError?: JsonLdParseError;
}

export type JsonLdInspectionItem =
  | {
      kind: 'entity';
      id: string;
      blockIndex: number;
      path: JsonPath;
      raw: string;
      data: any;
      schemaTypes: string[];
    }
  | {
      kind: 'parse-error';
      id: string;
      blockIndex: number;
      path: JsonPath;
      raw: string;
      parseError: JsonLdParseError;
      schemaTypes: [];
    };

export interface JsonLdScanResult {
  found: boolean;
  blockCount: number;
  count: number;
  blocks: JsonLdBlock[];
  entities: JsonLdEntity[];
  items: JsonLdInspectionItem[];
  data: any[];
  rawTexts: string[];
}

const getSchemaTypes = (value: any): string[] => {
  const type = value?.['@type'];
  if (Array.isArray(type)) return type.filter((item): item is string => typeof item === 'string');
  return typeof type === 'string' ? [type] : [];
};

const positionFromLineAndColumn = (source: string, line: number, column: number) => {
  const lines = source.split('\n');
  let position = 0;
  for (let index = 0; index < Math.max(0, line - 1); index += 1) {
    position += (lines[index]?.length || 0) + 1;
  }
  return Math.min(source.length, position + Math.max(0, column - 1));
};

export function locateJsonParseError(source: string, error: unknown): JsonLdParseError {
  const message = error instanceof Error ? error.message : String(error || 'Invalid JSON');
  const positionMatch = message.match(/position\s+(\d+)/i);
  const lineColumnMatch = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);
  const lineMatch = message.match(/line\s+(\d+)/i);
  const columnMatch = message.match(/column\s+(\d+)/i);

  let line = Number(lineColumnMatch?.[1] || lineMatch?.[1] || 0);
  let column = Number(lineColumnMatch?.[2] || columnMatch?.[1] || 0);
  let position = Number(positionMatch?.[1] || -1);

  if (position < 0 && line > 0 && column > 0) {
    position = positionFromLineAndColumn(source, line, column);
  }
  if (position < 0 && /unexpected end/i.test(message)) {
    position = source.length;
  }
  if (position < 0) position = 0;

  if (line <= 0 || column <= 0) {
    const before = source.slice(0, position);
    line = before.split('\n').length;
    const lastLineBreak = before.lastIndexOf('\n');
    column = position - lastLineBreak;
  }

  const lines = source.split('\n');
  const excerpt = lines[Math.max(0, line - 1)] || '';
  const pointer = `${' '.repeat(Math.max(0, Math.min(column - 1, excerpt.length)))}^`;

  return {
    message,
    line,
    column,
    position,
    excerpt,
    pointer,
  };
}

function collectEntities(
  value: unknown,
  blockIndex: number,
  path: JsonPath,
  entities: JsonLdEntity[],
  seen: WeakSet<object>,
  rootCandidate: boolean,
) {
  if (Array.isArray(value)) {
    if (seen.has(value)) return;
    seen.add(value);
    value.forEach((item, index) => {
      collectEntities(item, blockIndex, [...path, index], entities, seen, rootCandidate);
    });
    return;
  }

  if (!value || typeof value !== 'object') {
    if (rootCandidate) {
      entities.push({
        id: `block-${blockIndex}-entity-${entities.length}`,
        blockIndex,
        path,
        data: value,
        schemaTypes: [],
      });
    }
    return;
  }

  if (seen.has(value)) return;
  seen.add(value);

  const record = value as Record<string, unknown>;
  const schemaTypes = getSchemaTypes(record);
  const hasGraph = Array.isArray(record['@graph']);
  if (schemaTypes.length > 0 || (rootCandidate && !hasGraph)) {
    entities.push({
      id: `block-${blockIndex}-entity-${entities.length}`,
      blockIndex,
      path,
      data: record,
      schemaTypes,
    });
  }

  Object.entries(record).forEach(([key, child]) => {
    if (key === '@context' || child === null || typeof child !== 'object') return;
    collectEntities(
      child,
      blockIndex,
      [...path, key],
      entities,
      seen,
      key === '@graph',
    );
  });
}

export function buildJsonLdScanResult(rawTexts: string[]): JsonLdScanResult {
  const blocks: JsonLdBlock[] = [];
  const entities: JsonLdEntity[] = [];
  const items: JsonLdInspectionItem[] = [];

  rawTexts.forEach((raw, blockIndex) => {
    const blockEntityStart = entities.length;
    const block: JsonLdBlock = {
      id: `block-${blockIndex}`,
      index: blockIndex,
      raw,
      script: `<script type="application/ld+json">\n${raw}\n</script>`,
      entityIds: [],
    };

    try {
      const parsed = JSON.parse(raw);
      block.parsed = parsed;
      collectEntities(parsed, blockIndex, [], entities, new WeakSet<object>(), true);
      block.entityIds = entities.slice(blockEntityStart).map((entity) => entity.id);
    } catch (error) {
      block.parseError = locateJsonParseError(raw, error);
    }

    blocks.push(block);
  });

  blocks.forEach((block) => {
    if (block.parseError) {
      items.push({
        kind: 'parse-error',
        id: `${block.id}-parse-error`,
        blockIndex: block.index,
        path: [],
        raw: block.raw,
        parseError: block.parseError,
        schemaTypes: [],
      });
      return;
    }

    entities
      .filter((entity) => entity.blockIndex === block.index)
      .forEach((entity) => {
        items.push({
          kind: 'entity',
          id: entity.id,
          blockIndex: entity.blockIndex,
          path: entity.path,
          raw: block.raw,
          data: entity.data,
          schemaTypes: entity.schemaTypes,
        });
      });
  });

  return {
    found: blocks.length > 0,
    blockCount: blocks.length,
    count: entities.length,
    blocks,
    entities,
    items,
    data: entities.map((entity) => entity.data),
    rawTexts: blocks.map((block) => block.raw),
  };
}

export function normalizeJsonLdScanResult(value: Partial<JsonLdScanResult> | null): JsonLdScanResult {
  if (!value) return buildJsonLdScanResult([]);
  if (Array.isArray(value.blocks) && Array.isArray(value.items)) {
    return value as JsonLdScanResult;
  }
  if (Array.isArray(value.rawTexts)) return buildJsonLdScanResult(value.rawTexts);
  if (Array.isArray(value.data)) {
    return buildJsonLdScanResult(value.data.map((item) => JSON.stringify(item)));
  }
  return buildJsonLdScanResult([]);
}
