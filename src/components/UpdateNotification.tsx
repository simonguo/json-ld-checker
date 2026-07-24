import { useEffect, useState } from 'react';
import { CheckCircle2, Download, RefreshCw } from 'lucide-react';
import { Badge, Button, Notice } from '@/components/ui';
import { useI18n } from '@/lib/i18n';

interface UpdateStatus {
  updateAvailable: boolean;
  availableVersion?: string;
  showUpdateNotification: boolean;
  lastVersion?: string;
  currentVersion: string;
}

export function UpdateNotification({ language = 'auto' }: { language?: string }) {
  const { t } = useI18n(language);
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
      setStatus({
        updateAvailable: false,
        showUpdateNotification: false,
        currentVersion: 'development',
      });
      return;
    }
    chrome.runtime.sendMessage({ action: 'getUpdateStatus' }).then(setStatus);
  }, []);

  const checkForUpdates = async () => {
    setChecking(true);
    setMessage(null);
    try {
      const response = await chrome.runtime.sendMessage({ action: 'checkForUpdates' });
      if (response.status === 'update_available') {
        setStatus((current) => current ? {
          ...current,
          updateAvailable: true,
          availableVersion: response.version,
        } : current);
      } else if (response.status === 'no_update') {
        setMessage(t('latestVersion'));
      }
    } catch {
      setMessage(t('updateCheckFailed'));
    } finally {
      setChecking(false);
    }
  };

  if (!status) {
    return <div className="h-9 w-full animate-pulse rounded-tool bg-gray-100" />;
  }

  return (
    <div className="space-y-3">
      {status.updateAvailable && (
        <Notice
          tone="accent"
          title={t('updateAvailable')}
          actions={
            <>
              <Button
                size="sm"
                variant="primary"
                icon={<Download size={14} />}
                onClick={() => chrome.runtime.sendMessage({ action: 'applyUpdate' })}
              >
                {t('updateNow')}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setStatus((current) => current ? { ...current, updateAvailable: false } : current)}
              >
                {t('updateLater')}
              </Button>
            </>
          }
        >
          {t('updateAvailableDesc', { version: status.availableVersion || '' })}
        </Notice>
      )}

      {status.showUpdateNotification && status.lastVersion && (
        <Notice
          tone="success"
          title={t('updateSuccess')}
          actions={
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                await chrome.runtime.sendMessage({ action: 'dismissUpdateNotification' });
                setStatus((current) => current ? { ...current, showUpdateNotification: false } : current);
              }}
            >
              {t('dismiss')}
            </Button>
          }
        >
          {t('updateSuccessDesc', { from: status.lastVersion, to: status.currentVersion })}
        </Notice>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-tool border border-border bg-gray-50 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <span className="text-xs text-muted">{t('currentVersion')}</span>
          <Badge className="ml-2">v{status.currentVersion}</Badge>
        </div>
        <Button
          size="sm"
          variant="secondary"
          icon={<RefreshCw size={14} className={checking ? 'animate-spin' : ''} />}
          onClick={checkForUpdates}
          disabled={checking}
        >
          {checking ? t('checking') : t('checkForUpdates')}
        </Button>
      </div>

      {message && (
        <p className="flex items-center gap-1.5 text-xs text-muted" role="status">
          <CheckCircle2 size={14} className="text-success-500" />
          {message}
        </p>
      )}
    </div>
  );
}
