import React from 'react';

interface WaslaLogoProps {
  size?: number;
  showText?: boolean;
  textSize?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'simple' | 'with-text' | 'main' | 'main-bg';
}

export const WaslaLogo: React.FC<WaslaLogoProps> = ({
  size = 48,
  showText = false,
  textSize = 'md',
  className = '',
  variant = 'simple',
}) => {
  const getLogoUrl = () => {
    switch (variant) {
      case 'with-text':
        return '/wasla-logo-with-text.png';
      case 'main':
        return '/wasla-main-logo.png';
      case 'main-bg':
        return '/wasla-main-logo-bg.png';
      case 'simple':
      default:
        return '/wasla-logo-simple.png';
    }
  };

  const textClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img
        src={getLogoUrl()}
        alt="Wasla Logo"
        style={{ width: size, height: size }}
        className="object-contain"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            parent.innerHTML = `<div class="w-${Math.floor(size/8)} h-${Math.floor(size/8)} bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-${Math.floor(size/12)}xl">W</span>
            </div>`;
          }
        }}
      />
      {showText && (
        <span className={`ml-2 font-bold text-white ${textClasses[textSize]}`}>
          Wasla
        </span>
      )}
    </div>
  );
};
