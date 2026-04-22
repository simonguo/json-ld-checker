import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { aiService } from '@/lib/ai-service';
import Loader from '@/components/Loader';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

interface AiCheckViewProps {
  data: any;
}

export const AiCheckView: React.FC<AiCheckViewProps> = ({ data }) => {
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

  if (!data) {
    return <div className="text-gray-500">{t('noJsonLdToCheck')}</div>;
  }

  const handleCheck = async () => {
    if (!aiService.isConfigured()) {
      chrome.runtime.openOptionsPage();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const result = await aiService.checkJsonLd(data, tab.url || '');
      setResult(result);
    } catch (err: any) {
      setError(err.message || t('aiCheckFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader message={t('aiAnalyzing')} subMessage={t('mayTakeFewSeconds')} />;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-medium text-red-800">{t('errorOccurred')}</h3>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
        <button
          onClick={handleCheck}
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
            <h3 className="font-medium text-blue-800">{t('aiCheckFeature')}</h3>
            <p className="text-blue-700 mt-1">{t('aiCheckDescription')}</p>
          </div>
          
          {!isConfigured ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-medium text-yellow-800">{t('configureApiKey')}</h3>
              <p className="text-yellow-700 mt-1">
                {t('aiCheckDescription')}
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
              onClick={handleCheck}
              className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {t('aiCheck')}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">{t('aiCheckResults')}</h3>
            <button
              onClick={handleCheck}
              className="text-sm text-primary-500 hover:text-primary-600"
            >
              {t('recheckAi')}
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
