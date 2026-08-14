import React from 'react';
import { Calendar, RefreshCw } from 'lucide-react';

export interface DataFreshnessBadgeProps {
  date?: string;
  updatedLabel?: string;
  className?: string;
  variant?: 'badge' | 'subtle' | 'inline';
}

export const DataFreshnessBadge: React.FC<DataFreshnessBadgeProps> = ({
  date,
  updatedLabel,
  className = '',
  variant = 'badge',
}) => {
  const displayText = updatedLabel || (date ? `Public record retrieved ${date}` : 'Update date unavailable');

  if (variant === 'subtle') {
    return (
      <span className={`type-caption inline-flex items-center gap-1 ${className}`}>
        <Calendar className="w-3 h-3 shrink-0" />
        <span>{displayText}</span>
      </span>
    );
  }

  if (variant === 'inline') {
    return (
      <span className={`st-badge st-badge--neutral ${className}`}>
        <RefreshCw className="w-3 h-3 shrink-0" />
        <span>{displayText}</span>
      </span>
    );
  }

  return (
    <span className={`st-badge st-badge--neutral ${className}`}>
      <Calendar className="w-3 h-3 shrink-0" />
      <span>{displayText}</span>
    </span>
  );
};
