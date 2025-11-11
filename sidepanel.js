// Side panel script
let currentJsonLdData = null;
let currentSelectedIndex = 0;
let currentPageInfo = null;
const validator = new JsonLdValidator();
const aiService = new AIService();

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Wait for i18n to load
  await i18n.loadLocale();
  
  // Set HTML lang attribute
  document.documentElement.lang = i18n.getLocale() === 'zh' ? 'zh-CN' : 'en';
  
  // Update static UI text
  updateUIText();
  
  loadJsonLdData();
  setupEventListeners();
  
  // Listen for language changes
  window.addEventListener('languageChanged', () => {
    document.documentElement.lang = i18n.getLocale() === 'zh' ? 'zh-CN' : 'en';
    updateUIText();
    // Refresh current view if data is loaded
    if (currentJsonLdData && currentJsonLdData.found) {
      displayJsonLdData(currentJsonLdData);
      updateStatus(currentJsonLdData);
    } else {
      showEmptyState();
    }
  });
});

function updateUIText() {
  // Update tab buttons
  const tabs = {
    'tree': 'treeView',
    'raw': 'rawData',
    'validation': 'validationResults',
    'aiCheck': 'aiCheck',
    'aiSuggest': 'aiSuggest'
  };
  
  document.querySelectorAll('.tab-btn').forEach(btn => {
    const tabName = btn.dataset.tab;
    if (tabs[tabName]) {
      const svg = btn.querySelector('svg');
      
      if (svg) {
        // For tabs with SVG icons, find or create text node after SVG
        const textNodes = Array.from(btn.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
        const existingText = textNodes.find(node => node.textContent.trim());
        
        if (existingText) {
          existingText.textContent = ' ' + i18n.t(tabs[tabName]);
        } else {
          // Remove any empty text nodes
          textNodes.forEach(node => node.remove());
          // Add new text node with proper spacing
          btn.appendChild(document.createTextNode(' ' + i18n.t(tabs[tabName])));
        }
      } else {
        // For tabs without SVG, just set text content
        btn.textContent = i18n.t(tabs[tabName]);
      }
    }
  });
  
  // Update button titles
  document.getElementById('settingsBtn').title = i18n.t('settings');
  document.getElementById('refreshBtn').title = i18n.t('refresh');
  
  // Update initial loading text if present
  const loadingText = document.querySelector('#content .loading p');
  if (loadingText && !loadingText.textContent) {
    loadingText.textContent = i18n.t('loading');
  }
}

async function setupEventListeners() {
  // Initialize AI service
  await aiService.initialize();

  // Settings button
  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Refresh button
  document.getElementById('refreshBtn').addEventListener('click', () => {
    loadJsonLdData();
  });

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tabName = e.target.closest('.tab-btn').dataset.tab;
      switchTab(tabName);
    });
  });
}

async function loadJsonLdData() {
  const content = document.getElementById('content');
  const status = document.getElementById('status');
  const container = document.getElementById('jsonLdContainer');
  
  // Hide container and show loading
  if (container) {
    container.style.display = 'none';
  }
  content.style.display = 'block';
  content.innerHTML = `<div class="loading"><div class="spinner"></div><p>${i18n.t('loading')}</p></div>`;
  status.textContent = '';
  status.className = 'status';

  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      showError(i18n.t('unableToGetCurrentTab'));
      return;
    }

    // Store page info for AI features
    currentPageInfo = {
      url: tab.url,
      title: tab.title
    };

    // Always try to extract directly from content script for fresh data
    chrome.tabs.sendMessage(tab.id, { action: 'extractJsonLd' }, (result) => {
      if (chrome.runtime.lastError) {
        console.error('Chrome runtime error:', chrome.runtime.lastError);
        // 无法连接到页面时，显示空状态（可以使用 AI 建议）
        showEmptyState();
        return;
      }
      
      console.log('Received result:', result);
      
      if (result && result.found) {
        currentJsonLdData = result;
        displayJsonLdData(result);
        updateStatus(result);
      } else if (result && !result.found) {
        showEmptyState();
      } else {
        // 收到无效响应时也显示空状态
        showEmptyState();
      }
    });
  } catch (error) {
    console.error('Load error:', error);
    // 加载失败时显示空状态而非错误
    showEmptyState();
  }
}

