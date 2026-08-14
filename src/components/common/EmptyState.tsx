import React from 'react';
import { Button, ButtonVariant } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: ButtonVariant;
  secondaryAction?: React.ReactNode;
  className?: string;
  id?: string;
  children?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = 'primary',
  secondaryAction,
  className = '',
  id,
  children,
}) => {
  return (
    <div
      id={id}
      className={`text-center py-12 px-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs max-w-lg mx-auto ${className}`}
    >
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-teal-50/80 text-teal-700 flex items-center justify-center border border-teal-100/80 mx-auto mb-3.5">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900 tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {children}
      {(actionLabel && onAction) || secondaryAction ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          {actionLabel && onAction && (
            <Button
              variant={actionVariant}
              size="sm"
              isPill
              onClick={onAction}
            >
              {actionLabel}
            </Button>
          )}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
};
