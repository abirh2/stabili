import React from 'react';
import { 
  ShieldCheck, 
  Phone, 
  CheckCircle2, 
  AlertTriangle, 
  Bookmark, 
  BookmarkCheck, 
  ArrowRight, 
  Building,
  Layers,
  HelpCircle
} from 'lucide-react';
import { BuildingRecord } from '../../types';
import { BuildingHealthBadge } from '../common/Badge';
import { AmbiguousRecordBadge } from '../common/AmbiguousRecordBadge';
import { SourceMetadataTag } from '../common/SourceMetadataTag';

export interface BuildingCardProps {
  building: BuildingRecord;
  isSelected?: boolean;
  isSaved?: boolean;
  onSelect: (id: string) => void;
  onToggleSave: (id: string) => void;
  onHover?: (id: string | null) => void;
}

export const BuildingCard: React.FC<BuildingCardProps> = ({
  building,
  isSelected = false,
  isSaved = false,
  onSelect,
  onToggleSave,
  onHover,
}) => {
  const hasContact = Boolean(building.phone || building.website || building.managingAgent || building.email);
  
  // Secondary / alternate address line representation
  const secondaryAddressText = building.secondaryAddress || (building.alternateAddresses && building.alternateAddresses[0]);
  
  // Garden complex / multi-building representation
  const isComplex = Boolean(building.complexType || building.isGardenComplex || building.complexName);
  const complexLabel = building.complexType || (building.isGardenComplex ? 'Garden complex' : 'Multi-building property');

  // Format spec values clearly distinguishing 0 from Unknown/null
  const unitsText = building.units !== undefined && building.units !== null ? `${building.units} units` : 'Unknown units';
  const yearBuiltText = building.yearBuilt !== undefined && building.yearBuilt !== null ? `${building.yearBuilt}` : 'Unknown';
  const storiesText = building.stories !== undefined && building.stories !== null ? `${building.stories} fl` : 'Unknown';

  // Management display calculation (supporting the 5 required variations)
  let managementTitle = 'Management contact unavailable';
  let managementBadge = 'Unlisted';
  let managementBadgeColor = 'bg-slate-100 text-slate-500';

  if (building.managingAgent) {
    managementTitle = building.managingAgent;
    managementBadge = building.phone || building.email ? 'Available' : 'No phone/email';
    managementBadgeColor = building.phone || building.email ? 'bg-teal-50 text-teal-700 border-teal-100/80' : 'bg-amber-50 text-amber-800 border-amber-200/60';
  } else if (building.registeredOwner) {
    managementTitle = `Owner: ${building.registeredOwner}`;
    managementBadge = 'Owner on record';
    managementBadgeColor = 'bg-slate-100 text-slate-700 border-slate-200/70';
  } else if (building.businessMailingAddress) {
    managementTitle = building.businessMailingAddress;
    managementBadge = 'Mailing address only';
    managementBadgeColor = 'bg-slate-100 text-slate-600 border-slate-200/60';
  }

  return (
    <div
      id={`building-card-${building.id}`}
      onClick={() => onSelect(building.id)}
      onMouseEnter={() => onHover && onHover(building.id)}
      onMouseLeave={() => onHover && onHover(null)}
      className={`group relative bg-white rounded-2xl border transition-all duration-150 cursor-pointer overflow-hidden p-4 sm:p-5 flex flex-col justify-between ${
        isSelected
          ? 'border-teal-600 ring-2 ring-teal-500/20 bg-teal-50/10 shadow-xs'
          : 'border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      {/* Top Header: Address, Location & Bookmark */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                {building.neighborhood} · {building.borough}
              </span>
              <span className="text-slate-300 text-xs hidden sm:inline">•</span>
              <span className="text-[11px] text-slate-400 font-mono">
                ZIP {building.zipCode}
              </span>
            </div>

            {/* Primary Property Address */}
            <h3 className="text-base font-semibold text-slate-900 tracking-tight mt-1 group-hover:text-teal-800 transition-colors break-words">
              {building.address}
            </h3>

            {/* Optional Secondary / Alternate Address Line */}
            {secondaryAddressText && (
              <p className="text-[12px] text-slate-500 mt-0.5 font-normal leading-snug line-clamp-1">
                <span className="text-slate-400">Also associated with</span>{' '}
                <span className="text-slate-700 font-medium">{secondaryAddressText}</span>
                {building.alternateAddresses && building.alternateAddresses.length > 1 && (
                  <span className="text-[11px] text-slate-400 font-normal ml-1">
                    (+{building.alternateAddresses.length - 1} more)
                  </span>
                )}
              </p>
            )}
          </div>

          <button
            id={`save-btn-${building.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(building.id);
            }}
            className={`min-w-[40px] min-h-[40px] p-2 rounded-xl border transition-all cursor-pointer shrink-0 flex items-center justify-center ${
              isSaved
                ? 'bg-teal-50 border-teal-200/80 text-teal-700 hover:bg-teal-100/70'
                : 'bg-white border-slate-200/80 text-slate-400 hover:text-slate-700 hover:bg-slate-50'
            }`}
            aria-label={isSaved ? "Saved building" : "Save building"}
            title={isSaved ? "Saved to your list" : "Save building"}
          >
            {isSaved ? (
              <BookmarkCheck className="w-4.5 h-4.5 text-teal-600 fill-teal-600" />
            ) : (
              <Bookmark className="w-4.5 h-4.5" />
            )}
          </button>
        </div>

        {/* Ambiguous Match Review Warning Badge if applicable */}
        {building.isAmbiguousMatch && (
          <div className="mt-2.5">
            <AmbiguousRecordBadge reviewNote={building.matchReviewNote} />
          </div>
        )}

        {/* Stabilization & Specs Badges (including subtle Garden Complex badge) */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>Rent-stabilized</span>
          </span>

          {isComplex && (
            <span 
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100/90 text-slate-700 border border-slate-200/70"
              title={building.complexName || complexLabel}
            >
              <Layers className="w-3 h-3 text-slate-500 shrink-0" />
              <span>{complexLabel}</span>
            </span>
          )}

          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100/80 text-slate-700 border border-slate-200/60">
            <Building className="w-3 h-3 text-slate-500 shrink-0" />
            <span>{unitsText}</span>
          </span>
        </div>

        {/* Complex Affiliation & Related Buildings Action Space */}
        {isComplex && (
          <div className="mt-2.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span className="truncate pr-2">
              {building.complexName ? (
                <span>Part of <strong className="font-medium text-slate-800">{building.complexName}</strong></span>
              ) : (
                <span>Multi-building property complex</span>
              )}
            </span>
            <span 
              className="text-teal-800 font-medium hover:text-teal-900 shrink-0 underline decoration-slate-300 underline-offset-2"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(building.id);
              }}
            >
              View related buildings
            </span>
          </div>
        )}

        {/* Building Structural Details */}
        <div className="mt-3 grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50/70 rounded-xl border border-slate-100 text-xs text-slate-600">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Built</span>
            <span className="font-medium text-slate-800">{yearBuiltText}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Stories</span>
            <span className="font-medium text-slate-800">{storiesText}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Contact</span>
            <span className={`font-medium flex items-center gap-1 truncate ${hasContact ? 'text-teal-700' : 'text-slate-500'}`}>
              {hasContact ? (
                <>
                  <Phone className="w-3 h-3 text-teal-600 shrink-0" />
                  <span className="truncate">Listed</span>
                </>
              ) : (
                <span className="text-slate-400">Unlisted</span>
              )}
            </span>
          </div>
        </div>

        {/* HPD Violations & 311 Complaints Summary (handling null/unavailable explicitly) */}
        <div className="mt-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 p-2 bg-white rounded-xl border border-slate-200/70 text-xs">
          <div className="flex items-center gap-2 shrink-0">
            <BuildingHealthBadge health={building.health} size="sm" />
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 text-right flex-wrap text-slate-600">
            {building.openViolationsCount === undefined || building.openViolationsCount === null ? (
              <span className="font-medium text-slate-400 flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-slate-400 shrink-0" />
                <span>Violations unavailable</span>
              </span>
            ) : building.openViolationsCount > 0 ? (
              <span className="font-medium text-amber-800 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                <span>{building.openViolationsCount} open {building.openViolationsCount === 1 ? 'violation' : 'violations'}</span>
              </span>
            ) : (
              <span className="font-medium text-teal-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-teal-600 shrink-0" />
                <span>0 open violations</span>
              </span>
            )}

            <span className="text-slate-300 hidden sm:inline">•</span>

            {building.complaints311Count === undefined || building.complaints311Count === null ? (
              <span className="text-slate-400">311 unavailable</span>
            ) : (
              <span className="text-slate-500">
                {building.complaints311Count} 311 {building.complaints311Count === 1 ? 'report' : 'reports'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer: Managing Agent info & Action */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Management Record</span>
            <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${managementBadgeColor}`}>
              {managementBadge}
            </span>
          </div>
          <p className="text-xs font-medium text-slate-800 truncate mt-0.5" title={managementTitle}>
            {managementTitle}
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(building.id);
          }}
          className="min-h-[36px] inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 bg-white hover:bg-teal-50/80 hover:text-teal-800 group-hover:border-teal-300/80 transition-all cursor-pointer shrink-0 border border-slate-200/80"
        >
          <span>View</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-slate-400 group-hover:text-teal-600" />
        </button>
      </div>
    </div>
  );
};



