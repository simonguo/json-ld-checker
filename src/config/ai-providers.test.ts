import { describe, expect, it } from 'vitest';
import { AI_PROVIDERS } from './ai-providers';

const modelIds = (provider: keyof typeof AI_PROVIDERS) =>
  AI_PROVIDERS[provider].models.map((model) => model.id);

describe('AI_PROVIDERS', () => {
  it('offers the current OpenAI and Azure GPT-5.6 families', () => {
    expect(modelIds('openai')).toEqual([
      'gpt-5.6-terra',
      'gpt-5.6-sol',
      'gpt-5.6-luna',
    ]);
    expect(modelIds('azure')).toEqual(modelIds('openai'));
  });

  it('offers current Anthropic and Google model families without retired models', () => {
    expect(modelIds('anthropic')).toEqual([
      'claude-sonnet-5',
      'claude-opus-4-8',
      'claude-fable-5',
      'claude-haiku-4-5',
    ]);
    expect(modelIds('google')).toEqual([
      'gemini-3.6-flash',
      'gemini-3.1-pro-preview',
      'gemini-3.5-flash-lite',
    ]);

    const allBuiltInModels = [
      ...modelIds('openai'),
      ...modelIds('anthropic'),
      ...modelIds('google'),
    ];
    expect(allBuiltInModels).not.toContain('gpt-4o');
    expect(allBuiltInModels).not.toContain('claude-3-5-sonnet-20241022');
    expect(allBuiltInModels).not.toContain('gemini-3.1-flash-lite-preview');
  });

  it('keeps OpenRouter presets aligned with the latest provider models', () => {
    expect(modelIds('openrouter')).toEqual([
      'openai/gpt-5.6-terra',
      'openai/gpt-5.6-sol',
      'openai/gpt-5.6-luna',
      'anthropic/claude-sonnet-5',
      'anthropic/claude-opus-4.8',
      'anthropic/claude-fable-5',
      'anthropic/claude-haiku-4.5',
      'google/gemini-3.6-flash',
      'google/gemini-3.1-pro-preview',
      'google/gemini-3.5-flash-lite',
      'moonshotai/kimi-k3',
      'meta/muse-spark-1.1',
    ]);
  });

  it('includes current OpenAI-compatible Chinese providers', () => {
    expect(modelIds('deepseek')).toEqual([
      'deepseek-v4-pro',
      'deepseek-v4-flash',
    ]);
    expect(modelIds('qwen')).toEqual([
      'qwen3.7-plus',
      'qwen3.7-max',
      'qwen3.6-flash',
    ]);
    expect(modelIds('kimi')).toEqual([
      'kimi-k3',
      'kimi-k2.7-code',
      'kimi-k2.6',
    ]);
    expect(modelIds('zhipu')).toEqual([
      'glm-5.2',
      'glm-5-turbo',
      'glm-4.7-flashx',
    ]);
    expect(modelIds('minimax')).toEqual([
      'MiniMax-M3',
      'MiniMax-M2.7-highspeed',
    ]);

    for (const provider of ['deepseek', 'qwen', 'kimi', 'zhipu', 'minimax'] as const) {
      expect(AI_PROVIDERS[provider].group).toBe('china');
      expect(AI_PROVIDERS[provider].endpoint).toMatch(/^https:\/\//);
    }
  });

  it('leaves custom model selection open-ended', () => {
    expect(modelIds('custom')).toEqual([]);
    expect(AI_PROVIDERS.custom.group).toBe('runtime');
  });
});
