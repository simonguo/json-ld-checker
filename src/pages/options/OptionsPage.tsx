import React, { useState, useEffect } from 'react';
import { Save, Key, Globe, Eye, EyeOff, Trash2, Info, Shield, RefreshCw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { AI_PROVIDERS, getProviderApiKeyLink, ProviderKey, AIModel } from '@/config/ai-providers';
import { aiService } from '@/lib/ai-service';
import { UpdateNotification } from '@/components/UpdateNotification';

type SettingsState = {
  provider: ProviderKey;
  model: string;
  apiKey: string;
  endpoint: string;
  azureEndpoint: string;
  azureDeployment: string;
  language: string;
};

const DEFAULT_SETTINGS: SettingsState = {
  provider: 'openai',
  model: AI_PROVIDERS['openai'].models[0]?.id || 'gpt-4o',
  apiKey: '',
  endpoint: '',
  azureEndpoint: '',
  azureDeployment: '',
  language: 'auto',
};

export default function OptionsPage() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');
  const [ollamaModels, setOllamaModels] = useState<AIModel[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [ollamaFetchError, setOllamaFetchError] = useState<string | null>(null);
  const { t } = useI18n(settings.language);

  const models =
    settings.provider === 'ollama'
      ? ollamaModels
      : AI_PROVIDERS[settings.provider].models;

  const fetchOllamaModels = async (endpointUrl?: string) => {
    setFetchingModels(true);
    setOllamaFetchError(null);
    try {
      const raw =
        endpointUrl ||
        AI_PROVIDERS.ollama.endpoint ||
        'http://localhost:11434/v1/chat/completions';
      const origin = new URL(raw).origin;
      const res = await fetch(`${origin}/api/tags`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: AIModel[] = Array.isArray(data?.models)
        ? data.models.map((m: any) => ({ id: m.name, name: m.name }))
        : [];
      setOllamaModels(list);
      setSettings((prev) => {
        if (prev.provider !== 'ollama') return prev;
        const hasCurrent = list.some((m) => m.id === prev.model);
        if (!hasCurrent && list.length > 0) {
          return { ...prev, model: list[0].id };
        }
        return prev;
      });
    } catch (err: any) {
      console.error('Failed to fetch Ollama models:', err);
      setOllamaModels([]);
      setOllamaFetchError(err?.message || 'fetch failed');
    } finally {
      setFetchingModels(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (settings.provider === 'ollama') {
      fetchOllamaModels(settings.endpoint);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.provider]);

  useEffect(() => {
    setStatusMessage(null);
  }, [settings.provider, settings.model, settings.apiKey, settings.language, settings.endpoint, settings.azureEndpoint, settings.azureDeployment]);

  const loadSettings = async () => {
    if (typeof chrome === 'undefined' || !chrome.storage) return;
    const result = await chrome.storage.local.get([
      'ai_provider',
      'ai_model',
      'api_key',
      'api_endpoint',
      'azure_endpoint',
      'azure_deployment',
      'user_language',
    ]);

    setSettings({
      provider: (result.ai_provider as ProviderKey) || DEFAULT_SETTINGS.provider,
      model: result.ai_model || DEFAULT_SETTINGS.model,
      apiKey: result.api_key || '',
      endpoint: result.api_endpoint || '',
      azureEndpoint: result.azure_endpoint || '',
      azureDeployment: result.azure_deployment || '',
      language: result.user_language || 'auto',
    });
  };

  const handleProviderChange = (provider: ProviderKey) => {
    const firstModel = AI_PROVIDERS[provider].models[0]?.id || '';
    setSettings((prev) => ({
      ...prev,
      provider,
      model: firstModel,
      endpoint: AI_PROVIDERS[provider].endpoint || '',
    }));
  };

  const handleLanguageChange = async (value: string) => {
    setSettings((prev) => ({ ...prev, language: value }));

    if (typeof chrome === 'undefined' || !chrome.storage) return;

    try {
      await chrome.storage.local.set({ user_language: value });
      setStatusMessage(t('apiKeySaved'));
      setStatusType('success');
    } catch (error) {
      console.error('Failed to save language:', error);
      setStatusMessage(t('saveFailed'));
      setStatusType('error');
    }
  };

  const handleSave = async () => {
    if (typeof chrome === 'undefined' || !chrome.storage) return;
    setSaving(true);
    setSaved(false);

    try {
      await chrome.storage.local.set({
        ai_provider: settings.provider,
        ai_model: settings.model,
        api_key: settings.apiKey,
        api_endpoint: settings.endpoint,
        azure_endpoint: settings.azureEndpoint,
        azure_deployment: settings.azureDeployment,
        user_language: settings.language,
      });

      // Update the AI service config
      await aiService.setConfig({
        provider: settings.provider,
        model: settings.model,
        apiKey: settings.apiKey,
        endpoint: settings.endpoint,
        azureEndpoint: settings.azureEndpoint,
        azureDeployment: settings.azureDeployment,
      });

      setSaved(true);
      setStatusMessage(t('apiKeySaved'));
      setStatusType('success');
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setStatusMessage(t('saveFailed'));
      setStatusType('error');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (typeof chrome === 'undefined' || !chrome.storage) return;
    setSaving(true);
    try {
      await chrome.storage.local.remove([
        'ai_provider',
        'ai_model',
        'api_key',
        'api_endpoint',
        'azure_endpoint',
        'azure_deployment',
        'user_language',
      ]);
      setSettings(DEFAULT_SETTINGS);
      setStatusMessage(t('configCleared'));
      setStatusType('success');
    } catch (error) {
      console.error('Failed to clear settings:', error);
      setStatusMessage(t('clearFailed'));
      setStatusType('error');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (typeof chrome === 'undefined' || !chrome.storage) return;
    
    setTesting(true);
    setStatusMessage(null);
    
    try {
      const testResult = await aiService.setConfig({
        provider: settings.provider,
        model: settings.model,
        apiKey: settings.apiKey,
        endpoint: settings.endpoint,
        azureEndpoint: settings.azureEndpoint,
        azureDeployment: settings.azureDeployment,
      });
      
      if (testResult) {
        // Try to make a simple test call
        const testMessages: { role: 'user'; content: string }[] = [
          { role: 'user', content: 'Hello, this is a test. Please respond with "OK".' }
        ];
        
        await aiService.callAI(testMessages, 0.1);
        setStatusMessage(t('connectionTestSuccess'));
        setStatusType('success');
      }
    } catch (error: any) {
      console.error('Connection test failed:', error);
      setStatusMessage(error.message || t('connectionTestFailed'));
      setStatusType('error');
    } finally {
      setTesting(false);
    }
  };

  // Show/hide endpoint fields based on provider
  const showEndpoint = ['openai', 'anthropic', 'google', 'openrouter', 'ollama', 'custom'].includes(settings.provider);
  const showAzure = settings.provider === 'azure';
  const isOllama = settings.provider === 'ollama';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="text-primary-500" size={24} />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t('settingsTitle')}</h2>
            </div>
          </div>
          <p className="text-sm text-gray-600 ml-9">{t('settingsDescription')}</p>
        </div>

        {/* Update Notification */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <UpdateNotification language={settings.language} />
        </div>
        
        {/* AI Provider */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Key className="text-primary-500" size={24} />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t('aiConfiguration')}</h2>
              <p className="text-sm text-gray-600">{t('aiConfigDescription')}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('providerLabel')}</label>
                <select
                  value={settings.provider}
                  onChange={(e) => handleProviderChange(e.target.value as ProviderKey)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                >
                  {Object.entries(AI_PROVIDERS).map(([key, provider]) => (
                    <option key={key} value={key}>
                      {provider.name}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-gray-500">{t('providerHelp')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('modelLabel')}</label>
                <div className="flex items-center gap-2">
                  <select
                    value={settings.model}
                    onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                    disabled={isOllama && fetchingModels}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 disabled:bg-gray-100"
                  >
                    {isOllama && fetchingModels && (
                      <option value="">{t('ollamaFetchingModels')}</option>
                    )}
                    {isOllama && !fetchingModels && models.length === 0 && (
                      <option value="">
                        {ollamaFetchError ? t('ollamaFetchFailed') : t('ollamaNoModels')}
                      </option>
                    )}
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                  {isOllama && (
                    <button
                      type="button"
                      onClick={() => fetchOllamaModels(settings.endpoint)}
                      disabled={fetchingModels}
                      className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                      title={t('ollamaRefreshModels')}
                    >
                      <RefreshCw size={18} className={fetchingModels ? 'animate-spin' : ''} />
                    </button>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-500">{t('modelHelp')}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {!isOllama && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('apiKeyLabel')}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={settings.apiKey}
                      onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                      placeholder={AI_PROVIDERS[settings.provider].apiKeyPrefix || t('apiKeyPlaceholder')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey((s) => !s)}
                      className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
                      title={showApiKey ? 'Hide API Key' : 'Show API Key'}
                    >
                      {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    {t('apiKeyHelp')}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    <a 
                      href={getProviderApiKeyLink(settings.provider)} 
                      target="_blank" 
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {t('getApiKey')}
                    </a>
                  </p>
                </div>
              )}
              {isOllama && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('apiKeyLabel')}</label>
                  <div className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-600">
                    {t('ollamaNoApiKey')}
                  </div>
                </div>
              )}

              {showEndpoint && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('endpointLabel')}</label>
                  <input
                    type="text"
                    value={settings.endpoint}
                    onChange={(e) => setSettings({ ...settings, endpoint: e.target.value })}
                    onBlur={() => {
                      if (isOllama) fetchOllamaModels(settings.endpoint);
                    }}
                    placeholder={AI_PROVIDERS[settings.provider].endpoint || t('endpointPlaceholder')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    {t('endpointHelp')}
                  </p>
                </div>
              )}
            </div>

            {showAzure && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('azureEndpointLabel')}</label>
                  <input
                    type="text"
                    value={settings.azureEndpoint}
                    onChange={(e) => setSettings({ ...settings, azureEndpoint: e.target.value })}
                    placeholder="https://your-resource.openai.azure.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('azureDeploymentLabel')}</label>
                  <input
                    type="text"
                    value={settings.azureDeployment}
                    onChange={(e) => setSettings({ ...settings, azureDeployment: e.target.value })}
                    placeholder="your-deployment-name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="text-blue-600 mt-1" size={18} />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">{t('providerTipsTitle')}</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('providerTip1')}</li>
                  <li>{t('providerTip2')}</li>
                  <li>{t('providerTip3')}</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <Shield className="text-green-600 mt-1" size={18} />
              <div className="text-sm text-green-800">
                <p className="font-medium mb-1">{t('privacyNotice')}</p>
                <p>{t('privacyWarning')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('saving')}
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    {t('saveConfig')}
                  </>
                )}
              </button>

              <button
                onClick={handleTest}
                disabled={testing || saving || (!settings.apiKey && !isOllama)}
                className="flex items-center gap-2 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {testing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                    {t('testing')}
                  </>
                ) : (
                  t('testConnection')
                )}
              </button>

              <button
                onClick={handleClear}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-3 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-60 transition-colors font-medium"
              >
                <Trash2 size={18} />
                {t('clearConfig')}
              </button>

              {statusMessage && (
                <span className={`text-sm font-medium ${statusType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {statusMessage}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Preferences - moved below AI settings */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="text-primary-500" size={24} />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t('languageSettings')}</h2>
              <p className="text-sm text-gray-600">{t('languageSettingsDescription')}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('interfaceLanguage')}
              </label>
              <select
                value={settings.language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
              >
                <option value="auto">{t('autoDetect')}</option>
                <option value="en">{t('english')}</option>
                <option value="zh-CN">{t('chinese')}</option>
              </select>
              <p className="mt-2 text-sm text-gray-500">
                {t('interfaceLanguageHelper')}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-t-4 border-primary-500">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left side - Project info */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">JSON-LD Checker</h3>
                <p className="text-sm text-gray-600">v2.0.0</p>
              </div>
            </div>

            {/* Center - Links */}
            <div className="flex items-center gap-6">
              <a 
                href="https://github.com/simonguo/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors group"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">GitHub</span>
              </a>

              <a 
                href="mailto:simonguo.2009@gmail.com?subject=JSON-LD%20Checker%20-%20Feedback" 
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors group"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium">{t('contact') || 'Contact'}</span>
              </a>

              <a 
                href="mailto:simonguo.2009@gmail.com?subject=JSON-LD%20Checker%20-%20Bug%20Report&body=Please%20describe%20the%20issue%3A%0A%0A" 
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors group"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-sm font-medium">{t('reportBug') || 'Report Bug'}</span>
              </a>
            </div>

            {/* Right side - Copyright */}
            <div className="text-center md:text-right">
              <p className="text-xs text-gray-500">
                {t('madeWith') || 'Made with'} ❤️ {t('by') || 'by'} <span className="font-medium text-gray-700">Simon Guo</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                © {new Date().getFullYear()} {t('copyright') || 'Copyright'} · {t('allRightsReserved') || 'All rights reserved'}
              </p>
            </div>
          </div>

          {/* Optional: Additional footer info */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
              <a href="https://schema.org" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                Schema.org {t('documentation') || 'Documentation'}
              </a>
              <span className="text-gray-300">•</span>
              <a href="https://developers.google.com/search/docs/appearance/structured-data" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                Google Rich Results
              </a>
              <span className="text-gray-300">•</span>
              <a href="https://search.google.com/test/rich-results" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                Rich Results Test
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
