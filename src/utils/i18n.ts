import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import english from '../utils/languages/en.json';
import romanian from '../utils/languages/ro.json';

const resources = {
  en: {
    translation: english,
  },
  // fr: {
  //   translation: french,
  // },
  // ar: {
  //   translation: arabic,
  // },
  // ch: {
  //   translation: chinese,
  // },
  ro: {
    translation: romanian,
  },
};

// Get stored language preference or default to 'en'
const getStoredLanguage = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('language') || 'en';
  }
  return 'en';
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: getStoredLanguage(),
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
