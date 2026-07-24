import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bot, FilePlus2, Loader2, RefreshCw, SearchCheck, Settings } from 'lucide-react';
import { Button } from '@/components/ui';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { aiService } from '@/lib/ai-service';
import { useI18n } from '@/lib/i18n';

type AssistMode = 'review' | 'generate';

export function AssistView({
  data,
  cacheKey,
  onClose,
}: {
  data?: any;
  cacheKey: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [mode, setMode] = useState<AssistMode>(data ? 'review' : 'generate');
  const [configured, setConfigured] = useState(aiService.isConfigured());
  const [loadingMode, setLoadingMode] = useState<AssistMode | null>(null);
  const [results, setResults] = useState<Record<AssistMode, string | null>>({
    review: null,
    generate: null,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!data && mode === 'review') setMode('generate');
  }, [data, mode]);

  useEffect(() => {
    aiService.initialize().then(() => setConfigured(aiService.isConfigured()));

    const handleChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => {
      const configKeys = ['ai_provider', 'ai_model', 'api_key', 'api_endpoint', 'azure_endpoint', 'azure_deployment'];
      if (areaName === 'local' && configKeys.some((key) => key in changes)) {
        aiService.initialize().then(() => setConfigured(aiService.isConfigured()));
      }
    };
    chrome.storage.onChanged.addListener(handleChange);
    return () => chrome.storage.onChanged.removeListener(handleChange);
  }, []);

  useEffect(() => {
    setResults((current) => ({ ...current, review: null }));
    if (!cacheKey || !data) return;
    chrome.storage.session.get([`aiCheck_${cacheKey}`], (stored) => {
      const cached = stored[`aiCheck_${cacheKey}`];
      if (cached) setResults((current) => ({ ...current, review: cached }));
    });
  }, [cacheKey, data]);

  const modeItems = useMemo(
    () => [
      {
        value: 'review' as const,
        label: <span className="flex items-center gap-1"><SearchCheck size={13} />{t('reviewMarkup')}</span>,
        disabled: !data,
      },
      {
        value: 'generate' as const,
        label: <span className="flex items-center gap-1"><FilePlus2 size={13} />{t('generateDraft')}</span>,
      },
    ],
    [data, t],
  );

  const run = async () => {
    if (!configured) {
      chrome.runtime.openOptionsPage();
      return;
    }

    setLoadingMode(mode);
    setError(null);
    try {
      if (mode === 'review') {
        if (!data) throw new Error(t('noJsonLdToCheck'));
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const result = await aiService.checkJsonLd(data, tab.url || '');
        setResults((current) => ({ ...current, review: result }));
        if (cacheKey) chrome.storage.session.set({ [`aiCheck_${cacheKey}`]: result });
      } else {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab.id || !tab.url) throw new Error(t('unableToGetPageInfo'));
        const response = await chrome.runtime.sendMessage({
          action: 'getPageInfo',
          tabId: tab.id,
        });
        if (!response) throw new Error(t('unableToGetPageInfo'));
        const result = await aiService.suggestJsonLd({
          url: tab.url,
          title: response.title || '',
          description: response.description || '',
          existingJsonLd: response.existingJsonLd || [],
        });
        setResults((current) => ({ ...current, generate: result }));
      }
    } catch (runError: any) {
      setError(runError?.message || (mode === 'review' ? t('aiCheckFailed') : t('aiSuggestFailed')));
    } finally {
      setLoadingMode(null);
    }
  };

  const result = results[mode];
  const loading = loadingMode === mode;
  const title = mode === 'review' ? t('reviewMarkup') : t('generateDraft');
  const description = mode === 'review' ? t('aiCheckDescription') : t('aiSuggestDescription');

  return (
    <section className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex h-9 flex-none items-stretch border-b border-[#c7d1e0] bg-[#f3f6fc] px-1">
        <button
          type="button"
          onClick={onClose}
          className="my-1 flex h-7 w-7 flex-none items-center justify-center rounded-[3px] text-[#5f6368] hover:bg-[#e8eaed] hover:text-[#202124]"
          aria-label={t('back')}
          title={t('back')}
        >
          <ArrowLeft size={14} />
        </button>
        <span className="my-2 mx-1 w-px flex-none bg-[#d6deeb]" aria-hidden="true" />
        <div role="group" aria-label={t('aiTools')} className="flex min-w-0 flex-1 items-stretch">
          {modeItems.map((item) => {
            const active = mode === item.value;
            return (
              <button
                key={item.value}
                type="button"
                disabled={item.disabled}
                aria-pressed={active}
                onClick={() => {
                  setMode(item.value);
                  setError(null);
                }}
                className={[
                  'relative flex min-w-0 flex-1 items-center justify-center px-1 text-[10px] font-medium transition-colors',
                  active ? 'bg-white text-[#0b57d0]' : 'text-[#3c4043] hover:bg-[#e8eef8]',
                  item.disabled ? 'pointer-events-none opacity-40' : '',
                ].join(' ')}
              >
                <span className="truncate">{item.label}</span>
                {active && <span className="absolute inset-x-1 bottom-0 h-0.5 bg-[#1a73e8]" />}
              </button>
            );
          })}
        </div>
      </div>

      {!configured && (
        <div
          role="status"
          className="flex flex-none items-center gap-2 border-b border-[#f9ab00] bg-[#fef7e0] px-2 py-1.5"
        >
          <Settings size={13} className="flex-none text-[#b06000]" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-medium text-[#7a4d00]">{t('aiNotConfigured')}</div>
            <div className="truncate text-[9px] text-[#7a4d00]">{t('aiConfigurationRequired')}</div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="min-h-7 border-[#e6b94f] bg-transparent text-[10px]"
            onClick={() => chrome.runtime.openOptionsPage()}
          >
            {t('configureApiKey')}
          </Button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex flex-none items-center gap-2 border-b border-[#f6aea9] bg-[#fce8e6] px-2 py-1.5 text-[10px] text-[#c5221f]"
        >
          <span className="min-w-0 flex-1">{error}</span>
          <button type="button" className="font-medium underline" onClick={run}>{t('retry')}</button>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-auto">
        <div className="flex flex-none items-start gap-2.5 border-b border-[#d6deeb] px-3 py-3">
          <Bot size={16} className="mt-0.5 flex-none text-[#0b57d0]" />
          <div className="min-w-0 flex-1">
            <h2 className="text-[12px] font-medium text-[#202124]">{title}</h2>
            <p className="mt-0.5 text-[10px] leading-4 text-[#5f6368]">{description}</p>
          </div>
          {!loading && !result && (
            <Button
              variant="primary"
              size="sm"
              className="min-h-7 flex-none rounded-[3px] text-[10px]"
              icon={mode === 'review' ? <SearchCheck size={13} /> : <FilePlus2 size={13} />}
              onClick={run}
              disabled={!configured}
            >
              {mode === 'review' ? t('aiCheck') : t('generateDraft')}
            </Button>
          )}
        </div>

        <div className="min-h-0 flex-1">
          {loading ? (
            <div className="flex h-full min-h-36 flex-col items-center justify-center text-center">
              <Loader2 size={18} className="animate-spin text-[#0b57d0]" />
              <p className="mt-2 text-[11px] font-medium text-[#202124]">
                {mode === 'review' ? t('aiAnalyzing') : t('aiAnalyzingPage')}
              </p>
              <p className="mt-1 text-[10px] text-[#5f6368]">{t('mayTakeFewSeconds')}</p>
            </div>
          ) : result ? (
            <div className="h-full">
              <div className="flex h-8 items-center justify-between border-b border-[#d6deeb] bg-[#f8f9fa] px-2">
                <span className="font-mono text-[9px] text-[#5f6368]">
                  {mode === 'review' ? t('aiCheckResults') : t('aiSuggestResults')}
                </span>
                <button
                  type="button"
                  onClick={run}
                  className="inline-flex h-6 items-center gap-1 rounded-[3px] px-1.5 text-[9px] text-[#5f6368] hover:bg-[#e8eaed] hover:text-[#202124]"
                >
                  <RefreshCw size={11} />
                  {mode === 'review' ? t('recheckAi') : t('regenerate')}
                </button>
              </div>
              <MarkdownRenderer className="p-3">{result}</MarkdownRenderer>
            </div>
          ) : (
            <div className="flex min-h-32 items-start gap-2 px-3 py-4 text-[#5f6368]">
              {mode === 'review' ? <SearchCheck size={15} /> : <FilePlus2 size={15} />}
              <div>
                <p className="text-[11px] text-[#3c4043]">{title}</p>
                <p className="mt-1 max-w-md text-[10px] leading-4">{description}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
