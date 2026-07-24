import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import en from '@/lib/i18n/en';
import { AiProviderSection } from './AiProviderSection';
import type { SettingsState } from '../hooks/useSettings';

const t = (key: string) => (en as Record<string, string>)[key] || key;

const settings: SettingsState = {
  provider: 'openai',
  model: 'gpt-4o',
  apiKey: '',
  endpoint: 'https://api.openai.com/v1/chat/completions',
  azureEndpoint: '',
  azureDeployment: '',
  language: 'en',
};

afterEach(cleanup);

describe('AiProviderSection', () => {
  it('shows provider fields and confirms destructive clearing', () => {
    const view = render(
      <AiProviderSection
        settings={settings}
        models={[{ id: 'gpt-4o', name: 'GPT-4o' }]}
        isOllama={false}
        showEndpoint
        showAzure={false}
        fetchingModels={false}
        ollamaError={null}
        saving={false}
        testing={false}
        onUpdate={vi.fn()}
        onProviderChange={vi.fn()}
        onRefreshModels={vi.fn()}
        onSave={vi.fn()}
        onTest={vi.fn()}
        onClear={vi.fn()}
        t={t}
      />,
    );

    expect(screen.getByLabelText('API Key')).toHaveAttribute('type', 'password');
    expect(view.container.querySelector('optgroup[label="China providers"]')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show API Key' }));
    expect(screen.getByLabelText('API Key')).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByRole('button', { name: 'Clear Configuration' }));
    expect(screen.getByText('Clear AI configuration?')).toBeInTheDocument();
  });

  it('uses a free-form model input for custom endpoints', () => {
    const onUpdate = vi.fn();
    const view = render(
      <AiProviderSection
        settings={{
          ...settings,
          provider: 'custom',
          model: 'private/model-v2',
          endpoint: 'https://llm.example.com/v1/chat/completions',
        }}
        models={[]}
        isOllama={false}
        showEndpoint
        showAzure={false}
        fetchingModels={false}
        ollamaError={null}
        saving={false}
        testing={false}
        onUpdate={onUpdate}
        onProviderChange={vi.fn()}
        onRefreshModels={vi.fn()}
        onSave={vi.fn()}
        onTest={vi.fn()}
        onClear={vi.fn()}
        t={t}
      />,
    );

    const modelInput = view.getByLabelText('Model');
    expect(modelInput).toHaveAttribute('type', 'text');
    expect(modelInput).toHaveValue('private/model-v2');

    fireEvent.change(modelInput, { target: { value: 'private/model-v3' } });
    expect(onUpdate).toHaveBeenCalledWith('model', 'private/model-v3');
    expect(view.queryByRole('link', { name: 'Get API Key' })).not.toBeInTheDocument();
  });
});
