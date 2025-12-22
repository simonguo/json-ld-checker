// DOM localization helper

function getI18nMessage(key, substitutions) {
  try {
    return chrome.i18n.getMessage(key, substitutions);
  } catch (e) {
    return '';
  }
}

function localizeHtmlPage(root = document) {
  try {
    const uiLang = chrome.i18n.getUILanguage ? chrome.i18n.getUILanguage() : 'unknown';
    const sample = chrome.i18n.getMessage('settings');
    console.debug('[i18n] uiLanguage=', uiLang, 'sample(settings)=', sample);
  } catch (e) {
    // ignore
  }

  const textNodes = root.querySelectorAll('[data-i18n]');
  textNodes.forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const msg = getI18nMessage(key);
    if (msg) el.textContent = msg;
  });

  const htmlNodes = root.querySelectorAll('[data-i18n-html]');
  htmlNodes.forEach((el) => {
    const key = el.getAttribute('data-i18n-html');
    const msg = getI18nMessage(key);
    if (msg) el.innerHTML = msg;
  });

  const titleNodes = root.querySelectorAll('[data-i18n-title]');
  titleNodes.forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    const msg = getI18nMessage(key);
    if (msg) el.title = msg;
  });

  const placeholderNodes = root.querySelectorAll('[data-i18n-placeholder]');
  placeholderNodes.forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    const msg = getI18nMessage(key);
    if (msg) el.placeholder = msg;
  });
}
