import React, { useEffect, useMemo, useState } from 'react';
import { Briefcase, Building2 } from 'lucide-react';
import { ContactActions, EmptyState, ManagementProfileSkeleton, PageContainer, PublicRecordErrorState, SearchBar } from '../components/common';
import { BuildingCard } from '../components/explore/BuildingCard';
import { displayBorough, formatAddress, indexToBuilding } from '../data/adapters';
import { loadBuildingIndex, loadBuildingShard, managementNameFromKey } from '../data/client';
import type { ManagementInformation, StabiliIndexRecord } from '../data/schema';
import type { Route } from '../types';

interface ManagementProfilePageProps {
  managementId: string;
  onSelectBuilding: (id: string) => void;
  onNavigate: (route: Route) => void;
  savedBuildingIds?: string[];
  onToggleSaveBuilding?: (id: string) => void;
}

const DISPLAY_LIMIT = 100;

export const ManagementProfilePage: React.FC<ManagementProfilePageProps> = ({
  managementId,
  onSelectBuilding,
  onNavigate,
  savedBuildingIds = [],
  onToggleSaveBuilding = () => {},
}) => {
  const managementName = managementNameFromKey(managementId);
  const [records, setRecords] = useState<StabiliIndexRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [contact, setContact] = useState<ManagementInformation | null | undefined>(undefined);

  const load = () => {
    if (!managementName) { setLoading(false); return; }
    setLoading(true); setError(false);
    loadBuildingIndex()
      .then((index) => setRecords(index.filter((record) => record.managementName === managementName)))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };
  useEffect(load, [managementName]);

  useEffect(() => {
    let cancelled = false;
    setContact(undefined);
    if (!managementName || records.length === 0) return () => { cancelled = true; };

    const detailFiles = Array.from(new Set<string>(records.map((record) => record.detailFile)));
    void (async () => {
      let fallback: ManagementInformation | null = null;
      for (const detailFile of detailFiles) {
        try {
          const shard = await loadBuildingShard(detailFile);
          const matching = shard
            .map((record) => record.management)
            .filter((management): management is ManagementInformation => management?.managingAgentName === managementName);
          fallback ??= matching[0] ?? null;
          const directContact = matching.find((management) => Boolean(
            management.phone || management.email || management.website || management.businessAddress
          ));
          if (directContact) {
            if (!cancelled) setContact(directContact);
            return;
          }
        } catch {
          // Continue through remaining public-data shards when one cannot load.
        }
      }
      if (!cancelled) setContact(fallback);
    })();

    return () => { cancelled = true; };
  }, [managementName, records]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return records;
    return records.filter((record) => [record.address, record.zipCode, displayBorough(record.borough)].some((value) => value?.toLocaleLowerCase().includes(normalized)));
  }, [query, records]);
  const boroughCount = new Set(records.map((record) => record.borough)).size;

  if (loading) return <PageContainer backAction={{ label: 'Back to Explore', onBack: () => onNavigate('explore') }}><ManagementProfileSkeleton /></PageContainer>;
  if (error) return <PageContainer backAction={{ label: 'Back to Explore', onBack: () => onNavigate('explore') }}><PublicRecordErrorState description="The generated management index could not be loaded." onRetry={load} /></PageContainer>;
  if (!managementName || records.length === 0) return <PageContainer backAction={{ label: 'Back to Explore', onBack: () => onNavigate('explore') }}><EmptyState icon={<Briefcase className="w-6 h-6" />} title="Management profile not found" description="No exact management-name group exists for this ID in the current generated dataset." actionLabel="Return to Explore" onAction={() => onNavigate('explore')} /></PageContainer>;

  return (
    <PageContainer backAction={{ label: 'Back to Explore', onBack: () => onNavigate('explore') }}>
      <div className="management-profile">
        <header className="management-profile__hero">
          <div className="management-profile__identity">
            <p className="type-label">Management name on public records</p>
            <h1 className="type-page-title mt-1">{managementName}</h1>
            <p className="type-body text-secondary mt-3 max-w-2xl">This page groups records with the exact same management-name text. It does not establish that similarly named entities are the same legal organization.</p>
            <dl className="management-profile__summary" aria-label="Associated record summary">
              <div><dt>Associated records</dt><dd>{records.length.toLocaleString()}</dd></div>
              <div><dt>Boroughs represented</dt><dd>{boroughCount.toLocaleString()}</dd></div>
            </dl>
          </div>

          <section className="management-profile__contact" aria-labelledby="management-contact-heading">
            <h2 id="management-contact-heading" className="type-section-title">Contact information</h2>
            {contact === undefined ? (
              <p className="type-metadata mt-2" role="status">Checking associated public registrations…</p>
            ) : contact && (contact.phone || contact.email || contact.website || contact.businessAddress) ? (
              <>
                <ContactActions
                  phone={contact.phone}
                  email={contact.email}
                  website={contact.website}
                  businessMailingAddress={formatAddress(contact.businessAddress)}
                  variant="rows"
                  subject={`Question about ${managementName}`}
                />
                <p className="type-caption mt-3">Shown from an associated public building registration. Contact details can differ by building and filing.</p>
              </>
            ) : (
              <p className="type-metadata mt-2">No phone, email, website, or business address was available in the associated generated records.</p>
            )}
          </section>
        </header>

        <section className="management-profile__buildings" aria-labelledby="associated-buildings-heading">
          <div className="record-list-heading">
            <div>
              <h2 id="associated-buildings-heading" className="type-section-title">Associated building records</h2>
              <p className="type-metadata mt-1">Showing {Math.min(filtered.length, DISPLAY_LIMIT).toLocaleString()} of {filtered.length.toLocaleString()} matching records</p>
            </div>
            <div className="record-list-heading__search"><SearchBar value={query} onChange={setQuery} placeholder="Search address, borough, or ZIP" /></div>
          </div>
          {filtered.length ? <div className="explore-result-list border-t">{filtered.slice(0, DISPLAY_LIMIT).map((record) => { const building = indexToBuilding(record); return <BuildingCard key={record.id} building={building} isSaved={savedBuildingIds.includes(record.id)} onSelect={onSelectBuilding} onToggleSave={onToggleSaveBuilding} />; })}</div> : <EmptyState icon={<Building2 className="w-5 h-5" />} title="No associated records match" description="Try a different address, borough, or ZIP." actionLabel="Clear search" onAction={() => setQuery('')} />}
        </section>
      </div>
    </PageContainer>
  );
};
