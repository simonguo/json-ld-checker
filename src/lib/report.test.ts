import { describe, expect, it } from 'vitest';
import { buildJsonLdScanResult } from './json-ld';
import { createJsonLdReport, serializeJsonLdReport } from './report';

describe('JSON-LD reports', () => {
  it('includes valid entities and malformed source blocks', () => {
    const scan = buildJsonLdScanResult([
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Keyboard',
      }),
      '{"@context":"https://schema.org","@type":"Offer",}',
    ]);
    const report = createJsonLdReport(scan, 'https://example.com/product', 'en');

    expect(report.summary.blocks).toBe(2);
    expect(report.summary.entities).toBe(1);
    expect(report.summary.parseErrors).toBe(1);
    expect(report.blocks[1].raw).toContain('"Offer"');
    expect(report.entities[0].schemaTypes).toEqual(['Product']);
  });

  it('escapes inspected content in downloaded HTML', () => {
    const scan = buildJsonLdScanResult([
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Thing',
        name: '<script>alert("x")</script>',
      }),
    ]);
    const report = createJsonLdReport(scan, 'https://example.com/?q=<script>', 'en');
    const html = serializeJsonLdReport(report);

    expect(html).toContain('&lt;script&gt;alert');
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('https://example.com/?q=&lt;script&gt;');
  });
});
