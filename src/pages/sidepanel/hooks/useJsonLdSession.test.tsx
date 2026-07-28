import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildJsonLdScanResult } from '@/lib/json-ld';
import { useJsonLdSession } from './useJsonLdSession';

vi.mock('@/lib/ai-service', () => ({
  aiService: { initialize: vi.fn(() => Promise.resolve()) },
}));

vi.mock('@/lib/history', () => ({
  addHistoryEntry: vi.fn(() => Promise.resolve()),
}));

const tabsQueryMock = chrome.tabs.query as unknown as ReturnType<typeof vi.fn>;

describe('useJsonLdSession', () => {
  let runtimeListener: ((message: any) => void) | undefined;

  beforeEach(() => {
    runtimeListener = undefined;
    tabsQueryMock.mockResolvedValue([
      { id: 1, url: 'https://example.com/product', title: 'Product' },
    ]);
    vi.mocked(chrome.runtime.onMessage.addListener).mockImplementation(
      ((listener: (message: any) => void) => {
        runtimeListener = listener;
      }) as any,
    );
  });

  it('applies a new scan when JSON-LD is dynamically inserted', async () => {
    const initial = buildJsonLdScanResult([]);
    const injected = buildJsonLdScanResult([
      '{"@context":"https://schema.org","@type":"Product","name":"Keyboard"}',
    ]);
    vi.mocked(chrome.runtime.sendMessage).mockImplementation(async (message: any) => {
      if (message.action === 'getJsonLdData') return initial;
      return { success: true };
    });

    const { result } = renderHook(() => useJsonLdSession('Unable to inspect'));
    await waitFor(() => expect(result.current.state.loading).toBe(false));
    expect(result.current.state.jsonData?.blockCount).toBe(0);

    act(() => {
      runtimeListener?.({
        action: 'jsonLdScanChanged',
        tabId: 1,
        result: injected,
      });
    });

    expect(result.current.state.jsonData?.blockCount).toBe(1);
    expect(result.current.state.jsonData?.entities[0].schemaTypes).toEqual(['Product']);
  });

  it('reports a readable error when the page cannot be inspected', async () => {
    vi.mocked(chrome.runtime.sendMessage).mockResolvedValue(null);
    const { result } = renderHook(() => useJsonLdSession('Unable to inspect'));

    await waitFor(() => expect(result.current.state.loading).toBe(false));
    expect(result.current.state.error).toBe('Unable to inspect');
    expect(result.current.state.jsonData).toBeNull();
  });
});
