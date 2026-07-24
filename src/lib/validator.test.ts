import { describe, expect, it } from 'vitest';
import { validator } from './validator';

describe('validator locations', () => {
  it('returns a missing-field path that can fall back to its parent', () => {
    const results = validator.validate({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Keyboard',
    }, 'en');

    const missingImage = results.errors.find((result) => result.title.includes('missing required'));
    expect(missingImage?.path).toEqual(['image']);
  });

  it('preserves @graph and array indexes in issue paths', () => {
    const results = validator.validate({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Product',
          name: 'Keyboard',
          image: 'not-a-url',
          offers: [{ price: '19.999', priceCurrency: 'US' }],
        },
      ],
    }, 'en');

    expect(results.warnings.some((result) =>
      JSON.stringify(result.path) === JSON.stringify(['@graph', 0, 'image'])
    )).toBe(true);
    expect(results.warnings.some((result) =>
      JSON.stringify(result.path) === JSON.stringify(['@graph', 0, 'offers', 0, 'price'])
    )).toBe(true);
    expect(results.warnings.some((result) =>
      JSON.stringify(result.path) === JSON.stringify(['@graph', 0, 'offers', 0, 'priceCurrency'])
    )).toBe(true);
  });
});
