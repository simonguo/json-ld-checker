import { useCallback, useEffect, useState } from 'react';
import { aiService } from '@/lib/ai-service';
import { addHistoryEntry } from '@/lib/history';
import { validator } from '@/lib/validator';
import type { JsonLdData } from '../types';

export function useJsonLdSession(unableToGetCurrentTab: string) {
  const [jsonData, setJsonData] = useState<JsonLdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTabUrl, setCurrentTabUrl] = useState('');

  const loadJsonLdData = useCallback(async () => {
    try {
      setError(null);
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) throw new Error(unableToGetCurrentTab);

      setCurrentTabUrl(tab.url || '');
      const response = await chrome.runtime.sendMessage({
        action: 'getJsonLdData',
        tabId: tab.id,
      });

      if (!response) {
        setJsonData({ found: false, count: 0, data: [] });
        return;
      }

      const parsedData = response.rawTexts?.length
        ? response.rawTexts
            .map((raw: string) => {
              try {
                return JSON.parse(raw);
              } catch {
                return null;
              }
            })
            .filter(Boolean)
        : response.data || [];

      const nextData = {
        found: Boolean(response.found),
        count: Number(response.count || parsedData.length),
        data: parsedData,
      };
      setJsonData(nextData);

      if (parsedData.length > 0) {
        try {
          const validationResults = parsedData.map((item: any) => validator.validate(item));
          const types = parsedData.flatMap((item: any) => {
            const type = item?.['@type'];
            return type ? (Array.isArray(type) ? type : [type]) : [];
          });

          await addHistoryEntry({
            url: tab.url || '',
            title: tab.title || '',
            timestamp: Date.now(),
            jsonLdCount: nextData.count,
            errorCount: validationResults.reduce((sum: number, result: any) => sum + result.errors.length, 0),
            warningCount: validationResults.reduce((sum: number, result: any) => sum + result.warnings.length, 0),
            suggestionCount: validationResults.reduce((sum: number, result: any) => sum + result.suggestions.length, 0),
            types: [...new Set(types)] as string[],
          });
        } catch (historyError) {
          console.error('Failed to save history:', historyError);
        }
      }
    } catch (loadError: any) {
      console.error('Error loading JSON-LD data:', loadError);
      setError(unableToGetCurrentTab);
      setJsonData(null);
    } finally {
      setLoading(false);
    }
  }, [unableToGetCurrentTab]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadJsonLdData();
    } finally {
      setRefreshing(false);
    }
  }, [loadJsonLdData]);

  useEffect(() => {
    loadJsonLdData();
    if (typeof chrome === 'undefined' || !chrome.storage?.onChanged || !chrome.tabs?.onUpdated) {
      return;
    }
    aiService.initialize();

    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName !== 'local') return;
      const keys = ['ai_provider', 'ai_model', 'api_key', 'api_endpoint', 'azure_endpoint', 'azure_deployment'];
      if (keys.some((key) => key in changes)) aiService.initialize();
    };

    const handleTabUpdate = async (
      tabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
    ) => {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab?.id === tabId && (changeInfo.url || changeInfo.status === 'complete')) {
        window.setTimeout(loadJsonLdData, 300);
      }
    };

    const handleTabActivated = () => window.setTimeout(loadJsonLdData, 100);

    chrome.storage.onChanged.addListener(handleStorageChange);
    chrome.tabs.onUpdated.addListener(handleTabUpdate);
    chrome.tabs.onActivated.addListener(handleTabActivated);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
      chrome.tabs.onUpdated.removeListener(handleTabUpdate);
      chrome.tabs.onActivated.removeListener(handleTabActivated);
    };
  }, [loadJsonLdData]);

  return {
    state: { jsonData, loading, refreshing, error, currentTabUrl },
    actions: { refresh },
  };
}
