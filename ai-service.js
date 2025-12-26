// AI Service for JSON-LD analysis using multiple AI providers
class AIService {
  constructor() {
    this.apiKey = null;
    this.provider = 'openai';
    this.model = 'gpt-4o-mini';
    this.endpoint = '';
    this.azureEndpoint = '';
    this.azureDeployment = '';
  }

  isEnglish() {
    const lang = chrome.i18n.getUILanguage ? chrome.i18n.getUILanguage() : 'en';
    return !String(lang).toLowerCase().startsWith('zh');
  }

  // Initialize and load settings from storage
  async initialize() {
    try {
      const result = await chrome.storage.sync.get([
        'ai_provider',
        'ai_model',
        'api_key',
        'api_endpoint',
        'azure_endpoint',
        'azure_deployment'
      ]);
      this.provider = result.ai_provider || 'openai';
      this.model = result.ai_model || 'gpt-4o-mini';
      this.apiKey = result.api_key || null;
      this.endpoint = result.api_endpoint || '';
      this.azureEndpoint = result.azure_endpoint || '';
      this.azureDeployment = result.azure_deployment || '';
      return !!this.apiKey;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return false;
    }
  }

  // Check if API key is configured
  isConfigured() {
    return !!this.apiKey;
  }

  // Set API configuration
  async setApiConfig(config) {
    try {
      await chrome.storage.sync.set({
        ai_provider: config.provider,
        ai_model: config.model,
        api_key: config.apiKey,
        api_endpoint: config.endpoint || '',
        azure_endpoint: config.azureEndpoint || '',
        azure_deployment: config.azureDeployment || ''
      });
      this.provider = config.provider;
      this.model = config.model;
      this.apiKey = config.apiKey;
      this.endpoint = config.endpoint || '';
      this.azureEndpoint = config.azureEndpoint || '';
      this.azureDeployment = config.azureDeployment || '';
      return true;
    } catch (error) {
      console.error('Failed to save API config:', error);
      return false;
    }
  }

  // Set API key (backwards compatibility)
  async setApiKey(key) {
    return this.setApiConfig({
      provider: this.provider,
      model: this.model,
      apiKey: key,
      endpoint: this.endpoint,
      azureEndpoint: this.azureEndpoint,
      azureDeployment: this.azureDeployment
    });
  }

  // Get API key
  async getApiKey() {
    if (!this.apiKey) {
      await this.initialize();
    }
    return this.apiKey;
  }

  // Clear API configuration
  async clearApiKey() {
    try {
      await chrome.storage.sync.remove([
        'ai_provider',
        'ai_model',
        'api_key',
        'api_endpoint',
        'azure_endpoint',
        'azure_deployment'
      ]);
      this.provider = 'openai';
      this.model = 'gpt-4o-mini';
      this.apiKey = null;
      this.endpoint = '';
      this.azureEndpoint = '';
      this.azureDeployment = '';
      return true;
    } catch (error) {
      console.error('Failed to clear API config:', error);
      return false;
    }
  }

  // Get API endpoint based on provider
  getApiEndpoint() {
    if (this.provider === 'azure') {
      return `${this.azureEndpoint}/openai/deployments/${this.azureDeployment}/chat/completions?api-version=2024-02-15-preview`;
    }
    if (this.endpoint) {
      return this.endpoint;
    }
    const providerConfig = AI_PROVIDERS[this.provider];
    return providerConfig?.endpoint || 'https://api.openai.com/v1/chat/completions';
  }

