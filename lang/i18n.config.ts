import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import pt from './pt.json';
import en from './en.json';

// - leitores de ecrã escolhem a pronúncia pelo lang do documento: acompanha sempre o idioma ativo
i18n.on('languageChanged', language => { document.documentElement.lang = language.split('-')[0] ?? 'pt'; });

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: pt },
      en: { translation: en },
    },
    fallbackLng: 'pt',
    supportedLngs: ['pt', 'en'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'vvp_hk_lang',
    },
    // - React já escapa o output
    interpolation: { escapeValue: false },
  });

export { i18n };
