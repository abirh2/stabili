import React from 'react';

interface StabiliLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  textColor?: string;
  iconOnly?: boolean;
}

export const StabiliLogo: React.FC<StabiliLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  textColor = 'text-slate-900',
  iconOnly = false,
}) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
  };

  const textSizes = {
    sm: 'text-lg tracking-tight font-bold',
    md: 'text-2xl tracking-tight font-bold',
    lg: 'text-3xl tracking-tight font-bold',
  };

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Precision Geometric Stabili Architectural Building Logo */}
      <svg
        className={`${iconSizes[size]} text-teal-600 flex-shrink-0`}
        viewBox="0 0 100 100"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Stabili icon"
      >
        {/* Top penthouse blocks */}
        <rect x="40" y="8" width="20" height="8" rx="1.5" />
        
        {/* Upper middle block */}
        <rect x="28" y="20" width="32" height="8" rx="1.5" />
        
        {/* Middle geometric S structure */}
        <rect x="28" y="32" width="10" height="8" rx="1.5" />
        <rect x="42" y="32" width="30" height="8" rx="1.5" />
        
        <rect x="28" y="44" width="10" height="8" rx="1.5" />
        <path d="M42 44 H72 V52 H48 V60 H72 V68 H28 V60 H66 V52 H42 Z" />

        {/* Lower blocks */}
        <rect x="28" y="72" width="44" height="8" rx="1.5" />
        
        {/* Ground foundation beam */}
        <rect x="20" y="84" width="60" height="6" rx="2" />
      </svg>

      {showText && !iconOnly && (
        <span className={`${textSizes[size]} ${textColor} tracking-tight font-bold font-sans`}>
          <span className="text-teal-600">S</span>tabili
        </span>
      )}
    </div>
  );
};
