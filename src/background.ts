// Background service worker

import { validator } from './lib/validator';
import { RELEASES_URL } from './config/project';

// ============================================
// Version Update Detection & Management
// ============================================

// Check for updates when extension starts
chrome.runtime.onInstalled.addListener((details) => {
  const currentVersion = chrome.runtime.getManifest().version;
  
  if (details.reason === 'install') {
    // Open welcome page on first install
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/pages/options/index.html')
    });
  } else if (details.reason === 'update') {
    const previousVersion = details.previousVersion;
    
    // Store update info for showing changelog and clear the pending-update flags
    // since the update has now been applied.
    chrome.storage.local.set({
      lastVersion: previousVersion,
      currentVersion: currentVersion,
      showUpdateNotification: true,
      updateTime: Date.now(),
      updateAvailable: false,
      availableVersion: null
    });
    
    // Show notification about the update
    showUpdateNotification(previousVersion, currentVersion);
  }
});

// Listen for update available event
chrome.runtime.onUpdateAvailable.addListener((details) => {
  // Store that an update is available
  chrome.storage.local.set({
    updateAvailable: true,
    availableVersion: details.version
  });
  
  // Show notification to user
  chrome.notifications.create('update-available', {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/png/icon-128.png'),
    title: 'JSON-LD Checker Update Available',
    message: `Version ${details.version} is ready to install. Click to update now.`,
    buttons: [
      { title: 'Update Now' },
      { title: 'Later' }
    ],
    requireInteraction: true
  });
});

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId === 'update-available') {
    // Reload extension to apply update
    chrome.runtime.reload();
  }
});

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (notificationId === 'update-available') {
    if (buttonIndex === 0) {
      // Update Now
      chrome.runtime.reload();
    }
    chrome.notifications.clear(notificationId);
  } else if (notificationId === 'extension-updated') {
    if (buttonIndex === 0) {
      // View Changelog
      chrome.tabs.create({
        url: RELEASES_URL
      });
    }
    chrome.notifications.clear(notificationId);
  }
});

// Function to show update notification
function showUpdateNotification(fromVersion: string, toVersion: string) {
  chrome.notifications.create('extension-updated', {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/png/icon-128.png'),
    title: '✨ JSON-LD Checker Updated!',
    message: `Successfully updated from v${fromVersion} to v${toVersion}`,
    buttons: [
      { title: 'View Changes' },
      { title: 'Dismiss' }
    ],
    requireInteraction: false
  });
}

// ============================================
// Icon Management
// ============================================

const ICON_ACTIVE = {
  16: chrome.runtime.getURL('icons/png/icon-active-16.png'),
  32: chrome.runtime.getURL('icons/png/icon-active-32.png'),
  48: chrome.runtime.getURL('icons/png/icon-active-48.png'),
  128: chrome.runtime.getURL('icons/png/icon-active-128.png')
};

const ICON_INACTIVE = {
  16: chrome.runtime.getURL('icons/png/icon-inactive-16.png'),
  32: chrome.runtime.getURL('icons/png/icon-inactive-32.png'),
  48: chrome.runtime.getURL('icons/png/icon-inactive-48.png'),
  128: chrome.runtime.getURL('icons/png/icon-inactive-128.png')
};

// Store JSON-LD data for each tab
const tabData = new Map();

// Update extension icon and badge for a tab based on scan result
function updateTabIcon(tabId: number, data: { found: boolean; count: number; data: any[] }) {
  if (data.found) {
    let hasErrors = false;
    if (data.data && Array.isArray(data.data)) {
      for (const item of data.data) {
        const results = validator.validate(item);
        if (results.errors.length > 0) {
          hasErrors = true;
          break;
        }
      }
    }
    chrome.action.setIcon({ tabId, path: ICON_ACTIVE }).catch(() => {});
    if (hasErrors) {
      chrome.action.setBadgeText({ tabId, text: '!' });
      chrome.action.setBadgeBackgroundColor({ tabId, color: '#ef4444' });
    } else {
      chrome.action.setBadgeText({ tabId, text: data.count.toString() });
      chrome.action.setBadgeBackgroundColor({ tabId, color: '#22c55e' });
    }
    chrome.action.setTitle({ tabId, title: chrome.i18n.getMessage('iconTitleFound', [data.count.toString()]) });
  } else {
    chrome.action.setIcon({ tabId, path: ICON_INACTIVE }).catch(() => {});
    chrome.action.setBadgeText({ tabId, text: '' });
    chrome.action.setTitle({ tabId, title: chrome.i18n.getMessage('iconTitleNotFound') });
  }
}

