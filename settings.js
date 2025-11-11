// Settings page script
const aiService = new AIService();

// DOM elements
const apiKeyInput = document.getElementById('apiKey');
const toggleVisibilityBtn = document.getElementById('toggleVisibility');
const eyeIcon = document.getElementById('eyeIcon');
const apiStatus = document.getElementById('apiStatus');
const saveBtn = document.getElementById('saveBtn');
const testBtn = document.getElementById('testBtn');
const clearBtn = document.getElementById('clearBtn');
const messageDiv = document.getElementById('message');
const languageSelect = document.getElementById('languageSelect');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Wait for i18n to load
  await i18n.loadLocale();
  
  // Set HTML lang attribute
  document.documentElement.lang = i18n.getLocale() === 'zh' ? 'zh-CN' : 'en';
  
  // Update UI text
  updateUIText();
  
  // Load current language setting
  await loadLanguageSetting();
  
  await loadSettings();
  setupEventListeners();
});

function updateUIText() {
  // Page title
  document.getElementById('pageTitle').textContent = i18n.t('settingsTitle');
  document.title = i18n.t('settingsTitle') + ' - JSON-LD Checker';
  
  // Language settings
  document.getElementById('languageSettingsTitle').textContent = i18n.t('languageSettings');
  document.getElementById('languageLabel').textContent = i18n.t('languageLabel');
  
  // Language options
  const options = languageSelect.querySelectorAll('option');
  options[0].textContent = i18n.t('languageAuto');
  options[1].textContent = i18n.t('languageChinese');
  options[2].textContent = i18n.t('languageEnglish');
  
  // AI Configuration
  document.getElementById('aiConfigTitle').textContent = i18n.t('aiConfiguration');
  document.getElementById('aiConfigDesc').textContent = i18n.t('aiConfigDescription');
  document.getElementById('apiKeyLabel').textContent = i18n.t('apiKeyLabel');
  document.getElementById('apiKey').placeholder = i18n.t('apiKeyPlaceholder');
  document.getElementById('toggleVisibility').title = i18n.t('showHide');
  document.getElementById('apiKeyHelp').textContent = i18n.t('apiKeyHelp');
  document.getElementById('getApiKeyLink').textContent = i18n.t('getApiKey');
  document.getElementById('apiStatusLabel').textContent = i18n.t('apiStatusLabel');
  
  // Buttons
  saveBtn.textContent = i18n.t('saveConfig');
  testBtn.textContent = i18n.t('testConnection');
  clearBtn.textContent = i18n.t('clearConfig');
  
  // About AI Features
  document.getElementById('aboutAiFeaturesTitle').textContent = i18n.t('aboutAiFeatures');
  document.getElementById('aiCheckTitle').textContent = i18n.t('aiCheckTitle');
  document.getElementById('aiCheckDesc').textContent = i18n.t('aiCheckDesc');
  document.getElementById('aiCheckFeature1').textContent = i18n.t('aiCheckFeature1');
  document.getElementById('aiCheckFeature2').textContent = i18n.t('aiCheckFeature2');
  document.getElementById('aiCheckFeature3').textContent = i18n.t('aiCheckFeature3');
  document.getElementById('aiCheckFeature4').textContent = i18n.t('aiCheckFeature4');
  
  document.getElementById('aiSuggestTitle').textContent = i18n.t('aiSuggestTitle');
  document.getElementById('aiSuggestDesc').textContent = i18n.t('aiSuggestDesc');
  document.getElementById('aiSuggestFeature1').textContent = i18n.t('aiSuggestFeature1');
  document.getElementById('aiSuggestFeature2').textContent = i18n.t('aiSuggestFeature2');
  document.getElementById('aiSuggestFeature3').textContent = i18n.t('aiSuggestFeature3');
  document.getElementById('aiSuggestFeature4').textContent = i18n.t('aiSuggestFeature4');
  
  // Privacy Notice
  document.getElementById('privacyNoticeTitle').textContent = i18n.t('privacyNotice');
  document.getElementById('privacyWarning').textContent = i18n.t('privacyWarning');
  document.getElementById('privacyPolicy').textContent = i18n.t('privacyPolicy');
  document.getElementById('privacyStorage').textContent = i18n.t('privacyStorage');
}

async function loadLanguageSetting() {
  try {
    const result = await chrome.storage.local.get(['language']);
    const savedLang = result.language || 'auto';
    languageSelect.value = savedLang;
  } catch (error) {
    console.error('Failed to load language setting:', error);
    languageSelect.value = 'auto';
  }
}

