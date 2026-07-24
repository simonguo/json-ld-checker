import { describe, expect, it } from 'vitest';
import {
  formatJsonPath,
  isPathAncestor,
  resolveExistingJsonPath,
  treeKeyPathToJsonPath,
} from './json-path';

describe('JSON path utilities', () => {
  it('formats object and array paths as JSONPath', () => {
    expect(formatJsonPath(['@graph', 1, 'offers', 0, 'price'])).toBe('$.@graph[1].offers[0].price');
    expect(formatJsonPath(['odd key'])).toBe('$["odd key"]');
  });

  it('resolves missing fields to the nearest existing ancestor', () => {
    const data = { offers: [{ price: '19.99' }] };
    expect(resolveExistingJsonPath(data, ['offers', 0, 'price'])).toEqual({
      path: ['offers', 0, 'price'],
      exact: true,
    });
    expect(resolveExistingJsonPath(data, ['offers', 0, 'priceCurrency'])).toEqual({
      path: ['offers', 0],
      exact: false,
    });
  });

  it('normalizes react-json-tree key paths and detects ancestors', () => {
    expect(treeKeyPathToJsonPath(['price', 0, 'offers', 'root'])).toEqual(['offers', 0, 'price']);
    expect(isPathAncestor(['offers', 0], ['offers', 0, 'price'])).toBe(true);
    expect(isPathAncestor(['offers', 1], ['offers', 0, 'price'])).toBe(false);
  });
});
