import React, { useEffect, useState } from 'react';
import { Bookmark, Menu, Search, X } from 'lucide-react';
import { StabiliLogo } from './StabiliLogo';
import { Route } from '../../types';

interface TopNavBarProps {
  currentRoute: Route;
  onNavigate: (route: Route) => void;
  onOpenSearch?: () => void;
  savedCount?: number;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  currentRoute,
  onNavigate,
  onOpenSearch,
  savedCount = 0,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navItems: { label: string; route: Route; badge?: number }[] = [
    { label: 'Explore', route: 'explore' },
    { label: 'Saved', route: 'saved', badge: savedCount },
    { label: 'About', route: 'about' },
  ];

  useEffect(() => setMobileMenuOpen(false), [currentRoute]);
  useEffect(() => {
    const updateScrolled = () => setScrolled(window.scrollY > 8);
    updateScrolled();
    window.addEventListener('scroll', updateScrolled, { passive: true });
    return () => window.removeEventListener('scroll', updateScrolled);
  }, []);
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileMenuOpen]);

  return (
    <header className="navigation-shell fixed inset-x-0 top-0 z-50 h-16 px-4 sm:px-6 md:px-8" data-scrolled={scrolled || mobileMenuOpen ? 'true' : 'false'}>
      <div className="mx-auto flex h-full w-full max-w-[1200px] items-center justify-between">
        <div className="flex items-center gap-8 md:gap-10">
          <button
            type="button"
            onClick={() => onNavigate('explore')}
            className="radius-control cursor-pointer transition-opacity hover:opacity-80"
            aria-label="Go to Explore"
          >
            <StabiliLogo size="md" />
          </button>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
            {navItems.map((item) => {
              const isActive = currentRoute === item.route ||
                (item.route === 'explore' && (currentRoute === 'building-details' || currentRoute === 'management-profile'));
              return (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => onNavigate(item.route)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`st-button st-button--sm ${isActive ? 'st-button--subtle-teal' : 'st-button--ghost'}`}
                >
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`st-badge ${isActive ? 'st-badge--solid' : 'st-badge--neutral'} !px-1.5 !py-0 text-[11px]`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenSearch}
            className="st-button st-button--secondary hidden w-48 justify-start !px-3 sm:inline-flex md:w-56"
            aria-label="Open quick search"
          >
            <Search className="h-4 w-4 text-tertiary" />
            <span className="type-metadata flex-1 text-left">Quick search</span>
            <kbd className="type-caption rounded-md surface-muted px-1.5 py-0.5">⌘K</kbd>
          </button>

          <button
            type="button"
            onClick={onOpenSearch}
            className="st-button st-button--ghost st-button--pill inline-flex !w-11 !p-0 sm:hidden"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('saved')}
            className="st-button st-button--ghost st-button--pill inline-flex !w-11 !p-0 md:hidden"
            aria-label={`Saved buildings${savedCount ? `, ${savedCount}` : ''}`}
            aria-current={currentRoute === 'saved' ? 'page' : undefined}
          >
            <Bookmark className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="st-button st-button--ghost st-button--pill inline-flex !w-11 !p-0 md:hidden"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav id="mobile-navigation" className="material-sheet absolute inset-x-0 top-16 px-4 py-3 md:hidden" aria-label="Mobile navigation">
          <div className="mx-auto max-w-[1200px] space-y-1">
            {navItems.map((item) => {
              const isActive = currentRoute === item.route ||
                (item.route === 'explore' && (currentRoute === 'building-details' || currentRoute === 'management-profile'));
              return (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => onNavigate(item.route)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`st-button w-full justify-between ${isActive ? 'st-button--subtle-teal' : 'st-button--ghost'}`}
                >
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && <span className="st-badge st-badge--neutral">{item.badge}</span>}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
};
