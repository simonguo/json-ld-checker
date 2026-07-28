import { describe, expect, it } from 'vitest';
import { buildJsonLdScanResult, locateJsonParseError } from './json-ld';

describe('JSON-LD block parsing', () => {
  it('preserves malformed blocks and reports a line and column', () => {
    const raw = '{\n  "@context": "https://schema.org",\n  "@type": "Product",\n}';
    const result = buildJsonLdScanResult([raw]);

    expect(result.found).toBe(true);
    expect(result.blockCount).toBe(1);
    expect(result.count).toBe(0);
    expect(result.items[0]).toMatchObject({
      kind: 'parse-error',
      blockIndex: 0,
      raw,
    });
    expect(result.blocks[0].parseError?.line).toBeGreaterThan(0);
    expect(result.blocks[0].parseError?.column).toBeGreaterThan(0);
  });

  it('normalizes arrays, @graph entries, and nested typed entities', () => {
    const result = buildJsonLdScanResult([
      JSON.stringify([
        {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Product',
              name: 'Keyboard',
              offers: { '@type': 'Offer', price: 129 },
            },
            { '@type': 'Organization', name: 'Northstar Labs' },
          ],
        },
        { '@type': 'BreadcrumbList', itemListElement: [] },
      ]),
    ]);

    expect(result.entities.map((entity) => entity.schemaTypes[0])).toEqual([
      'Product',
      'Offer',
      'Organization',
      'BreadcrumbList',
    ]);
    expect(result.entities.map((entity) => entity.path)).toEqual([
      [0, '@graph', 0],
      [0, '@graph', 0, 'offers'],
      [0, '@graph', 1],
      [1],
    ]);
    expect(result.blocks[0].entityIds).toHaveLength(4);
  });

  it('locates an unexpected-end error at the end of the source', () => {
    const error = locateJsonParseError('{\n  "name": "Keyboard"', new Error('Unexpected end of JSON input'));
    expect(error.position).toBe(22);
    expect(error.line).toBe(2);
    expect(error.column).toBeGreaterThan(1);
  });

  it('does not promote untyped objects from nested data arrays into entities', () => {
    const result = buildJsonLdScanResult([
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Keyboard',
        reviews: [{ author: 'A' }, { author: 'B' }],
      }),
    ]);

    expect(result.entities).toHaveLength(1);
    expect(result.entities[0].schemaTypes).toEqual(['Product']);
  });
});
