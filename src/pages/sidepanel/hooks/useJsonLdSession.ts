import { useCallback, useEffect, useRef, useState } from 'react';
import { aiService } from '@/lib/ai-service';
import { addHistoryEntry } from '@/lib/history';
import { normalizeJsonLdScanResult } from '@/lib/json-ld';
import { validator } from '@/lib/validator';
import type { JsonLdData } from '../types';

export function useJsonLdSession(unableToGetCurrentTab: string) {
  const [jsonData, setJsonData] = useState<JsonLdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTabUrl, setCurrentTabUrl] = useState('');
  const [currentTabId, setCurrentTabId] = useState<number | null>(null);
  const activeTabIdRef = useRef<number | null>(null);

  const saveHistory = useCallback(async (data: JsonLdData, tab: chrome.tabs.Tab) => {
    if (!data.found) return;
    try {
      const validationResults = data.entities.map((entity) => validator.validate(entity.data));
      const types = data.entities.flatMap((entity) => entity.schemaTypes);
      await addHistoryEntry({
        url: tab.url || '',
        title: tab.title || '',
        timestamp: Date.now(),
        jsonLdCount: data.blockCount,
        errorCount:
          data.blocks.filter((block) => block.parseError).length +
          validationResults.reduce((sum, result) => sum + result.errors.length, 0),
        warningCount: validationResults.reduce(
          (sum, result) => sum + result.warnings.length,
          0,
        ),
        suggestionCount: validationResults.reduce(
          (sum, result) => sum + result.suggestions.length,
          0,
        ),
        types: [...new Set(types)],
      });
    } catch (historyError) {
      console.error('Failed to save history:', historyError);
    }
  }, []);

  const loadJsonLdData = useCallback(
    async (force = false) => {
      try {
        setError(null);
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab.id) throw new Error(unableToGetCurrentTab);

        activeTabIdRef.current = tab.id;
        setCurrentTabId(tab.id);
        setCurrentTabUrl(tab.url || '');
        const response = await chrome.runtime.sendMessage({
          action: 'getJsonLdData',
          tabId: tab.id,
          force,
        });
        if (!response) throw new Error(unableToGetCurrentTab);

        const nextData = normalizeJsonLdScanResult(response);
        setJsonData(nextData);
        await saveHistory(nextData, tab);
      } catch (loadError) {
        console.error('Error loading JSON-LD data:', loadError);
        setError(unableToGetCurrentTab);
        setJsonData(null);
      } finally {
        setLoading(false);
      }
    },
    [saveHistory, unableToGetCurrentTab],
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadJsonLdData(true);
    } finally {
      setRefreshing(false);
    }
  }, [loadJsonLdData]);

  useEffect(() => {
    loadJsonLdData();
    aiService.initialize();

    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName !== 'local') return;
      const keys = [
        'ai_provider',
        'ai_model',
        'api_key',
        'api_endpoint',
        'azure_endpoint',
        'azure_deployment',
      ];
      if (keys.some((key) => key in changes)) aiService.initialize();
    };

    const handleTabUpdate = async (
      tabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
    ) => {
      if (
        activeTabIdRef.current === tabId &&
        (changeInfo.url || changeInfo.status === 'complete')
      ) {
        window.setTimeout(() => loadJsonLdData(true), 300);
      }
    };

    const handleTabActivated = () => window.setTimeout(() => loadJsonLdData(true), 100);
    const handleRuntimeMessage = (message: any) => {
      if (
        message?.action === 'jsonLdScanChanged' &&
        message.tabId === activeTabIdRef.current
      ) {
        setJsonData(normalizeJsonLdScanResult(message.result));
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    chrome.tabs.onUpdated.addListener(handleTabUpdate);
    chrome.tabs.onActivated.addListener(handleTabActivated);
    chrome.runtime.onMessage.addListener(handleRuntimeMessage);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
      chrome.tabs.onUpdated.removeListener(handleTabUpdate);
      chrome.tabs.onActivated.removeListener(handleTabActivated);
      chrome.runtime.onMessage.removeListener(handleRuntimeMessage);
    };
  }, [loadJsonLdData]);

  useEffect(() => {
    if (!currentTabId) return;
    chrome.runtime
      .sendMessage({ action: 'startJsonLdWatch', tabId: currentTabId })
      .catch(() => {});
    return () => {
      chrome.runtime
        .sendMessage({ action: 'stopJsonLdWatch', tabId: currentTabId })
        .catch(() => {});
    };
  }, [currentTabId]);

  return {
    state: {
      jsonData,
      loading,
      refreshing,
      error,
      currentTabUrl,
      currentTabId,
    },
    actions: { refresh },
  };
}
