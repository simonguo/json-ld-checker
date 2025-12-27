// Background service worker

// Debug: Log UI language
const uiLang = chrome.i18n.getUILanguage ? chrome.i18n.getUILanguage() : 'unknown';
console.log('[Background] Chrome UI Language:', uiLang);
console.log('[Background] Test message (settings):', chrome.i18n.getMessage('settings'));

// ============================================
// Version Update Detection & Management
// ============================================

// Check for updates when extension starts
chrome.runtime.onInstalled.addListener((details) => {
  const currentVersion = chrome.runtime.getManifest().version;
  
  if (details.reason === 'install') {
    console.log('[Background] Extension installed, version:', currentVersion);
    // Open welcome page on first install
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/pages/options/index.html')
    });
  } else if (details.reason === 'update') {
    const previousVersion = details.previousVersion;
    console.log('[Background] Extension updated from', previousVersion, 'to', currentVersion);
    
    // Store update info for showing changelog
    chrome.storage.local.set({
      lastVersion: previousVersion,
      currentVersion: currentVersion,
      showUpdateNotification: true,
      updateTime: Date.now()
    });
    
    // Show notification about the update
    showUpdateNotification(previousVersion, currentVersion);
  }
});

// Listen for update available event
chrome.runtime.onUpdateAvailable.addListener((details) => {
  console.log('[Background] Update available:', details.version);
  
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
        url: 'https://github.com/your-username/json-ld-checker/releases'
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

// Periodically check for updates (every 6 hours)
const UPDATE_CHECK_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours
setInterval(() => {
  chrome.runtime.requestUpdateCheck((status, details) => {
    if (status === 'update_available') {
      console.log('[Background] Update check: update available', details?.version);
    } else if (status === 'no_update') {
      console.log('[Background] Update check: no update available');
    } else if (status === 'throttled') {
      console.log('[Background] Update check: throttled');
    }
  });
}, UPDATE_CHECK_INTERVAL);

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

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Background] Received message:', request.action, request);
  
  if (request.action === 'jsonLdDetected') {
    // Check if sender.tab exists (message is from a content script in a tab)
    if (!sender.tab || !sender.tab.id) {
      console.warn('[Background] jsonLdDetected message received but sender.tab is undefined');
      return true;
    }
    
    const tabId = sender.tab.id;
    console.log('[Background] Tab ID:', tabId, 'JSON-LD found:', request.data.found, 'Count:', request.data.count);
    tabData.set(tabId, request.data);
    
    // Update icon based on whether JSON-LD was found
    if (request.data.found) {
      console.log('[Background] Setting active icon for tab', tabId);
      chrome.action.setIcon({ tabId, path: ICON_ACTIVE }).then(() => {
        console.log('[Background] Active icon set successfully');
      }).catch((error) => {
        console.error('[Background] Error setting active icon:', error);
      });
      chrome.action.setTitle({ 
        tabId, 
        title: chrome.i18n.getMessage('iconTitleFound', [request.data.count.toString()])
      });
    } else {
      console.log('[Background] Setting inactive icon for tab', tabId);
      chrome.action.setIcon({ tabId, path: ICON_INACTIVE }).then(() => {
        console.log('[Background] Inactive icon set successfully');
      }).catch((error) => {
        console.error('[Background] Error setting inactive icon:', error);
      });
      chrome.action.setTitle({ 
        tabId, 
        title: chrome.i18n.getMessage('iconTitleNotFound')
      });
    }
  }
  
  if (request.action === 'getJsonLdData') {
    const tabId = request.tabId;
    sendResponse(tabData.get(tabId) || null);
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
              try {
                return JSON.parse(el.textContent || '');
              } catch (e) {
                return null;
              }
            }).filter(data => data !== null)
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
      sendResponse({
        updateAvailable: result.updateAvailable || false,
        availableVersion: result.availableVersion,
        showUpdateNotification: result.showUpdateNotification || false,
        lastVersion: result.lastVersion,
        currentVersion: chrome.runtime.getManifest().version
      });
    });
    return true;
  }

  // Apply update (reload extension)
  if (request.action === 'applyUpdate') {
    chrome.runtime.reload();
    sendResponse({ success: true });
    return true;
  }

  // Dismiss update notification
  if (request.action === 'dismissUpdateNotification') {
    chrome.storage.local.set({ showUpdateNotification: false });
    sendResponse({ success: true });
    return true;
  }
  
  return true;
});

// Clean up data when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabData.delete(tabId);
});

// Handle side panel
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));
