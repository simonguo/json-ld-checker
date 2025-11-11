// Internationalization module
class I18n {
  constructor() {
    this.loadLocale();
    this.translations = this.getTranslations();
  }

  // Load locale from storage or detect from browser
  async loadLocale() {
    try {
      // Try to get saved language preference
      const result = await chrome.storage.local.get(['language']);
      if (result.language && result.language !== 'auto') {
        this.locale = result.language;
      } else {
        this.locale = this.detectBrowserLocale();
      }
    } catch (error) {
      // Fallback for non-extension context
      this.locale = this.detectBrowserLocale();
    }
    this.translations = this.getTranslations();
  }

  // Detect browser language
  detectBrowserLocale() {
    const browserLang = navigator.language || navigator.userLanguage;
    // Support zh-CN, zh-TW, zh-HK, zh as Chinese
    if (browserLang.startsWith('zh')) {
      return 'zh';
    }
    // Default to English for all other languages
    return 'en';
  }

  // Set language manually
  async setLocale(locale) {
    if (locale === 'auto') {
      this.locale = this.detectBrowserLocale();
      await chrome.storage.local.set({ language: 'auto' });
    } else {
      this.locale = locale;
      await chrome.storage.local.set({ language: locale });
    }
    this.translations = this.getTranslations();
    
    // Dispatch event to notify other parts of the app
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { locale: this.locale } }));
  }

  // Get translation object based on locale
  getTranslations() {
    const translations = {
      zh: {
        // Header
        appName: 'JSON-LD Checker',
        settings: '设置',
        refresh: '刷新',
        
        // Status
        loading: '加载中...',
        foundJsonLd: '发现 {count} 个 JSON-LD 结构化数据',
        noJsonLd: '未发现 JSON-LD 数据',
        loadFailed: '加载失败',
        canUseAiSuggest: '可使用 AI 建议功能',
        
        // Tabs
        treeView: '树形视图',
        rawData: '原始数据',
        validationResults: '验证结果',
        aiCheck: 'AI 检查',
        aiSuggest: 'AI 建议',
        
        // JSON-LD Selector
        selectJsonLd: '选择 JSON-LD (共 {count} 个)',
        unknownType: '未知类型',
        
        // Validation
        validationPassed: '验证通过',
        validationFailed: '验证失败',
        errors: '错误',
        warnings: '警告',
        suggestions: '建议',
        error: '错误',
        warning: '警告',
        suggestion: '建议',
        info: '信息',
        suggestionLabel: '建议',
        description: '说明',
        
        // Empty States
        noJsonLdFound: '未发现 JSON-LD',
        noJsonLdOnPage: '当前页面没有包含 JSON-LD 结构化数据',
        tryAiSuggest: '试试 <strong>AI 建议</strong> 功能，让 AI 为您生成合适的 JSON-LD 代码',
        useAiSuggest: '使用 AI 建议',
        noJsonLdData: '当前页面没有 JSON-LD 数据',
        noJsonLdToValidate: '当前页面没有 JSON-LD 数据可供验证',
        noJsonLdToCheck: '当前页面没有 JSON-LD 数据可供检查',
        youCanUseAiSuggest: '您可以使用 "AI 建议" 功能获取建议',
        
        // Error States
        errorOccurred: '出错了',
        unableToGetCurrentTab: '无法获取当前标签页',
        interfaceElementNotFound: '界面元素未找到，请重新加载插件',
        dataIndexError: '数据索引错误',
        
        // AI Features
        aiCheckFeature: 'AI 检查功能',
        aiCheckDescription: '使用 AI 分析 JSON-LD 数据，检查潜在问题和优化建议',
        configureApiKey: '配置 API Key',
        aiAnalyzing: 'AI 正在分析 JSON-LD 数据...',
        aiAnalyzingPage: 'AI 正在分析页面并生成建议...',
        mayTakeFewSeconds: '这可能需要几秒钟时间',
        aiCheckResults: 'AI 检查结果',
        recheckAi: '重新检查',
        aiCheckFailed: 'AI 检查失败',
        retry: '重试',
        
        aiSuggestFeature: 'AI 建议功能',
        aiSuggestDescription: '根据页面内容，AI 会建议合适的 JSON-LD 结构化数据',
        aiSuggestResults: 'AI 建议结果',
        regenerate: '重新生成',
        aiSuggestFailed: 'AI 建议失败',
        detectedCodeBlocks: '检测到 {count} 个 JSON-LD 代码块',
        copyCodeBlock: '复制代码块 {index}',
        copied: '已复制',
        copyFailed: '复制失败，请手动复制',
        
        unableToGetPageInfo: '无法获取页面信息',
        pleaseRefresh: '请刷新页面后重试',
        
        // Content Script
        parseError: '解析错误',
        
        // Settings Page
        settingsTitle: '设置',
        languageSettings: '语言设置',
        languageLabel: '界面语言',
        languageAuto: '跟随系统',
        languageChinese: '中文',
        languageEnglish: 'English',
        aiConfiguration: 'AI 功能配置',
        aiConfigDescription: '配置 OpenAI API Key 以启用 AI 检查和建议功能',
        apiKeyLabel: 'OpenAI API Key',
        apiKeyPlaceholder: 'sk-...',
        showHide: '显示/隐藏',
        apiKeyHelp: 'API Key 将安全地存储在浏览器本地。',
        getApiKey: '获取 API Key',
        apiStatusLabel: 'API 状态',
        statusUnconfigured: '未配置',
        statusConfigured: '已配置',
        statusConnected: '连接成功',
        statusError: '连接失败',
        saveConfig: '保存配置',
        testConnection: '测试连接',
        clearConfig: '清除配置',
        saving: '保存中...',
        testing: '测试中...',
        aboutAiFeatures: '关于 AI 功能',
        aiCheckTitle: 'AI 检查',
        aiCheckDesc: '使用 AI 分析当前页面的 JSON-LD 数据，检查是否存在问题，包括：',
        aiCheckFeature1: '语法错误检查',
        aiCheckFeature2: 'Schema.org 规范验证',
        aiCheckFeature3: '必需字段检查',
        aiCheckFeature4: 'SEO 优化建议',
        aiSuggestTitle: 'AI 建议',
        aiSuggestDesc: '根据当前页面内容，AI 会建议合适的 JSON-LD 结构化数据：',
        aiSuggestFeature1: '自动识别页面类型',
        aiSuggestFeature2: '推荐合适的 Schema.org 类型',
        aiSuggestFeature3: '生成完整的 JSON-LD 代码',
        aiSuggestFeature4: '提供实施指导',
        privacyNotice: '隐私说明',
        privacyWarning: '⚠️ 使用 AI 功能时，页面的 JSON-LD 数据和基本信息（URL、标题等）会发送到 OpenAI 进行分析。',
        privacyPolicy: '请确保您了解并同意 OpenAI 的隐私政策和使用条款。',
        privacyStorage: 'API Key 仅存储在您的浏览器本地，不会发送到任何第三方服务器。',
        
        // Settings Messages
        enterApiKey: '请输入 API Key',
        invalidApiKeyFormat: 'API Key 格式不正确，应该以 sk- 开头',
        apiKeySaved: 'API Key 保存成功！',
        saveFailed: '保存失败',
        loadSettingsFailed: '加载设置失败',
        enterApiKeyFirst: '请先输入 API Key',
        connectionTestSuccess: '✓ API 连接测试成功！',
        connectionTestFailed: '✗ 连接测试失败',
        confirmClearConfig: '确定要清除 API Key 配置吗？',
        configCleared: '配置已清除',
        clearFailed: '清除失败'
      },
      en: {
        // Header
        appName: 'JSON-LD Checker',
        settings: 'Settings',
        refresh: 'Refresh',
        
        // Status
        loading: 'Loading...',
        foundJsonLd: 'Found {count} JSON-LD structured data',
        noJsonLd: 'No JSON-LD data found',
        loadFailed: 'Load failed',
        canUseAiSuggest: 'You can use AI Suggest feature',
        
        // Tabs
        treeView: 'Tree View',
        rawData: 'Raw Data',
        validationResults: 'Validation',
        aiCheck: 'AI Check',
        aiSuggest: 'AI Suggest',
        
        // JSON-LD Selector
        selectJsonLd: 'Select JSON-LD ({count} total)',
        unknownType: 'Unknown Type',
        
        // Validation
        validationPassed: 'Validation Passed',
        validationFailed: 'Validation Failed',
        errors: 'errors',
        warnings: 'warnings',
        suggestions: 'suggestions',
        error: 'Error',
        warning: 'Warning',
        suggestion: 'Suggestion',
        info: 'Info',
        suggestionLabel: 'Suggestion',
        description: 'Description',
        
        // Empty States
        noJsonLdFound: 'No JSON-LD Found',
        noJsonLdOnPage: 'This page does not contain JSON-LD structured data',
        tryAiSuggest: 'Try the <strong>AI Suggest</strong> feature to generate appropriate JSON-LD code',
        useAiSuggest: 'Use AI Suggest',
        noJsonLdData: 'No JSON-LD data on this page',
        noJsonLdToValidate: 'No JSON-LD data to validate on this page',
        noJsonLdToCheck: 'No JSON-LD data to check on this page',
        youCanUseAiSuggest: 'You can use the "AI Suggest" feature to get recommendations',
        
        // Error States
        errorOccurred: 'An Error Occurred',
        unableToGetCurrentTab: 'Unable to get current tab',
        interfaceElementNotFound: 'Interface element not found, please reload the extension',
        dataIndexError: 'Data index error',
        
        // AI Features
        aiCheckFeature: 'AI Check Feature',
        aiCheckDescription: 'Use AI to analyze JSON-LD data and check for potential issues and optimization suggestions',
        configureApiKey: 'Configure API Key',
        aiAnalyzing: 'AI is analyzing JSON-LD data...',
        aiAnalyzingPage: 'AI is analyzing the page and generating suggestions...',
        mayTakeFewSeconds: 'This may take a few seconds',
        aiCheckResults: 'AI Check Results',
        recheckAi: 'Recheck',
        aiCheckFailed: 'AI Check Failed',
        retry: 'Retry',
        
        aiSuggestFeature: 'AI Suggest Feature',
        aiSuggestDescription: 'Based on page content, AI will suggest appropriate JSON-LD structured data',
        aiSuggestResults: 'AI Suggest Results',
        regenerate: 'Regenerate',
        aiSuggestFailed: 'AI Suggest Failed',
        detectedCodeBlocks: 'Detected {count} JSON-LD code blocks',
        copyCodeBlock: 'Copy Code Block {index}',
        copied: 'Copied',
        copyFailed: 'Copy failed, please copy manually',
        
        unableToGetPageInfo: 'Unable to get page information',
        pleaseRefresh: 'Please refresh the page and try again',
        
        // Content Script
        parseError: 'Parse error',
        
        // Settings Page
        settingsTitle: 'Settings',
        languageSettings: 'Language Settings',
        languageLabel: 'Interface Language',
        languageAuto: 'Follow System',
        languageChinese: '中文',
        languageEnglish: 'English',
        aiConfiguration: 'AI Feature Configuration',
        aiConfigDescription: 'Configure OpenAI API Key to enable AI check and suggest features',
        apiKeyLabel: 'OpenAI API Key',
        apiKeyPlaceholder: 'sk-...',
        showHide: 'Show/Hide',
        apiKeyHelp: 'API Key will be securely stored in your browser locally.',
        getApiKey: 'Get API Key',
        apiStatusLabel: 'API Status',
        statusUnconfigured: 'Not Configured',
        statusConfigured: 'Configured',
        statusConnected: 'Connected',
        statusError: 'Connection Failed',
        saveConfig: 'Save Configuration',
        testConnection: 'Test Connection',
        clearConfig: 'Clear Configuration',
        saving: 'Saving...',
        testing: 'Testing...',
        aboutAiFeatures: 'About AI Features',
        aiCheckTitle: 'AI Check',
        aiCheckDesc: 'Use AI to analyze JSON-LD data on the current page and check for issues, including:',
        aiCheckFeature1: 'Syntax error checking',
        aiCheckFeature2: 'Schema.org specification validation',
        aiCheckFeature3: 'Required field checking',
        aiCheckFeature4: 'SEO optimization suggestions',
        aiSuggestTitle: 'AI Suggest',
        aiSuggestDesc: 'Based on page content, AI will suggest appropriate JSON-LD structured data:',
        aiSuggestFeature1: 'Automatic page type identification',
        aiSuggestFeature2: 'Recommend appropriate Schema.org types',
        aiSuggestFeature3: 'Generate complete JSON-LD code',
        aiSuggestFeature4: 'Provide implementation guidance',
        privacyNotice: 'Privacy Notice',
        privacyWarning: '⚠️ When using AI features, the page\'s JSON-LD data and basic information (URL, title, etc.) will be sent to OpenAI for analysis.',
        privacyPolicy: 'Please ensure you understand and agree to OpenAI\'s privacy policy and terms of use.',
        privacyStorage: 'API Key is only stored locally in your browser and will not be sent to any third-party servers.',
        
        // Settings Messages
        enterApiKey: 'Please enter API Key',
        invalidApiKeyFormat: 'Invalid API Key format, should start with sk-',
        apiKeySaved: 'API Key saved successfully!',
        saveFailed: 'Save failed',
        loadSettingsFailed: 'Failed to load settings',
        enterApiKeyFirst: 'Please enter API Key first',
        connectionTestSuccess: '✓ API connection test successful!',
        connectionTestFailed: '✗ Connection test failed',
        confirmClearConfig: 'Are you sure you want to clear the API Key configuration?',
        configCleared: 'Configuration cleared',
        clearFailed: 'Clear failed'
      }
    };
    
    return translations[this.locale] || translations.en;
  }

  // Get translated text
  t(key, params = {}) {
    let text = this.translations[key] || key;
    
    // Replace parameters like {count}, {index}
    Object.keys(params).forEach(param => {
      text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
    });
    
    return text;
  }

  // Get current locale
  getLocale() {
    return this.locale;
  }
}

// Create global instance
const i18n = new I18n();
