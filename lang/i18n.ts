'use client';

import pt from './pt.json';
import en from './en.json';

export type Language = 'pt' | 'en';

const translations: Record<Language, any> = {
  pt,
  en
};

export function getNestedTranslation(obj: any, path: string): string {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return path;
    }
  }
  return typeof current === 'string' ? current : path;
}

export function translate(lang: Language, key: string, params?: Record<string, string | number>): string {
  const dict = translations[lang] || translations.pt;
  let str = getNestedTranslation(dict, key);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      str = str.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
    });
  }
  return str;
}
