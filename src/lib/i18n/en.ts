export default {
  // Common
  extensionName: 'JSON-LD Checker',
  settings: 'Settings',
  settingsDescription: 'Configure AI providers and interface language for the extension',
  languageSettings: 'Language Settings',
  languageSettingsDescription: 'Select the language for the extension interface',
  refresh: 'Refresh',
  loading: 'Loading...',
  save: 'Save',
  cancel: 'Cancel',
  retry: 'Retry',
  copied: 'Copied',
  copyFailed: 'Copy failed',

  // Status
  foundJsonLd: 'Found {count} JSON-LD structured data',
  noJsonLd: 'No JSON-LD data found',
  loadFailed: 'Load failed',

  // Tabs
  treeView: 'Tree View',
  rawData: 'Raw Data',
  validation: 'Validation',
  aiCheck: 'AI Check',
  aiSuggest: 'AI Suggest',

  // Tree View
  selectJsonLd: 'Select JSON-LD ({count} total)',
  unknownType: 'Unknown Type',
  searchPlaceholder: 'Search in tree...',
  clearSearch: 'Clear search',
  searchResults: '{count} results found',
  noSearchResults: 'No results found',

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
  description: 'Description',
  googleTest: 'Google Test',
  googleTestTitle: 'Test with Google Rich Results',
  suggestionLabel: 'Suggestion',

  // No JSON-LD
  noJsonLdFound: 'No JSON-LD Found',
  noJsonLdOnPage: 'This page does not contain JSON-LD structured data',
  tryAiSuggest: 'Try the `AI Suggest` feature to generate appropriate JSON-LD code',
  useAiSuggest: 'Use AI Suggest',
  noJsonLdData: 'No JSON-LD data on this page',
  noJsonLdToValidate: 'No JSON-LD data to validate on this page',
  noJsonLdToCheck: 'No JSON-LD data to check on this page',
  youCanUseAiSuggest: 'You can use the "AI Suggest" feature to get recommendations',

  // Errors
  errorOccurred: 'An Error Occurred',
  unableToGetCurrentTab: 'Unable to get current tab',
  interfaceElementNotFound: 'Interface element not found, please reload the extension',
  dataIndexError: 'Data index error',
  parseError: 'Parse error',
  unableToGetPageInfo: 'Unable to get page information',
  pleaseRefresh: 'Please refresh the page and try again',

  // AI Check
  aiCheckFeature: 'AI Check Feature',
  aiCheckDescription: 'Use AI to analyze JSON-LD data and check for potential issues and optimization suggestions',
  configureApiKey: 'Configure API Key',
  aiAnalyzing: 'AI is analyzing JSON-LD data...',
  aiAnalyzingPage: 'AI is analyzing the page and generating suggestions...',
  mayTakeFewSeconds: 'This may take a few seconds',
  aiCheckResults: 'AI Check Results',
  recheckAi: 'Recheck',
  aiCheckFailed: 'AI Check Failed',

  // AI Suggest
  aiSuggestFeature: 'AI Suggest Feature',
  aiSuggestDescription: 'Based on page content, AI will suggest appropriate JSON-LD structured data',
  aiSuggestResults: 'AI Suggest Results',
  regenerate: 'Regenerate',
  aiSuggestFailed: 'AI Suggest Failed',
  detectedCodeBlocks: 'Detected {count} JSON-LD code blocks',
  copyCodeBlock: 'Copy Code Block {index}',

  // Settings Page
  settingsTitle: 'Settings',
  interfaceLanguage: 'Interface Language',
  interfaceLanguageHelper: 'Select the language for the extension interface',
  aiConfiguration: 'AI Feature Configuration',
  aiConfigDescription: 'Configure AI provider and API key to enable AI check and suggest features',
  
  providerLabel: 'AI Provider',
  providerHelp: 'Select the AI service provider you want to use',
  modelLabel: 'Model',
  modelHelp: 'Select the AI model for analysis',
  ollamaFetchingModels: 'Loading Ollama models...',
  ollamaNoModels: 'No models found. Make sure Ollama is running.',
  ollamaFetchFailed: 'Failed to fetch Ollama models',
  ollamaRefreshModels: 'Refresh models',
  ollamaNoApiKey: 'Ollama runs locally and does not require an API key.',
  apiKeyLabel: 'API Key',
  apiKeyPlaceholder: 'sk-...',
  showHide: 'Show/Hide',
  apiKeyHelp: 'API Key will be securely stored in your browser locally.',
  getApiKey: 'Get API Key',
  
  endpointLabel: 'API Endpoint (Optional)',
  endpointPlaceholder: 'https://api.example.com/v1/chat/completions',
  endpointHelp: 'Leave empty to use the default endpoint. For custom endpoints or proxies, enter the complete URL.',
  azureEndpointLabel: 'Azure Endpoint',
  azureDeploymentLabel: 'Azure Deployment Name',
  
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
  
  providerTipsTitle: 'Provider Tips',
  providerTip1: "OpenAI API keys start with 'sk-', Gemini with 'AIza', OpenRouter with 'sk-or-', Anthropic with 'sk-ant-'",
  providerTip2: 'For custom endpoints, make sure they are compatible with the OpenAI API format',
  providerTip3: 'Azure OpenAI requires both endpoint URL and deployment name',

  // About AI Features
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

  // Privacy
  privacyNotice: 'Privacy Notice',
  privacyWarning: "When using AI features, the page's JSON-LD data and basic information (URL, title, etc.) will be sent to your selected AI provider for analysis.",
  privacyPolicy: "Please ensure you understand and agree to your AI provider's privacy policy and terms of use.",
  privacyStorage: 'API Key is only stored locally in your browser and will not be sent to any third-party servers.',

  // Language Options
  autoDetect: 'Auto Detect (System)',
  english: 'English',
  chinese: '简体中文',

  // Messages
  enterApiKey: 'Please enter API Key',
  invalidApiKeyFormat: 'Invalid API Key format, should start with {prefix}',
  azureFieldsRequired: 'Azure endpoint and deployment name are required',
  apiKeySaved: 'API Key saved successfully!',
  saveFailed: 'Save failed',
  loadSettingsFailed: 'Failed to load settings',
  enterApiKeyFirst: 'Please enter API Key first',
  connectionTestSuccess: 'API connection test successful!',
  connectionTestFailed: 'Connection test failed',
  confirmClearConfig: 'Are you sure you want to clear the API configuration?',
  configCleared: 'Configuration cleared',
  clearFailed: 'Clear failed',

  // Footer
  contact: 'Contact',
  reportBug: 'Report Bug',
  madeWith: 'Made with',
  by: 'by',
  copyright: 'Copyright',
  allRightsReserved: 'All rights reserved',
  documentation: 'Documentation',

  // Icon titles
  iconTitleFound: 'JSON-LD Checker - Found {count} JSON-LD',
  iconTitleNotFound: 'JSON-LD Checker - No JSON-LD found',

  // Update Notifications
  updateAvailable: 'Update Available!',
  updateAvailableDesc: 'Version {version} is ready to install.',
  updateNow: 'Update Now',
  updateLater: 'Later',
  updateSuccess: 'Successfully Updated!',
  updateSuccessDesc: 'Updated from v{from} to v{to}',
  dismiss: 'Dismiss',
  currentVersion: 'Current Version',
  checkForUpdates: 'Check for Updates',
  checking: 'Checking...',
  latestVersion: 'You are using the latest version!',
  viewChanges: 'View Changes',
};
