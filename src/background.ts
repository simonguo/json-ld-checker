// Background service worker

// Debug: Log UI language
const uiLang = chrome.i18n.getUILanguage ? chrome.i18n.getUILanguage() : 'unknown';
console.log('[Background] Chrome UI Language:', uiLang);
console.log('[Background] Test message (settings):', chrome.i18n.getMessage('settings'));

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