function updateStatus(data) {
  const status = document.getElementById('status');
  
  if (data.found) {
    status.className = 'status success';
    status.textContent = `✓ ${i18n.t('foundJsonLd', {count: data.count})}`;
  } else {
    status.className = 'status warning';
    status.textContent = `⚠ ${i18n.t('noJsonLd')}`;
  }
}

function displayJsonLdData(data) {
  console.log('Displaying JSON-LD data:', data);
  
  const content = document.getElementById('content');
  const container = document.getElementById('jsonLdContainer');
  
  if (!container) {
    console.error('jsonLdContainer not found!');
    showError(i18n.t('interfaceElementNotFound'));
    return;
  }
  
  // Hide loading, show container
  content.style.display = 'none';
  container.style.display = 'block';
  
  // Reset selected index if out of bounds
  if (currentSelectedIndex >= data.count) {
    currentSelectedIndex = 0;
  }

  // Add selector if multiple JSON-LD found
  if (data.count > 1) {
    addJsonLdSelector(data);
  } else {
    // Remove selector if exists
    const existing = container.querySelector('.jsonld-selector');
    if (existing) {
      existing.remove();
    }
  }

  // Display the selected JSON-LD
  if (data.data && data.data[currentSelectedIndex]) {
    displaySelectedJsonLd(data.data[currentSelectedIndex]);
  } else {
    console.error('No data at index:', currentSelectedIndex);
    showError(i18n.t('dataIndexError'));
  }
}

function addJsonLdSelector(data) {
  const container = document.getElementById('jsonLdContainer');
  const existing = container.querySelector('.jsonld-selector');
  
  if (existing) {
    existing.remove();
  }

  const selector = document.createElement('div');
  selector.className = 'jsonld-selector';
  selector.innerHTML = `
    <label>${i18n.t('selectJsonLd', {count: data.count})}:</label>
    <select id="jsonLdSelect">
      ${data.data.map((item, index) => {
        const type = item.data?.['@type'] || i18n.t('unknownType');
        const typeStr = Array.isArray(type) ? type.join(', ') : type;
        return `<option value="${index}" ${index === currentSelectedIndex ? 'selected' : ''}>
          #${index + 1} - ${typeStr}
        </option>`;
      }).join('')}
    </select>
  `;
  
  container.insertBefore(selector, container.firstChild);
  
  document.getElementById('jsonLdSelect').addEventListener('change', (e) => {
    currentSelectedIndex = parseInt(e.target.value);
    displaySelectedJsonLd(data.data[currentSelectedIndex]);
  });
}

function displaySelectedJsonLd(item) {
  if (item.error) {
    showError(item.error);
    return;
  }

  // Update tree view
  renderTreeView(item.data);
  
  // Update raw view
  renderRawView(item);
  
  // Update validation view
  renderValidationView(item.data);
}

function renderTreeView(data) {
  const treeView = document.getElementById('treeView');
  treeView.innerHTML = '<div class="tree"></div>';
  const tree = treeView.querySelector('.tree');
  
  renderTreeNode(tree, data, 'root');
}

