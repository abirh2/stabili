import React, { useState } from 'react';
import { HelpCircle, Info, ChevronDown } from 'lucide-react';

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
      <div className={`p-3 sm:p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900 ${className}`}>
        <HelpCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5 flex-1">
          <div className="flex items-center gap-1.5 font-semibold text-amber-950">
            <span>Property match needs review</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded border border-amber-200">
              Ambiguous Record
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-amber-800/90 leading-relaxed font-normal">
            {reviewNote}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <span 
        onClick={() => setShowTooltip(!showTooltip)}
        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200/80 cursor-pointer hover:bg-amber-100/70 transition-colors select-none"
        title="Click to view record verification note"
      >
        <HelpCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
        <span>Property match needs review</span>
        <Info className="w-3 h-3 text-amber-600 opacity-70" />
      </span>

      {showTooltip && (
        <div className="absolute left-0 top-full mt-1.5 z-40 w-72 p-3 bg-slate-900 text-white rounded-xl shadow-xl text-xs space-y-1 animate-in fade-in zoom-in-95">
          <div className="font-semibold text-amber-300 flex items-center justify-between">
            <span>Verification Required</span>
            <button onClick={() => setShowTooltip(false)} className="text-slate-400 hover:text-white text-[10px]">Close</button>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
            {reviewNote}
          </p>
          <div className="pt-1 text-[10px] text-slate-400 border-t border-slate-800">
            This indicates public record matching uncertainty, not a building flaw.
          </div>
        </div>
      )}
    </div>
  );
};
