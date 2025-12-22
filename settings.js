// Settings page script
const aiService = new AIService();

function t(key, substitutions) {
  return chrome.i18n.getMessage(key, substitutions);
}

// DOM elements
const apiKeyInput = document.getElementById('apiKey');
const toggleVisibilityBtn = document.getElementById('toggleVisibility');
const eyeIcon = document.getElementById('eyeIcon');
const apiStatus = document.getElementById('apiStatus');
const saveBtn = document.getElementById('saveBtn');
const testBtn = document.getElementById('testBtn');
const clearBtn = document.getElementById('clearBtn');
const messageDiv = document.getElementById('message');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Localize static DOM
  localizeHtmlPage(document);
  document.title = t('settingsTitle') + ' - JSON-LD Checker';

  await loadSettings();
  setupEventListeners();
});

function setupEventListeners() {
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
      updateStatus('configured', t('statusConfigured'));
    } else {
      updateStatus('unconfigured', t('statusUnconfigured'));
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
    showMessage(t('loadSettingsFailed'), 'error');
  }
}

async function saveSettings() {
  const apiKey = apiKeyInput.value.trim();
  
  if (!apiKey) {
    showMessage(t('enterApiKey'), 'error');
    return;
  }

  if (!apiKey.startsWith('sk-')) {
    showMessage(t('invalidApiKeyFormat'), 'error');
    return;
  }

  try {
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span class="spinner"></span>${t('saving')}`;
    
    await aiService.setApiKey(apiKey);
    updateStatus('configured', t('statusConfigured'));
    showMessage(t('apiKeySaved'), 'success');
  } catch (error) {
    console.error('Failed to save API key:', error);
    showMessage(t('saveFailed') + ': ' + error.message, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = t('saveConfig');
  }
}

async function testConnection() {
  const apiKey = apiKeyInput.value.trim();
  
  if (!apiKey) {
    showMessage(t('enterApiKeyFirst'), 'error');
    return;
  }

  try {
    testBtn.disabled = true;
    testBtn.innerHTML = `<span class="spinner"></span>${t('testing')}`;
    
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
    
    updateStatus('configured', t('statusConnected'));
    showMessage(t('connectionTestSuccess'), 'success');
  } catch (error) {
    console.error('Connection test failed:', error);
    updateStatus('error', t('statusError'));
    showMessage(t('connectionTestFailed') + ': ' + error.message, 'error');
  } finally {
    testBtn.disabled = false;
    testBtn.textContent = t('testConnection');
  }
}

async function clearSettings() {
  if (!confirm(t('confirmClearConfig'))) {
    return;
  }

  try {
    clearBtn.disabled = true;
    await aiService.clearApiKey();
    apiKeyInput.value = '';
    updateStatus('unconfigured', t('statusUnconfigured'));
    showMessage(t('configCleared'), 'info');
  } catch (error) {
    console.error('Failed to clear settings:', error);
    showMessage(t('clearFailed') + ': ' + error.message, 'error');
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
