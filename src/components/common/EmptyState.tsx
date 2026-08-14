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
      className={`text-center py-14 px-6 max-w-lg mx-auto ${className}`}
    >
      {icon && (
        <div className="w-10 h-10 text-accent flex items-center justify-center mx-auto mb-4">
          {icon}
        </div>
      )}
      <h3 className="type-section-title">
        {title}
      </h3>
      {description && (
        <p className="type-body text-secondary mt-2 max-w-sm mx-auto">
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
