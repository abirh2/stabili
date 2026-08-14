import React, { useEffect, useMemo, useState } from 'react';
import { Bookmark, Building2 } from 'lucide-react';
import { EmptyState, PageContainer, PublicRecordErrorState, SearchResultSkeleton, StatItem } from '../components/common';
import { BuildingCard } from '../components/explore/BuildingCard';
import { indexToBuilding } from '../data/adapters';
import { loadIndexRecords } from '../data/client';
import type { StabiliIndexRecord } from '../data/schema';
import type { Route } from '../types';

interface SavedPageProps {
  savedBuildingIds: string[];
  onToggleSaveBuilding: (id: string) => void;
  onSelectBuilding: (id: string) => void;
  onSelectManagement: (id: string) => void;
  onNavigate: (route: Route) => void;
}

export const SavedPage: React.FC<SavedPageProps> = ({ savedBuildingIds, onToggleSaveBuilding, onSelectBuilding, onNavigate }) => {
  const [records, setRecords] = useState<StabiliIndexRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const load = () => { setLoading(true); setError(false); loadIndexRecords(savedBuildingIds).then(setRecords).catch(() => setError(true)).finally(() => setLoading(false)); };
  useEffect(load, [savedBuildingIds]);
  const buildings = useMemo(() => records.map(indexToBuilding), [records]);
  const missingCount = savedBuildingIds.length - records.length;
  const knownUnits = records.map((record) => record.residentialUnits).filter((value): value is number => value !== null);

  return <PageContainer maxWidth="1200">
    <div className="mb-6"><h1 className="type-page-title">Saved buildings</h1><p className="type-metadata mt-1">Stored in this browser as Stabili IDs.</p></div>
    {loading ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><SearchResultSkeleton /><SearchResultSkeleton /></div> : error ? <PublicRecordErrorState description="Saved IDs could not be resolved against the generated index." onRetry={load} /> : buildings.length ? <>
      {missingCount > 0 && <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">{missingCount} saved {missingCount === 1 ? 'ID is' : 'IDs are'} no longer present after the latest dataset rebuild.</div>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"><div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">{buildings.map((building) => <BuildingCard key={building.id} building={building} isSaved onSelect={onSelectBuilding} onToggleSave={onToggleSaveBuilding} />)}</div><aside className="st-card st-card--raised p-5 sticky top-20 space-y-3"><h2 className="type-building-title">Saved overview</h2><StatItem label="Current records" value={records.length} /><StatItem label="Known residential units" value={knownUnits.length ? knownUnits.reduce((sum, value) => sum + value, 0).toLocaleString() : 'Unavailable'} /><StatItem label="Boroughs" value={new Set(records.map((record) => record.borough)).size} /></aside></div>
    </> : <EmptyState icon={<Bookmark className="w-6 h-6" />} title="No saved buildings yet" description={missingCount ? "Your previously saved IDs are not present in the current dataset." : "Save buildings while exploring Stabili so you can return to them here."} actionLabel="Explore buildings" onAction={() => onNavigate('explore')} />}
  </PageContainer>;
};
