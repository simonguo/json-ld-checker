import { useState } from 'react';
import { Eye, EyeOff, KeyRound, LockKeyhole, RefreshCw, Save, Trash2, Unplug } from 'lucide-react';
import { AI_PROVIDERS, getProviderApiKeyLink, type AIModel, type ProviderKey } from '@/config/ai-providers';
import { Badge, Button, Field, Notice, controlClassName } from '@/components/ui';
import type { SettingsState } from '../hooks/useSettings';
import { SettingsSection, type Translator } from './SettingsSection';

const providerGroups = ['global', 'china', 'runtime'] as const;

interface AiProviderSectionProps {
  settings: SettingsState;
  models: AIModel[];
  isOllama: boolean;
  showEndpoint: boolean;
  showAzure: boolean;
  fetchingModels: boolean;
  ollamaError: string | null;
  saving: boolean;
  testing: boolean;
  onUpdate: <Key extends keyof SettingsState>(key: Key, value: SettingsState[Key]) => void;
  onProviderChange: (provider: ProviderKey) => void;
  onRefreshModels: () => void;
  onSave: () => void;
  onTest: () => void;
  onClear: () => void;
  t: Translator;
}

export function AiProviderSection({
  settings,
  models,
  isOllama,
  showEndpoint,
  showAzure,
  fetchingModels,
  ollamaError,
  saving,
  testing,
  onUpdate,
  onProviderChange,
  onRefreshModels,
  onSave,
  onTest,
  onClear,
  t,
}: AiProviderSectionProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const isCustom = settings.provider === 'custom';
  const isAzure = settings.provider === 'azure';
  const canTest =
    (isOllama || Boolean(settings.apiKey)) &&
    Boolean(settings.model.trim()) &&
    (!isCustom || Boolean(settings.endpoint.trim())) &&
    (!isAzure ||
      Boolean(settings.azureEndpoint.trim() && settings.azureDeployment.trim()));
  const configured = canTest;
  const apiKeyLink = getProviderApiKeyLink(settings.provider);
  const providerGroupLabels = {
    global: t('providerGroupGlobal'),
    china: t('providerGroupChina'),
    runtime: t('providerGroupRuntime'),
  };

  return (
    <SettingsSection title={t('aiProvider')} description={t('aiConfigDescription')}>
      <div className="space-y-5">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <KeyRound size={16} className="text-muted" />
          <span className="text-xs font-medium text-ink">{t('apiStatusLabel')}</span>
          <Badge tone={configured ? 'success' : 'warning'}>
            {configured ? t('statusConfigured') : t('statusUnconfigured')}
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t('providerLabel')} hint={t('providerHelp')}>
            <select
              aria-label={t('providerLabel')}
              value={settings.provider}
              onChange={(event) => onProviderChange(event.target.value as ProviderKey)}
              className={controlClassName}
            >
              {providerGroups.map((group) => (
                <optgroup key={group} label={providerGroupLabels[group]}>
                  {Object.entries(AI_PROVIDERS)
                    .filter(([, provider]) => provider.group === group)
                    .map(([key, provider]) => (
                      <option key={key} value={key}>{provider.name}</option>
                    ))}
                </optgroup>
              ))}
            </select>
          </Field>

          <Field
            label={t('modelLabel')}
            hint={isCustom ? t('customModelHelp') : ollamaError || t('modelHelp')}
          >
            <div className="flex gap-2">
              {isCustom ? (
                <input
                  type="text"
                  aria-label={t('modelLabel')}
                  value={settings.model}
                  onChange={(event) => onUpdate('model', event.target.value)}
                  placeholder={t('customModelPlaceholder')}
                  className={`${controlClassName} font-mono`}
                  autoComplete="off"
                />
              ) : (
                <select
                  aria-label={t('modelLabel')}
                  value={settings.model}
                  onChange={(event) => onUpdate('model', event.target.value)}
                  disabled={isOllama && fetchingModels}
                  className={controlClassName}
                >
                  {isOllama && fetchingModels && <option value="">{t('ollamaFetchingModels')}</option>}
                  {isOllama && !fetchingModels && models.length === 0 && (
                    <option value="">{ollamaError ? t('ollamaFetchFailed') : t('ollamaNoModels')}</option>
                  )}
                  {models.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
                </select>
              )}
              {isOllama && (
                <Button
                  variant="secondary"
                  aria-label={t('ollamaRefreshModels')}
                  onClick={onRefreshModels}
                  disabled={fetchingModels}
                  icon={<RefreshCw size={15} className={fetchingModels ? 'animate-spin' : ''} />}
                />
              )}
            </div>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {!isOllama ? (
            <Field
              label={t('apiKeyLabel')}
              hint={
                <>
                  {t('apiKeyHelp')}
                  {apiKeyLink !== '#' && (
                    <>
                      {' '}
                      <a
                        href={apiKeyLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent-600 hover:underline"
                      >
                        {t('getApiKey')}
                      </a>
                    </>
                  )}
                </>
              }
            >
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  aria-label={t('apiKeyLabel')}
                  value={settings.apiKey}
                  onChange={(event) => onUpdate('apiKey', event.target.value)}
                  placeholder={AI_PROVIDERS[settings.provider].apiKeyPrefix || t('apiKeyPlaceholder')}
                  className={`${controlClassName} pr-10 font-mono`}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((current) => !current)}
                  className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded text-muted hover:bg-gray-100 hover:text-ink"
                  aria-label={showApiKey ? t('hideApiKey') : t('showApiKey')}
                >
                  {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>
          ) : (
            <Field label={t('apiKeyLabel')}>
              <div className="rounded-tool border border-border bg-gray-50 px-3 py-2 text-sm text-muted">
                {t('ollamaNoApiKey')}
              </div>
            </Field>
          )}

          {showEndpoint && (
            <Field
              label={isCustom ? t('endpointLabelRequired') : t('endpointLabel')}
              hint={isCustom ? t('customEndpointHelp') : t('endpointHelp')}
            >
              <input
                type="url"
                aria-label={isCustom ? t('endpointLabelRequired') : t('endpointLabel')}
                value={settings.endpoint}
                onChange={(event) => onUpdate('endpoint', event.target.value)}
                onBlur={isOllama ? onRefreshModels : undefined}
                placeholder={AI_PROVIDERS[settings.provider].endpoint || t('endpointPlaceholder')}
                className={`${controlClassName} font-mono text-xs`}
              />
            </Field>
          )}
        </div>

        {showAzure && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t('azureEndpointLabel')}>
              <input
                type="url"
                aria-label={t('azureEndpointLabel')}
                value={settings.azureEndpoint}
                onChange={(event) => onUpdate('azureEndpoint', event.target.value)}
                placeholder="https://your-resource.openai.azure.com"
                className={`${controlClassName} font-mono text-xs`}
              />
            </Field>
            <Field label={t('azureDeploymentLabel')}>
              <input
                aria-label={t('azureDeploymentLabel')}
                value={settings.azureDeployment}
                onChange={(event) => onUpdate('azureDeployment', event.target.value)}
                placeholder="deployment-name"
                className={`${controlClassName} font-mono text-xs`}
              />
            </Field>
          </div>
        )}

        <div className="flex items-start gap-2 border-t border-border pt-4 text-xs leading-5 text-muted">
          <LockKeyhole size={15} className="mt-0.5 flex-none" />
          <p>{t('privacyWarning')} {t('privacyStorage')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            icon={<Save size={15} />}
            onClick={onSave}
            disabled={saving}
          >
            {saving ? t('saving') : t('saveConfig')}
          </Button>
          <Button
            variant="secondary"
            icon={<Unplug size={15} />}
            onClick={onTest}
            disabled={testing || saving || !canTest}
          >
            {testing ? t('testing') : t('testConnection')}
          </Button>
        </div>

        <div className="border-t border-border pt-4">
          {!confirmClear ? (
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 size={14} />}
              className="text-danger-500 hover:bg-danger-50 hover:text-danger-600"
              onClick={() => setConfirmClear(true)}
              disabled={saving}
            >
              {t('clearConfig')}
            </Button>
          ) : (
            <Notice
              tone="danger"
              title={t('confirmClearConfigTitle')}
              actions={
                <>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      onClear();
                      setConfirmClear(false);
                    }}
                  >
                    {t('clearConfig')}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setConfirmClear(false)}>
                    {t('cancel')}
                  </Button>
                </>
              }
            >
              {t('confirmClearConfig')}
            </Notice>
          )}
        </div>
      </div>
    </SettingsSection>
  );
}
