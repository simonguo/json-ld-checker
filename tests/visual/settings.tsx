import ReactDOM from 'react-dom/client';
import { Braces, Info, KeyRound, SlidersHorizontal } from 'lucide-react';
import '../../src/index.css';
import en from '../../src/lib/i18n/en';
import { AI_PROVIDERS } from '../../src/config/ai-providers';
import { AiProviderSection } from '../../src/pages/options/components/AiProviderSection';
import type { SettingsState } from '../../src/pages/options/hooks/useSettings';

const t = (key: string) => (en as Record<string, string>)[key] || key;

const settings: SettingsState = {
  provider: 'deepseek',
  model: 'deepseek-v4-pro',
  apiKey: 'sk-visual-fixture-key',
  endpoint: AI_PROVIDERS.deepseek.endpoint || '',
  azureEndpoint: '',
  azureDeployment: '',
  language: 'en',
};

function SettingsVisualFixture() {
  const navigation = [
    { label: t('general'), icon: SlidersHorizontal },
    { label: t('aiProvider'), icon: KeyRound, active: true },
    { label: t('updatesAndAbout'), icon: Info },
  ];

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-border bg-surface">
        <div className="flex h-14 items-center gap-3 px-5">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-ink text-white">
            <Braces size={15} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold">{t('settingsTitle')}</h1>
            <p className="font-mono text-[10px] text-muted">JSON-LD Checker v2.5.0</p>
          </div>
        </div>
      </header>

      <div className="grid gap-5 px-5 py-5 md:grid-cols-[178px_minmax(0,1fr)]">
        <aside>
          <nav className="space-y-1" aria-label={t('settingsNavigation')}>
            {navigation.map(({ label, icon: Icon, active }) => (
              <div
                key={label}
                className={[
                  'flex w-full items-center gap-2 rounded-tool px-3 py-2 text-left text-xs font-medium',
                  active
                    ? 'bg-accent-50 text-accent-700'
                    : 'text-muted',
                ].join(' ')}
              >
                <Icon size={15} />
                {label}
              </div>
            ))}
          </nav>
        </aside>

        <main className="min-w-0">
          <AiProviderSection
            settings={settings}
            models={AI_PROVIDERS.deepseek.models}
            isOllama={false}
            showEndpoint
            showAzure={false}
            fetchingModels={false}
            ollamaError={null}
            saving={false}
            testing={false}
            onUpdate={() => undefined}
            onProviderChange={() => undefined}
            onRefreshModels={() => undefined}
            onSave={() => undefined}
            onTest={() => undefined}
            onClear={() => undefined}
            t={t}
          />
        </main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<SettingsVisualFixture />);
