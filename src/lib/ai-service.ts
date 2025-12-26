import { AI_PROVIDERS, ProviderKey } from '@/config/ai-providers';

export interface AIConfig {
  provider: ProviderKey;
  model: string;
  apiKey: string;
  endpoint?: string;
  azureEndpoint?: string;
  azureDeployment?: string;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const isEnglish = (): boolean => {
  const lang = typeof navigator !== 'undefined' ? navigator.language : 'en';
  return !String(lang).toLowerCase().startsWith('zh');
};

export class AIService {
  private config: AIConfig = {
    provider: 'openai',
    model: 'gpt-4o-mini',
    apiKey: '',
    endpoint: '',
    azureEndpoint: '',
    azureDeployment: '',
  };

  async initialize(): Promise<boolean> {
    try {
      const result = await chrome.storage.local.get([
        'ai_provider',
        'ai_model',
        'api_key',
        'api_endpoint',
        'azure_endpoint',
        'azure_deployment',
      ]);

      this.config = {
        provider: (result.ai_provider as ProviderKey) || 'openai',
        model: result.ai_model || 'gpt-4o-mini',
        apiKey: result.api_key || '',
        endpoint: result.api_endpoint || '',
        azureEndpoint: result.azure_endpoint || '',
        azureDeployment: result.azure_deployment || '',
      };

      return !!this.config.apiKey;
    } catch (error) {
      console.error('Failed to load AI settings:', error);
      return false;
    }
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  getConfig(): AIConfig {
    return { ...this.config };
  }

  async setConfig(config: Partial<AIConfig>): Promise<boolean> {
    try {
      const newConfig = { ...this.config, ...config };
      await chrome.storage.local.set({
        ai_provider: newConfig.provider,
        ai_model: newConfig.model,
        api_key: newConfig.apiKey,
        api_endpoint: newConfig.endpoint || '',
        azure_endpoint: newConfig.azureEndpoint || '',
        azure_deployment: newConfig.azureDeployment || '',
      });
      this.config = newConfig;
      return true;
    } catch (error) {
      console.error('Failed to save AI config:', error);
      return false;
    }
  }

  async clearConfig(): Promise<boolean> {
    try {
      await chrome.storage.local.remove([
        'ai_provider',
        'ai_model',
        'api_key',
        'api_endpoint',
        'azure_endpoint',
        'azure_deployment',
      ]);
      this.config = {
        provider: 'openai',
        model: 'gpt-4o-mini',
        apiKey: '',
        endpoint: '',
        azureEndpoint: '',
        azureDeployment: '',
      };
      return true;
    } catch (error) {
      console.error('Failed to clear AI config:', error);
      return false;
    }
  }

  private getApiEndpoint(): string {
    if (this.config.provider === 'azure') {
      return `${this.config.azureEndpoint}/openai/deployments/${this.config.azureDeployment}/chat/completions?api-version=2024-02-15-preview`;
    }
    if (this.config.endpoint) {
      return this.config.endpoint;
    }
    const providerConfig = AI_PROVIDERS[this.config.provider];
    return providerConfig?.endpoint || 'https://api.openai.com/v1/chat/completions';
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.provider === 'azure') {
      headers['api-key'] = this.config.apiKey;
    } else if (this.config.provider === 'anthropic') {
      headers['x-api-key'] = this.config.apiKey;
      headers['anthropic-version'] = '2023-06-01';
    } else if (this.config.provider === 'google') {
      // Google uses API key in URL
    } else {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }

  private buildRequestBody(messages: ChatMessage[], temperature: number): object {
    if (this.config.provider === 'anthropic') {
      const systemMessage = messages.find((m) => m.role === 'system');
      const otherMessages = messages.filter((m) => m.role !== 'system');

      return {
        model: this.config.model,
        messages: otherMessages,
        system: systemMessage?.content || undefined,
        temperature: temperature,
        max_tokens: 2000,
      };
    } else if (this.config.provider === 'google') {
      const contents = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

      const systemMessage = messages.find((m) => m.role === 'system');

      return {
        contents: contents,
        systemInstruction: systemMessage ? { parts: [{ text: systemMessage.content }] } : undefined,
        generationConfig: {
          temperature: temperature,
          maxOutputTokens: 2000,
        },
      };
    } else {
      return {
        model: this.config.model,
        messages: messages,
        temperature: temperature,
        max_tokens: 2000,
      };
    }
  }

  private parseResponse(data: any): string {
    if (this.config.provider === 'anthropic') {
      return data.content[0].text;
    } else if (this.config.provider === 'google') {
      return data.candidates[0].content.parts[0].text;
    } else {
      return data.choices[0].message.content;
    }
  }

  async callAI(messages: ChatMessage[], temperature = 0.7): Promise<string> {
    if (!this.config.apiKey) {
      const errorMsg = isEnglish()
        ? 'API Key not configured. Please configure it in settings.'
        : 'API Key 未配置，请先在设置中配置';
      throw new Error(errorMsg);
    }

    try {
      let endpoint = this.getApiEndpoint();

      if (this.config.provider === 'google') {
        endpoint = `${endpoint}/${this.config.model}:generateContent?key=${this.config.apiKey}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(this.buildRequestBody(messages, temperature)),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const eng = isEnglish();
        if (response.status === 401 || response.status === 403) {
          throw new Error(eng ? 'Invalid API Key. Please check your configuration.' : 'API Key 无效，请检查配置');
        } else if (response.status === 429) {
          throw new Error(eng ? 'API rate limit exceeded. Please try again later.' : 'API 调用频率超限，请稍后重试');
        } else {
          const errorMsg =
            errorData.error?.message || errorData.message || (eng ? `API call failed (${response.status})` : `API 调用失败 (${response.status})`);
          throw new Error(errorMsg);
        }
      }

      const data = await response.json();
      return this.parseResponse(data);
    } catch (error: any) {
      if (error.message?.includes('Failed to fetch')) {
        throw new Error(isEnglish() ? 'Network connection failed. Please check your network settings.' : '网络连接失败，请检查网络设置');
      }
      throw error;
    }
  }

  async checkJsonLd(jsonLdData: any, pageUrl = ''): Promise<string> {
    const eng = isEnglish();

    const systemPrompt = eng
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

    const userPrompt = eng
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

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    return await this.callAI(messages, 0.3);
  }

  async suggestJsonLd(pageInfo: { url?: string; title?: string; description?: string; existingJsonLd?: any[] }): Promise<string> {
    const eng = isEnglish();

    const systemPrompt = eng
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

    let userPrompt = eng
      ? `Please suggest JSON-LD structured data for the following webpage:

Page URL: ${pageInfo.url || 'Not provided'}
Page Title: ${pageInfo.title || 'Not provided'}`
      : `请为以下网页建议 JSON-LD 结构化数据：

页面 URL: ${pageInfo.url || '未提供'}
页面标题: ${pageInfo.title || '未提供'}`;

    if (pageInfo.description) {
      userPrompt += eng ? `\nPage Description: ${pageInfo.description}` : `\n页面描述: ${pageInfo.description}`;
    }

    if (pageInfo.existingJsonLd && pageInfo.existingJsonLd.length > 0) {
      userPrompt += eng
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
      userPrompt += eng ? `

The page currently has no JSON-LD data.` : `

当前页面没有 JSON-LD 数据。`;
    }

    userPrompt += eng
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

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    return await this.callAI(messages, 0.5);
  }

  extractJsonLdCode(markdownText: string): string[] {
    const codeBlockRegex = /```(?:json)?\s*\n([\s\S]*?)\n```/g;
    const matches: string[] = [];
    let match;

    while ((match = codeBlockRegex.exec(markdownText)) !== null) {
      try {
        const code = match[1].trim();
        JSON.parse(code);
        matches.push(code);
      } catch {
        // Skip invalid JSON blocks
      }
    }

    return matches;
  }
}

// Singleton instance
export const aiService = new AIService();
