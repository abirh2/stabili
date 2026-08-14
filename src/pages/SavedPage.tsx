import React, { useState } from 'react';
import { SAMPLE_BUILDINGS, ALL_SAMPLE_MANAGEMENT, SAMPLE_MANAGEMENT } from '../data/sampleData';
import { BuildingCard } from '../components/explore/BuildingCard';
import { PageContainer, EmptyState, ManagementCard } from '../components/common';
import { Route, ManagementCompany } from '../types';
import { Building2, Briefcase } from 'lucide-react';

interface SavedPageProps {
  savedBuildingIds: string[];
  onToggleSaveBuilding: (id: string) => void;
  onSelectBuilding: (id: string) => void;
  onSelectManagement: (id: string) => void;
  onNavigate: (route: Route) => void;
}

// Initial simulated saved management IDs
const INITIAL_SAVED_MANAGEMENT_IDS = ['example-mgmt', 'heritage-mgmt'];

export const SavedPage: React.FC<SavedPageProps> = ({
  savedBuildingIds,
  onToggleSaveBuilding,
  onSelectBuilding,
  onSelectManagement,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'buildings' | 'management'>('buildings');
  const [savedManagementIds, setSavedManagementIds] = useState<string[]>(INITIAL_SAVED_MANAGEMENT_IDS);

  // Filter saved buildings from sample data
  const savedBuildings = SAMPLE_BUILDINGS.filter((b) => savedBuildingIds.includes(b.id));

  // Filter saved management companies from sample data
  const savedManagementCompanies: ManagementCompany[] = savedManagementIds
    .map((id) => ALL_SAMPLE_MANAGEMENT[id] || (id === SAMPLE_MANAGEMENT.id ? SAMPLE_MANAGEMENT : null))
    .filter((m): m is ManagementCompany => m !== null);

  const handleToggleSaveManagement = (id: string) => {
    setSavedManagementIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  return (
    <PageContainer maxWidth="1200" id="saved-page-container">
      {/* Minimal Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
          Saved
        </h1>
        <p className="text-sm text-slate-500 mt-1 font-normal">
          Review saved rent-stabilized buildings and property management entities.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 border-b border-slate-200/80 mb-6 pb-px">
        <button
          id="saved-tab-buildings"
          type="button"
          onClick={() => setActiveTab('buildings')}
          className={`pb-2.5 px-3.5 text-xs sm:text-sm font-medium transition-all relative cursor-pointer ${
            activeTab === 'buildings'
              ? 'text-teal-800 font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Buildings ({savedBuildings.length})</span>
          {activeTab === 'buildings' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-teal-700 rounded-full" />
          )}
        </button>

        <button
          id="saved-tab-management"
          type="button"
          onClick={() => setActiveTab('management')}
          className={`pb-2.5 px-3.5 text-xs sm:text-sm font-medium transition-all relative cursor-pointer ${
            activeTab === 'management'
              ? 'text-teal-800 font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Management ({savedManagementCompanies.length})</span>
          {activeTab === 'management' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-teal-700 rounded-full" />
          )}
        </button>
      </div>

      {/* =========================================================================
          TAB 1: BUILDINGS
      ========================================================================= */}
      {activeTab === 'buildings' && (
        <div>
          {savedBuildings.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Cards Grid (2 cols on lg) */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedBuildings.map((building) => (
                  <BuildingCard
                    key={building.id}
                    building={building}
                    isSaved={true}
                    onSelect={onSelectBuilding}
                    onToggleSave={onToggleSaveBuilding}
                  />
                ))}
              </div>

              {/* Saved Portfolio Summary Panel (1 col on lg) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4 sticky top-20">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Saved Portfolio Overview
                  </h3>
                  <span className="text-xs font-medium text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100">
                    {savedBuildings.length} {savedBuildings.length === 1 ? 'Building' : 'Buildings'}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-normal">Total Units Represented:</span>
                    <span className="font-semibold text-slate-900">
                      {savedBuildings.reduce((acc, b) => acc + b.units, 0)} residential
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-normal">Boroughs Covered:</span>
                    <span className="font-semibold text-slate-900">
                      {Array.from(new Set(savedBuildings.map((b) => b.borough))).join(', ')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-normal">Management Entities:</span>
                    <span className="font-semibold text-slate-900">
                      {Array.from(new Set(savedBuildings.map((b) => b.managingAgent))).length} companies
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 leading-relaxed border border-slate-100">
                  <strong>Rent Stabilization Notice:</strong> All saved properties contain registered stabilization records verified against official NYC DHCR data.
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('explore')}
                  className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200/70 text-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer text-center"
                >
                  + Add more buildings from Explore
                </button>
              </div>
            </div>
          ) : (
            <EmptyState
              id="empty-saved-buildings"
              icon={<Building2 className="w-6 h-6" />}
              title="No saved buildings yet"
              description="Save buildings while exploring Stabili so you can compare them later."
              actionLabel="Explore buildings"
              onAction={() => onNavigate('explore')}
            />
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: MANAGEMENT
      ========================================================================= */}
      {activeTab === 'management' && (
        <div>
          {savedManagementCompanies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedManagementCompanies.map((company) => (
                <ManagementCard
                  key={company.id}
                  management={company}
                  isSaved={savedManagementIds.includes(company.id)}
                  onSelect={onSelectManagement}
                  onToggleSave={handleToggleSaveManagement}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              id="empty-saved-management"
              icon={<Briefcase className="w-6 h-6" />}
              title="No saved management companies yet"
              description="Save management companies while exploring Stabili to track landlord portfolios and contact records."
              actionLabel="Explore buildings"
              onAction={() => onNavigate('explore')}
            />
          )}
        </div>
      )}
    </PageContainer>
  );
};
