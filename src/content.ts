// Content script to detect JSON-LD on the page

// Find all JSON-LD script tags on the page
function findJsonLd() {
  const jsonLdElements = document.querySelectorAll('script[type="application/ld+json"]');
  const data = [];

  console.log('[Content Script] Found JSON-LD elements:', jsonLdElements.length);

  jsonLdElements.forEach((element, index) => {
    try {
      const parsed = JSON.parse(element.textContent || '');
      data.push(parsed);
    } catch (error) {
      console.warn(`Invalid JSON-LD at index ${index}:`, element.textContent);
    }
  });

  const result = {
    found: data.length > 0,
    count: data.length,
    data: data
  };

  console.log('[Content Script] JSON-LD result:', result);
  return result;
}

// Send JSON-LD data to background script
function sendJsonLdData() {
  const jsonLdData = findJsonLd();
  console.log('[Content Script] Sending message to background:', jsonLdData);
  chrome.runtime.sendMessage({
    action: 'jsonLdDetected',
    data: jsonLdData
  }).then(() => {
    console.log('[Content Script] Message sent successfully');
  }).catch((error) => {
    console.error('[Content Script] Error sending message:', error);
  });
}

// Wait for DOM to be ready before initial scan
if (document.readyState === 'loading') {
  console.log('[Content Script] DOM is loading, waiting for DOMContentLoaded');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[Content Script] DOMContentLoaded fired');
    sendJsonLdData();
  });
} else {
  console.log('[Content Script] DOM already loaded');
  sendJsonLdData();
}

// Listen for DOM changes and run again if needed
const observer = new MutationObserver((mutations) => {
  let shouldRescan = false;
  
  for (const mutation of mutations) {
    if (mutation.type === 'childList') {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          if (element.tagName === 'SCRIPT' && element.getAttribute('type') === 'application/ld+json') {
            shouldRescan = true;
            break;
          }
        }
      }
      
      if (shouldRescan) break;
    }
  }
  
  if (shouldRescan) {
    sendJsonLdData();
  }
});

observer.observe(document, {
  childList: true,
  subtree: true
});

// Also listen for page load events in case JSON-LD is added dynamically
window.addEventListener('load', sendJsonLdData);
document.addEventListener('DOMContentLoaded', sendJsonLdData);
