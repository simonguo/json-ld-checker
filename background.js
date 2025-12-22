// Background service worker

// Debug: Log UI language
const uiLang = chrome.i18n.getUILanguage ? chrome.i18n.getUILanguage() : 'unknown';
console.log('[Background] Chrome UI Language:', uiLang);
console.log('[Background] Test message (settings):', chrome.i18n.getMessage('settings'));

const ICON_ACTIVE = {
  16: 'icons/png/icon-active-16.png',
  32: 'icons/png/icon-active-32.png',
  48: 'icons/png/icon-active-48.png',
  128: 'icons/png/icon-active-128.png'
};

const ICON_INACTIVE = {
  16: 'icons/png/icon-inactive-16.png',
  32: 'icons/png/icon-inactive-32.png',
  48: 'icons/png/icon-inactive-48.png',
  128: 'icons/png/icon-inactive-128.png'
};

// Store JSON-LD data for each tab
const tabData = new Map();

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'jsonLdDetected') {
    // Check if sender.tab exists (message is from a content script in a tab)
    if (!sender.tab || !sender.tab.id) {
      console.warn('jsonLdDetected message received but sender.tab is undefined');
      return true;
    }
    
    const tabId = sender.tab.id;
    tabData.set(tabId, request.data);
    
    // Update icon based on whether JSON-LD was found
    if (request.data.found) {
      chrome.action.setIcon({ tabId, path: ICON_ACTIVE });
      chrome.action.setTitle({ 
        tabId, 
        title: chrome.i18n.getMessage('iconTitleFound', [request.data.count.toString()])
      });
    } else {
      chrome.action.setIcon({ tabId, path: ICON_INACTIVE });
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
