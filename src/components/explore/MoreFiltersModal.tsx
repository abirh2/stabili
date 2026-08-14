import React, { useRef, useEffect } from 'react';
import { X, SlidersHorizontal, Check, RotateCcw } from 'lucide-react';
import { Button } from '../common/Button';

interface MoreFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedZip: string;
  onSelectZip: (zip: string) => void;
  selectedMinUnits: string;
  onSelectMinUnits: (units: string) => void;
  selectedViolationFilter: string;
  onSelectViolationFilter: (filter: string) => void;
  noClassCViolationsOnly: boolean;
  onToggleNoClassC: (val: boolean) => void;
  managementContactOnly: boolean;
  onToggleManagementContact: (val: boolean) => void;
  selectedEra: string;
  onSelectEra: (era: string) => void;
  selectedStories: string;
  onSelectStories: (stories: string) => void;
  onReset: () => void;
  activeCount?: number;
}

export const MoreFiltersModal: React.FC<MoreFiltersModalProps> = ({
  isOpen,
  onClose,
  selectedZip,
  onSelectZip,
  selectedMinUnits,
  onSelectMinUnits,
  selectedViolationFilter,
  onSelectViolationFilter,
  noClassCViolationsOnly,
  onToggleNoClassC,
  managementContactOnly,
  onToggleManagementContact,
  selectedEra,
  onSelectEra,
  selectedStories,
  onSelectStories,
  onReset,
  activeCount = 0,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const zipOptions = ['All', '10014', '10024', '10025', '10032', '10034', '10453', '10455', '10458', '10463', '10467', '11103', '11106', '11249', '11369'];
  const minUnitOptions = ['All', '10+ units', '25+ units', '50+ units', '75+ units'];
  const violationOptions = ['All', '0 Open Violations', 'Max 5 Violations', 'Max 10 Violations'];
  const eraOptions = ['All', 'Pre-War (Before 1940)', 'Mid-Century (1940-1970)', 'Modern (1970+)'];
  const storyOptions = ['All', '1 - 4 Stories', '5 - 6 Stories', '7+ Stories'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200/90 p-5 sm:p-6 z-10 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100/80">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900 tracking-tight">More Filters</h3>
                {activeCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[11px] font-medium border border-teal-200/60">
                    {activeCount} active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">Refine by compliance, size, and architectural era</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
            aria-label="Close filters modal"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Scrollable Filters Content */}
        <div className="py-4 space-y-5 overflow-y-auto pr-1 stabili-scroller flex-1">
          {/* Quick Toggles Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* No Class C Violations Toggle */}
            <div
              onClick={() => onToggleNoClassC(!noClassCViolationsOnly)}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 select-none ${
                noClassCViolationsOnly
                  ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950 ring-1 ring-emerald-400/30'
                  : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70'
              }`}
            >
              <div className="mt-0.5">
                <div className={`w-4.5 h-4.5 rounded-md flex items-center justify-center border transition-colors ${
                  noClassCViolationsOnly ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                }`}>
                  {noClassCViolationsOnly && <Check className="w-3 h-3 stroke-[2.5]" />}
                </div>
              </div>
              <div className="flex-1">
                <span className="text-xs font-medium text-slate-900 block">No Class C Violations</span>
                <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                  Immediately hazardous free records
                </span>
              </div>
            </div>

            {/* Management Contact Available Toggle */}
            <div
              onClick={() => onToggleManagementContact(!managementContactOnly)}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 select-none ${
                managementContactOnly
                  ? 'bg-teal-50/60 border-teal-300 text-teal-950 ring-1 ring-teal-400/30'
                  : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70'
              }`}
            >
              <div className="mt-0.5">
                <div className={`w-4.5 h-4.5 rounded-md flex items-center justify-center border transition-colors ${
                  managementContactOnly ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 bg-white'
                }`}>
                  {managementContactOnly && <Check className="w-3 h-3 stroke-[2.5]" />}
                </div>
              </div>
              <div className="flex-1">
                <span className="text-xs font-medium text-slate-900 block">Management Contact Listed</span>
                <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                  Direct phone, email, or website
                </span>
              </div>
            </div>
          </div>

          {/* Maximum Open Violations */}
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-2">
              Maximum Open Violations
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {violationOptions.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onSelectViolationFilter(v)}
                  className={`px-3 py-1.5 rounded-xl text-xs text-center border transition-all cursor-pointer ${
                    selectedViolationFilter === v
                      ? 'bg-teal-50 border-teal-300/90 text-teal-800 font-medium shadow-2xs'
                      : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Minimum Residential Units */}
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-2">
              Minimum Residential Units
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {minUnitOptions.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => onSelectMinUnits(u)}
                  className={`px-3 py-1.5 rounded-xl text-xs text-center border transition-all cursor-pointer ${
                    selectedMinUnits === u
                      ? 'bg-teal-50 border-teal-300/90 text-teal-800 font-medium shadow-2xs'
                      : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Construction Era */}
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-2">
              Year Built / Construction Era
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {eraOptions.map((era) => (
                <button
                  key={era}
                  type="button"
                  onClick={() => onSelectEra(era)}
                  className={`px-3 py-1.5 rounded-xl text-xs text-left border transition-all cursor-pointer ${
                    selectedEra === era
                      ? 'bg-teal-50 border-teal-300/90 text-teal-800 font-medium shadow-2xs'
                      : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {era}
                </button>
              ))}
            </div>
          </div>

          {/* ZIP Code Quick Selector */}
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-2">
              NYC ZIP Code
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-slate-50/70 rounded-xl border border-slate-200/60">
              {zipOptions.map((zip) => (
                <button
                  key={zip}
                  type="button"
                  onClick={() => onSelectZip(zip)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                    selectedZip === zip
                      ? 'bg-teal-700 text-white font-medium shadow-2xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/60'
                  }`}
                >
                  {zip}
                </button>
              ))}
            </div>
          </div>

          {/* Building Height / Stories */}
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-2">
              Building Height / Stories
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {storyOptions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSelectStories(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs text-center border transition-all cursor-pointer ${
                    selectedStories === s
                      ? 'bg-teal-50 border-teal-300/90 text-teal-800 font-medium shadow-2xs'
                      : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            isPill
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={onReset}
          >
            Reset
          </Button>
          <Button
            variant="primary"
            size="sm"
            isPill
            onClick={onClose}
            className="px-5"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
};


