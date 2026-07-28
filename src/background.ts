// Background service worker

import { buildJsonLdScanResult, type JsonLdScanResult } from './lib/json-ld';
import { validator } from './lib/validator';

const AUTO_DETECT_STORAGE_KEY = 'auto_detect_enabled';

chrome.runtime.onInstalled.addListener((details) => {
  const currentVersion = chrome.runtime.getManifest().version;

  if (details.reason === 'install') {
    chrome.storage.local.set({ [AUTO_DETECT_STORAGE_KEY]: false });
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/pages/options/index.html'),
    });
  } else if (details.reason === 'update') {
    chrome.storage.local.set({
      lastVersion: details.previousVersion,
      currentVersion,
      showUpdateNotification: true,
      updateTime: Date.now(),
      updateAvailable: false,
      availableVersion: null,
    });
  }
});

const ICON_ACTIVE = {
  16: chrome.runtime.getURL('icons/png/icon-active-16.png'),
  32: chrome.runtime.getURL('icons/png/icon-active-32.png'),
  48: chrome.runtime.getURL('icons/png/icon-active-48.png'),
  128: chrome.runtime.getURL('icons/png/icon-active-128.png'),
};

const ICON_INACTIVE = {
  16: chrome.runtime.getURL('icons/png/icon-inactive-16.png'),
  32: chrome.runtime.getURL('icons/png/icon-inactive-32.png'),
  48: chrome.runtime.getURL('icons/png/icon-inactive-48.png'),
  128: chrome.runtime.getURL('icons/png/icon-inactive-128.png'),
};

const tabData = new Map<number, JsonLdScanResult>();

function updateTabIcon(tabId: number, data: JsonLdScanResult) {
  if (!data.found) {
    chrome.action.setIcon({ tabId, path: ICON_INACTIVE }).catch(() => {});
    chrome.action.setBadgeText({ tabId, text: '' });
    chrome.action.setTitle({
      tabId,
      title: chrome.i18n.getMessage('iconTitleNotFound'),
    });
    return;
  }

  const hasParseErrors = data.blocks.some((block) => Boolean(block.parseError));
  const hasValidationErrors = data.entities.some(
    (entity) => validator.validate(entity.data).errors.length > 0,
  );
  const hasErrors = hasParseErrors || hasValidationErrors;

  chrome.action.setIcon({ tabId, path: ICON_ACTIVE }).catch(() => {});
  chrome.action.setBadgeText({
    tabId,
    text: hasErrors ? '!' : String(data.count || data.blockCount),
  });
  chrome.action.setBadgeBackgroundColor({
    tabId,
    color: hasErrors ? '#ef4444' : '#22c55e',
  });
  chrome.action.setTitle({
    tabId,
    title: chrome.i18n.getMessage(
      hasParseErrors ? 'iconTitleInvalid' : 'iconTitleFound',
      [String(data.count || data.blockCount)],
    ),
  });
}

function readJsonLdRawTexts() {
  return Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(
    (element) => element.textContent || '',
  );
}

async function scanTab(tabId: number): Promise<JsonLdScanResult> {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: readJsonLdRawTexts,
  });
  const result = buildJsonLdScanResult(results?.[0]?.result || []);
  tabData.set(tabId, result);
  updateTabIcon(tabId, result);
  return result;
}

async function automaticDetectionEnabled() {
  const stored = await chrome.storage.local.get(AUTO_DETECT_STORAGE_KEY);
  if (!stored[AUTO_DETECT_STORAGE_KEY]) return false;
  return chrome.permissions.contains({ origins: ['<all_urls>'] });
}

function installJsonLdWatcher() {
  const scope = globalThis as typeof globalThis & {
    __jsonLdCheckerObserver?: MutationObserver;
    __jsonLdCheckerTimer?: number;
  };
  if (scope.__jsonLdCheckerObserver) return true;

  const notify = () => {
    if (scope.__jsonLdCheckerTimer) window.clearTimeout(scope.__jsonLdCheckerTimer);
    scope.__jsonLdCheckerTimer = window.setTimeout(() => {
      chrome.runtime.sendMessage({ action: 'jsonLdDomChanged' }).catch(() => {});
    }, 250);
  };

  scope.__jsonLdCheckerObserver = new MutationObserver((mutations) => {
    const changed = mutations.some((mutation) => {
      const target =
        mutation.target instanceof Element
          ? mutation.target
          : mutation.target.parentElement;
      if (target?.closest('script[type="application/ld+json"]')) return true;
      return [...mutation.addedNodes, ...mutation.removedNodes].some((node) => {
        if (!(node instanceof Element)) return false;
        return (
          node.matches('script[type="application/ld+json"]') ||
          Boolean(node.querySelector('script[type="application/ld+json"]'))
        );
      });
    });
    if (changed) notify();
  });
  scope.__jsonLdCheckerObserver.observe(document.documentElement, {
    childList: true,
    characterData: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['type'],
  });
  return true;
}