function renderTreeNode(container, data, key, level = 0) {
  const node = document.createElement('div');
  node.className = 'tree-node';
  
  if (typeof data === 'object' && data !== null) {
    const isArray = Array.isArray(data);
    const entries = isArray ? data.entries() : Object.entries(data);
    const count = isArray ? data.length : Object.keys(data).length;
    
    const header = document.createElement('div');
    header.className = 'tree-node-header';
    
    const toggle = document.createElement('span');
    toggle.className = 'tree-toggle expanded';
    
    const keySpan = document.createElement('span');
    keySpan.className = 'tree-key';
    keySpan.textContent = key;
    
    const typeSpan = document.createElement('span');
    typeSpan.className = 'tree-type';
    typeSpan.textContent = isArray ? `Array[${count}]` : `Object{${count}}`;
    
    header.appendChild(toggle);
    header.appendChild(keySpan);
    header.appendChild(typeSpan);
    
    const children = document.createElement('div');
    children.className = 'tree-children';
    
    for (const [childKey, childValue] of entries) {
      renderTreeNode(children, childValue, childKey, level + 1);
    }
    
    header.addEventListener('click', () => {
      const isExpanded = toggle.classList.contains('expanded');
      if (isExpanded) {
        toggle.classList.remove('expanded');
        toggle.classList.add('collapsed');
        children.classList.add('collapsed');
      } else {
        toggle.classList.remove('collapsed');
        toggle.classList.add('expanded');
        children.classList.remove('collapsed');
      }
    });
    
    node.appendChild(header);
    node.appendChild(children);
  } else {
    const header = document.createElement('div');
    header.className = 'tree-node-header';
    
    const keySpan = document.createElement('span');
    keySpan.className = 'tree-key';
    keySpan.textContent = key + ':';
    
    const valueSpan = document.createElement('span');
    valueSpan.className = `tree-value ${typeof data}`;
    valueSpan.textContent = data === null ? 'null' : 
                           typeof data === 'string' ? `"${data}"` : 
                           String(data);
    
    header.appendChild(keySpan);
    header.appendChild(valueSpan);
    node.appendChild(header);
  }
  
  container.appendChild(node);
}

function renderRawView(item) {
  const rawView = document.getElementById('rawView');
  rawView.innerHTML = `
    <div class="raw-container">
      <pre class="raw-code">${JSON.stringify(item.data, null, 2)}</pre>
    </div>
  `;
}

function renderValidationView(data) {
  const validationView = document.getElementById('validationView');
  const results = validator.validate(data);
  const summary = validator.getSummary(results);
  
  let html = '<div class="validation-section">';
  
  // Summary
  html += '<h3>';
  if (results.isValid) {
    html += `✓ ${i18n.t('validationPassed')}`;
  } else {
    html += `✗ ${i18n.t('validationFailed')}`;
  }
  html += `<span class="tree-type">(${summary.errors} ${i18n.t('errors')}, ${summary.warnings} ${i18n.t('warnings')}, ${summary.suggestions} ${i18n.t('suggestions')})</span>`;
  html += '</h3>';
  
  // Errors
  if (results.errors.length > 0) {
    html += '<div class="validation-subsection">';
    results.errors.forEach(error => {
      html += `
        <div class="validation-item error">
          <div class="validation-title">
            <span class="badge error">${i18n.t('error')}</span>
            ${error.title}
          </div>
          <div class="validation-message">${error.message}</div>
          ${error.suggestion ? `<div class="validation-suggestion"><strong>${i18n.t('suggestionLabel')}:</strong> ${error.suggestion}</div>` : ''}
        </div>
      `;
    });
    html += '</div>';
  }
  
  // Warnings
  if (results.warnings.length > 0) {
    html += '<div class="validation-subsection">';
    results.warnings.forEach(warning => {
      html += `
        <div class="validation-item warning">
          <div class="validation-title">
            <span class="badge warning">${i18n.t('warning')}</span>
            ${warning.title}
          </div>
          <div class="validation-message">${warning.message}</div>
          ${warning.suggestion ? `<div class="validation-suggestion"><strong>${i18n.t('suggestionLabel')}:</strong> ${warning.suggestion}</div>` : ''}
        </div>
      `;
    });
    html += '</div>';
  }
  
  // Suggestions
  if (results.suggestions.length > 0) {
    html += '<div class="validation-subsection">';
    results.suggestions.forEach(suggestion => {
      html += `
        <div class="validation-item info">
          <div class="validation-title">
            <span class="badge info">${i18n.t('suggestion')}</span>
            ${suggestion.title}
          </div>
          <div class="validation-message">${suggestion.message}</div>
          ${suggestion.suggestion ? `<div class="validation-suggestion"><strong>${i18n.t('description')}:</strong> ${suggestion.suggestion}</div>` : ''}
        </div>
      `;
    });
    html += '</div>';
  }
  
  // Info
  if (results.info.length > 0) {
    html += '<div class="validation-subsection">';
    results.info.forEach(info => {
      html += `
        <div class="validation-item success">
          <div class="validation-title">
            <span class="badge success">${i18n.t('info')}</span>
            ${info.title}
          </div>
          <div class="validation-message">${info.message}</div>
        </div>
      `;
    });
    html += '</div>';
  }
  
  html += '</div>';
  
  validationView.innerHTML = html;
}

