import React, { useState, useEffect } from 'react';
import { Code, CheckCircle2, Lightbulb, Wand2 } from 'lucide-react';
import Header from '@/components/Header';
import Loader from '@/components/Loader';
import TabButton from '@/components/TabButton';
import { useI18n } from '@/lib/i18n';
import { aiService } from '@/lib/ai-service';
import { validator } from '@/lib/validator';
import { TreeView } from './TreeView';
import { ValidationView } from './ValidationView';
import { AiCheckView } from './AiCheckView';
import { AiSuggestView } from './AiSuggestView';

interface JsonLdData {
  found: boolean;
  count: number;
  data: any[];
}

export default function SidePanelPage() {
  const { t } = useI18n();
  const [jsonData, setJsonData] = useState<JsonLdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('data');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadJsonLdData();
    // Initialize AI service
    aiService.initialize();

    // Listen for storage changes to update AI config in real-time
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local') {
        const aiConfigKeys = ['ai_provider', 'ai_model', 'api_key', 'api_endpoint', 'azure_endpoint', 'azure_deployment'];
        const hasAiConfigChange = aiConfigKeys.some(key => key in changes);
        
        if (hasAiConfigChange) {
          // Re-initialize AI service when config changes
          aiService.initialize();
          console.log('AI configuration updated');
        }
      }
    };

    // Listen for tab updates (URL changes, page reloads, etc.)
    const handleTabUpdate = async (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
      // Only process updates for the active tab in the current window
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (activeTab?.id === tabId) {
        // Reload data when:
        // 1. URL changes (user navigates to a new page)
        // 2. Page completes loading (status becomes 'complete')
        if (changeInfo.url || changeInfo.status === 'complete') {
          console.log('[SidePanel] Tab updated, reloading JSON-LD data:', {
            url: changeInfo.url,
            status: changeInfo.status
          });
          // Add a small delay to ensure content script has finished scanning
          setTimeout(() => {
            loadJsonLdData();
          }, 300);
        }
      }
    };

    // Listen for active tab changes (user switches tabs)
    const handleTabActivated = (activeInfo: chrome.tabs.TabActiveInfo) => {
      console.log('[SidePanel] Tab activated, reloading JSON-LD data');
      // Add a small delay to ensure we get the correct tab data
      setTimeout(() => {
        loadJsonLdData();
      }, 100);
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    chrome.tabs.onUpdated.addListener(handleTabUpdate);
    chrome.tabs.onActivated.addListener(handleTabActivated);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
      chrome.tabs.onUpdated.removeListener(handleTabUpdate);
      chrome.tabs.onActivated.removeListener(handleTabActivated);
    };
  }, []);

  const loadJsonLdData = async () => {
    try {
      setLoading(true);
      // Get tab ID to request JSON-LD data from background script
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) {
        throw new Error(t('unableToGetCurrentTab'));
      }

      // Request JSON-LD data from background script
      const response = await chrome.runtime.sendMessage({
        action: 'getJsonLdData',
        tabId: tab.id,
      });

      if (response) {
        setJsonData(response);
        if (response.data && response.data.length > 0) {
          setSelectedIndex(0);
        }
      } else {
        setJsonData({
          found: false,
          count: 0,
          data: [],
        });
      }
    } catch (error) {
      console.error('Error loading JSON-LD data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadJsonLdData();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  if (loading) {
    return <Loader message={t('loading')} />;
  }

  if (!jsonData) {
    return (
      <div className="flex flex-col h-screen">
        <Header 
          title={t('extensionName')} 
          onRefresh={handleRefresh}
          onSettings={handleSettings}
          refreshing={refreshing}
        />
        <div className="flex-1 p-4 flex items-center justify-center">
          <p className="text-gray-500">{t('loadFailed')}</p>
        </div>
      </div>
    );
  }

  if (!jsonData.found || jsonData.data.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <Header 
          title={t('extensionName')} 
          onRefresh={handleRefresh}
          onSettings={handleSettings}
          refreshing={refreshing}
        />
        
        {/* Tabs Container */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center px-2">
            <TabButton 
              active={currentTab === 'data'} 
              onClick={() => setCurrentTab('data')}
              icon={<Code className="w-4 h-4" />}
            >
              JSON-LD
            </TabButton>
            <TabButton 
              active={currentTab === 'validation'} 
              onClick={() => setCurrentTab('validation')}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              {t('validation')}
            </TabButton>
            <TabButton 
              active={currentTab === 'aiCheck'} 
              onClick={() => setCurrentTab('aiCheck')}
              icon={<Lightbulb className="w-4 h-4" />}
            >
              {t('aiCheck')}
            </TabButton>
            <TabButton 
              active={currentTab === 'aiSuggest'} 
              onClick={() => setCurrentTab('aiSuggest')}
              icon={<Wand2 className="w-4 h-4" />}
            >
              {t('aiSuggest')}
            </TabButton>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-gray-50">
          <div className="p-4">
            {currentTab === 'aiSuggest' ? (
              <AiSuggestView />
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noJsonLdFound')}</h3>
                  <p className="text-gray-600 mb-4">{t('noJsonLdOnPage')}</p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                    <Lightbulb className="w-4 h-4" />
                    <span>{t('tryAiSuggest')}</span>
                  </div>
                  <div className="mt-6">
                    <button 
                      onClick={() => setCurrentTab('aiSuggest')}
                      className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-lg transition-colors font-medium shadow-sm hover:shadow-md"
                    >
                      <Wand2 className="w-4 h-4" />
                      {t('useAiSuggest')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const selectedData = jsonData.data[selectedIndex];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header 
        title={t('extensionName')} 
        subtitle={t('foundJsonLd', { count: jsonData.count })}
        onRefresh={handleRefresh}
        onSettings={handleSettings}
        refreshing={refreshing}
      />
      
      {/* Selector and Tabs Container */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        {jsonData.count > 1 && (
          <div className="px-4 pt-3 pb-2">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              {t('selectJsonLd', { count: jsonData.count })}
            </label>
            <select
              value={selectedIndex}
              onChange={(e) => setSelectedIndex(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white transition-all"
            >
              {jsonData.data.map((item, index) => {
                const type = item['@type'] || t('unknownType');
                const typeStr = Array.isArray(type) ? type.join(', ') : type;
                return (
                  <option key={index} value={index}>
                    {index + 1}: {typeStr}
                  </option>
                );
              })}
            </select>
          </div>
        )}
        
        {/* Modern Tab Navigation */}
        <div className="flex items-center px-2">
          <TabButton 
            active={currentTab === 'data'} 
            onClick={() => setCurrentTab('data')}
            icon={<Code className="w-4 h-4" />}
          >
            JSON-LD
          </TabButton>
          <TabButton 
            active={currentTab === 'validation'} 
            onClick={() => setCurrentTab('validation')}
            icon={<CheckCircle2 className="w-4 h-4" />}
          >
            {t('validation')}
          </TabButton>
          <TabButton 
            active={currentTab === 'aiCheck'} 
            onClick={() => setCurrentTab('aiCheck')}
            icon={<Lightbulb className="w-4 h-4" />}
          >
            {t('aiCheck')}
          </TabButton>
          <TabButton 
            active={currentTab === 'aiSuggest'} 
            onClick={() => setCurrentTab('aiSuggest')}
            icon={<Wand2 className="w-4 h-4" />}
          >
            {t('aiSuggest')}
          </TabButton>
        </div>
      </div>
      
      {/* Content Area with consistent background */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="p-4">
          {currentTab === 'data' && <TreeView data={selectedData} />}
          {currentTab === 'validation' && <ValidationView data={selectedData} />}
          {currentTab === 'aiCheck' && <AiCheckView data={selectedData} />}
          {currentTab === 'aiSuggest' && <AiSuggestView />}
        </div>
      </div>
    </div>
  );
}
