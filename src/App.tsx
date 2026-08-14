/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Route } from './types';
import { TopNavBar } from './components/common/TopNavBar';
import { Footer } from './components/common/Footer';
import { QuickSearchModal } from './components/common/QuickSearchModal';
import { ExplorePage } from './pages/ExplorePage';
import { BuildingDetailsPage } from './pages/BuildingDetailsPage';
import { ManagementProfilePage } from './pages/ManagementProfilePage';
import { SavedPage } from './pages/SavedPage';
import { AboutPage } from './pages/AboutPage';
import { DesignSystemShowcase } from './pages/DesignSystemShowcase';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<Route>('explore');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('3151-perry-ave');
  const [selectedManagementId, setSelectedManagementId] = useState<string>('example-mgmt');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [savedBuildingIds, setSavedBuildingIds] = useState<string[]>([
    '3151-perry-ave',
    '28-15-34th-st',
    '32-20-89th-st',
  ]);

  const handleNavigate = (route: Route) => {
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectBuilding = (id: string) => {
    setSelectedBuildingId(id);
    setCurrentRoute('building-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectManagement = (id: string) => {
    setSelectedManagementId(id);
    setCurrentRoute('management-profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleSaveBuilding = (id: string) => {
    setSavedBuildingIds((prev) =>
      prev.includes(id) ? prev.filter((bId) => bId !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-slate-800 font-sans">
      {/* Universal Sticky Frosted Navigation Bar */}
      <TopNavBar
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        onOpenSearch={() => setIsSearchOpen(true)}
        savedCount={savedBuildingIds.length}
      />

      {/* Main Content Area Routing */}
      <div className="flex-1">
        {currentRoute === 'explore' && (
          <ExplorePage
            onSelectBuilding={handleSelectBuilding}
            onSelectManagement={handleSelectManagement}
            onNavigate={handleNavigate}
            savedBuildingIds={savedBuildingIds}
            onToggleSaveBuilding={handleToggleSaveBuilding}
          />
        )}

        {currentRoute === 'building-details' && (
          <BuildingDetailsPage
            buildingId={selectedBuildingId}
            onSelectManagement={handleSelectManagement}
            onNavigate={handleNavigate}
            isSaved={savedBuildingIds.includes(selectedBuildingId)}
            onToggleSave={() => handleToggleSaveBuilding(selectedBuildingId)}
          />
        )}

        {currentRoute === 'management-profile' && (
          <ManagementProfilePage
            managementId={selectedManagementId}
            onSelectBuilding={handleSelectBuilding}
            onNavigate={handleNavigate}
            savedBuildingIds={savedBuildingIds}
            onToggleSaveBuilding={handleToggleSaveBuilding}
          />
        )}

        {currentRoute === 'saved' && (
          <SavedPage
            savedBuildingIds={savedBuildingIds}
            onToggleSaveBuilding={handleToggleSaveBuilding}
            onSelectBuilding={handleSelectBuilding}
            onSelectManagement={handleSelectManagement}
            onNavigate={handleNavigate}
          />
        )}

        {currentRoute === 'about' && (
          <AboutPage onNavigate={handleNavigate} />
        )}

        {currentRoute === 'design-system' && (
          <DesignSystemShowcase onNavigate={handleNavigate} />
        )}
      </div>

      {/* Universal Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Global Quick Search Modal (Command+K or Search Icon) */}
      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectBuilding={handleSelectBuilding}
        onSelectManagement={handleSelectManagement}
        onNavigate={handleNavigate}
      />
    </div>
  );
}

