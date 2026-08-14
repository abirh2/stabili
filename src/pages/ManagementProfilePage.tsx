import React, { useEffect, useMemo, useState } from 'react';
import { Briefcase, Building2 } from 'lucide-react';
import { EmptyState, ManagementProfileSkeleton, PageContainer, PublicRecordErrorState, SearchBar, SectionHeader, StatItem } from '../components/common';
import { BuildingCard } from '../components/explore/BuildingCard';
import { displayBorough, indexToBuilding } from '../data/adapters';
import { loadBuildingIndex, managementNameFromKey } from '../data/client';
import type { StabiliIndexRecord } from '../data/schema';
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

  const load = () => {
    if (!managementName) { setLoading(false); return; }
    setLoading(true); setError(false);
    loadBuildingIndex()
      .then((index) => setRecords(index.filter((record) => record.managementName === managementName)))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };
  useEffect(load, [managementName]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return records;
    return records.filter((record) => [record.address, record.zipCode, displayBorough(record.borough)].some((value) => value?.toLocaleLowerCase().includes(normalized)));
  }, [query, records]);
  const knownUnits = records.map((record) => record.residentialUnits).filter((value): value is number => value !== null);
  const boroughCount = new Set(records.map((record) => record.borough)).size;

  if (loading) return <PageContainer backAction={{ label: 'Back to Explore', onBack: () => onNavigate('explore') }}><ManagementProfileSkeleton /></PageContainer>;
  if (error) return <PageContainer backAction={{ label: 'Back to Explore', onBack: () => onNavigate('explore') }}><PublicRecordErrorState description="The generated management index could not be loaded." onRetry={load} /></PageContainer>;
  if (!managementName || records.length === 0) return <PageContainer backAction={{ label: 'Back to Explore', onBack: () => onNavigate('explore') }}><EmptyState icon={<Briefcase className="w-6 h-6" />} title="Management profile not found" description="No exact management-name group exists for this ID in the current generated dataset." actionLabel="Return to Explore" onAction={() => onNavigate('explore')} /></PageContainer>;

  return (
    <PageContainer backAction={{ label: 'Back to Explore', onBack: () => onNavigate('explore') }}>
      <div className="space-y-7">
        <header className="st-card st-card--raised p-5 sm:p-7">
          <span className="type-label">Management name on public records</span>
          <h1 className="type-page-title mt-1">{managementName}</h1>
          <p className="type-metadata mt-2 max-w-2xl">Associated records are grouped by exact management-name text. This does not assert that similarly named entities are the same legal organization.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
            <StatItem label="Associated records" value={records.length.toLocaleString()} />
            <StatItem label="Boroughs represented" value={boroughCount} />
            <StatItem label="Known residential units" value={knownUnits.length ? knownUnits.reduce((sum, value) => sum + value, 0).toLocaleString() : 'Unavailable'} />
          </div>
        </header>

        <section>
          <SectionHeader title="Associated building records" subtitle={`Showing ${Math.min(filtered.length, DISPLAY_LIMIT).toLocaleString()} of ${filtered.length.toLocaleString()} matching records`} icon={<Building2 className="w-4 h-4" />} />
          <div className="max-w-xl mb-4"><SearchBar value={query} onChange={setQuery} placeholder="Search associated records by address, borough, or ZIP" /></div>
          {filtered.length ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{filtered.slice(0, DISPLAY_LIMIT).map((record) => { const building = indexToBuilding(record); return <BuildingCard key={record.id} building={building} isSaved={savedBuildingIds.includes(record.id)} onSelect={onSelectBuilding} onToggleSave={onToggleSaveBuilding} />; })}</div> : <EmptyState icon={<Building2 className="w-5 h-5" />} title="No associated records match" description="Try a different address, borough, or ZIP." actionLabel="Clear search" onAction={() => setQuery('')} />}
        </section>
      </div>
    </PageContainer>
  );
};
