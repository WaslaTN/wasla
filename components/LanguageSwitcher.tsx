'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { languages } from '@/lib/i18n';
import { Globe, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  const [isAutoDetected, setIsAutoDetected] = useState(false);

  useEffect(() => {
    // Check if the current language was auto-detected
    const savedLanguage = localStorage.getItem("language");
    const browserLanguage = navigator.language || navigator.languages?.[0] || 'en';
    
    // If the saved language matches the browser language, it was likely auto-detected
    if (savedLanguage === language.code) {
      const isDetected = (language.code === 'fr' && browserLanguage.toLowerCase().startsWith('fr')) ||
                         (language.code === 'en' && browserLanguage.toLowerCase().startsWith('en'));
      setIsAutoDetected(isDetected);
    } else {
      setIsAutoDetected(false);
    }
  }, [language.code]);

  return (
    <TooltipProvider>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="bg-black/20 border-red-500/30 hover:bg-red-500/10 hover:border-red-400/50 text-white backdrop-blur-sm relative"
              >
                <Globe className="h-4 w-4 mr-2" />
                <span className="mr-1">{language.flag}</span>
                <span className="hidden sm:inline">{language.name}</span>
                {isAutoDetected && (
                  <Sparkles className="h-3 w-3 ml-1 text-yellow-400" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isAutoDetected ? 'Auto-detected language' : 'Click to change language'}</p>
            </TooltipContent>
          </Tooltip>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="bg-black/90 border-red-500/30 backdrop-blur-md"
        >
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLanguage(lang)}
              className={`cursor-pointer hover:bg-red-500/20 text-white ${
                language.code === lang.code ? 'bg-red-500/30' : ''
              }`}
            >
              <span className="mr-2">{lang.flag}</span>
              {lang.name}
              {language.code === lang.code && isAutoDetected && (
                <Sparkles className="h-3 w-3 ml-2 text-yellow-400" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}