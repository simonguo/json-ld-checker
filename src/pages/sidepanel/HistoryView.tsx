import React, { useState, useEffect } from 'react';
import { Trash2, ExternalLink, AlertCircle, AlertTriangle, Lightbulb, Clock } from 'lucide-react';
import { getHistory, clearHistory, HistoryEntry } from '@/lib/history';
import { useI18n } from '@/lib/i18n';

export const HistoryView: React.FC = () => {
  const { t } = useI18n();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    setLoading(true);
    const entries = await getHistory();
    setHistory(entries);
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClear = async () => {
    await clearHistory();
    setHistory([]);
  };

  const handleOpenUrl = (url: string) => {
    chrome.tabs.create({ url });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('justNow');
    if (diffMins < 60) return t('minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('daysAgo', { count: diffDays });
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
            <Clock className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-base font-medium text-gray-900 mb-1">{t('noHistory')}</h3>
          <p className="text-sm text-gray-500">{t('noHistoryDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{t('historyCount', { count: history.length })}</span>
        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {t('clearHistory')}
        </button>
      </div>

      {history.map((entry, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:border-primary-300 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                {entry.errorCount > 0 ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                    <AlertCircle className="w-3 h-3" />
                    {entry.errorCount} {t('errors')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                    ✓ {t('valid')}
                  </span>
                )}
                {entry.warningCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                    <AlertTriangle className="w-3 h-3" />
                    {entry.warningCount}
                  </span>
                )}
                {entry.suggestionCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                    <Lightbulb className="w-3 h-3" />
                    {entry.suggestionCount}
                  </span>
                )}
                <span className="text-xs text-gray-400 ml-auto">{formatTime(entry.timestamp)}</span>
              </div>
              <p className="text-sm font-medium text-gray-800 truncate">{entry.title || entry.url}</p>
              <p className="text-xs text-gray-400 truncate mt-0.5">{entry.url}</p>
              {entry.types.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {entry.types.map((type, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      {type}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => handleOpenUrl(entry.url)}
              className="flex-shrink-0 p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
              title={t('openPage')}
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
