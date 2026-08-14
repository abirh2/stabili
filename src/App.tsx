/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Route } from './types';
import { TopNavBar } from './components/common/TopNavBar';
import { Footer } from './components/common/Footer';
import { QuickSearchModal } from './components/common/QuickSearchModal';
import { ExplorePage } from './pages/ExplorePage';
import { BuildingDetailsPage } from './pages/BuildingDetailsPage';
import { ManagementProfilePage } from './pages/ManagementProfilePage';
import { SavedPage } from './pages/SavedPage';
import { AboutPage } from './pages/AboutPage';
import { locationHash, navigateTo, parseHash, replaceHash, type AppLocation } from './routing';

export default function App() {
  const [location, setLocation] = useState<AppLocation>(() => parseHash(window.location.hash));
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [savedBuildingIds, setSavedBuildingIds] = useState<string[]>(() => {
    try {
      const stored = window.localStorage.getItem('stabili.savedBuildingIds');
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const syncLocation = () => {
      const nextLocation = parseHash(window.location.hash);
      if (window.location.hash !== locationHash(nextLocation)) replaceHash(nextLocation);
      setLocation(nextLocation);
    };

    if (!window.location.hash) replaceHash(location);
    window.addEventListener('hashchange', syncLocation);
    return () => window.removeEventListener('hashchange', syncLocation);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setIsSearchOpen(false);
  }, [location]);

  useEffect(() => {
    try {
      window.localStorage.setItem('stabili.savedBuildingIds', JSON.stringify(savedBuildingIds));
    } catch {
      // Storage can be unavailable in privacy-restricted browser contexts.
    }
  }, [savedBuildingIds]);

  useEffect(() => {
    const handleQuickSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsSearchOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', handleQuickSearch);
    return () => window.removeEventListener('keydown', handleQuickSearch);
  }, []);

  const handleNavigate = (route: Route) => {
    navigateTo({ route });
  };

  const handleSelectBuilding = (id: string) => {
    navigateTo({ route: 'building-details', buildingId: id });
  };

  const handleSelectManagement = (id: string) => {
    navigateTo({ route: 'management-profile', managementId: id });
  };

  const handleToggleSaveBuilding = (id: string) => {
    setSavedBuildingIds((prev) =>
      prev.includes(id) ? prev.filter((bId) => bId !== id) : [...prev, id]
    );
  };

  return (
    <div className="surface-base text-primary min-h-screen flex flex-col font-sans">
      {/* Universal Sticky Frosted Navigation Bar */}
      <TopNavBar
        currentRoute={location.route}
        onNavigate={handleNavigate}
        onOpenSearch={() => setIsSearchOpen(true)}
        savedCount={savedBuildingIds.length}
      />

      {/* Main Content Area Routing */}
      <div className="flex-1">
        {location.route === 'explore' && (
          <ExplorePage
            onSelectBuilding={handleSelectBuilding}
            onSelectManagement={handleSelectManagement}
            onNavigate={handleNavigate}
            savedBuildingIds={savedBuildingIds}
            onToggleSaveBuilding={handleToggleSaveBuilding}
          />
        )}

        {location.route === 'building-details' && location.buildingId && (
          <BuildingDetailsPage
            buildingId={location.buildingId}
            onSelectBuilding={handleSelectBuilding}
            onSelectManagement={handleSelectManagement}
            onNavigate={handleNavigate}
            isSaved={savedBuildingIds.includes(location.buildingId)}
            onToggleSave={() => handleToggleSaveBuilding(location.buildingId!)}
          />
        )}

        {location.route === 'management-profile' && location.managementId && (
          <ManagementProfilePage
            managementId={location.managementId}
            onSelectBuilding={handleSelectBuilding}
            onNavigate={handleNavigate}
            savedBuildingIds={savedBuildingIds}
            onToggleSaveBuilding={handleToggleSaveBuilding}
          />
        )}

        {location.route === 'saved' && (
          <SavedPage
            savedBuildingIds={savedBuildingIds}
            onToggleSaveBuilding={handleToggleSaveBuilding}
            onSelectBuilding={handleSelectBuilding}
            onSelectManagement={handleSelectManagement}
            onNavigate={handleNavigate}
          />
        )}

        {location.route === 'about' && (
          <AboutPage onNavigate={handleNavigate} />
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
