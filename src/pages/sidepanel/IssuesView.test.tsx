import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IssuesView } from './IssuesView';
import { buildJsonLdScanResult } from '@/lib/json-ld';

describe('IssuesView', () => {
  it('filters results and passes the structured path when an issue is opened', () => {
    const onNavigate = vi.fn();
    render(
      <IssuesView
        data={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: 'Keyboard',
        }}
        pageUrl="https://example.com/product"
        scanResult={buildJsonLdScanResult([
          JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: 'Keyboard',
          }),
        ])}
        onNavigate={onNavigate}
      />,
    );

    const issueTitle = screen.getByText('Product missing required properties');
    fireEvent.click(issueTitle.closest('button')!);
    expect(onNavigate).toHaveBeenCalledWith(['image']);

    fireEvent.click(screen.getByRole('button', { name: /Warning/ }));
    expect(screen.getByText('No results in this filter')).toBeInTheDocument();
  });
});
