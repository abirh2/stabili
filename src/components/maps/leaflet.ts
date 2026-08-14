import { divIcon } from 'leaflet';
import type { BuildingRecord } from '../../types';

export const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
export const EXPLORE_TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
export const EXPLORE_TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

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
    iconSize: [44, 44],
    iconAnchor: [22, 40],
    popupAnchor: [0, -36],
  });
}
