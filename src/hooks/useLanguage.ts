import { useState, useEffect } from 'react';
import { Language } from '../types';
import { translations } from '../translations';

const LANGUAGE_KEY = 'souktrail_language';

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    if (saved === 'en' || saved === 'fr' || saved === 'ar') return saved;
    
    // Fallback to browser language if supported, else English
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'fr') return 'fr';
    if (browserLang === 'ar') return 'ar';
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_KEY, lang);
  };

  const t = translations[language];

  useEffect(() => {
    // Update document direction and lang attribute for accessibility and RTL rendering
    document.documentElement.lang = language;
    if (language === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, [language]);

  return { language, setLanguage, t };
}
