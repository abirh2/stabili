import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'flat' | 'interactive' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  radius?: 'lg' | 'xl' | '2xl' | '3xl';
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  variant = 'surface',
  padding = 'md',
  radius = '2xl',
  children,
  className = '',
  ...props
}) => {
  const radiusStyles = {
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  const variantStyles = {
    surface: 'bg-white border border-slate-200/80 shadow-xs transition-colors duration-150',
    flat: 'bg-slate-50/90 border border-slate-200/70',
    interactive: 'bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-150 cursor-pointer',
    glass: 'bg-white/85 backdrop-blur-xl border border-slate-200/75 shadow-xs',
  };

  return (
    <div
      className={`relative overflow-hidden ${radiusStyles[radius]} ${paddingStyles[padding]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  eyebrow?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, eyebrow, action, className = '' }) => {
  return (
    <div className={`flex items-start justify-between gap-4 mb-4 ${className}`}>
      <div>
        {eyebrow && (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            {eyebrow}
          </span>
        )}
        {title && (
          <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

