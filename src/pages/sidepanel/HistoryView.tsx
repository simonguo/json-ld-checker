import { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, ExternalLink, Trash2 } from 'lucide-react';
import { Button, EmptyState } from '@/components/ui';
import { clearHistory, getHistory, type HistoryEntry } from '@/lib/history';
import { useI18n } from '@/lib/i18n';

export function HistoryView() {
  const { t } = useI18n();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingClear, setConfirmingClear] = useState(false);

  useEffect(() => {
    getHistory()
      .then(setHistory)
      .finally(() => setLoading(false));
  }, []);

  const handleClear = async () => {
    await clearHistory();
    setHistory([]);
    setConfirmingClear(false);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const diffMinutes = Math.floor((Date.now() - timestamp) / 60_000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMinutes < 1) return t('justNow');
    if (diffMinutes < 60) return t('minutesAgo', { count: diffMinutes });
    if (diffHours < 24) return t('hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('daysAgo', { count: diffDays });
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-white" aria-live="polite">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#c7d1e0] border-t-[#1a73e8]" />
      </div>
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex h-9 flex-none items-center gap-2 border-b border-[#c7d1e0] bg-[#f3f6fc] px-2">
        <Clock size={13} className="flex-none text-[#5f6368]" />
        <span className="min-w-0 flex-1 text-[10px] text-[#5f6368]">
          {t('historyCount', { count: history.length })}
        </span>
        {history.length > 0 && (
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-[3px] text-[#5f6368] hover:bg-[#e8eaed] hover:text-[#c5221f]"
            onClick={() => setConfirmingClear(true)}
            aria-label={t('clearHistory')}
            title={t('clearHistory')}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {confirmingClear && (
        <div
          role="alert"
          className="flex flex-none items-center gap-2 border-b border-[#f6aea9] bg-[#fce8e6] px-2 py-2"
        >
          <AlertCircle size={14} className="flex-none text-[#c5221f]" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-medium text-[#c5221f]">{t('confirmClearHistory')}</div>
            <div className="truncate text-[9px] text-[#9b2622]">{t('clearHistoryWarning')}</div>
          </div>
          <Button className="min-h-7 rounded-[3px] text-[10px]" size="sm" variant="danger" onClick={handleClear}>
            {t('clearHistory')}
          </Button>
          <Button className="min-h-7 rounded-[3px] text-[10px]" size="sm" variant="secondary" onClick={() => setConfirmingClear(false)}>
            {t('cancel')}
          </Button>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto">
        {history.length === 0 ? (
          <EmptyState
            icon={<Clock size={22} />}
            title={t('noHistory')}
            description={t('noHistoryDesc')}
            className="min-h-32"
          />
        ) : (
          <div className="divide-y divide-[#e1e5ea] bg-white">
            {history.map((entry) => {
              let hostname = entry.url;
              try {
                hostname = new URL(entry.url).hostname;
              } catch {
                // Keep the original value for non-standard URLs.
              }
              return (
                <div key={`${entry.url}-${entry.timestamp}`} className="group px-2 py-2 hover:bg-[#e8f0fe]">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex-none">
                      {entry.errorCount > 0 ? (
                        <AlertCircle size={14} className="text-[#c5221f]" />
                      ) : entry.warningCount > 0 ? (
                        <AlertTriangle size={14} className="text-[#b06000]" />
                      ) : (
                        <CheckCircle2 size={14} className="text-[#188038]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-[11px] font-medium text-[#202124]">
                          {entry.title || hostname}
                        </p>
                        <span className="flex-none font-mono text-[9px] text-[#5f6368]">{formatTime(entry.timestamp)}</span>
                      </div>
                      <p className="mt-0.5 truncate font-mono text-[9px] text-[#5f6368]">{hostname}</p>
                      <div className="mt-1 flex min-w-0 items-center gap-1.5 font-mono text-[9px] text-[#5f6368]">
                        <span className="min-w-0 truncate text-[#0b57d0]">
                          {entry.types.slice(0, 3).join(' · ')}
                        </span>
                        {entry.errorCount > 0 && <span className="flex-none text-[#c5221f]">E:{entry.errorCount}</span>}
                        {entry.warningCount > 0 && <span className="flex-none text-[#b06000]">W:{entry.warningCount}</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => chrome.tabs.create({ url: entry.url })}
                      className="flex h-7 w-7 flex-none items-center justify-center rounded-[3px] text-[#5f6368] opacity-60 hover:bg-white hover:text-[#0b57d0] group-hover:opacity-100"
                      aria-label={t('openPage')}
                      title={t('openPage')}
                    >
                      <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
