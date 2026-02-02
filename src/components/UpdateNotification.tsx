import React, { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';

interface UpdateStatus {
  updateAvailable: boolean;
  availableVersion?: string;
  showUpdateNotification: boolean;
  lastVersion?: string;
  currentVersion: string;
}

interface UpdateNotificationProps {
  language?: string;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({ language = 'auto' }) => {
  const { t } = useI18n(language);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    checkUpdateStatus();
  }, []);

  const checkUpdateStatus = async () => {
    const response = await chrome.runtime.sendMessage({ action: 'getUpdateStatus' });
    setUpdateStatus(response);
  };

  const handleCheckForUpdates = async () => {
    setChecking(true);
    try {
      const response = await chrome.runtime.sendMessage({ action: 'checkForUpdates' });
      console.log('Update check result:', response);
      
      if (response.status === 'update_available') {
        setUpdateStatus({
          ...updateStatus!,
          updateAvailable: true,
          availableVersion: response.version
        });
      } else if (response.status === 'no_update') {
        // Show a temporary message
        alert(t('latestVersion'));
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleApplyUpdate = async () => {
    await chrome.runtime.sendMessage({ action: 'applyUpdate' });
  };

  const handleDismissNotification = async () => {
    await chrome.runtime.sendMessage({ action: 'dismissUpdateNotification' });
    setUpdateStatus({ ...updateStatus!, showUpdateNotification: false });
  };

  if (!updateStatus) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Update Available Banner */}
      {updateStatus.updateAvailable && (
        <div className="bg-primary-50 border border-primary-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-primary-700 mb-1">
                🎉 {t('updateAvailable')}
              </h4>
              <p className="text-sm text-primary-600 mb-3">
                {t('updateAvailableDesc', { version: updateStatus.availableVersion })}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleApplyUpdate}
                  className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
                >
                  {t('updateNow')}
                </button>
                <button
                  onClick={() => setUpdateStatus({ ...updateStatus, updateAvailable: false })}
                  className="px-4 py-2 bg-white text-primary-500 text-sm font-medium rounded-lg border border-primary-500 hover:bg-primary-50 transition-colors"
                >
                  {t('updateLater')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Just Updated Notification */}
      {updateStatus.showUpdateNotification && updateStatus.lastVersion && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-green-900 mb-1">
                ✨ {t('updateSuccess')}
              </h4>
              <p className="text-sm text-green-700 mb-2">
                {t('updateSuccessDesc', { from: updateStatus.lastVersion, to: updateStatus.currentVersion })}
              </p>
              <button
                onClick={handleDismissNotification}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                {t('dismiss')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Check Button */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{t('currentVersion')}:</span>
          <span className="text-sm font-semibold text-gray-900">v{updateStatus.currentVersion}</span>
        </div>
        <button
          onClick={handleCheckForUpdates}
          disabled={checking}
          className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {checking ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('checking')}
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t('checkForUpdates')}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
