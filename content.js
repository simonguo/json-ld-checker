// Content script to extract JSON-LD from the current page

function extractJsonLd() {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  const jsonLdData = [];
  
  scripts.forEach((script, index) => {
    try {
      const data = JSON.parse(script.textContent);
      jsonLdData.push({
        index: index + 1,
        data: data,
        raw: script.textContent,
        element: script.outerHTML
      });
    } catch (error) {
      jsonLdData.push({
        index: index + 1,
        error: `${i18n.t('parseError')}: ${error.message}`,
        raw: script.textContent
      });
    }
  });
  
  return {
    found: jsonLdData.length > 0,
    count: jsonLdData.length,
    data: jsonLdData,
    url: window.location.href,
    timestamp: new Date().toISOString()
  };
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractJsonLd') {
    const result = extractJsonLd();
    sendResponse(result);
  }
  return true;
});

// Automatically check on page load and notify background
function checkAndNotify() {
  const result = extractJsonLd();
  chrome.runtime.sendMessage({
    action: 'jsonLdDetected',
    data: result
  });
}

// Check immediately
checkAndNotify();

// Also check when DOM changes (for SPAs)
let debounceTimer;
const observer = new MutationObserver(() => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(checkAndNotify, 1000);
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
