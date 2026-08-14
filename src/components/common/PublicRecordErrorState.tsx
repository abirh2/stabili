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
    <div className={`p-6 sm:p-8 bg-slate-50/80 rounded-2xl border border-slate-200 text-center max-w-md mx-auto my-6 shadow-2xs ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-white text-slate-500 border border-slate-200/80 flex items-center justify-center mx-auto mb-3.5 shadow-2xs">
        <Database className="w-5 h-5 text-slate-400" />
      </div>

      <h3 className="text-base font-semibold text-slate-900 tracking-tight">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
        {description}
      </p>

      {onRetry && (
        <div className="mt-5">
          <Button
            variant="secondary"
            size="sm"
            isPill
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
