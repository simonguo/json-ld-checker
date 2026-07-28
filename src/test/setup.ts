import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

const storageGet = vi.fn((keys: string[] | string, callback?: (result: Record<string, unknown>) => void) => {
  const result = { user_language: 'en' };
  callback?.(result);
  return Promise.resolve(result);
});
Object.defineProperty(globalThis, 'chrome', {
  configurable: true,
  value: {
    storage: {
      local: {
        get: storageGet,
        set: vi.fn(() => Promise.resolve()),
        remove: vi.fn(() => Promise.resolve()),
      },
      session: {
        get: vi.fn((keys: string[] | string, callback?: (result: Record<string, unknown>) => void) => {
          callback?.({});
          return Promise.resolve({});
        }),
        set: vi.fn(() => Promise.resolve()),
      },
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
    runtime: {
      getManifest: vi.fn(() => ({ version: '2.5.0' })),
      getURL: vi.fn((path: string) => `chrome-extension://test/${path}`),
      openOptionsPage: vi.fn(),
      sendMessage: vi.fn(() => Promise.resolve(null)),
      onMessage: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
    tabs: {
      query: vi.fn(() => Promise.resolve([{ id: 1, url: 'https://example.com/' }])),
      create: vi.fn(() => Promise.resolve()),
      onUpdated: { addListener: vi.fn(), removeListener: vi.fn() },
      onActivated: { addListener: vi.fn(), removeListener: vi.fn() },
    },
    permissions: {
      contains: vi.fn(() => Promise.resolve(false)),
      request: vi.fn(() => Promise.resolve(true)),
      remove: vi.fn(() => Promise.resolve(true)),
      onRemoved: { addListener: vi.fn(), removeListener: vi.fn() },
    },
  },
});

Object.defineProperty(Element.prototype, 'scrollIntoView', {
  configurable: true,
  value: vi.fn(),
});
