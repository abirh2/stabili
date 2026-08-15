import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import type { BuildingRecord } from '../../types';
import { buildingMarkerIcon, hasValidCoordinates } from './leaflet';
import { StabiliMap, StabiliMapUnavailable } from './StabiliMap';

interface BuildingLocationMapProps {
  building: BuildingRecord;
}

export const BuildingLocationMap: React.FC<BuildingLocationMapProps> = React.memo(({ building }) => {
  const markerIcon = useMemo(() => buildingMarkerIcon(true), []);

  if (!hasValidCoordinates(building)) {
    return (
      <StabiliMapUnavailable
        className="h-64 sm:h-80"
        description="This generated record does not include valid latitude and longitude coordinates."
      />
    );
  }

  const position: [number, number] = [building.latitude, building.longitude];

  return (
    <StabiliMap center={position} zoom={16} className="h-64 sm:h-80" ariaLabel={`Map showing ${building.address}`}>
        <Marker position={position} icon={markerIcon}>
          <Popup>
            <strong className="block text-sm text-slate-900">{building.address}</strong>
            <span className="mt-0.5 block text-xs text-slate-500">{building.borough}{building.zipCode !== 'Unavailable' ? ` · ${building.zipCode}` : ''}</span>
          </Popup>
        </Marker>
    </StabiliMap>
  );
});

BuildingLocationMap.displayName = 'BuildingLocationMap';