// Clear cached data when a tab navigates to a new page
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    tabData.delete(tabId);
  }
});

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getJsonLdData') {
    const tabId = request.tabId;

    // Return cached result immediately if available
    if (tabData.has(tabId)) {
      sendResponse(tabData.get(tabId));
      return;
    }

    // Otherwise scan the tab on demand
    chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const elements = document.querySelectorAll('script[type="application/ld+json"]');
        const data: any[] = [];
        const rawTexts: string[] = [];
        elements.forEach((el: Element) => {
          const raw = el.textContent || '';
          try {
            data.push(JSON.parse(raw));
            rawTexts.push(raw);
          } catch (_) {}
        });
        return { found: data.length > 0, count: data.length, data, rawTexts };
      }
    }).then((results) => {
      const result = results?.[0]?.result ?? null;
      if (result) {
        tabData.set(tabId, result);
        updateTabIcon(tabId, result);
      }
      sendResponse(result);
    }).catch(() => sendResponse(null));

    return true;
  }
  
  if (request.action === 'getPageInfo') {
    const tabId = request.tabId;
    
    try {
      // Use Manifest V3 API to execute script
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
          return {
            title: document.title,
            description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
            existingJsonLd: Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(el => {
              const raw = el.textContent || '';
              try {
                return JSON.parse(raw);
              } catch (e) {
                return null;
              }
            }).filter(data => data !== null),
            rawTexts: Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(el => el.textContent || ''),
          };
        }
      }).then((results) => {
        if (results && results[0] && results[0].result) {
          const pageInfo = results[0].result;
          sendResponse({
            title: pageInfo.title,
            description: pageInfo.description,
            existingJsonLd: pageInfo.existingJsonLd
          });
        } else {
          sendResponse(null);
        }
      }).catch((error) => {
        console.error('Error executing script:', error);
        sendResponse(null);
      });
    } catch (error) {
      console.error('Error getting page info:', error);
      sendResponse(null);
    }
    
    // Return true to indicate we will send a response asynchronously
    return true;
  }

  // Check for updates
  if (request.action === 'checkForUpdates') {
    chrome.runtime.requestUpdateCheck((status, details) => {
      sendResponse({
        status,
        version: details?.version,
        currentVersion: chrome.runtime.getManifest().version
      });
    });
    return true;
  }

  // Get update status
  if (request.action === 'getUpdateStatus') {
    chrome.storage.local.get(['updateAvailable', 'availableVersion', 'showUpdateNotification', 'lastVersion', 'currentVersion'], (result) => {
      const currentVersion = chrome.runtime.getManifest().version;
      // If the available version matches the current version, the update has
      // already been applied — don't keep showing the "update available" banner.
      const stillAvailable =
        !!result.updateAvailable &&
        !!result.availableVersion &&
        result.availableVersion !== currentVersion;

      if (!stillAvailable && result.updateAvailable) {
        chrome.storage.local.set({ updateAvailable: false, availableVersion: null });
      }

      sendResponse({
        updateAvailable: stillAvailable,
        availableVersion: stillAvailable ? result.availableVersion : undefined,
        showUpdateNotification: result.showUpdateNotification || false,
        lastVersion: result.lastVersion,
        currentVersion
      });
    });
    return true;
  }

  // Apply update (reload extension)
  if (request.action === 'applyUpdate') {
    // Clear pending-update flags before reloading; after reload, onInstalled
    // (reason=update) will set showUpdateNotification.
    chrome.storage.local.set(
      { updateAvailable: false, availableVersion: null },
      () => {
        chrome.runtime.reload();
      }
    );
    sendResponse({ success: true });
    return true;
  }

  // Dismiss update notification
  if (request.action === 'dismissUpdateNotification') {
    chrome.storage.local.set({ showUpdateNotification: false });
    sendResponse({ success: true });
    return;
  }
});

// Clean up data when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabData.delete(tabId);
});

// Handle side panel
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));