async function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  
  // Update tab panes
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.remove('active');
  });
  
  const targetPane = document.getElementById(`${tabName}View`);
  if (targetPane) {
    targetPane.classList.add('active');
    
    // Lazy load AI content when switching to AI tabs
    if (tabName === 'aiCheck' && !targetPane.dataset.loaded) {
      await renderAICheckView();
    } else if (tabName === 'aiSuggest' && !targetPane.dataset.loaded) {
      await renderAISuggestView();
    }
  }
}

function showEmptyState() {
  const content = document.getElementById('content');
  const status = document.getElementById('status');
  const container = document.getElementById('jsonLdContainer');
  
  status.className = 'status warning';
  status.innerHTML = `⚠ ${i18n.t('noJsonLd')} <span style="color: #667eea; font-weight: 500;">· ${i18n.t('canUseAiSuggest')}</span>`;
  
  // Show container with AI Suggest tab for empty state
  if (container) {
    content.style.display = 'none';
    container.style.display = 'block';
    
    // Hide tree, raw, validation, and aiCheck views
    document.getElementById('treeView').innerHTML = `
      <div class="empty-state-inline">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
        <h3>${i18n.t('noJsonLdFound')}</h3>
        <p>${i18n.t('noJsonLdOnPage')}</p>
        <p class="hint">💡 ${i18n.t('tryAiSuggest')}</p>
        <button class="btn btn-primary jump-to-ai-suggest" style="margin-top: 16px;">
          ${i18n.t('useAiSuggest')}
        </button>
      </div>
    `;
    
    // Add event listener for the button
    setTimeout(() => {
      const btn = document.querySelector('.jump-to-ai-suggest');
      if (btn) {
        btn.addEventListener('click', () => {
          switchTab('aiSuggest');
        });
      }
    }, 0);
    
    document.getElementById('rawView').innerHTML = `
      <div class="empty-state-inline">
        <p>${i18n.t('noJsonLdData')}</p>
      </div>
    `;
    
    document.getElementById('validationView').innerHTML = `
      <div class="empty-state-inline">
        <p>${i18n.t('noJsonLdToValidate')}</p>
      </div>
    `;
    
    document.getElementById('aiCheckView').innerHTML = `
      <div class="empty-state-inline">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        <h3>${i18n.t('noJsonLdFound')}</h3>
        <p>${i18n.t('noJsonLdToCheck')}</p>
        <p class="hint">💡 ${i18n.t('tryAiSuggest')}</p>
        <button class="btn btn-primary jump-to-ai-suggest-2" style="margin-top: 16px;">
          ${i18n.t('useAiSuggest')}
        </button>
      </div>
    `;
    
    // Add event listener for the button
    setTimeout(() => {
      const btn = document.querySelector('.jump-to-ai-suggest-2');
      if (btn) {
        btn.addEventListener('click', () => {
          switchTab('aiSuggest');
        });
      }
    }, 0);
    
    // Clear aiSuggestView loaded state so it can be used
    const aiSuggestView = document.getElementById('aiSuggestView');
    aiSuggestView.innerHTML = '';
    aiSuggestView.dataset.loaded = '';
  }
}

function showError(message) {
  const content = document.getElementById('content');
  const status = document.getElementById('status');
  const container = document.getElementById('jsonLdContainer');
  
  // Hide container, show content
  if (container) {
    container.style.display = 'none';
  }
  content.style.display = 'block';
  
  status.className = 'status error';
  status.textContent = `✗ ${i18n.t('loadFailed')}`;
  
  content.innerHTML = `
    <div class="empty-state">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      <h3>${i18n.t('errorOccurred')}</h3>
      <p>${message}</p>
    </div>
  `;
}

