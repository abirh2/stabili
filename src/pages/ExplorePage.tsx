import React, { useState, useMemo } from 'react';
import { 
  FilterChip, 
  Button, 
  SearchBar, 
  EmptyState 
} from '../components/common';
import { SAMPLE_BUILDINGS } from '../data/sampleData';
import { Route, BuildingRecord } from '../types';
import { BuildingCard } from '../components/explore/BuildingCard';
import { ExploreMap } from '../components/explore/ExploreMap';
import { MobileFilterSheet } from '../components/explore/MobileFilterSheet';
import { MoreFiltersModal } from '../components/explore/MoreFiltersModal';
import { 
  Building2, 
  Map as MapIcon, 
  List as ListIcon, 
  SlidersHorizontal, 
  RotateCcw,
  ShieldCheck,
  Phone,
  X
} from 'lucide-react';

interface ExplorePageProps {
  onSelectBuilding: (id: string) => void;
  onSelectManagement: (id: string) => void;
  onNavigate: (route: Route) => void;
  savedBuildingIds: string[];
  onToggleSaveBuilding: (id: string) => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({
  onSelectBuilding,
  onSelectManagement,
  onNavigate,
  savedBuildingIds,
  onToggleSaveBuilding,
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBorough, setSelectedBorough] = useState('All');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('All');
  const [selectedZip, setSelectedZip] = useState('All');
  const [selectedMinUnits, setSelectedMinUnits] = useState('All');
  const [selectedCondition, setSelectedCondition] = useState('All');
  
  // More Filters state
  const [selectedViolationFilter, setSelectedViolationFilter] = useState('All');
  const [noClassCViolationsOnly, setNoClassCViolationsOnly] = useState(false);
  const [managementContactOnly, setManagementContactOnly] = useState(false);
  const [selectedEra, setSelectedEra] = useState('All');
  const [selectedStories, setSelectedStories] = useState('All');
  
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
  const [isMobileFilterSheetOpen, setIsMobileFilterSheetOpen] = useState(false);

  // Layout View Mode State
  // Desktop: 'split' (List + Map) vs 'list' (List only)
  const [desktopLayout, setDesktopLayout] = useState<'split' | 'list'>('split');
  // Mobile: 'list' vs 'map'
  const [mobileTab, setMobileTab] = useState<'list' | 'map'>('list');

  // Sorting
  const [sortBy, setSortBy] = useState<'default' | 'units-desc' | 'year-desc' | 'violations-asc'>('default');

  // Active highlighted building for map synchronization
  const [activeBuildingId, setActiveBuildingId] = useState<string | null>(SAMPLE_BUILDINGS[0]?.id || null);

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedBorough !== 'All') count++;
    if (selectedNeighborhood !== 'All') count++;
    if (selectedZip !== 'All') count++;
    if (selectedMinUnits !== 'All') count++;
    if (selectedCondition !== 'All') count++;
    if (selectedViolationFilter !== 'All') count++;
    if (noClassCViolationsOnly) count++;
    if (managementContactOnly) count++;
    if (selectedEra !== 'All') count++;
    if (selectedStories !== 'All') count++;
    return count;
  }, [
    selectedBorough, 
    selectedNeighborhood, 
    selectedZip, 
    selectedMinUnits, 
    selectedCondition, 
    selectedViolationFilter, 
    noClassCViolationsOnly, 
    managementContactOnly, 
    selectedEra, 
    selectedStories
  ]);

  // Secondary/More filters count for badge on the "More filters" button
  const moreFiltersActiveCount = useMemo(() => {
    let count = 0;
    if (selectedZip !== 'All') count++;
    if (selectedViolationFilter !== 'All') count++;
    if (noClassCViolationsOnly) count++;
    if (managementContactOnly) count++;
    if (selectedEra !== 'All') count++;
    if (selectedStories !== 'All') count++;
    return count;
  }, [
    selectedZip,
    selectedViolationFilter,
    noClassCViolationsOnly,
    managementContactOnly,
    selectedEra,
    selectedStories
  ]);

  const handleResetFilters = () => {
    setSelectedBorough('All');
    setSelectedNeighborhood('All');
    setSelectedZip('All');
    setSelectedMinUnits('All');
    setSelectedCondition('All');
    setSelectedViolationFilter('All');
    setNoClassCViolationsOnly(false);
    setManagementContactOnly(false);
    setSelectedEra('All');
    setSelectedStories('All');
    setSearchQuery('');
  };

  const handleResetMoreFilters = () => {
    setSelectedZip('All');
    setSelectedViolationFilter('All');
    setNoClassCViolationsOnly(false);
    setManagementContactOnly(false);
    setSelectedEra('All');
    setSelectedStories('All');
  };

  // Filter sample buildings
  const filteredBuildings = useMemo(() => {
    return SAMPLE_BUILDINGS.filter((building) => {
      // Text Search matching address, neighborhood, borough, ZIP, or management
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesAddress = building.address.toLowerCase().includes(q);
        const matchesSecondary = building.secondaryAddress ? building.secondaryAddress.toLowerCase().includes(q) : false;
        const matchesAlternates = building.alternateAddresses ? building.alternateAddresses.some(a => a.toLowerCase().includes(q)) : false;
        const matchesComplex = building.complexName ? building.complexName.toLowerCase().includes(q) : false;
        const matchesNeighborhood = building.neighborhood.toLowerCase().includes(q);
        const matchesBorough = building.borough.toLowerCase().includes(q);
        const matchesZip = building.zipCode.toLowerCase().includes(q);
        const matchesMgmt = building.managingAgent ? building.managingAgent.toLowerCase().includes(q) : false;

        if (!matchesAddress && !matchesSecondary && !matchesAlternates && !matchesComplex && !matchesNeighborhood && !matchesBorough && !matchesZip && !matchesMgmt) {
          return false;
        }
      }

      // Borough
      if (selectedBorough !== 'All' && building.borough !== selectedBorough) {
        return false;
      }

      // Neighborhood
      if (selectedNeighborhood !== 'All' && building.neighborhood !== selectedNeighborhood) {
        return false;
      }

      // ZIP Code
      if (selectedZip !== 'All' && building.zipCode !== selectedZip) {
        return false;
      }

      // Minimum residential units
      if (selectedMinUnits !== 'All') {
        const units = building.units ?? 0;
        if (selectedMinUnits === '10+ units' && units < 10) return false;
        if (selectedMinUnits === '25+ units' && units < 25) return false;
        if (selectedMinUnits === '50+ units' && units < 50) return false;
        if (selectedMinUnits === '75+ units' && units < 75) return false;
      }

      // Building Health Condition
      if (selectedCondition !== 'All' && building.health !== selectedCondition) {
        return false;
      }

      // Open Violations Filter
      if (selectedViolationFilter !== 'All') {
        const violations = building.openViolationsCount ?? 0;
        if (selectedViolationFilter === 'Zero Violations' && violations > 0) return false;
        if (selectedViolationFilter === 'Under 5 Violations' && violations >= 5) return false;
        if (selectedViolationFilter === 'Under 10 Violations' && violations >= 10) return false;
      }

      // No Class C (Immediately hazardous)
      if (noClassCViolationsOnly && (building.classCViolationsCount ?? 0) > 0) {
        return false;
      }

      // Direct Contact available
      if (managementContactOnly) {
        const hasPhone = Boolean(building.phone);
        const hasEmail = Boolean(building.email);
        const hasWeb = Boolean(building.website);
        if (!hasPhone && !hasEmail && !hasWeb) return false;
      }

      // Construction Era
      if (selectedEra !== 'All') {
        if (!building.yearBuilt) return false;
        if (selectedEra === 'Pre-War (Before 1940)' && building.yearBuilt >= 1940) return false;
        if (selectedEra === 'Mid-Century (1940-1970)' && (building.yearBuilt < 1940 || building.yearBuilt > 1970)) return false;
        if (selectedEra === 'Modern (1970+)' && building.yearBuilt < 1970) return false;
      }

      // Stories
      if (selectedStories !== 'All') {
        if (!building.stories) return false;
        if (selectedStories === '1 - 4 Stories' && building.stories > 4) return false;
        if (selectedStories === '5 - 6 Stories' && (building.stories < 5 || building.stories > 6)) return false;
        if (selectedStories === '7+ Stories' && building.stories < 7) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'units-desc') return (b.units ?? 0) - (a.units ?? 0);
      if (sortBy === 'year-desc') return (b.yearBuilt ?? 0) - (a.yearBuilt ?? 0);
      if (sortBy === 'violations-asc') return (a.openViolationsCount ?? 0) - (b.openViolationsCount ?? 0);
      return 0;
    });
  }, [
    searchQuery,
    selectedBorough,
    selectedNeighborhood,
    selectedZip,
    selectedMinUnits,
    selectedCondition,
    selectedViolationFilter,
    noClassCViolationsOnly,
    managementContactOnly,
    selectedEra,
    selectedStories,
    sortBy,
  ]);

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#F8F9FA] text-slate-800">
      {/* 1. Compact Header & Search Bar Section */}
      <section className="pt-20 md:pt-24 pb-4 px-4 sm:px-6 md:px-8 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="max-w-[1240px] mx-auto w-full">
          {/* Header Title */}
          <div className="mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Find rent-stabilized buildings in NYC.
            </h1>
            <p className="text-sm sm:text-base text-slate-500 mt-1 max-w-2xl font-normal leading-relaxed">
              Explore buildings, research management, and contact owners directly about availability.
            </p>
          </div>

          {/* Prominent Search Bar */}
          <div className="w-full max-w-3xl">
            <SearchBar
              id="explore-search-bar"
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search an address, neighborhood, ZIP code, or management company"
              size="lg"
            />
          </div>

          {/* Lightweight Filter Controls Row */}
          <div className="mt-4 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar pb-1">
            {/* Desktop Filter Chips */}
            <div className="hidden md:flex flex-wrap items-center gap-2">
              <FilterChip
                label="Borough"
                options={['All', 'Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island']}
                selectedValue={selectedBorough}
                onSelect={(val) => setSelectedBorough(val)}
              />

              <FilterChip
                label="Neighborhood"
                options={['All', 'Astoria', 'Crown Heights', 'Fordham', 'Inwood', 'Jackson Heights', 'Kingsbridge', 'Longwood', 'Morris Heights', 'Mott Haven', 'Norwood', 'Upper West Side', 'West Village', 'Williamsburg']}
                selectedValue={selectedNeighborhood}
                onSelect={(val) => setSelectedNeighborhood(val)}
              />

              <FilterChip
                label="Min units"
                options={['All', '10+ units', '25+ units', '50+ units', '75+ units']}
                selectedValue={selectedMinUnits}
                onSelect={(val) => setSelectedMinUnits(val)}
              />

              <FilterChip
                label="Building health"
                options={['All', 'Good', 'Fair', 'Needs Attention']}
                selectedValue={selectedCondition}
                onSelect={(val) => setSelectedCondition(val)}
              />

              {/* More Filters button */}
              <button
                type="button"
                onClick={() => setIsMoreFiltersOpen(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium tracking-tight transition-all duration-150 cursor-pointer select-none border ${
                  moreFiltersActiveCount > 0
                    ? 'bg-teal-50 text-teal-800 border-teal-300 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600" />
                <span>More filters</span>
                {moreFiltersActiveCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-teal-700 text-white text-[10px] flex items-center justify-center font-medium">
                    {moreFiltersActiveCount}
                  </span>
                )}
              </button>

              {/* Reset filters button when active */}
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset ({activeFiltersCount})</span>
                </button>
              )}
            </div>

            {/* Mobile Filter Trigger Button */}
            <div className="md:hidden flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMobileFilterSheetOpen(true)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                  activeFiltersCount > 0
                    ? 'bg-teal-50 text-teal-800 border-teal-300 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200/90 shadow-2xs'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-teal-700 text-white text-[10px] flex items-center justify-center font-medium">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Desktop Layout Segmented Toggle: [List + Map] vs [List only] */}
            <div className="hidden md:flex items-center gap-0.5 p-0.5 bg-slate-100/90 rounded-full border border-slate-200/80 shrink-0">
              <button
                type="button"
                onClick={() => setDesktopLayout('split')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  desktopLayout === 'split'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5 text-teal-600" />
                <span>List + Map</span>
              </button>
              <button
                type="button"
                onClick={() => setDesktopLayout('list')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  desktopLayout === 'list'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ListIcon className="w-3.5 h-3.5 text-teal-600" />
                <span>List only</span>
              </button>
            </div>

            {/* Mobile Layout Segmented Toggle: [List] vs [Map] */}
            <div className="md:hidden flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-full border border-slate-200/80 shrink-0">
              <button
                type="button"
                onClick={() => setMobileTab('list')}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  mobileTab === 'list'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600'
                }`}
              >
                <ListIcon className="w-3.5 h-3.5 text-teal-600" />
                <span>List</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('map')}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  mobileTab === 'map'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5 text-teal-600" />
                <span>Map</span>
              </button>
            </div>
          </div>

          {/* Active Filter Tags Strip */}
          {activeFiltersCount > 0 && (
            <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-400 mr-1">Active:</span>

              {selectedBorough !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-slate-100/90 text-slate-800 border border-slate-200/80">
                  <span>Borough: <strong className="font-semibold">{selectedBorough}</strong></span>
                  <button onClick={() => setSelectedBorough('All')} className="hover:text-red-600 cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              )}

              {selectedNeighborhood !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-slate-100/90 text-slate-800 border border-slate-200/80">
                  <span>Neighborhood: <strong className="font-semibold">{selectedNeighborhood}</strong></span>
                  <button onClick={() => setSelectedNeighborhood('All')} className="hover:text-red-600 cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              )}

              {selectedZip !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-slate-100/90 text-slate-800 border border-slate-200/80">
                  <span>ZIP: <strong className="font-semibold">{selectedZip}</strong></span>
                  <button onClick={() => setSelectedZip('All')} className="hover:text-red-600 cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              )}

              {selectedMinUnits !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-slate-100/90 text-slate-800 border border-slate-200/80">
                  <span>Min Units: <strong className="font-semibold">{selectedMinUnits}</strong></span>
                  <button onClick={() => setSelectedMinUnits('All')} className="hover:text-red-600 cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              )}

              {selectedCondition !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-slate-100/90 text-slate-800 border border-slate-200/80">
                  <span>Health: <strong className="font-semibold">{selectedCondition}</strong></span>
                  <button onClick={() => setSelectedCondition('All')} className="hover:text-red-600 cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              )}

              {selectedViolationFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-slate-100/90 text-slate-800 border border-slate-200/80">
                  <span>Violations: <strong className="font-semibold">{selectedViolationFilter}</strong></span>
                  <button onClick={() => setSelectedViolationFilter('All')} className="hover:text-red-600 cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              )}

              {noClassCViolationsOnly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                  <ShieldCheck className="w-3 h-3 text-emerald-700" />
                  <span>No Class C Violations</span>
                  <button onClick={() => setNoClassCViolationsOnly(false)} className="hover:text-red-600 cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              )}

              {managementContactOnly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-teal-50 text-teal-800 border border-teal-200/80">
                  <Phone className="w-3 h-3 text-teal-700" />
                  <span>Contact listed</span>
                  <button onClick={() => setManagementContactOnly(false)} className="hover:text-red-600 cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              )}

              {selectedEra !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-slate-100/90 text-slate-800 border border-slate-200/80">
                  <span>Era: <strong className="font-semibold">{selectedEra}</strong></span>
                  <button onClick={() => setSelectedEra('All')} className="hover:text-red-600 cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              )}

              {selectedStories !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-slate-100/90 text-slate-800 border border-slate-200/80">
                  <span>Stories: <strong className="font-semibold">{selectedStories}</strong></span>
                  <button onClick={() => setSelectedStories('All')} className="hover:text-red-600 cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              )}

              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] text-teal-700 hover:underline font-medium ml-1 cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 2. Main Content View Area */}
      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-5 flex flex-col relative">
        {/* Results Metadata Bar */}
        <div className="flex items-center justify-between gap-4 mb-3.5 pb-2 border-b border-slate-200/60">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              {filteredBuildings.length} {filteredBuildings.length === 1 ? 'building' : 'rent-stabilized buildings'} found
            </h2>
            {searchQuery && (
              <span className="text-xs text-slate-500 font-normal">
                matching &quot;{searchQuery}&quot;
              </span>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-slate-200/80 rounded-xl px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer shadow-2xs"
            >
              <option value="default">Default verified</option>
              <option value="units-desc">Most units</option>
              <option value="year-desc">Newest construction</option>
              <option value="violations-asc">Fewest open violations</option>
            </select>
          </div>
        </div>

        {/* Dynamic Desktop vs Mobile Layout Render */}
        {/* DESKTOP SPLIT VIEW: Results List on Left (50%), Map on Right (50%) */}
        {desktopLayout === 'split' && (
          <div className="hidden md:grid md:grid-cols-12 gap-5 items-start flex-1 min-h-[640px]">
            {/* Left Panel: Scrollable Building Cards List */}
            <div className="col-span-12 lg:col-span-6 flex flex-col gap-3.5 max-h-[calc(100vh-240px)] overflow-y-auto pr-1.5 stabili-scroller">
              {filteredBuildings.map((building) => (
                <BuildingCard
                  key={building.id}
                  building={building}
                  isSelected={activeBuildingId === building.id}
                  isSaved={savedBuildingIds.includes(building.id)}
                  onSelect={onSelectBuilding}
                  onToggleSave={onToggleSaveBuilding}
                  onHover={(id) => setActiveBuildingId(id || building.id)}
                />
              ))}

              {filteredBuildings.length === 0 && (
                <EmptyState
                  icon={<Building2 className="w-8 h-8" />}
                  title="No rent-stabilized buildings found"
                  description="No buildings matched your active search or filter criteria. Try adjusting or resetting your filters."
                  actionLabel="Reset all filters"
                  onAction={handleResetFilters}
                  className="my-4"
                />
              )}
            </div>

            {/* Right Panel: Sticky Interactive Map */}
            <div className="col-span-12 lg:col-span-6 sticky top-20 h-[calc(100vh-240px)] min-h-[480px]">
              <ExploreMap
                buildings={filteredBuildings}
                activeBuildingId={activeBuildingId}
                onSelectBuilding={onSelectBuilding}
                onHoverBuilding={(id) => setActiveBuildingId(id)}
              />
            </div>
          </div>
        )}

        {/* DESKTOP LIST-ONLY VIEW */}
        {desktopLayout === 'list' && (
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBuildings.map((building) => (
              <BuildingCard
                key={building.id}
                building={building}
                isSelected={activeBuildingId === building.id}
                isSaved={savedBuildingIds.includes(building.id)}
                onSelect={onSelectBuilding}
                onToggleSave={onToggleSaveBuilding}
                onHover={(id) => setActiveBuildingId(id || building.id)}
              />
            ))}

            {filteredBuildings.length === 0 && (
              <div className="col-span-full">
                <EmptyState
                  icon={<Building2 className="w-9 h-9" />}
                  title="No rent-stabilized buildings found"
                  description="Try clearing your search term or broadening the borough and building size filters."
                  actionLabel="Reset all filters"
                  onAction={handleResetFilters}
                  className="my-4"
                />
              </div>
            )}
          </div>
        )}

        {/* MOBILE VIEW */}
        <div className="md:hidden flex-1 flex flex-col">
          {mobileTab === 'list' && (
            <div className="flex flex-col gap-3 pb-20">
              {filteredBuildings.map((building) => (
                <BuildingCard
                  key={building.id}
                  building={building}
                  isSelected={activeBuildingId === building.id}
                  isSaved={savedBuildingIds.includes(building.id)}
                  onSelect={onSelectBuilding}
                  onToggleSave={onToggleSaveBuilding}
                />
              ))}

              {filteredBuildings.length === 0 && (
                <EmptyState
                  icon={<Building2 className="w-8 h-8" />}
                  title="No rent-stabilized buildings found"
                  description="Try broadening your filter criteria."
                  actionLabel="Reset all filters"
                  onAction={handleResetFilters}
                  className="my-4"
                />
              )}
            </div>
          )}

          {mobileTab === 'map' && (
            <div className="h-[calc(100vh-220px)] min-h-[420px] pb-14">
              <ExploreMap
                buildings={filteredBuildings}
                activeBuildingId={activeBuildingId}
                onSelectBuilding={onSelectBuilding}
              />
            </div>
          )}

          {/* Floating quick Map/List switch button on mobile */}
          <div className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-30">
            <button
              type="button"
              onClick={() => setMobileTab(mobileTab === 'list' ? 'map' : 'list')}
              className="px-4 py-2 rounded-full bg-slate-900/90 backdrop-blur-md text-white font-medium text-xs shadow-lg flex items-center gap-1.5 border border-slate-800 active:scale-98 transition-all cursor-pointer"
            >
              {mobileTab === 'list' ? (
                <>
                  <MapIcon className="w-3.5 h-3.5 text-teal-400" />
                  <span>Show Map</span>
                </>
              ) : (
                <>
                  <ListIcon className="w-3.5 h-3.5 text-teal-400" />
                  <span>Show List ({filteredBuildings.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Mobile Filter Sheet Component */}
      <MobileFilterSheet
        isOpen={isMobileFilterSheetOpen}
        onClose={() => setIsMobileFilterSheetOpen(false)}
        selectedBorough={selectedBorough}
        onSelectBorough={(b) => setSelectedBorough(b)}
        selectedNeighborhood={selectedNeighborhood}
        onSelectNeighborhood={(n) => setSelectedNeighborhood(n)}
        selectedZip={selectedZip}
        onSelectZip={(z) => setSelectedZip(z)}
        selectedMinUnits={selectedMinUnits}
        onSelectMinUnits={(u) => setSelectedMinUnits(u)}
        selectedCondition={selectedCondition}
        onSelectCondition={(c) => setSelectedCondition(c)}
        selectedViolationFilter={selectedViolationFilter}
        onSelectViolationFilter={(v) => setSelectedViolationFilter(v)}
        noClassCViolationsOnly={noClassCViolationsOnly}
        onToggleNoClassC={(val) => setNoClassCViolationsOnly(val)}
        managementContactOnly={managementContactOnly}
        onToggleManagementContact={(val) => setManagementContactOnly(val)}
        selectedEra={selectedEra}
        onSelectEra={(e) => setSelectedEra(e)}
        selectedStories={selectedStories}
        onSelectStories={(s) => setSelectedStories(s)}
        onResetFilters={handleResetFilters}
        totalResultsCount={filteredBuildings.length}
      />

      {/* Desktop More Filters Modal */}
      <MoreFiltersModal
        isOpen={isMoreFiltersOpen}
        onClose={() => setIsMoreFiltersOpen(false)}
        selectedZip={selectedZip}
        onSelectZip={(z) => setSelectedZip(z)}
        selectedMinUnits={selectedMinUnits}
        onSelectMinUnits={(u) => setSelectedMinUnits(u)}
        selectedViolationFilter={selectedViolationFilter}
        onSelectViolationFilter={(v) => setSelectedViolationFilter(v)}
        noClassCViolationsOnly={noClassCViolationsOnly}
        onToggleNoClassC={(val) => setNoClassCViolationsOnly(val)}
        managementContactOnly={managementContactOnly}
        onToggleManagementContact={(val) => setManagementContactOnly(val)}
        selectedEra={selectedEra}
        onSelectEra={(e) => setSelectedEra(e)}
        selectedStories={selectedStories}
        onSelectStories={(s) => setSelectedStories(s)}
        onReset={handleResetMoreFilters}
        activeCount={moreFiltersActiveCount}
      />
    </div>
  );
};
