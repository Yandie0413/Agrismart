import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: require('./locales/fr/translation.json') },
      en: { translation: require('./locales/en/translation.json') },
      mg: { translation: require('./locales/mg/translation.json') },
    },
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
  });