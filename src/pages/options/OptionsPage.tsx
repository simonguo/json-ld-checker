import React, { useState, useEffect } from 'react';
import { Save, Key, Globe, Eye, EyeOff, Trash2, Info, Shield } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { AI_PROVIDERS, getProviderApiKeyLink, ProviderKey } from '@/config/ai-providers';
import { aiService } from '@/lib/ai-service';

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
  const { t } = useI18n(settings.language);

  const models = AI_PROVIDERS[settings.provider].models;

  useEffect(() => {
    loadSettings();
  }, []);

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
  const showEndpoint = ['openai', 'anthropic', 'google', 'openrouter', 'custom'].includes(settings.provider);
  const showAzure = settings.provider === 'azure';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="text-blue-600" size={24} />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t('settingsTitle')}</h2>
            </div>
          </div>
          <p className="text-sm text-gray-600 ml-9">{t('settingsDescription')}</p>
        </div>
        
        {/* AI Provider */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Key className="text-blue-600" size={24} />
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
                <select
                  value={settings.model}
                  onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-gray-500">{t('modelHelp')}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('apiKeyLabel')}</label>
                <div className="flex items-center gap-2">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={settings.apiKey}
                    onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                    placeholder={AI_PROVIDERS[settings.provider].apiKeyPrefix || t('apiKeyPlaceholder')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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

              {showEndpoint && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('endpointLabel')}</label>
                  <input
                    type="text"
                    value={settings.endpoint}
                    onChange={(e) => setSettings({ ...settings, endpoint: e.target.value })}
                    placeholder={AI_PROVIDERS[settings.provider].endpoint || t('endpointPlaceholder')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('azureDeploymentLabel')}</label>
                  <input
                    type="text"
                    value={settings.azureDeployment}
                    onChange={(e) => setSettings({ ...settings, azureDeployment: e.target.value })}
                    placeholder="your-deployment-name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
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
                disabled={testing || saving || !settings.apiKey}
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
            <Globe className="text-blue-600" size={24} />
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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

        {/* Contact */}
        <div className="text-center py-6 text-sm text-gray-600">
          <p>Contact: <a href="mailto:simonguo.2009@gmail.com" className="text-blue-600 hover:text-blue-700 hover:underline">simonguo.2009@gmail.com</a></p>
        </div>
      </div>
    </div>
  );
}
