import { useCallback, useEffect, useMemo, useState } from 'react';
import { AI_PROVIDERS, type AIModel, type ProviderKey } from '@/config/ai-providers';
import { aiService } from '@/lib/ai-service';
import { useI18n } from '@/lib/i18n';

export interface SettingsState {
  provider: ProviderKey;
  model: string;
  apiKey: string;
  endpoint: string;
  azureEndpoint: string;
  azureDeployment: string;
  language: string;
}

const DEFAULT_SETTINGS: SettingsState = {
  provider: 'openai',
  model: AI_PROVIDERS.openai.models[0]?.id || 'gpt-5.6-terra',
  apiKey: '',
  endpoint: '',
  azureEndpoint: '',
  azureDeployment: '',
  language: 'auto',
};

export function useSettings() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<AIModel[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [ollamaError, setOllamaError] = useState<string | null>(null);
  const { t } = useI18n(settings.language);

  const fetchOllamaModels = useCallback(async (endpointUrl?: string) => {
    setFetchingModels(true);
    setOllamaError(null);
    try {
      const raw = endpointUrl || AI_PROVIDERS.ollama.endpoint || 'http://localhost:11434/v1/chat/completions';
      const origin = new URL(raw).origin;
      const response = await fetch(`${origin}/api/tags`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const models: AIModel[] = Array.isArray(payload?.models)
        ? payload.models.map((model: any) => ({ id: model.name, name: model.name }))
        : [];
      setOllamaModels(models);
      setSettings((current) => {
        if (current.provider !== 'ollama' || models.some((model) => model.id === current.model) || models.length === 0) {
          return current;
        }
        return { ...current, model: models[0].id };
      });
    } catch (error: any) {
      setOllamaModels([]);
      setOllamaError(error?.message || t('ollamaFetchFailed'));
    } finally {
      setFetchingModels(false);
    }
  }, [t]);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await chrome.storage.local.get([
          'ai_provider',
          'ai_model',
          'api_key',
          'api_endpoint',
          'azure_endpoint',
          'azure_deployment',
          'user_language',
          'onboarding_done',
        ]);
        const provider = (stored.ai_provider as ProviderKey) || DEFAULT_SETTINGS.provider;
        setSettings({
          provider,
          model: stored.ai_model || AI_PROVIDERS[provider]?.models[0]?.id || DEFAULT_SETTINGS.model,
          apiKey: stored.api_key || '',
          endpoint: stored.api_endpoint || '',
          azureEndpoint: stored.azure_endpoint || '',
          azureDeployment: stored.azure_deployment || '',
          language: stored.user_language || 'auto',
        });
        setShowOnboarding(!stored.onboarding_done && !stored.api_key);
      } catch {
        setStatus({ type: 'error', message: t('loadSettingsFailed') });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (settings.provider === 'ollama') fetchOllamaModels(settings.endpoint);
  }, [settings.provider]);

  useEffect(() => {
    setStatus(null);
  }, [
    settings.provider,
    settings.model,
    settings.apiKey,
    settings.endpoint,
    settings.azureEndpoint,
    settings.azureDeployment,
  ]);

  const models = useMemo(
    () => (settings.provider === 'ollama' ? ollamaModels : AI_PROVIDERS[settings.provider].models),
    [ollamaModels, settings.provider],
  );

  const update = <Key extends keyof SettingsState>(key: Key, value: SettingsState[Key]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const changeProvider = (provider: ProviderKey) => {
    setSettings((current) => ({
      ...current,
      provider,
      model: AI_PROVIDERS[provider].models[0]?.id || '',
      endpoint: AI_PROVIDERS[provider].endpoint || '',
    }));
  };

  const changeLanguage = async (language: string) => {
    update('language', language);
    try {
      await chrome.storage.local.set({ user_language: language });
      setStatus({ type: 'success', message: t('languageSaved') });
    } catch {
      setStatus({ type: 'error', message: t('saveFailed') });
    }
  };

  const save = async () => {
    setSaving(true);
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
      await aiService.setConfig({
        provider: settings.provider,
        model: settings.model,
        apiKey: settings.apiKey,
        endpoint: settings.endpoint,
        azureEndpoint: settings.azureEndpoint,
        azureDeployment: settings.azureDeployment,
      });
      setStatus({ type: 'success', message: t('configurationSaved') });
    } catch {
      setStatus({ type: 'error', message: t('saveFailed') });
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setTesting(true);
    setStatus(null);
    try {
      await aiService.setConfig({
        provider: settings.provider,
        model: settings.model,
        apiKey: settings.apiKey,
        endpoint: settings.endpoint,
        azureEndpoint: settings.azureEndpoint,
        azureDeployment: settings.azureDeployment,
      });
      await aiService.callAI(
        [{ role: 'user', content: 'Hello, this is a connection test. Reply with OK.' }],
        0.1,
      );
      setStatus({ type: 'success', message: t('connectionTestSuccess') });
    } catch (error: any) {
      setStatus({ type: 'error', message: error?.message || t('connectionTestFailed') });
    } finally {
      setTesting(false);
    }
  };

  const clear = async () => {
    setSaving(true);
    try {
      await chrome.storage.local.remove([
        'ai_provider',
        'ai_model',
        'api_key',
        'api_endpoint',
        'azure_endpoint',
        'azure_deployment',
      ]);
      setSettings((current) => ({ ...DEFAULT_SETTINGS, language: current.language }));
      await aiService.clearConfig();
      setStatus({ type: 'success', message: t('configCleared') });
    } catch {
      setStatus({ type: 'error', message: t('clearFailed') });
    } finally {
      setSaving(false);
    }
  };

  const dismissOnboarding = async () => {
    setShowOnboarding(false);
    await chrome.storage.local.set({ onboarding_done: true });
  };

  return {
    t,
    state: {
      settings,
      loading,
      saving,
      testing,
      status,
      showOnboarding,
      models,
      fetchingModels,
      ollamaError,
      isOllama: settings.provider === 'ollama',
      showEndpoint: settings.provider !== 'azure',
      showAzure: settings.provider === 'azure',
    },
    actions: {
      update,
      changeProvider,
      changeLanguage,
      save,
      test,
      clear,
      dismissOnboarding,
      fetchOllamaModels,
    },
  };
}
