import React from 'react';
import { X, Check, RotateCcw, SlidersHorizontal, MapPin, Building, Activity } from 'lucide-react';
import { Button } from '../common/Button';

interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBorough: string;
  onSelectBorough: (borough: string) => void;
  selectedNeighborhood: string;
  onSelectNeighborhood: (neighborhood: string) => void;
  selectedZip: string;
  onSelectZip: (zip: string) => void;
  selectedMinUnits: string;
  onSelectMinUnits: (size: string) => void;
  selectedCondition: string;
  onSelectCondition: (condition: string) => void;
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
  onResetFilters: () => void;
  totalResultsCount: number;
}

export const MobileFilterSheet: React.FC<MobileFilterSheetProps> = ({
  isOpen,
  onClose,
  selectedBorough,
  onSelectBorough,
  selectedNeighborhood,
  onSelectNeighborhood,
  selectedZip,
  onSelectZip,
  selectedMinUnits,
  onSelectMinUnits,
  selectedCondition,
  onSelectCondition,
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
  onResetFilters,
  totalResultsCount,
}) => {
  if (!isOpen) return null;

  const boroughs = ['All', 'Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];
  const neighborhoods = ['All', 'Astoria', 'Crown Heights', 'Fordham', 'Inwood', 'Jackson Heights', 'Kingsbridge', 'Longwood', 'Morris Heights', 'Mott Haven', 'Norwood', 'Upper West Side', 'West Village', 'Williamsburg'];
  const zips = ['All', '10014', '10024', '10025', '10032', '10034', '10453', '10455', '10458', '10463', '10467', '11103', '11106', '11249', '11369'];
  const minUnitsList = ['All', '10+ units', '25+ units', '50+ units', '75+ units'];
  const conditions = ['All', 'Good', 'Fair', 'Needs Attention'];
  const violationOptions = ['All', '0 Open Violations', 'Max 5 Violations', 'Max 10 Violations'];
  const eras = ['All', 'Pre-War (Before 1940)', 'Mid-Century (1940-1970)', 'Modern (1970+)'];
  const storyOptions = ['All', '1 - 4 Stories', '5 - 6 Stories', '7+ Stories'];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Bottom Sheet Container */}
      <div className="relative w-full max-h-[90vh] bg-white rounded-t-3xl shadow-xl border-t border-slate-200/90 flex flex-col z-10 animate-in slide-in-from-bottom duration-200">
        {/* Grab Handle */}
        <div className="w-full flex items-center justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-teal-700" />
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">Filter Buildings</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
            aria-label="Close filters sheet"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 stabili-scroller">
          
          {/* SECTION 1: LOCATION */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-teal-800 uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5" />
              <span>Location</span>
            </div>

            {/* Borough */}
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1.5">
                Borough
              </span>
              <div className="flex flex-wrap gap-1.5">
                {boroughs.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => onSelectBorough(b)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center justify-center ${
                      selectedBorough === b
                        ? 'bg-teal-700 text-white shadow-2xs'
                        : 'bg-slate-100/90 text-slate-700 hover:bg-slate-200/80 border border-slate-200/60'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Neighborhood */}
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1.5">
                Neighborhood
              </span>
              <div className="flex flex-wrap gap-1.5">
                {neighborhoods.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onSelectNeighborhood(n)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center justify-center ${
                      selectedNeighborhood === n
                        ? 'bg-teal-700 text-white shadow-2xs'
                        : 'bg-slate-100/90 text-slate-700 hover:bg-slate-200/80 border border-slate-200/60'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* ZIP Code */}
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1.5">
                ZIP Code
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-slate-50/70 rounded-xl border border-slate-200/60">
                {zips.map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => onSelectZip(z)}
                    className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center justify-center ${
                      selectedZip === z
                        ? 'bg-teal-700 text-white font-medium shadow-2xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                  >
                    {z}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* SECTION 2: HEALTH & COMPLIANCE */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-teal-800 uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5" />
              <span>Building Health & Safety</span>
            </div>

            {/* Building Condition */}
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1.5">
                Condition Rating
              </span>
              <div className="flex flex-wrap gap-1.5">
                {conditions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onSelectCondition(c)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center justify-center ${
                      selectedCondition === c
                        ? 'bg-teal-700 text-white shadow-2xs'
                        : 'bg-slate-100/90 text-slate-700 hover:bg-slate-200/80 border border-slate-200/60'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Violations */}
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1.5">
                Max Open Violations
              </span>
              <div className="flex flex-wrap gap-1.5">
                {violationOptions.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => onSelectViolationFilter(v)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center justify-center ${
                      selectedViolationFilter === v
                        ? 'bg-teal-700 text-white shadow-2xs'
                        : 'bg-slate-100/90 text-slate-700 hover:bg-slate-200/80 border border-slate-200/60'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* No Class C Toggle */}
            <div
              onClick={() => onToggleNoClassC(!noClassCViolationsOnly)}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between select-none ${
                noClassCViolationsOnly
                  ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950 ring-1 ring-emerald-400/30'
                  : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70'
              }`}
            >
              <div>
                <span className="text-xs font-medium text-slate-900 block">No Class C Violations</span>
                <span className="text-[11px] text-slate-500 block">Immediately hazardous violation free</span>
              </div>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                noClassCViolationsOnly ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
              }`}>
                {noClassCViolationsOnly && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
              </div>
            </div>

            {/* Management Contact Available Toggle */}
            <div
              onClick={() => onToggleManagementContact(!managementContactOnly)}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between select-none ${
                managementContactOnly
                  ? 'bg-teal-50/60 border-teal-300 text-teal-950 ring-1 ring-teal-400/30'
                  : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70'
              }`}
            >
              <div>
                <span className="text-xs font-medium text-slate-900 block">Management Contact Listed</span>
                <span className="text-[11px] text-slate-500 block">Direct phone, email, or website available</span>
              </div>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                managementContactOnly ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 bg-white'
              }`}>
                {managementContactOnly && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* SECTION 3: BUILDING SPECS & ERA */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-teal-800 uppercase tracking-wider">
              <Building className="w-3.5 h-3.5" />
              <span>Size & Construction Era</span>
            </div>

            {/* Minimum Residential Units */}
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1.5">
                Minimum Residential Units
              </span>
              <div className="flex flex-wrap gap-1.5">
                {minUnitsList.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onSelectMinUnits(s)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center justify-center ${
                      selectedMinUnits === s
                        ? 'bg-teal-700 text-white shadow-2xs'
                        : 'bg-slate-100/90 text-slate-700 hover:bg-slate-200/80 border border-slate-200/60'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Construction Era */}
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1.5">
                Year Built Range / Era
              </span>
              <div className="flex flex-wrap gap-1.5">
                {eras.map((era) => (
                  <button
                    key={era}
                    type="button"
                    onClick={() => onSelectEra(era)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center justify-center ${
                      selectedEra === era
                        ? 'bg-teal-700 text-white shadow-2xs'
                        : 'bg-slate-100/90 text-slate-700 hover:bg-slate-200/80 border border-slate-200/60'
                    }`}
                  >
                    {era}
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Stories */}
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-1.5">
                Number of Stories
              </span>
              <div className="flex flex-wrap gap-1.5">
                {storyOptions.map((story) => (
                  <button
                    key={story}
                    type="button"
                    onClick={() => onSelectStories(story)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center justify-center ${
                      selectedStories === story
                        ? 'bg-teal-700 text-white shadow-2xs'
                        : 'bg-slate-100/90 text-slate-700 hover:bg-slate-200/80 border border-slate-200/60'
                    }`}
                  >
                    {story}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Sticky Bottom Actions */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-white flex items-center gap-2.5 shrink-0">
          <Button
            variant="ghost"
            isPill
            size="md"
            leftIcon={<RotateCcw className="w-4 h-4" />}
            onClick={onResetFilters}
            className="flex-1"
          >
            Reset
          </Button>
          <Button
            variant="primary"
            isPill
            size="md"
            onClick={onClose}
            className="flex-2"
          >
            Show {totalResultsCount} {totalResultsCount === 1 ? 'Building' : 'Buildings'}
          </Button>
        </div>
      </div>
    </div>
  );
};


