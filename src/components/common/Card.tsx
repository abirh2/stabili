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
    lg: 'radius-control',
    xl: 'radius-card',
    '2xl': 'radius-card',
    '3xl': 'radius-page',
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  const variantStyles = {
    surface: 'st-card st-card--raised',
    flat: 'st-card st-card--flat',
    interactive: 'st-card st-card--interactive cursor-pointer',
    glass: 'st-card st-card--glass',
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
  action?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, className = '' }) => {
  return (
    <div className={`flex items-start justify-between gap-4 mb-4 ${className}`}>
      <div>
        {title && (
          <h3 className="type-section-title">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="type-metadata mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
