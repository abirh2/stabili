import { divIcon } from 'leaflet';
import type { BuildingRecord } from '../../types';

export const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export type MappableBuilding = BuildingRecord & { latitude: number; longitude: number };

export function hasValidCoordinates(building: BuildingRecord): building is MappableBuilding {
  return Number.isFinite(building.latitude)
    && Number.isFinite(building.longitude)
    && building.latitude! >= -90
    && building.latitude! <= 90
    && building.longitude! >= -180
    && building.longitude! <= 180;
}

export function buildingMarkerIcon(isActive = false) {
  return divIcon({
    className: 'stabili-leaflet-marker-shell',
    html: `<span class="stabili-leaflet-marker${isActive ? ' is-active' : ''}" aria-hidden="true"><span></span></span>`,
    iconSize: [30, 38],
    iconAnchor: [15, 36],
    popupAnchor: [0, -32],
  });
}
