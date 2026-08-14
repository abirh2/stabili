import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  Building2,
  ChevronDown,
  ExternalLink,
  Mail,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import {
  BuildingDetailsSkeleton,
  BuildingHealthStatus,
  ContactActions,
  EmptyState,
  PageContainer,
  PublicRecordErrorState,
} from '../components/common';
import { detailToBuilding, displayBorough, formatAddress } from '../data/adapters';
import { loadBuilding, loadIndexRecords, managementKey } from '../data/client';
import type { StabiliIndexRecord, StabiliRecord } from '../data/schema';
import type { Route } from '../types';
import { BuildingLocationMap } from '../components/maps/BuildingLocationMap';

interface BuildingDetailsPageProps {
  buildingId: string;
  onSelectBuilding: (id: string) => void;
  onSelectManagement: (id: string) => void;
  onNavigate: (route: Route) => void;
  isSaved?: boolean;
  onToggleSave?: () => void;
}

interface RecordItem {
  id: string;
  title: string;
  description: string | null;
  meta: string;
}

const present = (value: unknown): value is string | number => value !== null && value !== undefined && value !== '';
const dateLabel = (value: string | null) => value
  ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(`${value.slice(0, 10)}T00:00:00`))
  : null;
const countLabel = (value: number | null) => value === null ? 'Unavailable' : value.toLocaleString();

