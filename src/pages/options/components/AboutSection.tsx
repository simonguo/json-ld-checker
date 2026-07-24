import { CircleDot, ExternalLink, Github, Mail, ShieldCheck } from 'lucide-react';
import { UpdateNotification } from '@/components/UpdateNotification';
import { ISSUES_URL, PRIVACY_URL, PROJECT_URL } from '@/config/project';
import { SettingsSection, type Translator } from './SettingsSection';

export function AboutSection({
  version,
  language,
  t,
}: {
  version: string;
  language: string;
  t: Translator;
}) {
  return (
    <div className="space-y-4">
      <SettingsSection title={t('updates')} description={t('updatesDescription')}>
        <UpdateNotification language={language} />
      </SettingsSection>

      <SettingsSection title={t('about')} description={t('aboutDescription')}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">JSON-LD Checker</p>
            <p className="mt-1 font-mono text-xs text-muted">v{version}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={PROJECT_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-8 items-center gap-1.5 rounded-tool border border-border bg-surface px-2.5 py-1 text-xs font-medium text-ink hover:bg-gray-50"
            >
              <Github size={14} /> GitHub
            </a>
            <a
              href={ISSUES_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-8 items-center gap-1.5 rounded-tool border border-border bg-surface px-2.5 py-1 text-xs font-medium text-ink hover:bg-gray-50"
            >
              <CircleDot size={14} /> {t('reportBug')}
            </a>
            <a
              href={PRIVACY_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-8 items-center gap-1.5 rounded-tool border border-border bg-surface px-2.5 py-1 text-xs font-medium text-ink hover:bg-gray-50"
            >
              <ShieldCheck size={14} /> {t('privacyNotice')}
            </a>
            <a
              href="mailto:simonguo.2009@gmail.com?subject=JSON-LD%20Checker%20Feedback"
              className="inline-flex min-h-8 items-center gap-1.5 rounded-tool border border-border bg-surface px-2.5 py-1 text-xs font-medium text-ink hover:bg-gray-50"
            >
              <Mail size={14} /> {t('contact')}
            </a>
            <a
              href="https://schema.org"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-8 items-center gap-1.5 rounded-tool border border-border bg-surface px-2.5 py-1 text-xs font-medium text-ink hover:bg-gray-50"
            >
              <ExternalLink size={14} /> Schema.org
            </a>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
