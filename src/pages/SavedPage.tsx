import React, { useEffect, useMemo, useState } from 'react';
import { Bookmark } from 'lucide-react';
import { EmptyState, PageContainer, PublicRecordErrorState, SearchResultSkeleton } from '../components/common';
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
  const groupedBuildings = useMemo(() => {
    const groups = new Map<string, ReturnType<typeof indexToBuilding>[]>();
    buildings.forEach((building) => groups.set(building.borough, [...(groups.get(building.borough) ?? []), building]));
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [buildings]);

  return <PageContainer maxWidth="1200">
    <header className="saved-header"><h1 className="type-page-title">Saved buildings</h1><p className="type-body text-secondary mt-2 max-w-xl">A lightweight list of building records you want to revisit. Saved IDs stay in this browser and are not synced to an account.</p></header>
    {loading ? <div className="saved-loading"><SearchResultSkeleton /><SearchResultSkeleton /></div> : error ? <PublicRecordErrorState description="Saved IDs could not be resolved against the generated index." onRetry={load} /> : buildings.length ? <>
      {missingCount > 0 && <p className="saved-notice" role="status">{missingCount} saved {missingCount === 1 ? 'ID is' : 'IDs are'} no longer present after the latest dataset rebuild.</p>}
      <div className="saved-groups">{groupedBuildings.map(([borough, boroughBuildings]) => {
        const headingId = `saved-${borough.replaceAll(' ', '-').toLowerCase()}`;
        return <section key={borough} className="saved-group" aria-labelledby={headingId}>
          <div className="saved-group__heading">
            <h2 id={headingId} className="type-section-title">{borough}</h2>
            <span className="type-metadata">{boroughBuildings.length} {boroughBuildings.length === 1 ? 'building' : 'buildings'}</span>
          </div>
          <div className="explore-result-list border-t">{boroughBuildings.map((building) => <BuildingCard key={building.id} building={building} isSaved onSelect={onSelectBuilding} onToggleSave={onToggleSaveBuilding} />)}</div>
        </section>;
      })}</div>
    </> : <EmptyState icon={<Bookmark className="w-6 h-6" />} title="No saved buildings yet" description={missingCount ? "Your previously saved IDs are not present in the current dataset." : "Save a building record while exploring Stabili and it will appear here on this browser."} actionLabel="Explore buildings" onAction={() => onNavigate('explore')} />}
  </PageContainer>;
};
