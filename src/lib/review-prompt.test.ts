import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  dismissReviewPrompt,
  recordReportExport,
  recordSuccessfulInspection,
} from './review-prompt';

describe('review prompt eligibility', () => {
  let state: Record<string, unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    state = {};
    vi.mocked(chrome.storage.local.get).mockImplementation(async () => ({ ...state }));
    vi.mocked(chrome.storage.local.set).mockImplementation(async (changes) => {
      state = { ...state, ...(changes as Record<string, unknown>) };
    });
  });

  it('shows once after three distinct HTTP pages and ignores query strings', async () => {
    expect(await recordSuccessfulInspection('https://example.com/a?draft=1')).toBe(false);
    expect(await recordSuccessfulInspection('https://example.com/a?draft=2')).toBe(false);
    expect(await recordSuccessfulInspection('https://example.com/b')).toBe(false);
    expect(await recordSuccessfulInspection('https://example.com/c')).toBe(true);
    expect(await recordSuccessfulInspection('https://example.com/d')).toBe(false);
  });

  it('shows after the first report export and stays dismissed', async () => {
    expect(await recordReportExport()).toBe(true);
    await dismissReviewPrompt();
    expect(await recordReportExport()).toBe(false);
  });

  it('ignores restricted and invalid page URLs', async () => {
    expect(await recordSuccessfulInspection('chrome://extensions')).toBe(false);
    expect(await recordSuccessfulInspection('not a URL')).toBe(false);
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
  });
});
