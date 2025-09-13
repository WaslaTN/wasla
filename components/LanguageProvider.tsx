"use client"

import type React from "react"
import { createContext, useState, useEffect } from "react"
import { type Language, type TranslationKey, translations, languages } from '@/lib/i18n'

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: TranslationKey) => string
  testLanguageDetection: () => void
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(languages[0])

  useEffect(() => {
    // Function to detect user's preferred language
    const detectUserLanguage = (): Language => {
      // First, check if user has a saved preference
      const savedLanguage = localStorage.getItem("language")
      if (savedLanguage) {
        const found = languages.find((lang) => lang.code === savedLanguage)
        if (found) {
          console.log(`🌍 Using saved language preference: ${found.name} (${found.code})`)
          return found
        }
      }

      // If no saved preference, detect from browser language
      const browserLanguage = navigator.language || navigator.languages?.[0] || 'en'
      console.log(`🌍 Browser language detected: ${browserLanguage}`)
      console.log(`🌍 All browser languages:`, navigator.languages)
      
      // Enhanced language detection
      let detectedCode = 'en' // default fallback
      
      // Check for French variations
      if (browserLanguage.toLowerCase().startsWith('fr') || 
          browserLanguage.toLowerCase().startsWith('fr-') ||
          browserLanguage.toLowerCase().startsWith('fr_')) {
        detectedCode = 'fr'
        console.log(`🌍 French language detected from: ${browserLanguage}`)
      }
      // Check for English variations
      else if (browserLanguage.toLowerCase().startsWith('en') || 
               browserLanguage.toLowerCase().startsWith('en-') ||
               browserLanguage.toLowerCase().startsWith('en_')) {
        detectedCode = 'en'
        console.log(`🌍 English language detected from: ${browserLanguage}`)
      }
      // Check for Arabic (Tunisia) - could be useful for future RTL support
      else if (browserLanguage.toLowerCase().startsWith('ar') || 
               browserLanguage.toLowerCase().startsWith('ar-') ||
               browserLanguage.toLowerCase().startsWith('ar_')) {
        // For now, default to French for Arabic speakers in Tunisia
        detectedCode = 'fr'
        console.log(`🌍 Arabic language detected, defaulting to French for Tunisia`)
      }
      // Check for other languages - default to English
      else {
        detectedCode = 'en'
        console.log(`🌍 Unknown language: ${browserLanguage}, defaulting to English`)
      }
      
      // Find the detected language in our supported languages
      const detectedLanguage = languages.find((lang) => lang.code === detectedCode)
      
      // Save the detected language to localStorage for future use
      if (detectedLanguage) {
        localStorage.setItem("language", detectedLanguage.code)
        console.log(`🌍 Auto-detected language: ${detectedLanguage.name} (${detectedLanguage.code}) from browser: ${browserLanguage}`)
        return detectedLanguage
      }

      // Fallback to English if detection fails
      console.log(`🌍 Language detection failed, falling back to: ${languages[0].name}`)
      return languages[0]
    }

    // Set the detected language
    const detectedLang = detectUserLanguage()
    setLanguage(detectedLang)
  }, [])

  const handleSetLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage)
    localStorage.setItem("language", newLanguage.code)
    console.log(`🌍 Language changed to: ${newLanguage.name} (${newLanguage.code})`)
  }

  const t = (key: TranslationKey): string => {
    return translations[language.code]?.[key] || translations.en[key] || key
  }

  // Function to test language detection (useful for debugging)
  const testLanguageDetection = () => {
    console.log('🧪 Testing Language Detection...')
    console.log('Current language:', language)
    console.log('Browser language:', navigator.language)
    console.log('All browser languages:', navigator.languages)
    console.log('Saved language:', localStorage.getItem('language'))
    console.log('Available languages:', languages)
  }

  // Expose test function globally for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).testLanguageDetection = testLanguageDetection
      console.log('🧪 Language detection test function available globally. Use testLanguageDetection() in console.')
    }
  }, [testLanguageDetection])

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t, testLanguageDetection }}>
      {children}
    </LanguageContext.Provider>
  )
}
