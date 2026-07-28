import { Field, controlClassName } from '@/components/ui';
import { SettingsSection, type Translator } from './SettingsSection';

export function GeneralSection({
  language,
  autoDetection,
  autoDetectionChanging,
  autoDetectionError,
  onLanguageChange,
  onAutoDetectionChange,
  t,
}: {
  language: string;
  autoDetection: boolean;
  autoDetectionChanging: boolean;
  autoDetectionError: string | null;
  onLanguageChange: (language: string) => void;
  onAutoDetectionChange: (enabled: boolean) => void;
  t: Translator;
}) {
  return (
    <SettingsSection title={t('general')} description={t('generalSettingsDescription')}>
      <div className="max-w-lg space-y-5">
        <Field label={t('interfaceLanguage')} hint={t('interfaceLanguageHelper')}>
          <select
            aria-label={t('interfaceLanguage')}
            value={language}
            onChange={(event) => onLanguageChange(event.target.value)}
            className={controlClassName}
          >
            <option value="auto">{t('autoDetect')}</option>
            <option value="en">{t('english')}</option>
            <option value="zh-CN">{t('chinese')}</option>
          </select>
        </Field>

        <div className="border-t border-border pt-5">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={autoDetection}
              disabled={autoDetectionChanging}
              onChange={(event) => onAutoDetectionChange(event.target.checked)}
              className="mt-1 h-4 w-4 accent-accent-600"
            />
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-ink">
                {t('automaticDetection')}
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted">
                {t('automaticDetectionDescription')}
              </span>
              <span className="mt-1 block text-[11px] leading-4 text-muted">
                {autoDetection
                  ? t('automaticDetectionEnabled')
                  : t('automaticDetectionDisabled')}
              </span>
              {autoDetectionError && (
                <span role="alert" className="mt-1 block text-[11px] text-danger-600">
                  {t(autoDetectionError)}
                </span>
              )}
            </span>
          </label>
        </div>
      </div>
    </SettingsSection>
  );
}
