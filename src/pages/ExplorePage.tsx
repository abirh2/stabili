import React, { useEffect, useMemo, useState } from 'react';
import { Building2, List, Map as MapIcon, RotateCcw } from 'lucide-react';
import { EmptyState, FilterChip, PublicRecordErrorState, SearchBar, SearchResultSkeleton } from '../components/common';
import { BuildingCard } from '../components/explore/BuildingCard';
import { ExploreMap } from '../components/explore/ExploreMap';
import { indexToBuilding } from '../data/adapters';
import { loadBuildingIndex } from '../data/client';
import type { StabiliIndexRecord } from '../data/schema';
import type { Route } from '../types';

interface ExplorePageProps {
  onSelectBuilding: (id: string) => void;
  onSelectManagement: (id: string) => void;
  onNavigate: (route: Route) => void;
  savedBuildingIds: string[];
  onToggleSaveBuilding: (id: string) => void;
}

const boroughLabels: Record<StabiliIndexRecord['borough'], string> = {
  bronx: 'Bronx', brooklyn: 'Brooklyn', manhattan: 'Manhattan', queens: 'Queens', staten_island: 'Staten Island',
};
const healthLabels: Record<StabiliIndexRecord['healthState'], string> = {
  low_concern: 'Low concern', some_concerns: 'Some concerns', higher_concern: 'Higher concern', insufficient_data: 'Not enough data',
};
const DISPLAY_LIMIT = 100;

