import React, { useEffect, useMemo, useState } from 'react';
import type { LatLngExpression } from 'leaflet';
import { ArrowRight, MapPin, ShieldCheck } from 'lucide-react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import type { BuildingRecord } from '../../types';
import {
  buildingMarkerIcon,
  EXPLORE_TILE_ATTRIBUTION,
  EXPLORE_TILE_URL,
  hasValidCoordinates,
  type MappableBuilding,
} from '../maps/leaflet';

interface ExploreMapProps {
  buildings: BuildingRecord[];
  activeBuildingId?: string | null;
  onSelectBuilding: (id: string) => void;
  onHoverBuilding?: (id: string | null) => void;
}

interface MapViewportProps {
  positions: LatLngExpression[];
}

const NYC_CENTER: LatLngExpression = [40.7128, -74.006];

const MapViewport: React.FC<MapViewportProps> = ({ positions }) => {
  const map = useMap();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => map.invalidateSize());
    if (positions.length === 0) {
      map.setView(NYC_CENTER, 10, { animate: false });
    } else if (positions.length === 1) {
      map.setView(positions[0], 15, { animate: false });
    } else {
      map.fitBounds(positions, { padding: [28, 28], maxZoom: 15, animate: false });
    }
    return () => window.cancelAnimationFrame(frame);
  }, [map, positions]);

  return null;
};

interface BuildingMarkerProps {
  building: MappableBuilding;
  isActive: boolean;
  onActivate: (id: string) => void;
  onOpen: (id: string) => void;
  onHover?: (id: string | null) => void;
}

const BuildingMarker: React.FC<BuildingMarkerProps> = React.memo(({
  building,
  isActive,
  onActivate,
  onOpen,
  onHover,
}) => {
  const icon = useMemo(() => buildingMarkerIcon(isActive), [isActive]);
  const eventHandlers = useMemo(() => ({
    click: () => onActivate(building.id),
    mouseover: () => onHover?.(building.id),
    mouseout: () => onHover?.(null),
  }), [building.id, onActivate, onHover]);

  return (
    <Marker position={[building.latitude, building.longitude]} icon={icon} eventHandlers={eventHandlers}>
      <Popup minWidth={220} maxWidth={280}>
        <div className="min-w-0">
          <span className="type-caption block">{building.neighborhood} · {building.borough}</span>
          <strong className="mt-0.5 block break-words text-sm text-slate-900">{building.address}</strong>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1 font-medium text-emerald-800">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" /> Stabilized
            </span>
            {building.units !== null && building.units !== undefined && <span>{building.units.toLocaleString()} units</span>}
          </div>
          <button
            type="button"
            onClick={() => onOpen(building.id)}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            View building <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      </Popup>
    </Marker>
  );
});

BuildingMarker.displayName = 'BuildingMarker';

export const ExploreMap: React.FC<ExploreMapProps> = React.memo(({
  buildings,
  activeBuildingId,
  onSelectBuilding,
  onHoverBuilding,
}) => {
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const mappableBuildings = useMemo(() => buildings.filter(hasValidCoordinates), [buildings]);
  const positions = useMemo<LatLngExpression[]>(
    () => mappableBuildings.map((building) => [building.latitude, building.longitude]),
    [mappableBuildings],
  );

  useEffect(() => {
    if (selectedBuildingId && !mappableBuildings.some((building) => building.id === selectedBuildingId)) {
      setSelectedBuildingId(null);
    }
  }, [mappableBuildings, selectedBuildingId]);

  return (
    <div className="stabili-leaflet-frame relative flex h-full min-h-[460px] w-full flex-col bg-slate-100">
      <header className="separator flex min-h-14 items-center justify-between gap-3 border-b bg-[var(--st-surface-elevated)] px-4">
        <div className="flex min-w-0 items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          <span className="type-label truncate text-primary">Map results</span>
        </div>
        <span className="type-metadata shrink-0 tabular-nums">{mappableBuildings.length.toLocaleString()} mapped</span>
      </header>
      <MapContainer center={NYC_CENTER} zoom={10} scrollWheelZoom className="min-h-0 w-full flex-1" aria-label="Map of filtered Stabili building records">
        <TileLayer attribution={EXPLORE_TILE_ATTRIBUTION} url={EXPLORE_TILE_URL} maxZoom={20} />
        <MapViewport positions={positions} />
        {mappableBuildings.map((building) => (
          <BuildingMarker
            key={building.id}
            building={building}
            isActive={building.id === (selectedBuildingId ?? activeBuildingId)}
            onActivate={setSelectedBuildingId}
            onOpen={onSelectBuilding}
            onHover={onHoverBuilding}
          />
        ))}
      </MapContainer>

      {mappableBuildings.length === 0 && (
        <div className="pointer-events-none absolute inset-x-4 top-1/2 z-[500] -translate-y-1/2 rounded-2xl bg-white/95 p-5 text-center shadow-sm ring-1 ring-slate-200/80">
          <h3 className="text-sm font-semibold text-slate-900">No mapped buildings in these results</h3>
          <p className="mt-1 text-xs text-slate-500">Records without valid coordinates remain available in the list.</p>
        </div>
      )}
    </div>
  );
});

ExploreMap.displayName = 'ExploreMap';
