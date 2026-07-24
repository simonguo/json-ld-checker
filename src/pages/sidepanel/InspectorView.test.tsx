import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InspectorView } from './InspectorView';

describe('InspectorView', () => {
  it('treats source edits as a local draft and resets when the selected schema changes', () => {
    const { rerender } = render(
      <InspectorView data={{ '@context': 'https://schema.org', '@type': 'Organization', name: 'First' }} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Source/ }));
    const editor = screen.getByLabelText('JSON-LD source editor') as HTMLTextAreaElement;
    expect(editor.value).toContain('First');

    fireEvent.change(editor, { target: { value: '{"name":"Draft"}' } });
    expect(editor.value).toContain('Draft');

    rerender(
      <InspectorView data={{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Second' }} />,
    );
    expect((screen.getByLabelText('JSON-LD source editor') as HTMLTextAreaElement).value).toContain('Second');
  });

  it('explains when a missing field is focused through its existing parent', () => {
    render(
      <InspectorView
        data={{ '@context': 'https://schema.org', '@type': 'Product' }}
        focusRequest={{
          requestedPath: ['image'],
          resolvedPath: [],
          exact: false,
          token: 1,
        }}
      />,
    );

    expect(screen.getByText(/The field \$\.image does not exist/)).toBeInTheDocument();
  });
});
