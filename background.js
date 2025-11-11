// Background service worker

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
    const tabId = sender.tab.id;
    tabData.set(tabId, request.data);
    
    // Update icon based on whether JSON-LD was found
    if (request.data.found) {
      chrome.action.setIcon({ tabId, path: ICON_ACTIVE });
      chrome.action.setTitle({ 
        tabId, 
        title: `JSON-LD Checker - 发现 ${request.data.count} 个 JSON-LD` 
      });
    } else {
      chrome.action.setIcon({ tabId, path: ICON_INACTIVE });
      chrome.action.setTitle({ 
        tabId, 
        title: 'JSON-LD Checker - 未发现 JSON-LD' 
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
