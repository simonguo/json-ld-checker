export type ProviderKey =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'azure'
  | 'deepseek'
  | 'qwen'
  | 'kimi'
  | 'zhipu'
  | 'minimax'
  | 'openrouter'
  | 'ollama'
  | 'custom';

export type ProviderGroup = 'global' | 'china' | 'runtime';

export interface AIModel {
  id: string;
  name: string;
}

export interface AIProvider {
  name: string;
  group: ProviderGroup;
  models: AIModel[];
  apiKeyPrefix?: string;
  endpoint?: string;
}

export const AI_PROVIDERS: Record<ProviderKey, AIProvider> = {
  openai: {
    name: 'OpenAI',
    group: 'global',
    apiKeyPrefix: 'sk-',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    models: [
      { id: 'gpt-5.6-terra', name: 'GPT-5.6 Terra' },
      { id: 'gpt-5.6-sol', name: 'GPT-5.6 Sol' },
      { id: 'gpt-5.6-luna', name: 'GPT-5.6 Luna' },
    ],
  },
  anthropic: {
    name: 'Anthropic',
    group: 'global',
    apiKeyPrefix: 'sk-ant-',
    endpoint: 'https://api.anthropic.com/v1/messages',
    models: [
      { id: 'claude-sonnet-5', name: 'Claude Sonnet 5' },
      { id: 'claude-opus-4-8', name: 'Claude Opus 4.8' },
      { id: 'claude-fable-5', name: 'Claude Fable 5' },
      { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5' },
    ],
  },
  google: {
    name: 'Google Gemini',
    group: 'global',
    apiKeyPrefix: 'AIza',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    models: [
      { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash' },
      { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (Preview)' },
      { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash-Lite' },
    ],
  },
  azure: {
    name: 'Azure OpenAI',
    group: 'global',
    models: [
      { id: 'gpt-5.6-terra', name: 'GPT-5.6 Terra' },
      { id: 'gpt-5.6-sol', name: 'GPT-5.6 Sol' },
      { id: 'gpt-5.6-luna', name: 'GPT-5.6 Luna' },
    ],
  },
  deepseek: {
    name: 'DeepSeek',
    group: 'china',
    apiKeyPrefix: 'sk-',
    endpoint: 'https://api.deepseek.com/chat/completions',
    models: [
      { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro' },
      { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash' },
    ],
  },
  qwen: {
    name: 'Alibaba Cloud Qwen (百炼)',
    group: 'china',
    apiKeyPrefix: 'sk-',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    models: [
      { id: 'qwen3.7-plus', name: 'Qwen 3.7 Plus' },
      { id: 'qwen3.7-max', name: 'Qwen 3.7 Max' },
      { id: 'qwen3.6-flash', name: 'Qwen 3.6 Flash' },
    ],
  },
  kimi: {
    name: 'Moonshot Kimi (月之暗面)',
    group: 'china',
    apiKeyPrefix: 'sk-',
    endpoint: 'https://api.moonshot.cn/v1/chat/completions',
    models: [
      { id: 'kimi-k3', name: 'Kimi K3' },
      { id: 'kimi-k2.7-code', name: 'Kimi K2.7 Code' },
      { id: 'kimi-k2.6', name: 'Kimi K2.6' },
    ],
  },
  zhipu: {
    name: 'Zhipu GLM (智谱)',
    group: 'china',
    endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    models: [
      { id: 'glm-5.2', name: 'GLM-5.2' },
      { id: 'glm-5-turbo', name: 'GLM-5 Turbo' },
      { id: 'glm-4.7-flashx', name: 'GLM-4.7 FlashX' },
    ],
  },
  minimax: {
    name: 'MiniMax',
    group: 'china',
    apiKeyPrefix: 'sk-',
    endpoint: 'https://api.minimaxi.com/v1/chat/completions',
    models: [
      { id: 'MiniMax-M3', name: 'MiniMax M3' },
      { id: 'MiniMax-M2.7-highspeed', name: 'MiniMax M2.7 Highspeed' },
    ],
  },
  openrouter: {
    name: 'OpenRouter',
    group: 'global',
    apiKeyPrefix: 'sk-or-',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    models: [
      { id: 'openai/gpt-5.6-terra', name: 'GPT-5.6 Terra' },
      { id: 'openai/gpt-5.6-sol', name: 'GPT-5.6 Sol' },
      { id: 'openai/gpt-5.6-luna', name: 'GPT-5.6 Luna' },
      { id: 'anthropic/claude-sonnet-5', name: 'Claude Sonnet 5' },
      { id: 'anthropic/claude-opus-4.8', name: 'Claude Opus 4.8' },
      { id: 'anthropic/claude-fable-5', name: 'Claude Fable 5' },
      { id: 'anthropic/claude-haiku-4.5', name: 'Claude Haiku 4.5' },
      { id: 'google/gemini-3.6-flash', name: 'Gemini 3.6 Flash' },
      { id: 'google/gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (Preview)' },
      { id: 'google/gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash-Lite' },
      { id: 'moonshotai/kimi-k3', name: 'Kimi K3' },
      { id: 'meta/muse-spark-1.1', name: 'Meta Muse Spark 1.1' },
    ],
  },
  ollama: {
    name: 'Ollama (Local)',
    group: 'runtime',
    endpoint: 'http://localhost:11434/v1/chat/completions',
    models: [],
  },
  custom: {
    name: 'Custom Endpoint',
    group: 'runtime',
    models: [],
  },
};

export const getProviderApiKeyLink = (provider: ProviderKey): string => {
  const links: Record<ProviderKey, string> = {
    openai: 'https://platform.openai.com/api-keys',
    anthropic: 'https://console.anthropic.com/settings/keys',
    google: 'https://aistudio.google.com/app/apikey',
    azure: 'https://portal.azure.com/',
    deepseek: 'https://platform.deepseek.com/api_keys',
    qwen: 'https://bailian.console.aliyun.com/',
    kimi: 'https://platform.kimi.com/console/api-keys',
    zhipu: 'https://open.bigmodel.cn/usercenter/apikeys',
    minimax: 'https://platform.minimaxi.com/user-center/basic-information/interface-key',
    openrouter: 'https://openrouter.ai/keys',
    ollama: 'https://ollama.com/library',
    custom: '#',
  };
  return links[provider] || '#';
};