export const ExplorePage: React.FC<ExplorePageProps> = ({
  onSelectBuilding,
  savedBuildingIds,
  onToggleSaveBuilding,
}) => {
  const [records, setRecords] = useState<StabiliIndexRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [borough, setBorough] = useState('All');
  const [zip, setZip] = useState('All');
  const [health, setHealth] = useState('All');
  const [management, setManagement] = useState('All');
  const [matchStatus, setMatchStatus] = useState('All');
  const [sortBy, setSortBy] = useState<'default' | 'units-desc' | 'year-desc' | 'violations-asc'>('default');
  const [desktopLayout, setDesktopLayout] = useState<'split' | 'list'>('split');
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches);
  const [activeBuildingId, setActiveBuildingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(false);
    loadBuildingIndex()
      .then(setRecords)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const updateLayout = (event: MediaQueryListEvent | MediaQueryList) => setIsDesktop(event.matches);
    updateLayout(mediaQuery);
    mediaQuery.addEventListener('change', updateLayout);
    return () => mediaQuery.removeEventListener('change', updateLayout);
  }, []);

  const zips = useMemo(() => Array.from(new Set(records.map((record) => record.zipCode).filter((value): value is string => Boolean(value)))).sort(), [records]);
  const hasFilters = Boolean(searchQuery.trim() || borough !== 'All' || zip !== 'All' || health !== 'All' || management !== 'All' || matchStatus !== 'All');

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    const result = records.filter((record) => {
      if (query && ![
        record.address,
        boroughLabels[record.borough],
        record.zipCode,
        record.managementName,
        record.ownerName,
      ].some((value) => value?.toLocaleLowerCase().includes(query))) return false;
      if (borough !== 'All' && boroughLabels[record.borough] !== borough) return false;
      if (zip !== 'All' && record.zipCode !== zip) return false;
      if (health !== 'All' && healthLabels[record.healthState] !== health) return false;
      if (management === 'Name available' && !record.managementName) return false;
      if (management === 'Name unavailable' && record.managementName) return false;
      if (matchStatus !== 'All' && record.propertyMatchStatus !== matchStatus) return false;
      return true;
    });
    result.sort((a, b) => {
      if (sortBy === 'units-desc') return (b.residentialUnits ?? -1) - (a.residentialUnits ?? -1);
      if (sortBy === 'year-desc') return (b.yearBuilt ?? -1) - (a.yearBuilt ?? -1);
      if (sortBy === 'violations-asc') return (a.openViolationCount ?? Number.MAX_SAFE_INTEGER) - (b.openViolationCount ?? Number.MAX_SAFE_INTEGER);
      return 0;
    });
    return result;
  }, [records, searchQuery, borough, zip, health, management, matchStatus, sortBy]);

  const visibleBuildings = useMemo(() => filtered.slice(0, DISPLAY_LIMIT).map(indexToBuilding), [filtered]);

  const reset = () => {
    setSearchQuery(''); setBorough('All'); setZip('All'); setHealth('All'); setManagement('All'); setMatchStatus('All');
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#F8F9FA] text-slate-800">
      <section className="pt-20 md:pt-24 pb-4 px-4 sm:px-6 md:px-8 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="max-w-[1240px] mx-auto w-full">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Find rent-stabilized buildings in NYC.</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1 max-w-2xl">Explore generated public records and available owner or management information.</p>
          <div className="mt-4 w-full max-w-3xl">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search an address, borough, ZIP code, or management name" size="lg" />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <FilterChip label="Borough" options={['All', 'Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island']} selectedValue={borough} onSelect={setBorough} />
            <FilterChip label="Building health" options={['All', 'Low concern', 'Some concerns', 'Higher concern', 'Not enough data']} selectedValue={health} onSelect={setHealth} />
            <FilterChip label="Management" options={['All', 'Name available', 'Name unavailable']} selectedValue={management} onSelect={setManagement} />
            <label className="inline-flex items-center gap-1.5 bg-white border border-slate-200/90 rounded-full px-3 py-1.5 text-xs text-slate-600">
              ZIP
              <select value={zip} onChange={(event) => setZip(event.target.value)} className="bg-transparent font-medium outline-none max-w-24">
                <option>All</option>{zips.map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
            <label className="inline-flex items-center gap-1.5 bg-white border border-slate-200/90 rounded-full px-3 py-1.5 text-xs text-slate-600">
              Record match
              <select value={matchStatus} onChange={(event) => setMatchStatus(event.target.value)} className="bg-transparent font-medium outline-none">
                <option value="All">All</option><option value="matched">Matched</option><option value="ambiguous">Ambiguous</option>
              </select>
            </label>
            {hasFilters && <button onClick={reset} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"><RotateCcw className="w-3 h-3" />Reset</button>}
          </div>
        </div>
      </section>

      <main className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 md:px-8 py-5">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><SearchResultSkeleton /><SearchResultSkeleton /><SearchResultSkeleton /><SearchResultSkeleton /></div>
        ) : error ? (
          <PublicRecordErrorState description="The generated Stabili index could not be loaded." onRetry={load} />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{filtered.length.toLocaleString()} buildings</h2>
                {filtered.length > DISPLAY_LIMIT && <p className="text-xs text-slate-500">Showing the first {DISPLAY_LIMIT}; narrow the filters to refine results.</p>}
              </div>
              <div className="flex items-center gap-2">
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium">
                  <option value="default">Source order</option><option value="units-desc">Most units</option><option value="year-desc">Newest built</option><option value="violations-asc">Fewest open violations</option>
                </select>
                <div className="flex md:hidden p-0.5 bg-slate-100 rounded-full border border-slate-200" aria-label="Explore view">
                  <button type="button" onClick={() => setMobileView('list')} className={`p-2 rounded-full ${mobileView === 'list' ? 'bg-white shadow-2xs' : ''}`} title="List view" aria-pressed={mobileView === 'list'}><List className="w-4 h-4" /></button>
                  <button type="button" onClick={() => setMobileView('map')} className={`p-2 rounded-full ${mobileView === 'map' ? 'bg-white shadow-2xs' : ''}`} title="Map view" aria-pressed={mobileView === 'map'}><MapIcon className="w-4 h-4" /></button>
                </div>
                <div className="hidden md:flex p-0.5 bg-slate-100 rounded-full border border-slate-200">
                  <button type="button" onClick={() => setDesktopLayout('split')} className={`p-2 rounded-full ${desktopLayout === 'split' ? 'bg-white shadow-2xs' : ''}`} title="List and map" aria-pressed={desktopLayout === 'split'}><MapIcon className="w-4 h-4" /></button>
                  <button type="button" onClick={() => setDesktopLayout('list')} className={`p-2 rounded-full ${desktopLayout === 'list' ? 'bg-white shadow-2xs' : ''}`} title="List only" aria-pressed={desktopLayout === 'list'}><List className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
            {visibleBuildings.length === 0 ? (
              <EmptyState icon={<Building2 className="w-6 h-6" />} title="No buildings match these filters" description="Try a different address, ZIP, borough, health state, or management filter." actionLabel="Clear filters" onAction={reset} />
            ) : (
              <div className={`grid grid-cols-1 ${desktopLayout === 'split' ? 'md:grid-cols-2' : ''} gap-5 items-start`}>
                {(isDesktop || mobileView === 'list') && <div className={`grid grid-cols-1 ${desktopLayout === 'list' ? 'md:grid-cols-2 lg:grid-cols-3' : ''} gap-4`}>
                  {visibleBuildings.map((building) => <BuildingCard key={building.id} building={building} isSelected={activeBuildingId === building.id} isSaved={savedBuildingIds.includes(building.id)} onSelect={onSelectBuilding} onToggleSave={onToggleSaveBuilding} onHover={setActiveBuildingId} />)}
                </div>}
                {((isDesktop && desktopLayout === 'split') || (!isDesktop && mobileView === 'map')) && <div className="h-[65svh] min-h-[460px] md:sticky md:top-20 md:h-[calc(100vh-7rem)]"><ExploreMap buildings={visibleBuildings} activeBuildingId={activeBuildingId} onSelectBuilding={onSelectBuilding} onHoverBuilding={setActiveBuildingId} /></div>}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
