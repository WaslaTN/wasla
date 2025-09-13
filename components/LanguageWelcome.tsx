"use client"

import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { Button } from '@/components/ui/button'
import { X, Globe, Sparkles } from 'lucide-react'

export function LanguageWelcome() {
  const { language, t } = useLanguage()
  const [showWelcome, setShowWelcome] = useState(false)
  const [isAutoDetected, setIsAutoDetected] = useState(false)

  useEffect(() => {
    // Check if this is the first visit and language was auto-detected
    const hasSeenWelcome = localStorage.getItem('languageWelcomeShown')
    const savedLanguage = localStorage.getItem('language')
    const browserLanguage = navigator.language || navigator.languages?.[0] || 'en'
    
    if (!hasSeenWelcome && savedLanguage === language.code) {
      const isDetected = (language.code === 'fr' && browserLanguage.toLowerCase().startsWith('fr')) ||
                         (language.code === 'en' && browserLanguage.toLowerCase().startsWith('en'))
      
      if (isDetected) {
        setIsAutoDetected(true)
        setShowWelcome(true)
        localStorage.setItem('languageWelcomeShown', 'true')
      }
    }
  }, [language.code])

  if (!showWelcome) return null

  const welcomeMessages = {
    en: {
      title: 'Welcome! 🌍',
      message: `We've automatically detected that you prefer ${language.name}. You can change this anytime using the language switcher.`,
      button: 'Got it!'
    },
    fr: {
      title: 'Bienvenue ! 🌍',
      message: `Nous avons automatiquement détecté que vous préférez ${language.name}. Vous pouvez changer cela à tout moment en utilisant le sélecteur de langue.`,
      button: 'Compris !'
    }
  }

  const currentWelcome = welcomeMessages[language.code as keyof typeof welcomeMessages] || welcomeMessages.en

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-sm">
      <div className="bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-md border border-blue-500/30 rounded-lg p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center border border-blue-400/30">
              <Globe className="w-5 h-5 text-blue-300" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-white font-semibold text-sm">{currentWelcome.title}</h3>
              {isAutoDetected && (
                <Sparkles className="w-4 h-4 text-yellow-300" />
              )}
            </div>
            <p className="text-blue-100 text-sm leading-relaxed mb-3">
              {currentWelcome.message}
            </p>
            <Button
              onClick={() => setShowWelcome(false)}
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              {currentWelcome.button}
            </Button>
          </div>
          
          <Button
            onClick={() => setShowWelcome(false)}
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white hover:bg-white/10 p-1 h-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
} 