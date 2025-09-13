"use client"

import { useEffect } from 'react'
import { useLanguage } from '@/lib/hooks/useLanguage'

export function LanguageInitializer() {
  const { language } = useLanguage()

  useEffect(() => {
    // Set the HTML lang attribute based on the current language
    document.documentElement.lang = language.code
    
    // Also set the dir attribute if needed (for RTL languages in the future)
    document.documentElement.dir = language.dir
  }, [language])

  return null // This component doesn't render anything
} 