import React, { useState } from 'react';
import { Search, Menu, X, Bookmark } from 'lucide-react';
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
  savedCount = 3,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const navItems: { label: string; route: Route; badge?: number }[] = [
    { label: 'Explore', route: 'explore' },
    { label: 'Saved', route: 'saved', badge: savedCount },
    { label: 'About', route: 'about' },
  ];

  return (
    <header className="fixed top-0 left-0 w-full h-16 flex items-center justify-between px-4 sm:px-6 md:px-8 bg-white/80 backdrop-blur-xl border-b border-slate-200/70 z-50 transition-all">
      <div className="max-w-[1200px] w-full mx-auto flex items-center justify-between">
        {/* Brand / Logo + Navigation */}
        <div className="flex items-center gap-8 md:gap-10">
          <button
            onClick={() => onNavigate('explore')}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30 rounded-lg cursor-pointer transition-opacity hover:opacity-85"
          >
            <StabiliLogo size="md" />
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navItems.map((item) => {
              const isActive = currentRoute === item.route;
              return (
                <button
                  key={item.route}
                  onClick={() => onNavigate(item.route)}
                  className={`relative py-1.5 px-2.5 rounded-lg transition-colors duration-150 cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'text-teal-700 bg-teal-50/70 font-semibold'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isActive ? 'bg-teal-600 text-white' : 'bg-slate-200/80 text-slate-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Trailing Actions */}
        <div className="flex items-center gap-2.5">
          {/* Quick Search Action Bar */}
          <div
            onClick={onOpenSearch}
            className="relative hidden sm:flex items-center cursor-pointer group"
          >
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-teal-600 transition-colors">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              readOnly
              placeholder="Quick search..."
              className="pl-8.5 pr-8 py-1.5 bg-slate-100/80 hover:bg-slate-200/60 border border-transparent hover:border-slate-200/70 rounded-full text-xs text-slate-800 placeholder:text-slate-400 w-48 md:w-56 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-white/90 px-1.5 py-0.5 rounded border border-slate-200/80">
              ⌘K
            </span>
          </div>

          {/* Mobile Search Icon Button */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="sm:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            aria-label="Search"
          >
            <Search className="w-4.5 h-4.5 text-slate-600" />
          </button>

          {/* Account/Profile Avatar Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200/90 flex items-center justify-center text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-200/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30 shadow-2xs"
              aria-label="Account profile"
            >
              JD
            </button>

            {/* Profile Dropdown Drawer */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200/90 rounded-2xl p-3 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-semibold text-xs border border-teal-100">
                    JD
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Jane Doe</p>
                    <p className="text-[11px] text-slate-500">NYC Renter Member</p>
                  </div>
                </div>
                <div className="py-1.5 space-y-0.5">
                  <button
                    onClick={() => {
                      onNavigate('saved');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl text-left transition-colors cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-teal-600" />
                    <span>Saved Buildings ({savedCount})</span>
                  </button>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 block px-1">
                    Stabili NYC • Public Housing Registry
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-slate-200/90 px-5 py-3 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-150">
          {navItems.map((item) => {
            const isActive = currentRoute === item.route;
            return (
              <button
                key={item.route}
                onClick={() => {
                  onNavigate(item.route);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-left text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-50 text-teal-800 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-600 text-white font-medium">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
