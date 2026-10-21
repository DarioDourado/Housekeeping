'use client';

import { useState, useEffect, useCallback } from 'react';
import { Language, translate } from '../../lang/i18n';

const LANG_KEY = 'vvp_hk_lang';

export const useI18n = () => {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LANG_KEY) as Language;
      if (saved === 'pt' || saved === 'en') return saved;
    }
    return 'pt';
  });

  const setLanguage = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem(LANG_KEY, newLang);
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    return translate(lang, key, params);
  }, [lang]);

  return {
    lang,
    setLanguage,
    t
  };
};
