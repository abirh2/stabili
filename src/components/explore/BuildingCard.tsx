import React from 'react';
import {
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  Building,
  CheckCircle2,
  HelpCircle,
  Layers,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { BuildingRecord } from '../../types';
import { BuildingHealthBadge } from '../common/Badge';
import { AmbiguousRecordBadge } from '../common/AmbiguousRecordBadge';

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
  const hasContact = Boolean(building.phone || building.website || building.email);
  const secondaryAddressText = building.secondaryAddress || building.alternateAddresses?.[0];
  const isComplex = Boolean(building.complexType || building.isGardenComplex || building.complexName);
  const complexLabel = building.complexType || (building.isGardenComplex ? 'Garden complex' : 'Multi-building property');
  const unitsText = building.units != null ? `${building.units} units` : 'Units unavailable';
  const yearBuiltText = building.yearBuilt != null ? String(building.yearBuilt) : 'Unavailable';
  const storiesText = building.stories != null ? String(building.stories) : 'Unavailable';
  const locationText = [building.neighborhood, building.borough]
    .filter((value, index, values) => Boolean(value) && values.findIndex((candidate) => candidate?.toLocaleLowerCase() === value?.toLocaleLowerCase()) === index)
    .join(' · ');

  let managementTitle = 'Management contact unavailable';
  let managementContext = 'Unlisted';
  if (building.managingAgent) {
    managementTitle = building.managingAgent;
    managementContext = building.phone || building.email ? 'Contact listed' : 'Name only';
  } else if (building.registeredOwner) {
    managementTitle = `Owner: ${building.registeredOwner}`;
    managementContext = 'Owner on record';
  } else if (building.businessMailingAddress) {
    managementTitle = building.businessMailingAddress;
    managementContext = 'Mailing address only';
  }

  return (
    <article
      id={`building-card-${building.id}`}
      data-selected={isSelected ? 'true' : 'false'}
      onMouseEnter={() => onHover?.(building.id)}
      onMouseLeave={() => onHover?.(null)}
      onFocusCapture={() => onHover?.(building.id)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onHover?.(null);
      }}
      className="st-card st-card--interactive group relative flex flex-col p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="type-caption">
            {locationText}{building.zipCode ? ` · ZIP ${building.zipCode}` : ''}
          </p>
          <button
            type="button"
            onClick={() => onSelect(building.id)}
            className="type-building-title mt-1 block cursor-pointer text-left text-primary transition-colors group-hover:text-accent"
          >
            {building.address}
          </button>
          {secondaryAddressText && (
            <p className="type-metadata mt-1 line-clamp-1">
              Also associated with <span className="font-medium text-primary">{secondaryAddressText}</span>
              {building.alternateAddresses && building.alternateAddresses.length > 1 && ` (+${building.alternateAddresses.length - 1} more)`}
            </p>
          )}
        </div>

        <button
          id={`save-btn-${building.id}`}
          type="button"
          onClick={() => onToggleSave(building.id)}
          className={`st-button st-button--pill !w-11 !p-0 ${isSaved ? 'st-button--subtle-teal' : 'st-button--ghost'}`}
          aria-pressed={isSaved}
          aria-label={isSaved ? 'Remove building from saved' : 'Save building'}
        >
          {isSaved ? <BookmarkCheck className="h-[18px] w-[18px] fill-current" /> : <Bookmark className="h-[18px] w-[18px]" />}
        </button>
      </div>

      {building.isAmbiguousMatch && (
        <div className="mt-3"><AmbiguousRecordBadge reviewNote={building.matchReviewNote} /></div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="st-badge st-badge--positive"><ShieldCheck className="h-3.5 w-3.5" />DHCR record</span>
        {isComplex && <span className="st-badge st-badge--neutral" title={building.complexName || complexLabel}><Layers className="h-3.5 w-3.5" />{complexLabel}</span>}
        <span className="type-metadata inline-flex items-center gap-1"><Building className="h-3.5 w-3.5" />{unitsText}</span>
      </div>

      {isComplex && building.complexName && (
        <p className="type-metadata mt-2">Part of <span className="font-medium text-primary">{building.complexName}</span></p>
      )}

      <dl className="separator mt-4 grid grid-cols-3 divide-x border-y py-3">
        <div className="px-2 first:pl-0">
          <dt className="type-caption">Built</dt>
          <dd className="type-label mt-0.5 text-primary tabular-nums">{yearBuiltText}</dd>
        </div>
        <div className="separator px-3">
          <dt className="type-caption">Stories</dt>
          <dd className="type-label mt-0.5 text-primary tabular-nums">{storiesText}</dd>
        </div>
        <div className="separator px-3 pr-0">
          <dt className="type-caption">Contact</dt>
          <dd className="type-label mt-0.5 inline-flex items-center gap-1 text-primary">
            {hasContact && <Phone className="h-3 w-3 text-accent" />}{hasContact ? 'Listed' : 'Unlisted'}
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="type-caption">Stabili summary</span>
          <BuildingHealthBadge health={building.health} size="sm" />
        </div>
        <div className="type-metadata flex items-center gap-1.5">
          {building.openViolationsCount == null ? (
            <><HelpCircle className="h-3.5 w-3.5" /><span>Violations unavailable</span></>
          ) : building.openViolationsCount > 0 ? (
            <><AlertTriangle className="h-3.5 w-3.5 text-[var(--st-caution)]" /><span>{building.openViolationsCount} open</span></>
          ) : (
            <><CheckCircle2 className="h-3.5 w-3.5 text-[var(--st-positive)]" /><span>0 open</span></>
          )}
          {building.complaints311Count != null && <span>· {building.complaints311Count} 311 {building.complaints311Count === 1 ? 'report' : 'reports'}</span>}
        </div>
      </div>

      <div className="separator mt-4 border-t pt-3">
        <div className="flex items-baseline justify-between gap-3">
          <div className="min-w-0">
            <p className="type-caption">Management record · {managementContext}</p>
            <p className="type-metadata mt-0.5 truncate font-medium text-primary" title={managementTitle}>{managementTitle}</p>
          </div>
        </div>
      </div>
    </article>
  );
};
