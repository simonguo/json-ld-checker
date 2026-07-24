import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AIService, type AIConfig } from './ai-service';

const userMessage = [{ role: 'user' as const, content: 'Reply with OK.' }];

const successResponse = (payload: unknown) =>
  ({
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(payload),
  }) as unknown as Response;

describe('AIService current model request compatibility', () => {
  let service: AIService;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    service = new AIService();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const configure = async (config: Partial<AIConfig>) => {
    await service.setConfig({
      provider: 'openai',
      model: 'gpt-5.6-terra',
      apiKey: 'test-key',
      ...config,
    });
  };

  it('uses GPT-5.6 completion tokens and omits unsupported sampling parameters', async () => {
    await configure({});
    fetchMock.mockResolvedValue(
      successResponse({ choices: [{ message: { content: 'OK' } }] }),
    );

    await expect(service.callAI(userMessage, 0.3)).resolves.toBe('OK');

    const [, request] = fetchMock.mock.calls[0];
    const body = JSON.parse(request.body);
    expect(body).toMatchObject({
      model: 'gpt-5.6-terra',
      max_completion_tokens: 2000,
    });
    expect(body).not.toHaveProperty('max_tokens');
    expect(body).not.toHaveProperty('temperature');
  });

  it('omits sampling parameters for current Claude models', async () => {
    await configure({ provider: 'anthropic', model: 'claude-fable-5' });
    fetchMock.mockResolvedValue(successResponse({ content: [{ text: 'OK' }] }));

    await expect(service.callAI(userMessage, 0.3)).resolves.toBe('OK');

    const [, request] = fetchMock.mock.calls[0];
    const body = JSON.parse(request.body);
    expect(body).toMatchObject({
      model: 'claude-fable-5',
      max_tokens: 2000,
    });
    expect(body).not.toHaveProperty('temperature');
  });

  it('omits deprecated sampling parameters for current Gemini models', async () => {
    await configure({ provider: 'google', model: 'gemini-3.6-flash' });
    fetchMock.mockResolvedValue(
      successResponse({
        candidates: [{ content: { parts: [{ text: 'OK' }] } }],
      }),
    );

    await expect(service.callAI(userMessage, 0.3)).resolves.toBe('OK');

    const [endpoint, request] = fetchMock.mock.calls[0];
    const body = JSON.parse(request.body);
    expect(endpoint).toContain('/gemini-3.6-flash:generateContent?key=test-key');
    expect(body.generationConfig).toEqual({ maxOutputTokens: 2000 });
  });

  it('uses the Azure v1 endpoint and deployment name in the request body', async () => {
    await configure({
      provider: 'azure',
      model: 'gpt-5.6-sol',
      azureEndpoint: 'https://example.openai.azure.com/',
      azureDeployment: 'production-sol',
    });
    fetchMock.mockResolvedValue(
      successResponse({ choices: [{ message: { content: 'OK' } }] }),
    );

    await expect(service.callAI(userMessage)).resolves.toBe('OK');

    const [endpoint, request] = fetchMock.mock.calls[0];
    const body = JSON.parse(request.body);
    expect(endpoint).toBe(
      'https://example.openai.azure.com/openai/v1/chat/completions',
    );
    expect(body).toMatchObject({
      model: 'production-sol',
      max_completion_tokens: 2000,
    });
    expect(body).not.toHaveProperty('temperature');
  });

  it('uses GPT-5.6 parameters for OpenAI-compatible custom endpoints', async () => {
    await configure({
      provider: 'custom',
      model: 'gpt-5.6-luna',
      endpoint: 'https://llm.example.com/v1/chat/completions',
    });
    fetchMock.mockResolvedValue(
      successResponse({ choices: [{ message: { content: 'OK' } }] }),
    );

    await expect(service.callAI(userMessage)).resolves.toBe('OK');

    const [endpoint, request] = fetchMock.mock.calls[0];
    const body = JSON.parse(request.body);
    expect(endpoint).toBe('https://llm.example.com/v1/chat/completions');
    expect(body).toMatchObject({
      model: 'gpt-5.6-luna',
      max_completion_tokens: 2000,
    });
    expect(body).not.toHaveProperty('temperature');
  });

  it.each([
    {
      provider: 'deepseek' as const,
      model: 'deepseek-v4-pro',
      endpoint: 'https://api.deepseek.com/chat/completions',
      tokenParameter: 'max_tokens',
    },
    {
      provider: 'qwen' as const,
      model: 'qwen3.7-plus',
      endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      tokenParameter: 'max_completion_tokens',
    },
    {
      provider: 'kimi' as const,
      model: 'kimi-k3',
      endpoint: 'https://api.moonshot.cn/v1/chat/completions',
      tokenParameter: 'max_completion_tokens',
    },
    {
      provider: 'zhipu' as const,
      model: 'glm-5.2',
      endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      tokenParameter: 'max_tokens',
    },
    {
      provider: 'minimax' as const,
      model: 'MiniMax-M3',
      endpoint: 'https://api.minimaxi.com/v1/chat/completions',
      tokenParameter: 'max_completion_tokens',
    },
  ])(
    'builds an OpenAI-compatible request for $provider',
    async ({ provider, model, endpoint, tokenParameter }) => {
      await configure({ provider, model });
      fetchMock.mockResolvedValue(
        successResponse({ choices: [{ message: { content: 'OK' } }] }),
      );

      await expect(service.callAI(userMessage)).resolves.toBe('OK');

      const [requestEndpoint, request] = fetchMock.mock.calls[0];
      const body = JSON.parse(request.body);
      expect(requestEndpoint).toBe(endpoint);
      expect(body.model).toBe(model);
      expect(body[tokenParameter]).toBe(2000);
      expect(request.headers).toMatchObject({
        Authorization: 'Bearer test-key',
      });

      if (provider === 'kimi') {
        expect(body).not.toHaveProperty('temperature');
      } else {
        expect(body.temperature).toBe(0.7);
      }
    },
  );

  it('requires both a model and endpoint for a custom provider', async () => {
    await configure({
      provider: 'custom',
      model: '',
      endpoint: '',
    });

    await expect(service.callAI(userMessage)).rejects.toThrow(
      'Model name is required.',
    );

    await configure({
      provider: 'custom',
      model: 'private-model',
      endpoint: '',
    });
    await expect(service.callAI(userMessage)).rejects.toThrow(
      'API endpoint is required for a custom provider.',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