// AI Check View
async function renderAICheckView() {
  const aiCheckView = document.getElementById('aiCheckView');
  const hasApiKey = await aiService.initialize();
  
  if (!hasApiKey) {
    aiCheckView.innerHTML = `
      <div class="ai-placeholder">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        <h3>${i18n.t('aiCheckFeature')}</h3>
        <p>${i18n.t('aiCheckDescription')}</p>
        <button class="btn btn-primary open-settings-btn">
          ${i18n.t('configureApiKey')}
        </button>
      </div>
    `;
    
    // Add event listener for settings button
    setTimeout(() => {
      const btn = aiCheckView.querySelector('.open-settings-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          chrome.runtime.openOptionsPage();
        });
      }
    }, 0);
    return;
  }

  if (!currentJsonLdData || !currentJsonLdData.found) {
    aiCheckView.innerHTML = `
      <div class="ai-placeholder">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
        <h3>${i18n.t('noJsonLdFound')}</h3>
        <p>${i18n.t('noJsonLdToCheck')}</p>
        <p>${i18n.t('youCanUseAiSuggest')}</p>
      </div>
    `;
    return;
  }

  // Show loading state
  aiCheckView.innerHTML = `
    <div class="ai-loading">
      <div class="spinner"></div>
      <p>${i18n.t('aiAnalyzing')}</p>
      <p class="ai-loading-tip">${i18n.t('mayTakeFewSeconds')}</p>
    </div>
  `;

  try {
    const jsonLdToCheck = currentJsonLdData.data[currentSelectedIndex].data;
    const result = await aiService.checkJsonLd(jsonLdToCheck, currentPageInfo?.url);
    
    aiCheckView.innerHTML = `
      <div class="ai-result">
        <div class="ai-result-header">
          <h3>${i18n.t('aiCheckResults')}</h3>
          <button class="btn-secondary btn-small recheck-ai-btn">${i18n.t('recheckAi')}</button>
        </div>
        <div class="ai-result-content markdown-content">
          ${formatMarkdown(result)}
        </div>
      </div>
    `;
    
    aiCheckView.dataset.loaded = 'true';
    
    // Add event listener for recheck button
    setTimeout(() => {
      const btn = aiCheckView.querySelector('.recheck-ai-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          aiCheckView.dataset.loaded = '';
          renderAICheckView();
        });
      }
    }, 0);
  } catch (error) {
    console.error('AI Check error:', error);
    aiCheckView.innerHTML = `
      <div class="ai-error">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h3>${i18n.t('aiCheckFailed')}</h3>
        <p class="error-message">${error.message}</p>
        <button class="btn btn-primary retry-ai-check-btn">${i18n.t('retry')}</button>
      </div>
    `;
    
    // Add event listener for retry button
    setTimeout(() => {
      const btn = aiCheckView.querySelector('.retry-ai-check-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          renderAICheckView();
        });
      }
    }, 0);
  }
}