function removeJsonLdWatcher() {
  const scope = globalThis as typeof globalThis & {
    __jsonLdCheckerObserver?: MutationObserver;
    __jsonLdCheckerTimer?: number;
  };
  scope.__jsonLdCheckerObserver?.disconnect();
  if (scope.__jsonLdCheckerTimer) window.clearTimeout(scope.__jsonLdCheckerTimer);
  delete scope.__jsonLdCheckerObserver;
  delete scope.__jsonLdCheckerTimer;
  return true;
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') tabData.delete(tabId);
  if (changeInfo.status === 'complete') {
    automaticDetectionEnabled()
      .then((enabled) => (enabled ? scanTab(tabId) : null))
      .catch(() => {});
  }
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  if (tabData.has(tabId)) return;
  automaticDetectionEnabled()
    .then((enabled) => (enabled ? scanTab(tabId) : null))
    .catch(() => {});
});

chrome.permissions.onRemoved.addListener((permissions) => {
  const removedAllSites = permissions.origins?.some(
    (origin) => origin === '<all_urls>' || origin === '*://*/*',
  );
  if (!removedAllSites) return;
  chrome.storage.local.set({ [AUTO_DETECT_STORAGE_KEY]: false });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getJsonLdData') {
    const tabId = request.tabId;
    if (!request.force && tabData.has(tabId)) {
      sendResponse(tabData.get(tabId));
      return;
    }
    scanTab(tabId).then(sendResponse).catch(() => sendResponse(null));
    return true;
  }

  if (request.action === 'startJsonLdWatch') {
    chrome.scripting
      .executeScript({ target: { tabId: request.tabId }, func: installJsonLdWatcher })
      .then(() => sendResponse({ success: true }))
      .catch(() => sendResponse({ success: false }));
    return true;
  }

  if (request.action === 'stopJsonLdWatch') {
    chrome.scripting
      .executeScript({ target: { tabId: request.tabId }, func: removeJsonLdWatcher })
      .then(() => sendResponse({ success: true }))
      .catch(() => sendResponse({ success: false }));
    return true;
  }

  if (request.action === 'jsonLdDomChanged' && sender.tab?.id) {
    const tabId = sender.tab.id;
    tabData.delete(tabId);
    scanTab(tabId)
      .then((result) =>
        chrome.runtime
          .sendMessage({ action: 'jsonLdScanChanged', tabId, result })
          .catch(() => {}),
      )
      .then(() => sendResponse({ success: true }))
      .catch(() => sendResponse({ success: false }));
    return true;
  }

  if (request.action === 'getPageInfo') {
    const tabId = request.tabId;
    chrome.scripting
      .executeScript({
        target: { tabId },
        func: () => ({
          title: document.title,
          description:
            document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
          existingJsonLd: Array.from(
            document.querySelectorAll('script[type="application/ld+json"]'),
          )
            .map((element) => {
              try {
                return JSON.parse(element.textContent || '');
              } catch {
                return null;
              }
            })
            .filter((data) => data !== null),
        }),
      })
      .then((results) => sendResponse(results?.[0]?.result || null))
      .catch(() => sendResponse(null));
    return true;
  }

  if (request.action === 'checkForUpdates') {
    chrome.runtime.requestUpdateCheck((status, details) => {
      sendResponse({
        status,
        version: details?.version,
        currentVersion: chrome.runtime.getManifest().version,
      });
    });
    return true;
  }

  if (request.action === 'getUpdateStatus') {
    chrome.storage.local.get(
      [
        'updateAvailable',
        'availableVersion',
        'showUpdateNotification',
        'lastVersion',
        'currentVersion',
      ],
      (result) => {
        const currentVersion = chrome.runtime.getManifest().version;
        const stillAvailable =
          Boolean(result.updateAvailable) &&
          Boolean(result.availableVersion) &&
          result.availableVersion !== currentVersion;

        if (!stillAvailable && result.updateAvailable) {
          chrome.storage.local.set({ updateAvailable: false, availableVersion: null });
        }

        sendResponse({
          updateAvailable: stillAvailable,
          availableVersion: stillAvailable ? result.availableVersion : undefined,
          showUpdateNotification: result.showUpdateNotification || false,
          lastVersion: result.lastVersion,
          currentVersion,
        });
      },
    );
    return true;
  }

  if (request.action === 'applyUpdate') {
    chrome.storage.local.set(
      { updateAvailable: false, availableVersion: null },
      () => chrome.runtime.reload(),
    );
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'dismissUpdateNotification') {
    chrome.storage.local.set({ showUpdateNotification: false });
    sendResponse({ success: true });
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabData.delete(tabId);
});

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));
