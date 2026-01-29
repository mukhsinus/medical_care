import React, { createContext, useContext, useState, useEffect } from 'react';
import enTranslations from '@/locales/en.json';
import ruTranslations from '@/locales/ru.json';
import uzTranslations from '@/locales/uz.json';

export type Locale = 'en' | 'ru' | 'uz';

type Translations = typeof enTranslations;

const translations: Record<Locale, Translations> = {
  en: enTranslations,
  ru: ruTranslations,
  uz: uzTranslations,
};

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/ru')) return 'ru';
    if (path.startsWith('/en')) return 'en';
    return 'uz';
  });

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    
    const currentPath = window.location.pathname;
    const pathWithoutLocale = currentPath.replace(/^\/(en|ru|uz)/, '') || '/';
    const newPath = `/${newLocale}${pathWithoutLocale}`;
    
    window.history.pushState({}, '', newPath);
  };

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value: LanguageContextType = {
    locale,
    setLocale,
    t: translations[locale],
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
