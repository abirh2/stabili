import React, { useState } from 'react';
import { 
  ShieldCheck, 
  MapPin, 
  Plus, 
  Minus, 
  Crosshair, 
  ArrowRight,
  X
} from 'lucide-react';
import { BuildingRecord } from '../../types';

interface ExploreMapProps {
  buildings: BuildingRecord[];
  activeBuildingId?: string | null;
  onSelectBuilding: (id: string) => void;
  onHoverBuilding?: (id: string | null) => void;
}

// Coordinates mapping for realistic NYC visual layout on relative SVG/HTML grid
const BUILDING_MAP_COORDS: Record<string, { x: number; y: number; label: string }> = {
  '3151-perry-ave': { x: 62, y: 16, label: 'Norwood' },
  '450-e-148th-st': { x: 58, y: 30, label: 'Mott Haven' },
  '250-sherman-ave': { x: 38, y: 22, label: 'Inwood' },
  '342-w-85th-st': { x: 36, y: 45, label: 'Upper West Side' },
  '84-perry-st': { x: 34, y: 64, label: 'West Village' },
  '28-15-34th-st': { x: 64, y: 46, label: 'Astoria' },
  '32-20-89th-st': { x: 78, y: 52, label: 'Jackson Heights' },
  '120-n-7th-st': { x: 48, y: 65, label: 'Williamsburg' },
  '1200-pacific-st': { x: 54, y: 76, label: 'Crown Heights' },
};