export const BuildingDetailsPage: React.FC<BuildingDetailsPageProps> = ({
  buildingId,
  onSelectBuilding,
  onSelectManagement,
  onNavigate,
  isSaved = false,
  onToggleSave,
}) => {
  const [record, setRecord] = useState<StabiliRecord | null>(null);
  const [related, setRelated] = useState<StabiliIndexRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    setRecord(null);
    setRelated([]);
    loadBuilding(buildingId)
      .then(async (result) => {
        setRecord(result);
        if (result?.relatedStabiliRecordIds.length) {
          setRelated(await loadIndexRecords(result.relatedStabiliRecordIds));
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(load, [buildingId]);

  if (loading) return <PageContainer backAction={{ label: 'Back to Explore', onBack: () => onNavigate('explore') }}><BuildingDetailsSkeleton /></PageContainer>;
  if (error) return <PageContainer backAction={{ label: 'Back to Explore', onBack: () => onNavigate('explore') }}><PublicRecordErrorState description="This generated building record could not be loaded." onRetry={load} /></PageContainer>;
  if (!record) return <PageContainer backAction={{ label: 'Back to Explore', onBack: () => onNavigate('explore') }}><EmptyState icon={<Building2 className="w-6 h-6" />} title="Building not found" description="This Stabili ID does not exist in the current generated dataset." actionLabel="Return to Explore" onAction={() => onNavigate('explore')} /></PageContainer>;

  const building = detailToBuilding(record);
  const management = record.management;
  const managementAddress = formatAddress(management?.businessAddress ?? null);
  const hasBuildingAttributes = record.building && Object.values(record.building).some(present);
  const hasIdentifiers = Object.values(record.identifiers).some(present);
  const hasManagement = Boolean(management && (
    management.managingAgentName || management.managingAgentId || management.registeredOwnerName
    || management.phone || management.email || management.website || managementAddress
  ));
  const hasViolations = record.violations.totalCount !== null || Boolean(record.violations.details?.length);
  const hasComplaints = record.complaints.totalCount !== null || Boolean(record.complaints.details?.length);
  const hasVacates = record.vacateOrders.totalCount !== null || Boolean(record.vacateOrders.details?.length);
  const locationLabel = [displayBorough(record.primaryAddress.borough), record.primaryAddress.zipCode ? `ZIP ${record.primaryAddress.zipCode}` : null].filter(Boolean).join(' · ');
  const rentalSearch = encodeURIComponent(`${building.address}, ${displayBorough(record.primaryAddress.borough)}, NY ${record.primaryAddress.zipCode ?? ''}`);

  const scrollToManagement = () => document.getElementById('building-management')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <PageContainer
      backAction={{ label: 'Back to Explore', onBack: () => onNavigate('explore') }}
      className="building-detail-page"
    >
      <article className="building-dossier">
        <header className="building-hero">
          <div className="building-hero__identity">
            <p className="building-record-status"><ShieldCheck aria-hidden="true" /> Listed in a DHCR stabilized-building record</p>
            <h1 className="building-hero__title">{building.address}</h1>
            <p className="building-hero__location"><MapPin aria-hidden="true" /> {locationLabel}</p>
            {record.propertyMatch.status === 'ambiguous' && (
              <p className="building-match-note"><AlertTriangle aria-hidden="true" /> Property details are a possible match and may require review.</p>
            )}
          </div>

          <div className="building-actions" aria-label="Building actions">
            <button type="button" onClick={scrollToManagement} className="st-button st-button--primary">
              <Mail className="h-4 w-4" aria-hidden="true" /> Contact management
            </button>
            {onToggleSave && (
              <button type="button" onClick={onToggleSave} aria-pressed={isSaved} className="st-button st-button--secondary">
                {isSaved ? <BookmarkCheck className="h-4 w-4" aria-hidden="true" /> : <Bookmark className="h-4 w-4" aria-hidden="true" />}
                {isSaved ? 'Saved' : 'Save'}
              </button>
            )}
            <details className="rental-sites-menu">
              <summary className="st-button st-button--ghost">Rental sites <ChevronDown className="h-4 w-4" aria-hidden="true" /></summary>
              <div className="rental-sites-menu__panel">
                <p>Search this address on a rental site. Listings do not confirm stabilization.</p>
                <a href={`https://streeteasy.com/for-rent/nyc?search=${rentalSearch}`} target="_blank" rel="noreferrer">StreetEasy <ExternalLink aria-hidden="true" /></a>
                <a href={`https://www.zillow.com/homes/${rentalSearch}_rb/`} target="_blank" rel="noreferrer">Zillow <ExternalLink aria-hidden="true" /></a>
              </div>
            </details>
          </div>

          <dl className="building-overview" aria-label="Building overview">
            <Fact label="Units" value={countLabel(record.building?.residentialUnits ?? null)} />
            <Fact label="Year built" value={record.building?.yearBuilt ?? 'Unavailable'} />
            <Fact label="Stories" value={record.building?.stories ?? 'Unavailable'} />
            <Fact label="Ownership" value={record.building?.ownershipType ?? 'Unavailable'} />
          </dl>

          {(record.classifications.length > 0 || present(record.building?.buildingClass)) && (
            <p className="building-classifications">
              {[record.building?.buildingClass, ...record.classifications].filter(present).join(' · ')}
            </p>
          )}
        </header>

        <section className="building-health-section" aria-labelledby="building-health-title">
          <div>
            <h2 id="building-health-title">Building health</h2>
            <p>Stabili’s interpretation of available municipal records—not an agency rating.</p>
          </div>
          <BuildingHealthStatus health={building.health} variant="inline" className="building-health-section__status" />
          {record.health.explanation && <p className="building-health-section__explanation">{record.health.explanation}</p>}
        </section>

        <section id="building-management" className="building-section building-management" aria-labelledby="management-title">
          <div className="building-section__heading">
            <div>
              <h2 id="management-title">Management</h2>
              <p>Contact information from the matched public building record.</p>
            </div>
            {management?.managingAgentName && (
              <button type="button" onClick={() => onSelectManagement(managementKey(management.managingAgentName!))} className="st-button st-button--ghost st-button--sm">
                Associated records
              </button>
            )}
          </div>

          {hasManagement ? (
            <div className="management-layout">
              <dl className="management-identity">
                <Fact label="Managing agent" value={management?.managingAgentName ?? 'Unavailable'} detail={management?.managingAgentId ? `HPD registration ID ${management.managingAgentId}` : undefined} />
                <Fact label="Registered owner" value={management?.registeredOwnerName ?? 'Unavailable'} />
                <Fact label="Business address" value={managementAddress ?? 'Unavailable'} />
              </dl>
              <ContactActions
                variant="rows"
                phone={management?.phone}
                email={management?.email}
                website={management?.website}
                businessMailingAddress={managementAddress}
                subject={`Question about ${building.address}`}
              />
            </div>
          ) : (
            <p className="building-empty-note">Management contact information was not available in this public record.</p>
          )}
        </section>

        <section className="building-section" aria-labelledby="official-records-title">
          <div className="building-section__heading">
            <div>
              <h2 id="official-records-title">Official records</h2>
              <p>Agency reports associated with this building match.</p>
            </div>
          </div>

          <div className="record-groups">
            {hasViolations && <RecordSection title="Violations" summary={`${countLabel(record.violations.openCount)} open · ${countLabel(record.violations.totalCount)} total`} items={record.violations.details?.map((item) => ({ id: item.id, title: [item.class && `Class ${item.class}`, item.status].filter(Boolean).join(' · ') || 'Violation', description: item.description, meta: [item.sourceAgency, dateLabel(item.issuedAt), item.location].filter(Boolean).join(' · ') })) ?? []} />}
            {hasComplaints && <RecordSection title="Complaints" summary={`${countLabel(record.complaints.openCount)} open · ${countLabel(record.complaints.totalCount)} total`} items={record.complaints.details?.map((item) => ({ id: item.id, title: [item.category, item.status].filter(Boolean).join(' · ') || 'Complaint', description: item.description, meta: [item.sourceAgency, dateLabel(item.receivedAt)].filter(Boolean).join(' · ') })) ?? []} />}
            {hasVacates && <RecordSection title="Vacate orders" summary={`${countLabel(record.vacateOrders.activeCount)} active · ${countLabel(record.vacateOrders.totalCount)} total`} items={record.vacateOrders.details?.map((item) => ({ id: item.id, title: item.status ?? 'Vacate order', description: item.description, meta: [item.sourceAgency, dateLabel(item.issuedAt)].filter(Boolean).join(' · ') })) ?? []} />}
            {record.bedbugHistory?.length ? (
              <details className="record-disclosure">
                <summary><span><strong>Bedbug history</strong><small>{record.bedbugHistory.length} reporting {record.bedbugHistory.length === 1 ? 'period' : 'periods'}</small></span><ChevronDown aria-hidden="true" /></summary>
                <dl className="bedbug-history">
                  {record.bedbugHistory.map((entry) => (
                    <div key={entry.reportingPeriod}>
                      <dt>{entry.reportingPeriod}</dt>
                      <dd>{entry.infestationCount ?? 'Unavailable'} infestations · {entry.eradicationCount ?? 'Unavailable'} eradications · {entry.reinfestationCount ?? 'Unavailable'} reinfestations</dd>
                      <dd>{entry.filingStatus ?? 'Status unavailable'}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            ) : null}
          </div>
        </section>

        <section className="building-section building-location" aria-labelledby="location-title">
          <div className="building-section__heading">
            <div>
              <h2 id="location-title">Location</h2>
              <p>Coordinates supplied by the generated public-record data.</p>
            </div>
          </div>
          <BuildingLocationMap building={building} />
        </section>

        {related.length > 0 && (
          <section className="building-section" aria-labelledby="related-title">
            <div className="building-section__heading"><div><h2 id="related-title">Related Stabili records</h2><p>Other records linked by the generated dataset.</p></div></div>
            <div className="related-records">
              {related.map((item) => (
                <button key={item.id} type="button" onClick={() => onSelectBuilding(item.id)}>
                  <span>{item.address ?? 'Address unavailable'}</span>
                  <small>{displayBorough(item.borough)}{item.zipCode ? ` · ${item.zipCode}` : ''}</small>
                </button>
              ))}
            </div>
          </section>
        )}

        <details className="source-details">
          <summary><span>Source data and identifiers</span><ChevronDown aria-hidden="true" /></summary>
          <div className="source-details__content">
            <div>
              <h2>Stabilization source</h2>
              <p className="source-details__status">{record.stabilizationStatus ?? 'Stabilization status unavailable'}</p>
              <dl className="metadata-grid">
                <Fact label="Agency" value={record.source.agency} />
                <Fact label="Dataset" value={record.source.datasetName} />
                {record.source.sourceYear !== null && <Fact label="Source year" value={record.source.sourceYear} />}
                {record.source.sourceFile && <Fact label="Source location" value={`${record.source.sourceFile}${record.source.sourcePage ? `, page ${record.source.sourcePage}` : ''}`} />}
                {record.propertyMatch.method && <Fact label="Property match" value={record.propertyMatch.method} />}
                {record.propertyMatch.reviewNote && <Fact label="Match note" value={record.propertyMatch.reviewNote} />}
              </dl>
              {record.source.sourceUrl && <a href={record.source.sourceUrl} target="_blank" rel="noreferrer" className="source-link">Open official source <ExternalLink aria-hidden="true" /></a>}
            </div>
            {(hasIdentifiers || hasBuildingAttributes) && (
              <div>
                <h2>Identifiers and attributes</h2>
                <dl className="metadata-grid metadata-grid--identifiers">
                  {Object.entries({ BBL: record.identifiers.bbl, BIN: record.identifiers.bin, Block: record.identifiers.block, Lot: record.identifiers.lot, 'HPD building ID': record.identifiers.hpdBuildingId }).filter(([, value]) => present(value)).map(([label, value]) => <Fact key={label} label={label} value={value as string | number} mono />)}
                  {present(record.building?.buildingClass) && <Fact label="Building class" value={record.building?.buildingClass} />}
                  {present(record.building?.totalUnits) && <Fact label="Total units" value={record.building?.totalUnits} />}
                </dl>
              </div>
            )}
          </div>
        </details>

        <footer className="building-record-footer">
          Stabili ID {record.id}{record.freshness.generatedAt ? ` · Generated ${dateLabel(record.freshness.generatedAt)}` : ''}
        </footer>
      </article>

      <div className="building-mobile-actions" aria-label="Building actions">
        <button type="button" onClick={scrollToManagement} className="st-button st-button--primary"><Mail className="h-4 w-4" aria-hidden="true" /> Contact</button>
        {onToggleSave && <button type="button" onClick={onToggleSave} aria-pressed={isSaved} className="st-button st-button--secondary">{isSaved ? <BookmarkCheck className="h-4 w-4" aria-hidden="true" /> : <Bookmark className="h-4 w-4" aria-hidden="true" />}{isSaved ? 'Saved' : 'Save'}</button>}
      </div>
    </PageContainer>
  );
};

const Fact: React.FC<{ label: string; value: React.ReactNode; detail?: string; mono?: boolean }> = ({ label, value, detail, mono = false }) => (
  <div className="building-fact">
    <dt>{label}</dt>
    <dd className={mono ? 'building-fact__mono' : undefined}>{value}</dd>
    {detail && <dd className="building-fact__detail">{detail}</dd>}
  </div>
);

const RecordSection: React.FC<{ title: string; summary: string; items: RecordItem[] }> = ({ title, summary, items }) => (
  <details className="record-disclosure">
    <summary>
      <span><strong>{title}</strong><small>{summary}</small></span>
      <ChevronDown aria-hidden="true" />
    </summary>
    <div className="record-list">
      {items.length > 0 ? items.map((item) => (
        <article key={item.id} className="record-row">
          <span className="record-row__marker" aria-hidden="true" />
          <div>
            <h3>{item.title}</h3>
            {item.meta && <p className="record-row__meta">{item.meta}</p>}
            {item.description && <p className="record-row__description">{item.description}</p>}
          </div>
        </article>
      )) : <p className="building-empty-note">Detailed records are unavailable in the generated dataset.</p>}
    </div>
  </details>
);
