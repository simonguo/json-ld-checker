import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { aiService } from '@/lib/ai-service';
import Loader from '@/components/Loader';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const AiSuggestView: React.FC = () => {
  const { t } = useI18n();
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(aiService.isConfigured());

  // Listen for AI config changes
  React.useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local') {
        const aiConfigKeys = ['ai_provider', 'ai_model', 'api_key', 'api_endpoint', 'azure_endpoint', 'azure_deployment'];
        const hasAiConfigChange = aiConfigKeys.some(key => key in changes);
        
        if (hasAiConfigChange) {
          setIsConfigured(aiService.isConfigured());
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const handleSuggest = async () => {
    if (!aiService.isConfigured()) {
      chrome.runtime.openOptionsPage();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Get current tab info
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.url) {
        throw new Error(t('unableToGetPageInfo'));
      }

      // Get page title and description
      const response = await chrome.runtime.sendMessage({
        action: 'getPageInfo',
        tabId: tab.id
      });

      if (!response) {
        throw new Error(t('unableToGetPageInfo'));
      }

      const pageInfo = {
        url: tab.url,
        title: response.title || '',
        description: response.description || '',
        existingJsonLd: response.existingJsonLd || []
      };

      const result = await aiService.suggestJsonLd(pageInfo);
      setResult(result);
    } catch (err: any) {
      setError(err.message || t('aiSuggestFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader message={t('aiAnalyzingPage')} subMessage={t('mayTakeFewSeconds')} />;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-medium text-red-800">{t('errorOccurred')}</h3>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
        <button
          onClick={handleSuggest}
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!result ? (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-800">{t('aiSuggestFeature')}</h3>
            <p className="text-blue-700 mt-1">{t('aiSuggestDescription')}</p>
          </div>
          
          {!isConfigured ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-medium text-yellow-800">{t('configureApiKey')}</h3>
              <p className="text-yellow-700 mt-1">
                {t('aiSuggestDescription')}
              </p>
              <button
                onClick={() => chrome.runtime.openOptionsPage()}
                className="mt-3 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {t('configureApiKey')}
              </button>
            </div>
          ) : (
            <button
              onClick={handleSuggest}
              className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {t('aiSuggest')}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">{t('aiSuggestResults')}</h3>
            <button
              onClick={handleSuggest}
              className="text-sm text-primary-500 hover:text-primary-600"
            >
              {t('regenerate')}
            </button>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <MarkdownRenderer className="p-4">{result}</MarkdownRenderer>
          </div>
        </div>
      )}
    </div>
  );
};
