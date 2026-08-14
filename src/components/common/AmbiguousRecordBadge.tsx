import React, { useState } from 'react';
import { HelpCircle, Info } from 'lucide-react';

export interface AmbiguousRecordBadgeProps {
  reviewNote?: string;
  className?: string;
  variant?: 'badge' | 'banner';
}

export const AmbiguousRecordBadge: React.FC<AmbiguousRecordBadgeProps> = ({
  reviewNote = 'Public record parcel boundaries or address matching requires manual verification.',
  className = '',
  variant = 'badge',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (variant === 'banner') {
    return (
      <div className={`radius-control flex items-start gap-2.5 bg-[var(--st-caution-subtle)] p-3 text-[var(--st-caution)] sm:p-3.5 ${className}`}>
        <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="space-y-0.5 flex-1">
          <div className="type-label flex items-center gap-1.5 text-[var(--st-caution)]">
            <span>Property match needs review</span>
            <span className="st-badge st-badge--caution">
              Ambiguous Record
            </span>
          </div>
          <p className="type-metadata text-[var(--st-caution)]">
            {reviewNote}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={() => setShowTooltip(!showTooltip)}
        className="st-chip border-transparent bg-[var(--st-caution-subtle)] text-[var(--st-caution)]"
        aria-expanded={showTooltip}
        title="Click to view record verification note"
      >
        <HelpCircle className="w-3.5 h-3.5 shrink-0" />
        <span>Property match needs review</span>
        <Info className="w-3 h-3 opacity-70" />
      </button>

      {showTooltip && (
        <div className="st-popover absolute left-0 top-full mt-1.5 z-40 w-72 p-3 text-primary space-y-1">
          <div className="type-label flex items-center justify-between text-[var(--st-caution)]">
            <span>Verification Required</span>
            <button onClick={() => setShowTooltip(false)} className="st-button st-button--ghost st-button--sm !min-h-8 !px-2">Close</button>
          </div>
          <p className="type-metadata">
            {reviewNote}
          </p>
          <div className="type-caption separator pt-2 border-t">
            This indicates public record matching uncertainty, not a building flaw.
          </div>
        </div>
      )}
    </div>
  );
};