export const ExploreMap: React.FC<ExploreMapProps> = ({
  buildings,
  activeBuildingId,
  onSelectBuilding,
  onHoverBuilding,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activePopupId, setActivePopupId] = useState<string | null>(null);

  const activeBuilding = buildings.find(
    (b) => b.id === (activePopupId || activeBuildingId)
  );

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.2, 1.6));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.2, 0.8));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div className="relative w-full h-full min-h-[460px] bg-[#F4F5F7] rounded-2xl border border-slate-200/80 overflow-hidden select-none flex flex-col justify-between">
      {/* Visual Map Canvas Grid Background */}
      <div 
        className="absolute inset-0 transition-transform duration-300 ease-out"
        style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
      >
        {/* SVG Stylized NYC Geographic Waterways & Landmass Outline */}
        <svg 
          className="w-full h-full opacity-50 pointer-events-none" 
          viewBox="0 0 1000 1000" 
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="0.8" />
            </pattern>
          </defs>

          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Hudson River & East River Waterways */}
          <path
            d="M 280,0 C 270,250 290,400 300,550 C 310,700 240,850 200,1000"
            fill="none"
            stroke="#BAE6FD"
            strokeWidth="32"
            strokeLinecap="round"
          />
          {/* East River */}
          <path
            d="M 460,250 C 440,380 430,500 360,620 C 310,710 320,850 330,1000"
            fill="none"
            stroke="#BAE6FD"
            strokeWidth="26"
            strokeLinecap="round"
          />
          {/* Harlem River */}
          <path
            d="M 460,250 C 400,220 340,240 280,260"
            fill="none"
            stroke="#BAE6FD"
            strokeWidth="18"
            strokeLinecap="round"
          />

          {/* Major NYC Avenue/Street Grid Guidelines */}
          <line x1="320" y1="280" x2="350" y2="700" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="6 4" />
          <line x1="360" y1="300" x2="390" y2="720" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="6 4" />
          <line x1="260" y1="400" x2="450" y2="400" stroke="#CBD5E1" strokeWidth="1.2" />
          <line x1="260" y1="520" x2="480" y2="520" stroke="#CBD5E1" strokeWidth="1.2" />
          <line x1="450" y1="480" x2="850" y2="480" stroke="#CBD5E1" strokeWidth="1.5" />
          <line x1="420" y1="680" x2="800" y2="750" stroke="#CBD5E1" strokeWidth="1.5" />

          {/* Borough Watermark Typographic Labels */}
          <text x="600" y="200" fill="#94A3B8" fontSize="24" fontWeight="600" letterSpacing="6" opacity="0.4">
            THE BRONX
          </text>
          <text x="240" y="490" fill="#94A3B8" fontSize="24" fontWeight="600" letterSpacing="6" opacity="0.4">
            MANHATTAN
          </text>
          <text x="680" y="440" fill="#94A3B8" fontSize="24" fontWeight="600" letterSpacing="6" opacity="0.4">
            QUEENS
          </text>
          <text x="560" y="780" fill="#94A3B8" fontSize="24" fontWeight="600" letterSpacing="6" opacity="0.4">
            BROOKLYN
          </text>
        </svg>

        {/* Building Map Pins */}
        <div className="absolute inset-0">
          {buildings.map((building) => {
            const coords = BUILDING_MAP_COORDS[building.id] || { x: 50, y: 50, label: building.neighborhood };
            const isSelected = activeBuildingId === building.id;
            const isPopupActive = activePopupId === building.id;

            return (
              <div
                key={building.id}
                style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
                onClick={() => {
                  setActivePopupId(building.id);
                  onSelectBuilding(building.id);
                }}
                onMouseEnter={() => {
                  if (onHoverBuilding) onHoverBuilding(building.id);
                }}
                onMouseLeave={() => {
                  if (onHoverBuilding) onHoverBuilding(null);
                }}
              >
                <div
                  className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 shadow-xs ${
                    isSelected || isPopupActive
                      ? 'bg-teal-700 text-white scale-105 ring-2 ring-teal-500/30'
                      : 'bg-white text-slate-800 border border-slate-200/90 hover:border-teal-600 hover:text-teal-800 hover:scale-102'
                  }`}
                >
                  <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${isSelected || isPopupActive ? 'text-teal-200' : 'text-emerald-700'}`} />
                  <span className="whitespace-nowrap">{building.address.split(' ')[0]} {building.address.split(' ')[1]}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected || isPopupActive ? 'bg-teal-800 text-teal-100' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {building.units}u
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Map Action Bar */}
      <div className="relative z-30 p-3 sm:p-4 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200/80 shadow-xs text-xs font-medium text-slate-700">
          <MapPin className="w-3.5 h-3.5 text-teal-600" />
          <span>NYC Stabilized Map</span>
          <span className="bg-teal-50 text-teal-800 text-[10px] font-semibold px-2 py-0.2 rounded-full border border-teal-100">
            {buildings.length} plotted
          </span>
        </div>

        {/* Map Zoom Controls */}
        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md p-1 rounded-xl border border-slate-200/80 shadow-xs">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Zoom in"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Zoom out"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Recenter NYC map"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Floating Interactive Card / Legend */}
      <div className="relative z-30 p-3 sm:p-4 flex flex-col md:flex-row items-end justify-between gap-3 pointer-events-auto">
        {/* Floating Building Preview Card when pin clicked */}
        {activeBuilding ? (
          <div className="w-full max-w-sm bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-md animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                  {activeBuilding.neighborhood} · {activeBuilding.borough}
                </span>
                <h4 className="text-sm font-semibold text-slate-900 mt-0.5">
                  {activeBuilding.address}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setActivePopupId(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                aria-label="Close preview"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2 mt-2 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1 font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 text-[11px]">
                <ShieldCheck className="w-3 h-3 text-emerald-700" /> Stabilized
              </span>
              <span>{activeBuilding.units} units</span>
              <span>•</span>
              <span>Built {activeBuilding.yearBuilt}</span>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 truncate max-w-[170px]">
                {activeBuilding.managingAgent}
              </span>
              <button
                type="button"
                onClick={() => onSelectBuilding(activeBuilding.id)}
                className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-900 cursor-pointer"
              >
                <span>View</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          <div className="hidden sm:block text-xs text-slate-500 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-xs">
            Click any pin on the NYC map to preview building details
          </div>
        )}

        {/* Map Legend */}
        <div className="bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200/80 shadow-xs text-xs space-y-0.5 self-end">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span className="text-slate-700 font-medium">Rent-stabilized record</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <span>{buildings.length} verified buildings shown</span>
          </div>
        </div>
      </div>
    </div>
  );
};

