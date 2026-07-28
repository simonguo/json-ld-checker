import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAutomaticDetection } from './useAutomaticDetection';

const storageGetMock =
  chrome.storage.local.get as unknown as ReturnType<typeof vi.fn>;
const permissionsContainsMock =
  chrome.permissions.contains as unknown as ReturnType<typeof vi.fn>;
const permissionsRequestMock =
  chrome.permissions.request as unknown as ReturnType<typeof vi.fn>;
const permissionsRemoveMock =
  chrome.permissions.remove as unknown as ReturnType<typeof vi.fn>;

describe('useAutomaticDetection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storageGetMock.mockResolvedValue({});
    vi.mocked(chrome.storage.local.set).mockResolvedValue();
    permissionsContainsMock.mockResolvedValue(false);
    permissionsRequestMock.mockResolvedValue(true);
    permissionsRemoveMock.mockResolvedValue(true);
  });

  it('requests all-sites access only when the user enables automatic detection', async () => {
    const { result } = renderHook(() => useAutomaticDetection());
    await waitFor(() => expect(result.current.state.loading).toBe(false));

    await act(async () => {
      await result.current.actions.change(true);
    });

    expect(chrome.permissions.request).toHaveBeenCalledWith({
      origins: ['<all_urls>'],
    });
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      auto_detect_enabled: true,
    });
    expect(result.current.state.enabled).toBe(true);
  });

  it('does not store the setting when permission is denied', async () => {
    permissionsRequestMock.mockResolvedValue(false);
    const { result } = renderHook(() => useAutomaticDetection());
    await waitFor(() => expect(result.current.state.loading).toBe(false));

    await act(async () => {
      await result.current.actions.change(true);
    });

    expect(result.current.state.error).toBe('permission_denied');
    expect(result.current.state.enabled).toBe(false);
    expect(chrome.storage.local.set).not.toHaveBeenCalledWith({
      auto_detect_enabled: true,
    });
  });

  it('removes all-sites access when disabled', async () => {
    storageGetMock.mockResolvedValue({
      auto_detect_enabled: true,
    });
    permissionsContainsMock.mockResolvedValue(true);
    const { result } = renderHook(() => useAutomaticDetection());
    await waitFor(() => expect(result.current.state.enabled).toBe(true));

    await act(async () => {
      await result.current.actions.change(false);
    });

    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      auto_detect_enabled: false,
    });
    expect(chrome.permissions.remove).toHaveBeenCalledWith({
      origins: ['<all_urls>'],
    });
    expect(result.current.state.enabled).toBe(false);
  });

  it('repairs a stale setting after host access was revoked', async () => {
    storageGetMock.mockResolvedValue({
      auto_detect_enabled: true,
    });
    permissionsContainsMock.mockResolvedValue(false);
    const { result } = renderHook(() => useAutomaticDetection());
    await waitFor(() => expect(result.current.state.loading).toBe(false));

    expect(result.current.state.enabled).toBe(false);
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      auto_detect_enabled: false,
    });
  });
});