  // Build request headers based on provider
  buildHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (this.provider === 'azure') {
      headers['api-key'] = this.apiKey;
    } else if (this.provider === 'anthropic') {
      headers['x-api-key'] = this.apiKey;
      headers['anthropic-version'] = '2023-06-01';
    } else if (this.provider === 'google') {
      // Google uses API key in URL
      return headers;
    } else {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  // Build request body based on provider
  buildRequestBody(messages, temperature) {
    if (this.provider === 'anthropic') {
      // Convert OpenAI format to Anthropic format
      const systemMessage = messages.find(m => m.role === 'system');
      const otherMessages = messages.filter(m => m.role !== 'system');
      
      return {
        model: this.model,
        messages: otherMessages,
        system: systemMessage?.content || undefined,
        temperature: temperature,
        max_tokens: 2000
      };
    } else if (this.provider === 'google') {
      // Convert to Google Gemini format
      const contents = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));
      
      const systemMessage = messages.find(m => m.role === 'system');
      
      return {
        contents: contents,
        systemInstruction: systemMessage ? { parts: [{ text: systemMessage.content }] } : undefined,
        generationConfig: {
          temperature: temperature,
          maxOutputTokens: 2000
        }
      };
    } else {
      // OpenAI, Azure, OpenRouter, Custom format
      return {
        model: this.model,
        messages: messages,
        temperature: temperature,
        max_tokens: 2000
      };
    }
  }

  // Parse response based on provider
  parseResponse(data) {
    if (this.provider === 'anthropic') {
      return data.content[0].text;
    } else if (this.provider === 'google') {
      return data.candidates[0].content.parts[0].text;
    } else {
      return data.choices[0].message.content;
    }
  }

  // Make API call to AI provider
  async callOpenAI(messages, temperature = 0.7) {
    if (!this.apiKey) {
      const errorMsg = this.isEnglish()
        ? 'API Key not configured. Please configure it in settings.'
        : 'API Key 未配置，请先在设置中配置';
      throw new Error(errorMsg);
    }

    try {
      let endpoint = this.getApiEndpoint();
      
      // For Google, add API key to URL
      if (this.provider === 'google') {
        endpoint = `${endpoint}/${this.model}:generateContent?key=${this.apiKey}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(this.buildRequestBody(messages, temperature))
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const isEnglish = this.isEnglish();
        if (response.status === 401 || response.status === 403) {
          throw new Error(isEnglish ? 'Invalid API Key. Please check your configuration.' : 'API Key 无效，请检查配置');
        } else if (response.status === 429) {
          throw new Error(isEnglish ? 'API rate limit exceeded. Please try again later.' : 'API 调用频率超限，请稍后重试');
        } else {
          const errorMsg = errorData.error?.message || errorData.message || (isEnglish ? `API call failed (${response.status})` : `API 调用失败 (${response.status})`);
          throw new Error(errorMsg);
        }
      }

      const data = await response.json();
      return this.parseResponse(data);
    } catch (error) {
      if (error.message.includes('Failed to fetch')) {
        const isEnglish = this.isEnglish();
        throw new Error(isEnglish ? 'Network connection failed. Please check your network settings.' : '网络连接失败，请检查网络设置');
      }
      throw error;
    }
  }

  // Check JSON-LD for issues
  async checkJsonLd(jsonLdData, pageUrl = '') {
    const isEnglish = this.isEnglish();
    
    const systemPrompt = isEnglish 
      ? `You are a JSON-LD and Schema.org structured data expert. Your task is to check JSON-LD data for issues, including:
1. Syntax errors
2. Schema.org specification violations
3. Missing required fields
4. Data type errors
5. Best practice violations
6. SEO optimization suggestions

Please respond in English with clear formatting using Markdown.`
      : `你是一个 JSON-LD 和 Schema.org 结构化数据专家。你的任务是检查 JSON-LD 数据是否存在问题，包括：
1. 语法错误
2. Schema.org 规范不符
3. 必需字段缺失
4. 数据类型错误
5. 最佳实践违反
6. SEO 优化建议

请用中文回复，格式要清晰，使用 Markdown 格式。`;

    const userPrompt = isEnglish
      ? `Please check the following JSON-LD data for issues:

Page URL: ${pageUrl || 'Not provided'}

JSON-LD data:
\`\`\`json
${JSON.stringify(jsonLdData, null, 2)}
\`\`\`

Please provide detailed inspection results, including:
1. Overall assessment
2. Issues found (if any)
3. Improvement suggestions
4. Best practice recommendations`
      : `请检查以下 JSON-LD 数据是否存在问题：

页面 URL: ${pageUrl || '未提供'}

JSON-LD 数据:
\`\`\`json
${JSON.stringify(jsonLdData, null, 2)}
\`\`\`

请提供详细的检查结果，包括：
1. 总体评价
2. 发现的问题（如果有）
3. 改进建议
4. 最佳实践建议`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    return await this.callOpenAI(messages, 0.3);
  }

  // Suggest JSON-LD for current page
  async suggestJsonLd(pageInfo) {
    const isEnglish = this.isEnglish();
    
    const systemPrompt = isEnglish
      ? `You are a JSON-LD and Schema.org structured data expert. Your task is to suggest appropriate JSON-LD structured data based on webpage content.

You need to:
1. Analyze the page type (article, product, organization, person, etc.)
2. Recommend the most appropriate Schema.org types
3. Provide complete JSON-LD code examples
4. Explain why these types were chosen
5. Provide implementation suggestions

Please respond in English. The JSON-LD code should be complete and ready to use.`
      : `你是一个 JSON-LD 和 Schema.org 结构化数据专家。你的任务是根据网页内容建议合适的 JSON-LD 结构化数据。

你需要：
1. 分析页面类型（文章、产品、组织、人物等）
2. 建议最合适的 Schema.org 类型
3. 提供完整的 JSON-LD 代码示例
4. 说明为什么选择这些类型
5. 提供实施建议

请用中文回复，JSON-LD 代码要完整且可直接使用。`;

    let userPrompt = isEnglish
      ? `Please suggest JSON-LD structured data for the following webpage:

Page URL: ${pageInfo.url || 'Not provided'}
Page Title: ${pageInfo.title || 'Not provided'}`
      : `请为以下网页建议 JSON-LD 结构化数据：

页面 URL: ${pageInfo.url || '未提供'}
页面标题: ${pageInfo.title || '未提供'}`;

    if (pageInfo.description) {
      userPrompt += isEnglish 
        ? `\nPage Description: ${pageInfo.description}`
        : `\n页面描述: ${pageInfo.description}`;
    }

    if (pageInfo.existingJsonLd && pageInfo.existingJsonLd.length > 0) {
      userPrompt += isEnglish
        ? `\n\nExisting JSON-LD on the page:
\`\`\`json
${JSON.stringify(pageInfo.existingJsonLd, null, 2)}
\`\`\`

Please analyze the existing JSON-LD and provide improvement or supplementary suggestions.`
        : `\n\n当前页面已有的 JSON-LD:
\`\`\`json
${JSON.stringify(pageInfo.existingJsonLd, null, 2)}
\`\`\`

请分析现有的 JSON-LD 并提供改进建议或补充建议。`;
    } else {
      userPrompt += isEnglish
        ? `\n\nThe page currently has no JSON-LD data.`
        : `\n\n当前页面没有 JSON-LD 数据。`;
    }

    userPrompt += isEnglish
      ? `\n\nPlease provide:
1. Page type analysis
2. Recommended Schema.org types
3. Complete JSON-LD code (ready to copy and use)
4. Implementation instructions`
      : `\n\n请提供：
1. 页面类型分析
2. 建议的 Schema.org 类型
3. 完整的 JSON-LD 代码（可直接复制使用）
4. 实施说明`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    return await this.callOpenAI(messages, 0.5);
  }

  // Extract JSON-LD code blocks from markdown response
  extractJsonLdCode(markdownText) {
    const codeBlockRegex = /```(?:json)?\s*\n([\s\S]*?)\n```/g;
    const matches = [];
    let match;

    while ((match = codeBlockRegex.exec(markdownText)) !== null) {
      try {
        const code = match[1].trim();
        // Try to parse to validate it's valid JSON
        JSON.parse(code);
        matches.push(code);
      } catch (e) {
        // Skip invalid JSON blocks
      }
    }

    return matches;
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIService;
}
