// Settings page script
const aiService = new AIService();

function t(key, substitutions) {
  return chrome.i18n.getMessage(key, substitutions);
}

// DOM elements
const providerSelect = document.getElementById('provider');
const modelSelect = document.getElementById('model');
const apiKeyInput = document.getElementById('apiKey');
const endpointInput = document.getElementById('endpoint');
const azureEndpointInput = document.getElementById('azureEndpoint');
const azureDeploymentInput = document.getElementById('azureDeployment');
const endpointGroup = document.getElementById('endpointGroup');
const azureGroup = document.getElementById('azureGroup');
const toggleVisibilityBtn = document.getElementById('toggleVisibility');
const eyeIcon = document.getElementById('eyeIcon');
const apiStatus = document.getElementById('apiStatus');
const saveBtn = document.getElementById('saveBtn');
const testBtn = document.getElementById('testBtn');
const clearBtn = document.getElementById('clearBtn');
const messageDiv = document.getElementById('message');
const getApiKeyLink = document.getElementById('getApiKeyLink');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Localize static DOM
  localizeHtmlPage(document);
  document.title = t('settingsTitle') + ' - JSON-LD Checker';

  // Populate provider dropdown
  populateProviders();
  
  await loadSettings();
  setupEventListeners();
});

function populateProviders() {
  providerSelect.innerHTML = '';
  Object.entries(AI_PROVIDERS).forEach(([key, provider]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = provider.name;
    providerSelect.appendChild(option);
  });
}

function populateModels(provider) {
  modelSelect.innerHTML = '';
  const models = AI_PROVIDERS[provider]?.models || [];
  models.forEach(model => {
    const option = document.createElement('option');
    option.value = model.id;
    option.textContent = model.name;
    modelSelect.appendChild(option);
  });
}

function updateProviderUI(provider) {
  // Show/hide endpoint fields based on provider
  const showEndpoint = ['openai', 'anthropic', 'google', 'openrouter', 'custom'].includes(provider);
  const showAzure = provider === 'azure';
  
  endpointGroup.style.display = showEndpoint ? 'block' : 'none';
  azureGroup.style.display = showAzure ? 'block' : 'none';
  
  // Update API key link
  const links = {
    openai: 'https://platform.openai.com/api-keys',
    anthropic: 'https://console.anthropic.com/settings/keys',
    google: 'https://aistudio.google.com/app/apikey',
    azure: 'https://portal.azure.com/',
    openrouter: 'https://openrouter.ai/keys',
    custom: '#'
  };
  getApiKeyLink.href = links[provider] || '#';
  
  // Update placeholder
  const prefix = AI_PROVIDERS[provider]?.apiKeyPrefix || '';
  apiKeyInput.placeholder = prefix ? `${prefix}...` : 'API Key';
}

function setupEventListeners() {
  // Provider change
  providerSelect.addEventListener('change', () => {
    const provider = providerSelect.value;
    populateModels(provider);
    updateProviderUI(provider);
    
    // Set default endpoint if available
    const providerConfig = AI_PROVIDERS[provider];
    if (providerConfig?.endpoint) {
      endpointInput.value = providerConfig.endpoint;
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
    
    // Set provider
    providerSelect.value = aiService.provider || 'openai';
    
    // Populate and set model
    populateModels(aiService.provider);
    modelSelect.value = aiService.model || AI_PROVIDERS[aiService.provider]?.models[0]?.id || '';
    
    // Update UI
    updateProviderUI(aiService.provider);
    
    if (hasKey) {
      apiKeyInput.value = aiService.apiKey;
      updateStatus('configured', t('statusConfigured'));
    } else {
      updateStatus('unconfigured', t('statusUnconfigured'));
    }
    
    // Set endpoints
    endpointInput.value = aiService.endpoint || '';
    azureEndpointInput.value = aiService.azureEndpoint || '';
    azureDeploymentInput.value = aiService.azureDeployment || '';
  } catch (error) {
    console.error('Failed to load settings:', error);
    showMessage(t('loadSettingsFailed'), 'error');
  }
}

async function saveSettings() {
  const provider = providerSelect.value;
  const model = modelSelect.value;
  const apiKey = apiKeyInput.value.trim();
  const endpoint = endpointInput.value.trim();
  const azureEndpoint = azureEndpointInput.value.trim();
  const azureDeployment = azureDeploymentInput.value.trim();
  
  if (!apiKey) {
    showMessage(t('enterApiKey'), 'error');
    return;
  }

  // Validate API key format based on provider
  const expectedPrefix = AI_PROVIDERS[provider]?.apiKeyPrefix;
  if (expectedPrefix && !apiKey.startsWith(expectedPrefix)) {
    showMessage(t('invalidApiKeyFormat').replace('{prefix}', expectedPrefix), 'error');
    return;
  }
  
  // Validate Azure fields
  if (provider === 'azure' && (!azureEndpoint || !azureDeployment)) {
    showMessage(t('azureFieldsRequired'), 'error');
    return;
  }

  try {
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span class="spinner"></span>${t('saving')}`;
    
    await aiService.setApiConfig({
      provider,
      model,
      apiKey,
      endpoint,
      azureEndpoint,
      azureDeployment
    });
    
    updateStatus('configured', t('statusConfigured'));
    showMessage(t('apiKeySaved'), 'success');
  } catch (error) {
    console.error('Failed to save API config:', error);
    showMessage(t('saveFailed') + ': ' + error.message, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = t('saveConfig');
  }
}

async function testConnection() {
  const provider = providerSelect.value;
  const model = modelSelect.value;
  const apiKey = apiKeyInput.value.trim();
  const endpoint = endpointInput.value.trim();
  const azureEndpoint = azureEndpointInput.value.trim();
  const azureDeployment = azureDeploymentInput.value.trim();
  
  if (!apiKey) {
    showMessage(t('enterApiKeyFirst'), 'error');
    return;
  }
  
  if (provider === 'azure' && (!azureEndpoint || !azureDeployment)) {
    showMessage(t('azureFieldsRequired'), 'error');
    return;
  }

  try {
    testBtn.disabled = true;
    testBtn.innerHTML = `<span class="spinner"></span>${t('testing')}`;
    
    // Temporarily set the configuration for testing
    const originalProvider = aiService.provider;
    const originalModel = aiService.model;
    const originalKey = aiService.apiKey;
    const originalEndpoint = aiService.endpoint;
    const originalAzureEndpoint = aiService.azureEndpoint;
    const originalAzureDeployment = aiService.azureDeployment;
    
    aiService.provider = provider;
    aiService.model = model;
    aiService.apiKey = apiKey;
    aiService.endpoint = endpoint;
    aiService.azureEndpoint = azureEndpoint;
    aiService.azureDeployment = azureDeployment;
    
    // Make a simple test call
    const messages = [
      { role: 'user', content: 'Hello, this is a test. Please respond with "OK".' }
    ];
    
    await aiService.callOpenAI(messages, 0.1);
    
    // Restore original configuration
    aiService.provider = originalProvider;
    aiService.model = originalModel;
    aiService.apiKey = originalKey;
    aiService.endpoint = originalEndpoint;
    aiService.azureEndpoint = originalAzureEndpoint;
    aiService.azureDeployment = originalAzureDeployment;
    
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
    
    // Reset form
    providerSelect.value = 'openai';
    populateModels('openai');
    updateProviderUI('openai');
    apiKeyInput.value = '';
    endpointInput.value = '';
    azureEndpointInput.value = '';
    azureDeploymentInput.value = '';
    
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
