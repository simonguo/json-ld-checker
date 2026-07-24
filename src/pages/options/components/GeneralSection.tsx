import { Field, controlClassName } from '@/components/ui';
import { SettingsSection, type Translator } from './SettingsSection';

export function GeneralSection({
  language,
  onLanguageChange,
  t,
}: {
  language: string;
  onLanguageChange: (language: string) => void;
  t: Translator;
}) {
  return (
    <SettingsSection title={t('general')} description={t('generalSettingsDescription')}>
      <div className="max-w-lg">
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
      </div>
    </SettingsSection>
  );
}
