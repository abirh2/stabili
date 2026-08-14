import React, { useEffect, useState } from 'react';
import { AlertTriangle, Bookmark, BookmarkCheck, Building2, Bug, ClipboardList, ExternalLink, Home, MapPin, ShieldCheck, UserRound, Wind } from 'lucide-react';
import {
  Badge,
  BuildingDetailsSkeleton,
  BuildingHealthStatus,
  ContactActions,
  EmptyState,
  PageContainer,
  PublicRecordErrorState,
  SectionHeader,
  StatItem,
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

const present = (value: unknown): value is string | number => value !== null && value !== undefined && value !== '';
const dateLabel = (value: string | null) => value ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(`${value.slice(0, 10)}T00:00:00`)) : null;
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
    setLoading(true); setError(false); setRecord(null); setRelated([]);
    loadBuilding(buildingId)
      .then(async (result) => {
        setRecord(result);
        if (result?.relatedStabiliRecordIds.length) setRelated(await loadIndexRecords(result.relatedStabiliRecordIds));
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
  const hasBuildingAttributes = record.building && Object.values(record.building).some(present);
  const hasIdentifiers = Object.values(record.identifiers).some(present);
  const hasManagement = Boolean(management && (
    management.managingAgentName || management.managingAgentId || management.registeredOwnerName
    || management.phone || management.email || management.website || formatAddress(management.businessAddress)
  ));
  const hasViolations = record.violations.totalCount !== null || Boolean(record.violations.details?.length);
  const hasComplaints = record.complaints.totalCount !== null || Boolean(record.complaints.details?.length);
  const hasVacates = record.vacateOrders.totalCount !== null || Boolean(record.vacateOrders.details?.length);

  return (
    <PageContainer
      backAction={{ label: 'Back to Explore', onBack: () => onNavigate('explore') }}
      headerRight={onToggleSave && <button onClick={onToggleSave} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${isSaved ? 'bg-teal-50 border-teal-200 text-teal-800' : 'bg-white border-slate-200 text-slate-600'}`}>{isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}{isSaved ? 'Saved' : 'Save'}</button>}
    >
      <div className="space-y-7">
        <header className="st-card st-card--raised p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="stabilized">DHCR stabilization record</Badge>
            {record.propertyMatch.status === 'ambiguous' && <Badge variant="health-fair">Ambiguous property match</Badge>}
          </div>
          <h1 className="type-page-title">{building.address}</h1>
          <p className="type-metadata mt-1">{displayBorough(record.primaryAddress.borough)}{record.primaryAddress.zipCode ? ` · ZIP ${record.primaryAddress.zipCode}` : ''}</p>
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatItem label="Residential units" value={countLabel(record.building?.residentialUnits ?? null)} />
            <StatItem label="Year built" value={record.building?.yearBuilt ?? 'Unavailable'} />
            <StatItem label="Stories" value={record.building?.stories ?? 'Unavailable'} />
            <StatItem label="Open violations" value={countLabel(record.violations.openCount)} />
          </div>
          <div className="mt-4"><BuildingHealthStatus health={building.health} variant="card" showDescription /></div>
        </header>

        <section className="st-card st-card--raised p-5 sm:p-6">
          <SectionHeader title="Building location" subtitle="Location supplied by the generated public-record data." icon={<MapPin className="w-4 h-4" />} />
          <BuildingLocationMap building={building} />
        </section>

        <section className="st-card st-card--raised p-5 sm:p-6">
          <SectionHeader title="Stabilization source" icon={<ShieldCheck className="w-4 h-4" />} />
          <p className="text-sm font-medium text-slate-900">{record.stabilizationStatus ?? 'Stabilization status unavailable'}</p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mt-4 text-xs">
            <div><dt className="text-slate-400 uppercase tracking-wider">Agency</dt><dd className="text-slate-800 mt-0.5">{record.source.agency}</dd></div>
            <div><dt className="text-slate-400 uppercase tracking-wider">Dataset</dt><dd className="text-slate-800 mt-0.5">{record.source.datasetName}</dd></div>
            {record.source.sourceYear !== null && <div><dt className="text-slate-400 uppercase tracking-wider">Source year</dt><dd className="text-slate-800 mt-0.5">{record.source.sourceYear}</dd></div>}
            {record.source.sourceFile && <div><dt className="text-slate-400 uppercase tracking-wider">Source location</dt><dd className="text-slate-800 mt-0.5">{record.source.sourceFile}{record.source.sourcePage ? `, page ${record.source.sourcePage}` : ''}</dd></div>}
          </dl>
          {record.source.sourceUrl && <a href={record.source.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-4 text-xs font-medium text-teal-700">Open official source <ExternalLink className="w-3 h-3" /></a>}
        </section>

        {(record.classifications.length > 0 || hasBuildingAttributes || hasIdentifiers) && <section className="st-card st-card--raised p-5 sm:p-6">
          <SectionHeader title="Official classifications and building attributes" icon={<Home className="w-4 h-4" />} />
          {record.classifications.length > 0 && <div className="flex flex-wrap gap-2 mb-5">{record.classifications.map((classification) => <Badge key={classification} variant="neutral">{classification}</Badge>)}</div>}
          {hasBuildingAttributes && <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {present(record.building?.buildingClass) && <StatItem label="Building class" value={record.building?.buildingClass} />}
            {present(record.building?.totalUnits) && <StatItem label="Total units" value={record.building?.totalUnits} />}
            {present(record.building?.ownershipType) && <StatItem label="Ownership type" value={record.building?.ownershipType} valueClassName="text-sm" />}
          </dl>}
          {hasIdentifiers && <dl className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 text-xs">
            {Object.entries({ BBL: record.identifiers.bbl, BIN: record.identifiers.bin, Block: record.identifiers.block, Lot: record.identifiers.lot, 'HPD building ID': record.identifiers.hpdBuildingId }).filter(([, value]) => present(value)).map(([label, value]) => <div key={label} className="p-3 bg-slate-50 rounded-xl"><dt className="text-slate-400">{label}</dt><dd className="font-mono text-slate-800 mt-0.5">{value}</dd></div>)}
          </dl>}
        </section>}

        {hasManagement && <section className="st-card st-card--raised p-5 sm:p-6">
          <SectionHeader title="Owner and managing agent" icon={<UserRound className="w-4 h-4" />} action={management?.managingAgentName ? <button onClick={() => onSelectManagement(managementKey(management.managingAgentName!))} className="text-xs font-medium text-teal-700 hover:text-teal-900">View associated records</button> : undefined} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {management?.managingAgentName && <div className="p-4 bg-slate-50 rounded-xl"><span className="text-[10px] text-slate-400 uppercase tracking-wider">Managing agent</span><p className="text-sm font-semibold text-slate-900 mt-1">{management.managingAgentName}</p>{management.managingAgentId && <p className="text-xs text-slate-500 mt-0.5">HPD registration ID {management.managingAgentId}</p>}</div>}
            {management?.registeredOwnerName && <div className="p-4 bg-slate-50 rounded-xl"><span className="text-[10px] text-slate-400 uppercase tracking-wider">Registered owner</span><p className="text-sm font-semibold text-slate-900 mt-1">{management.registeredOwnerName}</p></div>}
          </div>
          <ContactActions variant="pills" phone={management?.phone} email={management?.email} website={management?.website} businessMailingAddress={formatAddress(management?.businessAddress ?? null)} />
        </section>}

        {hasViolations && <RecordSection title="Current and recent violations" icon={<AlertTriangle className="w-4 h-4" />} summary={`${countLabel(record.violations.openCount)} open · ${countLabel(record.violations.totalCount)} total`} items={record.violations.details?.map((item) => ({ id: item.id, title: [item.class && `Class ${item.class}`, item.status].filter(Boolean).join(' · ') || 'Violation', description: item.description, meta: [item.sourceAgency, dateLabel(item.issuedAt), item.location].filter(Boolean).join(' · ') })) ?? []} />}
        {hasComplaints && <RecordSection title="Complaints" icon={<ClipboardList className="w-4 h-4" />} summary={`${countLabel(record.complaints.openCount)} open · ${countLabel(record.complaints.totalCount)} total`} items={record.complaints.details?.map((item) => ({ id: item.id, title: [item.category, item.status].filter(Boolean).join(' · ') || 'Complaint', description: item.description, meta: [item.sourceAgency, dateLabel(item.receivedAt)].filter(Boolean).join(' · ') })) ?? []} />}

        {record.bedbugHistory?.length ? <section className="st-card st-card--raised p-5 sm:p-6">
          <SectionHeader title="Bedbug history" icon={<Bug className="w-4 h-4" />} />
          <div className="overflow-x-auto"><table className="w-full text-xs"><thead className="text-left text-slate-400 border-b"><tr><th className="py-2">Reporting period</th><th>Infestations</th><th>Eradications</th><th>Reinfestations</th><th>Status</th></tr></thead><tbody>{record.bedbugHistory.map((entry) => <tr key={entry.reportingPeriod} className="border-b border-slate-100"><td className="py-3 font-medium">{entry.reportingPeriod}</td><td>{entry.infestationCount ?? 'Unavailable'}</td><td>{entry.eradicationCount ?? 'Unavailable'}</td><td>{entry.reinfestationCount ?? 'Unavailable'}</td><td>{entry.filingStatus ?? 'Unavailable'}</td></tr>)}</tbody></table></div>
        </section> : null}

        {hasVacates && <RecordSection title="Vacate information" icon={<Wind className="w-4 h-4" />} summary={`${countLabel(record.vacateOrders.activeCount)} active · ${countLabel(record.vacateOrders.totalCount)} total`} items={record.vacateOrders.details?.map((item) => ({ id: item.id, title: item.status ?? 'Vacate order', description: item.description, meta: [item.sourceAgency, dateLabel(item.issuedAt)].filter(Boolean).join(' · ') })) ?? []} />}

        {related.length > 0 && <section className="st-card st-card--raised p-5 sm:p-6">
          <SectionHeader title="Related Stabili records" subtitle="Relationships supplied by the generated dataset." icon={<Building2 className="w-4 h-4" />} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{related.map((item) => <button key={item.id} onClick={() => onSelectBuilding(item.id)} className="p-4 text-left bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200"><span className="text-sm font-semibold text-slate-900">{item.address ?? 'Address unavailable'}</span><span className="text-xs text-slate-500 block mt-1">{displayBorough(item.borough)}{item.zipCode ? ` · ${item.zipCode}` : ''}</span></button>)}</div>
        </section>}

        <p className="text-[11px] text-slate-400 text-center">Stabili ID {record.id}{record.freshness.generatedAt ? ` · Generated ${dateLabel(record.freshness.generatedAt)}` : ''}</p>
      </div>
    </PageContainer>
  );
};

interface RecordItem { id: string; title: string; description: string | null; meta: string; }
const RecordSection: React.FC<{ title: string; icon: React.ReactNode; summary: string; items: RecordItem[] }> = ({ title, icon, summary, items }) => (
  <section className="st-card st-card--raised p-5 sm:p-6">
    <SectionHeader title={title} icon={icon} badge={<Badge variant="neutral">{summary}</Badge>} />
    {items.length > 0 ? <div className="space-y-3">{items.map((item) => <article key={item.id} className="p-4 bg-slate-50/80 rounded-xl border border-slate-100"><h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>{item.meta && <p className="text-[11px] text-slate-400 mt-0.5">{item.meta}</p>}{item.description && <p className="text-xs text-slate-600 leading-relaxed mt-2">{item.description}</p>}</article>)}</div> : <p className="text-xs text-slate-500">Detailed records are unavailable in the generated dataset.</p>}
  </section>
);
