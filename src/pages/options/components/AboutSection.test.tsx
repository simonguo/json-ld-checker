import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import en from '@/lib/i18n/en';
import { ISSUES_URL, PRIVACY_URL, PROJECT_URL } from '@/config/project';
import { AboutSection } from './AboutSection';

const t = (key: string) => (en as Record<string, string>)[key] || key;

afterEach(cleanup);

describe('AboutSection', () => {
  it('links to the open-source repository and its issue tracker', () => {
    render(<AboutSection version="2.3.2" language="en" t={t} />);

    expect(screen.getByRole('link', { name: /GitHub/i })).toHaveAttribute(
      'href',
      PROJECT_URL,
    );
    expect(screen.getByRole('link', { name: /Report Bug/i })).toHaveAttribute(
      'href',
      ISSUES_URL,
    );
    expect(screen.getByRole('link', { name: /Privacy Notice/i })).toHaveAttribute(
      'href',
      PRIVACY_URL,
    );
  });
});