function setupEventListeners() {
  // Language selector
  languageSelect.addEventListener('change', async (e) => {
    const newLang = e.target.value;
    await i18n.setLocale(newLang);
    
    // Update HTML lang attribute
    document.documentElement.lang = i18n.getLocale() === 'zh' ? 'zh-CN' : 'en';
    
    // Update all UI text
    updateUIText();
    
    // Update status text if needed
    const statusText = apiStatus.querySelector('.status-text').textContent;
    if (statusText) {
      const hasKey = await aiService.initialize();
      if (hasKey) {
        updateStatus('configured', i18n.t('statusConfigured'));
      } else {
        updateStatus('unconfigured', i18n.t('statusUnconfigured'));
      }
    }
  });
  
  // Toggle password visibility
  toggleVisibilityBtn.addEventListener('click', () => {
    const type = apiKeyInput.type === 'password' ? 'text' : 'password';
    apiKeyInput.type = type;
    
    if (type === 'text') {
      eyeIcon.innerHTML = `
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      `;
    } else {
      eyeIcon.innerHTML = `
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      `;
    }
  });

  // Save button
  saveBtn.addEventListener('click', saveSettings);

  // Test button
  testBtn.addEventListener('click', testConnection);

  // Clear button
  clearBtn.addEventListener('click', clearSettings);

  // Enter key to save
  apiKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveSettings();
    }
  });
}

async function loadSettings() {
  try {
    const hasKey = await aiService.initialize();
    
    if (hasKey) {
      const key = await aiService.getApiKey();
      apiKeyInput.value = key;
      updateStatus('configured', i18n.t('statusConfigured'));
    } else {
      updateStatus('unconfigured', i18n.t('statusUnconfigured'));
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
    showMessage(i18n.t('loadSettingsFailed'), 'error');
  }
}

async function saveSettings() {
  const apiKey = apiKeyInput.value.trim();
  
  if (!apiKey) {
    showMessage(i18n.t('enterApiKey'), 'error');
    return;
  }

  if (!apiKey.startsWith('sk-')) {
    showMessage(i18n.t('invalidApiKeyFormat'), 'error');
    return;
  }

  try {
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span class="spinner"></span>${i18n.t('saving')}`;
    
    await aiService.setApiKey(apiKey);
    updateStatus('configured', i18n.t('statusConfigured'));
    showMessage(i18n.t('apiKeySaved'), 'success');
  } catch (error) {
    console.error('Failed to save API key:', error);
    showMessage(i18n.t('saveFailed') + ': ' + error.message, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = i18n.t('saveConfig');
  }
}

async function testConnection() {
  const apiKey = apiKeyInput.value.trim();
  
  if (!apiKey) {
    showMessage(i18n.t('enterApiKeyFirst'), 'error');
    return;
  }

  try {
    testBtn.disabled = true;
    testBtn.innerHTML = `<span class="spinner"></span>${i18n.t('testing')}`;
    
    // Temporarily set the API key for testing
    const originalKey = aiService.apiKey;
    aiService.apiKey = apiKey;
    
    // Make a simple test call
    const messages = [
      { role: 'user', content: 'Hello, this is a test. Please respond with "OK".' }
    ];
    
    await aiService.callOpenAI(messages, 0.1);
    
    // Restore original key
    aiService.apiKey = originalKey;
    
    updateStatus('configured', i18n.t('statusConnected'));
    showMessage(i18n.t('connectionTestSuccess'), 'success');
  } catch (error) {
    console.error('Connection test failed:', error);
    updateStatus('error', i18n.t('statusError'));
    showMessage(i18n.t('connectionTestFailed') + ': ' + error.message, 'error');
  } finally {
    testBtn.disabled = false;
    testBtn.textContent = i18n.t('testConnection');
  }
}

async function clearSettings() {
  if (!confirm(i18n.t('confirmClearConfig'))) {
    return;
  }

  try {
    clearBtn.disabled = true;
    await aiService.clearApiKey();
    apiKeyInput.value = '';
    updateStatus('unconfigured', i18n.t('statusUnconfigured'));
    showMessage(i18n.t('configCleared'), 'info');
  } catch (error) {
    console.error('Failed to clear settings:', error);
    showMessage(i18n.t('clearFailed') + ': ' + error.message, 'error');
  } finally {
    clearBtn.disabled = false;
  }
}

function updateStatus(status, text) {
  apiStatus.className = 'api-status ' + status;
  apiStatus.querySelector('.status-text').textContent = text;
}

function showMessage(text, type) {
  messageDiv.textContent = text;
  messageDiv.className = 'message ' + type;
  messageDiv.style.display = 'block';
  
  // Auto hide after 5 seconds
  setTimeout(() => {
    messageDiv.style.display = 'none';
  }, 5000);
}
