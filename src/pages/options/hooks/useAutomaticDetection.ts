import { useCallback, useEffect, useState } from 'react';

const AUTO_DETECT_STORAGE_KEY = 'auto_detect_enabled';
const ALL_URLS_PERMISSION = { origins: ['<all_urls>'] };

export function useAutomaticDetection() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sync = useCallback(async () => {
    const [stored, granted] = await Promise.all([
      chrome.storage.local.get(AUTO_DETECT_STORAGE_KEY),
      chrome.permissions.contains(ALL_URLS_PERMISSION),
    ]);
    const nextEnabled = Boolean(stored[AUTO_DETECT_STORAGE_KEY] && granted);
    setEnabled(nextEnabled);
    if (stored[AUTO_DETECT_STORAGE_KEY] && !granted) {
      await chrome.storage.local.set({ [AUTO_DETECT_STORAGE_KEY]: false });
    }
  }, []);

  useEffect(() => {
    sync()
      .catch(() => setError('permission_load_failed'))
      .finally(() => setLoading(false));
  }, [sync]);

  const change = useCallback(async (nextEnabled: boolean) => {
    setChanging(true);
    setError(null);
    try {
      if (nextEnabled) {
        const granted = await chrome.permissions.request(ALL_URLS_PERMISSION);
        if (!granted) {
          setError('permission_denied');
          setEnabled(false);
          return false;
        }
        await chrome.storage.local.set({ [AUTO_DETECT_STORAGE_KEY]: true });
        setEnabled(true);
        return true;
      }

      await chrome.storage.local.set({ [AUTO_DETECT_STORAGE_KEY]: false });
      await chrome.permissions.remove(ALL_URLS_PERMISSION);
      setEnabled(false);
      return true;
    } catch {
      setError('permission_change_failed');
      return false;
    } finally {
      setChanging(false);
    }
  }, []);

  return {
    state: { enabled, loading, changing, error },
    actions: { change, sync },
  };
}
