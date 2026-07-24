import { useState } from 'react';
import { Braces, Info, KeyRound, SlidersHorizontal } from 'lucide-react';
import { Notice } from '@/components/ui';
import { AboutSection } from './components/AboutSection';
import { AiProviderSection } from './components/AiProviderSection';
import { GeneralSection } from './components/GeneralSection';
import { OnboardingChecklist } from './components/OnboardingChecklist';
import { useSettings } from './hooks/useSettings';

type SettingsView = 'general' | 'ai' | 'about';

export default function OptionsPage() {
  const { t, state, actions } = useSettings();
  const [activeView, setActiveView] = useState<SettingsView>('general');
  const version = typeof chrome !== 'undefined' && chrome.runtime?.getManifest
    ? chrome.runtime.getManifest().version
    : '2.3.2';

  const navigation = [
    { value: 'general' as const, label: t('general'), icon: SlidersHorizontal },
    { value: 'ai' as const, label: t('aiProvider'), icon: KeyRound },
    { value: 'about' as const, label: t('updatesAndAbout'), icon: Info },
  ];

  if (state.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-ink text-white">
            <Braces size={15} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold">{t('settingsTitle')}</h1>
            <p className="font-mono text-[10px] text-muted">JSON-LD Checker v{version}</p>
          </div>
        </div>
      </header>

      <div className="border-b border-border bg-surface md:hidden">
        <nav className="mx-auto flex max-w-6xl overflow-x-auto px-2" aria-label={t('settingsNavigation')}>
          {navigation.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveView(value)}
              className={[
                'relative flex min-h-11 min-w-max items-center gap-1.5 px-3 text-xs font-medium',
                activeView === value ? 'text-accent-600' : 'text-muted hover:text-ink',
              ].join(' ')}
            >
              <Icon size={14} />
              {label}
              {activeView === value && <span className="absolute inset-x-2 bottom-0 h-0.5 bg-accent-500" />}
            </button>
          ))}
        </nav>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-5 sm:px-6 md:grid-cols-[200px_minmax(0,1fr)] md:py-8">
        <aside className="hidden md:block">
          <nav className="sticky top-6 space-y-1" aria-label={t('settingsNavigation')}>
            {navigation.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setActiveView(value)}
                aria-current={activeView === value ? 'page' : undefined}
                className={[
                  'flex w-full items-center gap-2 rounded-tool px-3 py-2 text-left text-xs font-medium transition-colors',
                  activeView === value
                    ? 'bg-accent-50 text-accent-700'
                    : 'text-muted hover:bg-gray-100 hover:text-ink',
                ].join(' ')}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 space-y-4">
          {state.showOnboarding && (
            <OnboardingChecklist onDismiss={actions.dismissOnboarding} t={t} />
          )}

          {state.status && (
            <Notice tone={state.status.type === 'success' ? 'success' : 'danger'}>
              {state.status.message}
            </Notice>
          )}

          {activeView === 'general' && (
            <GeneralSection
              language={state.settings.language}
              onLanguageChange={actions.changeLanguage}
              t={t}
            />
          )}

          {activeView === 'ai' && (
            <AiProviderSection
              settings={state.settings}
              models={state.models}
              isOllama={state.isOllama}
              showEndpoint={state.showEndpoint}
              showAzure={state.showAzure}
              fetchingModels={state.fetchingModels}
              ollamaError={state.ollamaError}
              saving={state.saving}
              testing={state.testing}
              onUpdate={actions.update}
              onProviderChange={actions.changeProvider}
              onRefreshModels={() => actions.fetchOllamaModels(state.settings.endpoint)}
              onSave={actions.save}
              onTest={actions.test}
              onClear={actions.clear}
              t={t}
            />
          )}

          {activeView === 'about' && (
            <AboutSection version={version} language={state.settings.language} t={t} />
          )}
        </main>
      </div>
    </div>
  );
}
