import React from 'react';
import { ShieldCheck, MapPin, Building, ChevronRight, Bookmark, BookmarkCheck } from 'lucide-react';
import { ManagementCompany } from '../../types';
import { Badge } from './Badge';
import { Button } from './Button';
import { ContactActions } from './ContactActions';

export interface ManagementCardProps {
  management: ManagementCompany;
  isSaved?: boolean;
  onSelect: (managementId: string) => void;
  onToggleSave?: (managementId: string) => void;
  className?: string;
  variant?: 'default' | 'compact' | 'horizontal';
  onToast?: (message: string) => void;
}

export const ManagementCard: React.FC<ManagementCardProps> = ({
  management,
  isSaved = false,
  onSelect,
  onToggleSave,
  className = '',
  variant = 'default',
  onToast,
}) => {
  const boroughsList = management.boroughs?.join(', ') || 'NYC Multi-borough';

  if (variant === 'compact') {
    return (
      <div className={`p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all ${className}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">{management.name}</h4>
            <p className="text-xs text-slate-500 mt-0.5">{management.address}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
            onClick={() => onSelect(management.id)}
          >
            View
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between ${className}`}
    >
      <div>
        {/* Header Badges & Actions */}
        <div className="flex items-start justify-between gap-2.5 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="verified" size="sm">
              <ShieldCheck className="w-3 h-3 text-emerald-700" />
              <span>HPD Registered</span>
            </Badge>
            {management.totalBuildings && (
              <Badge variant="neutral" size="sm">
                {management.totalBuildings} Properties
              </Badge>
            )}
          </div>

          {onToggleSave && (
            <button
              type="button"
              onClick={() => onToggleSave(management.id)}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer shrink-0 ${
                isSaved
                  ? 'bg-teal-50 border-teal-200 text-teal-700'
                  : 'bg-slate-50 border-slate-200/70 text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
              title={isSaved ? 'Remove from saved' : 'Save management'}
            >
              {isSaved ? (
                <BookmarkCheck className="w-4 h-4 fill-teal-700 text-teal-700" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Company Title */}
        <h3
          onClick={() => onSelect(management.id)}
          className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight hover:text-teal-800 transition-colors cursor-pointer"
        >
          {management.name}
        </h3>

        {/* Office Address */}
        <div className="flex items-start gap-1.5 text-xs text-slate-500 mt-1 mb-4 font-normal">
          <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
          <span className="line-clamp-1">{management.address}</span>
        </div>

        {/* Portfolio Stats Row */}
        <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50/80 rounded-xl border border-slate-100 mb-4 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
              Portfolio
            </span>
            <span className="font-semibold text-slate-800">
              {management.totalBuildings || 8} buildings
            </span>
            <span className="text-[10px] text-slate-500 block">~{management.totalUnits || 340} units</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
              Boroughs
            </span>
            <span className="font-semibold text-slate-800 line-clamp-1">
              {boroughsList}
            </span>
            <span className="text-[10px] text-teal-700 block font-medium">Verified Active</span>
          </div>
        </div>

        {/* Contact Pills */}
        <div className="mb-4">
          <ContactActions
            phone={management.phone}
            email={management.email}
            website={management.website}
            variant="pills"
            onToast={onToast}
          />
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Building className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span>Rent-stabilized portfolio</span>
        </div>

        <Button
          size="sm"
          variant="secondary"
          isPill
          rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
          onClick={() => onSelect(management.id)}
        >
          View portfolio
        </Button>
      </div>
    </div>
  );
};
