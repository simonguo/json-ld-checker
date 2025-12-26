import { useEffect, useMemo, useState } from 'react';
import en from './en';
import zhCN from './zh-CN';

export type SupportedLanguage = 'en' | 'zh-CN';

const translations: Record<SupportedLanguage, Record<string, any>> = {
  en,
  'zh-CN': zhCN
};

const normalizeLanguage = (value?: string): SupportedLanguage => {
  if (!value || value === 'auto') {
    const navLang = typeof navigator !== 'undefined' ? navigator.language : 'en';
    return navLang.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
  }
  if (value.toLowerCase().startsWith('zh')) return 'zh-CN';
  return 'en';
};

const translateInternal = (key: string, lang: SupportedLanguage, params?: Record<string, string | number>): string => {
  const parts = key.split('.');
  let node: any = translations[lang];

  for (const part of parts) {
    node = node?.[part];
    if (node === undefined || node === null) break;
  }

  let result: string;
  if (typeof node === 'string') {
    result = node;
  } else {
    // fallback to English
    let fallback: any = translations.en;
    for (const part of parts) {
      fallback = fallback?.[part];
      if (fallback === undefined || fallback === null) break;
    }
    result = typeof fallback === 'string' ? fallback : key;
  }

  // Replace placeholders like {count}, {index}, etc.
  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
    });
  }

  return result;
};

export const translate = (key: string, lang?: SupportedLanguage, userLanguage?: string, params?: Record<string, string | number>) => {
  const resolved = lang || normalizeLanguage(userLanguage);
  return translateInternal(key, resolved, params);
};

export function useI18n(userLanguage?: string) {
  const [lang, setLang] = useState<SupportedLanguage>(normalizeLanguage(userLanguage));

  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      setLang(normalizeLanguage(userLanguage));
      return;
    }

    const updateFromStorage = () => {
      chrome.storage.local.get(['user_language'], (result) => {
        setLang(normalizeLanguage(result.user_language || userLanguage));
      });
    };

    updateFromStorage();

    const onChanged = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName === 'local' && changes.user_language) {
        setLang(normalizeLanguage(changes.user_language.newValue || userLanguage));
      }
    };

    chrome.storage.onChanged.addListener(onChanged);

    return () => {
      chrome.storage.onChanged.removeListener(onChanged);
    };
  }, [userLanguage]);

  const t = useMemo(
    () => (key: string, params?: Record<string, string | number>) => translateInternal(key, lang, params),
    [lang]
  );

  return { t, lang };
}
