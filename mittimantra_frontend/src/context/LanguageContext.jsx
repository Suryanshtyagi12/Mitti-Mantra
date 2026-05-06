import React, { createContext, useContext, useState, useCallback } from 'react';
import enTranslations from '../i18n/en.json';
import hiTranslations from '../i18n/hi.json';

const translations = { en: enTranslations, hi: hiTranslations };

const LanguageContext = createContext(null);

/**
 * useLanguage — consume global language state from any component.
 *
 * Returns { language, setLanguage, t, isHindi }
 *   language   → 'en' | 'hi'
 *   setLanguage → (lang) => void  — persists to localStorage
 *   t          → (dotKey) => string  — nested key e.g. "nav.home"
 *   isHindi    → boolean shorthand
 */
export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem('mittimantra_language') || 'en';
    } catch {
      return 'en';
    }
  });

  /** Persist and broadcast language change */
  const setLanguage = useCallback((lang) => {
    try {
      localStorage.setItem('mittimantra_language', lang);
    } catch {
      // localStorage blocked (private mode, etc.) — still update state
    }
    setLanguageState(lang);
  }, []);

  /**
   * t(dotKey) — resolve a nested translation key.
   * e.g. t("nav.home") → "होम" (in Hindi)
   *
   * Falls back to English, then to the raw key if not found.
   */
  const t = useCallback((dotKey) => {
    if (!dotKey) return '';
    const dict = translations[language] || translations.en;
    const fallback = translations.en;

    const resolve = (obj, keys) => {
      if (!obj || !keys.length) return undefined;
      const [head, ...rest] = keys;
      return rest.length ? resolve(obj[head], rest) : obj[head];
    };

    const keys = dotKey.split('.');
    const result = resolve(dict, keys) ?? resolve(fallback, keys) ?? dotKey;
    return typeof result === 'string' ? result : dotKey;
  }, [language]);

  const value = {
    language,
    setLanguage,
    t,
    isHindi: language === 'hi',
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
