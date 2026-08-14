import React, { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import type { BuildingRecord } from '../../types';
import { buildingMarkerIcon, hasValidCoordinates, OSM_ATTRIBUTION, OSM_TILE_URL } from './leaflet';

interface BuildingLocationMapProps {
  building: BuildingRecord;
}

export const BuildingLocationMap: React.FC<BuildingLocationMapProps> = React.memo(({ building }) => {
  const markerIcon = useMemo(() => buildingMarkerIcon(true), []);

  if (!hasValidCoordinates(building)) {
    return (
      <div className="flex min-h-56 items-center justify-center rounded-2xl bg-slate-50 px-6 text-center" role="status">
        <div className="max-w-sm">
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-2xs">
            <MapPin className="h-5 w-5" aria-hidden="true" />
          </span>
          <h3 className="mt-3 text-sm font-semibold text-slate-900">Map location unavailable</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">This generated record does not include valid latitude and longitude coordinates.</p>
        </div>
      </div>
    );
  }

  const position: [number, number] = [building.latitude, building.longitude];

  return (
    <div className="stabili-leaflet-frame h-64 sm:h-80">
      <MapContainer center={position} zoom={16} scrollWheelZoom={false} className="h-full w-full" aria-label={`Map showing ${building.address}`}>
        <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} />
        <Marker position={position} icon={markerIcon}>
          <Popup>
            <strong className="block text-sm text-slate-900">{building.address}</strong>
            <span className="mt-0.5 block text-xs text-slate-500">{building.borough}{building.zipCode !== 'Unavailable' ? ` · ${building.zipCode}` : ''}</span>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
});

BuildingLocationMap.displayName = 'BuildingLocationMap';