// AI Suggest View
async function renderAISuggestView() {
  const aiSuggestView = document.getElementById('aiSuggestView');
  const hasApiKey = await aiService.initialize();
  
  if (!hasApiKey) {
    aiSuggestView.innerHTML = `
      <div class="ai-placeholder">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <h3>${i18n.t('aiSuggestFeature')}</h3>
        <p>${i18n.t('aiSuggestDescription')}</p>
        <button class="btn btn-primary open-settings-btn-suggest">
          ${i18n.t('configureApiKey')}
        </button>
      </div>
    `;
    
    // Add event listener for settings button
    setTimeout(() => {
      const btn = aiSuggestView.querySelector('.open-settings-btn-suggest');
      if (btn) {
        btn.addEventListener('click', () => {
          chrome.runtime.openOptionsPage();
        });
      }
    }, 0);
    return;
  }

  if (!currentPageInfo) {
    aiSuggestView.innerHTML = `
      <div class="ai-placeholder">
        <h3>${i18n.t('unableToGetPageInfo')}</h3>
        <p>${i18n.t('pleaseRefresh')}</p>
      </div>
    `;
    return;
  }

  // Show loading state
  aiSuggestView.innerHTML = `
    <div class="ai-loading">
      <div class="spinner"></div>
      <p>${i18n.t('aiAnalyzingPage')}</p>
      <p class="ai-loading-tip">${i18n.t('mayTakeFewSeconds')}</p>
    </div>
  `;

  try {
    const pageInfo = {
      url: currentPageInfo.url,
      title: currentPageInfo.title,
      existingJsonLd: currentJsonLdData?.found ? currentJsonLdData.data.map(item => item.data) : []
    };
    
    const result = await aiService.suggestJsonLd(pageInfo);
    const jsonLdCodes = aiService.extractJsonLdCode(result);
    
    let copyButtonsHtml = '';
    if (jsonLdCodes.length > 0) {
      copyButtonsHtml = `
        <div class="ai-code-actions">
          <p class="ai-code-hint">💡 ${i18n.t('detectedCodeBlocks', {count: jsonLdCodes.length})}</p>
          ${jsonLdCodes.map((code, index) => `
            <button class="btn-secondary btn-small" onclick="copyJsonLdCode(${index})">
              ${i18n.t('copyCodeBlock', {index: index + 1})}
            </button>
          `).join('')}
        </div>
      `;
    }
    
    aiSuggestView.innerHTML = `
      <div class="ai-result">
        <div class="ai-result-header">
          <h3>${i18n.t('aiSuggestResults')}</h3>
          <button class="btn-secondary btn-small regenerate-ai-suggest-btn">${i18n.t('regenerate')}</button>
        </div>
        ${copyButtonsHtml}
        <div class="ai-result-content markdown-content">
          ${formatMarkdown(result)}
        </div>
      </div>
    `;
    
    // Store codes for copy function
    aiSuggestView.dataset.codes = JSON.stringify(jsonLdCodes);
    aiSuggestView.dataset.loaded = 'true';
    
    // Add event listener for regenerate button
    setTimeout(() => {
      const btn = aiSuggestView.querySelector('.regenerate-ai-suggest-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          aiSuggestView.dataset.loaded = '';
          renderAISuggestView();
        });
      }
    }, 0);
  } catch (error) {
    console.error('AI Suggest error:', error);
    aiSuggestView.innerHTML = `
      <div class="ai-error">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h3>${i18n.t('aiSuggestFailed')}</h3>
        <p class="error-message">${error.message}</p>
        <button class="btn btn-primary retry-ai-suggest-btn">${i18n.t('retry')}</button>
      </div>
    `;
    
    // Add event listener for retry button
    setTimeout(() => {
      const btn = aiSuggestView.querySelector('.retry-ai-suggest-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          renderAISuggestView();
        });
      }
    }, 0);
  }
}

// Copy JSON-LD code to clipboard
function copyJsonLdCode(index) {
  const aiSuggestView = document.getElementById('aiSuggestView');
  const codes = JSON.parse(aiSuggestView.dataset.codes || '[]');
  
  if (codes[index]) {
    navigator.clipboard.writeText(codes[index]).then(() => {
      // Show success feedback
      const btn = event.target;
      const originalText = btn.textContent;
      btn.textContent = `✓ ${i18n.t('copied')}`;
      btn.style.background = '#28a745';
      btn.style.color = 'white';
      
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.style.color = '';
      }, 2000);
    }).catch(err => {
      console.error('Copy failed:', err);
      alert(i18n.t('copyFailed'));
    });
  }
}

// Format markdown to HTML (simple implementation)
function formatMarkdown(text) {
  // Escape HTML
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Code blocks
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre class="code-block"><code class="language-${lang || 'text'}">${code.trim()}</code></pre>`;
  });
  
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  
  // Headers
  html = html.replace(/^### (.*$)/gm, '<h4>$1</h4>');
  html = html.replace(/^## (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^# (.*$)/gm, '<h2>$1</h2>');
  
  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Lists
  html = html.replace(/^\d+\.\s+(.*)$/gm, '<li>$1</li>');
  html = html.replace(/^[-*]\s+(.*)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  
  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';
  
  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<p>(<[hup])/g, '$1');
  html = html.replace(/(<\/[hup]>)<\/p>/g, '$1');
  
  return html;
}
