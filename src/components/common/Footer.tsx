import React from 'react';
import { StabiliLogo } from './StabiliLogo';
import { Route } from '../../types';

interface FooterProps {
  onNavigate?: (route: Route) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-[#F8F9FA] border-t border-slate-200/80 py-10 sm:py-12 px-4 sm:px-6 md:px-8 mt-auto">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Brand */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <StabiliLogo size="sm" showText={true} />
          <p className="text-xs text-slate-500 mt-1">
            Empowering NYC renters with official public housing records and registry data.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-medium text-slate-500">
          <button
            onClick={() => onNavigate && onNavigate('about')}
            className="hover:text-teal-700 transition-colors cursor-pointer"
          >
            Data Sources
          </button>
          <button
            onClick={() => onNavigate && onNavigate('about')}
            className="hover:text-teal-700 transition-colors cursor-pointer"
          >
            About & Methodology
          </button>
          <a
            href="https://hpd.nyc.gov"
            target="_blank"
            rel="noreferrer"
            className="hover:text-teal-700 transition-colors"
          >
            NYC HPD Records ↗
          </a>
          <a
            href="https://hcr.ny.gov"
            target="_blank"
            rel="noreferrer"
            className="hover:text-teal-700 transition-colors"
          >
            NYS DHCR ↗
          </a>
        </div>

        {/* Copyright */}
        <div className="text-xs text-slate-500 text-center md:text-right">
          <p>© {new Date().getFullYear()} Stabili NYC.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Public housing registry transparency portal.
          </p>
        </div>
      </div>
    </footer>
  );
};
