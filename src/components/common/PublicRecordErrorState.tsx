import React from 'react';
import { RefreshCw, Database } from 'lucide-react';
import { Button } from './Button';

export interface PublicRecordErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export const PublicRecordErrorState: React.FC<PublicRecordErrorStateProps> = ({
  title = "We couldn't load this public record right now.",
  description = "Public municipal databases may be temporarily unavailable or undergoing routine maintenance. Please try again.",
  onRetry,
  className = '',
}) => {
  return (
    <div className={`separator max-w-md mx-auto my-6 border-y px-2 py-10 text-center ${className}`} role="alert">
      <div className="text-tertiary flex h-10 w-10 items-center justify-center mx-auto mb-3.5">
        <Database className="w-5 h-5" />
      </div>

      <h3 className="type-section-title">
        {title}
      </h3>

      <p className="type-body text-secondary mt-1.5">
        {description}
      </p>

      {onRetry && (
        <div className="mt-5">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={onRetry}
          >
            Try again
          </Button>
        </div>
      )}
    </div>
  );
};
