import React from 'react';
import {
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import { BuildingRecord } from '../../types';
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
  const secondaryAddressText = building.secondaryAddress || building.alternateAddresses?.[0];
  const unitsText = building.units != null ? building.units.toLocaleString() : 'Unavailable';
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

  const healthLabel = building.health === 'Good'
    ? 'Low concern'
    : building.health === 'Fair'
      ? 'Some concerns'
      : building.health === 'Needs Attention'
        ? 'Higher concern'
        : 'Insufficient data';
  const healthTone = building.health === 'Good' ? 'positive' : building.health === 'Fair' ? 'caution' : building.health === 'Needs Attention' ? 'negative' : 'neutral';
  const recentCondition = building.openViolationsCount == null
    ? 'Recent violation data unavailable'
    : `${building.openViolationsCount.toLocaleString()} open ${building.openViolationsCount === 1 ? 'violation' : 'violations'}`;

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
      className="building-result group relative"
    >
      <button
        type="button"
        className="building-result__link"
        onClick={() => onSelect(building.id)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect(building.id);
          }
        }}
        aria-label={`View building details for ${building.address}`}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="building-result__address text-primary">{building.address}</h3>
          <p className="type-metadata mt-0.5">
            {locationText}{building.zipCode ? ` · ${building.zipCode}` : ''}
          </p>
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
          onClick={(event) => {
            event.stopPropagation();
            onToggleSave(building.id);
          }}
          className={`building-result__action st-button st-button--pill !min-h-11 !w-11 !p-0 ${isSaved ? 'st-button--subtle-teal' : 'st-button--ghost'}`}
          aria-pressed={isSaved}
          aria-label={isSaved ? 'Remove building from saved' : 'Save building'}
        >
          {isSaved ? <BookmarkCheck className="h-[18px] w-[18px] fill-current" /> : <Bookmark className="h-[18px] w-[18px]" />}
        </button>
      </div>

      <dl className="building-result__facts">
        <div>
          <dt>Stabilization record</dt>
          <dd><ShieldCheck className="h-3.5 w-3.5 text-[var(--st-positive)]" />DHCR registered</dd>
        </div>
        <div>
          <dt>Units</dt>
          <dd className="tabular-nums">{unitsText}</dd>
        </div>
        <div>
          <dt>Management</dt>
          <dd className="truncate" title={managementTitle}>{managementContext}</dd>
        </div>
      </dl>

      <div className="building-result__condition">
        <div>
          <span className="type-caption">Building health</span>
          <p className={`building-health building-health--${healthTone}`}>{healthLabel}</p>
        </div>
        <div className="min-w-0 text-right">
          <span className="type-caption">Recent condition summary</span>
          <p className="type-metadata mt-0.5 flex items-center justify-end gap-1.5 text-primary">
          {building.openViolationsCount == null ? (
            <HelpCircle className="h-3.5 w-3.5 shrink-0" />
          ) : building.openViolationsCount > 0 ? (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[var(--st-caution)]" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[var(--st-positive)]" />
          )}
          <span>{recentCondition}{building.complaints311Count != null && ` · ${building.complaints311Count} recent 311 ${building.complaints311Count === 1 ? 'report' : 'reports'}`}</span>
          </p>
        </div>
      </div>

      <p className="type-metadata mt-3 truncate" title={managementTitle}><span className="text-tertiary">Management record</span> · <span className="font-medium text-primary">{managementTitle}</span></p>
      {building.isAmbiguousMatch && <div className="mt-3"><AmbiguousRecordBadge reviewNote={building.matchReviewNote} /></div>}
    </article>
  );
};
