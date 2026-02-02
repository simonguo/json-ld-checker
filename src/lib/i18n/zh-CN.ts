export default {
  // Common
  extensionName: 'JSON-LD Checker',
  settings: '设置',
  settingsDescription: '配置 AI 服务提供商和扩展界面语言',
  languageSettings: '语言设置',
  languageSettingsDescription: '选择扩展界面的语言',
  refresh: '刷新',
  loading: '加载中...',
  save: '保存',
  cancel: '取消',
  retry: '重试',
  copied: '已复制',
  copyFailed: '复制失败',

  // Status
  foundJsonLd: '发现 {count} 个 JSON-LD 结构化数据',
  noJsonLd: '未发现 JSON-LD 数据',
  loadFailed: '加载失败',

  // Tabs
  treeView: '树形视图',
  rawData: '原始数据',
  validation: '验证',
  aiCheck: 'AI 检查',
  aiSuggest: 'AI 建议',

  // Tree View
  selectJsonLd: '选择 JSON-LD（共 {count} 个）',
  unknownType: '未知类型',
  searchPlaceholder: '在树中搜索...',
  clearSearch: '清除搜索',
  searchResults: '找到 {count} 个结果',
  noSearchResults: '未找到结果',

  // Validation
  validationPassed: '验证通过',
  validationFailed: '验证失败',
  errors: '个错误',
  warnings: '个警告',
  suggestions: '个建议',
  error: '错误',
  warning: '警告',
  suggestion: '建议',
  info: '信息',
  description: '描述',
  googleTest: 'Google 测试',
  googleTestTitle: '使用 Google 富媒体结果测试',
  suggestionLabel: '建议',

  // No JSON-LD
  noJsonLdFound: '未发现 JSON-LD',
  noJsonLdOnPage: '此页面不包含 JSON-LD 结构化数据',
  tryAiSuggest: '尝试使用 "AI 建议" 功能生成合适的 JSON-LD 代码',
  useAiSuggest: '使用 AI 建议',
  noJsonLdData: '此页面没有 JSON-LD 数据',
  noJsonLdToValidate: '此页面没有可验证的 JSON-LD 数据',
  noJsonLdToCheck: '此页面没有可检查的 JSON-LD 数据',
  youCanUseAiSuggest: '您可以使用"AI 建议"功能获取建议',

  // Errors
  errorOccurred: '发生错误',
  unableToGetCurrentTab: '无法获取当前标签页',
  interfaceElementNotFound: '界面元素未找到，请重新加载扩展',
  dataIndexError: '数据索引错误',
  parseError: '解析错误',
  unableToGetPageInfo: '无法获取页面信息',
  pleaseRefresh: '请刷新页面后重试',

  // AI Check
  aiCheckFeature: 'AI 检查功能',
  aiCheckDescription: '使用 AI 分析 JSON-LD 数据，检查潜在问题和优化建议',
  configureApiKey: '配置 API Key',
  aiAnalyzing: 'AI 正在分析 JSON-LD 数据...',
  aiAnalyzingPage: 'AI 正在分析页面并生成建议...',
  mayTakeFewSeconds: '这可能需要几秒钟时间',
  aiCheckResults: 'AI 检查结果',
  recheckAi: '重新检查',
  aiCheckFailed: 'AI 检查失败',

  // AI Suggest
  aiSuggestFeature: 'AI 建议功能',
  aiSuggestDescription: '根据页面内容，AI 会建议合适的 JSON-LD 结构化数据',
  aiSuggestResults: 'AI 建议结果',
  regenerate: '重新生成',
  aiSuggestFailed: 'AI 建议失败',
  detectedCodeBlocks: '检测到 {count} 个 JSON-LD 代码块',
  copyCodeBlock: '复制代码块 {index}',

  // Settings Page
  settingsTitle: '设置',
  interfaceLanguage: '界面语言',
  interfaceLanguageHelper: '选择扩展界面的语言',
  aiConfiguration: 'AI 功能配置',
  aiConfigDescription: '配置 AI 服务商和 API Key 以启用 AI 检查和建议功能',

  providerLabel: 'AI 服务商',
  providerHelp: '选择您要使用的 AI 服务提供商',
  modelLabel: '模型',
  modelHelp: '选择用于分析的 AI 模型',
  apiKeyLabel: 'API Key',
  apiKeyPlaceholder: 'sk-...',
  showHide: '显示/隐藏',
  apiKeyHelp: 'API Key 将安全地存储在浏览器本地。',
  getApiKey: '获取 API Key',

  endpointLabel: 'API 端点（可选）',
  endpointPlaceholder: 'https://api.example.com/v1/chat/completions',
  endpointHelp: '留空则使用默认端点。如需使用自定义端点或代理，请输入完整 URL。',
  azureEndpointLabel: 'Azure 端点',
  azureDeploymentLabel: 'Azure 部署名称',

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

  providerTipsTitle: '服务商提示',
  providerTip1: "OpenAI API key 以 'sk-' 开头，Gemini 以 'AIza' 开头，OpenRouter 以 'sk-or-' 开头，Anthropic 以 'sk-ant-' 开头",
  providerTip2: '自定义端点需要确保与 OpenAI API 格式兼容',
  providerTip3: 'Azure OpenAI 需要同时填写端点 URL 和部署名称',

  // About AI Features
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

  // Privacy
  privacyNotice: '隐私说明',
  privacyWarning: '使用 AI 功能时，页面的 JSON-LD 数据和基本信息（URL、标题等）会发送到您选择的 AI 服务商进行分析。',
  privacyPolicy: '请确保您了解并同意所选 AI 服务商的隐私政策和使用条款。',
  privacyStorage: 'API Key 仅存储在您的浏览器本地，不会发送到任何第三方服务器。',

  // Language Options
  autoDetect: '自动检测（跟随系统）',
  english: 'English',
  chinese: '简体中文',

  // Messages
  enterApiKey: '请输入 API Key',
  invalidApiKeyFormat: 'API Key 格式不正确，应该以 {prefix} 开头',
  azureFieldsRequired: '需要填写 Azure 端点和部署名称',
  apiKeySaved: 'API Key 保存成功！',
  saveFailed: '保存失败',
  loadSettingsFailed: '加载设置失败',
  enterApiKeyFirst: '请先输入 API Key',
  connectionTestSuccess: 'API 连接测试成功！',
  connectionTestFailed: '连接测试失败',
  confirmClearConfig: '确定要清除 API 配置吗？',
  configCleared: '配置已清除',
  clearFailed: '清除失败',

  // Footer
  contact: '联系我们',
  reportBug: '报告问题',
  madeWith: '由',
  by: '制作',
  copyright: '版权所有',
  allRightsReserved: '保留所有权利',
  documentation: '文档',

  // Icon titles
  iconTitleFound: 'JSON-LD Checker - 发现 {count} 个 JSON-LD',
  iconTitleNotFound: 'JSON-LD Checker - 未发现 JSON-LD',

  // Update Notifications
  updateAvailable: '发现新版本！',
  updateAvailableDesc: '版本 {version} 已准备好安装。',
  updateNow: '立即更新',
  updateLater: '稍后',
  updateSuccess: '更新成功！',
  updateSuccessDesc: '已从 v{from} 更新到 v{to}',
  dismiss: '关闭',
  currentVersion: '当前版本',
  checkForUpdates: '检查更新',
  checking: '检查中...',
  latestVersion: '您正在使用最新版本！',
  viewChanges: '查看更新内容',
};
