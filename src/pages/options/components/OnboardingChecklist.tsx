import { X } from 'lucide-react';
import { IconButton } from '@/components/ui';
import type { Translator } from './SettingsSection';

export function OnboardingChecklist({
  onDismiss,
  t,
}: {
  onDismiss: () => void;
  t: Translator;
}) {
  const steps = [t('onboardStep1'), t('onboardStep2'), t('onboardStep3'), t('onboardStep4')];

  return (
    <section className="rounded-tool border border-accent-100 bg-surface">
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-ink">{t('setupChecklist')}</h2>
          <p className="mt-1 text-xs text-muted">{t('setupChecklistDescription')}</p>
        </div>
        <IconButton label={t('dismiss')} onClick={onDismiss}>
          <X size={15} />
        </IconButton>
      </div>
      <ol className="grid gap-px border-t border-border bg-border sm:grid-cols-2">
        {steps.map((step, index) => (
          <li key={step} className="flex items-start gap-2 bg-surface px-4 py-3 text-xs text-muted">
            <span className="flex h-5 w-5 flex-none items-center justify-center rounded border border-border bg-gray-50 text-[10px] font-semibold text-ink">
              {index + 1}
            </span>
            <span className="leading-5">{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
