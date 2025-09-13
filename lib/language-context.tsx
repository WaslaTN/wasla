'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { type Language, type TranslationKey, translations, languages } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(languages[0]); // Default to English

  // Load language from localStorage on mount
  useEffect(() => {
    const storedLanguage = localStorage.getItem('language') as Language['code'];
    if (storedLanguage && languages.find(lang => lang.code === storedLanguage)) {
      const lang = languages.find(lang => lang.code === storedLanguage)!;
      setLanguageState(lang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang.code);
  };

  const t = (key: TranslationKey): string => {
    return translations[language.code][key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
