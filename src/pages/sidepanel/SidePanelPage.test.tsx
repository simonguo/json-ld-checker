import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SidePanelPage from './SidePanelPage';

const schemas = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Fixture Inc.',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Keyboard',
  },
];

describe('SidePanelPage', () => {
  beforeEach(() => {
    (chrome.runtime.sendMessage as any).mockImplementation((request: { action: string }) => {
      if (request.action === 'getJsonLdData') {
        return Promise.resolve({
          found: true,
          count: schemas.length,
          rawTexts: schemas.map((schema) => JSON.stringify(schema)),
        });
      }
      return Promise.resolve(null);
    });
  });

  it('uses the compact navigation, switches schemas, and opens AI as a secondary tool', async () => {
    render(<SidePanelPage />);

    expect(await screen.findByText('2 schemas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Inspector' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Issues/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'History' })).toBeInTheDocument();

    const schemaPicker = screen.getByLabelText('Schema') as HTMLSelectElement;
    fireEvent.change(schemaPicker, { target: { value: '1' } });
    expect(schemaPicker.value).toBe('1');

    fireEvent.click(screen.getByRole('button', { name: 'AI' }));
    expect(await screen.findByText('AI provider is not configured')).toBeInTheDocument();
  });
});
